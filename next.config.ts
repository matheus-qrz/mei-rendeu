import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // Necessário para o Stripe webhook receber o body raw
  experimental: {
    serverComponentsExternalPackages: ["@anthropic-ai/sdk"],
  },
}

export default nextConfig
