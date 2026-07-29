const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
const noIndexHeaderValue =
  "noindex, nofollow, noarchive, nosnippet, noimageindex";
const noIndexRoutes = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/refuge",
  "/sommets",
  "/activites",
  "/activites/:path*",
  "/admin",
  "/badges",
  "/calendrier",
  "/carte",
  "/integrations/:path*",
  "/journal",
  "/objectifs",
  "/parametres",
  "/performances",
  "/statistiques",
  "/landing-page-v1",
  "/theme-lab",
];

const cspReportOnly = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "script-src 'self' 'unsafe-inline' https://api.mapbox.com",
  "style-src 'self' 'unsafe-inline' https://api.mapbox.com",
  `connect-src 'self' ${apiUrl} https://api.mapbox.com https://events.mapbox.com`,
  "img-src 'self' data: blob: https://*.supabase.co https://images.pexels.com https://commons.wikimedia.org https://upload.wikimedia.org https://dgtzuqphqg23d.cloudfront.net https://api.mapbox.com https://*.tiles.mapbox.com",
  "worker-src 'self' blob:",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "hkzkzprcofhanjendhct.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
      },
      {
        protocol: "https",
        hostname: "commons.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "upload.wikimedia.org",
      },
      {
        protocol: "https",
        hostname: "dgtzuqphqg23d.cloudfront.net",
      },
    ],
  },
  async headers() {
    const noIndexHeaders = noIndexRoutes.map((source) => ({
      source,
      headers: [
        {
          key: "X-Robots-Tag",
          value: noIndexHeaderValue,
        },
      ],
    }));

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy-Report-Only",
            value: cspReportOnly,
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
      ...noIndexHeaders,
    ];
  },
};

module.exports = nextConfig;
