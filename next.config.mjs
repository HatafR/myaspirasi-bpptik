/** @type {import('next').NextConfig} */
const nextConfig = {
  reactCompiler: true,
  allowedDevOrigins: ["172.16.31.118"],
  output: "standalone",
};

export default nextConfig;
