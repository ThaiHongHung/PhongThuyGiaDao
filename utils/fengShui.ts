import { BatQuai, NguHanh, Gender, FengShuiAnalysis, BaguaDirection, StarQuality, Point, KitchenAnalysis, FeatureAnalysis } from '../types';
import { KUA_MAP, STAR_DEFINITIONS, DIRECTIONS_ORDER } from '../constants';

/**
 * Calculates the Kua Number (Mệnh Quái) based on Lunar Birth Year and Gender.
 * Uses the Sum of Digits method valid for 1900-2099.
 */
export const calculateKuaNumber = (birthYear: number, gender: Gender): number => {
  // 1. Sum all digits of the year until single digit
  let sum = birthYear;
  while (sum > 9) {
      let temp = sum;
      sum = 0;
      while (temp > 0) {
          sum += temp % 10;
          temp = Math.floor(temp / 10);
      }
  }
  
  // 2. Apply formula for 1900-2099
  // Male: 11 - n
  // Female: n + 4
  let kua = 0;
  if (gender === Gender.MALE) {
      kua = 11 - sum;
  } else {
      kua = sum + 4;
  }

  // 3. Reduce to single digit again
  while (kua > 9) {
      let temp = kua;
      kua = 0;
      while (temp > 0) {
          kua += temp % 10;
          temp = Math.floor(temp / 10);
      }
  }

  // 4. Handle Special Case for Kua 5
  if (kua === 5) {
      return gender === Gender.MALE ? 2 : 8;
  }
  // Handle 0 edge case (should not happen with valid math but for safety)
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
 * Calculates the Compass Bearing from Center to a Point on the canvas.
 * Assumes 'Up' on the canvas corresponds to North (0 degrees) by default.
 */
export const calculateBearing = (center: Point, target: Point, houseFacingDegree: number, imageWidth: number, imageHeight: number, compassOffset: number = 0): number => {
  // Convert Percentage points to pixels (relative concept) to get angle
  // Note: Y is down in screen coordinates.
  const cx = center.x * imageWidth;
  const cy = center.y * imageHeight;
  const tx = target.x * imageWidth;
  const ty = target.y * imageHeight;

  const dx = tx - cx;
  const dy = ty - cy;

  // Calculate angle in radians relative to screen positive X axis (Right is 0, Down is 90)
  const angleRad = Math.atan2(dy, dx);
  let angleDeg = angleRad * (180 / Math.PI);

  // Convert to Compass Bearing relative to Screen Up (0 deg)
  // Math: 0 is Right (East on Screen). 
  // Compass: 0 is Up (North on Screen).
  // Screen Up is -90 Math deg.
  // Formula used: Bearing = angleDeg + 90.
  let bearingRelativeToUp = angleDeg + 90;
  
  // Normalize
  bearingRelativeToUp = (bearingRelativeToUp + 360) % 360;

  // Now adjust for Total Compass Rotation (compassOffset includes Image Rotation + Manual Offset).
  // Since visual "Up" is North (0), any point's angle relative to Up IS its Compass Azimuth.
  // Unless the Grid is rotated.
  // If Grid rotates CW (positive offset), the point effectively moves CCW relative to the Grid.
  let trueBearing = (bearingRelativeToUp - compassOffset + 360) % 360;
  return trueBearing;
};

export const getSectorByDegree = (degree: number, kua: number) => {
  // Normalize degree
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

export const analyzeKitchen = (
  kua: number, 
  houseFacing: number, 
  center: Point, 
  kitchen: Point, 
  stoveFacing: number,
  imgW: number = 1000, 
  imgH: number = 1000,
  compassOffset: number = 0
): KitchenAnalysis => {
  const locationDegree = calculateBearing(center, kitchen, houseFacing, imgW, imgH, compassOffset);
  const locSector = getSectorByDegree(locationDegree, kua);
  
  // Note: stoveFacing is already an absolute compass value input by user, no need to offset
  const faceSector = getSectorByDegree(stoveFacing, kua);

  const isSittingBad = !locSector.star.good; // Desired
  const isFacingGood = faceSector.star.good; // Desired

  const advice: string[] = [];
  let score = 50; 

  if (isSittingBad) {
    score += 25;
    advice.push(`✅ Bếp đặt tại cung ${locSector.direction} (${locSector.star.name}) là "Tọa Hung". Bếp thuộc Hỏa sẽ thiêu đốt điều xấu của cung này. Rất tốt!`);
  } else {
    score -= 25;
    advice.push(`⚠️ Cảnh báo: Bếp đặt tại cung ${locSector.direction} (${locSector.star.name}) là "Tọa Cát". Bếp lửa sẽ thiêu đốt cát khí của gia chủ.`);
  }

  if (isFacingGood) {
    score += 25;
    advice.push(`✅ Bếp hướng về ${faceSector.direction} (${faceSector.star.name}) là "Hướng Cát". Đón luồng khí tốt vào nhà.`);
  } else {
    score -= 25;
    advice.push(`⚠️ Cảnh báo: Bếp hướng về ${faceSector.direction} (${faceSector.star.name}) là "Hướng Hung". Gây bất lợi cho gia đạo.`);
  }

  if (!isSittingBad) advice.push("Hóa giải Tọa Cát: Giữ bếp luôn sạch sẽ, gọn gàng. Treo hồ lô gỗ gần bếp để chuyển hóa xung khắc.");
  if (!isFacingGood) advice.push("Hóa giải Hướng Hung: Nếu không thể xoay bếp, hãy sử dụng màu sắc thảm chùi chân tại cửa bếp tương sinh với mệnh gia chủ.");
  advice.push("Lưu ý: Không đặt bếp nấu quá gần bồn rửa (Thủy khắc Hỏa). Khoảng cách tối thiểu nên là 60cm.");

  return {
    locationSector: {
      direction: locSector.direction,
      star: locSector.star,
      isSittingBad
    },
    facingSector: {
      direction: faceSector.direction,
      star: faceSector.star,
      isFacingGood
    },
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
    featureType: 'DOOR' | 'TOILET' | 'STAIRS',
    compassOffset: number = 0
): FeatureAnalysis => {
    const degree = calculateBearing(center, target, houseFacing, imgW, imgH, compassOffset);
    const sector = getSectorByDegree(degree, kua);
    
    let isGoodPlacement = false;
    let score = 0;
    const advice: string[] = [];
    
    if (featureType === 'DOOR') {
        // Door should be in Good Sector
        isGoodPlacement = sector.star.good;
        if (isGoodPlacement) {
            score = 20;
            advice.push(`✅ Cửa chính tại cung ${sector.direction} (${sector.star.name}) là Cát. Đón sinh khí vào nhà.`);
        } else {
            score = -20;
            advice.push(`⚠️ Cửa chính tại cung ${sector.direction} (${sector.star.name}) là Hung. Dễ gặp trắc trở.`);
            advice.push("Hóa giải: Dùng vật phẩm phong thủy trấn trạch hoặc màu thảm tương sinh để cản bớt sát khí.");
        }
    } else if (featureType === 'TOILET') {
        // Toilet should be in Bad Sector (suppress bad)
        isGoodPlacement = !sector.star.good;
        if (isGoodPlacement) {
             score = 15;
             advice.push(`✅ Nhà vệ sinh đặt tại ${sector.direction} (${sector.star.name}) là "Lấy độc trị độc". Giúp trấn áp điều xấu.`);
        } else {
             score = -25; // Very bad to flush away good luck
             advice.push(`❌ Đại kỵ: Nhà vệ sinh đặt tại ${sector.direction} (${sector.star.name}). Làm tiêu tan tài lộc/sức khỏe (Thủy cuốn trôi).`);
             advice.push("Hóa giải: Giữ luôn khô ráo, đóng nắp bồn cầu, trồng cây xanh (Thủy sinh Mộc) để hút bớt nước.");
        }
    } else if (featureType === 'STAIRS') {
        // Stairs roughly similar to Door (Active Qi) - Preferred in Good sectors
        isGoodPlacement = sector.star.good;
        if (isGoodPlacement) {
            score = 10;
            advice.push(`✅ Cầu thang tại ${sector.direction} (${sector.star.name}) giúp dẫn khí tốt lên các tầng.`);
        } else {
            score = -10;
            advice.push(`⚠️ Cầu thang tại ${sector.direction} (${sector.star.name}) là cung xấu. Có thể dẫn khí xấu lan tỏa.`);
        }
    }

    return {
        featureName: featureType === 'DOOR' ? 'Cửa Chính' : featureType === 'TOILET' ? 'Nhà Vệ Sinh' : 'Cầu Thang',
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
      toilet?: Point,
      stairs?: Point,
      width: number, 
      height: number,
      compassOffset?: number 
  }
): FengShuiAnalysis => {
  const menhInfo = getBatQuaiInfo(kua);
  const stars = KUA_MAP[kua];
  
  // Create sectors
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

  // Facing Quality
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

  let overallScore = facingStar.good ? 70 : 40; // Base score

  // Analyze Features
  let kitchenAnalysis: KitchenAnalysis | undefined;
  let mainDoorAnalysis: FeatureAnalysis | undefined;
  let toiletAnalysis: FeatureAnalysis | undefined;
  let stairsAnalysis: FeatureAnalysis | undefined;

  const compassOffset = spatialData?.compassOffset || 0;

  if (spatialData) {
      if (spatialData.kitchen && spatialData.stoveFacing !== undefined) {
          kitchenAnalysis = analyzeKitchen(
              kua, facingDegree, spatialData.center, spatialData.kitchen, spatialData.stoveFacing, spatialData.width, spatialData.height, compassOffset
          );
          if (kitchenAnalysis.score > 50) overallScore += 10; else overallScore -= 10;
      }
      if (spatialData.mainDoor) {
          mainDoorAnalysis = analyzeFeature(kua, facingDegree, spatialData.center, spatialData.mainDoor, spatialData.width, spatialData.height, 'DOOR', compassOffset);
          if (mainDoorAnalysis.isGoodPlacement) overallScore += 10; else overallScore -= 10;
      }
      if (spatialData.toilet) {
          toiletAnalysis = analyzeFeature(kua, facingDegree, spatialData.center, spatialData.toilet, spatialData.width, spatialData.height, 'TOILET', compassOffset);
          if (toiletAnalysis.isGoodPlacement) overallScore += 5; else overallScore -= 10;
      }
      if (spatialData.stairs) {
          stairsAnalysis = analyzeFeature(kua, facingDegree, spatialData.center, spatialData.stairs, spatialData.width, spatialData.height, 'STAIRS', compassOffset);
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
    toilet: toiletAnalysis,
    stairs: stairsAnalysis,
    overallScore: Math.min(100, Math.max(0, overallScore)),
    advice
  };
};