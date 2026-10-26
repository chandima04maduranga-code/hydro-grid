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
const AuthShell = ({ photo, photoCredit, children }) => {
  const { t } = useTranslation();

  return (
    <div className="relative min-h-screen overflow-hidden">
      <img src={photo} alt="" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-white/60 lg:bg-gradient-to-r lg:from-white/90 lg:via-white/55 lg:to-white/5" />

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-10 px-4 pb-10 pt-6 sm:px-8 lg:grid-cols-[1.2fr_1fr] lg:items-center">
        <section className="hidden lg:block">
          <BrandMark size="lg" />
          <div className="mt-8 h-1 w-14 rounded-full bg-leaf-500" />
          <h1 className="mt-6 max-w-xl text-5xl font-extrabold leading-[1.1] tracking-tight text-gray-900">
            {t("hero.headingStart")} <span className="text-leaf-600">{t("hero.headingHighlight")}</span>
          </h1>
          <p className="mt-5 max-w-lg text-lg leading-relaxed text-gray-700">{t("hero.text")}</p>

          <ul className="mt-9 grid max-w-2xl grid-cols-3 gap-4">
            {FEATURES.map(({ key, icon: Icon }) => (
              <li key={key} className="glass rounded-2xl px-4 py-5 text-center shadow-lg shadow-tea-900/5">
                <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-leaf-50 text-leaf-600">
                  <Icon className="h-6 w-6" aria-hidden="true" />
                </span>
                <p className="mt-3 text-sm font-bold text-gray-900">{t(`hero.features.${key}`)}</p>
                <p className="mt-1 text-xs leading-snug text-gray-600">{t(`hero.features.${key}Text`)}</p>
              </li>
            ))}
          </ul>

          <figure className="mt-10 flex max-w-md items-center gap-4 rounded-2xl bg-tea-900/75 px-6 py-4 text-white shadow-xl backdrop-blur-md">
            <Sprout className="h-8 w-8 shrink-0 text-leaf-400" aria-hidden="true" />
            <blockquote className="text-lg font-medium leading-snug">“{t("hero.quote")}”</blockquote>
          </figure>
        </section>

        <main className="flex flex-col">
          <div className="flex items-center justify-between gap-4 lg:justify-end">
            <div className="lg:hidden">
              <BrandMark showTagline={false} />
            </div>
            <LanguageSwitcher />
          </div>
          <div className="flex flex-1 items-center justify-center py-8">
            <div className="w-full max-w-md">{children}</div>
          </div>
          <p className="text-center text-xs text-gray-600">
            © {new Date().getFullYear()} {t("app.name")} · {photoCredit}
          </p>
        </main>
      </div>

      <div className="dumbara-band absolute inset-x-0 bottom-0 z-10" />
    </div>
  );
};

export default AuthShell;
