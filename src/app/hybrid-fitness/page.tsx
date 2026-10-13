"use client";

import { useState, useEffect } from "react";
import TrainingCalendar from "@/components/TrainingCalendar";

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
      { id: "o-1", name: "Max Pullups", prValue: "", unitPlaceholder: "e.g. 22 reps", history: [] },
      { id: "o-2", name: "Weighted Pullups", prValue: "", unitPlaceholder: "e.g. +35 kg", history: [] },
      { id: "o-3", name: "Max Muscleups", prValue: "", unitPlaceholder: "e.g. 8 reps", history: [] },
      { id: "o-4", name: "Max Pushups", prValue: "", unitPlaceholder: "e.g. 55 reps", history: [] },
      { id: "o-5", name: "Max Squats", prValue: "", unitPlaceholder: "e.g. 75 reps", history: [] },
      { id: "o-6", name: "Max Wall Balls", prValue: "", unitPlaceholder: "e.g. 40 reps", history: [] },
    ],
  },
];

const STORAGE_KEY = "lifeos_hybrid_fitness";

export default function HybridFitnessPage() {
  const [categories, setCategories] = useState<BenchmarkCategory[]>(INITIAL_CATEGORIES);
  const [isExpanded, setIsExpanded] = useState(true);
  const [isPlanExpanded, setIsPlanExpanded] = useState(true);

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

  const totalBenchmarks = categories.reduce((sum, cat) => sum + cat.items.length, 0);
  const totalLogged = categories.reduce(
    (sum, cat) => sum + cat.items.filter((i) => i.prValue.trim().length > 0).length,
    0
  );

  return (
    <main className="app-container" style={{ paddingTop: "1rem", display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* Collapsible Personal Bests Section */}
      <div
        className="glass-panel"
        style={{
          borderRadius: "20px",
          padding: "1.2rem 1.4rem",
          background: "var(--surface-color)",
          border: "1px solid var(--surface-border)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Clickable Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsExpanded((prev) => !prev);
            }
          }}
          title={isExpanded ? "Click to collapse Personal Bests" : "Click to expand Personal Bests"}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontSize: "1.35rem",
                background: "rgba(255, 255, 255, 0.08)",
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--surface-border)",
              }}
            >
              🏆
            </span>
            <div>
              <h1
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: "1.2",
                  letterSpacing: "-0.01em",
                }}
              >
                Personal Bests
              </h1>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                {totalLogged} of {totalBenchmarks} logged • {categories.length} categories
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: "600",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "0.22rem 0.55rem",
                borderRadius: "12px",
                border: "1px solid var(--surface-border)",
              }}
            >
              {isExpanded ? "Collapse" : "Expand"}
            </span>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-primary)",
                transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3 Benchmark Cards Grid (Collapsible) */}
        {isExpanded && (
          <div
            style={{
              marginTop: "1.2rem",
              paddingTop: "1.2rem",
              borderTop: "1px solid var(--surface-border)",
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

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: "600",
                      color: category.accentColor,
                      background: "rgba(255, 255, 255, 0.08)",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "16px",
                      border: `1px solid ${category.borderColor}`,
                      whiteSpace: "nowrap",
                    }}
                  >
                    {category.items.length} Benchmarks
                  </span>

                  <button
                    onClick={() => handleAddBenchmark(category.id)}
                    title={`Add benchmark to ${category.title}`}
                    style={{
                      width: "22px",
                      height: "22px",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      background: "var(--surface-color)",
                      border: `1px solid ${category.borderColor}`,
                      color: category.accentColor,
                      fontSize: "0.95rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      padding: 0,
                      lineHeight: 1,
                      transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = category.accentColor;
                      e.currentTarget.style.color = "#ffffff";
                      e.currentTarget.style.borderColor = category.accentColor;
                      e.currentTarget.style.transform = "scale(1.1)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "var(--surface-color)";
                      e.currentTarget.style.color = category.accentColor;
                      e.currentTarget.style.borderColor = category.borderColor;
                      e.currentTarget.style.transform = "scale(1)";
                    }}
                  >
                    +
                  </button>
                </div>
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
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = category.accentColor;
                        e.currentTarget.style.transform = "translateX(3px)";
                      }}
                      onMouseLeave={(e) => {
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


            </div>
          );
        })}
          </div>
        )}
      </div>

      {/* Collapsible Daily Training Plan Calendar Section */}
      <div
        className="glass-panel"
        style={{
          borderRadius: "20px",
          padding: "1.2rem 1.4rem",
          background: "var(--surface-color)",
          border: "1px solid var(--surface-border)",
          boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.2)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        {/* Clickable Header */}
        <div
          role="button"
          tabIndex={0}
          onClick={() => setIsPlanExpanded((prev) => !prev)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              setIsPlanExpanded((prev) => !prev);
            }
          }}
          title={isPlanExpanded ? "Click to collapse Daily Training Plan" : "Click to expand Daily Training Plan"}
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            cursor: "pointer",
            userSelect: "none",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span
              style={{
                fontSize: "1.35rem",
                background: "rgba(255, 255, 255, 0.08)",
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid var(--surface-border)",
              }}
            >
              📅
            </span>
            <div>
              <h2
                style={{
                  fontSize: "1.35rem",
                  fontWeight: "700",
                  color: "var(--text-primary)",
                  margin: 0,
                  lineHeight: "1.2",
                  letterSpacing: "-0.01em",
                }}
              >
                Daily Training Plan & Calendar
              </h2>
              <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>
                End-of-Year Plan (Oct 11 – Dec 31) • Daily workouts scaled to your PRs
              </span>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span
              style={{
                fontSize: "0.72rem",
                fontWeight: "600",
                color: "var(--text-secondary)",
                background: "rgba(255, 255, 255, 0.05)",
                padding: "0.22rem 0.55rem",
                borderRadius: "12px",
                border: "1px solid var(--surface-border)",
              }}
            >
              {isPlanExpanded ? "Collapse" : "Expand"}
            </span>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid var(--surface-border)",
                color: "var(--text-primary)",
                transition: "transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
                transform: isPlanExpanded ? "rotate(180deg)" : "rotate(0deg)",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>
          </div>
        </div>

        {/* Collapsible Content Area */}
        {isPlanExpanded && (
          <div
            style={{
              marginTop: "1.2rem",
              paddingTop: "1.2rem",
              borderTop: "1px solid var(--surface-border)",
            }}
          >
            <TrainingCalendar />
          </div>
        )}
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
                borderRadius: "20px",
                border: "1px solid var(--surface-border)",
                position: "relative",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "1.25rem",
                  paddingBottom: "1rem",
                  borderBottom: "1px solid var(--surface-border)",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                  <span
                    style={{
                      fontSize: "1.75rem",
                      background: "var(--surface-color)",
                      width: "48px",
                      height: "48px",
                      borderRadius: "14px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      border: `1.5px solid ${activeCategory.borderColor}`,
                      boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                    }}
                  >
                    {activeCategory.icon}
                  </span>
                  <div>
                    <h2 style={{ fontSize: "1.4rem", fontWeight: "700", color: "var(--text-primary)", margin: 0 }}>
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
                    width: "34px",
                    height: "34px",
                    borderRadius: "50%",
                    cursor: "pointer",
                    fontSize: "1.2rem",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.04)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = activeCategory.borderColor;
                    e.currentTarget.style.color = "var(--text-primary)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--surface-border)";
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
                  gap: "1.25rem",
                  alignItems: "stretch",
                }}
              >
                {/* LEFT HALF PANEL: Current PR Card & Log Form Card */}
                <div
                  style={{
                    background: "var(--surface-color)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "16px",
                    padding: "1.15rem",
                    display: "flex",
                    flexDirection: "column",
                    gap: "1rem",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  {/* Current PR Highlight Box */}
                  <div
                    style={{
                      background: "var(--bg-color)",
                      border: `1.5px solid ${activeCategory.borderColor}`,
                      borderRadius: "12px",
                      padding: "0.9rem 1.15rem",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      boxShadow: "0 1px 4px rgba(0, 0, 0, 0.03)",
                    }}
                  >
                    <div>
                      <span style={{ fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "1px", color: "var(--text-secondary)", fontWeight: "600", display: "block" }}>
                        Current PR Value
                      </span>
                      <div style={{ fontSize: "1.65rem", fontWeight: "800", color: activeItem.prValue ? activeCategory.accentColor : "var(--text-secondary)", marginTop: "0.15rem" }}>
                        {activeItem.prValue || "None logged"}
                      </div>
                    </div>
                    <span style={{ fontSize: "2rem" }}>🏆</span>
                  </div>

                  {/* Form Container with Header */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", borderTop: "1px solid var(--surface-border)", paddingTop: "0.85rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-secondary)" }}>
                        Log New Entry
                      </span>
                      <span style={{ fontSize: "0.7rem", color: activeCategory.accentColor, fontWeight: "600" }}>
                        Auto-updates PR
                      </span>
                    </div>

                    <form onSubmit={handleAddNewValue} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                      <div>
                        <label style={{ fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
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
                            fontSize: "0.88rem",
                            outline: "none",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = activeCategory.accentColor;
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${activeCategory.borderColor}`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--surface-border)";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.03)";
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
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
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = activeCategory.accentColor;
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${activeCategory.borderColor}`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--surface-border)";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.03)";
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: "0.7rem", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px", color: "var(--text-secondary)", display: "block", marginBottom: "0.3rem" }}>
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
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.03)",
                            transition: "border-color 0.2s, box-shadow 0.2s",
                          }}
                          onFocus={(e) => {
                            e.currentTarget.style.borderColor = activeCategory.accentColor;
                            e.currentTarget.style.boxShadow = `0 0 0 3px ${activeCategory.borderColor}`;
                          }}
                          onBlur={(e) => {
                            e.currentTarget.style.borderColor = "var(--surface-border)";
                            e.currentTarget.style.boxShadow = "0 1px 3px rgba(0, 0, 0, 0.03)";
                          }}
                        />
                      </div>

                      <button
                        type="submit"
                        style={{
                          marginTop: "0.25rem",
                          width: "100%",
                          padding: "0.6rem 1.1rem",
                          borderRadius: "10px",
                          background: "var(--accent-gradient)",
                          border: "none",
                          color: "white",
                          fontWeight: "600",
                          fontSize: "0.88rem",
                          cursor: "pointer",
                          boxShadow: "0 4px 12px rgba(139, 92, 246, 0.3)",
                          transition: "transform 0.15s, box-shadow 0.15s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.transform = "translateY(-1px)")}
                        onMouseLeave={(e) => (e.currentTarget.style.transform = "translateY(0)")}
                      >
                        + Log PR
                      </button>
                    </form>
                  </div>
                </div>

                {/* RIGHT HALF PANEL: Logged History Card */}
                <div
                  style={{
                    background: "var(--surface-color)",
                    border: "1px solid var(--surface-border)",
                    borderRadius: "16px",
                    padding: "1.15rem",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.04)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "0.65rem",
                      marginBottom: "0.75rem",
                      borderBottom: "1px solid var(--surface-border)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span style={{ fontSize: "0.76rem", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.6px", color: "var(--text-secondary)" }}>
                        Logged History
                      </span>
                      <span
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: "700",
                          background: "var(--bg-color)",
                          border: "1px solid var(--surface-border)",
                          color: "var(--text-primary)",
                          padding: "0.1rem 0.45rem",
                          borderRadius: "10px",
                        }}
                      >
                        {sortedHistory.length}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: "0.68rem",
                        color: "var(--text-secondary)",
                        background: "var(--bg-color)",
                        padding: "0.15rem 0.45rem",
                        borderRadius: "10px",
                        border: "1px solid var(--surface-border)",
                      }}
                    >
                      Latest first
                    </span>
                  </div>

                  <div
                    style={{
                      maxHeight: "340px",
                      overflowY: "auto",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.5rem",
                      paddingRight: "0.25rem",
                      flex: 1,
                    }}
                  >
                    {sortedHistory.length === 0 ? (
                      <div
                        style={{
                          textAlign: "center",
                          padding: "2.5rem 1rem",
                          background: "var(--bg-color)",
                          borderRadius: "10px",
                          border: "1px dashed var(--surface-border)",
                          color: "var(--text-secondary)",
                          fontSize: "0.85rem",
                        }}
                      >
                        No earlier values recorded yet.<br />
                        <span style={{ fontSize: "0.75rem", opacity: 0.8, marginTop: "0.3rem", display: "inline-block" }}>
                          Log your first value on the left panel!
                        </span>
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
                              padding: "0.6rem 0.8rem",
                              borderRadius: "10px",
                              background: isCurrentPR
                                ? "rgba(139, 92, 246, 0.08)"
                                : "var(--bg-color)",
                              border: `1.5px solid ${isCurrentPR ? activeCategory.borderColor : "var(--surface-border)"}`,
                              boxShadow: isCurrentPR
                                ? `0 2px 8px ${activeCategory.borderColor}`
                                : "0 1px 3px rgba(0, 0, 0, 0.02)",
                              gap: "0.5rem",
                              transition: "all 0.15s ease",
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
                                    fontWeight: "600",
                                    padding: "0.22rem 0.5rem",
                                    borderRadius: "6px",
                                    cursor: "pointer",
                                    transition: "all 0.15s ease",
                                    whiteSpace: "nowrap",
                                    boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
                                  }}
                                  onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = activeCategory.borderColor;
                                    e.currentTarget.style.color = activeCategory.accentColor;
                                  }}
                                  onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = "var(--surface-border)";
                                    e.currentTarget.style.color = "var(--text-primary)";
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
                                  border: "1px solid transparent",
                                  color: "var(--text-secondary)",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  padding: "0.2rem 0.35rem",
                                  borderRadius: "6px",
                                  opacity: 0.6,
                                  transition: "all 0.15s ease",
                                }}
                                onMouseEnter={(e) => {
                                  e.currentTarget.style.opacity = "1";
                                  e.currentTarget.style.color = "var(--danger-color)";
                                  e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.2)";
                                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.08)";
                                }}
                                onMouseLeave={(e) => {
                                  e.currentTarget.style.opacity = "0.6";
                                  e.currentTarget.style.color = "var(--text-secondary)";
                                  e.currentTarget.style.borderColor = "transparent";
                                  e.currentTarget.style.background = "transparent";
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
