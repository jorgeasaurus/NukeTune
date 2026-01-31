import Head from "next/head";
import { AuthGuard } from "~/components/auth";
import { Header } from "~/components/layout";
import { CategorySelector } from "~/components/categories";
import { PreviewModal } from "~/components/preview";
import { DeletionProgress } from "~/components/deletion";
import { useNukeTuneStore, useSelectedCategories } from "~/store";
import { GradientBackground } from "~/components/ui/GradientBackground";

export default function Dashboard() {
  const openPreview = useNukeTuneStore((state) => state.openPreview);
  const deletionPhase = useNukeTuneStore((state) => state.deletionPhase);
  const selectedCategories = useSelectedCategories();

  const hasSelection = selectedCategories.length > 0;

  return (
    <AuthGuard>
      <Head>
        <title>Dashboard - NukeTune</title>
      </Head>

      <div className="min-h-screen bg-[var(--void-black)]">
        <GradientBackground />
        <div className="relative z-10">
          <Header />

          <main className="mx-auto max-w-7xl px-4 py-8">
            {/* Page Header */}
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 rounded-md border border-[var(--console-border)] bg-[var(--console-panel)] px-3 py-1.5 mb-4">
                <span className="status-dot status-dot-danger" />
                <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                  Control Panel Active
                </span>
              </div>
              <h1 className="font-display text-3xl font-bold tracking-tight text-white">
                Intune Environment Reset
              </h1>
              <p className="mt-2 text-sm text-[var(--text-dim)]">
                Select target categories, preview affected objects, execute deletion protocol
              </p>
            </div>

            {/* Warning Banner */}
            <div className="banner-danger mb-8 p-5">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[var(--critical-red)]/20">
                  <svg
                    className="h-5 w-5 text-[var(--critical-red)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>
                <div>
                  <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-[var(--critical-red)]">
                    Destructive Operation Warning
                  </h2>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--critical-red)]/70">
                    Objects deleted from Intune cannot be recovered. This includes
                    device enrollments, app assignments, and policy configurations.
                    Ensure you have backups before proceeding.
                  </p>
                </div>
              </div>
            </div>

            <CategorySelector />

            {/* Execute Button */}
            <div className="mt-8 flex justify-end">
              <button
                type="button"
                onClick={openPreview}
                disabled={!hasSelection}
                className="btn-danger group relative rounded-lg px-8 py-4 text-base"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  Preview Deletion
                  <span className="rounded bg-white/20 px-2 py-0.5 text-xs font-bold">
                    {selectedCategories.length}
                  </span>
                </span>
              </button>
            </div>
          </main>

          <PreviewModal />
          {(deletionPhase === "deleting" ||
            deletionPhase === "confirming" ||
            deletionPhase === "complete") && <DeletionProgress />}
        </div>
      </div>
    </AuthGuard>
  );
}
