"use client";

function SneakerMascot() {
  return (
    <div className="app-mascot-option app-sneaker-mascot" title="Sneaker">
      <svg viewBox="0 0 78 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="app-sneaker-speed app-sneaker-speed-top"
          d="M11 11H25"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          className="app-sneaker-speed app-sneaker-speed-bottom"
          d="M8 20H22"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <g className="app-sneaker-shoe">
          <path
            d="M24.5 20.5L33.8 9.5C34.5 8.7 35.8 8.7 36.5 9.5L43.2 17.2L56.8 20.1C61.4 21.1 63.4 24.4 61.9 27C61.2 28.2 59.9 28.9 58.3 28.9H28.2C23.6 28.9 21.6 24.5 24.5 20.5Z"
            fill="currentColor"
          />
          <path
            d="M25.6 22.2H61.4"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
          <path
            d="M35.3 14.1L40.1 18.8M39.7 12.7L44.5 17.4"
            stroke="rgba(255,255,255,0.74)"
            strokeWidth="1.7"
            strokeLinecap="round"
          />
          <path
            d="M31.3 25.8H57.8"
            stroke="rgba(0,0,0,0.28)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </g>
        <path
          className="app-sneaker-ground"
          d="M22 30.5H63"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

export function MountainMascot() {
  return (
    <div className="app-mascot-option app-mountain-mascot" title="Montagne">
      <svg viewBox="0 0 78 34" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          className="app-mountain-wind app-mountain-wind-a"
          d="M11 9H29"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          className="app-mountain-wind app-mountain-wind-b"
          d="M18 14H38"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <path
          className="app-mountain-wind app-mountain-wind-c"
          d="M10 19H24"
          stroke="currentColor"
          strokeWidth="1.9"
          strokeLinecap="round"
        />
        <g className="app-mountain-peaks">
          <path
            d="M18 27L31.5 10L43 27H18Z"
            fill="currentColor"
            opacity=".82"
          />
          <path
            d="M34 27L47.5 13L62 27H34Z"
            fill="currentColor"
            opacity=".58"
          />
          <path
            d="M31.4 10L36.1 17.1L31.5 15.4L27.7 17.6L31.4 10Z"
            fill="rgba(255,255,255,0.62)"
          />
        </g>
        <path
          d="M17 28.5H63"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          opacity=".18"
        />
      </svg>
    </div>
  );
}

export function TopbarRunner() {
  return (
    <div className="app-mascot-choices" aria-label="Variantes mascotte">
      <SneakerMascot />
      <MountainMascot />
    </div>
  );
}
