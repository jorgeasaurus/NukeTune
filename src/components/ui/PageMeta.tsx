import Head from "next/head";

const SITE_URL = "https://nuketune.com";
const SITE_NAME = "NukeTune";
const SHARE_IMAGE = {
  url: `${SITE_URL}/logo.png`,
  width: 549,
  height: 531,
  alt: "NukeTune logo",
};

interface PageMetaEntry {
  title: string;
  description: string;
  /** Keep the page out of search indexes (e.g. the 404 page). */
  noIndex?: boolean;
}

/** Metadata for the public pages, keyed by Next.js route. */
const PAGE_META: Record<string, PageMetaEntry> = {
  "/": {
    title: "NukeTune - Intune Environment Reset Tool",
    description:
      "Bulk-delete devices, apps, policies and configurations from Microsoft Intune tenants in the Global Commercial cloud, with a preview before anything is removed.",
  },
  "/setup": {
    title: "Setup Guide - NukeTune",
    description:
      "How to sign in to NukeTune, the admin roles and Microsoft Graph permissions it needs, and how to preview and confirm Intune deletions.",
  },
  "/404": {
    title: "Page Not Found - NukeTune",
    description: "The page you were looking for does not exist.",
    noIndex: true,
  },
};

/**
 * Description, canonical URL and social-card tags for a public page.
 *
 * Rendered from _document rather than next/head: _app shows a loader until
 * MSAL initializes, so page components never render into the static HTML that
 * link-preview scrapers read.
 */
export function PageMetaTags({ route }: { route: string }) {
  const meta = PAGE_META[route];
  if (!meta) return null;

  const url = `${SITE_URL}${route}`;

  return (
    <>
      <meta name="description" content={meta.description} />
      {meta.noIndex ? (
        <meta name="robots" content="noindex" />
      ) : (
        <link rel="canonical" href={url} />
      )}

      <meta property="og:type" content="website" />
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={meta.title} />
      <meta property="og:description" content={meta.description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={SHARE_IMAGE.url} />
      <meta property="og:image:width" content={String(SHARE_IMAGE.width)} />
      <meta property="og:image:height" content={String(SHARE_IMAGE.height)} />
      <meta property="og:image:alt" content={SHARE_IMAGE.alt} />

      <meta name="twitter:card" content="summary" />
      <meta name="twitter:title" content={meta.title} />
      <meta name="twitter:description" content={meta.description} />
      <meta name="twitter:image" content={SHARE_IMAGE.url} />
      <meta name="twitter:image:alt" content={SHARE_IMAGE.alt} />
    </>
  );
}

/** Document title for a public page; titles belong in next/head, not _document. */
export function PageTitle({ route }: { route: string }) {
  const meta = PAGE_META[route];
  return <Head>{meta ? <title>{meta.title}</title> : null}</Head>;
}
