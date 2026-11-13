/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
import "./src/env.js";

const isDev = process.env.NODE_ENV === "development";

const MICROSOFT_LOGIN = "https://login.microsoftonline.com";
const MICROSOFT_GRAPH = "https://graph.microsoft.com";
// Vercel Analytics serves its script from /_vercel/insights on the deployed
// origin; the debug script and legacy vitals endpoint live on these hosts.
const VERCEL_ANALYTICS = [
  "https://va.vercel-scripts.com",
  "https://vitals.vercel-insights.com",
];

/**
 * Report-only for now: the MSAL popup and silent-iframe flows cannot be
 * exercised without a tenant, and an enforced policy that is wrong would
 * break sign-in in production. Promote to `Content-Security-Policy` once the
 * browser console shows no violations during a real sign-in.
 */
const contentSecurityPolicy = [
  "default-src 'self'",
  // `next dev` relies on eval for fast refresh; production builds do not.
  `script-src 'self' ${VERCEL_ANALYTICS[0]}${isDev ? " 'unsafe-eval'" : ""}`,
  // next/image and React set inline style attributes.
  "style-src 'self' 'unsafe-inline'",
  // next/font self-hosts font files under /_next/static/media.
  "font-src 'self'",
  "img-src 'self' data: blob:",
  `connect-src 'self' ${MICROSOFT_LOGIN} ${MICROSOFT_GRAPH} ${VERCEL_ANALYTICS.join(" ")}`,
  // MSAL silent token renewal uses a hidden iframe to the login host that
  // redirects back to this origin.
  `frame-src 'self' ${MICROSOFT_LOGIN}`,
  "frame-ancestors 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "worker-src 'self' blob:",
  "manifest-src 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "serial=()",
      "hid=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
      "display-capture=()",
      "browsing-topics=()",
    ].join(", "),
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000",
  },
  // SAMEORIGIN rather than DENY: MSAL frames this app's own redirect page in
  // a hidden iframe for silent token renewal.
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Content-Security-Policy", value: "frame-ancestors 'self'" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
];

/** @type {import("next").NextConfig} */
const config = {
  reactStrictMode: true,

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default config;
