import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { TEAM, initials } from "@/lib/team";

export default function TeamPage() {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-24 md:pb-16 md:pt-28">
      {/* Header */}
      <header className="mb-8 text-center text-white drop-shadow-[0_2px_12px_rgba(131,24,67,0.5)]">
        <h1 className="font-serif-display text-5xl font-bold md:text-7xl">
          Meet the Team
        </h1>
        <p className="font-serif-display mt-1 text-2xl italic md:text-3xl">
          The minds behind Love on a Budget
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/90">
          WIA1006 / WID3006 Machine Learning · Group Assignment
        </p>
      </header>

      {/* Member cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {TEAM.map((m) => (
          <div
            key={m.matric}
            className="flex items-center gap-4 rounded-3xl border border-white/60 bg-white/85 p-5 shadow-[0_16px_44px_rgba(219,39,119,0.14)] backdrop-blur-md transition hover:-translate-y-1 hover:shadow-[0_22px_54px_rgba(219,39,119,0.22)]"
          >
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#F472B6] to-[#DB2777] text-lg font-bold text-white shadow-lg">
              {initials(m.name)}
            </span>
            <div className="min-w-0">
              <p className="font-serif-display text-xl font-semibold leading-tight text-[#831843]">
                {m.name}
              </p>
              <p className="font-mono text-sm text-[#CA8A04]">{m.matric}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Back to dashboard */}
      <div className="mt-10 flex justify-center">
        <button
          onClick={() => navigate("/")}
          className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-6 py-3 text-sm font-semibold uppercase tracking-wider text-[#9D174D] shadow-lg backdrop-blur transition hover:-translate-y-0.5 hover:bg-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </button>
      </div>
    </div>
  );
}
