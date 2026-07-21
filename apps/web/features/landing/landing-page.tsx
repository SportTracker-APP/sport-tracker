import { readFileSync } from "node:fs";
import { existsSync } from "node:fs";
import { join } from "node:path";

const landingDirectoryCandidates = [
  join(process.cwd(), "features/landing"),
  join(process.cwd(), "apps/web/features/landing"),
] as const;

const landingDirectory =
  landingDirectoryCandidates.find((candidate) =>
    existsSync(join(candidate, "figma-landing.html")),
  ) ?? landingDirectoryCandidates[0];

function readLandingAsset(fileName: string) {
  return readFileSync(join(landingDirectory, fileName), "utf8");
}

export function LandingPage() {
  const css = readLandingAsset("figma-landing.css");
  const html = readLandingAsset("figma-landing.html");

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        className="hovren-figma-landing"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </>
  );
}
