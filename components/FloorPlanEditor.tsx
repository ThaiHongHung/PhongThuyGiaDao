import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { FengShuiAnalysis, StarQuality, Point } from '../types';

interface FloorPlanEditorProps {
  imageFile: File | null;
  analysis: FengShuiAnalysis;
  facingDegree: number;
  onUpdateAnalysis: (data: { center?: Point, kitchen?: Point, stoveFacing: number, door?: Point, toilet?: Point, stairs?: Point, compassOffset: number }) => void;
  onImageChange: (file: File) => void;
}

// Trigram mapping corresponding to DIRECTIONS_ORDER [N, NE, E, SE, S, SW, W, NW]
const TRIGRAMS = [
  { name: "Khảm", sub: "Bắc" },
  { name: "Cấn", sub: "Đ.Bắc" },
  { name: "Chấn", sub: "Đông" },
  { name: "Tốn", sub: "Đ.Nam" },
  { name: "Ly", sub: "Nam" },
  { name: "Khôn", sub: "T.Nam" },
  { name: "Đoài", sub: "Tây" },
  { name: "Càn", sub: "T.Bắc" }
];

type EditorMode = 'CENTER' | 'KITCHEN' | 'DOOR' | 'TOILET' | 'STAIRS';

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ imageFile, analysis, facingDegree, onUpdateAnalysis, onImageChange }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Spatial State
  const [centerPct, setCenterPct] = useState<Point | undefined>(undefined);
  const [kitchenPct, setKitchenPct] = useState<Point | undefined>(undefined);
  const [doorPct, setDoorPct] = useState<Point | undefined>(undefined);
  const [toiletPct, setToiletPct] = useState<Point | undefined>(undefined);
  const [stairsPct, setStairsPct] = useState<Point | undefined>(undefined);
  
  const [stoveFacing, setStoveFacing] = useState<number>(0);
  
  // Rotation & Zoom States
  const [imageRotation, setImageRotation] = useState<number>(0); // 0-360
  const [compassOffset, setCompassOffset] = useState<number>(0); // 0-360 manual adjustment
  const [zoom, setZoom] = useState<number>(1); // 0.5 - 3.0
  
  const [mode, setMode] = useState<EditorMode>('CENTER');
  
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Propagate changes to parent for re-analysis
  useEffect(() => {
     if (centerPct) {
         // IMPORTANT: The math logic needs the TOTAL rotation of the overlay relative to the image up/screen up.
         // Visually, the sectors are rotated by (compassOffset + imageRotation).
         // So we pass this sum to the calculator.
         const totalRotation = compassOffset + imageRotation;
         
         onUpdateAnalysis({
             center: centerPct, 
             kitchen: kitchenPct, 
             stoveFacing,
             door: doorPct,
             toilet: toiletPct,
             stairs: stairsPct,
             compassOffset: totalRotation 
         });
     }
  }, [centerPct, kitchenPct, stoveFacing, doorPct, toiletPct, stairsPct, compassOffset, imageRotation]);

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onImageChange(e.target.files[0]);
      }
  };

  // --- Coordinate Transformation Helpers ---

  // Rotate a point (x,y) around (0.5, 0.5) by degrees (Clockwise for Screen Coords)
  const rotatePoint = (x: number, y: number, deg: number) => {
    const rad = deg * Math.PI / 180;
    const cx = 0.5, cy = 0.5;
    const dx = x - cx;
    const dy = y - cy;
    
    // Formula for CW rotation in screen coords (Y down):
    // x' = x cos - y sin
    // y' = x sin + y cos
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    
    return {
        x: dx * cos - dy * sin + cx,
        y: dx * sin + dy * cos + cy
    };
  };

  // 1. Transform click coordinates (Visual) -> Image Coordinates (Logical)
  // We apply the Inverse Rotation (-deg) and Inverse Zoom
  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    // Calculate center of viewport
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    // Mouse position relative to viewport top-left
    const visualXRaw = e.clientX - rect.left;
    const visualYRaw = e.clientY - rect.top;

    // Adjust for Zoom (Un-zoom logic relative to center)
    // visual = (raw - center) / zoom + center
    const adjustedX = (visualXRaw - cx) / zoom + cx;
    const adjustedY = (visualYRaw - cy) / zoom + cy;

    // Normalize to 0..1 relative to container size
    const visualX = adjustedX / rect.width;
    const visualY = adjustedY / rect.height;

    // Map Visual Point back to Logical Point (Inverse of Image Rotation)
    const logicalPoint = rotatePoint(visualX, visualY, -imageRotation);

    if (mode === 'CENTER') setCenterPct(logicalPoint);
    else if (mode === 'KITCHEN') setKitchenPct(logicalPoint);
    else if (mode === 'DOOR') setDoorPct(logicalPoint);
    else if (mode === 'TOILET') setToiletPct(logicalPoint);
    else if (mode === 'STAIRS') setStairsPct(logicalPoint);
  };

  // 2. Transform stored coordinates (Logical) -> Screen Pixels for D3 Rendering
  // Accounts for Image Rotation AND Zoom
  const getScreenCoords = (p: Point, rect: DOMRect) => {
    // 1. Rotate (0..1 space)
    const rotated = rotatePoint(p.x, p.y, imageRotation);
    
    // 2. Map to pixels centered at 0,0 relative to container center
    const dx = (rotated.x - 0.5) * rect.width;
    const dy = (rotated.y - 0.5) * rect.height;
    
    // 3. Apply Zoom (Scale distance from center)
    const dxZ = dx * zoom;
    const dyZ = dy * zoom;
    
    // 4. Map back to container
    return {
        x: rect.width / 2 + dxZ,
        y: rect.height / 2 + dyZ
    };
  }

  // D3 Render Logic for Overlay
  useEffect(() => {
    if (!centerPct || !svgRef.current || !analysis || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    // Calculate pixel center based on current container size
    const rect = containerRef.current.getBoundingClientRect();
    
    const visualCenter = getScreenCoords(centerPct, rect);
    const cx = visualCenter.x;
    const cy = visualCenter.y;

    // Dynamic radius - FIXED relative to screen (container), independent of Zoom
    const maxRadius = Math.min(rect.width, rect.height) / 2 * 0.95;
    const radius = Math.min(320, maxRadius); // Cap at 320px
    const innerRingRadius = radius * 0.55; 

    const data = analysis.sectors;
    
    const pie = d3.pie<typeof data[0]>()
      .value(1)
      .sort(null)
      .startAngle(0)
      .endAngle(2 * Math.PI);

    const g = svg.append("g")
      .attr("transform", `translate(${cx}, ${cy})`);

    // Rotation Logic:
    const rotation = -22.5 + compassOffset + imageRotation;

    // --- Draw Outer Ring (Stars) ---
    const arcOuter = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(innerRingRadius)
      .outerRadius(radius);

    const outerSlices = g.selectAll("path.outer")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("class", "outer")
      .attr("d", arcOuter)
      .attr("fill", d => {
          if (d.data.star.good) return "#d32f2f"; 
          return "#546e7a"; 
      })
      .attr("stroke", "#fff")
      .attr("stroke-width", 2)
      .attr("transform", `rotate(${rotation})`)
      .attr("opacity", 0.45)
      .attr("vector-effect", "non-scaling-stroke"); 

    // --- Draw Inner Ring (Trigrams) ---
    const arcInner = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(40) 
      .outerRadius(innerRingRadius);

    const innerSlices = g.selectAll("path.inner")
      .data(pie(data))
      .enter()
      .append("path")
      .attr("class", "inner")
      .attr("d", arcInner)
      .attr("fill", "#78909c") 
      .attr("stroke", "#fff")
      .attr("stroke-width", 1)
      .attr("transform", `rotate(${rotation})`)
      .attr("opacity", 0.6)
      .attr("vector-effect", "non-scaling-stroke"); 

    // --- Text Labels ---
    const textGroup = g.append("g")
        .attr("transform", `rotate(${rotation})`);

    // 1. Star Names 
    const labelArcOuter = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(innerRingRadius)
      .outerRadius(radius);

    textGroup.selectAll("text.star")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("class", "star")
      .attr("transform", d => {
          const [x, y] = labelArcOuter.centroid(d);
          return `translate(${x}, ${y}) rotate(${-rotation})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text(d => d.data.star.name.toUpperCase())
      .style("pointer-events", "none")
      .style("font-family", "sans-serif")
      .style("font-weight", "900")
      .style("font-size", "11px")
      .style("fill", d => d.data.star.good ? "#b71c1c" : "#263238")
      .style("stroke", "rgba(255, 255, 255, 0.9)")
      .style("stroke-width", "3px")
      .style("stroke-linejoin", "round")
      .style("paint-order", "stroke");

    // 2. Trigram Names
    const labelArcInner = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(40)
      .outerRadius(innerRingRadius);

    textGroup.selectAll("text.trigram")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("class", "trigram")
      .attr("transform", d => {
          const [x, y] = labelArcInner.centroid(d);
          return `translate(${x}, ${y}) rotate(${-rotation})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .style("pointer-events", "none")
      .each(function(d, i) {
          const trigram = TRIGRAMS[i];
          const el = d3.select(this);
          
          el.append("tspan")
            .text(trigram.name.toUpperCase())
            .attr("x", 0)
            .attr("dy", "-0.4em")
            .style("font-weight", "bold")
            .style("font-size", "10px")
            .style("fill", "white")
            .style("stroke", "rgba(0,0,0,0.5)")
            .style("stroke-width", "2px")
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke");

          el.append("tspan")
            .text(trigram.sub)
            .attr("x", 0)
            .attr("dy", "1.2em")
            .style("font-size", "9px")
            .style("fill", "white")
            .style("stroke", "rgba(0,0,0,0.5)")
            .style("stroke-width", "2px")
            .style("stroke-linejoin", "round")
            .style("paint-order", "stroke");
      });

    // 3. Azimuth Degree Labels
    const labelArcAzimuth = d3.arc<d3.PieArcDatum<typeof data[0]>>()
      .innerRadius(radius + 2)
      .outerRadius(radius + 2);

    textGroup.selectAll("text.azimuth")
      .data(pie(data))
      .enter()
      .append("text")
      .attr("class", "azimuth")
      .attr("transform", d => {
          const [x, y] = labelArcAzimuth.centroid(d);
          return `translate(${x}, ${y}) rotate(${-rotation})`;
      })
      .attr("text-anchor", "middle")
      .attr("dy", "0.35em")
      .text((d, i) => `${i * 45}°`)
      .style("font-size", "10px")
      .style("font-weight", "bold")
      .style("fill", "#444")
      .style("pointer-events", "none")
      .style("stroke", "white")
      .style("stroke-width", "3px")
      .style("stroke-linejoin", "round")
      .style("paint-order", "stroke");

    // --- Center Decoration (Kua Name) ---
    g.append("circle")
      .attr("r", 38)
      .attr("fill", "white")
      .attr("stroke", "#ccc")
      .attr("stroke-width", 1);
    
    // Show Kua Name in Center
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "-0.2em")
      .style("font-size", "12px")
      .style("font-weight", "900")
      .style("fill", "#d32f2f")
      .text(analysis.menhQuai.name.toUpperCase());

    g.append("text")
      .attr("text-anchor", "middle")
      .attr("dy", "1em")
      .style("font-size", "9px")
      .style("fill", "#666")
      .text("TÂM NHÀ");

    g.append("circle")
      .attr("r", 3)
      .attr("cy", 0)
      .attr("fill", "#fbbf24") 
      .attr("stroke", "#d32f2f")
      .attr("stroke-width", 1);

    // --- Function to draw marker ---
    const drawMarker = (pct: Point, label: string, color: string, icon: string) => {
        const visual = getScreenCoords(pct, rect);
        const vx = visual.x;
        const vy = visual.y;
        
        const grp = svg.append("g")
            .attr("transform", `translate(${vx}, ${vy})`);
        
        grp.append("circle")
            .attr("r", 14)
            .attr("fill", color)
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))");

        grp.append("text")
            .text(icon)
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "14px");

        grp.append("text")
            .text(label)
            .attr("y", 22)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)");
        
        return grp;
    };

    // --- Markers ---
    if (doorPct) drawMarker(doorPct, "Cửa Chính", "#0ea5e9", "🚪"); // Sky Blue
    if (toiletPct) drawMarker(toiletPct, "Vệ Sinh", "#64748b", "🚽"); // Slate
    if (stairsPct) drawMarker(stairsPct, "Thang", "#8b5cf6", "🪜"); // Violet

    // Kitchen Special Marker (Square)
    if (kitchenPct) {
        const visualKitchen = getScreenCoords(kitchenPct, rect);
        const kx = visualKitchen.x;
        const ky = visualKitchen.y;
        
        const kGroup = svg.append("g")
            .attr("transform", `translate(${kx}, ${ky})`);
        
        kGroup.append("rect")
            .attr("x", -12).attr("y", -12)
            .attr("width", 24).attr("height", 24)
            .attr("rx", 4)
            .attr("fill", "#f97316")
            .attr("stroke", "white")
            .attr("stroke-width", 2)
            .attr("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))");
            
        kGroup.append("text")
            .text("🔥")
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .style("font-size", "14px");
            
        kGroup.append("text")
            .text("Bếp")
            .attr("y", 20)
            .attr("text-anchor", "middle")
            .attr("fill", "white")
            .style("font-size", "10px")
            .style("font-weight", "bold")
            .style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)");
            
        // Arrow for stove facing
        if (stoveFacing !== undefined) {
             const visualStoveDeg = rotation + 22.5 + stoveFacing;
             const rad = (visualStoveDeg - 90) * (Math.PI / 180);
             const arrowLen = 30;
             const dx = Math.cos(rad) * arrowLen;
             const dy = Math.sin(rad) * arrowLen;
             
             kGroup.append("line")
                .attr("x1", 0).attr("y1", 0)
                .attr("x2", dx).attr("y2", dy)
                .attr("stroke", "#f97316")
                .attr("stroke-width", 3)
                .attr("marker-end", "url(#arrowhead)");
        }
    }
    
    // Define Marker for arrow
    const defs = svg.append("defs");
    defs.append("marker")
        .attr("id", "arrowhead")
        .attr("viewBox", "0 -5 10 10")
        .attr("refX", 8)
        .attr("refY", 0)
        .attr("markerWidth", 6)
        .attr("markerHeight", 6)
        .attr("orient", "auto")
        .append("path")
        .attr("d", "M0,-5L10,0L0,5")
        .attr("fill", "#f97316");

  }, [centerPct, kitchenPct, doorPct, toiletPct, stairsPct, analysis, facingDegree, stoveFacing, imageRotation, compassOffset, zoom]);

  if (!imageUrl) return <div className="p-10 border-2 border-dashed border-stone-300 text-center text-stone-500">Vui lòng tải ảnh lên ở bước trước</div>;

  return (
    <div className="flex flex-col gap-4">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 bg-stone-100 p-3 rounded-lg border border-stone-200">
            {/* Top Row: Modes & Image */}
            <div className="flex flex-wrap items-center gap-2">
                 <label className="cursor-pointer px-3 py-2 bg-white hover:bg-stone-50 text-stone-600 rounded text-xs font-bold border border-stone-200 shadow-sm transition-all flex items-center gap-2 whitespace-nowrap shrink-0" title="Thay đổi ảnh mặt bằng">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Thay ảnh
                    <input type="file" accept="image/*" onChange={handleLocalFileChange} className="hidden" />
                </label>

                <div className="hidden sm:block w-px h-6 bg-stone-300 mx-1 shrink-0"></div>

                <div className="flex flex-wrap gap-2">
                    <button 
                        onClick={() => setMode('CENTER')}
                        className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${mode === 'CENTER' ? 'bg-amber-600 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}
                    >
                        📍 Tâm Nhà
                    </button>
                    <button 
                        onClick={() => setMode('DOOR')}
                        className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${mode === 'DOOR' ? 'bg-sky-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}
                    >
                        🚪 Cửa Chính
                    </button>
                    <button 
                        onClick={() => setMode('KITCHEN')}
                        className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${mode === 'KITCHEN' ? 'bg-orange-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}
                    >
                        🔥 Bếp
                    </button>
                    <button 
                        onClick={() => setMode('TOILET')}
                        className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${mode === 'TOILET' ? 'bg-slate-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}
                    >
                        🚽 Vệ Sinh
                    </button>
                    <button 
                        onClick={() => setMode('STAIRS')}
                        className={`px-3 py-2 rounded text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${mode === 'STAIRS' ? 'bg-violet-500 text-white shadow-md' : 'bg-white text-stone-600 hover:bg-stone-50 border border-stone-200'}`}
                    >
                        🪜 Thang
                    </button>
                </div>
            </div>

            <div className="h-px bg-stone-200 w-full my-1"></div>

            {/* Middle Row: Rotation & Zoom Controls */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {/* Image Rotation */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Xoay Ảnh</label>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1 rounded">{imageRotation}°</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="360" 
                        value={imageRotation} 
                        onChange={(e) => setImageRotation(Number(e.target.value))}
                        className="w-full h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-stone-600"
                    />
                </div>

                {/* Compass Rotation */}
                <div className="space-y-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Xoay Bát Quái</label>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1 rounded">{compassOffset}°</span>
                    </div>
                    <input 
                        type="range" 
                        min="0" max="360" 
                        value={compassOffset} 
                        onChange={(e) => setCompassOffset(Number(e.target.value))}
                        className="w-full h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-amber-600"
                    />
                </div>

                {/* Zoom Control */}
                <div className="space-y-1 col-span-2 md:col-span-1">
                    <div className="flex justify-between items-center">
                        <label className="text-[10px] font-bold text-stone-500 uppercase">Zoom</label>
                        <span className="text-[10px] font-mono text-stone-400 bg-stone-50 px-1 rounded">{zoom.toFixed(1)}x</span>
                    </div>
                    <input 
                        type="range" 
                        min="0.5" max="3" step="0.1"
                        value={zoom} 
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full h-1 bg-stone-300 rounded-lg appearance-none cursor-pointer accent-blue-600"
                    />
                </div>
            </div>

            {/* Bottom Row: Kitchen Facing */}
            {kitchenPct && (
                <div className="flex items-center gap-2 pt-2 border-t border-stone-200">
                    <label className="text-[10px] font-bold text-stone-500 uppercase whitespace-nowrap">Hướng Bếp (°):</label>
                    <input 
                        type="number" 
                        value={stoveFacing}
                        onChange={(e) => setStoveFacing(Number(e.target.value))}
                        className="w-full px-2 py-1 bg-white border border-stone-200 rounded text-sm font-bold text-stone-800 focus:outline-none focus:border-amber-400"
                    />
                </div>
            )}
        </div>

        {/* Canvas Area */}
        <div className="relative w-full bg-stone-200 rounded-lg shadow-inner overflow-hidden select-none flex items-center justify-center min-h-[500px]" ref={containerRef}>
            {!centerPct && mode === 'CENTER' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-stone-900/80 text-white px-4 py-2 rounded-full animate-bounce text-sm font-medium shadow-lg backdrop-blur-sm pointer-events-none">
                    📍 Click vào tâm nhà
                </div>
            )}
            
            {/* Zoom Wrapper (ONLY IMAGE) */}
            <div style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'center',
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'absolute',
                top: 0,
                left: 0,
                pointerEvents: 'none' 
            }}>
                {/* Image Container with rotation */}
                <div 
                    className="relative transition-transform duration-100 ease-linear"
                    style={{ 
                        transform: `rotate(${imageRotation}deg)`,
                        maxWidth: '100%',
                        maxHeight: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                    }}
                >
                    <img 
                        src={imageUrl} 
                        alt="Floor Plan" 
                        className="max-w-full h-auto block"
                    />
                </div>
            </div>

            {/* SVG Overlay (NO ZOOM applied to this container, so markers/rings stay constant size) */}
            <svg 
                ref={svgRef}
                className="absolute inset-0 w-full h-full z-20 pointer-events-none"
            />
            
            {/* Click Catcher (Invisible Overlay) covering the whole container area */}
            <div 
                className="absolute inset-0 cursor-crosshair z-30"
                onClick={handleImageClick}
            />
        </div>
        <p className="text-xs text-stone-400 italic text-center">
            Chọn một công cụ trên thanh phía trên và click vào bản vẽ để xác định vị trí.
        </p>
    </div>
  );
};

export default FloorPlanEditor;