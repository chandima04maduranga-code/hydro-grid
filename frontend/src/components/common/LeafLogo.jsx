import { useId } from "react";

// Hydro_Grid two-leaf mark. Gradient ids are unique per instance: a shared id
// breaks when the first logo on the page is hidden (display: none).
const LeafLogo = ({ className = "h-10 w-10" }) => {
  const id = useId();
  const rightId = `${id}-right`;
  const leftId = `${id}-left`;

  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <linearGradient id={rightId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#1b602a" />
          <stop offset="1" stopColor="#4cbb5e" />
        </linearGradient>
        <linearGradient id={leftId} x1="1" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor="#163322" />
          <stop offset="1" stopColor="#2f9e44" />
        </linearGradient>
      </defs>
      <path d="M23 44C21 28 27 12 44 4c3 18-5 34-21 40Z" fill={`url(#${rightId})`} />
      <path d="M21 44C9 41 2 30 4 15c11 5 18 15 17 29Z" fill={`url(#${leftId})`} />
      <path d="M23.5 42C25 30 31 19 40 10" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M20.5 42C19 33 14 25 8 20" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
};

// Single soft leaf shape used as background decoration
export const LeafDecoration = ({ className = "" }) => (
  <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
    <path d="M10 90C10 45 40 12 92 8c2 50-30 82-82 82Z" fill="currentColor" />
    <path d="M14 86C34 60 55 38 86 14" fill="none" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" />
  </svg>
);

export default LeafLogo;
