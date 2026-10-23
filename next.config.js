/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }] },
  // Visitors to "/" go to Arabic if their phone or browser is set to Arabic, otherwise English.
  async redirects() {
    return [
      { source: "/", has: [{ type: "header", key: "accept-language", value: "\\s*[aA][rR]([-_,;].*)?" }], destination: "/ar", permanent: false },
      { source: "/", destination: "/en", permanent: false },
      { source: "/favicon.ico", destination: "/icon.png", permanent: true },
      // Any other address without a language goes to the English version of it (so missing pages show a proper "not found").
      { source: "/:first((?!(?:en|ar|admin|api|_next)(?:/|$)|[^/]+\\.(?:png|jpe?g|webp|svg|ico|txt|xml|json)$|opengraph-image)[^/]+)/:rest*", destination: "/en/:first/:rest*", permanent: false },
    ];
  },
};
module.exports = nextConfig;
