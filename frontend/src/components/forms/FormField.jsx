import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

function FormField({ label, error, type = 'text', registration, hint, ...inputProps }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';
  const inputType = isPassword && showPassword ? 'text' : type;

  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between text-xs font-medium text-indigo">
        {label}{hint && <span className="font-normal text-muted">{hint}</span>}
      </span>
      <span className="relative block">
        <input
          {...inputProps}
          {...registration}
          type={inputType}
          className={`form-input ${error ? 'form-input-error' : ''}`}
          aria-invalid={Boolean(error)}
        />
        {isPassword && (
          <button
            type="button"
            className="absolute inset-y-0 right-3 grid place-items-center text-muted hover:text-indigo"
            onClick={() => setShowPassword((visible) => !visible)}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </span>
      {error && <span className="mt-1.5 block text-xs text-clay" role="alert">{error.message}</span>}
    </label>
  );
}

export default FormField;
