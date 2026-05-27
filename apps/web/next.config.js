/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname:
          "hkzkzprcofhanjendhct.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;