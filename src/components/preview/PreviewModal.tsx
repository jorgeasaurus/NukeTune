import { useState, useEffect } from "react";
import { useNukeTuneStore, useSelectedCategories, useTotalObjectCount } from "~/store";
import { useIntune } from "~/hooks/useIntune";
import { PreviewTable } from "./PreviewTable";

export function PreviewModal() {
  const previewOpen = useNukeTuneStore((state) => state.previewOpen);
  const closePreview = useNukeTuneStore((state) => state.closePreview);
  const setDeletionPhase = useNukeTuneStore((state) => state.setDeletionPhase);
  const selectedCategories = useSelectedCategories();
  const totalCount = useTotalObjectCount();
  const { loadSelectedCategories, startDeletion } = useIntune();

  const [confirmText, setConfirmText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const isConfirmed = confirmText.toUpperCase() === "DELETE";
  const anyLoading = selectedCategories.some((cat) => cat.loading);

  useEffect(() => {
    if (previewOpen && !hasLoaded) {
      setIsLoading(true);
      loadSelectedCategories()
        .then(() => {
          setHasLoaded(true);
        })
        .catch((err: unknown) => {
          console.error("Failed to load categories:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [previewOpen, hasLoaded, loadSelectedCategories]);

  useEffect(() => {
    if (!previewOpen) {
      setConfirmText("");
      setHasLoaded(false);
    }
  }, [previewOpen]);

  if (!previewOpen) return null;

  const handleStartDeletion = () => {
    if (!isConfirmed) return;
    setDeletionPhase("confirming");
    void startDeletion();
  };

  const handleClose = () => {
    closePreview();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm">
      <div className="glass-modal flex max-h-[90vh] w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <div>
            <h2 className="text-2xl font-bold text-gradient">Preview Deletion</h2>
            <p className="mt-1 text-sm text-gray-400">
              Review the objects that will be deleted
            </p>
          </div>
          <button
            onClick={handleClose}
            className="rounded-lg p-2 text-gray-400 transition-all duration-200 hover:bg-white/5 hover:text-white"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {isLoading || anyLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="relative h-14 w-14">
                <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-blue-500" />
                <div className="absolute inset-2 animate-spin rounded-full border-4 border-transparent border-t-blue-400" style={{ animationDirection: "reverse", animationDuration: "1.5s" }} />
              </div>
              <p className="mt-4 text-gray-400">Loading objects from Intune...</p>
            </div>
          ) : (
            <PreviewTable categories={selectedCategories} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-white/10 p-6">
          <div className="glass glass-danger mb-4 p-4">
            <p className="text-sm text-red-200/90">
              <strong className="text-red-300">Warning:</strong> This action is irreversible. You are about
              to delete <strong className="text-white">{totalCount}</strong> objects across{" "}
              <strong className="text-white">{selectedCategories.length}</strong> categories.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-sm font-medium text-gray-300">
                Type <span className="font-mono text-red-400">DELETE</span> to
                confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="glass-input focus:border-red-500/50"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="glass-button"
              >
                Cancel
              </button>
              <button
                onClick={handleStartDeletion}
                disabled={!isConfirmed || anyLoading || totalCount === 0}
                className="rounded-xl bg-gradient-to-r from-red-500 to-red-600 px-6 py-3 font-semibold text-white shadow-lg shadow-red-500/20 transition-all duration-300 hover:-translate-y-0.5 hover:from-red-400 hover:to-red-500 hover:shadow-xl hover:shadow-red-500/30 active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
              >
                Delete {totalCount} Objects
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
