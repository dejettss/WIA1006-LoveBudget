import { NavLink } from "react-router-dom";
import { Home, Sparkles, Users } from "lucide-react";

const LINKS = [
  { to: "/", label: "Home", icon: Home, end: true },
  { to: "/predict", label: "Predict", icon: Sparkles, end: false },
  { to: "/team", label: "Team", icon: Users, end: false },
];

export default function NavBar() {
  return (
    <>
      {/* Logo — top left */}
      <NavLink
        to="/"
        aria-label="Engagement Over Affluence — home"
        className="fixed left-4 top-3 z-50 transition hover:-translate-y-0.5 hover:scale-105"
      >
        <img
          src={`${import.meta.env.BASE_URL}logo%20real.png`}
          alt="Engagement Over Affluence"
          className="h-12 w-auto drop-shadow-[0_4px_14px_rgba(131,24,67,0.45)]"
        />
      </NavLink>

      {/* Centered pill nav — Home · Predict · Team */}
      <nav className="fixed left-1/2 top-4 z-50 -translate-x-1/2">
        <div className="flex items-center gap-1 rounded-full border border-white/50 bg-white/70 p-1.5 shadow-[0_8px_22px_rgba(219,39,119,0.25)] backdrop-blur">
          {LINKS.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex cursor-pointer items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-gradient-to-r from-[#DB2777] to-[#F472B6] text-white shadow"
                    : "text-[#9D174D] hover:bg-white/60"
                }`
              }
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
