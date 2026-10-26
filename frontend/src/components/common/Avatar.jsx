// Initials avatar: first letters of the first two words of the name
const initialsOf = (name = "") =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");

const Avatar = ({ name, size = "md" }) => {
  const sizes = size === "sm" ? "h-8 w-8 text-xs" : "h-10 w-10 text-sm";
  return (
    <span className={`inline-flex shrink-0 items-center justify-center rounded-full bg-tea-100 font-semibold text-tea-800 ${sizes}`} aria-hidden="true">
      {initialsOf(name)}
    </span>
  );
};

export default Avatar;
