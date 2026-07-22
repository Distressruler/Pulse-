/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ruvzdyaxxhttixsmflkq.supabase.co",
      },
    ],
  },
};

module.exports = nextConfig;