// Maps a Fundi skill code → its specializations type code
export const FUNDI_SKILL_SPECS_CODE: Record<string, string> = {
  mason:                  'FUNDI_MASON_SPECS',
  electrician:            'FUNDI_ELECTRICIAN_SPECS',
  plumber:                'FUNDI_PLUMBER_SPECS',
  carpenter:              'FUNDI_CARPENTER_SPECS',
  painter:                'FUNDI_PAINTER_SPECS',
  welder:                 'FUNDI_WELDER_SPECS',
  'tile-fixer':           'FUNDI_TILER_SPECS',
  roofer:                 'FUNDI_ROOFER_SPECS',
  'glass-aluminium-fitter': 'FUNDI_GLASS_ALUMINIUM_SPECS',
};

// Maps a Contractor category code → its specializations type code
export const CONTRACTOR_CATEGORY_SPECS_CODE: Record<string, string> = {
  'building-works':   'CONTRACTOR_BUILDING_SPECS',
  'electrical-works': 'CONTRACTOR_ELECTRICAL_SPECS',
  'mechanical-works': 'CONTRACTOR_MECHANICAL_SPECS',
  'road-works':       'CONTRACTOR_ROAD_SPECS',
  'water-works':      'CONTRACTOR_WATER_SPECS',
};

// Maps a Professional category code → its specializations type code
export const PROFESSIONAL_CATEGORY_SPECS_CODE: Record<string, string> = {
  architecture:             'PROFESSIONAL_ARCHITECTURE_SPECS',
  engineering:              'PROFESSIONAL_ENGINEERING_SPECS',
  'construction-management':'PROFESSIONAL_CONSTRUCTION_MGMT_SPECS',
  'project-management':     'PROFESSIONAL_PROJECT_MGMT_SPECS',
  surveying:                'PROFESSIONAL_SURVEYING_SPECS',
};

// Maps builder type → its category type code (Contractor & Professional only)
export const BUILDER_CATEGORY_TYPE_CODE: Record<string, string> = {
  CONTRACTOR:   'CONTRACTOR_CATEGORIES',
  PROFESSIONAL: 'PROFESSIONAL_CATEGORIES',
};