import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Brain, Calculator, Database, ArrowRight } from "lucide-react";

/* ── Small styled panel matching the dashboard's card language ─────────────── */
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

const MODELS: { name: string; f1: string; tuned?: boolean }[] = [
  { name: "XGBoost (tuned — used here)", f1: "0.2890", tuned: true },
  { name: "KNN", f1: "0.2953" },
  { name: "Random Forest", f1: "0.2637" },
  { name: "SVC", f1: "0.2229" },
  { name: "Logistic Regression", f1: "0.2225" },
  { name: "Baseline (majority class)", f1: "0.2225" },
];

export default function HomePage() {
  const navigate = useNavigate();

  return (
    <div className="relative z-10 mx-auto max-w-3xl px-4 py-12 md:py-16">
      {/* Hero */}
      <header className="mb-10 text-center text-white drop-shadow-[0_2px_12px_rgba(131,24,67,0.5)]">
        <motion.h1
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="font-serif-display text-5xl font-bold md:text-7xl"
        >
          💖 Love on a Budget
        </motion.h1>
        <p className="font-serif-display mt-1 text-2xl italic md:text-3xl">
          How Socioeconomic Status Shapes Dating-App Success
        </p>
        <p className="mx-auto mt-3 max-w-xl text-sm font-medium text-white/90">
          WIA1006 / WID3006 Machine Learning · Group Assignment · Sem 2,
          2025/2026
        </p>
      </header>

      <div className="space-y-5">
        {/* About the project */}
        <Panel icon={<Sparkles className="h-5 w-5" />} title="About This Project">
          <p>
            We set out to answer one question:{" "}
            <b>
              can a person's income bracket and education level predict their
              dating-app success
            </b>{" "}
            — even after accounting for behavioural factors like app usage and
            swipe patterns?
          </p>
          <p>
            Using a 50,000-row dataset, we engineered features, trained several
            machine-learning models, and built this interactive dashboard. Enter
            your profile and the model predicts a{" "}
            <b>Success Tier</b>: 🟢 High · 🟡 Mid · 🔴 Low.
          </p>
        </Panel>

        {/* The model used */}
        <Panel icon={<Brain className="h-5 w-5" />} title="The Model We Use">
          <p>
            The dashboard runs a <b>tuned XGBoost classifier</b> — a
            gradient-boosted ensemble of decision trees — exported to ONNX so it
            runs <b>entirely in your browser</b>, with no server needed. We
            compared six approaches by macro F1 score:
          </p>
          <div className="overflow-hidden rounded-2xl border border-pink-100">
            <table className="w-full text-left text-sm">
              <thead className="bg-pink-50 text-[#831843]">
                <tr>
                  <th className="px-4 py-2 font-semibold">Model</th>
                  <th className="px-4 py-2 text-right font-semibold">Macro F1</th>
                </tr>
              </thead>
              <tbody>
                {MODELS.map((m) => (
                  <tr
                    key={m.name}
                    className={`border-t border-pink-100 ${
                      m.tuned ? "bg-pink-100/60 font-semibold" : ""
                    }`}
                  >
                    <td className="px-4 py-2 text-[#831843]">{m.name}</td>
                    <td className="px-4 py-2 text-right font-mono text-[#CA8A04]">
                      {m.f1}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs italic text-[#9D174D]/70">
            ⚠️ Honest caveat: because the dataset is synthetic, no model beat the
            majority-class baseline meaningfully (~47–50% accuracy). Treat
            predictions as an educational demonstration.
          </p>
        </Panel>

        {/* Calculation behind the model */}
        <Panel
          icon={<Calculator className="h-5 w-5" />}
          title="The Calculation Behind It"
        >
          <p>From your raw inputs to a tier, four steps happen in the browser:</p>
          <ol className="ml-1 space-y-3">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DB2777] text-xs font-bold text-white">
                1
              </span>
              <span>
                <b>Encoding.</b> Categorical fields (gender, orientation,
                location, swipe time) are <b>one-hot encoded</b>, and numeric
                fields are <b>standardised</b> with the training
                mean/standard-deviation:{" "}
                <code className="rounded bg-pink-50 px-1 font-mono text-[#BE185D]">
                  z = (x − μ) / σ
                </code>
                . Together these form a <b>35-feature</b> vector.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DB2777] text-xs font-bold text-white">
                2
              </span>
              <span>
                <b>Boosted trees.</b> XGBoost sums the outputs of hundreds of
                decision trees, each correcting the previous one's errors, to
                produce a raw score for every tier.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DB2777] text-xs font-bold text-white">
                3
              </span>
              <span>
                <b>Softmax.</b> Those scores are turned into probabilities that
                sum to 100% across Low / Mid / High.
              </span>
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#DB2777] text-xs font-bold text-white">
                4
              </span>
              <span>
                <b>Argmax + explanation.</b> The highest-probability tier is your
                result. We also re-run the model with each input swapped to a
                typical value to show <b>which factors moved your tier</b>.
              </span>
            </li>
          </ol>
          <p className="flex items-center gap-2 text-xs italic text-[#9D174D]/70">
            <Database className="h-4 w-4" />
            Income and education are collected for context but were dropped
            during training — they carried almost no predictive signal, which is
            itself a key finding.
          </p>
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
        <p className="mt-3 text-xs font-medium text-white/80">
          Takes about 30 seconds · runs privately in your browser
        </p>
      </div>
    </div>
  );
}
