import BrandMark from "../common/BrandMark";
import { LeafDecoration } from "../common/LeafLogo";

// Frosted white card with soft leaf decorations, used by the auth pages
const AuthCard = ({ title, subtitle, children }) => (
  <div className="glass relative overflow-hidden rounded-3xl p-8 shadow-2xl shadow-tea-900/15 sm:p-10">
    <LeafDecoration className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 text-leaf-400/20" />
    <LeafDecoration className="pointer-events-none absolute -bottom-10 -left-10 h-32 w-32 rotate-180 text-leaf-400/15" />
    <div className="relative">
      <div className="mb-6 flex justify-center">
        <BrandMark />
      </div>
      {title && (
        <div className="mb-7 text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">{title}</h2>
          {subtitle && <p className="mt-2 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  </div>
);

export default AuthCard;
