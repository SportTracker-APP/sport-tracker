interface Props {
  label: string;

  unit?: string;

  value: string;

  onChange: (
    value: string,
  ) => void;

  type?: string;
}

export function MetricsInput({
  label,
  unit,
  value,
  onChange,
  type = "number",
}: Props) {
  return (
    <div className="space-y-2">

      <label className="text-sm text-zinc-400">
        {label}
      </label>

      <div className="relative">

        <input
          type={type}
          value={value}
          onChange={(e) =>
            onChange(
              e.target.value,
            )
          }
          className="h-14 w-full rounded-2xl border border-white/[0.08] bg-white/[0.03] px-4 text-white outline-none transition-all focus:border-violet-500/40"
        />

        {unit && (
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-zinc-500">
            {unit}
          </span>
        )}
      </div>
    </div>
  );
}