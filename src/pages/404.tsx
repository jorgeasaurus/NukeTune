import Link from "next/link";
import { GradientBackground } from "~/components/ui/GradientBackground";
import { Navigation } from "~/components/ui/Navigation";
import { PageTitle } from "~/components/ui/PageMeta";

export default function NotFound() {
  return (
    <>
      <PageTitle route="/404" />

      <div className="relative min-h-screen bg-[var(--void-black)]">
        <GradientBackground />

        <div className="relative z-10">
          <Navigation />

          <main className="container mx-auto px-4 pt-44 pb-16 md:pt-32">
            <div className="mx-auto max-w-xl space-y-6 text-center">
              <span className="text-xs font-medium tracking-wider text-[var(--danger-red)] uppercase">
                {"//"} ERROR 404
              </span>
              <h1 className="font-display text-4xl font-bold tracking-tight text-white sm:text-5xl">
                Target Not Found
              </h1>
              <p className="terminal-prompt mx-auto text-[var(--text-dim)]">
                This page does not exist, or it has already been nuked.
              </p>
              <div className="pt-2">
                <Link
                  href="/"
                  className="btn-terminal inline-flex items-center gap-2 rounded-lg px-6 py-3 text-sm"
                >
                  <svg
                    className="h-4 w-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  Back to Home
                </Link>
              </div>
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
