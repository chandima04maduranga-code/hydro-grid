import { LoaderCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const FullPageLoader = () => {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen items-center justify-center bg-cream" role="status">
      <LoaderCircle className="h-8 w-8 animate-spin text-tea-600" aria-hidden="true" />
      <span className="sr-only">{t("common.loading")}</span>
    </div>
  );
};

export default FullPageLoader;
