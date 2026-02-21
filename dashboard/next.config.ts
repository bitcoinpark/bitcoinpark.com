import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

const nextConfig: NextConfig = {
  basePath: isProd ? "/dashboard" : "",
  output: "standalone",
  turbopack: {
    root: "/Users/andrewdavis/bitcoinpark.com/dashboard",
  },
};

export default nextConfig;
