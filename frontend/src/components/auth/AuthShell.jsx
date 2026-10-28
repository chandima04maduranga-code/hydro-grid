import { useTranslation } from "react-i18next";
import { ChartColumn, Settings, Sprout } from "lucide-react";
import BrandMark from "../common/BrandMark";
import LanguageSwitcher from "../common/LanguageSwitcher";

const FEATURES = [
  { key: "monitoring", icon: ChartColumn },
  { key: "growth", icon: Sprout },
  { key: "management", icon: Settings }
];

// Full-screen photo layout shared by the login and registration pages
const AuthShell = ({ photo, children }) => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-white/60 lg:bg-gradient-to-r lg:from-white/90 lg:via-white/55 lg:to-white/5" />

      {/* On large screens the language switch floats so it takes no vertical space */}
      <div className="relative z-20 flex items-center justify-between gap-4 px-4 pt-5 sm:px-8 lg:absolute lg:right-8 lg:top-5 lg:p-0">
        <div className="lg:hidden">
          <BrandMark showTagline={false} />
        </div>
        <LanguageSwitcher />
      </div>

      <div className="relative z-10 mx-auto grid max-w-7xl gap-8 px-4 pb-8 pt-4 sm:px-8 lg:min-h-screen lg:grid-cols-[1.2fr_1fr] lg:items-center lg:gap-12 lg:py-6">
        <section className="hidden lg:block">
          <BrandMark size="lg" />
          <div className="mt-6 h-1 w-14 rounded-full bg-leaf-500" />
          <h1 className="mt-5 max-w-xl text-4xl font-extrabold leading-[1.1] tracking-tight text-gray-900 xl:text-5xl">
            {t("hero.headingStart")} <span className="text-leaf-600">{t("hero.headingHighlight")}</span>
          </h1>
          <p className="mt-4 max-w-lg text-base leading-relaxed text-gray-700 xl:text-lg">{t("hero.text")}</p>

          <ul className="mt-7 grid max-w-2xl grid-cols-3 gap-4">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li key={key} className="glass rounded-2xl px-4 py-4 text-center shadow-lg shadow-tea-900/5">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                <p className="mt-2.5 text-sm font-bold text-gray-900">{t(`hero.features.${key}`)}</p>
                <p className="mt-1 text-xs leading-snug text-gray-600">{t(`hero.features.${key}Text`)}</p>
              </li>
            ))}
          </ul>

          <figure className="mt-7 flex max-w-md items-center gap-4 rounded-2xl bg-tea-900/75 px-5 py-3.5 text-white shadow-xl backdrop-blur-md">
            <Sprout className="h-7 w-7 shrink-0 text-leaf-400" aria-hidden="true" />
            <blockquote className="text-base font-medium leading-snug">“{t("hero.quote")}”</blockquote>
          </figure>
        </section>

        <main className="flex flex-col items-center">
          <div className="w-full max-w-md">{children}</div>
          <p className="mt-3 text-center text-xs text-gray-600">
            © {new Date().getFullYear()} {t("app.name")}
          </p>
        </main>
      </div>

      <div className="dumbara-band absolute inset-x-0 bottom-0 z-10" />
    </div>
  );
};

export default AuthShell;
