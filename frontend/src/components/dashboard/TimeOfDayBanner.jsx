import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { MapPin } from "lucide-react";
import { SL_TIME_ZONE, formatClock } from "../../utils/format";
import mistyTea from "../../assets/photos/nuwara-eliya-misty-tea.webp";
import hillFarm from "../../assets/photos/nuwara-eliya-hill-farm.webp";
import paddy from "../../assets/photos/ambalantota-paddy-fields.webp";
import coconutPalms from "../../assets/photos/kalutara-coconut-palms.webp";
import teaSunlight from "../../assets/photos/ramboda-tea-sunlight.webp";
import kandyDusk from "../../assets/photos/kandy-hills-dusk.webp";

const CHECK_MS = 60000;

// Sri Lankan crop scenes through the day, picked by the hour in Colombo.
// `from` is the starting hour; each scene runs until the next one starts.
const SCENES = [
  { id: "kandyDusk", from: 0, photo: kandyDusk, position: "center 75%" },
  { id: "mistyTea", from: 5, photo: mistyTea, position: "center 45%" },
  { id: "hillFarm", from: 9, photo: hillFarm, position: "center 50%" },
  { id: "paddy", from: 12, photo: paddy, position: "center 40%" },
  { id: "coconutPalms", from: 15, photo: coconutPalms, position: "center 50%" },
  { id: "teaSunlight", from: 17, photo: teaSunlight, position: "center 40%" },
  { id: "kandyDusk", from: 19, photo: kandyDusk, position: "center 75%" }
];

const colomboHour = (date) =>
  Number(new Intl.DateTimeFormat("en-GB", { timeZone: SL_TIME_ZONE, hour: "numeric", hourCycle: "h23" }).format(date));

const sceneFor = (hour) => SCENES.findLast((scene) => hour >= scene.from);

const periodFor = (hour) => {
  if (hour >= 5 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  return "evening";
};

const useColomboHour = () => {
  const [hour, setHour] = useState(() => colomboHour(new Date()));
  useEffect(() => {
    const timer = setInterval(() => setHour(colomboHour(new Date())), CHECK_MS);
    return () => clearInterval(timer);
  }, []);
  return hour;
};

// Dashboard header with a photo that follows the time of day in Sri Lanka
const TimeOfDayBanner = ({ name, company, lastUpdated }) => {
  const { t, i18n } = useTranslation();
  const hour = useColomboHour();
  const scene = sceneFor(hour);
  const [loadedPhoto, setLoadedPhoto] = useState(null);

  return (
    <section className="relative isolate overflow-hidden rounded-lg bg-gray-900">
      <img
        key={`${scene.id}-${scene.from}`}
        src={scene.photo}
        alt=""
        onLoad={() => setLoadedPhoto(scene.photo)}
        style={{ objectPosition: scene.position }}
        className={`absolute inset-0 -z-10 h-full w-full object-cover transition-opacity duration-700 ${loadedPhoto === scene.photo ? "opacity-100" : "opacity-0"}`}
      />
      {/* Darkens the left side so the text stays readable on any photo */}
      <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/70 via-black/35 to-black/5" aria-hidden="true" />

      <div className="flex min-h-40 flex-col justify-between gap-6 p-5 sm:min-h-48 sm:p-6">
        <div>
          <h1 className="text-xl font-semibold text-white sm:text-2xl">{t(`dashboard.period.${periodFor(hour)}`, { name })}</h1>
          {company && (
            <p className="mt-1 flex items-center gap-1.5 text-sm text-white/80">
              {company.name}
              {company.district && (
                <>
                  <span aria-hidden="true">·</span>
                  <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(`districts.${company.district}`)}
                </>
              )}
            </p>
          )}
        </div>

        {lastUpdated && (
          <p className="flex items-center gap-2 text-xs text-white/80">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
            </span>
            {t("dashboard.live")} · {formatClock(lastUpdated, i18n.language)}
          </p>
        )}
      </div>
    </section>
  );
};

export default TimeOfDayBanner;
