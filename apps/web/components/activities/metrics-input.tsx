import { InputHTMLAttributes } from "react";

type MetricsInputProps =
  InputHTMLAttributes<HTMLInputElement> & {
    label: string;

    unit?: string;

    error?: string;
  };

export function MetricsInput({
  label,
  unit,
  error,
  ...props
}: MetricsInputProps) {
  return (
    <div>
      <label className="mb-2 block text-sm font-medium text-zinc-300">
        {label}
      </label>

      <div className="relative">
        <input
          {...props}
          className="
            h-12
            w-full
            rounded-2xl
            border
            border-white/10
            bg-black/20
            px-4
            pr-16
            text-white
            outline-none
            transition
            placeholder:text-zinc-500
            focus:border-violet-500
          "
        />

        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {unit}
          </span>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}