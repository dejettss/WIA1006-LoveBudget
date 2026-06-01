import { useEffect, useState } from "react";
import { Sparkles, Info, Loader2 } from "lucide-react";
import { loadModel, predict, type RawInputs, type Prediction } from "@/lib/model";

/* ── Small styled primitives ──────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0_16px_44px_rgba(219,39,119,0.14)] backdrop-blur-md md:p-8">
      {children}
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  format,
  help,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  format?: (v: number) => string;
  help?: string;
}) {
  return (
    <label className="block">
      <div className="mb-1 flex items-baseline justify-between">
        <span className="text-sm font-medium text-[#831843]">{label}</span>
        <span className="font-serif-display text-lg font-semibold text-[#DB2777]">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-pink-100 accent-[#DB2777]"
      />
      {help && <p className="mt-1 text-xs italic text-[#9D174D]/70">{help}</p>}
    </label>
  );
}

function Select({
  label,
  value,
  options,
  onChange,
  help,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (v: string) => void;
  help?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium text-[#831843]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-xl border border-pink-200 bg-white px-3 py-2 text-[#831843] outline-none transition focus:border-[#DB2777] focus:ring-2 focus:ring-pink-200"
      >
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      {help && <p className="mt-1 text-xs italic text-[#9D174D]/70">{help}</p>}
    </label>
  );
}

const TABS = ["About You", "App Habits", "Profile"] as const;
type Tab = (typeof TABS)[number];

const TIER_META: Record<
  number,
  { emoji: string; color: string; bar: string; desc: string }
> = {
  0: {
    emoji: "🔴",
    color: "#EF4444",
    bar: "#F87171",
    desc: "Low signal right now — but every swipe is a data point. Try improving your bio and engagement.",
  },
  1: {
    emoji: "🟡",
    color: "#F59E0B",
    bar: "#FBBF24",
    desc: "Some sparks! A bit more activity and a polished profile could push you to High.",
  },
  2: {
    emoji: "🟢",
    color: "#10B981",
    bar: "#34D399",
    desc: "Strong engagement signals — you're set up for real connections. Keep it up!",
  },
};

/* ── Dashboard ────────────────────────────────────────────────────────────── */

export default function Dashboard() {
  const [tab, setTab] = useState<Tab>("About You");
  const [modelReady, setModelReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);

  // UI-only fields (dropped by the model, kept for fidelity with the assignment)
  const [incomeBracket, setIncomeBracket] = useState("Middle");
  const [educationLevel, setEducationLevel] = useState("Bachelor's");

  const [inputs, setInputs] = useState<RawInputs>({
    gender: "Female",
    sexual_orientation: "Straight",
    location_type: "Urban",
    swipe_time_of_day: "Evening",
    app_usage_time_min: 90,
    swipe_right_ratio: 0.5,
    likes_received: 50,
    mutual_matches: 7,
    profile_pics_count: 3,
    bio_length: 150,
    message_sent_count: 25,
    emoji_usage_rate: 0.3,
    last_active_hour: 12,
  });

  const set = <K extends keyof RawInputs>(key: K, value: RawInputs[K]) =>
    setInputs((p) => ({ ...p, [key]: value }));

  // categories pulled from the model metadata so options always match training
  const [cats, setCats] = useState<Record<string, string[]>>({});

  useEffect(() => {
    loadModel()
      .then(({ meta }) => {
        setCats(meta.categories);
        setModelReady(true);
      })
      .catch((e) => setLoadError(String(e)));
  }, []);

  async function onPredict() {
    setPredicting(true);
    setResult(null);
    try {
      const p = await predict(inputs);
      setResult(p);
    } catch (e) {
      setLoadError(String(e));
    } finally {
      setPredicting(false);
    }
  }

  const opt = (k: string, fallback: string[]) => cats[k] ?? fallback;

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 md:py-16">
      {/* Hero */}
      <header className="mb-8 text-center text-white drop-shadow-[0_2px_12px_rgba(131,24,67,0.5)]">
        <h1 className="font-serif-display text-5xl font-bold md:text-7xl">
          💖 Love on a Budget
        </h1>
        <p className="font-serif-display mt-1 text-2xl italic md:text-3xl">
          How Socioeconomic Status Shapes Dating-App Success
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/90">
          Tell us your vibe &amp; swiping habits — a real XGBoost model (running
          in your browser) predicts your Success Tier: 🟢 High · 🟡 Mid · 🔴 Low
        </p>
      </header>

      {/* About model */}
      <details className="mb-6 rounded-2xl border border-white/50 bg-white/75 px-5 py-3 text-sm text-[#831843] backdrop-blur">
        <summary className="flex cursor-pointer items-center gap-2 font-medium">
          <Info className="h-4 w-4" /> About this model
        </summary>
        <div className="mt-2 space-y-1 text-[#9D174D]">
          <p>
            <b>Model:</b> Tuned XGBoost (35 features) — WIA1006/WID3006 group
            assignment, exported to ONNX and run client-side.
          </p>
          <p>
            <b>Honest caveat:</b> on the synthetic 50k-row dataset no model beat
            the majority-class baseline meaningfully (~47–50% accuracy). Treat
            predictions as an educational demonstration.
          </p>
        </div>
      </details>

      {/* Tabs */}
      <div className="mb-4 flex justify-center gap-2 rounded-full bg-white/50 p-1.5 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium transition ${
              tab === t
                ? "bg-gradient-to-r from-[#DB2777] to-[#F472B6] text-white shadow"
                : "text-[#9D174D] hover:bg-white/60"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      <Card>
        {tab === "About You" && (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <Select label="Gender" value={inputs.gender} options={opt("gender", ["Female", "Male"])} onChange={(v) => set("gender", v)} />
            <Select label="Sexual Orientation" value={inputs.sexual_orientation} options={opt("sexual_orientation", ["Straight"])} onChange={(v) => set("sexual_orientation", v)} />
            <Select label="Location Type" value={inputs.location_type} options={opt("location_type", ["Urban"])} onChange={(v) => set("location_type", v)} />
            <Select
              label="Income Bracket"
              value={incomeBracket}
              options={["Very Low", "Low", "Lower-Middle", "Middle", "Upper-Middle", "High", "Very High"]}
              onChange={setIncomeBracket}
              help="Not used by the model (dropped in training) — kept for context."
            />
            <Select
              label="Education Level"
              value={educationLevel}
              options={["No Formal Education", "High School", "Diploma", "Associate's", "Bachelor's", "MBA", "Master's", "PhD", "Postdoc"]}
              onChange={setEducationLevel}
              help="Same caveat as income bracket."
            />
          </div>
        )}

        {tab === "App Habits" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Slider label="Daily App Usage (minutes)" value={inputs.app_usage_time_min} min={0} max={300} step={5} onChange={(v) => set("app_usage_time_min", v)} />
            <Slider label="Swipe Right Ratio" value={inputs.swipe_right_ratio} min={0} max={1} step={0.01} onChange={(v) => set("swipe_right_ratio", v)} format={(v) => v.toFixed(2)} help="Fraction of profiles you swipe right on." />
            <Slider label="Last Active Hour (0–23)" value={inputs.last_active_hour} min={0} max={23} onChange={(v) => set("last_active_hour", v)} />
            <Select label="When Do You Usually Swipe?" value={inputs.swipe_time_of_day} options={opt("swipe_time_of_day", ["Evening"])} onChange={(v) => set("swipe_time_of_day", v)} />
          </div>
        )}

        {tab === "Profile" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Slider label="Likes Received" value={inputs.likes_received} min={0} max={200} onChange={(v) => set("likes_received", v)} />
            <Slider label="Bio Length (characters)" value={inputs.bio_length} min={0} max={500} step={10} onChange={(v) => set("bio_length", v)} />
            <Slider label="Mutual Matches" value={inputs.mutual_matches} min={0} max={30} onChange={(v) => set("mutual_matches", v)} />
            <Slider label="Messages Sent" value={inputs.message_sent_count} min={0} max={100} onChange={(v) => set("message_sent_count", v)} />
            <Slider label="Profile Pictures" value={inputs.profile_pics_count} min={0} max={6} onChange={(v) => set("profile_pics_count", v)} />
            <Slider label="Emoji Usage Rate" value={inputs.emoji_usage_rate} min={0} max={1} step={0.01} onChange={(v) => set("emoji_usage_rate", v)} format={(v) => v.toFixed(2)} />
          </div>
        )}
      </Card>

      {/* Predict */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={onPredict}
          disabled={!modelReady || predicting}
          className="flex cursor-pointer items-center gap-2 rounded-2xl border border-amber-500/50 bg-gradient-to-r from-[#DB2777] to-[#BE185D] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_10px_26px_rgba(219,39,119,0.4)] transition hover:-translate-y-0.5 hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {predicting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {modelReady ? "Predict My Success Tier" : "Loading model…"}
        </button>
      </div>

      {loadError && (
        <p className="mt-4 text-center text-sm text-red-100 bg-red-500/40 rounded-xl py-2">
          {loadError}
        </p>
      )}

      {/* Result */}
      {result && (
        <div className="mt-8 space-y-5">
          <Card>
            <h2
              className="font-serif-display text-center text-4xl font-bold"
              style={{ color: TIER_META[result.tier].color }}
            >
              {TIER_META[result.tier].emoji} Your Success Tier: {result.label}
            </h2>
            <p
              className="mt-3 rounded-xl px-4 py-3 text-center font-medium"
              style={{
                background: `${TIER_META[result.tier].color}1A`,
                color: TIER_META[result.tier].color,
              }}
            >
              {TIER_META[result.tier].desc}
            </p>

            {/* Probability breakdown */}
            <h3 className="font-serif-display mt-6 text-center text-2xl font-semibold text-[#9D174D]">
              🎲 Probability Breakdown
            </h3>
            <div className="mt-3 grid grid-cols-3 gap-3">
              {["Low", "Mid", "High"].map((lbl, i) => (
                <div
                  key={lbl}
                  className="rounded-2xl border-t-[3px] bg-white px-3 py-3 text-center shadow"
                  style={{ borderTopColor: TIER_META[i].color }}
                >
                  <div className="text-xs font-medium text-[#831843]">
                    {TIER_META[i].emoji} {lbl}
                  </div>
                  <div className="font-serif-display text-2xl font-bold text-[#DB2777]">
                    {(result.probabilities[i] * 100).toFixed(1)}%
                  </div>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="mt-5 space-y-2">
              {["Low", "Mid", "High"].map((lbl, i) => (
                <div key={lbl} className="flex items-center gap-3">
                  <span className="w-10 text-right text-xs font-medium text-[#831843]">
                    {lbl}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-pink-100">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{
                        width: `${result.probabilities[i] * 100}%`,
                        background: TIER_META[i].bar,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 text-center text-xs italic text-[#9D174D]/70">
              ⚠️ ~47–50% accuracy on synthetic data — illustrative, not
              predictive.
            </p>
          </Card>
        </div>
      )}
    </div>
  );
}
