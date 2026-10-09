"use client";

import { useState, useEffect } from "react";

export interface HistoryEntry {
  id: string;
  value: string;
  date: string;
  note?: string;
}

export interface BenchmarkItem {
  id: string;
  name: string;
  prValue: string;
  unitPlaceholder: string;
  history: HistoryEntry[];
}

export interface BenchmarkCategory {
  id: string;
  title: string;
  icon: string;
  accentColor: string;
  bgGradient: string;
  borderColor: string;
  items: BenchmarkItem[];
}

const INITIAL_CATEGORIES: BenchmarkCategory[] = [
  {
    id: "strength",
    title: "Strength",
    icon: "🏋️‍♂️",
    accentColor: "#f59e0b",
    bgGradient: "linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(234, 88, 12, 0.05) 100%)",
    borderColor: "rgba(245, 158, 11, 0.25)",
    items: [
      { id: "s-1", name: "Squats", prValue: "", unitPlaceholder: "e.g. 140 kg", history: [] },
      { id: "s-2", name: "Bench", prValue: "", unitPlaceholder: "e.g. 100 kg", history: [] },
      { id: "s-3", name: "Deadlift", prValue: "", unitPlaceholder: "e.g. 180 kg", history: [] },
    ],
  },
  {
    id: "running",
    title: "Running",
    icon: "🏃‍♂️",
    accentColor: "#06b6d4",
    bgGradient: "linear-gradient(135deg, rgba(6, 182, 212, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%)",
    borderColor: "rgba(6, 182, 212, 0.25)",
    items: [
      { id: "r-1", name: "400m", prValue: "", unitPlaceholder: "e.g. 58s", history: [] },
      { id: "r-2", name: "1km", prValue: "", unitPlaceholder: "e.g. 3:20", history: [] },
      { id: "r-3", name: "5km", prValue: "", unitPlaceholder: "e.g. 21:30", history: [] },
      { id: "r-4", name: "10km", prValue: "", unitPlaceholder: "e.g. 46:00", history: [] },
      { id: "r-5", name: "15km", prValue: "", unitPlaceholder: "e.g. 1:15:00", history: [] },
      { id: "r-6", name: "Half marathon", prValue: "", unitPlaceholder: "e.g. 1:44:30", history: [] },
      { id: "r-7", name: "Marathon", prValue: "", unitPlaceholder: "e.g. 3:55:00", history: [] },
    ],
  },
  {
    id: "others",
    title: "Others",
    icon: "⚡",
    accentColor: "#ec4899",
    bgGradient: "linear-gradient(135deg, rgba(236, 72, 153, 0.1) 0%, rgba(168, 85, 247, 0.05) 100%)",
    borderColor: "rgba(236, 72, 153, 0.25)",
    items: [
      { id: "o-1", name: "Max pullups", prValue: "", unitPlaceholder: "e.g. 22 reps", history: [] },
      { id: "o-2", name: "Weighted pullups", prValue: "", unitPlaceholder: "e.g. +35 kg", history: [] },
      { id: "o-3", name: "Max muscleups", prValue: "", unitPlaceholder: "e.g. 8 reps", history: [] },
      { id: "o-4", name: "Max pushups", prValue: "", unitPlaceholder: "e.g. 55 reps", history: [] },
      { id: "o-5", name: "Max squats", prValue: "", unitPlaceholder: "e.g. 75 reps", history: [] },
      { id: "o-6", name: "Max wall balls", prValue: "", unitPlaceholder: "e.g. 40 reps", history: [] },
    ],
  },
];

const STORAGE_KEY = "lifeos_hybrid_fitness";

export default function HybridFitnessPage() {
  const [categories, setCategories] = useState<BenchmarkCategory[]>(INITIAL_CATEGORIES);

  // Selected benchmark modal state
  const [activeSelection, setActiveSelection] = useState<{
    categoryId: string;
    itemId: string;
  } | null>(null);

  // Form input inside modal
  const [newValueInput, setNewValueInput] = useState("");
  const [newDateInput, setNewDateInput] = useState(() => new Date().toISOString().split("T")[0]);
  const [newNoteInput, setNewNoteInput] = useState("");

  // Load saved benchmark values from localStorage with migration support
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed: BenchmarkCategory[] = JSON.parse(saved);
        const normalized = parsed.map((cat) => {
          const defaultCat = INITIAL_CATEGORIES.find((c) => c.id === cat.id);
          return {
            ...cat,
            title: defaultCat ? defaultCat.title : cat.title,
            icon: defaultCat ? defaultCat.icon : cat.icon,
            items: (cat.items || []).map((item: any) => {
              const defaultItem = defaultCat?.items.find((i) => i.id === item.id);
              const pr = item.prValue ?? item.value ?? "";
              const history: HistoryEntry[] = Array.isArray(item.history)
                ? item.history
                : pr
                  ? [{ id: `init-${Date.now()}`, value: pr, date: new Date().toISOString().split("T")[0] }]
                  : [];
              return {
                id: item.id,
                name: defaultItem ? defaultItem.name : item.name,
                prValue: pr,
                unitPlaceholder: defaultItem ? defaultItem.unitPlaceholder : (item.unitPlaceholder || "Enter score"),
                history,
              };
            }),
          };
        });
        setTimeout(() => {
          setCategories(normalized);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
        }, 0);
      } catch (err) {
        console.error("Failed to parse hybrid fitness storage", err);
      }
    }
  }, []);

  const saveCategories = (newCategories: BenchmarkCategory[]) => {
    setCategories(newCategories);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newCategories));
  };

  const handleOpenModal = (categoryId: string, itemId: string) => {
    setActiveSelection({ categoryId, itemId });
    setNewValueInput("");
    setNewDateInput(new Date().toISOString().split("T")[0]);
    setNewNoteInput("");
  };

  const handleCloseModal = () => {
    setActiveSelection(null);
  };

  // Add a new value: saves to history and automatically updates the PR value
  const handleAddNewValue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSelection || !newValueInput.trim()) return;

    const trimmedValue = newValueInput.trim();
    const newEntry: HistoryEntry = {
      id: `hist-${Date.now()}`,
      value: trimmedValue,
      date: newDateInput || new Date().toISOString().split("T")[0],
      note: newNoteInput.trim() || undefined,
    };

    const updated = categories.map((cat) => {
      if (cat.id !== activeSelection.categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== activeSelection.itemId) return item;
          const sortedHistory = [newEntry, ...(item.history || [])].sort((a, b) => {
            const timeA = new Date(a.date).getTime() || 0;
            const timeB = new Date(b.date).getTime() || 0;
            return timeB - timeA;
          });
          return {
            ...item,
            prValue: trimmedValue, // PR automatically updates when new value is added
            history: sortedHistory,
          };
        }),
      };
    });

    saveCategories(updated);
    setNewValueInput("");
    setNewNoteInput("");
  };

  // Set any earlier historical value as current PR
  const handleSetHistoricalAsPR = (entryValue: string) => {
    if (!activeSelection) return;
    const updated = categories.map((cat) => {
      if (cat.id !== activeSelection.categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== activeSelection.itemId) return item;
          return {
            ...item,
            prValue: entryValue,
          };
        }),
      };
    });
    saveCategories(updated);
  };

  // Delete an entry from history
  const handleDeleteHistoryEntry = (historyId: string) => {
    if (!activeSelection) return;
    const updated = categories.map((cat) => {
      if (cat.id !== activeSelection.categoryId) return cat;
      return {
        ...cat,
        items: cat.items.map((item) => {
          if (item.id !== activeSelection.itemId) return item;
          const filteredHistory = (item.history || []).filter((h) => h.id !== historyId);
          // If the deleted entry was the current PR, fallback to the next latest entry or empty
          const deletedEntry = item.history?.find((h) => h.id === historyId);
          let nextPR = item.prValue;
          if (deletedEntry && deletedEntry.value === item.prValue) {
            nextPR = filteredHistory.length > 0 ? filteredHistory[0].value : "";
          }
          return {
            ...item,
            prValue: nextPR,
            history: filteredHistory,
          };
        }),
      };
    });
    saveCategories(updated);
  };

  // Add new benchmark item to category
  const handleAddBenchmark = (categoryId: string) => {
    const name = prompt("Enter new benchmark name:");
    if (!name || !name.trim()) return;

    const updated = categories.map((cat) => {
      if (cat.id !== categoryId) return cat;
      const newItem: BenchmarkItem = {
        id: `${categoryId}-${Date.now()}`,
        name: name.trim(),
        prValue: "",
        unitPlaceholder: "Enter score/time",
        history: [],
      };
      return {
        ...cat,
        items: [...cat.items, newItem],
      };
    });
    saveCategories(updated);
  };

  // Active item & category for modal
  const activeCategory = categories.find((c) => c.id === activeSelection?.categoryId);
  const activeItem = activeCategory?.items.find((i) => i.id === activeSelection?.itemId);

  return (
    <main className="app-container" style={{ paddingTop: "1rem" }}>
      {/* 3 Benchmark Cards Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))",
          gap: "1.2rem",
          alignItems: "start",
        }}
      >
        {categories.map((category) => {
          const filledCount = category.items.filter((i) => i.prValue.trim().length > 0).length;

          return (
            <div
              key={category.id}
              className="glass-panel"
              style={{
                borderRadius: "18px",
                padding: "1.1rem 1.25rem",
                background: category.bgGradient,
                border: `1px solid ${category.borderColor}`,
                boxShadow: "0 8px 24px rgba(0, 0, 0, 0.2)",
                display: "flex",
                flexDirection: "column",
                gap: "0.75rem",
              }}
            >
              {/* Card Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  borderBottom: `1px solid ${category.borderColor}`,
                  paddingBottom: "0.6rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.55rem" }}>
                  <span
                    style={{
                      fontSize: "1.2rem",
                      background: "rgba(255, 255, 255, 0.08)",
                      width: "34px",
                      height: "34px",
                      borderRadius: "10px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${category.borderColor}`,
                    }}
                  >
                    {category.icon}
                  </span>
                  <div>
                    <h2 style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--text-primary)", margin: 0, lineHeight: "1.2" }}>
                      {category.title}
                    </h2>
                    <span style={{ fontSize: "0.72rem", color: "var(--text-secondary)" }}>
                      {filledCount} of {category.items.length} logged
                    </span>
                  </div>
                </div>

                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: "600",
                    color: category.accentColor,
                    background: "rgba(255, 255, 255, 0.08)",
                    padding: "0.2rem 0.5rem",
                    borderRadius: "16px",
                    border: `1px solid ${category.borderColor}`,
                  }}
                >
                  {category.items.length} Benchmarks
                </span>
              </div>

              {/* Entries List - Clickable Tiles without input boxes */}
              <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem" }}>
                {category.items.map((item) => {
                  const hasPR = item.prValue && item.prValue.trim().length > 0;

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleOpenModal(category.id, item.id)}
                      title={`Click to view history & log PR for ${item.name}`}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "0.6rem",
                        background: "var(--surface-color)",
                        border: "1px solid var(--surface-border)",
                        padding: "0.55rem 0.85rem",
                        borderRadius: "10px",
                        cursor: "pointer",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                        e.currentTarget.style.borderColor = category.accentColor;
                        e.currentTarget.style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = "var(--surface-color)";
                        e.currentTarget.style.borderColor = "var(--surface-border)";
                        e.currentTarget.style.transform = "translateX(0)";
                      }}
                    >
                      {/* Name with status dot */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0, flex: 1 }}>
                        <span
                          style={{
                            width: "6px",
                            height: "6px",
                            borderRadius: "50%",
                            background: hasPR ? category.accentColor : "var(--text-secondary)",
                            opacity: hasPR ? 1 : 0.35,
                            flexShrink: 0,
                          }}
                        />
                        <span
                          style={{
                            fontSize: "0.88rem",
                            fontWeight: "600",
                            color: "var(--text-primary)",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {item.name}
                        </span>
                      </div>

                      {/* PR value */}
                      <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexShrink: 0 }}>
                        <span
                          style={{
                            fontSize: "0.85rem",
                            fontWeight: "700",
                            color: hasPR ? category.accentColor : "var(--text-secondary)",
                            background: hasPR ? "rgba(255, 255, 255, 0.05)" : "transparent",
                            padding: hasPR ? "0.15rem 0.45rem" : "0",
                            borderRadius: "6px",
                          }}
                        >
                          {hasPR ? item.prValue : "--"}
                        </span>
                        <span style={{ fontSize: "0.85rem", color: "var(--text-secondary)", opacity: 0.5 }}>›</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Benchmark Button */}
              <button
                onClick={() => handleAddBenchmark(category.id)}
                style={{
                  width: "100%",
                  marginTop: "0.25rem",
                  padding: "0.4rem 0.6rem",
                  borderRadius: "10px",
                  border: `1px dashed ${category.borderColor}`,
                  background: "rgba(255, 255, 255, 0.03)",
                  color: "var(--text-secondary)",
                  fontSize: "0.78rem",
                  fontWeight: "600",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.3rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.03)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                <span>+ Add Benchmark</span>
              </button>
            </div>
          );
        })}
      </div>

      {/* Benchmark Detail & History Modal */}
      {activeSelection && activeCategory && activeItem && (() => {
        const sortedHistory = [...(activeItem.history || [])].sort((a, b) => {
          const timeA = new Date(a.date).getTime() || 0;
          const timeB = new Date(b.date).getTime() || 0;
          return timeB - timeA; // Most recent date first
        });

        return (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div
              className="modal-content"
              style={{
                maxWidth: "760px",
                width: "100%",
                padding: "1.75rem",
                background: "var(--bg-color)",
                color: "var(--text-primary)",
                borderRadius: "20px",
                border: "1px solid var(--surface-border)",
                boxShadow: "0 20px 50px rgba(0, 0, 0, 0.4)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", borderBottom: "1px solid var(--surface-border)", paddingBottom: "0.85rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      background: "var(--surface-color)",
                      width: "44px",
                      height: "44px",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1px solid ${activeCategory.borderColor}`,
                    }}
                  >
                    {activeCategory.icon}
                  </span>
                  <div>
                    <h2 style={{ fontSize: "1.35rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
                      {activeItem.name}
                    </h2>
                    <span style={{ fontSize: "0.75rem", color: activeCategory.accentColor, fontWeight: "600" }}>
                      {activeCategory.title} Benchmark
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCloseModal}
                  style={{
                    background: "var(--surface-color)",
                    border: "1px solid var(--surface-border)",
                    color: "var(--text-secondary)",
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    transition: "background 0.2s, color 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "var(--surface-border)";
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--surface-color)";
                    e.currentTarget.style.color = "var(--text-secondary)";
                  }}
                >
                  &times;
                </button>
              </div>

              {/* Two-Column Layout: Left = Current PR & Log Form, Right = Logged History */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(310px, 1fr))",
                  gap: "1.5rem",
                  alignItems: "start",
                }}
              >
                {/* LEFT HALF: Current PR Highlight & Log Form */}
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {/* Current PR Highlight Box */}
                  <div
                    style={{
                      background: "var(--surface-color)",
                      border: `1px solid ${activeCategory.borderColor}`,
                      borderRadius: "14px",
                      padding: "0.9rem 1.15rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", display: "block" }}>
                        Current PR Value
                      </span>
                      <div style={{ fontSize: "1.7rem", fontWeight: "800", color: activeItem.prValue ? activeCategory.accentColor : "var(--text-secondary)", marginTop: "0.15rem" }}>
                        {activeItem.prValue || "None logged"}
                      </div>
                    </div>
                    <span style={{ fontSize: "2rem" }}>🏆</span>
                  </div>

                  {/* Form to Enter New Value */}
                  <form onSubmit={handleAddNewValue} style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>
                      Log New Entry & Auto-Update PR
                    </div>

                    <div>
                      <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                        Score / Time / Weight
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={activeItem.unitPlaceholder || "e.g. 140 kg"}
                        value={newValueInput}
                        onChange={(e) => setNewValueInput(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.55rem 0.8rem",
                          borderRadius: "10px",
                          border: "1px solid var(--surface-border)",
                          background: "var(--input-bg)",
                          color: "var(--text-primary)",
                          fontSize: "0.9rem",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                        Date
                      </label>
                      <input
                        type="date"
                        value={newDateInput}
                        onChange={(e) => setNewDateInput(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.8rem",
                          borderRadius: "10px",
                          border: "1px solid var(--surface-border)",
                          background: "var(--input-bg)",
                          color: "var(--text-primary)",
                          fontSize: "0.82rem",
                          outline: "none",
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: "0.25rem" }}>
                        Note (Optional)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Set during test week"
                        value={newNoteInput}
                        onChange={(e) => setNewNoteInput(e.target.value)}
                        style={{
                          width: "100%",
                          padding: "0.5rem 0.8rem",
                          borderRadius: "10px",
                          border: "1px solid var(--surface-border)",
                          background: "var(--input-bg)",
                          color: "var(--text-primary)",
                          fontSize: "0.82rem",
                          outline: "none",
                        }}
                      />
                    </div>

                    <button
                      type="submit"
                      style={{
                        marginTop: "0.25rem",
                        width: "100%",
                        padding: "0.55rem 1.1rem",
                        borderRadius: "10px",
                        background: "var(--accent-gradient)",
                        border: "none",
                        color: "white",
                        fontWeight: "600",
                        fontSize: "0.88rem",
                        cursor: "pointer",
                        boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                      }}
                    >
                      + Log PR
                    </button>
                  </form>
                </div>

                {/* RIGHT HALF: Logged History */}
                <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", fontWeight: "600" }}>
                      Logged History ({sortedHistory.length})
                    </span>
                    <span style={{ fontSize: "0.7rem", color: "var(--text-secondary)" }}>
                      Latest first
                    </span>
                  </div>

                  <div
                    style={{
                      maxHeight: "330px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.45rem",
                      paddingRight: "0.25rem",
                    }}
                  >
                    {sortedHistory.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "2rem 1rem",
                          background: "var(--surface-color)",
                          borderRadius: "12px",
                          border: "1px dashed var(--surface-border)",
                          color: "var(--text-secondary)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No earlier values recorded yet. Log your first value on the left!
                      </div>
                    ) : (
                      sortedHistory.map((entry) => {
                        const isCurrentPR = entry.value === activeItem.prValue;

                        return (
                          <div
                            key={entry.id}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "0.55rem 0.8rem",
                              borderRadius: "10px",
                              background: isCurrentPR ? "var(--surface-color)" : "transparent",
                              border: `1px solid ${isCurrentPR ? activeCategory.borderColor : "var(--surface-border)"}`,
                              gap: "0.5rem",
                            }}
                          >
                            <div style={{ minWidth: 0, flex: 1 }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.95rem", fontWeight: "700", color: isCurrentPR ? activeCategory.accentColor : "var(--text-primary)" }}>
                                  {entry.value}
                                </span>
                                {isCurrentPR && (
                                  <span
                                    style={{
                                      fontSize: "0.62rem",
                                      fontWeight: "700",
                                      background: activeCategory.accentColor,
                                      color: "white",
                                      padding: "0.1rem 0.4rem",
                                      borderRadius: "10px",
                                    }}
                                  >
                                    PR 🏆
                                  </span>
                                )}
                              </div>
                              <div style={{ fontSize: "0.73rem", color: "var(--text-secondary)", marginTop: "0.15rem" }}>
                                📅 {entry.date} {entry.note ? `• ${entry.note}` : ""}
                              </div>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", flexShrink: 0 }}>
                              {!isCurrentPR && (
                                <button
                                  type="button"
                                  onClick={() => handleSetHistoricalAsPR(entry.value)}
                                  title="Set this earlier entry as current PR"
                                  style={{
                                    background: "var(--surface-color)",
                                    border: "1px solid var(--surface-border)",
                                    color: "var(--text-primary)",
                                    fontSize: "0.7rem",
                                    padding: "0.22rem 0.45rem",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    whiteSpace: "nowrap",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = activeCategory.borderColor;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--surface-border)";
                                  }}
                                >
                                  Set as PR
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleDeleteHistoryEntry(entry.id)}
                                title="Delete this record"
                                style={{
                                  background: "transparent",
                                  border: "none",
                                  color: "var(--text-secondary)",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  padding: "0.2rem",
                                  borderRadius: "4px",
                                  opacity: 0.6,
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = "1";
                                  e.currentTarget.style.color = "var(--danger-color)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = "0.6";
                                  e.currentTarget.style.color = "var(--text-secondary)";
                                }}
                              >
                                &times;
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
    </main>
  );
}
