/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:3001/api/:path*",
      },
    ];
  },

  // 配置图片域名白名单
  images: {
    domains: [
      "localhost",
      "192.168.3.35", // 外部API服务器
      "img.example.com", // 图片服务器示例，根据实际情况修改
    ],
  },

  // 自定义webpack配置（如需要）
  webpack: (config, { isServer }) => {
    // 自定义webpack配置项
    return config;
  },
};

export default nextConfig;
