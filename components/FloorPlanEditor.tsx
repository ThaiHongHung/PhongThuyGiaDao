import React, { useState, useRef, useEffect } from 'react';
import * as d3 from 'd3';
import { FengShuiAnalysis, StarQuality, Point } from '../types';

interface FloorPlanEditorProps {
  imageFile: File | null;
  analysis: FengShuiAnalysis;
  facingDegree: number;
  onUpdateAnalysis: (data: { 
      center?: Point, 
      kitchen?: Point, 
      stoveFacing: number, 
      door?: Point, 
      toilets?: Point[], 
      wcDoors?: Point[], 
      bedrooms?: Point[], 
      bedroomFacings?: number[], 
      altar?: Point,
      altarFacing: number,
      stairs?: Point, 
      stairsFacing: number, 
      compassOffset: number 
  }) => void;
  onImageChange: (file: File) => void;
}

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

type EditorMode = 'CENTER' | 'KITCHEN' | 'DOOR' | 'TOILET' | 'WC_DOOR' | 'STAIRS' | 'BEDROOM' | 'ALTAR';

// Type for the item being deleted
type DeleteTarget = {
    type: EditorMode;
    index?: number; // For arrays like toilets/bedrooms
    name: string;
} | null;

const FloorPlanEditor: React.FC<FloorPlanEditorProps> = ({ imageFile, analysis, facingDegree, onUpdateAnalysis, onImageChange }) => {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  
  // Spatial State
  const [centerPct, setCenterPct] = useState<Point | undefined>(undefined);
  const [kitchenPct, setKitchenPct] = useState<Point | undefined>(undefined);
  const [doorPct, setDoorPct] = useState<Point | undefined>(undefined);
  const [toiletsPct, setToiletsPct] = useState<Point[]>([]);
  const [wcDoorsPct, setWcDoorsPct] = useState<Point[]>([]); 
  const [bedroomsPct, setBedroomsPct] = useState<Point[]>([]); 
  const [bedroomFacings, setBedroomFacings] = useState<number[]>([]); 
  const [altarPct, setAltarPct] = useState<Point | undefined>(undefined);
  const [stairsPct, setStairsPct] = useState<Point | undefined>(undefined);
  
  const [stoveFacing, setStoveFacing] = useState<number>(0);
  const [altarFacing, setAltarFacing] = useState<number>(0); 
  const [stairsFacing, setStairsFacing] = useState<number>(0); 
  
  // Rotation & Zoom States
  const [imageRotation, setImageRotation] = useState<number>(0); 
  const [compassOffset, setCompassOffset] = useState<number>(0); 
  const [zoom, setZoom] = useState<number>(1); 
  
  const [mode, setMode] = useState<EditorMode>('CENTER');
  
  // Deletion State
  const [pendingDelete, setPendingDelete] = useState<DeleteTarget>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (imageFile) {
      const url = URL.createObjectURL(imageFile);
      setImageUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [imageFile]);

  // Propagate changes
  useEffect(() => {
     if (centerPct) {
         const totalRotation = compassOffset + imageRotation;
         onUpdateAnalysis({
             center: centerPct, 
             kitchen: kitchenPct, 
             stoveFacing,
             door: doorPct,
             toilets: toiletsPct,
             wcDoors: wcDoorsPct,
             bedrooms: bedroomsPct,
             bedroomFacings, 
             altar: altarPct,
             altarFacing,
             stairs: stairsPct,
             stairsFacing,
             compassOffset: totalRotation 
         });
     }
  }, [centerPct, kitchenPct, stoveFacing, doorPct, toiletsPct, wcDoorsPct, bedroomsPct, bedroomFacings, altarPct, altarFacing, stairsPct, stairsFacing, compassOffset, imageRotation]);

  const handleLocalFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
          onImageChange(e.target.files[0]);
          setToiletsPct([]);
          setWcDoorsPct([]);
          setBedroomsPct([]);
          setBedroomFacings([]);
      }
  };

  const handleClearToilets = (e: React.MouseEvent) => { e.stopPropagation(); setToiletsPct([]); };
  const handleClearWcDoors = (e: React.MouseEvent) => { e.stopPropagation(); setWcDoorsPct([]); };
  const handleClearBedrooms = (e: React.MouseEvent) => { 
      e.stopPropagation(); 
      setBedroomsPct([]); 
      setBedroomFacings([]); 
  };

  const updateBedroomFacing = (index: number, value: number) => {
      const newFacings = [...bedroomFacings];
      newFacings[index] = value;
      setBedroomFacings(newFacings);
  };

  const confirmDelete = () => {
      if (!pendingDelete) return;
      const { type, index } = pendingDelete;

      switch (type) {
          case 'KITCHEN': setKitchenPct(undefined); break;
          case 'DOOR': setDoorPct(undefined); break;
          case 'ALTAR': setAltarPct(undefined); break;
          case 'STAIRS': setStairsPct(undefined); break;
          case 'CENTER': setCenterPct(undefined); break;
          case 'TOILET': 
              if (index !== undefined) setToiletsPct(prev => prev.filter((_, i) => i !== index));
              break;
          case 'WC_DOOR':
              if (index !== undefined) setWcDoorsPct(prev => prev.filter((_, i) => i !== index));
              break;
          case 'BEDROOM':
              if (index !== undefined) {
                  setBedroomsPct(prev => prev.filter((_, i) => i !== index));
                  setBedroomFacings(prev => prev.filter((_, i) => i !== index));
              }
              break;
      }
      setPendingDelete(null);
  };

  const rotatePoint = (x: number, y: number, deg: number) => {
    const rad = deg * Math.PI / 180;
    const cx = 0.5, cy = 0.5;
    const dx = x - cx;
    const dy = y - cy;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return {
        x: dx * cos - dy * sin + cx,
        y: dx * sin + dy * cos + cy,
        cos,
        sin
    };
  };
  // Simplified rotate helper for logic
  const simpleRotate = (x: number, y: number, deg: number) => {
    const rad = deg * Math.PI / 180;
    const cx = 0.5, cy = 0.5;
    const dx = x - cx;
    const dy = y - cy;
    const cos = Math.cos(rad);
    const sin = Math.sin(rad);
    return { x: dx * cos - dy * sin + cx, y: dx * sin + dy * cos + cy };
  }


  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    
    const cx = rect.width / 2;
    const cy = rect.height / 2;

    const visualXRaw = e.clientX - rect.left;
    const visualYRaw = e.clientY - rect.top;

    const adjustedX = (visualXRaw - cx) / zoom + cx;
    const adjustedY = (visualYRaw - cy) / zoom + cy;

    const visualX = adjustedX / rect.width;
    const visualY = adjustedY / rect.height;

    const logicalPoint = simpleRotate(visualX, visualY, -imageRotation);

    if (mode === 'CENTER') setCenterPct(logicalPoint);
    else if (mode === 'KITCHEN') setKitchenPct(logicalPoint);
    else if (mode === 'DOOR') setDoorPct(logicalPoint);
    else if (mode === 'TOILET') setToiletsPct(prev => [...prev, logicalPoint]);
    else if (mode === 'WC_DOOR') setWcDoorsPct(prev => [...prev, logicalPoint]);
    else if (mode === 'BEDROOM') {
        setBedroomsPct(prev => [...prev, logicalPoint]);
        setBedroomFacings(prev => [...prev, 0]); 
    }
    else if (mode === 'ALTAR') setAltarPct(logicalPoint);
    else if (mode === 'STAIRS') setStairsPct(logicalPoint);
  };

  const getScreenCoords = (p: Point, rect: DOMRect) => {
    const rotated = simpleRotate(p.x, p.y, imageRotation);
    const dx = (rotated.x - 0.5) * rect.width;
    const dy = (rotated.y - 0.5) * rect.height;
    return {
        x: rect.width / 2 + dx * zoom,
        y: rect.height / 2 + dy * zoom
    };
  }

  // D3 Render Logic for Overlay
  useEffect(() => {
    if (!centerPct || !svgRef.current || !analysis || !containerRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();
    
    const rect = containerRef.current.getBoundingClientRect();
    const visualCenter = getScreenCoords(centerPct, rect);
    const cx = visualCenter.x;
    const cy = visualCenter.y;

    const maxRadius = Math.min(rect.width, rect.height) / 2 * 0.95;
    const radius = Math.min(320, maxRadius); 
    const innerRingRadius = radius * 0.55; 

    const data = analysis.sectors;
    const pie = d3.pie<typeof data[0]>().value(1).sort(null).startAngle(0).endAngle(2 * Math.PI);

    const g = svg.append("g").attr("transform", `translate(${cx}, ${cy})`);
    const rotation = -22.5 + compassOffset + imageRotation;

    // ... (Drawing arcs and lines logic remains same) ...
    const arcOuter = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(innerRingRadius).outerRadius(radius);
    g.selectAll("path.outer").data(pie(data)).enter().append("path")
      .attr("d", arcOuter)
      .attr("fill", d => d.data.star.good ? "#ef4444" : "#475569") 
      .attr("stroke", "none") 
      .attr("transform", `rotate(${rotation})`).attr("opacity", 0.45);

    const arcInner = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(40).outerRadius(innerRingRadius);
    g.selectAll("path.inner").data(pie(data)).enter().append("path")
      .attr("d", arcInner)
      .attr("fill", "#64748b").attr("stroke", "#fff").attr("stroke-width", 1)
      .attr("transform", `rotate(${rotation})`).attr("opacity", 0.6);

    const angles = data.map((_, i) => i * 45);
    g.selectAll("line.divider").data(angles).enter().append("line")
       .attr("x1", 0).attr("y1", 0)
       .attr("x2", 0).attr("y2", -radius)
       .attr("stroke", "rgba(255,255,255,0.9)")
       .attr("stroke-width", 1.5)
       .attr("transform", d => `rotate(${d + rotation})`);

    const textGroup = g.append("g").attr("transform", `rotate(${rotation})`);
    
    const labelArcOuter = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(innerRingRadius).outerRadius(radius);
    textGroup.selectAll("text.star").data(pie(data)).enter().append("text")
      .attr("transform", d => `translate(${labelArcOuter.centroid(d)}) rotate(${-rotation})`)
      .attr("text-anchor", "middle").attr("dy", "0.35em")
      .text(d => d.data.star.name.toUpperCase())
      .style("font-size", "11px").style("font-weight", "900")
      .style("fill", d => d.data.star.good ? "#b91c1c" : "#1e293b")
      .style("stroke", "white").style("stroke-width", "3px").style("paint-order", "stroke");

    const labelArcInner = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(40).outerRadius(innerRingRadius);
    textGroup.selectAll("text.trigram").data(pie(data)).enter().append("text")
        .attr("transform", d => `translate(${labelArcInner.centroid(d)}) rotate(${-rotation})`)
        .attr("text-anchor", "middle").attr("dy", "0.35em")
        .each(function(d, i) {
            const trigram = TRIGRAMS[i];
            const el = d3.select(this);
            el.append("tspan").text(trigram.name.toUpperCase()).attr("x", 0).attr("dy", "-0.4em").style("font-weight", "bold").style("font-size", "10px").style("fill", "white");
            el.append("tspan").text(trigram.sub).attr("x", 0).attr("dy", "1.2em").style("font-size", "9px").style("fill", "white");
        });

    const labelArcDegrees = d3.arc<d3.PieArcDatum<typeof data[0]>>().innerRadius(radius - 12).outerRadius(radius - 12);
    textGroup.selectAll("text.degree").data(pie(data)).enter().append("text")
        .attr("transform", d => `translate(${labelArcDegrees.centroid(d)}) rotate(${-rotation})`)
        .attr("text-anchor", "middle").attr("dy", "0.35em")
        .text((_, i) => `${i * 45}°`)
        .style("font-size", "9px").style("font-weight", "bold")
        .style("fill", "rgba(255,255,255,0.9)")
        .style("text-shadow", "0px 0px 2px #000");


    // --- Markers Logic with Long Press ---
    let longPressTimer: ReturnType<typeof setTimeout>;

    const startLongPress = (type: EditorMode, name: string, index?: number) => {
        longPressTimer = setTimeout(() => {
            setPendingDelete({ type, name, index });
        }, 800); // 800ms to trigger delete
    };

    const cancelLongPress = () => {
        clearTimeout(longPressTimer);
    };

    const drawMarker = (pct: Point, label: string, color: string, icon: string, type: EditorMode, index?: number) => {
        const visual = getScreenCoords(pct, rect);
        const grp = svg.append("g")
            .attr("transform", `translate(${visual.x}, ${visual.y})`)
            .style("cursor", "pointer");

        // Add Hit Area (invisible circle) for easier touch
        grp.append("circle")
            .attr("r", 25)
            .attr("fill", "transparent")
            .on("mousedown", (e) => { e.stopPropagation(); startLongPress(type, label, index); })
            .on("touchstart", (e) => { e.stopPropagation(); startLongPress(type, label, index); })
            .on("mouseup", cancelLongPress)
            .on("mouseleave", cancelLongPress)
            .on("touchend", cancelLongPress);

        grp.append("circle").attr("r", 14).attr("fill", color).attr("stroke", "white").attr("stroke-width", 2).attr("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))")
           .attr("pointer-events", "none"); // Let events pass to hit area
        
        grp.append("text").text(icon).attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "14px").attr("pointer-events", "none");
        
        grp.append("text").text(label).attr("y", 22).attr("text-anchor", "middle").attr("fill", "white").style("font-size", "10px").style("font-weight", "bold").style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)")
           .attr("pointer-events", "none");
           
        return grp;
    };

    if (doorPct) drawMarker(doorPct, "Cửa Chính", "#0ea5e9", "🚪", 'DOOR'); 
    
    if (stairsPct) {
        const visual = getScreenCoords(stairsPct, rect);
        const sGroup = svg.append("g").attr("transform", `translate(${visual.x}, ${visual.y})`).style("cursor", "pointer");
        
        // Hit area for stairs
        sGroup.append("rect").attr("x", -20).attr("y", -20).attr("width", 40).attr("height", 40).attr("fill", "transparent")
            .on("mousedown", (e) => { e.stopPropagation(); startLongPress('STAIRS', 'Cầu Thang'); })
            .on("touchstart", (e) => { e.stopPropagation(); startLongPress('STAIRS', 'Cầu Thang'); })
            .on("mouseup", cancelLongPress).on("mouseleave", cancelLongPress).on("touchend", cancelLongPress);

        sGroup.append("rect").attr("x", -12).attr("y", -12).attr("width", 24).attr("height", 24).attr("rx", 4).attr("fill", "#8b5cf6").attr("stroke", "white").attr("stroke-width", 2).attr("pointer-events", "none");
        sGroup.append("text").text("🪜").attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "14px").attr("pointer-events", "none");
        sGroup.append("text").text("Thang").attr("y", 20).attr("text-anchor", "middle").attr("fill", "white").style("font-size", "10px").style("font-weight", "bold").style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)").attr("pointer-events", "none");
        
        if (stairsFacing !== undefined) {
             const visualStairsDeg = rotation + 22.5 + stairsFacing;
             const rad = (visualStairsDeg - 90) * (Math.PI / 180);
             sGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", Math.cos(rad) * 30).attr("y2", Math.sin(rad) * 30).attr("stroke", "#8b5cf6").attr("stroke-width", 3).attr("marker-end", "url(#arrowhead-purple)").attr("pointer-events", "none");
        }
    }
    
    if (toiletsPct.length > 0) toiletsPct.forEach((tp, i) => drawMarker(tp, `WC ${i + 1}`, "#64748b", "🚽", 'TOILET', i));
    if (wcDoorsPct.length > 0) wcDoorsPct.forEach((wd, i) => drawMarker(wd, `Cửa WC ${i + 1}`, "#94a3b8", "🚪", 'WC_DOOR', i));
    
    // Bedrooms
    if (bedroomsPct.length > 0) {
        bedroomsPct.forEach((bp, i) => {
            const visual = getScreenCoords(bp, rect);
            const bGroup = svg.append("g").attr("transform", `translate(${visual.x}, ${visual.y})`).style("cursor", "pointer");
            
            bGroup.append("circle").attr("r", 25).attr("fill", "transparent")
                .on("mousedown", (e) => { e.stopPropagation(); startLongPress('BEDROOM', `Phòng Ngủ ${i+1}`, i); })
                .on("touchstart", (e) => { e.stopPropagation(); startLongPress('BEDROOM', `Phòng Ngủ ${i+1}`, i); })
                .on("mouseup", cancelLongPress).on("mouseleave", cancelLongPress).on("touchend", cancelLongPress);

            bGroup.append("circle").attr("r", 14).attr("fill", "#ec4899").attr("stroke", "white").attr("stroke-width", 2).attr("filter", "drop-shadow(0px 2px 2px rgba(0,0,0,0.3))").attr("pointer-events", "none");
            bGroup.append("text").text("🛏️").attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "14px").attr("pointer-events", "none");
            bGroup.append("text").text(`Ngủ ${i+1}`).attr("y", 22).attr("text-anchor", "middle").attr("fill", "white").style("font-size", "10px").style("font-weight", "bold").style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)").attr("pointer-events", "none");
            
            if (bedroomFacings[i] !== undefined) {
                 const visualBedDeg = rotation + 22.5 + bedroomFacings[i];
                 const rad = (visualBedDeg - 90) * (Math.PI / 180);
                 bGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", Math.cos(rad) * 30).attr("y2", Math.sin(rad) * 30).attr("stroke", "#ec4899").attr("stroke-width", 3).attr("marker-end", "url(#arrowhead-pink)").attr("pointer-events", "none");
            }
        });
    }

    // Kitchen
    if (kitchenPct) {
        const visual = getScreenCoords(kitchenPct, rect);
        const kGroup = svg.append("g").attr("transform", `translate(${visual.x}, ${visual.y})`).style("cursor", "pointer");
        
        kGroup.append("rect").attr("x", -20).attr("y", -20).attr("width", 40).attr("height", 40).attr("fill", "transparent")
            .on("mousedown", (e) => { e.stopPropagation(); startLongPress('KITCHEN', 'Bếp'); })
            .on("touchstart", (e) => { e.stopPropagation(); startLongPress('KITCHEN', 'Bếp'); })
            .on("mouseup", cancelLongPress).on("mouseleave", cancelLongPress).on("touchend", cancelLongPress);
            
        kGroup.append("rect").attr("x", -12).attr("y", -12).attr("width", 24).attr("height", 24).attr("rx", 4).attr("fill", "#f97316").attr("stroke", "white").attr("stroke-width", 2).attr("pointer-events", "none");
        kGroup.append("text").text("🔥").attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "14px").attr("pointer-events", "none");
        kGroup.append("text").text("Bếp").attr("y", 20).attr("text-anchor", "middle").attr("fill", "white").style("font-size", "10px").style("font-weight", "bold").style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)").attr("pointer-events", "none");
        
        if (stoveFacing !== undefined) {
             const visualStoveDeg = rotation + 22.5 + stoveFacing;
             const rad = (visualStoveDeg - 90) * (Math.PI / 180);
             kGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", Math.cos(rad) * 30).attr("y2", Math.sin(rad) * 30).attr("stroke", "#f97316").attr("stroke-width", 3).attr("marker-end", "url(#arrowhead)").attr("pointer-events", "none");
        }
    }

    // Altar
    if (altarPct) {
        const visual = getScreenCoords(altarPct, rect);
        const aGroup = svg.append("g").attr("transform", `translate(${visual.x}, ${visual.y})`).style("cursor", "pointer");
        
        aGroup.append("rect").attr("x", -20).attr("y", -20).attr("width", 40).attr("height", 40).attr("fill", "transparent")
            .on("mousedown", (e) => { e.stopPropagation(); startLongPress('ALTAR', 'Ban Thờ'); })
            .on("touchstart", (e) => { e.stopPropagation(); startLongPress('ALTAR', 'Ban Thờ'); })
            .on("mouseup", cancelLongPress).on("mouseleave", cancelLongPress).on("touchend", cancelLongPress);
            
        aGroup.append("rect").attr("x", -12).attr("y", -12).attr("width", 24).attr("height", 24).attr("rx", 4).attr("fill", "#eab308").attr("stroke", "white").attr("stroke-width", 2).attr("pointer-events", "none");
        aGroup.append("text").text("🕯️").attr("dy", "0.35em").attr("text-anchor", "middle").style("font-size", "14px").attr("pointer-events", "none");
        aGroup.append("text").text("Thờ").attr("y", 20).attr("text-anchor", "middle").attr("fill", "white").style("font-size", "10px").style("font-weight", "bold").style("text-shadow", "0px 1px 2px rgba(0,0,0,0.8)").attr("pointer-events", "none");

        if (altarFacing !== undefined) {
             const visualAltarDeg = rotation + 22.5 + altarFacing;
             const rad = (visualAltarDeg - 90) * (Math.PI / 180);
             aGroup.append("line").attr("x1", 0).attr("y1", 0).attr("x2", Math.cos(rad) * 30).attr("y2", Math.sin(rad) * 30).attr("stroke", "#eab308").attr("stroke-width", 3).attr("marker-end", "url(#arrowhead-yellow)").attr("pointer-events", "none");
        }
    }
    
    // Defs
    const defs = svg.append("defs");
    const marker = (id: string, color: string) => 
        defs.append("marker").attr("id", id).attr("viewBox", "0 -5 10 10").attr("refX", 8).attr("refY", 0).attr("markerWidth", 6).attr("markerHeight", 6).attr("orient", "auto")
        .append("path").attr("d", "M0,-5L10,0L0,5").attr("fill", color);
    
    marker("arrowhead", "#f97316");
    marker("arrowhead-yellow", "#eab308");
    marker("arrowhead-purple", "#8b5cf6");
    marker("arrowhead-pink", "#ec4899");

  }, [centerPct, kitchenPct, doorPct, toiletsPct, wcDoorsPct, bedroomsPct, bedroomFacings, altarPct, altarFacing, stairsPct, stairsFacing, analysis, facingDegree, stoveFacing, imageRotation, compassOffset, zoom]);

  if (!imageUrl) return <div className="p-10 border-2 border-dashed border-slate-300 text-center text-slate-500 rounded-2xl">Vui lòng tải ảnh lên ở bước trước</div>;

  return (
    <div className="flex flex-col gap-4 relative">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            {/* Top Row: Modes */}
            <div className="flex flex-wrap items-center gap-2 justify-center md:justify-start">
                <button 
                    onClick={() => setMode('CENTER')} 
                    className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm border ${mode === 'CENTER' ? 'bg-amber-500 border-amber-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                    </svg>
                    Tâm Nhà
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                <button 
                    onClick={() => setMode('DOOR')} 
                    className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm border ${mode === 'DOOR' ? 'bg-sky-500 border-sky-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                    </svg>
                    Cửa Chính
                </button>

                <button 
                    onClick={() => setMode('KITCHEN')} 
                    className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm border ${mode === 'KITCHEN' ? 'bg-orange-500 border-orange-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.362 5.214A8.252 8.252 0 0112 21 8.25 8.25 0 016.038 7.047 8.287 8.287 0 009 9.601a8.983 8.983 0 013.361-6.867 8.21 8.21 0 003 2.48z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 18a3.75 3.75 0 00.495-7.468 5.99 5.99 0 00-1.925 3.547 5.975 5.975 0 01-2.133-1.001A3.75 3.75 0 0012 18z" />
                    </svg>
                    Bếp
                </button>
                
                <button 
                    onClick={() => setMode('ALTAR')} 
                    className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm border ${mode === 'ALTAR' ? 'bg-yellow-500 border-yellow-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 14.15v4.25c0 1.094-.787 2.036-1.872 2.18-2.087.277-4.816.42-7.878.42-3.062 0-5.79-.143-7.878-.42-1.085-.144-1.872-1.086-1.872-2.18v-4.25m16.5 0a2.18 2.18 0 00.75-1.661V8.706c0-1.081-.768-2.015-1.837-2.175a48.114 48.114 0 00-3.413-.387m4.5 8.006c-.194.165-.42.295-.673.38A23.978 23.978 0 0112 15.75c-2.648 0-5.195-.429-7.577-1.22a2.016 2.016 0 01-.673-.38m0 0A2.18 2.18 0 013 12.489V8.706c0-1.081.768-2.015 1.837-2.175a48.111 48.111 0 013.413-.387m7.5 0V5.25m-4.5 0v3.313m0 0c.307-.024.617-.044.927-.06a48.65 48.65 0 013.573 0m0 0V5.25" />
                    </svg>
                    Ban Thờ
                </button>

                <div className="w-px h-6 bg-slate-200 mx-1"></div>

                {/* Bedroom Button */}
                <div className="flex items-center gap-0">
                     <button 
                        onClick={() => setMode('BEDROOM')} 
                        className={`h-9 px-4 rounded-l-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm border border-r-0 ${mode === 'BEDROOM' ? 'bg-pink-500 border-pink-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 7.5h3.75m-3.75 7.5h3.75M3 7.5h18" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 3.75h12" />
                        </svg>
                        Ngủ ({bedroomsPct.length})
                    </button>
                    {bedroomsPct.length > 0 && <button onClick={handleClearBedrooms} className="h-9 px-2.5 rounded-r-lg border border-l-slate-300 hover:bg-rose-50 text-slate-400 hover:text-rose-500 bg-white shadow-sm">✕</button>}
                    {bedroomsPct.length === 0 && <div className={`w-3 h-9 rounded-r-lg border border-l-0 ${mode === 'BEDROOM' ? 'bg-pink-500 border-pink-500' : 'bg-slate-50 border-slate-100'}`}></div>}
                </div>

                {/* Toilet Button Group */}
                <div className="flex items-center gap-0">
                     <button 
                        onClick={() => setMode('TOILET')} 
                        className={`h-9 px-3 rounded-l-lg text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shadow-sm border border-r-0 ${mode === 'TOILET' ? 'bg-slate-600 border-slate-600 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white'}`}
                        title="Vị trí Bồn cầu"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M20 12H4M20 12C20 6.477 16.418 2 12 2S4 6.477 4 12M20 12C20 17.523 16.418 22 12 22S4 17.523 4 12M12 9V6" />
                        </svg>
                        WC ({toiletsPct.length})
                    </button>
                    
                    <button 
                        onClick={() => setMode('WC_DOOR')} 
                        className={`h-9 px-3 text-xs font-bold flex items-center gap-1 transition-all whitespace-nowrap shadow-sm border ${mode === 'WC_DOOR' ? 'bg-slate-500 border-slate-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white'}`}
                        title="Vị trí Cửa Vệ Sinh"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                             <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                        </svg>
                        Cửa WC ({wcDoorsPct.length})
                    </button>

                    {/* Clear Button */}
                    {(toiletsPct.length > 0 || wcDoorsPct.length > 0) && (
                        <div className="flex flex-col h-9 border border-l-0 border-slate-300 rounded-r-lg overflow-hidden bg-white shadow-sm">
                             {toiletsPct.length > 0 && <button onClick={handleClearToilets} className="flex-1 px-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 text-[10px] leading-none" title="Xóa WC">✕ WC</button>}
                             {wcDoorsPct.length > 0 && <button onClick={handleClearWcDoors} className="flex-1 px-1.5 hover:bg-rose-50 text-slate-400 hover:text-rose-500 text-[10px] leading-none border-t border-slate-100" title="Xóa Cửa WC">✕ Cửa</button>}
                        </div>
                    )}
                    {toiletsPct.length === 0 && wcDoorsPct.length === 0 && <div className={`w-3 h-9 rounded-r-lg border border-l-0 bg-slate-50 border-slate-100`}></div>}
                </div>
               
                <button 
                    onClick={() => setMode('STAIRS')} 
                    className={`h-9 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap shadow-sm border ${mode === 'STAIRS' ? 'bg-violet-500 border-violet-500 text-white' : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-white hover:border-slate-300'}`}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 19h4v-4h4v-4h4v-4h4" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5L19 3l-1.5 7" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 3l-6 6" />
                    </svg>
                    Thang
                </button>
            </div>
            {/* ... rest of the toolbar ... */}
            <div className="h-px bg-slate-100 w-full my-2"></div>

            {/* Middle Row: Rotation & Zoom */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6 px-1">
                <div className="space-y-2">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xoay Ảnh</label><span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{imageRotation}°</span></div>
                    <input type="range" min="0" max="360" value={imageRotation} onChange={(e) => setImageRotation(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-slate-600"/>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Xoay Bát Quái</label><span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{compassOffset}°</span></div>
                    <input type="range" min="0" max="360" value={compassOffset} onChange={(e) => setCompassOffset(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-amber-500"/>
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                    <div className="flex justify-between items-center"><label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Zoom</label><span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">{zoom.toFixed(1)}x</span></div>
                    <input type="range" min="0.5" max="3" step="0.1" value={zoom} onChange={(e) => setZoom(Number(e.target.value))} className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-sky-500"/>
                </div>
            </div>
            
            {/* Bottom Row: Item Directions */}
            <div className="pt-3 border-t border-slate-100 space-y-4 mt-1">
                {/* 1. Main Features Row */}
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {kitchenPct && (
                        <div className="flex items-center gap-2 bg-orange-50 p-2 rounded-lg border border-orange-100">
                            <label className="text-[10px] font-bold text-orange-600 uppercase whitespace-nowrap">Hướng Bếp (°)</label>
                            <input type="number" value={stoveFacing} onChange={(e) => setStoveFacing(Number(e.target.value))} className="w-16 px-2 py-1 bg-white border border-orange-200 rounded text-sm font-bold text-slate-800 focus:outline-none focus:border-orange-400 text-center"/>
                        </div>
                    )}
                    {altarPct && (
                        <div className="flex items-center gap-2 bg-yellow-50 p-2 rounded-lg border border-yellow-100">
                            <label className="text-[10px] font-bold text-yellow-600 uppercase whitespace-nowrap">Hướng Thờ (°)</label>
                            <input type="number" value={altarFacing} onChange={(e) => setAltarFacing(Number(e.target.value))} className="w-16 px-2 py-1 bg-white border border-yellow-200 rounded text-sm font-bold text-slate-800 focus:outline-none focus:border-yellow-400 text-center"/>
                        </div>
                    )}
                    {stairsPct && (
                        <div className="flex items-center gap-2 bg-violet-50 p-2 rounded-lg border border-violet-100">
                            <label className="text-[10px] font-bold text-violet-600 uppercase whitespace-nowrap">Hướng Thang (°)</label>
                            <input type="number" value={stairsFacing} onChange={(e) => setStairsFacing(Number(e.target.value))} className="w-16 px-2 py-1 bg-white border border-violet-200 rounded text-sm font-bold text-slate-800 focus:outline-none focus:border-violet-400 text-center"/>
                        </div>
                    )}
                </div>

                {/* 2. Bedrooms Row (Separated) */}
                {bedroomsPct.length > 0 && (
                    <div className="bg-pink-50 p-3 rounded-lg border border-pink-100">
                        <label className="text-[10px] font-bold text-pink-500 uppercase block mb-2 tracking-wider flex items-center gap-2">
                             <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3 h-3"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3.75M12 7.5h3.75m-3.75 7.5h3.75M3 7.5h18" /></svg>
                             Hướng Đầu Giường
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {bedroomsPct.map((_, i) => (
                                <div key={i} className="flex items-center justify-between gap-2 bg-white border border-pink-100 rounded px-2 py-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">G.{i+1}</span>
                                    <input 
                                        type="number" 
                                        value={bedroomFacings[i] || 0} 
                                        onChange={(e) => updateBedroomFacing(i, Number(e.target.value))} 
                                        className="w-full bg-transparent text-sm font-bold text-slate-800 focus:outline-none text-right"
                                    />
                                    <span className="text-[10px] text-slate-400">°</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>

        {/* Canvas Area */}
        <div className="relative w-full bg-slate-200 rounded-3xl shadow-inner overflow-hidden select-none flex items-center justify-center min-h-[500px]" ref={containerRef}>
            {!centerPct && mode === 'CENTER' && (
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40 bg-slate-900/90 text-white px-4 py-2 rounded-full animate-bounce text-sm font-medium shadow-lg backdrop-blur-sm pointer-events-none">
                    📍 Click vào tâm nhà
                </div>
            )}
            
            <div style={{ transform: `scale(${zoom})`, transformOrigin: 'center', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                <div className="relative transition-transform duration-100 ease-linear" style={{ transform: `rotate(${imageRotation}deg)`, maxWidth: '100%', maxHeight: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img src={imageUrl} alt="Floor Plan" className="max-w-full h-auto block"/>
                </div>
            </div>

            <svg ref={svgRef} className="absolute inset-0 w-full h-full z-20 pointer-events-none"/>
            <div className="absolute inset-0 cursor-crosshair z-30" onClick={handleImageClick}/>
        </div>
        
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 pt-2">
            <p className="text-xs text-slate-400 italic text-center md:text-left">Click để đặt. <span className="font-bold text-slate-600">Giữ lì vào icon để xóa.</span></p>
            <label className="cursor-pointer px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-sm font-bold border border-slate-200 shadow-sm transition-all flex items-center gap-2 whitespace-nowrap group">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-slate-400 group-hover:text-teal-600 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                Thay ảnh mặt bằng
                <input type="file" accept="image/*" onChange={handleLocalFileChange} className="hidden" />
            </label>
        </div>

        {/* Delete Confirmation Modal */}
        {pendingDelete && (
            <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm rounded-3xl">
                <div className="bg-white p-6 rounded-2xl shadow-2xl max-w-xs w-full animate-bounce-in">
                    <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 text-center mb-2">Xóa đối tượng?</h3>
                    <p className="text-sm text-slate-500 text-center mb-6">Bạn có chắc chắn muốn xóa <span className="font-bold text-slate-700">{pendingDelete.name}</span> này không?</p>
                    <div className="flex gap-3">
                        <button onClick={() => setPendingDelete(null)} className="flex-1 py-2.5 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">Hủy bỏ</button>
                        <button onClick={confirmDelete} className="flex-1 py-2.5 rounded-xl font-bold text-white bg-rose-600 hover:bg-rose-700 transition-colors shadow-lg shadow-rose-200">Xóa</button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default FloorPlanEditor;