"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTheme } from "./ThemeProvider";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const { theme, toggleTheme } = useTheme();

  const navs = [
    { name: "Home", path: "/", icon: "🏠" },
    { name: "Todo", path: "/todo", icon: "✓" },
    { name: "Fitness", path: "/fitness", icon: "💪" },
    { name: "Games", path: "/games", icon: "🎮" },
    { name: "Journalling", path: "/journalling", icon: "✍️" },
    { name: "Wardrobe", path: "/wardrobe", icon: "👕" },
    { name: "Habit Tracker", path: "/habit-tracker", icon: "↺" },
  ];

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link href="/" className="navbar-logo gradient-text">
          LifeOS
        </Link>
        
        {/* Desktop Menu */}
        <div className="navbar-menu-desktop">
          {navs.map((nav) => (
            <Link
              key={nav.name}
              href={nav.path}
              className={`nav-link ${pathname === nav.path ? "active" : ""}`}
            >
              {nav.name}
            </Link>
          ))}
        </div>

        <div className="navbar-actions">
          {/* Theme Toggle Button */}
          <button 
            className="theme-toggle" 
            onClick={toggleTheme} 
            aria-label="Toggle Theme"
            title={`Switch to ${theme === "light" ? "dark" : "light"} mode`}
          >
            {theme === "light" ? "🌙" : "☀️"}
          </button>

          {/* Mobile Hamburger Icon */}
          <button
            className="hamburger"
            onClick={() => setIsOpen(!isOpen)}
            aria-label="Toggle menu"
          >
            <span className={`hamburger-line ${isOpen ? "open-1" : ""}`}></span>
            <span className={`hamburger-line ${isOpen ? "open-2" : ""}`}></span>
            <span className={`hamburger-line ${isOpen ? "open-3" : ""}`}></span>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={`navbar-menu-mobile ${isOpen ? "open" : ""}`}>
        {navs.map((nav) => (
          <Link
            key={nav.name}
            href={nav.path}
            className={`nav-link-mobile ${pathname === nav.path ? "active" : ""}`}
            onClick={() => setIsOpen(false)}
          >
            <span className="nav-icon">{nav.icon}</span>
            <span>{nav.name}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}
