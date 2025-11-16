const nextConfig = {
    typescript: {
        ignoreBuildErrors: true,
    },
    
    // Performance optimizations
    reactStrictMode: true,
    
    // Image optimization
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 's3.tradingview.com',
            },
            {
                protocol: 'https',
                hostname: 'ik.imagekit.io',
            },
        ],
        formats: ['image/avif', 'image/webp'],
    },
    
    // Compression
    compress: true,
    
    // Optimize production builds
    swcMinify: true,
    
    // Reduce bundle size by removing source maps in production
    productionBrowserSourceMaps: false,
    
    // Optimize fonts
    optimizeFonts: true,
    
    // Enable experimental features for better performance
    experimental: {
        optimizePackageImports: ['lucide-react', 'react-hook-form'],
    },
    
    // Headers for better caching
    async headers() {
        return [
            {
                source: '/:path*',
                headers: [
                    {
                        key: 'X-DNS-Prefetch-Control',
                        value: 'on'
                    },
                    {
                        key: 'X-Frame-Options',
                        value: 'SAMEORIGIN'
                    },
                ],
            },
            {
                // Cache static assets for 1 year
                source: '/assets/:path*',
                headers: [
                    {
                        key: 'Cache-Control',
                        value: 'public, max-age=31536000, immutable',
                    },
                ],
            },
        ];
    },
};

export default nextConfig;
