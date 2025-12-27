import React, { useState, useCallback, useEffect } from 'react';
import { UserProfile, Gender, HouseInfo, FengShuiAnalysis, Point } from './types';
import { calculateKuaNumber, analyzeFengShui } from './utils/fengShui';
import FloorPlanEditor from './components/FloorPlanEditor';
import Report from './components/Report';

interface SpatialData {
    center?: Point;
    kitchen?: Point;
    stoveFacing: number;
    mainDoor?: Point;
    toilets?: Point[]; 
    wcDoors?: Point[]; 
    bedrooms?: Point[]; 
    bedroomFacings?: number[]; 
    altar?: Point;      
    altarFacing: number; 
    stairs?: Point;
    stairsFacing: number; 
    compassOffset: number; 
}

function App() {
  const [step, setStep] = useState<number>(1);
  
  // Input States
  const [userProfile, setUserProfile] = useState<UserProfile>({
    name: '',
    birthYear: 1990,
    gender: Gender.MALE,
  });
  
  const [houseInfo, setHouseInfo] = useState<HouseInfo>({
    facingDegree: 180, 
    imageFile: null,
    imageUrl: null,
    stoveFacingDegree: 0,
    altarFacingDegree: 0,
    stairsFacingDegree: 0,
    bedroomFacings: []
  });

  const [analysis, setAnalysis] = useState<FengShuiAnalysis | null>(null);
  const [spatialData, setSpatialData] = useState<SpatialData | null>(null);

  // Core Analysis Logic
  const performAnalysis = useCallback((
    profile: UserProfile, 
    house: HouseInfo, 
    spatial: SpatialData | null
  ) => {
    const kua = calculateKuaNumber(Number(profile.birthYear), profile.gender);
    
    let combinedSpatial = undefined;
    if (spatial && spatial.center) {
        combinedSpatial = {
            center: spatial.center,
            kitchen: spatial.kitchen,
            stoveFacing: spatial.stoveFacing,
            mainDoor: spatial.mainDoor,
            toilets: spatial.toilets,
            wcDoors: spatial.wcDoors, 
            bedrooms: spatial.bedrooms, 
            bedroomFacings: spatial.bedroomFacings, 
            altar: spatial.altar,       
            altarFacing: spatial.altarFacing, 
            stairs: spatial.stairs,
            stairsFacing: spatial.stairsFacing, 
            compassOffset: spatial.compassOffset,
            width: 1000, 
            height: 1000
        };
    }

    const result = analyzeFengShui(kua, Number(house.facingDegree), combinedSpatial);
    setAnalysis(result);
  }, []);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setUserProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const newFile = e.target.files[0];
      setHouseInfo(prev => ({ ...prev, imageFile: newFile }));
      
      if (step === 2) {
          setSpatialData(null);
          performAnalysis(userProfile, { ...houseInfo, imageFile: newFile }, null);
      }
    }
  };

  // Handle Paste Event (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const file = items[i].getAsFile();
                if (file) {
                    setHouseInfo(prev => ({ ...prev, imageFile: file }));
                    
                    // If already in step 2, trigger analysis immediately
                    if (step === 2) {
                        setSpatialData(null);
                        // Use the new file immediately instead of waiting for state update
                        performAnalysis(userProfile, { ...houseInfo, imageFile: file }, null);
                    }
                }
                break; // Only take the first image
            }
        }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
        window.removeEventListener('paste', handlePaste);
    };
  }, [step, houseInfo, userProfile, performAnalysis]);


  const handleRemoveFile = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setHouseInfo(prev => ({ ...prev, imageFile: null }));
  };

  const handleAnalyzeClick = () => {
    performAnalysis(userProfile, houseInfo, null);
    setStep(2);
  };

  const handleEditorUpdate = (data: any) => {
    setSpatialData(data);
    performAnalysis(userProfile, houseInfo, data);
  };

  const handleLiveParamChange = (field: string, value: any) => {
      let newProfile = { ...userProfile };
      let newHouse = { ...houseInfo };
      
      if (field === 'facingDegree') {
          newHouse.facingDegree = Number(value);
          setHouseInfo(newHouse);
      } else {
          newProfile = { ...newProfile, [field]: value };
          setUserProfile(newProfile);
      }
      
      performAnalysis(newProfile, newHouse, spatialData);
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-700">
      {/* Modern Header */}
      <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-200">
        <div className="max-w-6xl mx-auto py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-600 to-teal-800 rounded-xl flex items-center justify-center text-white font-serif font-bold text-xl shadow-lg shadow-teal-200">
                    PT
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-slate-800 serif">Phong Thủy Gia Đạo</h1>
                </div>
            </div>
            {step === 2 && (
                <button onClick={() => {
                    setStep(1);
                    setAnalysis(null);
                    setSpatialData(null);
                }} className="text-sm font-medium text-slate-500 hover:text-teal-600 transition flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Tạo hồ sơ mới
                </button>
            )}
        </div>
      </header>

      <main className="max-w-6xl mx-auto mt-8 px-4 md:px-6">
        {step === 1 && (
          <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/60 overflow-hidden grid md:grid-cols-5 min-h-[550px] border border-slate-100">
            {/* Left Column - Intro */}
            <div className="md:col-span-2 p-10 bg-gradient-to-br from-teal-50 via-white to-amber-50 flex flex-col justify-center relative overflow-hidden">
               {/* Decorative Circle */}
              <div className="absolute -top-20 -left-20 w-64 h-64 bg-teal-100/50 rounded-full blur-3xl"></div>
              
              <div className="relative z-10">
                  <h2 className="text-4xl md:text-5xl font-bold text-slate-800 mb-6 serif leading-[1.15]">
                    Khởi tạo <br/> <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">Hồ Sơ Cát Tường</span>
                  </h2>
                  <p className="text-slate-600 mb-10 leading-relaxed font-light text-lg">
                    Ứng dụng phong thủy hiện đại, kết hợp tinh hoa Bát Trạch và Lý Khí để kích hoạt tài lộc cho ngôi nhà của bạn.
                  </p>
                  
                  <div className="space-y-4">
                      <div className="flex items-center gap-4 group">
                          <span className="w-8 h-8 rounded-full bg-white border border-slate-200 text-teal-600 flex items-center justify-center text-sm font-bold shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-colors">1</span>
                          <span className="text-slate-700 font-medium">Tính Mệnh Quái (Nam/Nữ)</span>
                      </div>
                      <div className="h-4 border-l border-dashed border-slate-300 ml-4 my-1"></div>
                      <div className="flex items-center gap-4 group">
                          <span className="w-8 h-8 rounded-full bg-white border border-slate-200 text-teal-600 flex items-center justify-center text-sm font-bold shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-colors">2</span>
                          <span className="text-slate-700 font-medium">Đồ hình Bát Trạch & Ngũ Hành</span>
                      </div>
                       <div className="h-4 border-l border-dashed border-slate-300 ml-4 my-1"></div>
                      <div className="flex items-center gap-4 group">
                          <span className="w-8 h-8 rounded-full bg-white border border-slate-200 text-teal-600 flex items-center justify-center text-sm font-bold shadow-sm group-hover:bg-teal-600 group-hover:text-white transition-colors">3</span>
                          <span className="text-slate-700 font-medium">Phân tích Tọa/Hướng chuyên sâu</span>
                      </div>
                  </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="md:col-span-3 p-10 bg-white flex flex-col justify-center">
              <div className="space-y-8 max-w-lg mx-auto w-full">
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Năm sinh (Âm lịch)</label>
                        <input 
                        type="number" 
                        name="birthYear" 
                        value={userProfile.birthYear} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all text-slate-800 font-semibold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Giới tính</label>
                        <div className="relative">
                            <select 
                            name="gender" 
                            value={userProfile.gender} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all text-slate-800 font-semibold text-lg appearance-none cursor-pointer"
                            >
                            <option value={Gender.MALE}>Nam</option>
                            <option value={Gender.FEMALE}>Nữ</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                                  <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Hướng nhà (Độ số)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        value={houseInfo.facingDegree} 
                        onChange={(e) => setHouseInfo({...houseInfo, facingDegree: Number(e.target.value)})}
                        className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-teal-100 focus:border-teal-500 outline-none transition-all text-slate-800 font-semibold text-lg"
                        placeholder="Ví dụ: 90"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">Độ</span>
                  </div>
                  <div className="flex gap-2 text-[10px] text-slate-400 font-medium mt-2">
                      <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">Bắc: 0°</span>
                      <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">Đông: 90°</span>
                      <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">Nam: 180°</span>
                      <span className="bg-slate-50 border border-slate-100 px-2 py-1 rounded-md">Tây: 270°</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Mặt bằng nhà (Ảnh)</label>
                  <div className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all group ${houseInfo.imageFile ? 'border-teal-400 bg-teal-50/20' : 'border-slate-200 hover:border-teal-300 hover:bg-slate-50'}`}>
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center gap-3 relative z-0">
                          {houseInfo.imageFile ? (
                              <>
                                <div className="w-12 h-12 rounded-full bg-teal-100 text-teal-600 flex items-center justify-center text-xl shadow-sm">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </div>
                                <div>
                                    <span className="text-slate-800 font-semibold block truncate max-w-[200px]">{houseInfo.imageFile.name}</span>
                                    <span className="text-xs text-slate-500 font-medium group-hover:text-teal-600 transition-colors">Click hoặc Ctrl+V để thay ảnh khác</span>
                                </div>
                              </>
                          ) : (
                              <>
                                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-1 group-hover:bg-white group-hover:shadow-sm transition-all">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
                                </div>
                                <div>
                                    <span className="text-slate-700 font-semibold block">Tải ảnh mặt bằng</span>
                                    <span className="text-xs text-slate-400">Click hoặc Ctrl+V để dán ảnh (Max 5MB)</span>
                                </div>
                              </>
                          )}
                      </div>
                      
                      {houseInfo.imageFile && (
                        <button 
                            onClick={handleRemoveFile}
                            className="absolute top-2 right-2 z-20 p-2 bg-white hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-full shadow-sm transition-all border border-slate-100"
                            title="Xóa ảnh"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                      )}
                  </div>
                </div>

                <button 
                  onClick={handleAnalyzeClick}
                  disabled={!houseInfo.imageFile}
                  className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide transition-all shadow-lg text-lg ${!houseInfo.imageFile ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-teal-600 to-teal-800 text-white hover:shadow-teal-200 hover:-translate-y-0.5 active:translate-y-0'}`}
                >
                  Phân Tích Phong Thủy
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && analysis && (
          <div className="grid lg:grid-cols-2 gap-8 animate-fade-in-up pb-10">
            {/* Left Column: Interactive Map */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                            <span className="w-2 h-6 bg-teal-500 rounded-full"></span>
                            Đồ Hình Bát Quái
                        </h3>
                        <span className="text-xs bg-teal-50 text-teal-700 px-3 py-1.5 rounded-full font-bold">Chế độ tương tác</span>
                     </div>
                     
                     <FloorPlanEditor 
                        imageFile={houseInfo.imageFile} 
                        analysis={analysis} 
                        facingDegree={houseInfo.facingDegree}
                        onUpdateAnalysis={handleEditorUpdate}
                        onImageChange={(file) => {
                            setHouseInfo(prev => ({ ...prev, imageFile: file }));
                            setSpatialData(null);
                            performAnalysis(userProfile, { ...houseInfo, imageFile: file }, null);
                        }}
                    />
                </div>
                <div className="flex gap-4">
                     <button onClick={() => window.print()} className="flex-1 py-3.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition shadow-lg font-semibold flex items-center justify-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M6.72 13.829c-.24.03-.48.062-.72.096m.72-.096a42.415 42.415 0 0110.56 0m-10.56 0L6.34 18m10.94-4.171c.24.03.48.062.72.096m-.72-.096L17.66 18m0 0l.229 2.523a1.125 1.125 0 01-1.12 1.227H7.231c-.662 0-1.18-.568-1.12-1.227L6.34 18m11.318 0h1.091A2.25 2.25 0 0021 15.75V9.456c0-1.081-.768-2.015-1.837-2.175a48.055 48.055 0 00-1.913-.247M6.34 18H5.25A2.25 2.25 0 013 15.75V9.456c0-1.081.768-2.015 1.837-2.175a48.041 48.041 0 011.913-.247m10.5 0a48.536 48.536 0 00-10.5 0m10.5 0V3.375c0-.621-.504-1.125-1.125-1.125h-8.25c-.621 0-1.125.504-1.125 1.125v3.659M18 10.5h.008v.008h-.008V10.5zm-3 0h.008v.008h-.008V10.5z" /></svg>
                        In Báo Cáo
                     </button>
                </div>
            </div>
            
            {/* Right Column: Settings & Report */}
            <div className="space-y-6">
                {/* Live Adjustment Panel */}
                <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-5 flex items-center gap-2 text-xs uppercase tracking-wider border-b border-slate-100 pb-3">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 text-slate-400"><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" /></svg>
                        Hiệu chỉnh thông số
                    </h3>
                    <div className="grid grid-cols-3 gap-4">
                         <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Năm sinh</label>
                            <input 
                                type="number" 
                                value={userProfile.birthYear}
                                onChange={(e) => handleLiveParamChange('birthYear', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Giới tính</label>
                            <select 
                                value={userProfile.gender}
                                onChange={(e) => handleLiveParamChange('gender', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                            >
                                <option value={Gender.MALE}>Nam</option>
                                <option value={Gender.FEMALE}>Nữ</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Hướng nhà (°)</label>
                            <input 
                                type="number" 
                                value={houseInfo.facingDegree}
                                onChange={(e) => handleLiveParamChange('facingDegree', e.target.value)}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-800 focus:ring-2 focus:ring-teal-100 outline-none transition-all"
                            />
                        </div>
                    </div>
                </div>

                <Report analysis={analysis} />
            </div>
          </div>
        )}
      </main>
      
      {/* Footer Decoration */}
      <div className="fixed bottom-0 left-0 w-full h-1.5 bg-gradient-to-r from-teal-400 via-amber-400 to-teal-400 z-50"></div>
    </div>
  );
}

export default App;