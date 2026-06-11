/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // O build não falha por lint; rode `npm run lint` separadamente se quiser.
    ignoreDuringBuilds: true,
  },
  images: {
    // Avatares do Google e bandeiras vindas da API
    remotePatterns: [
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
      { protocol: "https", hostname: "media.api-sports.io" },
      { protocol: "https", hostname: "flagcdn.com" },
    ],
  },
};

export default nextConfig;
