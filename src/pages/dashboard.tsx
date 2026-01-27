import Head from "next/head";
import { AuthGuard } from "~/components/auth";
import { Header } from "~/components/layout";
import { CategorySelector } from "~/components/categories";
import { PreviewModal } from "~/components/preview";
import { DeletionProgress } from "~/components/deletion";
import { useNukeTuneStore, useSelectedCategories } from "~/store";

export default function Dashboard() {
  const openPreview = useNukeTuneStore((state) => state.openPreview);
  const deletionPhase = useNukeTuneStore((state) => state.deletionPhase);
  const selectedCategories = useSelectedCategories();

  const hasSelection = selectedCategories.length > 0;

  return (
    <AuthGuard>
      <Head>
        <title>Dashboard - NukeTune</title>
        <link rel="icon" type="image/png" href="/logo.png" />
      </Head>

      <div className="min-h-screen bg-gray-950 bg-mesh">
        <Header />

        <main className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-gradient">
              Intune Environment Reset
            </h1>
            <p className="mt-2 text-gray-400">
              Select the categories you want to delete, then preview and confirm
              the deletion.
            </p>
          </div>

          <div className="glass glass-danger glass-hover mb-8 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-500/20 backdrop-blur-sm">
                <svg
                  className="h-6 w-6 text-red-400"
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
                <h2 className="font-semibold text-red-300">
                  Destructive Operation Warning
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-red-200/70">
                  Objects deleted from Intune cannot be recovered. This includes
                  device enrollments, app assignments, and policy configurations.
                  Make sure you have backups of any important configurations
                  before proceeding.
                </p>
              </div>
            </div>
          </div>

          <CategorySelector />

          <div className="mt-8 flex justify-end">
            <button
              onClick={openPreview}
              disabled={!hasSelection}
              className="group relative overflow-hidden rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-8 py-3.5 text-lg font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-red-400 hover:to-red-500 hover:shadow-xl hover:shadow-red-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-lg"
            >
              Preview Deletion ({selectedCategories.length} categories)
            </button>
          </div>
        </main>

        <PreviewModal />
        {(deletionPhase === "deleting" ||
          deletionPhase === "confirming" ||
          deletionPhase === "complete") && <DeletionProgress />}
      </div>
    </AuthGuard>
  );
}
