export function GradientBackground() {
  return (
    <div className="terminal-bg" aria-hidden="true">
      {/* Nuclear reactor core pulse */}
      <div className="reactor-core" />

      {/* Grid overlay - facility aesthetic */}
      <div className="grid-overlay" />

      {/* CRT scanlines */}
      <div className="scanlines-overlay" />

      {/* Noise texture for depth */}
      <div className="noise-texture" />
    </div>
  );
}
