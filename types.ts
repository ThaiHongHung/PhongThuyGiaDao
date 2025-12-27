// Enums for Feng Shui Concepts

export enum Gender {
  MALE = 'Nam',
  FEMALE = 'Nữ',
}

export enum BatQuai {
  CAN = 'Càn',
  KHAM = 'Khảm',
  CAN_KE = 'Cấn',
  CHAN = 'Chấn',
  TON = 'Tốn',
  LY = 'Ly',
  KHON = 'Khôn',
  DOAI = 'Đoài',
}

export enum NguHanh {
  KIM = 'Kim',
  MOC = 'Mộc',
  THUY = 'Thủy',
  HOA = 'Hỏa',
  THO = 'Thổ',
}

export enum BaguaDirection {
  NORTH = 'Bắc',
  NORTHEAST = 'Đông Bắc',
  EAST = 'Đông',
  SOUTHEAST = 'Đông Nam',
  SOUTH = 'Nam',
  SOUTHWEST = 'Tây Nam',
  WEST = 'Tây',
  NORTHWEST = 'Tây Bắc',
}

export enum StarQuality {
  SINH_KHI = 'Sinh Khí', // Đại Cát
  THIEN_Y = 'Thiên Y',   // Trung Cát
  DIEN_NIEN = 'Diên Niên', // Tiểu Cát
  PHUC_VI = 'Phục Vị',   // Tiểu Cát
  TUYET_MENH = 'Tuyệt Mệnh', // Đại Hung
  NGU_QUY = 'Ngũ Quỷ',   // Trung Hung
  LUC_SAT = 'Lục Sát',   // Tiểu Hung
  HOA_HAI = 'Họa Hại',   // Tiểu Hung
}

export type StarType = {
  name: StarQuality;
  good: boolean;
  element: NguHanh;
  description: string;
};

// Input Data Structure
export interface UserProfile {
  name: string;
  birthYear: number; // Lunar Year
  gender: Gender;
}

export interface Point {
  x: number;
  y: number;
}

export interface HouseInfo {
  facingDegree: number; // 0-360
  imageFile: File | null;
  imageUrl: string | null;
  centerPoint?: Point; // Percentage 0-1
  kitchenPoint?: Point; // Percentage 0-1
  doorPoint?: Point;
  toiletPoints?: Point[]; 
  wcDoorPoints?: Point[]; // New: Toilet Doors for facing checks
  bedroomPoints?: Point[]; 
  bedroomFacings?: number[]; 
  altarPoint?: Point; 
  stairsPoint?: Point;
  stoveFacingDegree?: number; 
  altarFacingDegree?: number; 
  stairsFacingDegree?: number; 
}

// Analysis Result Data Structure
export interface KitchenAnalysis {
  locationSector: {
    direction: BaguaDirection;
    star: StarType;
    isSittingBad: boolean; // True if sitting in Hung (Desired)
  };
  facingSector: {
    direction: BaguaDirection;
    star: StarType;
    isFacingGood: boolean; // True if facing Cat (Desired)
  };
  score: number;
  advice: string[];
}

export interface FeatureAnalysis {
  featureName: string;
  locationSector: {
    direction: BaguaDirection;
    star: StarType;
  };
  score: number;
  advice: string[];
  isGoodPlacement: boolean; 
}

// Specific analysis for Altar (Tọa Cát Hướng Cát)
export interface AltarAnalysis extends KitchenAnalysis {} 

export interface FengShuiAnalysis {
  menhQuai: {
    number: number;
    name: BatQuai;
    element: NguHanh;
    group: 'Đông Tứ Mệnh' | 'Tây Tứ Mệnh';
  };
  houseTrach: {
    name: BatQuai;
    group: 'Đông Tứ Trạch' | 'Tây Tứ Trạch';
    element: NguHanh;
  };
  sectors: Array<{
    direction: BaguaDirection;
    degreeStart: number;
    degreeEnd: number;
    star: StarType;
    score: number;
  }>;
  kitchen?: KitchenAnalysis;
  mainDoor?: FeatureAnalysis;
  toilets?: FeatureAnalysis[];
  bedrooms?: FeatureAnalysis[]; // New
  altar?: AltarAnalysis; // New
  stairs?: FeatureAnalysis;
  overallScore: number;
  advice: string[];
}