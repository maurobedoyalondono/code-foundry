/** @type {import('next').NextConfig} */
const nextConfig = {
  sassOptions: {
    silenceDeprecations: ['legacy-js-api'],
  },
  i18n: {
    locales: ['en', 'es', 'de'],
    defaultLocale: 'en',
  },
  webpack: (config) => {
    // Handle file system operations
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
    };
    return config;
  },
}

module.exports = nextConfig