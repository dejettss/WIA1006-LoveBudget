# 💸 Engagement Over Affluence
### A Machine Learning Analysis of Dating App Success Tiers
**WIA1006 Machine Learning | Group 10 | Sem 2, 2025/2026**

> 🔗 **Live demo:** [wia1006-eng-of-aff-g10.vercel.app](https://wia1006-eng-of-aff-g10.vercel.app/)

---

## About
This project investigates whether a user's **income bracket** and **education level** can predict their dating-app success — even after accounting for behavioural factors like app usage and swipe patterns.

A key finding shaped the whole project: the two socioeconomic features (`income_bracket`, `education_level`) turned out to be **entirely missing (all-NaN) after preprocessing** and had to be dropped, so the model could only learn from behavioural signals. The evidence pointed to **engagement over affluence** — hence the title.

The interactive dashboard lets anyone input a profile and get a predicted **Success Tier**: 🟢 High · 🟡 Mid · 🔴 Low, plus an explanation of which inputs shaped that result.

---

## Key Findings
- **No model meaningfully beat the majority-class baseline** (~50% accuracy, Macro F1 ≈ 0.22) — the classic signature of a dataset whose target carries little recoverable signal.
- **KNN** scored the highest Macro F1 (0.2953), but **tuned XGBoost** (0.2890) was deployed for its clean SHAP support and stable cross-validated performance.
- Every top-10 SHAP feature is **behavioural** (`likes_received`, `bio_length`, `app_usage_time_min` lead) — but even the strongest has a tiny SHAP value (~0.083).
- **Income and education left no detectable trace**, both in the (missing) model features and in descriptive cross-tabulations.
- The data is **synthetic**, so results are an educational demonstration, not real-world advice.

---

## How It Works
The dashboard is a **React + TypeScript + Vite** app that runs the trained XGBoost model **directly in the browser** via ONNX (`onnxruntime-web`) — there is **no backend server**, and no user input ever leaves the browser. It's deployed as a static site on **Vercel**.

**Tech stack:** React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion (animations) · React Router (Home / Predict / Team pages) · lucide-react (icons) · onnxruntime-web (in-browser inference). Python (scikit-learn, XGBoost, ONNX tools) is used **only offline** to train and export the model.

---

## 🔄 Data Flow

Two phases: the **training/export phase** happens once, offline in Python; the **runtime phase** happens entirely in the visitor's browser.

```
┌─────────────────────────── OFFLINE (Python, one-time) ───────────────────────────┐
│                                                                                   │
│  Dating App Behavior Dataset (Kaggle, 50k rows, synthetic)                        │
│        │                                                                          │
│        ▼   love_on_a_budget_+_rev1.ipynb  (pandas, scikit-learn, xgboost)         │
│  Preprocess  →  collapse 10 match_outcomes into 3 tiers  →  train & tune XGBoost  │
│        │                                                                          │
│        ▼   joblib.dump(...)                                                       │
│  best_model.pkl + scaler.pkl + feature_names.pkl                                  │
│        │                                                                          │
│        ▼   export_onnx.py  (onnxmltools / onnxruntime)                            │
│  frontend/public/model/model.onnx  +  metadata.json   (committed to the repo)     │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
                                     │
                                     ▼  (loaded over HTTP by the React app)
┌─────────────────────────── RUNTIME (browser, every use) ─────────────────────────┐
│                                                                                   │
│  User fills the form (sliders + dropdowns)  →  RawInputs object                   │
│        │                                                                          │
│        ▼   src/lib/model.ts : buildFeatureVector()                               │
│  One-hot encode categoricals + StandardScale numerics  →  35-feature vector       │
│   (using the μ/σ and feature order read from metadata.json)                       │
│        │                                                                          │
│        ▼   onnxruntime-web runs model.onnx                                        │
│  Class probabilities [P(Low), P(Mid), P(High)]  →  argmax  →  Success Tier        │
│        │                                                                          │
│        ▼   src/lib/model.ts : explain()  (baseline-substitution)                  │
│  Per-input contributions  →  rendered as the “What Shaped Your Tier” bars         │
│        │                                                                          │
│        ▼   React + Framer Motion                                                  │
│  Animated tier, probability breakdown, and explanation shown to the user          │
│                                                                                   │
└───────────────────────────────────────────────────────────────────────────────────┘
```

**Key point:** `metadata.json` is the contract between Python and the browser — it stores the exact **feature order**, the **StandardScaler** mean/scale per numeric feature, the **category lists** for one-hot encoding, and the **class labels**. That's how `model.ts` reproduces the training preprocessing with no Python at runtime.

---

## Using the Dashboard
Three pages, reachable from the floating nav bar (logo top-left, **Home · Predict · Team** pill in the top-center):

**1. Home** — the landing page. Explains the project, dataset, the 3-tier target, the ML pipeline, the model comparison, the SHAP findings, and the honest limitations. A button takes you to the predictor.

**2. Predict** — the interactive tool:
- Fill in your details across three tabs: **About You** (gender, orientation, location, income, education), **App Habits** (daily usage, swipe ratio, active hour, time of day), and **Profile** (likes, matches, photos, bio length, messages, emoji rate).
- Use the **Quick fill** presets (Power user / Casual swiper / New account) to populate fields instantly, or tick **Live update** to re-predict as you drag the sliders.
- Click **Predict My Success Tier** to see your predicted **tier**, a **probability breakdown** across Low/Mid/High, and a **"What Shaped Your Tier"** panel showing which inputs moved the prediction. **Copy result** to share, or **Reset** to restore defaults.

**3. Team** — the group members behind the project.

---

## Project Structure

| Path | Description |
|------|-------------|
| `frontend/` | React + TypeScript + Vite app (Tailwind CSS) |
| `frontend/src/App.tsx` | Routes (`/`, `/predict`, `/team`) + animated background |
| `frontend/src/pages/HomePage.tsx` | Landing page — project explanation |
| `frontend/src/components/Dashboard.tsx` | The prediction UI (form, result, explanation) |
| `frontend/src/pages/TeamPage.tsx` | Team members page |
| `frontend/src/components/NavBar.tsx` | Floating logo + Home/Predict/Team nav |
| `frontend/src/lib/model.ts` | In-browser ONNX inference, preprocessing & explanation |
| `frontend/public/model/` | Exported `model.onnx` + `metadata.json` |
| `frontend/vercel.json` | SPA routing config for Vercel |
| `export_onnx.py` | Converts the trained `.pkl` model to ONNX for the browser |
| `love_on_a_budget_+_rev1.ipynb` | Full ML notebook (training, evaluation, SHAP) |

---

## Models Compared

| Model | Accuracy | Macro F1 |
|-------|----------|----------|
| **KNN** *(best Macro F1)* | 0.4651 | **0.2953** |
| Random Forest | 0.4848 | 0.2637 |
| XGBoost (default) | 0.4899 | 0.2481 |
| XGBoost *(tuned — powers the dashboard)* | 0.4572 | 0.2890 |
| SVC *(RBF, 8k subsample)* | 0.5009 | 0.2229 |
| Logistic Regression | 0.5008 | 0.2225 |
| Baseline (majority class) | 0.5008 | 0.2225 |

> **KNN** scored the highest Macro F1 (0.2953), but **XGBoost** was tuned and deployed for its clean SHAP integration and more stable cross-validated performance. Because the training data is synthetic — and the socioeconomic features were all-NaN — no model meaningfully outperformed the majority-class baseline. Predictions are for **educational demonstration** purposes.
