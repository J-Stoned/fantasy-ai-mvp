/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: [
    '@tensorflow/tfjs-node-gpu',
    '@tensorflow/tfjs-node',
    'onnxruntime-node'
  ],
  webpack: (config, { isServer, dev, webpack }) => {
    // Fix TensorFlow.js Node GPU bundling issues
    config.resolve.alias = {
      ...config.resolve.alias,
      '@tensorflow/tfjs-node-gpu$': '@tensorflow/tfjs-node-gpu/dist/index.js',
    };

    // Exclude problematic files from bundling
    config.module.rules.push({
      test: /\.html$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/[hash][ext]',
      },
    });

    // Ignore HTML files in node_modules that cause webpack issues
    config.resolve.alias = {
      ...config.resolve.alias,
      'nw-pre-gyp': false,
    };

    // Configure externals for Node.js specific packages
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '@tensorflow/tfjs-node-gpu': 'commonjs @tensorflow/tfjs-node-gpu',
        '@tensorflow/tfjs-node': 'commonjs @tensorflow/tfjs-node',
        'onnxruntime-node': 'commonjs onnxruntime-node',
      });
    }

    // Ignore specific problematic files
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /\.html$/,
        contextRegExp: /node_modules\/@mapbox\/node-pre-gyp/,
      })
    );

    // Handle WASM files for TensorFlow.js
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });

    // Fallbacks for browser compatibility
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
        buffer: false,
        process: false,
      };
    }

    return config;
  },
  
  // Configure headers for CORS if needed
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'require-corp',
          },
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
        ],
      },
    ];
  },

  // Image optimization
  images: {
    domains: ['fantasy.ai', 'supabase.co'],
    formats: ['image/webp', 'image/avif'],
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};

export default nextConfig;