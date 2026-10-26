import { useTranslation } from "react-i18next";
import LeafLogo from "./LeafLogo";

const SIZES = {
  md: { logo: "h-10 w-10", name: "text-xl", tagline: "text-xs" },
  lg: { logo: "h-16 w-16", name: "text-3xl", tagline: "text-base" }
};

const BrandMark = ({ size = "md", showTagline = true }) => {
  const { t } = useTranslation();
  const styles = SIZES[size];

  return (
    <div className="flex items-center gap-3">
      <LeafLogo className={styles.logo} />
      <div className="leading-tight">
        <p className={`font-extrabold tracking-tight ${styles.name}`}>
          <span className="text-gray-900">Hydro_</span>
          <span className="text-leaf-600">Grid</span>
        </p>
        {showTagline && <p className={`text-gray-600 ${styles.tagline}`}>{t("app.tagline")}</p>}
      </div>
    </div>
  );
};

export default BrandMark;
