import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const FormField = ({ id, label, icon: Icon, error, hint, trailing, className = "", ...inputProps }) => {
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
        <input
          id={id}
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          className={`w-full rounded-xl border bg-white py-2.5 text-gray-900 placeholder:text-gray-400 transition focus:outline-none focus:ring-4 ${
            Icon ? "pl-10" : "pl-3.5"
          } ${trailing ? "pr-11" : "pr-3.5"} ${
            error
              ? "border-clay-500 focus:ring-clay-500/15"
              : "border-gray-200 focus:border-tea-500 focus:ring-tea-500/15"
          }`}
          {...inputProps}
        />
        {trailing && <div className="absolute right-1.5 top-1/2 -translate-y-1/2">{trailing}</div>}
      </div>
      {message && (
        <p id={messageId} className={`mt-1.5 text-xs ${error ? "text-clay-600" : "text-gray-500"}`}>
          {message}
        </p>
      )}
    </div>
  );
};

export const PasswordField = ({ showLabel, hideLabel, ...props }) => {
  const [visible, setVisible] = useState(false);

  return (
    <FormField
      {...props}
      type={visible ? "text" : "password"}
      trailing={
        <button
          type="button"
          onClick={() => setVisible((value) => !value)}
          className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label={visible ? hideLabel : showLabel}
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      }
    />
  );
};

export default FormField;
