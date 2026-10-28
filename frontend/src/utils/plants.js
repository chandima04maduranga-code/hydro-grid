// Crop record options. Mirrors backend/config/plants.js; labels come from
// i18n "plants.cropTypes.*", "plants.stages.*" and "plants.health.*".
export const CROP_TYPES = ["leafyGreen", "fruitVegetable", "fruit", "herb", "rootVegetable"];
export const GROWTH_STAGES = ["seedling", "vegetative", "flowering", "fruiting", "harvestReady"];
export const HEALTH_STATUSES = ["healthy", "nutrientWarning", "pestRisk", "critical"];
export const SORTS = ["newest", "oldest", "name", "-name", "harvest", "planted"];

export const EDITOR_ROLES = ["admin", "farm_manager"];
export const canEditPlants = (user) => EDITOR_ROLES.includes(user?.role);

export const HEALTH_STYLES = {
  healthy: { dot: "bg-emerald-500", chip: "bg-emerald-100 text-emerald-800" },
  nutrientWarning: { dot: "bg-amber-500", chip: "bg-amber-100 text-amber-800" },
  pestRisk: { dot: "bg-orange-500", chip: "bg-orange-100 text-orange-800" },
  critical: { dot: "bg-red-600", chip: "bg-red-100 text-red-800" }
};

export const STAGE_STYLES = {
  seedling: "bg-lime-50 text-lime-800",
  vegetative: "bg-leaf-50 text-leaf-800",
  flowering: "bg-pink-50 text-pink-800",
  fruiting: "bg-orange-50 text-orange-800",
  harvestReady: "bg-amber-50 text-amber-800"
};

const NODE_ID_PATTERN = /^[A-Za-z0-9_-]{2,40}$/;
const MAX_PLANT_COUNT = 100000;

const isImageUrl = (value) => {
  if (!value) return true;
  try {
    return ["https:", "http:"].includes(new URL(value).protocol);
  } catch {
    return false;
  }
};

// Same checks as the server; returns { field: errorCode }
export const validatePlantForm = (form) => {
  const errors = {};
  if (!form.name.trim()) errors.name = "REQUIRED";
  else if (form.name.trim().length > 80) errors.name = "TOO_LONG";
  if (!form.species.trim()) errors.species = "REQUIRED";
  else if (form.species.trim().length > 120) errors.species = "TOO_LONG";
  if (!form.greenhouse) errors.greenhouse = "REQUIRED";
  if (!CROP_TYPES.includes(form.cropType)) errors.cropType = "REQUIRED";
  if (!GROWTH_STAGES.includes(form.growthStage)) errors.growthStage = "REQUIRED";
  if (!HEALTH_STATUSES.includes(form.healthStatus)) errors.healthStatus = "REQUIRED";
  if (form.systemId && !NODE_ID_PATTERN.test(form.systemId)) errors.systemId = "INVALID_NODE_ID";
  if (form.plantCount !== "") {
    const count = Number(form.plantCount);
    if (!(Number.isInteger(count) && count >= 1 && count <= MAX_PLANT_COUNT)) errors.plantCount = "INVALID_COUNT";
  }
  if (form.plantedOn && form.expectedHarvestOn && form.expectedHarvestOn < form.plantedOn) {
    errors.expectedHarvestOn = "HARVEST_BEFORE_PLANTING";
  }
  if (!isImageUrl(form.image.trim())) errors.image = "INVALID_URL";
  if (form.notes.length > 500) errors.notes = "TOO_LONG";
  return errors;
};

// "2026-12-01T00:00:00.000Z" → "2026-12-01" for <input type="date">
export const toDateInput = (value) => (value ? new Date(value).toISOString().slice(0, 10) : "");

// Whole days from today until the date (negative when it has passed)
export const daysUntil = (value) => {
  if (!value) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(value);
  target.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
};
