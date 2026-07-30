/** @type {import('next').NextConfig} */

// --- Safeguard: Prevent startup if required environment variables like JWT_SECRET are missing or weak in production ---
if (process.env.NODE_ENV === "production") {
  const jwtSecret = process.env.JWT_SECRET;
  if (!jwtSecret) {
    console.error("\n=======================================================================");
    console.error("FATAL ERROR: JWT_SECRET environment variable is missing in production!");
    console.error("Application startup aborted.");
    console.error("=======================================================================\n");
    process.exit(1);
  }
  
  if (jwtSecret.length < 32) {
    console.error("\n=======================================================================");
    console.error("FATAL ERROR: JWT_SECRET must be at least 32 characters long in production!");
    console.error("Application startup aborted.");
    console.error("=======================================================================\n");
    process.exit(1);
  }
  
  const hasUppercase = /[A-Z]/.test(jwtSecret);
  const hasLowercase = /[a-z]/.test(jwtSecret);
  const hasNumbers = /[0-9]/.test(jwtSecret);
  const hasSpecial = /[^A-Za-z0-9]/.test(jwtSecret);
  const characterClassesCount = [hasUppercase, hasLowercase, hasNumbers, hasSpecial].filter(Boolean).length;
  const isHexOrBase64 = /^[0-9a-fA-F]{64,}$/.test(jwtSecret) || /^[A-Za-z0-9+/]{44,}={0,2}$/.test(jwtSecret);
  
  if (characterClassesCount < 3 && !isHexOrBase64) {
    console.error("\n=======================================================================");
    console.error("FATAL ERROR: JWT_SECRET is not complex enough for production environments!");
    console.error("Application startup aborted.");
    console.error("=======================================================================\n");
    process.exit(1);
  }
  
  const lowerSecret = jwtSecret.toLowerCase();
  const weakPhrases = ["secret", "default", "password", "123456", "change-me", "your-secret-key"];
  for (const phrase of weakPhrases) {
    if (lowerSecret.includes(phrase)) {
      console.error(`\n=======================================================================`);
      console.error(`FATAL ERROR: JWT_SECRET contains weak phrase '${phrase}'!`);
      console.error("Application startup aborted.");
      console.error(`=======================================================================\n`);
      process.exit(1);
    }
  }
}

// Trigger Next.js cache invalidate & reload
const nextConfig = {
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei', 'three-stdlib'],
  // Enable React Strict Mode
  reactStrictMode: true,
  // Image optimization config
  images: {
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  // Enable compression
  compress: true,
  // Suppress Node.js deprecation warnings from third-party packages (e.g., googleapis url.parse DEP0169)
  serverExternalPackages: ["googleapis", "google-auth-library", "twilio"],
  webpack: (config, { dev, isServer }) => {
    // Suppress Node.js deprecation warnings from third-party packages in webpack
    if (isServer) {
      config.ignoreWarnings = [
        ...(config.ignoreWarnings || []),
        { message: /url\.parse/ },
        { message: /DEP0169/ },
        { module: /rate-limiter-flexible/ },
      ];
    }
    
    // Ignore critical dependency warning from rate-limiter-flexible
    config.module = config.module || {};
    config.module.exprContextCritical = false;
    
    return config;
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  async redirects() {
    return [
      {
        source: '/exit',
        destination: 'https://dealsflowai.vercel.app/',
        permanent: true,
      },
    ];
  },
  async headers() {
    const headers = [];

    // Add security headers for production
    if (process.env.NODE_ENV !== 'development') {
      headers.push({
        source: '/((?!api|_next/static|_next/image|favicon.ico).*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(self), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://assets.calendly.com https://*.calendly.com; style-src 'self' 'unsafe-inline' https://assets.calendly.com; img-src 'self' data: https: https://assets.calendly.com https://*.calendly.com; font-src 'self' data: https://assets.calendly.com; connect-src 'self' https://dealflow-ai-651cb.firebaseio.com https://*.firebaseio.com wss://*.firebaseio.com https://dealflow-ai-651cb.appspot.com https://*.googleapis.com https://api.huggingface.co https://calendly.com https://*.calendly.com https://assets.calendly.com https://api.elevenlabs.io https://*.twilio.com wss://*.twilio.com; frame-src 'self' https://calendly.com https://*.calendly.com https://assets.calendly.com; worker-src 'self' blob:; child-src 'self' blob:;",
          },
        ],
      });
    }

    // Add cache control headers for static assets
    headers.push({
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    });
    headers.push({
      source: '/_next/image/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    });

    return headers;
  },
};

export default nextConfig;
