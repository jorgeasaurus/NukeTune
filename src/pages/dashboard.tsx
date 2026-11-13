import Head from "next/head";
import { AuthGuard } from "~/components/auth";
import { Header } from "~/components/layout";
import { PreviewModal } from "~/components/preview";
import { DeletionProgress } from "~/components/deletion";
import { DashboardMain } from "~/components/dashboard/DashboardMain";
import { useNukeTuneStore } from "~/store";
import { GradientBackground } from "~/components/ui/GradientBackground";
import { useBeforeUnloadGuard } from "~/hooks/useBeforeUnloadGuard";

export default function Dashboard() {
  const deletionPhase = useNukeTuneStore((state) => state.deletionPhase);

  useBeforeUnloadGuard(deletionPhase === "deleting" || deletionPhase === "confirming");

  return (
    <AuthGuard>
      <Head>
        <title>Dashboard - NukeTune</title>
        {/* viewport-fit=cover exposes safe-area insets to the sticky action bar. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />
      </Head>

      <div className="min-h-screen bg-[var(--void-black)]">
        <GradientBackground />
        <div className="relative z-10">
          <Header />
          <DashboardMain />
          <PreviewModal />
          {(deletionPhase === "deleting" ||
            deletionPhase === "confirming" ||
            deletionPhase === "complete") && <DeletionProgress />}
        </div>
      </div>
    </AuthGuard>
  );
}
