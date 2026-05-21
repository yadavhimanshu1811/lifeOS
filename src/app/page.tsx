export default function Home() {
  return (
    <main className="app-container" style={{ textAlign: "center" }}>
      <div className="header" style={{ marginTop: "2rem" }}>
        <h1 className="gradient-text" style={{ fontSize: "4.5rem", marginBottom: "1rem" }}>LifeOS</h1>
        <p style={{ fontSize: "1.25rem", maxWidth: "600px", margin: "0 auto 3rem" }}>
          Your premium personal portal. Track your habits, organize your tasks, manage your wardrobe, and more, all in one elegant interface.
        </p>
      </div>

      <div className="glass-panel" style={{ padding: "3rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
        {/* Quick Links Preview */}
        {[
          { name: "Todo List", path: "/todo", icon: "✓" },
          { name: "Habit Tracker", path: "/habit-tracker", icon: "↺" },
          { name: "Fitness", path: "/fitness", icon: "💪" },
          { name: "Journalling", path: "/journalling", icon: "✍️" },
          { name: "Wardrobe", path: "/wardrobe", icon: "👕" },
          { name: "Games", path: "/games", icon: "🎮" },
        ].map((link) => (
          <a key={link.name} href={link.path} className="todo-item" style={{ flexDirection: "column", gap: "1rem", textDecoration: "none", color: "inherit" }}>
            <span style={{ fontSize: "2rem" }}>{link.icon}</span>
            <span style={{ fontWeight: "600", fontSize: "1.1rem" }}>{link.name}</span>
          </a>
        ))}
      </div>
    </main>
  );
}
