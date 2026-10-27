import { useTranslation } from "react-i18next";
import { Languages } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "../../i18n";
import { useAuth } from "../../context/AuthContext";

const SHORT_LABELS = { en: "EN", si: "සිං" };

// Compact EN | සිං switch. Saves the choice to the user's profile when logged in.
const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const { changeLanguage } = useAuth();

  return (
    <div role="group" aria-label={t("language.label")} className="inline-flex items-center gap-0.5 rounded-md border border-gray-200 bg-white p-0.5 text-gray-500">
      <Languages className="mx-1 h-4 w-4" aria-hidden="true" />
      {SUPPORTED_LANGUAGES.map((language) => (
        <button
          key={language}
          type="button"
          lang={language}
          onClick={() => changeLanguage(language)}
          aria-pressed={i18n.language === language}
          title={t(`language.${language}`)}
          className={`rounded px-2 py-0.5 text-xs font-semibold transition-colors ${
            i18n.language === language ? "bg-leaf-700 text-white" : "hover:bg-gray-100 hover:text-gray-900"
          }`}
        >
          {SHORT_LABELS[language]}
        </button>
      ))}
    </div>
  );
};

export default LanguageSwitcher;
