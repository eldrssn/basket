import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  sassOptions: {
    includePaths: ['./src/shared/styles'],
  },
};

export default nextConfig;
