import { Leaf } from "lucide-react";
import { useTranslation } from "react-i18next";

const BrandMark = ({ tone = "light", showTagline = true }) => {
  const { t } = useTranslation();
  const dark = tone === "dark";

  return (
    <div className="flex items-center gap-3">
      <div className={`rounded-xl p-2 ${dark ? "bg-white/10 text-gold-300" : "bg-tea-700 text-gold-300"}`}>
        <Leaf className="h-6 w-6" aria-hidden="true" />
      </div>
      <div className="leading-tight">
        <p className={`text-lg font-bold ${dark ? "text-white" : "text-gray-900"}`}>{t("app.name")}</p>
        {showTagline && (
          <p className={`text-xs ${dark ? "text-tea-100/80" : "text-gray-500"}`}>{t("app.tagline")}</p>
        )}
      </div>
    </div>
  );
};

export default BrandMark;
