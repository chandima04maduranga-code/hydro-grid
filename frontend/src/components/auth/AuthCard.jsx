import BrandMark from "../common/BrandMark";
import { LeafDecoration } from "../common/LeafLogo";

// Frosted white card with soft leaf decorations, used by the auth pages.
// On large screens the logo is already in the hero beside it, so it is
// only repeated inside the card on smaller screens.
const AuthCard = ({ title, subtitle, children }) => (
  <div className="glass relative overflow-hidden rounded-3xl p-6 shadow-2xl shadow-tea-900/15 sm:p-8">
    <LeafDecoration className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 text-leaf-400/20" />
    <LeafDecoration className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rotate-180 text-leaf-400/15" />
    <div className="relative">
      <div className="mb-5 flex justify-center lg:hidden">
        <BrandMark />
      </div>
      {title && (
        <div className="mb-5 text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{title}</h2>
          {subtitle && <p className="mt-1.5 text-sm text-gray-600">{subtitle}</p>}
        </div>
      )}
      {children}
    </div>
  </div>
);

export default AuthCard;
