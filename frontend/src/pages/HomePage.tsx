import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  HelpCircle,
  Database,
  Layers,
  Workflow,
  Brain,
  Search,
  Lightbulb,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

/* ── Styled panel matching the dashboard's card language ───────────────────── */
function Panel({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/60 bg-white/85 p-6 shadow-[0_16px_44px_rgba(219,39,119,0.14)] backdrop-blur-md md:p-8">
      <div className="mb-3 flex items-center gap-3">
        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#F472B6] to-[#DB2777] text-white shadow">
          {icon}
        </span>
        <h2 className="font-serif-display text-2xl font-semibold text-[#831843]">
          {title}
        </h2>
      </div>
      <div className="space-y-3 text-sm leading-relaxed text-[#9D174D]">
        {children}
      </div>
    </div>
  );
}

/* Numbered step bullet */
function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3">
      <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DB2777] text-xs font-bold text-white">
        {n}
      </span>
      <span>{children}</span>
    </li>
  );
}

/* Three Success Tiers derived from the 10 raw match outcomes */
const TIERS = [
  {
    emoji: "🟢",
    name: "High",
    code: "2",
    outcomes: "Relationship Formed · Date Happened · Mutual Match",
    rationale: "Real, reciprocal connection established",
    share: "~30%",
  },
  {
    emoji: "🟡",
    name: "Mid",
    code: "1",
    outcomes: "Instant Match · One-sided Like",
    rationale: "Some positive signal, no sustained connection",
    share: "~20%",
  },
  {
    emoji: "🔴",
    name: "Low",
    code: "0",
    outcomes: "Chat Ignored · No Action · Ghosted · Blocked · Catfished",
    rationale: "Negative or absent outcome",
    share: "~50%",
  },
];

/* Model comparison — default (pre-tuning) scores from the report, plus the
   majority-class baseline. XGBoost (tuned) is shown separately as the deployed model. */
const MODELS: { name: string; acc: string; f1: string; tuned?: boolean }[] = [
  { name: "KNN (k = 15)", acc: "0.4651", f1: "0.2953" },
  { name: "Random Forest", acc: "0.4848", f1: "0.2637" },
  { name: "XGBoost (default)", acc: "0.4899", f1: "0.2481" },
  { name: "SVC (RBF)", acc: "0.5009", f1: "0.2229" },
  { name: "Logistic Regression", acc: "0.5008", f1: "0.2225" },
  { name: "Baseline (majority class)", acc: "0.5008", f1: "0.2225" },
];

/* SHAP top-10 features (mean |SHAP|) — every top feature is behavioural */
const SHAP = [
  { f: "likes_received", v: 0.0826 },
  { f: "bio_length", v: 0.0794 },
  { f: "app_usage_time_min", v: 0.0761 },
  { f: "message_sent_count", v: 0.0675 },
  { f: "emoji_usage_rate", v: 0.066 },
  { f: "swipe_right_ratio", v: 0.0647 },
  { f: "mutual_matches", v: 0.0586 },
  { f: "last_active_hour", v: 0.0534 },
  { f: "profile_pics_count", v: 0.0386 },
  { f: "gender_Non-binary", v: 0.0157, demo: true },
];

export default function HomePage() {
  const navigate = useNavigate();
  const shapMax = SHAP[0].v;

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 pb-12 pt-24 md:pb-16 md:pt-28">
      {/* Hero */}
      <header className="mb-10 text-center text-white drop-shadow-[0_2px_12px_rgba(131,24,67,0.5)]">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-serif-display text-5xl font-bold md:text-7xl"
        >
          Engagement Over Affluence
        </motion.h1>
        <p className="font-serif-display mt-1 text-2xl italic md:text-3xl">
          A Machine Learning Analysis of Dating-App Success Tiers
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/90">
          WIA1006 Machine Learning · Group 10 · Sem 2, 2025/2026
        </p>
      </header>

      <div className="space-y-5">
        {/* Research question */}
        <Panel
          icon={<HelpCircle className="h-5 w-5" />}
          title="The Research Question"
        >
          <p className="rounded-2xl bg-pink-50 px-4 py-3 font-medium text-[#831843]">
            “Does <b>how you use a dating app</b> matter more than{" "}
            <b>who you are economically</b>? Specifically, do{" "}
            <b>income bracket</b> and <b>education level</b> add anything
            meaningful to predicting success once we account for how a user
            actually behaves on the platform?”
          </p>
          <p>
            Dating apps compress courtship into rapid micro-decisions — a swipe,
            a match, a message. The behavioural side of success is well studied;
            the <b>structural socioeconomic side</b> far less so. If money or
            education predicted outcomes beyond engagement, these platforms might
            be quietly mirroring real-world inequality — and if engagement
            dominates instead, then how you show up matters more than what you
            earn. This project asks which story the data supports.
          </p>
        </Panel>

        {/* Dataset */}
        <Panel icon={<Database className="h-5 w-5" />} title="The Dataset">
          <p>
            We use the <b>Dating App Behavior Dataset</b> (Kaggle) — a{" "}
            <b>synthetic</b> set that mimics realistic user behaviour with no
            privacy concerns.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {[
              { k: "50,000", v: "records" },
              { k: "19", v: "features" },
              { k: "9", v: "numeric" },
              { k: "10", v: "categorical" },
              { k: "0", v: "missing values" },
            ].map((s) => (
              <div
                key={s.v}
                className="rounded-2xl border border-pink-100 bg-white px-3 py-3 text-center"
              >
                <div className="font-serif-display text-2xl font-bold text-[#DB2777]">
                  {s.k}
                </div>
                <div className="text-xs text-[#831843]">{s.v}</div>
              </div>
            ))}
          </div>
          <p>
            The original target, <code className="rounded bg-pink-50 px-1 font-mono text-[#BE185D]">match_outcome</code>,
            has <b>10 evenly-distributed classes</b>, which we collapse into{" "}
            <b>3 Success Tiers</b>. The free-text{" "}
            <code className="rounded bg-pink-50 px-1 font-mono text-[#BE185D]">interest_tags</code>{" "}
            field (40,206 unique values) was excluded as it needs NLP beyond this
            study's scope.
          </p>
          <p className="rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-[#92400E]">
            <b>The single most important caveat:</b>{" "}
            <code className="rounded bg-white/60 px-1 font-mono">income_bracket</code>{" "}
            and{" "}
            <code className="rounded bg-white/60 px-1 font-mono">education_level</code>{" "}
            — the two features at the heart of our question — turned out to
            contain <b>no valid values after preprocessing</b> (all-NaN) and had
            to be dropped before training. So the model <b>never saw them</b>,
            and the socioeconomic hypothesis couldn't be tested through the model
            directly. This shaped everything that follows.
          </p>
        </Panel>

        {/* Target engineering */}
        <Panel
          icon={<Layers className="h-5 w-5" />}
          title="From 10 Outcomes to 3 Tiers"
        >
          <p>
            Predicting 10 near-identical outcomes is fragmented and hard to
            interpret, so we grouped them into three coherent tiers (encoded{" "}
            <b>Low = 0, Mid = 1, High = 2</b>):
          </p>
          <div className="space-y-2">
            {TIERS.map((t) => (
              <div
                key={t.name}
                className="rounded-2xl border border-pink-100 bg-white p-3"
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#831843]">
                    {t.emoji} {t.name} <span className="text-[#CA8A04]">({t.share})</span>
                  </span>
                </div>
                <p className="mt-0.5 text-xs">{t.outcomes}</p>
                <p className="mt-0.5 text-xs italic text-[#9D174D]/70">
                  {t.rationale}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs italic text-[#9D174D]/70">
            Class balance: Low is the largest tier (~50% of records), then High
            (~30%) and Mid (~20%) — a key reason models lean toward predicting
            “Low”.
          </p>
        </Panel>

        {/* Pipeline */}
        <Panel
          icon={<Workflow className="h-5 w-5" />}
          title="How the Data Is Processed"
        >
          <p>Five preprocessing stages prepare the data for training:</p>
          <ol className="ml-1 space-y-3">
            <Step n={1}>
              <b>Feature removal.</b> Drop <code className="font-mono text-[#BE185D]">interest_tags</code>{" "}
              (40k+ unique values) and redundant label columns — and, critically,{" "}
              <code className="font-mono text-[#BE185D]">income_bracket</code> and{" "}
              <code className="font-mono text-[#BE185D]">education_level</code>,
              which were <b>all-NaN after imputation</b> and could not be used.
            </Step>
            <Step n={2}>
              <b>Ordinal encoding.</b> Income and education were <i>intended</i>
              to be ordinal-encoded (Very Low → Very High; No Formal Education →
              Postdoc) to preserve rank order — but were dropped per Step 1.
            </Step>
            <Step n={3}>
              <b>One-hot encoding.</b> Nominal fields — gender,
              sexual_orientation, location_type, swipe_time_of_day — become
              binary indicators.
            </Step>
            <Step n={4}>
              <b>Standardisation.</b> All numeric features scaled to mean 0,
              variance 1 with <code className="font-mono text-[#BE185D]">StandardScaler</code>{" "}
              (<code className="font-mono text-[#BE185D]">z = (x − μ) / σ</code>).
            </Step>
            <Step n={5}>
              <b>Train/test split.</b> 80 / 20 stratified split (40,000 train /
              10,000 test) keeping tier proportions intact.
            </Step>
          </ol>
          <p className="flex items-start gap-2 text-xs italic text-[#9D174D]/70">
            <Search className="mt-0.5 h-4 w-4 flex-shrink-0" />
            PCA (as analysis, not preprocessing) showed <b>27 of 35 components</b>{" "}
            explain 95% of variance — moderate, not extreme, redundancy. Original
            features were kept to preserve interpretability for SHAP.
          </p>
        </Panel>

        {/* Models compared */}
        <Panel icon={<Brain className="h-5 w-5" />} title="Models We Compared">
          <p>
            Five classifiers spanning linear, instance-based, kernel, and
            ensemble paradigms, scored by <b>macro-average F1</b> (treats each
            tier equally) against a majority-class baseline. Surprisingly, the
            simplest model — <b>KNN</b> — scored the highest Macro F1 (0.2953):
          </p>
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-50 text-[#831843]">
                <tr>
                  <th className="px-3 py-2 font-semibold">Model</th>
                  <th className="px-3 py-2 text-right font-semibold">Acc.</th>
                  <th className="px-3 py-2 text-right font-semibold">Macro F1</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr key={m.name} className="border-t border-pink-100">
                    <td className="px-3 py-2 text-[#831843]">{m.name}</td>
                    <td className="px-3 py-2 text-right font-mono text-[#9D174D]">
                      {m.acc}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-[#CA8A04]">
                      {m.f1}
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-pink-200 bg-pink-100/60 font-semibold">
                  <td className="px-3 py-2 text-[#831843]">
                    ★ XGBoost (tuned — used here)
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#9D174D]">
                    0.4572
                  </td>
                  <td className="px-3 py-2 text-right font-mono text-[#BE185D]">
                    0.2890
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="rounded-2xl border border-pink-100 bg-pink-50/60 px-4 py-3 text-[#831843]">
            <b>Why XGBoost, not KNN?</b> KNN had the top single-split score, but
            its <b>cross-validated</b> F1 was the lowest (0.2097 vs XGBoost's
            0.2621) — a sign that score was an unstable, overfit fluke. XGBoost
            generalises best, works with SHAP for the explanations below, and
            ships as a tiny in-browser model (KNN would need the whole 40k-row
            training set to predict). So we tuned <b>XGBoost</b> with{" "}
            <code className="font-mono text-[#BE185D]">RandomizedSearchCV</code>{" "}
            over 5-fold CV —{" "}
            <code className="font-mono text-[#BE185D]">
              n_estimators=200, max_depth=7, learning_rate=0.2, subsample=0.8,
              colsample_bytree=1.0
            </code>{" "}
            — lifting macro F1 from 0.2481 → <b>0.2890</b>, and deployed it here.
            (SVC was trained on an 8,000-row subsample for tractability;
            auto-sklearn couldn't run due to environment constraints.)
          </p>
        </Panel>

        {/* SHAP findings */}
        <Panel
          icon={<Search className="h-5 w-5" />}
          title="What Actually Drives the Prediction"
        >
          <p>
            SHAP analysis on the tuned model ranks feature influence by mean
            |SHAP|. <b>Behavioural metrics dominate the entire top 10</b> —
            income and education are absent (they were dropped as all-NaN, so no
            SHAP value could even be computed for them):
          </p>
          <div className="space-y-1.5">
            {SHAP.map((s, i) => (
              <div key={s.f} className="flex items-center gap-2 text-xs">
                <span className="w-6 text-right text-[#9D174D]/60">{i + 1}</span>
                <span className="w-44 shrink-0 font-mono text-[#831843]">
                  {s.f}
                </span>
                <div className="h-3 flex-1 overflow-hidden rounded-full bg-pink-50">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(s.v / shapMax) * 100}%`,
                      background: s.demo ? "#FBBF24" : "#F472B6",
                    }}
                  />
                </div>
                <span className="w-14 text-right font-mono text-[#CA8A04]">
                  {s.v.toFixed(3)}
                </span>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-4 text-[11px] text-[#9D174D]/70">
            <span>🌸 behavioural</span>
            <span>🟡 demographic</span>
          </div>
          <p className="text-xs italic text-[#9D174D]/70">
            Crucial caveat: the largest single SHAP value is only <b>0.083</b> —
            negligible. Even the model's favourite features barely move the
            needle; they're simply the <i>least uninformative</i> ones available.
          </p>
        </Panel>

        {/* Insights */}
        <Panel
          icon={<Lightbulb className="h-5 w-5" />}
          title="The Big Questions, Answered"
        >
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-[#831843]">💰 Does money make a difference?</p>
              <p>
                We can't answer this <i>through the model</i> — income was dropped
                as all-NaN. But the <b>descriptive</b> charts are clear:
                success-tier distributions are essentially flat across every
                income group, from “Very Low” to “Very High”. No raw association.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#831843]">🎓 Does education play a role?</p>
              <p>
                Same story — absent from the model, but descriptively flat across
                all nine levels, and not even monotonic. MBA/PhD/Postdoc holders
                show no consistent advantage over lower qualifications.
              </p>
            </div>
            <div>
              <p className="font-semibold text-[#831843]">⚖️ Behavioural vs socioeconomic?</p>
              <p>
                Engagement is the only dimension the model could work with — hence
                the title, <b>Engagement Over Affluence</b>. But there's a catch:
                behavioural features aren't socioeconomically neutral.{" "}
                <code className="font-mono text-[#BE185D]">app_usage_time</code>{" "}
                tracks leisure time; <code className="font-mono text-[#BE185D]">bio_length</code>{" "}
                may reflect education. So behaviour can quietly act as a{" "}
                <b>proxy for socioeconomic status</b> — meaning a “purely
                behavioural” model could still disadvantage lower-income users.
              </p>
            </div>
          </div>
        </Panel>

        {/* Limitations */}
        <Panel
          icon={<AlertTriangle className="h-5 w-5" />}
          title="Honest Caveats & Limitations"
        >
          <p>
            <b>No model meaningfully beat the majority-class baseline</b> (~50%
            accuracy). This is the classic signature of a dataset whose target is
            generated largely independently of its features. Treat every
            prediction as an <b>educational demonstration</b>, not life advice.
          </p>
          <ul className="ml-4 list-disc space-y-1">
            <li>
              <b>Socioeconomic feature loss</b> — income and education were
              dropped as all-NaN, so the core hypothesis was never empirically
              testable through the model. The biggest limitation of the study.
            </li>
            <li>
              <b>Synthetic data</b> — relationships may not reflect the real
              world; findings are suggestive, not causal.
            </li>
            <li>
              <b>Engineered target</b> — the 3-tier mapping involves subjective
              judgement about what “success” means.
            </li>
            <li>
              <b>No temporal data</b> — a static snapshot; we can't see how
              outcomes evolve over time.
            </li>
            <li>
              <b>Missing NLP signal</b> — <code className="font-mono text-[#BE185D]">interest_tags</code>{" "}
              was dropped; text-based compatibility could add real predictive
              power.
            </li>
          </ul>
        </Panel>
      </div>

      {/* CTA */}
      <div className="mt-10 flex flex-col items-center">
        <motion.button
          onClick={() => navigate("/predict")}
          whileHover={{ y: -3 }}
          whileTap={{ scale: 0.97 }}
          className="group flex cursor-pointer items-center gap-3 rounded-2xl border border-amber-400/60 bg-gradient-to-r from-[#DB2777] to-[#BE185D] px-10 py-4 text-base font-semibold uppercase tracking-wider text-white shadow-[0_14px_34px_rgba(219,39,119,0.5)] transition hover:brightness-105"
        >
          <Sparkles className="h-5 w-5" />
          Predict My Success Tier
          <ArrowRight className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1" />
        </motion.button>
      </div>
    </div>
  );
}
