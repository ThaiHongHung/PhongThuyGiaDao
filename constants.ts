import { BatQuai, NguHanh, BaguaDirection, StarQuality, StarType } from './types';

export const STAR_DEFINITIONS: Record<StarQuality, StarType> = {
  [StarQuality.SINH_KHI]: { name: StarQuality.SINH_KHI, good: true, element: NguHanh.MOC, description: "Thu hút tài lộc, danh tiếng, thăng quan phát tài." },
  [StarQuality.THIEN_Y]: { name: StarQuality.THIEN_Y, good: true, element: NguHanh.THO, description: "Cải thiện sức khỏe, trường thọ." },
  [StarQuality.DIEN_NIEN]: { name: StarQuality.DIEN_NIEN, good: true, element: NguHanh.KIM, description: "Củng cố các mối quan hệ tình cảm, gia đình." },
  [StarQuality.PHUC_VI]: { name: StarQuality.PHUC_VI, good: true, element: NguHanh.MOC, description: "Củng cố sức mạnh tinh thần, mang lại sự tiến bộ." },
  [StarQuality.TUYET_MENH]: { name: StarQuality.TUYET_MENH, good: false, element: NguHanh.KIM, description: "Phá sản, bệnh tật chết người." },
  [StarQuality.NGU_QUY]: { name: StarQuality.NGU_QUY, good: false, element: NguHanh.HOA, description: "Mất nguồn thu nhập, việc làm, cãi lộn." },
  [StarQuality.LUC_SAT]: { name: StarQuality.LUC_SAT, good: false, element: NguHanh.THUY, description: "Xáo trộn trong quan hệ tình cảm, thù hận, kiện tụng." },
  [StarQuality.HOA_HAI]: { name: StarQuality.HOA_HAI, good: false, element: NguHanh.THO, description: "Không may mắn, thị phi, thất bại." },
};

// Mapping Kua Number (1-9) to Directions and their Stars
// Order: North, NE, East, SE, South, SW, West, NW (Clockwise from North)
// North starts at index 0.
export const KUA_MAP: Record<number, StarQuality[]> = {
  1: [ // Khảm (North)
    StarQuality.PHUC_VI, StarQuality.NGU_QUY, StarQuality.THIEN_Y, StarQuality.SINH_KHI, StarQuality.DIEN_NIEN, StarQuality.TUYET_MENH, StarQuality.HOA_HAI, StarQuality.LUC_SAT
  ],
  2: [ // Khôn (SW)
    StarQuality.TUYET_MENH, StarQuality.SINH_KHI, StarQuality.HOA_HAI, StarQuality.NGU_QUY, StarQuality.LUC_SAT, StarQuality.PHUC_VI, StarQuality.THIEN_Y, StarQuality.DIEN_NIEN
  ],
  3: [ // Chấn (East)
    StarQuality.THIEN_Y, StarQuality.LUC_SAT, StarQuality.PHUC_VI, StarQuality.DIEN_NIEN, StarQuality.SINH_KHI, StarQuality.HOA_HAI, StarQuality.TUYET_MENH, StarQuality.NGU_QUY
  ],
  4: [ // Tốn (SE)
    StarQuality.SINH_KHI, StarQuality.TUYET_MENH, StarQuality.DIEN_NIEN, StarQuality.PHUC_VI, StarQuality.THIEN_Y, StarQuality.NGU_QUY, StarQuality.LUC_SAT, StarQuality.HOA_HAI
  ],
  5: [], // Male = 2, Female = 8. Handled in logic.
  6: [ // Càn (NW)
    StarQuality.LUC_SAT, StarQuality.THIEN_Y, StarQuality.NGU_QUY, StarQuality.HOA_HAI, StarQuality.TUYET_MENH, StarQuality.DIEN_NIEN, StarQuality.SINH_KHI, StarQuality.PHUC_VI
  ],
  7: [ // Đoài (West)
    StarQuality.HOA_HAI, StarQuality.DIEN_NIEN, StarQuality.TUYET_MENH, StarQuality.LUC_SAT, StarQuality.NGU_QUY, StarQuality.THIEN_Y, StarQuality.PHUC_VI, StarQuality.SINH_KHI
  ],
  8: [ // Cấn (NE)
    StarQuality.NGU_QUY, StarQuality.PHUC_VI, StarQuality.LUC_SAT, StarQuality.TUYET_MENH, StarQuality.HOA_HAI, StarQuality.SINH_KHI, StarQuality.DIEN_NIEN, StarQuality.THIEN_Y
  ],
  9: [ // Ly (South)
    StarQuality.DIEN_NIEN, StarQuality.HOA_HAI, StarQuality.SINH_KHI, StarQuality.THIEN_Y, StarQuality.PHUC_VI, StarQuality.LUC_SAT, StarQuality.NGU_QUY, StarQuality.TUYET_MENH
  ],
};

export const DIRECTIONS_ORDER = [
  BaguaDirection.NORTH,
  BaguaDirection.NORTHEAST,
  BaguaDirection.EAST,
  BaguaDirection.SOUTHEAST,
  BaguaDirection.SOUTH,
  BaguaDirection.SOUTHWEST,
  BaguaDirection.WEST,
  BaguaDirection.NORTHWEST,
];
