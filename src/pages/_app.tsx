import { type AppType } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { MsalProvider } from "@azure/msal-react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import {
  msalInstance,
  initializeMsal,
  CustomNavigationClient,
} from "~/lib/msal";
import { TenantSessionSync } from "~/components/auth/TenantSessionSync";

import "~/styles/globals.css";

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
});

const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const init = async () => {
      try {
        const navigationClient = new CustomNavigationClient(router);
        msalInstance.setNavigationClient(navigationClient);
        await initializeMsal();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize authentication", error);
        setInitError(
          error instanceof Error && error.message
            ? error.message
            : "Unknown error while initializing authentication.",
        );
      }
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (initError !== null) {
    return (
      <div className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} font-mono`}>
        <div className="flex min-h-screen items-center justify-center bg-[var(--void-black)] p-4">
          <div className="console-panel w-full max-w-lg rounded-xl p-8" role="alert">
            <div className="mb-2 flex items-center gap-2">
              <span className="status-dot status-dot-danger" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                Initialization Failed
              </span>
            </div>
            <h1 className="font-display text-xl font-semibold text-white">
              NukeTune could not start sign-in
            </h1>
            <p className="mt-2 text-sm text-[var(--text-dim)]">
              Check that the app registration client ID is configured and that
              this browser allows session storage for this site.
            </p>
            <pre className="mt-4 overflow-auto whitespace-pre-wrap break-words rounded-md border border-[var(--console-border)] bg-black/30 p-3 text-xs text-[var(--critical-red)]">
              {initError}
            </pre>
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="btn-terminal text-xs"
              >
                Reload
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} font-mono`}>
        <div className="flex min-h-screen items-center justify-center bg-[var(--void-black)]">
          <div className="console-panel rounded-xl p-8 text-center">
            <div className="relative mx-auto mb-4 h-10 w-10">
              <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--danger-red)]" />
              <div
                className="absolute inset-2 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--nuke-orange)]"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              />
            </div>
            <p className="text-sm text-[var(--text-dim)]">
              <span className="text-[var(--terminal-green)]">$</span> Initializing NukeTune...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <div className={`${jetbrainsMono.variable} ${spaceGrotesk.variable} font-mono`}>
        <TenantSessionSync />
        <Component {...pageProps} />
        <Analytics />
      </div>
    </MsalProvider>
  );
};

export default MyApp;
