import React from 'react';
import { FengShuiAnalysis, StarQuality, FeatureAnalysis } from '../types';

interface ReportProps {
  analysis: FengShuiAnalysis;
}

const Report: React.FC<ReportProps> = ({ analysis }) => {
  
  // Helper to split kitchen advice
  const renderKitchenAdvice = () => {
    if (!analysis.kitchen) return null;

    const findings = analysis.kitchen.advice.filter(item => item.startsWith('✅') || item.startsWith('⚠️'));
    const remedies = analysis.kitchen.advice.filter(item => !item.startsWith('✅') && !item.startsWith('⚠️'));

    return (
      <div className="space-y-4 mt-6">
         {/* Findings Section */}
        {findings.length > 0 && (
          <div className="bg-white p-5 rounded-lg border border-stone-200 shadow-sm">
            <h4 className="font-bold text-stone-800 mb-3 border-b border-stone-100 pb-2">
                🔎 Kết quả phân tích
            </h4>
            <ul className="space-y-3">
              {findings.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-stone-700 text-sm">
                    <span className="shrink-0 text-base">{item.startsWith('✅') ? '✅' : '⚠️'}</span>
                    <span>{item.substring(2).trim()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Remedies Section */}
        {remedies.length > 0 && (
          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-200 shadow-sm">
            <h4 className="font-bold text-emerald-800 mb-3 flex items-center gap-2 border-b border-emerald-200 pb-2">
                <span>🍃</span> Hóa giải & Lời khuyên
            </h4>
            <ul className="space-y-3">
              {remedies.map((item, i) => (
                <li key={i} className="flex items-start gap-2 text-emerald-900 text-sm font-medium">
                   <span className="shrink-0 mt-0.5">•</span>
                   <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const renderFeatureCard = (feature: FeatureAnalysis | undefined, icon: string, colorClass: string, borderColorClass: string, title: string) => {
    if (!feature) return null;
    
    return (
        <div className={`p-6 rounded-lg border shadow-sm mb-6 ${colorClass} ${borderColorClass}`}>
            <h3 className="text-xl font-bold text-stone-800 mb-4 flex items-center gap-2">
                <span>{icon}</span> {title}
            </h3>
            
            <div className="flex flex-col gap-4">
                 <div className="flex items-center gap-3 bg-white/60 p-3 rounded-lg border border-stone-100">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl font-bold ${feature.isGoodPlacement ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {feature.isGoodPlacement ? '✓' : '!'}
                    </div>
                    <div>
                        <p className="text-xs text-stone-500 font-bold uppercase">Cung Vị</p>
                        <p className="font-bold text-stone-800">{feature.locationSector.direction} - {feature.locationSector.star.name}</p>
                    </div>
                 </div>

                 <ul className="space-y-2">
                    {feature.advice.map((item, i) => (
                        <li key={i} className="text-sm text-stone-700 bg-white p-3 rounded-lg border border-stone-100 shadow-sm">
                            {item}
                        </li>
                    ))}
                 </ul>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 p-6 bg-white rounded-xl shadow-lg border border-amber-100">
      
      {/* Header Summary */}
      <div className="text-center border-b pb-6 border-stone-200">
        <h2 className="text-3xl font-bold text-amber-700 serif mb-2">Báo Cáo Phong Thủy Bát Trạch</h2>
        <div className="flex justify-center items-center gap-4 mt-4">
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
            <p className="text-xs text-stone-500 uppercase tracking-wide">Mệnh Quái</p>
            <p className="text-xl font-bold text-stone-800">{analysis.menhQuai.name} ({analysis.menhQuai.element})</p>
            <p className="text-sm text-stone-600">{analysis.menhQuai.group}</p>
          </div>
          <div className="bg-stone-50 p-4 rounded-lg border border-stone-200">
             <p className="text-xs text-stone-500 uppercase tracking-wide">Điểm Số</p>
             <p className={`text-3xl font-bold ${analysis.overallScore >= 50 ? 'text-green-600' : 'text-red-600'}`}>
               {analysis.overallScore}/100
             </p>
          </div>
        </div>
      </div>

      {/* General Advice Section */}
      <div className="bg-amber-50 p-6 rounded-lg border-l-4 border-amber-500">
        <h3 className="text-lg font-bold text-amber-800 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z" /></svg>
            Lời Khuyên Tổng Quan
        </h3>
        <ul className="list-disc list-inside space-y-2 text-stone-700">
          {analysis.advice.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>

      {/* Feature Analysis */}
      {renderFeatureCard(analysis.mainDoor, "🚪", "bg-sky-50", "border-sky-200", "Phân Tích Cửa Chính")}
      {renderFeatureCard(analysis.toilet, "🚽", "bg-slate-50", "border-slate-200", "Phân Tích Vệ Sinh")}
      {renderFeatureCard(analysis.stairs, "🪜", "bg-purple-50", "border-purple-200", "Phân Tích Cầu Thang")}

      {/* Kitchen Analysis Section */}
      {analysis.kitchen ? (
        <div className="bg-orange-50 p-6 rounded-lg border border-orange-200 shadow-sm">
            <h3 className="text-xl font-bold text-orange-800 mb-6 serif flex items-center gap-2">
                <span>🔥</span> Phân Tích Táo Vị (Bếp)
            </h3>
            
            <div className="grid md:grid-cols-2 gap-6">
                <div className={`p-5 rounded-lg border shadow-sm transition-colors ${analysis.kitchen.locationSector.isSittingBad ? 'bg-green-100 border-green-300' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">Vị Trí (Tọa)</p>
                        <span className="text-2xl">{analysis.kitchen.locationSector.isSittingBad ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="font-bold text-xl text-stone-800">{analysis.kitchen.locationSector.direction}</p>
                        <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${analysis.kitchen.locationSector.star.good ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {analysis.kitchen.locationSector.star.name}
                        </span>
                    </div>
                    <p className={`text-sm mt-3 font-medium ${analysis.kitchen.locationSector.isSittingBad ? 'text-green-700' : 'text-red-600'}`}>
                        {analysis.kitchen.locationSector.isSittingBad ? 'Đạt chuẩn "Tọa Hung" (Tốt)' : 'Phạm "Tọa Cát" (Xấu)'}
                    </p>
                </div>

                <div className={`p-5 rounded-lg border shadow-sm transition-colors ${analysis.kitchen.facingSector.isFacingGood ? 'bg-green-100 border-green-300' : 'bg-red-50 border-red-200'}`}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs uppercase font-bold text-stone-500 tracking-wider">Hướng Bếp</p>
                        <span className="text-2xl">{analysis.kitchen.facingSector.isFacingGood ? '✅' : '❌'}</span>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="font-bold text-xl text-stone-800">{analysis.kitchen.facingSector.direction}</p>
                        <span className={`text-sm px-2 py-0.5 rounded-full font-bold ${analysis.kitchen.facingSector.star.good ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'}`}>
                            {analysis.kitchen.facingSector.star.name}
                        </span>
                    </div>
                    <p className={`text-sm mt-3 font-medium ${analysis.kitchen.facingSector.isFacingGood ? 'text-green-700' : 'text-red-600'}`}>
                        {analysis.kitchen.facingSector.isFacingGood ? 'Đạt chuẩn "Hướng Cát" (Tốt)' : 'Phạm "Hướng Hung" (Xấu)'}
                    </p>
                </div>
            </div>

            {renderKitchenAdvice()}
            
        </div>
      ) : (
        <div className="bg-stone-50 p-8 rounded-lg border-2 border-dashed border-stone-300 text-center">
            <p className="text-stone-500 mb-2 font-medium">Chưa có dữ liệu phân tích Bếp</p>
            <p className="text-sm text-stone-400">Vui lòng sử dụng công cụ "Bếp" trên bản vẽ để nhận báo cáo.</p>
        </div>
      )}

      {/* Sector Details Table */}
      <div>
        <h3 className="text-xl font-bold text-stone-800 mb-4 serif">Chi Tiết 8 Cung</h3>
        <div className="overflow-x-auto rounded-lg border border-stone-200">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-stone-100 text-stone-600 font-bold">
              <tr>
                <th className="px-4 py-3 border-b">Hướng</th>
                <th className="px-4 py-3 border-b">Sao (Du Niên)</th>
                <th className="px-4 py-3 border-b">Cát/Hung</th>
                <th className="px-4 py-3 border-b">Ý Nghĩa & Vật Phẩm</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {analysis.sectors.map((sector, idx) => (
                <tr key={idx} className={sector.star.good ? 'bg-white' : 'bg-red-50/30'}>
                  <td className="px-4 py-3 font-medium text-stone-800">{sector.direction}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${sector.star.good ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {sector.star.name}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-stone-600">{sector.star.good ? 'Tốt' : 'Xấu'}</td>
                  <td className="px-4 py-3 text-stone-600">
                    <p className="mb-1 text-stone-800">{sector.star.description}</p>
                    {!sector.star.good && (
                       <p className="text-xs text-amber-600 italic mt-1">
                         👉 Hóa giải: Dùng vật phẩm hành {sector.star.element === 'Kim' ? 'Thủy' : sector.star.element === 'Mộc' ? 'Hỏa' : 'Kim'}.
                       </p>
                    )}
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