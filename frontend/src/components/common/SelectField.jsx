import { ChevronDown } from "lucide-react";

// Labelled <select> styled like FormField, with optional leading icon
const SelectField = ({ id, label, icon: Icon, error, hint, children, className = "", ...selectProps }) => {
  const messageId = `${id}-message`;
  const message = error || hint;

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
            aria-hidden="true"
          />
        )}
        <select
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`w-full appearance-none rounded-xl border bg-white py-2.5 pr-10 text-gray-900 transition focus:outline-none focus:ring-4 ${
            Icon ? "pl-10" : "pl-3.5"
          } ${
            error
              ? "border-clay-500 focus:ring-clay-500/15"
              : "border-gray-200 focus:border-leaf-500 focus:ring-leaf-500/15"
          }`}
          {...selectProps}
        >
          {children}
        </select>
        <ChevronDown
          className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          aria-hidden="true"
        />
      </div>
      {message && (
        <p id={messageId} className={`mt-1.5 text-xs ${error ? "text-clay-600" : "text-gray-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export default SelectField;
