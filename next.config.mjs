/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
    remotePatterns: [],
    localPatterns: [
      {
        pathname: '/room.jpg',
        search: '',
      },
    ],
  },
  // Especificar el directorio raíz para evitar el warning de múltiples lockfiles
  outputFileTracingRoot: process.cwd(),
}

export default nextConfig
