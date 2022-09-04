/** @type {import('next').NextConfig} */

const DotEnv = require('dotenv-webpack')

const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: [
      'cdn.sanity.io'
    ]
  },
  webpack: config => {
    // import Vercel env variables when not being build on Vercel
    config.plugins.push(
      new DotEnv({
        path: '../../.vercel/.env.development.local'
      })
    )
    return config
  }
}

module.exports = nextConfig
