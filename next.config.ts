import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    reactStrictMode: true,
    output: "standalone",
    images: {
        unoptimized: true,
    },
    // distDir: "out",
};

export default nextConfig;
