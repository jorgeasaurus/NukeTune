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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
      <div className="console-modal console-modal-danger flex max-h-[90vh] w-full max-w-4xl flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[var(--console-border)] p-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="status-dot status-dot-warning" />
              <span className="text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                Preview Mode
              </span>
            </div>
            <h2 className="font-display text-2xl font-bold text-white">
              Deletion Preview
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="btn-terminal rounded-lg p-2"
            aria-label="Close"
          >
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
                <div className="absolute inset-0 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--terminal-green)]" />
                <div
                  className="absolute inset-2 animate-spin rounded-full border-2 border-[var(--console-border)] border-t-[var(--terminal-green)]"
                  style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
                />
              </div>
              <p className="mt-4 text-sm text-[var(--text-dim)]">
                <span className="text-[var(--terminal-green)]">$</span> Loading objects from Intune...
              </p>
            </div>
          ) : (
            <PreviewTable categories={selectedCategories} />
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[var(--console-border)] p-6">
          <div className="banner-danger mb-4 p-4">
            <p className="text-sm text-[var(--critical-red)]">
              <strong>Warning:</strong> This action is irreversible. You are about
              to delete{" "}
              <strong className="font-mono">{totalCount}</strong> objects across{" "}
              <strong className="font-mono">{selectedCategories.length}</strong> categories.
            </p>
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-[var(--text-dim)]">
                Type <span className="font-mono text-[var(--danger-red)]">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type DELETE to confirm"
                className="input-terminal input-danger"
              />
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={handleClose} className="btn-terminal">
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDeletion}
                disabled={!isConfirmed || anyLoading || totalCount === 0}
                className="btn-danger"
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
