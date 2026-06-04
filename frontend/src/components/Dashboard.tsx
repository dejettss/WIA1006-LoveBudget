import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import {
  Sparkles,
  Info,
  Loader2,
  RotateCcw,
  Check,
  Copy,
  Zap,
  Moon,
  Sprout,
} from "lucide-react";
import {
  loadModel,
  predict,
  explain,
  type RawInputs,
  type Prediction,
  type Contribution,
} from "@/lib/model";

/* Scroll a target Y into view. Uses native smooth scrolling when the tab is
   visible (foreground); falls back to an instant jump when the tab is hidden
   or the engine throttles rAF-driven smooth scrolls. */
function scrollToY(targetY: number) {
  if (document.hidden) {
    window.scrollTo(0, targetY);
  } else {
    window.scrollTo({ top: targetY, behavior: "smooth" });
  }
}

/* ── Small styled primitives ──────────────────────────────────────────────── */

function Card({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0_16px_44px_rgba(219,39,119,0.14)] ring-1 ring-white/40 backdrop-blur-md transition-shadow duration-300 hover:shadow-[0_22px_60px_rgba(219,39,119,0.20)] md:p-8">
      {/* hairline gradient accent along the top edge */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#F472B6] to-transparent"
      />
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
  const clamp = (v: number) => Math.min(max, Math.max(min, v));
  const pct = max > min ? ((value - min) / (max - min)) * 100 : 0;
  return (
    <label className="group block">
      <div className="mb-1.5 flex items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-[#831843] transition-colors group-focus-within:text-[#DB2777]">
          {label}
        </span>
        <input
          type="number"
          inputMode="decimal"
          min={min}
          max={max}
          step={step}
          value={value}
          aria-label={`${label} (exact value)`}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (!Number.isNaN(v)) onChange(clamp(v));
          }}
          className="w-20 rounded-lg border border-pink-100 bg-pink-50/50 px-2 py-0.5 text-right font-serif-display text-lg font-semibold text-[#DB2777] outline-none transition focus:border-[#DB2777] focus:bg-white focus:ring-2 focus:ring-pink-200 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{
          background: `linear-gradient(to right, #DB2777 0%, #F472B6 ${pct}%, #FBCFE8 ${pct}%, #FBCFE8 100%)`,
        }}
        className="lob-range h-2 w-full cursor-pointer appearance-none rounded-full"
      />
      {help && (
        <p className="mt-1 text-xs italic text-[#9D174D]/70">
          {help}
          {format && <> · shown as {format(value)}</>}
        </p>
      )}
      {!help && format && (
        <p className="mt-1 text-xs italic text-[#9D174D]/70">
          shown as {format(value)}
        </p>
      )}
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
    <label className="group block">
      <span className="mb-1 block text-sm font-medium text-[#831843] transition-colors group-focus-within:text-[#DB2777]">
        {label}
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full cursor-pointer rounded-xl border border-pink-200 bg-white px-3 py-2 text-[#831843] outline-none transition hover:border-pink-300 focus:border-[#DB2777] focus:ring-2 focus:ring-pink-200"
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

const DEFAULT_INPUTS: RawInputs = {
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
};

// One-click example profiles for quick demos. Each only overrides the
// behavioural fields; categorical/“About You” fields keep their current value.
const PRESETS: {
  name: string;
  icon: typeof Zap;
  values: Partial<RawInputs>;
}[] = [
  {
    name: "Power user",
    icon: Zap,
    values: {
      app_usage_time_min: 240,
      swipe_right_ratio: 0.7,
      likes_received: 160,
      mutual_matches: 24,
      profile_pics_count: 6,
      bio_length: 320,
      message_sent_count: 80,
      emoji_usage_rate: 0.6,
      last_active_hour: 21,
    },
  },
  {
    name: "Casual swiper",
    icon: Moon,
    values: {
      app_usage_time_min: 45,
      swipe_right_ratio: 0.35,
      likes_received: 40,
      mutual_matches: 6,
      profile_pics_count: 3,
      bio_length: 120,
      message_sent_count: 15,
      emoji_usage_rate: 0.25,
      last_active_hour: 13,
    },
  },
  {
    name: "New account",
    icon: Sprout,
    values: {
      app_usage_time_min: 20,
      swipe_right_ratio: 0.5,
      likes_received: 5,
      mutual_matches: 1,
      profile_pics_count: 1,
      bio_length: 30,
      message_sent_count: 2,
      emoji_usage_rate: 0.1,
      last_active_hour: 18,
    },
  },
];

// Friendly labels for the explanation panel, keyed by RawInputs field.
const FEATURE_LABELS: Record<keyof RawInputs, string> = {
  gender: "Gender",
  sexual_orientation: "Sexual orientation",
  location_type: "Location type",
  swipe_time_of_day: "Swipe time of day",
  app_usage_time_min: "Daily app usage",
  swipe_right_ratio: "Swipe-right ratio",
  likes_received: "Likes received",
  mutual_matches: "Mutual matches",
  profile_pics_count: "Profile pictures",
  bio_length: "Bio length",
  message_sent_count: "Messages sent",
  emoji_usage_rate: "Emoji usage rate",
  last_active_hour: "Last active hour",
};

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
  const reduce = useReducedMotion();
  const [tab, setTab] = useState<Tab>("About You");
  const [modelReady, setModelReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [result, setResult] = useState<Prediction | null>(null);
  const [contribs, setContribs] = useState<Contribution[] | null>(null);
  const [live, setLive] = useState(false); // re-predict automatically as inputs change
  const [predCount, setPredCount] = useState(0); // bumps each prediction → re-animates result
  const resultRef = useRef<HTMLDivElement>(null);

  // UI-only fields (dropped by the model, kept for fidelity with the assignment)
  const [incomeBracket, setIncomeBracket] = useState("Middle");
  const [educationLevel, setEducationLevel] = useState("Bachelor's");

  const [inputs, setInputs] = useState<RawInputs>(DEFAULT_INPUTS);
  const [copied, setCopied] = useState(false);

  const set = <K extends keyof RawInputs>(key: K, value: RawInputs[K]) =>
    setInputs((p) => ({ ...p, [key]: value }));

  function onReset() {
    setInputs(DEFAULT_INPUTS);
    setIncomeBracket("Middle");
    setEducationLevel("Bachelor's");
    setResult(null);
    setContribs(null);
    setLoadError(null);
  }

  function applyPreset(values: Partial<RawInputs>) {
    setInputs((p) => ({ ...p, ...values }));
  }

  async function copyResult() {
    if (!result) return;
    const pct = (i: number) => `${(result.probabilities[i] * 100).toFixed(1)}%`;
    const text =
      `💖 Love on a Budget — my predicted Success Tier: ${result.label}\n` +
      `🔴 Low ${pct(0)} · 🟡 Mid ${pct(1)} · 🟢 High ${pct(2)}\n` +
      `(Educational demo — XGBoost on synthetic data.)`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setLoadError("Couldn't copy to clipboard.");
    }
  }

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

  // Shared prediction + explanation. `animate` bumps predCount so the result
  // card re-animates and scrolls into view (used by the manual button, not live).
  async function runPrediction(animate: boolean) {
    setPredicting(true);
    setLoadError(null);
    try {
      const p = await predict(inputs);
      setResult(p);
      if (animate) setPredCount((c) => c + 1);
      const { contributions } = await explain(inputs, DEFAULT_INPUTS);
      setContribs(contributions);
    } catch (e) {
      setLoadError(String(e));
    } finally {
      setPredicting(false);
    }
  }

  const onPredict = () => runPrediction(true);

  // Live mode: debounce input changes and re-predict without re-animating/scrolling.
  useEffect(() => {
    if (!live || !modelReady) return;
    const id = setTimeout(() => runPrediction(false), 250);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inputs, live, modelReady]);

  // Scroll the (re)prediction into view so it's obvious a new result was produced.
  // Deferred a frame so the freshly (re)mounted result node is laid out first.
  useEffect(() => {
    if (predCount === 0) return;
    const id = setTimeout(() => {
      const el = resultRef.current;
      if (!el) return;
      const top = window.scrollY + el.getBoundingClientRect().top - 16;
      scrollToY(top);
    }, 90);
    return () => clearTimeout(id);
  }, [predCount]);

  const opt = (k: string, fallback: string[]) => cats[k] ?? fallback;

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-24 md:pb-16 md:pt-28">
      {/* Hero */}
      <header className="mb-8 text-center text-white drop-shadow-[0_2px_12px_rgba(131,24,67,0.5)]">
        <h1 className="font-serif-display text-5xl font-bold md:text-7xl">
          Love on a Budget
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
      <div className="mb-4 flex justify-center gap-1 rounded-full bg-white/50 p-1.5 backdrop-blur">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            aria-pressed={tab === t}
            className={`relative cursor-pointer rounded-full px-4 py-1.5 text-sm font-medium outline-none transition-colors duration-200 focus-visible:ring-2 focus-visible:ring-[#DB2777] focus-visible:ring-offset-1 ${
              tab === t ? "text-white" : "text-[#9D174D] hover:text-[#831843]"
            }`}
          >
            {tab === t && (
              <motion.span
                layoutId="tabPill"
                className="absolute inset-0 rounded-full bg-gradient-to-r from-[#DB2777] to-[#F472B6] shadow"
                transition={
                  reduce
                    ? { duration: 0 }
                    : { type: "spring", stiffness: 380, damping: 30 }
                }
              />
            )}
            <span className="relative z-10">{t}</span>
          </button>
        ))}
      </div>

      {/* Presets + live toggle */}
      <div className="mb-4 flex flex-wrap items-center justify-center gap-2">
        <span className="text-xs font-medium text-white/80">Quick fill:</span>
        {PRESETS.map((p) => (
          <motion.button
            key={p.name}
            onClick={() => applyPreset(p.values)}
            whileTap={reduce ? undefined : { scale: 0.94 }}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#9D174D] shadow-sm outline-none transition-colors duration-200 hover:border-[#F472B6] hover:bg-white hover:text-[#831843] focus-visible:ring-2 focus-visible:ring-[#DB2777]"
          >
            <p.icon className="h-3.5 w-3.5" />
            {p.name}
          </motion.button>
        ))}
        <label className="ml-1 flex cursor-pointer items-center gap-1.5 rounded-full border border-white/50 bg-white/70 px-3 py-1.5 text-xs font-medium text-[#9D174D] shadow-sm transition-colors duration-200 hover:bg-white">
          <input
            type="checkbox"
            checked={live}
            onChange={(e) => setLive(e.target.checked)}
            className="h-3.5 w-3.5 cursor-pointer accent-[#DB2777]"
          />
          <Zap className="h-3.5 w-3.5" />
          Live update
        </label>
      </div>

      <Card>
        {tab === "About You" && (
          <motion.div
            key="about"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-5 md:grid-cols-2"
          >
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
          </motion.div>
        )}

        {tab === "App Habits" && (
          <motion.div
            key="habits"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            <Slider label="Daily App Usage (minutes)" value={inputs.app_usage_time_min} min={0} max={300} step={5} onChange={(v) => set("app_usage_time_min", v)} />
            <Slider label="Swipe Right Ratio" value={inputs.swipe_right_ratio} min={0} max={1} step={0.01} onChange={(v) => set("swipe_right_ratio", v)} format={(v) => v.toFixed(2)} help="Fraction of profiles you swipe right on." />
            <Slider label="Last Active Hour (0–23)" value={inputs.last_active_hour} min={0} max={23} onChange={(v) => set("last_active_hour", v)} />
            <Select label="When Do You Usually Swipe?" value={inputs.swipe_time_of_day} options={opt("swipe_time_of_day", ["Evening"])} onChange={(v) => set("swipe_time_of_day", v)} />
          </motion.div>
        )}

        {tab === "Profile" && (
          <motion.div
            key="profile"
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 gap-6 md:grid-cols-2"
          >
            <Slider label="Likes Received" value={inputs.likes_received} min={0} max={200} onChange={(v) => set("likes_received", v)} />
            <Slider label="Bio Length (characters)" value={inputs.bio_length} min={0} max={500} step={10} onChange={(v) => set("bio_length", v)} />
            <Slider label="Mutual Matches" value={inputs.mutual_matches} min={0} max={30} onChange={(v) => set("mutual_matches", v)} />
            <Slider label="Messages Sent" value={inputs.message_sent_count} min={0} max={100} onChange={(v) => set("message_sent_count", v)} />
            <Slider label="Profile Pictures" value={inputs.profile_pics_count} min={0} max={6} onChange={(v) => set("profile_pics_count", v)} />
            <Slider label="Emoji Usage Rate" value={inputs.emoji_usage_rate} min={0} max={1} step={0.01} onChange={(v) => set("emoji_usage_rate", v)} format={(v) => v.toFixed(2)} />
          </motion.div>
        )}
      </Card>

      {/* Predict */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
        <motion.button
          onClick={onPredict}
          disabled={!modelReady || predicting}
          whileHover={reduce || !modelReady ? undefined : { y: -2 }}
          whileTap={reduce || !modelReady ? undefined : { scale: 0.97 }}
          className="group relative flex cursor-pointer items-center gap-2 overflow-hidden rounded-2xl border border-amber-400/50 bg-gradient-to-r from-[#DB2777] to-[#BE185D] px-8 py-3 text-sm font-semibold uppercase tracking-wider text-white shadow-[0_10px_26px_rgba(219,39,119,0.4)] outline-none transition hover:brightness-105 focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {/* light sweep on hover */}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-0 -left-1/3 w-1/3 -skew-x-12 bg-white/25 blur-md transition-transform duration-700 ease-out group-hover:translate-x-[450%]"
          />
          {predicting ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <Sparkles className="h-5 w-5" />
          )}
          {modelReady ? "Predict My Success Tier" : "Loading model…"}
        </motion.button>
        <motion.button
          onClick={onReset}
          aria-label="Reset all inputs to defaults"
          whileHover={reduce ? undefined : { y: -2 }}
          whileTap={reduce ? undefined : { scale: 0.97 }}
          className="flex cursor-pointer items-center gap-2 rounded-2xl border border-white/60 bg-white/80 px-5 py-3 text-sm font-semibold text-[#9D174D] shadow outline-none transition-colors hover:bg-white focus-visible:ring-2 focus-visible:ring-[#DB2777]"
        >
          <RotateCcw className="h-4 w-4" /> Reset
        </motion.button>
      </div>

      {loadError && (
        <p className="mt-4 text-center text-sm text-red-100 bg-red-500/40 rounded-xl py-2">
          {loadError}
        </p>
      )}

      {/* Result */}
      {result && (
        <motion.div
          ref={resultRef}
          key={predCount}
          initial={{ opacity: 0, scale: 0.97, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mt-8 space-y-5 scroll-mt-6"
        >
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
              {["Low", "Mid", "High"].map((lbl, i) => {
                const isTop = i === result.tier;
                return (
                  <motion.div
                    key={lbl}
                    initial={reduce ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.12 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                    className={`rounded-2xl border-t-[3px] bg-white px-3 py-3 text-center shadow transition-shadow ${
                      isTop ? "ring-2 ring-offset-1" : ""
                    }`}
                    style={{
                      borderTopColor: TIER_META[i].color,
                      ...(isTop
                        ? ({ "--tw-ring-color": `${TIER_META[i].color}66` } as React.CSSProperties)
                        : {}),
                    }}
                  >
                    <div className="text-xs font-medium text-[#831843]">
                      {TIER_META[i].emoji} {lbl}
                    </div>
                    <div
                      className="font-serif-display text-2xl font-bold"
                      style={{ color: isTop ? TIER_META[i].color : "#DB2777" }}
                    >
                      {(result.probabilities[i] * 100).toFixed(1)}%
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Bars */}
            <div className="mt-5 space-y-2">
              {["Low", "Mid", "High"].map((lbl, i) => (
                <div key={lbl} className="flex items-center gap-3">
                  <span className="w-10 text-right text-xs font-medium text-[#831843]">
                    {lbl}
                  </span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-pink-100">
                    <motion.div
                      className="h-full rounded-full"
                      initial={reduce ? false : { width: 0 }}
                      animate={{ width: `${result.probabilities[i] * 100}%` }}
                      transition={{ duration: 0.7, delay: 0.2 + i * 0.08, ease: [0.22, 1, 0.36, 1] }}
                      style={{ background: TIER_META[i].bar }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Explanation — what pushed your tier */}
            {contribs && (() => {
              const ranked = contribs
                .filter((c) => Math.abs(c.contribution) > 0.0005)
                .sort(
                  (a, b) => Math.abs(b.contribution) - Math.abs(a.contribution)
                )
                .slice(0, 6);
              const maxAbs = Math.max(
                0.0001,
                ...ranked.map((c) => Math.abs(c.contribution))
              );
              return (
                <>
                  <h3 className="font-serif-display mt-7 text-center text-2xl font-semibold text-[#9D174D]">
                    🔍 What Shaped Your Tier
                  </h3>
                  <p className="mx-auto mt-1 max-w-md text-center text-xs italic text-[#9D174D]/70">
                    How much each of your inputs moved the probability of{" "}
                    <b>{result.label}</b> vs. a typical profile.
                  </p>
                  {ranked.length === 0 ? (
                    <p className="mt-3 text-center text-sm text-[#831843]">
                      Your inputs match a typical profile — nothing stood out.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {ranked.map((c, ri) => {
                        const pos = c.contribution >= 0;
                        const w = (Math.abs(c.contribution) / maxAbs) * 100;
                        return (
                          <div
                            key={c.feature}
                            className="flex items-center gap-2 text-xs"
                          >
                            <span className="w-32 shrink-0 text-right font-medium text-[#831843]">
                              {FEATURE_LABELS[c.feature]}
                            </span>
                            {/* negative (left) track */}
                            <div className="flex h-3 flex-1 justify-end overflow-hidden rounded-l-full bg-pink-50">
                              {!pos && (
                                <motion.div
                                  className="h-full rounded-l-full"
                                  initial={reduce ? false : { width: 0 }}
                                  animate={{ width: `${w}%` }}
                                  transition={{ duration: 0.6, delay: 0.15 + ri * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                  style={{ background: "#F87171" }}
                                />
                              )}
                            </div>
                            {/* positive (right) track */}
                            <div className="h-3 flex-1 overflow-hidden rounded-r-full bg-pink-50">
                              {pos && (
                                <motion.div
                                  className="h-full rounded-r-full"
                                  initial={reduce ? false : { width: 0 }}
                                  animate={{ width: `${w}%` }}
                                  transition={{ duration: 0.6, delay: 0.15 + ri * 0.05, ease: [0.22, 1, 0.36, 1] }}
                                  style={{ background: "#34D399" }}
                                />
                              )}
                            </div>
                            <span
                              className="w-12 shrink-0 font-semibold"
                              style={{ color: pos ? "#059669" : "#DC2626" }}
                            >
                              {pos ? "+" : "−"}
                              {(Math.abs(c.contribution) * 100).toFixed(1)}
                            </span>
                          </div>
                        );
                      })}
                      <div className="mt-2 flex justify-center gap-4 text-[11px] text-[#9D174D]/70">
                        <span>🟢 raised your tier</span>
                        <span>🔴 lowered it</span>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Share */}
            <div className="mt-6 flex justify-center">
              <motion.button
                onClick={copyResult}
                whileTap={reduce ? undefined : { scale: 0.96 }}
                className="flex cursor-pointer items-center gap-2 rounded-xl border border-pink-200 bg-white px-4 py-2 text-xs font-medium text-[#9D174D] shadow-sm outline-none transition-colors hover:bg-pink-50 focus-visible:ring-2 focus-visible:ring-[#DB2777]"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 text-emerald-500" /> Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4" /> Copy result
                  </>
                )}
              </motion.button>
            </div>

            <p className="mt-5 text-center text-xs italic text-[#9D174D]/70">
              ⚠️ ~47–50% accuracy on synthetic data — illustrative, not
              predictive.
            </p>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
