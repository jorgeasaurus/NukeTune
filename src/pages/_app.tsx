import { type AppType } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { MsalProvider } from "@azure/msal-react";
import { JetBrains_Mono, Space_Grotesk } from "next/font/google";
import {
  msalInstance,
  initializeMsal,
  CustomNavigationClient,
} from "~/lib/msal";

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
  const initStarted = useRef(false);

  useEffect(() => {
    if (initStarted.current) return;
    initStarted.current = true;

    const init = async () => {
      const navigationClient = new CustomNavigationClient(router);
      msalInstance.setNavigationClient(navigationClient);
      await initializeMsal();
      setIsInitialized(true);
    };
    void init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <Component {...pageProps} />
      </div>
    </MsalProvider>
  );
};

export default MyApp;
