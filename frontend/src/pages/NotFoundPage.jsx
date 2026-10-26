import { Link } from "react-router";
import { useTranslation } from "react-i18next";
import { Sprout } from "lucide-react";

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-cream px-4 text-center">
      <Sprout className="h-12 w-12 text-tea-500" aria-hidden="true" />
      <h1 className="mt-4 text-2xl font-bold text-gray-900">{t("notFound.title")}</h1>
      <p className="mt-2 text-gray-600">{t("notFound.text")}</p>
      <Link to="/" className="mt-6 rounded-xl bg-tea-700 px-5 py-2.5 text-sm font-semibold text-white hover:bg-tea-800">
        {t("notFound.home")}
      </Link>
    </div>
  );
};

export default NotFoundPage;
