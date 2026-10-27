// Greenhouse code in the current language, e.g. "Nuwara Eliya GH-01" / "නුවරඑළිය GH-01".
// The stored code (always English) stays the identifier; this is display only.
export const displayCode = (t, greenhouse) =>
  greenhouse ? `${t(`districts.${greenhouse.district}`)} GH-${String(greenhouse.number).padStart(2, "0")}` : "";

export const SYSTEM_TYPES = ["nft", "dwc", "growBag", "ebbFlow", "vertical"];
export const GREENHOUSE_STATUSES = ["active", "maintenance", "inactive"];

export const GREENHOUSE_STATUS_STYLES = {
  active: "bg-leaf-50 text-leaf-700 ring-leaf-500/25",
  maintenance: "bg-gold-100 text-gold-600 ring-gold-400/40",
  inactive: "bg-gray-100 text-gray-500 ring-gray-200"
};
