import { useTranslation } from "react-i18next";
import { Activity, Languages, Mountain } from "lucide-react";
import BrandMark from "../common/BrandMark";
import HillsIllustration from "../common/HillsIllustration";
import LanguageSwitcher from "../common/LanguageSwitcher";

const FEATURES = [
  { key: "monitoring", icon: Activity },
  { key: "climate", icon: Mountain },
  { key: "language", icon: Languages }
];

// Two-panel layout shared by the login and registration pages
const AuthShell = ({ children }) => {
  const { t } = useTranslation();

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden overflow-hidden bg-gradient-to-b from-tea-900 via-tea-800 to-tea-700 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="relative z-10 flex min-h-0 flex-1 flex-col px-12 pt-12 xl:px-16">
          <BrandMark tone="dark" />
          <div className="mt-12 max-w-md">
            <h1 className="text-4xl font-extrabold leading-tight text-white">
              {t("hero.heading")}
            </h1>
            <p className="mt-5 text-base leading-relaxed text-tea-100/85">{t("hero.text")}</p>
            <ul className="mt-10 space-y-4">
              {FEATURES.map(({ key, icon: Icon }) => (
                <li key={key} className="flex items-center gap-3 text-sm font-medium text-white">
                  <span className="rounded-lg bg-white/10 p-2 text-gold-300">
                    <Icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  {t(`hero.features.${key}`)}
                </li>
              ))}
            </ul>
          </div>
        </div>
        <HillsIllustration className="pointer-events-none h-[26vh] max-h-64 min-h-28 w-full shrink-0" />
        <div className="dumbara-band shrink-0" />
      </aside>

      <main className="flex flex-col px-4 py-6 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <div className="lg:invisible">
            <BrandMark showTagline={false} />
          </div>
          <LanguageSwitcher />
        </div>
        <div className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-md">{children}</div>
        </div>
        <p className="text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {t("app.name")} · {t("app.tagline")}
        </p>
      </main>
    </div>
  );
};

export default AuthShell;
