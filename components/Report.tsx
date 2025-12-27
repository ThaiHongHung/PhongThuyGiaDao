import React from 'react';
import { FengShuiAnalysis, StarQuality, FeatureAnalysis, AltarAnalysis } from '../types';

interface ReportProps {
  analysis: FengShuiAnalysis;
}

const Report: React.FC<ReportProps> = ({ analysis }) => {
  
  const renderFindingsRemedies = (findings: string[], remedies: string[]) => (
      <div className="space-y-4 mt-5">
        {findings.length > 0 && (
          <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm">
            <h4 className="font-bold text-slate-700 mb-3 border-b border-slate-50 pb-2 text-xs uppercase tracking-wide flex items-center gap-2">
                <span className="text-rose-500">🔎</span> Hiện trạng Phong Thủy
            </h4>
            <ul className="space-y-2.5">
              {findings.map((item, i) => (
                <li key={i} className={`flex items-start gap-3 text-sm leading-relaxed ${item.includes('🚫') || item.includes('❌') ? 'text-rose-700 font-medium' : 'text-slate-600'}`}>
                    <span className="shrink-0 mt-0.5">{item.includes('✅') ? '✅' : item.includes('🚫') || item.includes('❌') ? '🚫' : '⚠️'}</span>
                    <span>{item.replace(/^[✅⚠️🚫❌]\s*/, '')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        {remedies.length > 0 && (
          <div className="bg-emerald-50/50 p-5 rounded-xl border border-emerald-100/50">
            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 border-b border-emerald-100/50 pb-2 text-xs uppercase tracking-wide">
                <span>🍃</span> Hóa giải & Lời khuyên
            </h4>
            <ul className="space-y-2.5">
              {remedies.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-emerald-900 text-sm">
                   <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                   <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
  );

  const extractAdvice = (adviceList: string[]) => {
      const findings = adviceList.filter(item => item.match(/^[✅⚠️🚫❌]/));
      const remedies = adviceList.filter(item => !item.match(/^[✅⚠️🚫❌]/));
      return { findings, remedies };
  };

  const renderSectionHeader = (icon: string, title: string, subtitle: string) => (
      <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
              <span className="text-2xl p-2 bg-slate-50 rounded-lg border border-slate-100">{icon}</span> 
              <h3 className="text-xl font-bold text-slate-800 serif">{title}</h3>
          </div>
          <p className="text-xs text-slate-400 uppercase tracking-wider font-bold ml-[3.25rem]">{subtitle}</p>
      </div>
  );

  // 1. Cửa Chính
  const renderMainDoor = () => {
      if (!analysis.mainDoor) return null;
      const { findings, remedies } = extractAdvice(analysis.mainDoor.advice);
      
      return (
        <div className="p-6 rounded-3xl border border-sky-100 bg-gradient-to-br from-white to-sky-50/30 shadow-sm mb-6">
            {renderSectionHeader("🚪", "Cửa Chính (Khí Khẩu)", "Nơi nạp khí cho cả ngôi nhà")}
            
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-sky-100/60 shadow-sm mb-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold shadow-inner ${analysis.mainDoor.isGoodPlacement ? 'bg-green-100 text-green-600' : 'bg-rose-100 text-rose-600'}`}>
                    {analysis.mainDoor.isGoodPlacement ? 'Cát' : 'Hung'}
                </div>
                <div>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">Tọa Lạc Tại Cung</p>
                    <p className="font-bold text-lg text-slate-800">{analysis.mainDoor.locationSector.direction} - {analysis.mainDoor.locationSector.star.name}</p>
                </div>
            </div>
            {renderFindingsRemedies(findings, remedies)}
        </div>
      );
  };

  // 2. Phòng Khách
  const renderLivingRoom = () => {
      return (
          <div className="p-6 rounded-3xl border border-slate-200 bg-white shadow-sm mb-6">
              {renderSectionHeader("🛋️", "Phòng Khách (Minh Đường)", "Trung tâm sinh khí, bộ mặt ngôi nhà")}
              <div className="grid md:grid-cols-2 gap-5 text-sm text-slate-600">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-700 mb-2">Nguyên tắc Tụ Khí</p>
                      <ul className="list-disc list-inside space-y-1.5 marker:text-slate-300">
                          <li>Phòng cần rộng, sáng, khí đi vào phải uốn lượn, tụ lại rồi mới tỏa.</li>
                          <li>Tránh "Xuyên Đường Sát": Cửa trước thẳng tắp ra cửa sau.</li>
                      </ul>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                      <p className="font-bold text-slate-700 mb-2">Bố cục Sofa</p>
                      <ul className="list-disc list-inside space-y-1.5 marker:text-slate-300">
                          <li>Sofa phải tựa tường vững chắc (có "Sơn"). Không quay lưng ra cửa.</li>
                          <li>Không đặt sofa dưới xà ngang (gây áp lực).</li>
                      </ul>
                  </div>
              </div>
          </div>
      );
  };

  // 3. Bếp
  const renderKitchen = () => {
      if (!analysis.kitchen) return (
        <div className="p-8 rounded-3xl border-2 border-dashed border-slate-200 text-center mb-6 bg-slate-50/50">
            <span className="text-4xl block mb-3 opacity-50">🔥</span>
            <p className="text-slate-500 font-bold">Chưa xác định vị trí Bếp</p>
            <p className="text-xs text-slate-400 mt-1">Vui lòng dùng công cụ "Bếp" trên bản vẽ.</p>
        </div>
      );
      const { findings, remedies } = extractAdvice(analysis.kitchen.advice);

      return (
        <div className="p-6 rounded-3xl border border-orange-100 bg-gradient-to-br from-white to-orange-50/30 shadow-sm mb-6">
             {renderSectionHeader("🔥", "Táo Vị (Bếp Nấu)", "Tọa Hung Hướng Cát - Giữ lửa tài lộc")}
             
             <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className={`p-4 rounded-2xl border shadow-sm ${analysis.kitchen.locationSector.isSittingBad ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Tọa (Vị trí đặt)</span>
                        <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${analysis.kitchen.locationSector.isSittingBad ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {analysis.kitchen.locationSector.isSittingBad ? 'Đắc Cách' : 'Phạm Kỵ'}
                        </span>
                    </div>
                    <div className="font-bold text-slate-800 text-lg">{analysis.kitchen.locationSector.direction} ({analysis.kitchen.locationSector.star.name})</div>
                    <div className="text-xs font-medium text-slate-500 mt-1">{analysis.kitchen.locationSector.isSittingBad ? 'Đặt tại cung xấu để trấn hung.' : 'Đặt tại cung tốt làm thiêu hủy cát khí.'}</div>
                </div>

                <div className={`p-4 rounded-2xl border shadow-sm ${analysis.kitchen.facingSector.isFacingGood ? 'bg-emerald-50/50 border-emerald-100' : 'bg-rose-50/50 border-rose-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                         <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Hướng (Miệng lò)</span>
                         <span className={`text-sm font-bold px-2 py-0.5 rounded-md ${analysis.kitchen.facingSector.isFacingGood ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                            {analysis.kitchen.facingSector.isFacingGood ? 'Đắc Cách' : 'Phạm Kỵ'}
                        </span>
                    </div>
                    <div className="font-bold text-slate-800 text-lg">{analysis.kitchen.facingSector.direction} ({analysis.kitchen.facingSector.star.name})</div>
                     <div className="text-xs font-medium text-slate-500 mt-1">{analysis.kitchen.facingSector.isFacingGood ? 'Nhìn về cung tốt để đón tài lộc.' : 'Nhìn về cung xấu nạp khí hung.'}</div>
                </div>
             </div>

             {renderFindingsRemedies(findings, remedies)}
        </div>
      );
  };

  // 4. Phòng Ngủ
  const renderBedrooms = () => {
      if (!analysis.bedrooms || analysis.bedrooms.length === 0) return null;
      return (
          <div className="p-6 rounded-3xl border border-pink-100 bg-gradient-to-br from-white to-pink-50/30 shadow-sm mb-6">
              {renderSectionHeader("🛏️", "Phòng Ngủ (Chủ Tọa)", "Nơi nghỉ ngơi, ảnh hưởng sức khỏe & hôn nhân")}
              
              <div className="grid gap-5">
                  {analysis.bedrooms.map((bed, idx) => {
                      const { findings, remedies } = extractAdvice(bed.advice);
                      return (
                          <div key={idx} className="bg-white p-5 rounded-2xl border border-pink-100 shadow-sm">
                              <h4 className="font-bold text-pink-900 border-b border-pink-50 pb-2 mb-3 flex justify-between items-center">
                                  {bed.featureName}
                                  <span className={`text-xs font-bold px-2 py-1 rounded-md ${bed.isGoodPlacement ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{bed.isGoodPlacement ? 'Vị Trí Tốt' : 'Vị Trí Xấu'}</span>
                              </h4>
                              
                              <div className="text-sm mb-3">
                                  <span className="text-slate-400 font-bold text-xs uppercase mr-2">Cung vị:</span> 
                                  <span className="font-semibold text-slate-700">{bed.locationSector.direction} ({bed.locationSector.star.name})</span>
                              </div>
                              
                              <ul className="space-y-1.5">
                                  {findings.map((f, i) => <li key={i} className={`text-sm ${f.includes('🚫') ? 'text-rose-600 font-medium' : 'text-slate-600'}`}>{f}</li>)}
                                  {remedies.map((r, i) => <li key={i} className="text-sm text-pink-600 font-medium flex gap-2"><span>💡</span> {r}</li>)}
                              </ul>
                          </div>
                      );
                  })}
              </div>
          </div>
      );
  };

  // 5. WC
  const renderWC = () => {
       if (!analysis.toilets || analysis.toilets.length === 0) return null;
       return (
           <div className="p-6 rounded-3xl border border-slate-200 bg-slate-50 shadow-sm mb-6">
               {renderSectionHeader("🚽", "Khu Vệ Sinh (Thủy Khẩu)", "Đặt tại cung xấu để 'Lấy độc trị độc'")}
               
               <div className="grid md:grid-cols-2 gap-4">
                   {analysis.toilets.map((wc, idx) => (
                       <div key={idx} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
                           <div className="flex justify-between items-center mb-3">
                               <span className="font-bold text-slate-700">{wc.featureName}</span>
                               <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wider ${wc.isGoodPlacement ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                   {wc.isGoodPlacement ? 'Đúng vị trí' : 'Sai vị trí'}
                               </span>
                           </div>
                           <p className="text-sm text-slate-600 mb-3 font-medium">Đặt tại: {wc.locationSector.direction} ({wc.locationSector.star.name})</p>
                           {wc.advice.map((adv, i) => (
                               <p key={i} className={`text-xs p-1.5 rounded bg-slate-50 mb-1 ${adv.includes('🚫') ? 'text-rose-600 font-bold bg-rose-50' : 'text-slate-500'}`}>{adv}</p>
                           ))}
                       </div>
                   ))}
               </div>
           </div>
       );
  };

  // 6. Cầu Thang
  const renderStairs = () => {
      if (!analysis.stairs) return null;
      const { findings, remedies } = extractAdvice(analysis.stairs.advice);
      return (
          <div className="p-6 rounded-3xl border border-violet-100 bg-gradient-to-br from-white to-violet-50/30 shadow-sm mb-6">
              {renderSectionHeader("🪜", "Cầu Thang (Động Khí)", "Dẫn khí lên tầng, không được xung cửa")}
              <div className="bg-white p-5 rounded-2xl border border-violet-100 shadow-sm">
                  <p className="font-bold text-violet-900 mb-3 text-sm"><span className="text-slate-400 uppercase text-xs font-bold mr-2">Vị trí:</span> {analysis.stairs.locationSector.direction} ({analysis.stairs.locationSector.star.name})</p>
                  {renderFindingsRemedies(findings, remedies)}
              </div>
          </div>
      );
  };

  // 7. Ban Thờ
  const renderAltar = () => {
       if (!analysis.altar) return null;
       const { findings, remedies } = extractAdvice(analysis.altar.advice);
       return (
         <div className="p-6 rounded-3xl border border-amber-100 bg-gradient-to-br from-white to-amber-50/30 shadow-sm mb-6">
             {renderSectionHeader("🕯️", "Ban Thờ (Tâm Linh)", "Nơi tôn nghiêm nhất, cần Tọa Cát Hướng Cát")}
             <div className="grid md:grid-cols-2 gap-4 mb-4">
                 <div className={`p-4 rounded-2xl border bg-white ${!analysis.altar.locationSector.isSittingBad ? 'border-emerald-100' : 'border-rose-100'}`}>
                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Tọa</p>
                     <p className="font-bold text-slate-800">{analysis.altar.locationSector.direction} ({analysis.altar.locationSector.star.name})</p>
                 </div>
                 <div className={`p-4 rounded-2xl border bg-white ${analysis.altar.facingSector.isFacingGood ? 'border-emerald-100' : 'border-rose-100'}`}>
                     <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-1">Hướng</p>
                     <p className="font-bold text-slate-800">{analysis.altar.facingSector.direction} ({analysis.altar.facingSector.star.name})</p>
                 </div>
             </div>
             {renderFindingsRemedies(findings, remedies)}
         </div>
       );
  }

  return (
    <div className="space-y-8 p-8 bg-white rounded-3xl shadow-xl shadow-slate-200/50 border border-slate-100">
      
      {/* Header Summary */}
      <div className="text-center border-b pb-8 border-slate-100">
        <h2 className="text-3xl font-bold text-slate-800 serif mb-3">Luận Giải Phong Thủy Dương Trạch</h2>
        <div className="flex justify-center items-center gap-6 mt-6">
          <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Mệnh Chủ</p>
            <p className="text-xl font-bold text-slate-800 serif">{analysis.menhQuai.name} <span className="text-sm font-sans font-normal text-slate-500">({analysis.menhQuai.element})</span></p>
            <p className="text-xs font-bold text-teal-600 mt-1 bg-teal-50 px-2 py-0.5 rounded-full inline-block">{analysis.menhQuai.group}</p>
          </div>
          <div className="bg-slate-50 px-6 py-4 rounded-2xl border border-slate-200">
             <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Điểm Cát Lợi</p>
             <p className={`text-3xl font-bold ${analysis.overallScore >= 50 ? 'text-emerald-500' : 'text-rose-500'}`}>
               {analysis.overallScore}<span className="text-lg text-slate-400 font-normal">/100</span>
             </p>
          </div>
        </div>
      </div>

      {/* Main Content Flow */}
      
      {renderMainDoor()}
      
      {renderLivingRoom()}
      
      {renderKitchen()}
      
      {renderAltar()}
      
      {renderBedrooms()}
      
      {renderWC()}
      
      {renderStairs()}

      {/* Sector Table */}
      <div>
        <h3 className="text-xl font-bold text-slate-800 mb-5 serif pl-2 border-l-4 border-teal-500">Tra Cứu 8 Cung (Du Niên)</h3>
        <div className="overflow-x-auto rounded-2xl border border-slate-200 shadow-sm">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-xs tracking-wider">
              <tr>
                <th className="px-5 py-4 border-b border-slate-200">Hướng</th>
                <th className="px-5 py-4 border-b border-slate-200">Sao</th>
                <th className="px-5 py-4 border-b border-slate-200">Tính Chất</th>
                <th className="px-5 py-4 border-b border-slate-200">Ứng Dụng & Hóa Giải</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analysis.sectors.map((sector, idx) => (
                <tr key={idx} className={sector.star.good ? 'bg-white hover:bg-slate-50/50' : 'bg-rose-50/10 hover:bg-rose-50/20'}>
                  <td className="px-5 py-4 font-semibold text-slate-700">{sector.direction}</td>
                  <td className="px-5 py-4"><span className={`px-2.5 py-1 rounded-full text-[11px] font-bold whitespace-nowrap border ${sector.star.good ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>{sector.star.name}</span></td>
                  <td className="px-5 py-4 font-medium text-slate-500">{sector.star.good ? 'CÁT' : 'HUNG'}</td>
                  <td className="px-5 py-4 text-slate-600">
                    <p className="mb-1.5">{sector.star.description}</p>
                    {sector.star.good 
                        ? <p className="text-[11px] font-bold text-emerald-600 bg-emerald-50/50 p-1.5 rounded inline-block">Nên đặt: Cửa chính, Phòng ngủ, Ban thờ.</p>
                        : <p className="text-[11px] font-bold text-rose-600 bg-rose-50/50 p-1.5 rounded inline-block">Nên đặt: Bếp (Tọa), WC, Kho.</p>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Report;