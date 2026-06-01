import { useNavigate, useLocation } from "react-router-dom";
import { Users, ArrowLeft } from "lucide-react";

export default function TeamMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  const onTeam = location.pathname === "/team";

  return (
    <button
      onClick={() => navigate(onTeam ? "/" : "/team")}
      aria-label={onTeam ? "Back to dashboard" : "Meet the team"}
      title={onTeam ? "Back to dashboard" : "Meet the team"}
      className="fixed right-4 top-4 z-50 flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-amber-300/60 bg-gradient-to-br from-[#DB2777] to-[#BE185D] text-white shadow-[0_8px_22px_rgba(219,39,119,0.45)] transition duration-300 hover:-translate-y-0.5 hover:scale-105 hover:brightness-105"
    >
      <span
        className={`transition-transform duration-300 ${
          onTeam ? "rotate-0" : ""
        }`}
      >
        {onTeam ? (
          <ArrowLeft className="h-5 w-5" />
        ) : (
          <Users className="h-5 w-5" />
        )}
      </span>
    </button>
  );
}
