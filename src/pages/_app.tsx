import { type AppType } from "next/app";
import { useRouter } from "next/router";
import { useEffect, useState, useRef } from "react";
import { MsalProvider } from "@azure/msal-react";
import { Geist } from "next/font/google";
import {
  msalInstance,
  initializeMsal,
  CustomNavigationClient,
} from "~/lib/msal";

import "~/styles/globals.css";

const geist = Geist({
  subsets: ["latin"],
});

const MyApp: AppType = ({ Component, pageProps }) => {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const initStarted = useRef(false);

  useEffect(() => {
    // Only initialize once
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
      <div className={geist.className}>
        <div className="flex min-h-screen items-center justify-center bg-gray-950 bg-mesh">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="relative mx-auto mb-4 h-10 w-10">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-red-500" />
              <div
                className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-orange-400"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              />
            </div>
            <p className="text-gradient font-medium">Loading NukeTune...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <MsalProvider instance={msalInstance}>
      <div className={geist.className}>
        <Component {...pageProps} />
      </div>
    </MsalProvider>
  );
};

export default MyApp;
