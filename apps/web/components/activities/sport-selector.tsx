"use client";

import {
  Bike,
  Footprints,
  Mountain,
  PersonStanding,
  Trees,
} from "lucide-react";

const sports = [
  {
    value: "TRAIL",
    label: "Trail",
    icon: Mountain,
  },
  {
    value: "RUNNING",
    label: "Course",
    icon: Footprints,
  },
  {
    value: "HIKING",
    label: "Randonnée",
    icon: Trees,
  },
  {
    value: "MTB",
    label: "VTT",
    icon: Bike,
  },
  {
    value: "WALKING",
    label: "Marche",
    icon: PersonStanding,
  },
];

interface Props {
  value: string;

  onChange: (
    value: string,
  ) => void;
}

export function SportSelector({
  value,
  onChange,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
      {sports.map((sport) => {
        const Icon = sport.icon;

        const active =
          value === sport.value;

        return (
          <button
            key={sport.value}
            type="button"
            onClick={() =>
              onChange(sport.value)
            }
            className={`
              group relative overflow-hidden rounded-[24px] border p-5 transition-all duration-300

              ${
                active
                  ? "border-violet-500/40 bg-violet-500/15"
                  : "border-white/[0.06] bg-white/[0.03] hover:border-white/[0.12]"
              }
            `}
          >

            {/* GLOW */}
            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-fuchsia-500/5 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

            <div className="relative flex flex-col items-center gap-3">

              <div
                className={`
                  flex h-12 w-12 items-center justify-center rounded-2xl transition-all

                  ${
                    active
                      ? "bg-violet-500 text-white"
                      : "bg-black/30 text-zinc-400"
                  }
                `}
              >
                <Icon size={22} />
              </div>

              <span
                className={`
                  text-sm font-medium

                  ${
                    active
                      ? "text-white"
                      : "text-zinc-400"
                  }
                `}
              >
                {sport.label}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}