// Initials avatar: first letters of the first two words of the name
const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const SIZES = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-16 w-16 text-xl"
};

const Avatar = ({ name, size = "md" }) => (
  <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-tea-100 font-semibold text-tea-800 ${SIZES[size] || SIZES.md}`} aria-hidden="true">
    {initialsOf(name)}
  </span>
);

export default Avatar;
