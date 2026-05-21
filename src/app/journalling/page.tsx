"use client";

import { useState, useEffect } from "react";

interface JournalEntry {
  id: string;
  text: string;
  sentiment: string;
  createdAt: string; // ISO date string
}

export default function JournallingPage() {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  
  // Write Modal State
  const [newText, setNewText] = useState("");
  const [newSentiment, setNewSentiment] = useState("😐");
  
  const emojis = ["😭", "😢", "😐", "🙂", "😀", "🤩"];

  useEffect(() => {
    const saved = localStorage.getItem("lifeos_journal");
    if (saved) {
      setEntries(JSON.parse(saved));
    }
  }, []);

  const saveEntry = () => {
    if (!newText.trim()) return;
    const newEntry: JournalEntry = {
      id: crypto.randomUUID(),
      text: newText,
      sentiment: newSentiment,
      createdAt: new Date().toISOString(),
    };
    
    const updated = [newEntry, ...entries];
    setEntries(updated);
    localStorage.setItem("lifeos_journal", JSON.stringify(updated));
    setIsWriteModalOpen(false);
    setNewText("");
    setNewSentiment("😐");
  };

  // Group entries by day (YYYY-MM-DD format logically)
  const groupedEntries = entries.reduce((acc, entry) => {
    const date = new Date(entry.createdAt).toLocaleDateString(undefined, {
      year: 'numeric', month: 'short', day: 'numeric'
    });
    if (!acc[date]) acc[date] = [];
    acc[date].push(entry);
    return acc;
  }, {} as Record<string, JournalEntry[]>);

  return (
    <main className="app-container">
      <div 
        className="header" 
        style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          marginBottom: "3rem", 
          flexWrap: "wrap", 
          gap: "1.5rem" 
        }}
      >
        <div style={{ textAlign: "left", marginBottom: 0 }}>
          <h1 className="gradient-text" style={{ fontSize: "3.5rem", marginBottom: "0.5rem" }}>Journalling</h1>
          <p style={{ color: "var(--text-secondary)", fontSize: "1.1rem" }}>Record your thoughts and reflect</p>
        </div>
        <button className="btn-primary" onClick={() => setIsWriteModalOpen(true)}>
          ✍️ Write your mind
        </button>
      </div>

      {/* Day Cards Grid */}
      {Object.keys(groupedEntries).length === 0 ? (
        <div className="glass-panel" style={{ textAlign: "center", padding: "4rem 2rem" }}>
          <span style={{ fontSize: "4rem", display: "block", marginBottom: "1rem" }}>📖</span>
          <h2 style={{ marginBottom: "1rem" }}>No entries yet</h2>
          <p style={{ color: "var(--text-secondary)" }}>Click "Write your mind" to start your first journal entry.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1.5rem" }}>
          {Object.entries(groupedEntries).map(([date, dayEntries]) => (
            <div 
              key={date} 
              className="glass-panel day-card" 
              onClick={() => setSelectedDay(date)}
            >
              <h3 style={{ fontSize: "1.2rem", fontWeight: "600" }}>{date}</h3>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
                {[...dayEntries]
                  .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                  .slice(0, 5)
                  .map(e => (
                    <span key={e.id} style={{ fontSize: "1.4rem" }}>{e.sentiment}</span>
                  ))}
                {dayEntries.length > 5 && (
                  <span style={{ color: "var(--text-secondary)", alignSelf: "center", fontSize: "0.9rem", fontWeight: "600" }}>
                    +{dayEntries.length - 5}
                  </span>
                )}
              </div>
              <p style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>{dayEntries.length} entries</p>
            </div>
          ))}
        </div>
      )}

      {/* Write Modal */}
      {isWriteModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWriteModalOpen(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setIsWriteModalOpen(false)}>×</button>
            <h2 style={{ marginBottom: "1rem" }}>How are you feeling?</h2>
            
            <div className="sentiment-selector">
              {emojis.map(emoji => (
                <button
                  key={emoji}
                  className={`sentiment-emoji ${newSentiment === emoji ? "selected" : ""}`}
                  onClick={() => setNewSentiment(emoji)}
                  title={emoji}
                >
                  {emoji}
                </button>
              ))}
            </div>

            <textarea
              className="journal-textarea"
              placeholder="Write your thoughts here..."
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              autoFocus
            />

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-primary" onClick={saveEntry}>Save Entry</button>
            </div>
          </div>
        </div>
      )}

      {/* Day Details Modal */}
      {selectedDay && (
        <div className="modal-overlay" onClick={() => setSelectedDay(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedDay(null)}>×</button>
            <h2 style={{ marginBottom: "0.5rem" }}>{selectedDay}</h2>
            <p style={{ color: "var(--text-secondary)" }}>{groupedEntries[selectedDay]?.length} entries</p>
            
            <div className="entries-timeline">
              {[...(groupedEntries[selectedDay] || [])]
                .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
                .map(entry => (
                <div key={entry.id} className="entry-item">
                  <div className="entry-emoji">
                    {entry.sentiment}
                  </div>
                  <div className="entry-content">
                    <div className="entry-header">
                      <span>{new Date(entry.createdAt).toLocaleDateString(undefined, { weekday: 'long' })}</span>
                      <span>
                        {new Date(entry.createdAt).toLocaleTimeString(undefined, { 
                          hour: '2-digit', minute: '2-digit' 
                        })}
                      </span>
                    </div>
                    <div className="entry-text">{entry.text}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
