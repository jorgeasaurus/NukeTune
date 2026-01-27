export function GradientBackground() {
  return (
    <div className="gradient-bg" aria-hidden="true">
      {/* Radioactive core pulse */}
      <div className="radioactive-core" />

      {/* Radiation waves expanding outward */}
      <div className="radiation-wave" />
      <div className="radiation-wave" />
      <div className="radiation-wave" />
      <div className="radiation-wave" />

      {/* Floating radioactive particles */}
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />
      <div className="particle" />

      {/* Gradient orbs */}
      <div className="gradient-orb gradient-orb-1" />
      <div className="gradient-orb gradient-orb-2" />
      <div className="gradient-orb gradient-orb-3" />

      {/* Overlays */}
      <div className="gradient-mesh" />
      <div className="noise-overlay" />
      <div className="scanlines" />
    </div>
  );
}
