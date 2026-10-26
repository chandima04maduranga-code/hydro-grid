import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Clock } from "lucide-react";
import { formatClock } from "../../utils/format";

// Live Sri Lanka Standard Time (UTC+5:30), regardless of the viewer's own time zone
const ColomboClock = ({ className = "" }) => {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className={`items-center gap-1.5 text-xs font-medium text-gray-500 ${className}`} title={t("nav.slTime")}>
      <Clock className="h-3.5 w-3.5 text-tea-600" aria-hidden="true" />
      <time dateTime={now.toISOString()}>{formatClock(now, i18n.language)}</time>
    </div>
  );
};

export default ColomboClock;
