
import { Map, Compass, Wallet, ClipboardList, Sun, Moon } from "lucide-react";

const navItems = [
  { label: "Explore", icon: Compass },
  { label: "My Trips", icon: Map },
  { label: "Budget", icon: Wallet },
  { label: "Checklist", icon: ClipboardList },
];

export default function Navbar() {
  return (
    <header className="navbar">
      <a href="/" className="brand">
        <span className="brand-icon">
          <Compass size={23} />
        </span>
        <span>TripWise</span>
      </a>

      <nav className="nav-links">
        {navItems.map((item, index) => {
          const Icon = item.icon;

          return (
            <a
              href="#"
              key={item.label}
              className={`nav-link ${index === 0 ? "active" : ""}`}
            >
              <Icon size={17} />
              {item.label}
            </a>
          );
        })}
      </nav>

      <div className="nav-actions">
        <button className="icon-button" aria-label="Toggle theme">
          <Sun size={19} />
        </button>
        <div className="profile-avatar">H</div>
      </div>
    </header>
  );
}
