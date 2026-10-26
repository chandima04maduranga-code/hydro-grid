// Layered hill-country tea estate with contour-planted tea rows and morning sun.
const HILL_FAR = "M0 250 C80 200 160 190 240 220 C320 250 380 180 460 190 C520 198 570 230 600 220 L600 400 L0 400 Z";
const HILL_MID = "M0 290 C90 250 170 255 260 280 C350 305 420 250 520 260 C560 264 585 275 600 280 L600 400 L0 400 Z";
const HILL_NEAR = "M0 340 C100 310 200 315 300 335 C400 355 480 320 600 330 L600 400 L0 400 Z";

const MID_ROW = "M-10 300 C90 262 170 267 260 292 C350 317 420 262 520 272 C560 276 585 287 610 292";
const NEAR_ROW = "M-10 352 C100 322 200 327 300 347 C400 367 480 332 610 342";

const HillsIllustration = ({ className = "" }) => (
  <svg viewBox="0 0 600 400" className={className} preserveAspectRatio="xMidYMax slice" aria-hidden="true">
    <defs>
      <clipPath id="hg-hill-mid"><path d={HILL_MID} /></clipPath>
      <clipPath id="hg-hill-near"><path d={HILL_NEAR} /></clipPath>
      <radialGradient id="hg-sun" cx="0.5" cy="0.5" r="0.5">
        <stop offset="0%" stopColor="#e6c27a" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#e6c27a" stopOpacity="0" />
      </radialGradient>
    </defs>

    <circle cx="455" cy="125" r="110" fill="url(#hg-sun)" />
    <circle cx="455" cy="125" r="36" fill="#e6c27a" opacity="0.85" />

    <path d={HILL_FAR} fill="#2d6640" opacity="0.55" />
    <ellipse cx="300" cy="245" rx="320" ry="18" fill="#ffffff" opacity="0.06" />

    <path d={HILL_MID} fill="#245135" />
    <g clipPath="url(#hg-hill-mid)" fill="none" stroke="#3e7f52" strokeWidth="5" strokeLinecap="round" strokeDasharray="1 9">
      {[0, 14, 28, 42, 56, 70, 84].map((offset) => (
        <path key={offset} d={MID_ROW} transform={`translate(0 ${offset})`} />
      ))}
    </g>

    <path d={HILL_NEAR} fill="#1d412b" />
    <g clipPath="url(#hg-hill-near)" fill="none" stroke="#2d6640" strokeWidth="6" strokeLinecap="round" strokeDasharray="1 11">
      {[0, 16, 32, 48].map((offset) => (
        <path key={offset} d={NEAR_ROW} transform={`translate(0 ${offset})`} />
      ))}
    </g>
  </svg>
);

export default HillsIllustration;
