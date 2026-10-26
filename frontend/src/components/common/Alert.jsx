import { CircleAlert, CircleCheck, Clock, Info } from "lucide-react";

const TONES = {
  error: { icon: CircleAlert, classes: "border-clay-500/30 bg-clay-50 text-clay-600" },
  warning: { icon: Clock, classes: "border-gold-400/50 bg-gold-100 text-gold-600" },
  success: { icon: CircleCheck, classes: "border-tea-300 bg-tea-50 text-tea-700" },
  info: { icon: Info, classes: "border-tea-200 bg-white text-tea-700" }
};

const Alert = ({ tone = "info", children }) => {
  const { icon: Icon, classes } = TONES[tone];
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm ${classes}`}>
      <Icon className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
};

export default Alert;
