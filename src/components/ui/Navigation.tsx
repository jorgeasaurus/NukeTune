import Link from "next/link";
import Image from "next/image";
import { useIsAuthenticated } from "@azure/msal-react";
import { useRouter } from "next/router";
import { useState } from "react";
import { SignInButton, CloudEnvironmentSelector } from "~/components/auth";
import { signIn } from "~/lib/auth/authUtils";
import type { CloudEnvironment } from "~/types/cloud";

export function Navigation() {
  const isAuthenticated = useIsAuthenticated();
  const router = useRouter();
  const [showCloudSelector, setShowCloudSelector] = useState(false);

  const handleContinue = () => {
    void router.push("/dashboard");
  };

  const handleSignInClick = () => {
    setShowCloudSelector(true);
  };

  const handleCloudSelect = async (environment: CloudEnvironment) => {
    setShowCloudSelector(false);
    try {
      await signIn(environment);
      void router.push("/dashboard");
    } catch (error) {
      console.error("Sign in error:", error);
    }
  };

  const handleCloudSelectorCancel = () => {
    setShowCloudSelector(false);
  };

  return (
    <>
      <div className="fixed left-1/2 top-4 z-50 w-full max-w-4xl -translate-x-1/2 px-4">
        <nav className="nav-glass flex items-center justify-between rounded-full px-4 py-3 shadow-lg sm:px-6">
          {/* Logo and Brand */}
          <Link
            href="/"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <Image
              src="/logo.png"
              alt="NukeTune"
              width={32}
              height={32}
              className="h-8 w-8 rounded-lg"
            />
            <span className="hidden text-lg font-bold text-white sm:inline-block">
              NukeTune
            </span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden items-center gap-6 md:flex">
            <Link
              href="#features"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Features
            </Link>
            <Link
              href="#how-it-works"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              How It Works
            </Link>
            <Link
              href="/setup"
              className="text-sm font-medium text-gray-400 transition-colors hover:text-white"
            >
              Setup
            </Link>
          </div>

          {/* CTA Button */}
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <button
                onClick={handleContinue}
                className="btn-shine rounded-full bg-gradient-to-r from-red-500 to-orange-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-red-400 hover:to-orange-500"
              >
                Dashboard
              </button>
            ) : (
              <SignInButton
                onClick={handleSignInClick}
                className="btn-shine flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur-sm transition-all hover:border-white/20 hover:bg-white/10"
              />
            )}
          </div>
        </nav>
      </div>

      {/* Cloud Environment Selector */}
      <CloudEnvironmentSelector
        open={showCloudSelector}
        onSelect={handleCloudSelect}
        onCancel={handleCloudSelectorCancel}
      />
    </>
  );
}
