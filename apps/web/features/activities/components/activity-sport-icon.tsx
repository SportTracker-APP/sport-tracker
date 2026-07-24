import {
  Bike,
  Dumbbell,
  Footprints,
  Mountain,
  Route,
  Waves,
} from "lucide-react";

export function ActivitySportIcon({
  sport,
  className,
}: {
  sport: string;
  className?: string;
}) {
  if (["ROAD_CYCLING", "GRAVEL", "MTB"].includes(sport)) {
    return <Bike className={className} aria-hidden="true" />;
  }

  if (["GYM", "FITNESS"].includes(sport)) {
    return <Dumbbell className={className} aria-hidden="true" />;
  }

  if (["TRAIL", "HIKING", "CLIMBING", "SKI", "SNOWBOARD"].includes(sport)) {
    return <Mountain className={className} aria-hidden="true" />;
  }

  if (sport === "SWIMMING") {
    return <Waves className={className} aria-hidden="true" />;
  }

  if (["RUNNING", "WALKING"].includes(sport)) {
    return <Footprints className={className} aria-hidden="true" />;
  }

  return <Route className={className} aria-hidden="true" />;
}
