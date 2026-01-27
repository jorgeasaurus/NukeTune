import { useIsAuthenticated, useMsal } from "@azure/msal-react";
import { useRouter } from "next/router";
import { useEffect, useRef, type ReactNode } from "react";

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  const isAuthenticated = useIsAuthenticated();
  const { inProgress } = useMsal();
  const router = useRouter();
  const hasRedirected = useRef(false);

  useEffect(() => {
    if (!isAuthenticated && inProgress === "none" && !hasRedirected.current) {
      hasRedirected.current = true;
      void router.push("/");
    }
  }, [isAuthenticated, inProgress, router]);

  if (inProgress !== "none") {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 bg-mesh">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="relative mx-auto mb-4 h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
              <div
                className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-blue-400"
                style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
              />
            </div>
            <p className="text-gray-400">Authenticating...</p>
          </div>
        </div>
      )
    );
  }

  if (!isAuthenticated) {
    return (
      fallback ?? (
        <div className="flex min-h-screen items-center justify-center bg-gray-950 bg-mesh">
          <div className="glass rounded-2xl p-8 text-center">
            <div className="relative mx-auto mb-4 h-12 w-12">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-gray-500" />
            </div>
            <p className="text-gray-400">Redirecting to login...</p>
          </div>
        </div>
      )
    );
  }

  return <>{children}</>;
}
