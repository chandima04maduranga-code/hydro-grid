import { HEALTH_COLORS, healthLevel } from "../../utils/metrics";

const RADIUS = 16;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

// Small circular gauge for a 0–100 health score
const HealthRing = ({ score, size = 44, label }) => {
  const colors = HEALTH_COLORS[healthLevel(score)];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }} role="img" aria-label={label || `${score} / 100`}>
      <svg viewBox="0 0 40 40" className="h-full w-full -rotate-90">
        <circle cx="20" cy="20" r={RADIUS} fill="none" stroke="#e5e7eb" strokeWidth="4" />
        <circle
          cx="20"
          cy="20"
          r={RADIUS}
          fill="none"
          stroke={colors.stroke}
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - score / 100)}
        />
      </svg>
      <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold tabular-nums ${colors.text}`}>{score}</span>
    </div>
  );
};

export default HealthRing;
