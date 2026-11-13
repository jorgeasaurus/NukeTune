import {
  Html,
  Head,
  Main,
  NextScript,
  type DocumentProps,
} from "next/document";
import { PageMetaTags } from "~/components/ui/PageMeta";

export default function Document({ __NEXT_DATA__ }: DocumentProps) {
  return (
    <Html lang="en">
      <Head>
        <link rel="icon" type="image/png" href="/logo.png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        {/* Matches --void-black so mobile browser chrome blends with the page. */}
        <meta name="theme-color" content="#0a0a0c" />
        <PageMetaTags route={__NEXT_DATA__.page} />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
