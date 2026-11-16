import { useState } from "react";
import { Link } from "react-router-dom";
import { Map, Compass, Wallet, ClipboardList, Sun, Moon } from "lucide-react";
import useTheme from "../hooks/useTheme";

const navItems = [
  { label: "Explore", icon: Compass, target: "explore" },
  { label: "My Trips", icon: Map, target: "trips" },
  { label: "Budget", icon: Wallet, target: "budget" },
  { label: "Checklist", icon: ClipboardList, target: "checklist" },
];

export default function Navbar() {
  const [active, setActive] = useState("Explore");
  const [theme, toggleTheme] = useTheme();

  const goTo = (event, item) => {
    event.preventDefault();
    setActive(item.label);
    document
      .getElementById(item.target)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <header className="navbar">
      <Link
        to="/"
        className="brand"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      >
        <span className="brand-icon">
          <Compass size={23} />
        </span>
        <span>TripWise</span>
      </Link>

      <nav className="nav-links" aria-label="Sections">
        {navItems.map((item) => {
          const Icon = item.icon;

          return (
            <a
              href={`#${item.target}`}
              key={item.label}
              className={`nav-link ${active === item.label ? "active" : ""}`}
              onClick={(event) => goTo(event, item)}
            >
              <Icon size={17} />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="nav-actions">
        <button
          type="button"
          className="icon-button"
          onClick={toggleTheme}
          aria-label={
            theme === "dark" ? "Switch to light mode" : "Switch to dark mode"
          }
        >
          {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
        </button>
        <div className="profile-avatar">H</div>
      </div>
    </header>
  );
}
