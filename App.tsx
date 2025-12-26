import React, { useState, useCallback } from 'react';
import { UserProfile, Gender, HouseInfo, FengShuiAnalysis, Point } from './types';
import { calculateKuaNumber, analyzeFengShui } from './utils/fengShui';
import FloorPlanEditor from './components/FloorPlanEditor';
import Report from './components/Report';

interface SpatialData {
    center?: Point;
    kitchen?: Point;
    stoveFacing: number;
    mainDoor?: Point;
    toilet?: Point;
    stairs?: Point;
    compassOffset: number; // Added to handle manual compass rotation
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
    facingDegree: 180, // Default South
    imageFile: null,
    imageUrl: null,
    stoveFacingDegree: 0
  });

  // Analysis State
  const [analysis, setAnalysis] = useState<FengShuiAnalysis | null>(null);
  
  // Store spatial data (dots on map) so we can re-calculate when User Profile changes
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
            toilet: spatial.toilet,
            stairs: spatial.stairs,
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
      
      // If updating image while in Step 2, we must reset spatial dots because the map changed
      if (step === 2) {
          setSpatialData(null);
          // Re-analyze with new image (but no spatial data yet)
          performAnalysis(userProfile, { ...houseInfo, imageFile: newFile }, null);
      }
    }
  };

  const handleRemoveFile = (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setHouseInfo(prev => ({ ...prev, imageFile: null }));
  };

  const handleAnalyzeClick = () => {
    performAnalysis(userProfile, houseInfo, null);
    setStep(2);
  };

  // Called when user moves dots on the map
  const handleEditorUpdate = (data: { center?: Point; kitchen?: Point; stoveFacing: number; door?: Point; toilet?: Point; stairs?: Point, compassOffset: number }) => {
    setSpatialData(data);
    performAnalysis(userProfile, houseInfo, data);
  };

  // Called when user changes inputs in Step 2 (Live Update)
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
      
      // Re-run analysis immediately preserving current spatial dots
      performAnalysis(newProfile, newHouse, spatialData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-stone-100 pb-20 font-sans text-stone-700">
      {/* Light Theme Header */}
      <header className="bg-white/90 backdrop-blur-md sticky top-0 z-50 border-b border-stone-100 shadow-sm">
        <div className="max-w-5xl mx-auto py-4 px-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    PT
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-wide uppercase serif text-stone-800">Phong Thủy Gia Đạo</h1>
                </div>
            </div>
            {step === 2 && (
                <button onClick={() => {
                    setStep(1);
                    setAnalysis(null);
                    setSpatialData(null);
                }} className="text-sm font-medium text-stone-500 hover:text-amber-600 transition">
                    ← Tạo hồ sơ mới
                </button>
            )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto mt-8 px-4 md:px-6">
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-xl shadow-stone-200/50 overflow-hidden grid md:grid-cols-5 min-h-[500px] border border-stone-100">
            {/* Left Column - Intro */}
            <div className="md:col-span-2 p-8 bg-gradient-to-br from-orange-50 via-amber-50 to-white flex flex-col justify-center relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              
              <h2 className="text-3xl md:text-4xl font-bold text-stone-800 mb-6 serif leading-tight">
                Khởi tạo <br/> <span className="text-amber-600">Hồ Sơ Cát Tường</span>
              </h2>
              <p className="text-stone-600 mb-8 leading-relaxed text-sm md:text-base">
                Nhập thông tin gia chủ và thông số ngôi nhà để hệ thống tính toán trường khí, kích hoạt tài lộc và hóa giải vận hạn.
              </p>
              
              <div className="space-y-4">
                  <div className="flex items-center gap-3 text-sm text-stone-600 bg-white/60 p-3 rounded-lg backdrop-blur-sm border border-stone-100">
                      <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">1</span>
                      <span>Tính Mệnh Quái (Nam/Nữ)</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-600 bg-white/60 p-3 rounded-lg backdrop-blur-sm border border-stone-100">
                      <span className="w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xs font-bold">2</span>
                      <span>Đồ hình Bát Trạch & Ngũ Hành</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-stone-600 bg-white/60 p-3 rounded-lg backdrop-blur-sm border border-stone-100">
                      <span className="w-6 h-6 rounded-full bg-red-100 text-red-600 flex items-center justify-center text-xs font-bold">3</span>
                      <span>Phân tích Tọa/Hướng Bếp</span>
                  </div>
              </div>
            </div>

            {/* Right Column - Form */}
            <div className="md:col-span-3 p-8 md:p-10 bg-white flex flex-col justify-center">
              <div className="space-y-6">
                
                <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">Năm sinh (Âm lịch)</label>
                        <input 
                        type="number" 
                        name="birthYear" 
                        value={userProfile.birthYear} 
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all text-stone-800 font-medium"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">Giới tính</label>
                        <div className="relative">
                            <select 
                            name="gender" 
                            value={userProfile.gender} 
                            onChange={handleInputChange}
                            className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all text-stone-800 font-medium appearance-none"
                            >
                            <option value={Gender.MALE}>Nam</option>
                            <option value={Gender.FEMALE}>Nữ</option>
                            </select>
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-stone-400">
                                ▼
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">Hướng nhà (Độ số 0-360)</label>
                  <div className="relative">
                    <input 
                        type="number" 
                        value={houseInfo.facingDegree} 
                        onChange={(e) => setHouseInfo({...houseInfo, facingDegree: Number(e.target.value)})}
                        className="w-full px-4 py-3 bg-stone-50 border border-stone-200 rounded-lg focus:bg-white focus:ring-2 focus:ring-amber-200 focus:border-amber-400 outline-none transition-all text-stone-800 font-medium"
                        placeholder="Ví dụ: 90"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 text-sm">Độ</span>
                  </div>
                  <div className="flex gap-2 text-xs text-stone-400 mt-1">
                      <span className="bg-stone-100 px-2 py-1 rounded">Bắc: 0°</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">Đông: 90°</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">Nam: 180°</span>
                      <span className="bg-stone-100 px-2 py-1 rounded">Tây: 270°</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-xs font-bold text-stone-400 uppercase tracking-wider">Mặt bằng nhà (Ảnh)</label>
                  <div className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all ${houseInfo.imageFile ? 'border-amber-400 bg-amber-50/30' : 'border-stone-200 hover:border-amber-300 hover:bg-stone-50'}`}>
                      <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleFileChange}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className="flex flex-col items-center gap-2 relative z-0">
                          {houseInfo.imageFile ? (
                              <>
                                <div className="w-10 h-10 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-xl">✓</div>
                                <span className="text-stone-800 font-medium truncate max-w-[200px]">{houseInfo.imageFile.name}</span>
                                <span className="text-xs text-stone-500">Click để thay đổi</span>
                              </>
                          ) : (
                              <>
                                <span className="text-3xl mb-1">📂</span>
                                <span className="text-stone-600 font-medium">Tải ảnh mặt bằng</span>
                                <span className="text-xs text-stone-400">JPG, PNG (Max 5MB)</span>
                              </>
                          )}
                      </div>
                      
                      {houseInfo.imageFile && (
                        <button 
                            onClick={handleRemoveFile}
                            className="absolute top-2 right-2 z-20 p-2 bg-white hover:bg-red-50 text-stone-400 hover:text-red-500 rounded-full shadow-sm transition-all border border-stone-100"
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
                  className={`w-full py-4 px-6 rounded-xl font-bold tracking-wide transition-all shadow-lg transform hover:-translate-y-0.5 active:translate-y-0 ${!houseInfo.imageFile ? 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-amber-500 to-orange-600 text-white hover:shadow-orange-200'}`}
                >
                  PHÂN TÍCH PHONG THỦY NGAY
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && analysis && (
          <div className="grid lg:grid-cols-2 gap-8 animate-fade-in-up">
            {/* Left Column: Interactive Map */}
            <div className="space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-xl shadow-stone-200/50 border border-stone-100">
                     <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-bold text-stone-800 flex items-center gap-2">
                            <span className="w-2 h-6 bg-amber-500 rounded-sm"></span>
                            Đồ Hình Bát Quái
                        </h3>
                        <span className="text-xs bg-stone-100 text-stone-500 px-2 py-1 rounded">Chế độ tương tác</span>
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
                     <button onClick={() => window.print()} className="flex-1 py-3 bg-stone-800 text-white rounded-xl hover:bg-stone-900 transition shadow-lg font-medium">
                        🖨️ In Báo Cáo
                     </button>
                </div>
            </div>
            
            {/* Right Column: Settings & Report */}
            <div className="space-y-6">
                {/* Live Adjustment Panel */}
                <div className="bg-white p-5 rounded-2xl shadow-sm border border-stone-200">
                    <h3 className="font-bold text-stone-800 mb-4 flex items-center gap-2 text-sm uppercase tracking-wider border-b border-stone-100 pb-2">
                        ⚙️ Hiệu chỉnh thông số
                    </h3>
                    <div className="grid grid-cols-3 gap-3">
                         <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Năm sinh</label>
                            <input 
                                type="number" 
                                value={userProfile.birthYear}
                                onChange={(e) => handleLiveParamChange('birthYear', e.target.value)}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-200 outline-none"
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Giới tính</label>
                            <select 
                                value={userProfile.gender}
                                onChange={(e) => handleLiveParamChange('gender', e.target.value)}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-200 outline-none"
                            >
                                <option value={Gender.MALE}>Nam</option>
                                <option value={Gender.FEMALE}>Nữ</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-stone-400 uppercase">Hướng nhà (°)</label>
                            <input 
                                type="number" 
                                value={houseInfo.facingDegree}
                                onChange={(e) => handleLiveParamChange('facingDegree', e.target.value)}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-200 outline-none"
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
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-amber-300 via-orange-400 to-amber-300 z-50"></div>
    </div>
  );
}

export default App;