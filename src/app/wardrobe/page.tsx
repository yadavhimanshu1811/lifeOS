export default function WardrobePage() {
  return (
    <main className="app-container">
      <div className="header">
        <h1 className="gradient-text">Wardrobe</h1>
        <p>Organize your outfits and style</p>
      </div>
      <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
        <span style={{ fontSize: "4rem", display: "block", marginBottom: "1rem" }}>👕</span>
        <h2 style={{ marginBottom: "1rem" }}>Coming Soon</h2>
        <p style={{ color: "var(--text-secondary)" }}>The wardrobe module is under development.</p>
      </div>
    </main>
  );
}
