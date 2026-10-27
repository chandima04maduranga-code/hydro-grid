import { useId } from "react";
import { useTranslation } from "react-i18next";
import { Area, AreaChart, CartesianGrid, ReferenceArea, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { METRIC_META, formatMetricValue } from "../../utils/metrics";
import { SL_TIME_ZONE } from "../../utils/format";

const TONE_COLORS = { good: "#15803d", warning: "#b45309", critical: "#b91c1c", muted: "#9ca3af" };

const timeFormatter = (hours) => {
  const format = new Intl.DateTimeFormat("en-LK", {
    timeZone: SL_TIME_ZONE,
    ...(hours > 24 ? { day: "numeric", month: "short" } : { hour: "2-digit", minute: "2-digit", hour12: false })
  });
  return (value) => format.format(new Date(value));
};

// Area chart of one metric with its optimal band shaded in green
const HistoryChart = ({ metric, points, optimal, unit, tone, hours }) => {
  const { t } = useTranslation();
  const gradientId = useId();
  const color = TONE_COLORS[tone] || TONE_COLORS.good;
  const Icon = METRIC_META[metric].icon;
  const data = points.map((point) => ({ at: new Date(point.at).getTime(), value: point.value }));
  const [low, high] = optimal || [null, null];
  const formatTime = timeFormatter(hours);

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <Icon className="h-4 w-4 text-gray-400" aria-hidden="true" />
          {t(`metrics.${metric}`)}
        </p>
        <span className="text-xs text-gray-500">{unit}</span>
      </div>
      {data.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">{t("telemetry.noHistory")}</p>
      ) : (
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: -18 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.15} />
                  <stop offset="100%" stopColor={color} stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              {(low !== null || high !== null) && (
                <ReferenceArea
                  y1={low ?? undefined}
                  y2={high ?? undefined}
                  fill="#2f9e44"
                  fillOpacity={0.08}
                  stroke="#2f9e44"
                  strokeOpacity={0.25}
                  strokeDasharray="4 4"
                  ifOverflow="extendDomain"
                />
              )}
              <XAxis dataKey="at" type="number" scale="time" domain={["dataMin", "dataMax"]} tickFormatter={formatTime} tick={{ fontSize: 10, fill: "#6b7280" }} minTickGap={24} />
              <YAxis tick={{ fontSize: 10, fill: "#6b7280" }} width={44} domain={["auto", "auto"]} />
              <Tooltip
                labelFormatter={formatTime}
                formatter={(value) => [`${formatMetricValue(metric, value)} ${unit}`, t(`metrics.${metric}`)]}
                contentStyle={{ borderRadius: 6, border: "1px solid #e5e7eb", fontSize: 12 }}
              />
              <Area type="monotone" dataKey="value" stroke={color} strokeWidth={1.5} fill={`url(#${gradientId})`} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
      {(low !== null || high !== null) && (
        <p className="mt-1 text-[11px] text-gray-500">
          <span className="mr-1 inline-block h-2 w-3 rounded-sm bg-leaf-500/20 ring-1 ring-leaf-500/40 align-middle" aria-hidden="true" />
          {t("telemetry.targetBand")}
        </p>
      )}
    </div>
  );
};

export default HistoryChart;
