import { BatQuai, NguHanh, Gender, FengShuiAnalysis, BaguaDirection, StarQuality, Point, KitchenAnalysis, FeatureAnalysis, AltarAnalysis } from '../types';
import { KUA_MAP, STAR_DEFINITIONS, DIRECTIONS_ORDER } from '../constants';

/**
 * Calculates the Kua Number (Mệnh Quái) based on Lunar Birth Year and Gender.
 */
export const calculateKuaNumber = (birthYear: number, gender: Gender): number => {
  let sum = birthYear;
  while (sum > 9) {
      let temp = sum;
      sum = 0;
      while (temp > 0) {
          sum += temp % 10;
          temp = Math.floor(temp / 10);
      }
  }
  
  let kua = 0;
  if (gender === Gender.MALE) {
      kua = 11 - sum;
  } else {
      kua = sum + 4;
  }

  while (kua > 9) {
      let temp = kua;
      kua = 0;
      while (temp > 0) {
          kua += temp % 10;
          temp = Math.floor(temp / 10);
      }
  }

  if (kua === 5) {
      return gender === Gender.MALE ? 2 : 8;
  }
  if (kua === 0) return 9; 

  return kua;
};

export const getBatQuaiInfo = (kua: number): { name: BatQuai; element: NguHanh; group: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh' } => {
  switch (kua) {
    case 1: return { name: BatQuai.KHAM, element: NguHanh.THUY, group: 'Đông Tứ Mệnh' };
    case 2: return { name: BatQuai.KHON, element: NguHanh.THO, group: 'Tây Tứ Mệnh' };
    case 3: return { name: BatQuai.CHAN, element: NguHanh.MOC, group: 'Đông Tứ Mệnh' };
    case 4: return { name: BatQuai.TON, element: NguHanh.MOC, group: 'Đông Tứ Mệnh' };
    case 6: return { name: BatQuai.CAN, element: NguHanh.KIM, group: 'Tây Tứ Mệnh' };
    case 7: return { name: BatQuai.DOAI, element: NguHanh.KIM, group: 'Tây Tứ Mệnh' };
    case 8: return { name: BatQuai.CAN_KE, element: NguHanh.THO, group: 'Tây Tứ Mệnh' };
    case 9: return { name: BatQuai.LY, element: NguHanh.HOA, group: 'Đông Tứ Mệnh' };
    default: return { name: BatQuai.KHAM, element: NguHanh.THUY, group: 'Đông Tứ Mệnh' };
  }
};

/**
 * Calculates Bearing from Center to Target.
 */
export const calculateBearing = (center: Point, target: Point, houseFacingDegree: number, imageWidth: number, imageHeight: number, compassOffset: number = 0): number => {
  const cx = center.x * imageWidth;
  const cy = center.y * imageHeight;
  const tx = target.x * imageWidth;
  const ty = target.y * imageHeight;

  const dx = tx - cx;
  const dy = ty - cy;

  const angleRad = Math.atan2(dy, dx);
  let angleDeg = angleRad * (180 / Math.PI);

  let bearingRelativeToUp = angleDeg + 90;
  bearingRelativeToUp = (bearingRelativeToUp + 360) % 360;

  let trueBearing = (bearingRelativeToUp - compassOffset + 360) % 360;
  return trueBearing;
};

export const getSectorByDegree = (degree: number, kua: number) => {
  let d = degree % 360;
  if (d < 0) d += 360;

  const index = Math.round(d / 45) % 8;
  const direction = DIRECTIONS_ORDER[index];
  const starName = KUA_MAP[kua][index];
  return {
    direction,
    star: STAR_DEFINITIONS[starName]
  };
};

// --- Geometric Helpers ---
const getDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
};

const getAngleBetweenPoints = (source: Point, target: Point, compassOffset: number): number => {
    const dy = target.y - source.y;
    const dx = target.x - source.x;
    let theta = Math.atan2(dy, dx) * (180 / Math.PI); 
    let bearing = theta + 90; 
    bearing = (bearing + 360) % 360;
    return (bearing - compassOffset + 360) % 360;
};

// Check if source point is facing the target point
// Tightened tolerance to 15 degrees to be more precise
const isFacingTarget = (source: Point, sourceFacingDegree: number, target: Point, compassOffset: number, tolerance: number = 15): boolean => {
    const angleToTarget = getAngleBetweenPoints(source, target, compassOffset);
    const diff = Math.abs(angleToTarget - sourceFacingDegree);
    return diff < tolerance || diff > (360 - tolerance);
};

// Check if a point is in the "Center Palace" (Trung Cung) - approx inner 20% radius
const isPointInCenter = (p: Point, center: Point): boolean => {
    return getDistance(p, center) < 0.12; 
};

// --- Analyzers ---

export const analyzeKitchen = (
  kua: number, 
  houseFacing: number, 
  center: Point, 
  kitchen: Point, 
  stoveFacing: number,
  imgW: number, 
  imgH: number,
  compassOffset: number,
  toilets: Point[] = [],
  wcDoors: Point[] = [],
  mainDoor: Point | undefined = undefined
): KitchenAnalysis => {
  const locationDegree = calculateBearing(center, kitchen, houseFacing, imgW, imgH, compassOffset);
  const locSector = getSectorByDegree(locationDegree, kua);
  const faceSector = getSectorByDegree(stoveFacing, kua);

  // Expert Logic: Tọa Hung - Hướng Cát
  const isSittingBad = !locSector.star.good; // Desired: Sit on Bad sector
  const isFacingGood = faceSector.star.good; // Desired: Face Good sector

  const advice: string[] = [];
  let score = 50; 

  // 1. Tọa (Vị trí)
  if (isSittingBad) {
    score += 25;
    advice.push(`✅ TỌA ĐÚNG: Bếp đặt tại ${locSector.direction} (${locSector.star.name} - Hung). Vì Bếp mang tính Hỏa, đặt ở cung Hung sẽ đốt cháy điều xấu.`);
  } else {
    score -= 25;
    advice.push(`⚠️ TỌA SAI: Bếp đang đặt tại ${locSector.direction} (${locSector.star.name} - Cát).`);
    advice.push(`Lý do: Đặt bếp (Hỏa) ở cung tốt sẽ thiêu rụi tài lộc và may mắn của cung ${locSector.star.name}. Bếp nên dời về cung xấu.`);
  }

  // 2. Hướng (Miệng lò)
  if (isFacingGood) {
    score += 25;
    advice.push(`✅ HƯỚNG ĐÚNG: Miệng bếp nhìn về ${faceSector.direction} (${faceSector.star.name} - Cát). Giúp nạp sinh khí, nuôi dưỡng gia đạo.`);
  } else {
    score -= 25;
    advice.push(`⚠️ HƯỚNG SAI: Miệng bếp đang nhìn về ${faceSector.direction} (${faceSector.star.name} - Hung).`);
    advice.push(`Lý do: Hướng bếp nạp khí xấu (${faceSector.star.name}) vào thức ăn, gây ảnh hưởng sức khỏe và tài vận.`);
  }

  // 3. Trung Cung Check
  if (isPointInCenter(kitchen, center)) {
      score -= 50;
      advice.push("🚫 ĐẠI KỴ: Bếp đặt tại Trung Cung (Giữa nhà). Hỏa thiêu tâm nhà, gia đạo bất ổn, người trong nhà nóng nảy, bệnh tim mạch.");
  }

  // 4. Thủy Hỏa Xung (Toilet interaction)
  // Use WC Doors if available, otherwise fallback to Toilet center points
  const wcCheckPoints = wcDoors.length > 0 ? wcDoors : toilets;
  
  if (wcCheckPoints.length > 0) {
      let isFacingWC = false;
      
      wcCheckPoints.forEach((wc) => {
          // Check alignment
          // Distance check: If WC is too far (> 40% of image width away), ignore logical clash in simple 2D view to avoid false positives across large houses
          const dist = getDistance(kitchen, wc);
          if (dist < 0.4 && isFacingTarget(kitchen, stoveFacing, wc, compassOffset)) {
              isFacingWC = true;
          }
      });

      if (isFacingWC) {
          score -= 30;
          advice.push("🚫 THỦY HỎA XUNG: Hướng miệng bếp chiếu thẳng vào Cửa WC.");
          advice.push("Tác hại: Uế khí từ WC xộc thẳng vào bếp. Gây bệnh đường tiêu hóa, hao tài tốn của.");
          advice.push("👉 Hóa giải: Luôn đóng cửa WC, treo rèm hạt gỗ, hoặc đổi hướng bếp.");
      }
  }

  // 5. Check Kitchen facing Main Door (Khai Môn Kiến Táo)
  if (mainDoor) {
      // Check if stove facing points to main door (Tolerance 25 degrees)
      if (isFacingTarget(kitchen, stoveFacing, mainDoor, compassOffset, 25)) {
          score -= 40;
          advice.push("🚫 ĐẠI KỴ: Hướng bếp quay thẳng ra Cửa Chính.");
          advice.push("Giải thích: 'Khai môn kiến táo, tài phú đa hao'. Hỏa khí xung khắc với khí từ cửa chính. Tiền tài đội nón ra đi, gia đạo bất hòa.");
          advice.push("👉 Hóa giải: Cần che chắn gấp. Sử dụng bình phong, tủ kệ hoặc vách ngăn giữa bếp và cửa chính.");
      }
  }

  advice.push("💡 Lưu ý: Tránh đặt bếp ngay dưới xà ngang (áp khí). Bếp và bồn rửa không được sát nhau (Thủy khắc Hỏa), cách tối thiểu 60cm.");

  return {
    locationSector: { direction: locSector.direction, star: locSector.star, isSittingBad },
    facingSector: { direction: faceSector.direction, star: faceSector.star, isFacingGood },
    score,
    advice
  };
};

export const analyzeAltar = (
  kua: number,
  houseFacing: number,
  center: Point,
  altar: Point,
  altarFacing: number,
  imgW: number,
  imgH: number,
  compassOffset: number,
  toilets: Point[] = []
): AltarAnalysis => {
    const locationDegree = calculateBearing(center, altar, houseFacing, imgW, imgH, compassOffset);
    const locSector = getSectorByDegree(locationDegree, kua);
    const faceSector = getSectorByDegree(altarFacing, kua);

    const isSittingGood = locSector.star.good; // Desired
    const isFacingGood = faceSector.star.good; // Desired

    const advice: string[] = [];
    let score = 0;

    // Tọa Cát
    if (isSittingGood) {
        score += 50;
        advice.push(`✅ TỐT: Ban thờ tọa tại ${locSector.direction} (${locSector.star.name} - Cát). Vị trí trang nghiêm, tụ linh khí.`);
    } else {
        score -= 20;
        advice.push(`⚠️ XẤU: Ban thờ tọa tại ${locSector.direction} (${locSector.star.name} - Hung). Cần đặt vật phẩm hóa giải (hồ lô, tỳ hưu).`);
    }

    // Hướng Cát
    if (isFacingGood) {
        score += 50;
        advice.push(`✅ TỐT: Ban thờ nhìn về ${faceSector.direction} (${faceSector.star.name} - Cát). Đón phúc lộc.`);
    } else {
        score -= 20;
        advice.push(`⚠️ XẤU: Ban thờ nhìn về ${faceSector.direction} (${faceSector.star.name} - Hung).`);
    }

    // Geometric Checks
    let nearWC = false;
    toilets.forEach(wc => {
        if (getDistance(altar, wc) < 0.12) nearWC = true;
    });
    if (nearWC) {
        score -= 40;
        advice.push("🚫 PHẠM KỴ: Ban thờ đặt sát hoặc tựa lưng vào WC. Uế khí xâm phạm sự tôn nghiêm. Gia đạo lục đục, sức khỏe kém.");
    }
    
    if (isPointInCenter(altar, center)) {
        advice.push("⚠️ Lưu ý: Ban thờ đặt giữa nhà (Trung Cung) cần đảm bảo không bị động khí (lối đi lại quá nhiều).");
    }

    return {
        locationSector: { direction: locSector.direction, star: locSector.star, isSittingBad: !isSittingGood },
        facingSector: { direction: faceSector.direction, star: faceSector.star, isFacingGood },
        score,
        advice
    };
};

export const analyzeFeature = (
    kua: number, 
    houseFacing: number, 
    center: Point, 
    target: Point, 
    imgW: number, 
    imgH: number,
    featureType: 'DOOR' | 'TOILET' | 'STAIRS' | 'BEDROOM',
    labelSuffix: string = '',
    compassOffset: number = 0,
    spatialContext: { toilets?: Point[], wcDoors?: Point[], door?: Point, kitchen?: Point, featureFacing?: number } = {}
): FeatureAnalysis => {
    const degree = calculateBearing(center, target, houseFacing, imgW, imgH, compassOffset);
    const sector = getSectorByDegree(degree, kua);
    
    let isGoodPlacement = false;
    let score = 0;
    const advice: string[] = [];
    
    if (featureType === 'DOOR') {
        isGoodPlacement = sector.star.good;
        if (isGoodPlacement) {
            score = 30;
            advice.push(`✅ Cửa chính nạp khí tại cung ${sector.direction} (${sector.star.name} - Cát). Đại lợi cho tài vận.`);
        } else {
            score = -30;
            advice.push(`⚠️ Cửa chính tại cung ${sector.direction} (${sector.star.name} - Hung). Nạp sát khí vào nhà.`);
            advice.push("👉 Hóa giải: Dùng thảm màu tương sinh trước cửa, treo gương Bát Quái lồi hoặc trồng cây xanh cản sát khí.");
        }
        advice.push("📏 Thước Lỗ Ban: Kích thước thông thủy cửa chính cần rơi vào các cung tốt (Tài, Nghĩa, Quan, Bản) - khoảng 52.2cm đẹp nhất.");
        advice.push("🚫 Kiểm tra Xuyên Tâm Sát: Nếu cửa chính thẳng hàng với cửa hậu hoặc cửa sổ lớn phía sau, tiền bạc đội nón ra đi. Cần đặt bình phong chắn.");
        
        // Check facing WC
        // Prioritize WC Doors if marked, otherwise fallback to WC location
        const wcCheckPoints = (spatialContext.wcDoors && spatialContext.wcDoors.length > 0) 
                              ? spatialContext.wcDoors 
                              : spatialContext.toilets;

        if (wcCheckPoints) {
            wcCheckPoints.forEach(wc => {
                 // Check if Main Door is close/facing WC Door
                 if (getDistance(target, wc) < 0.15) {
                     advice.push("🚫 Cửa chính quá gần hoặc đối diện Cửa WC. Khách vào nhà thấy ngay WC là đại kỵ (Uế khí xung trực).");
                 }
            });
        }
    } 
    else if (featureType === 'TOILET') {
        // WC should be in BAD sector ("Lấy độc trị độc")
        isGoodPlacement = !sector.star.good;
        if (isGoodPlacement) {
             score = 20;
             advice.push(`✅ ${labelSuffix} đặt tại ${sector.direction} (${sector.star.name} - Hung) là hợp lý ("Lấy độc trị độc"). Trấn áp phương xấu.`);
        } else {
             score = -30; 
             advice.push(`❌ ĐẠI KỴ: ${labelSuffix} đặt tại ${sector.direction} (${sector.star.name} - Cát). Làm ô uế phương vị tốt, tiêu tan tài lộc.`);
        }
        
        if (isPointInCenter(target, center)) {
             score -= 50;
             advice.push("🚫 TUYỆT ĐỐI TRÁNH: WC đặt tại Trung Cung (Giữa nhà). Uế khí tỏa đi khắp nhà, bệnh tật triền miên.");
        }
    } 
    else if (featureType === 'STAIRS') {
        // Stairs mostly neutral but prefer Good sectors for start
        isGoodPlacement = sector.star.good;
        
        if (isPointInCenter(target, center)) {
             score -= 30;
             advice.push("⚠️ Cầu thang giữa nhà (Trung Cung) tạo thành cột xoáy khí, chia cắt không gian, không tốt cho tình cảm gia đình.");
        }

        // GEOMETRIC CHECK: Stairs facing Main Door
        if (spatialContext.door && spatialContext.featureFacing !== undefined) {
            // Check if Stairs point to Door
            // Widen tolerance to 45 degrees to ensure detecting "Lao Cầu Thang" more reliably
            const isFacing = isFacingTarget(target, spatialContext.featureFacing, spatialContext.door, compassOffset, 45);
            
            if (isFacing) {
                score -= 50;
                advice.push("🚫 ĐẠI KỴ: Cầu thang đối diện thẳng Cửa Chính (Lao Cầu Thang)."); 
                advice.push("Hiểm họa: 'Cửa mở thấy thang, tiền tài đi mất'. Sinh khí vừa vào cửa đã bị cầu thang dẫn tuột ra ngoài. Gây hao tài tốn của, nhân đinh suy bại.");
                advice.push("👉 Hóa giải: Bắt buộc phải che chắn. Đặt bình phong, tủ kệ hoặc vách ngăn CNC giữa chân cầu thang và cửa. Treo rèm hạt gỗ hoặc quả cầu thủy tinh.");
            }
        }
        advice.push("🔢 Số bậc cầu thang nên rơi vào cung 'Sinh' (công thức 4n+1): 17, 21, 25 bậc.");
    }
    else if (featureType === 'BEDROOM') {
        isGoodPlacement = sector.star.good;
        
        // 1. Location
        if (isGoodPlacement) {
            score = 20;
            advice.push(`✅ Vị trí ${labelSuffix} tại ${sector.direction} (${sector.star.name}) là tốt. Giúp ngủ ngon, an thần.`);
        } else {
            score = -10;
            advice.push(`⚠️ Vị trí ${labelSuffix} tại ${sector.direction} (${sector.star.name}) là cung xấu.`);
        }

        // 2. Facing (Bed Head)
        if (spatialContext.featureFacing !== undefined) {
             const faceSector = getSectorByDegree(spatialContext.featureFacing, kua);
             if (faceSector.star.good) {
                 score += 20;
                 advice.push(`✅ Đầu giường quay về ${faceSector.direction} (${faceSector.star.name} - Cát). Nạp sinh khí khi ngủ.`);
             } else {
                 score -= 20;
                 advice.push(`⚠️ Đầu giường quay về ${faceSector.direction} (${faceSector.star.name} - Hung). Dễ gặp ác mộng, sức khỏe giảm sút.`);
             }
        }
        
        // 3. Interactions
        // 3.1 WC Proximity (Noise, Yin energy)
        if (spatialContext.toilets && spatialContext.toilets.length > 0) {
            let tooClose = false;
            spatialContext.toilets.forEach(wc => {
                if (getDistance(target, wc) < 0.12) tooClose = true;
            });
            if (tooClose) {
                score -= 30;
                advice.push("🚫 ĐẠI KỴ: Đầu giường tựa vào nhà vệ sinh. Vi khuẩn, uế khí và tiếng ồn ảnh hưởng xấu đến sức khỏe, giấc ngủ và tài lộc.");
                advice.push("👉 Di chuyển: Cách tốt nhất là dời giường sang vị trí khác.");
                advice.push("👉 Đóng kín cửa: Luôn đóng kín cửa nhà vệ sinh (đặc biệt cửa phòng tắm) để hạn chế mùi và âm thanh.");
                advice.push("👉 Tăng cường thông gió: Lắp quạt thông gió, mở cửa sổ phòng tắm thường xuyên.");
                advice.push("👉 Vật phẩm phong thủy: Treo tranh núi non, cây cối (không nhọn) để cân bằng năng lượng, dùng đèn/tinh dầu dịu nhẹ.");
            }
        }

        // 3.2 WC Door Facing (Bed facing WC door)
        if (spatialContext.wcDoors && spatialContext.wcDoors.length > 0 && spatialContext.featureFacing !== undefined) {
            let facingWC = false;
             spatialContext.wcDoors.forEach(wcDoor => {
                 // Check if bed is facing this WC door
                 // Tolerance 20 deg
                 if (isFacingTarget(target, spatialContext.featureFacing!, wcDoor, compassOffset, 20)) {
                     facingWC = true;
                 }
             });
             if (facingWC) {
                 score -= 30;
                 advice.push("🚫 ĐẠI KỴ: Đầu giường hoặc chân giường đối diện thẳng cửa WC. Uế khí xộc thẳng vào người ngủ.");
                 advice.push("👉 Hóa giải: Đóng cửa WC thường xuyên, đặt bình phong che chắn.");
             }
        }

        // 3.4 Beams (Static advice)
        advice.push("💡 Lưu ý quan trọng: Tránh xà ngang (dầm nhà) chạy qua đầu giường (Xà Ngang Ép Đỉnh). Gây áp lực tâm lý, mất ngủ.");
    }

    let featureNameStr = '';
    if (featureType === 'DOOR') featureNameStr = 'Cửa Chính';
    else if (featureType === 'TOILET') featureNameStr = labelSuffix || 'Nhà Vệ Sinh';
    else if (featureType === 'BEDROOM') featureNameStr = labelSuffix || 'Phòng Ngủ';
    else featureNameStr = 'Cầu Thang';

    return {
        featureName: featureNameStr,
        locationSector: sector,
        score,
        advice,
        isGoodPlacement
    };
}

export const analyzeFengShui = (
  kua: number, 
  facingDegree: number,
  spatialData?: { 
      center: Point, 
      kitchen?: Point, 
      stoveFacing?: number,
      mainDoor?: Point,
      toilets?: Point[], 
      wcDoors?: Point[], // New argument
      bedrooms?: Point[], 
      bedroomFacings?: number[], 
      altar?: Point,      
      altarFacing?: number, 
      stairs?: Point,
      stairsFacing?: number, 
      width: number, 
      height: number,
      compassOffset?: number 
  }
): FengShuiAnalysis => {
  const menhInfo = getBatQuaiInfo(kua);
  const stars = KUA_MAP[kua];
  
  const sectors = DIRECTIONS_ORDER.map((dir, index) => {
    const starQuality = stars[index];
    const starInfo = STAR_DEFINITIONS[starQuality];
    const baseAngle = index * 45; 
    let start = baseAngle - 22.5;
    let end = baseAngle + 22.5;
    if (start < 0) start += 360; 
    
    return {
      direction: dir,
      degreeStart: start,
      degreeEnd: end,
      star: starInfo,
      score: starInfo.good ? 10 : -10
    };
  });

  // Facing
  let normalizedFacing = facingDegree % 360;
  if (normalizedFacing < 0) normalizedFacing += 360;
  let facingSectorIndex = Math.round(normalizedFacing / 45) % 8;
  const facingQuality = stars[facingSectorIndex];
  const facingStar = STAR_DEFINITIONS[facingQuality];

  const advice: string[] = [];
  if (facingStar.good) {
    advice.push(`Hướng nhà ${DIRECTIONS_ORDER[facingSectorIndex]} (${facingQuality}) là hướng tốt.`);
  } else {
    advice.push(`Hướng nhà ${DIRECTIONS_ORDER[facingSectorIndex]} (${facingQuality}) là hướng xấu. Cần hóa giải.`);
  }

  let overallScore = facingStar.good ? 70 : 40; 

  // Features
  let kitchenAnalysis: KitchenAnalysis | undefined;
  let mainDoorAnalysis: FeatureAnalysis | undefined;
  let toiletAnalyses: FeatureAnalysis[] = []; 
  let bedroomAnalyses: FeatureAnalysis[] = []; 
  let altarAnalysis: AltarAnalysis | undefined; 
  let stairsAnalysis: FeatureAnalysis | undefined;

  const compassOffset = spatialData?.compassOffset || 0;

  if (spatialData) {
      // 1. Kitchen
      if (spatialData.kitchen && spatialData.stoveFacing !== undefined) {
          kitchenAnalysis = analyzeKitchen(
              kua, facingDegree, spatialData.center, spatialData.kitchen, spatialData.stoveFacing, spatialData.width, spatialData.height, compassOffset, spatialData.toilets, spatialData.wcDoors, spatialData.mainDoor
          );
          if (kitchenAnalysis.score > 50) overallScore += 10; else overallScore -= 10;
      }
      
      // 2. Door
      if (spatialData.mainDoor) {
          mainDoorAnalysis = analyzeFeature(kua, facingDegree, spatialData.center, spatialData.mainDoor, spatialData.width, spatialData.height, 'DOOR', '', compassOffset, { toilets: spatialData.toilets, wcDoors: spatialData.wcDoors });
          if (mainDoorAnalysis.isGoodPlacement) overallScore += 10; else overallScore -= 10;
      }
      
      // 3. Toilets
      if (spatialData.toilets && spatialData.toilets.length > 0) {
          spatialData.toilets.forEach((t, i) => {
             const tAnalysis = analyzeFeature(kua, facingDegree, spatialData.center, t, spatialData.width, spatialData.height, 'TOILET', `WC ${i + 1}`, compassOffset);
             toiletAnalyses.push(tAnalysis);
             if (tAnalysis.isGoodPlacement) overallScore += 5; else overallScore -= 10; // Penalize heavy for bad WC placement
          });
      }

      // 4. Bedrooms
      if (spatialData.bedrooms && spatialData.bedrooms.length > 0) {
          spatialData.bedrooms.forEach((b, i) => {
              const bFacing = spatialData.bedroomFacings ? spatialData.bedroomFacings[i] : undefined;
              const bAnalysis = analyzeFeature(
                  kua, facingDegree, spatialData.center, b, spatialData.width, spatialData.height, 'BEDROOM', `Phòng Ngủ ${i + 1}`, compassOffset, 
                  { 
                      toilets: spatialData.toilets, 
                      wcDoors: spatialData.wcDoors, // Pass WC Doors for checking if bed faces WC
                      kitchen: spatialData.kitchen, 
                      featureFacing: bFacing 
                  }
              );
              bedroomAnalyses.push(bAnalysis);
              if (bAnalysis.isGoodPlacement) overallScore += 10; else overallScore -= 5;
          });
      }

      // 5. Altar
      if (spatialData.altar && spatialData.altarFacing !== undefined) {
          altarAnalysis = analyzeAltar(
              kua, facingDegree, spatialData.center, spatialData.altar, spatialData.altarFacing, spatialData.width, spatialData.height, compassOffset, spatialData.toilets
          );
           if (altarAnalysis.score > 50) overallScore += 15; else overallScore -= 15;
      }

      // 6. Stairs
      if (spatialData.stairs) {
          stairsAnalysis = analyzeFeature(kua, facingDegree, spatialData.center, spatialData.stairs, spatialData.width, spatialData.height, 'STAIRS', '', compassOffset, { door: spatialData.mainDoor, featureFacing: spatialData.stairsFacing });
          if (stairsAnalysis.isGoodPlacement) overallScore += 5; else overallScore -= 5;
      }
  }

  // House Trach Calculation
  let sittingDegree = (normalizedFacing + 180) % 360;
  let sittingIndex = Math.round(sittingDegree / 45) % 8;
  const sittingTrigramMap: Record<number, BatQuai> = {
    0: BatQuai.KHAM, 1: BatQuai.CAN_KE, 2: BatQuai.CHAN, 3: BatQuai.TON,
    4: BatQuai.LY, 5: BatQuai.KHON, 6: BatQuai.DOAI, 7: BatQuai.CAN 
  };
  const houseTrachName = sittingTrigramMap[sittingIndex];
  const houseGroup = [0, 2, 3, 4].includes(sittingIndex) ? 'Đông Tứ Trạch' : 'Tây Tứ Trạch';
  const elementMap: Record<BatQuai, NguHanh> = {
    [BatQuai.KHAM]: NguHanh.THUY, [BatQuai.CAN_KE]: NguHanh.THO, [BatQuai.CHAN]: NguHanh.MOC,
    [BatQuai.TON]: NguHanh.MOC, [BatQuai.LY]: NguHanh.HOA, [BatQuai.KHON]: NguHanh.THO,
    [BatQuai.DOAI]: NguHanh.KIM, [BatQuai.CAN]: NguHanh.KIM
  };

  return {
    menhQuai: { ...menhInfo, number: kua },
    houseTrach: {
      name: houseTrachName,
      group: houseGroup,
      element: elementMap[houseTrachName]
    },
    sectors,
    kitchen: kitchenAnalysis,
    mainDoor: mainDoorAnalysis,
    toilets: toiletAnalyses.length > 0 ? toiletAnalyses : undefined,
    bedrooms: bedroomAnalyses.length > 0 ? bedroomAnalyses : undefined, 
    altar: altarAnalysis, 
    stairs: stairsAnalysis,
    overallScore: Math.min(100, Math.max(0, overallScore)),
    advice
  };
};