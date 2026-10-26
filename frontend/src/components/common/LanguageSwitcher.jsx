import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { useAuth } from "../../context/AuthContext";

const SHORT_LABELS = { en: "EN", si: "සිං" };

// Segmented EN | සිං switch. Saves the choice to the user's profile when logged in.
const LanguageSwitcher = ({ tone = "light" }) => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useAuth();

  const base = tone === "dark"
    ? "border-white/15 bg-white/10 text-white/70"
    : "border-gray-200 bg-white text-gray-500";
  const active = tone === "dark" ? "bg-white text-tea-800" : "bg-tea-700 text-white";

  return (
    <div role="group" aria-label={t("language.label")} className={`inline-flex items-center gap-1 rounded-xl border p-1 ${base}`}>
      <Languages className="ml-1.5 h-4 w-4" aria-hidden="true" />
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          onClick={() => changeLanguage(language)}
          aria-pressed={i18n.language === language}
          title={t(`language.${language}`)}
          className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
            i18n.language === language ? active : "hover:text-current hover:bg-black/5"
          }`}
        >
          {SHORT_LABELS[language]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
