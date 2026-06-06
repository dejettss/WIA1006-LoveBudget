# 💸 Engagement Over Affluence
### A Machine Learning Analysis of Dating App Success Tiers
**WIA1006 Machine Learning | Group 10 | Sem 2, 2025/2026**

---

## About
This project investigates whether a user's income bracket and education level can predict their dating app success — even after controlling for behavioural factors like app usage and swipe patterns.

A key finding shaped the project: the two socioeconomic features (`income_bracket`, `education_level`) turned out to be **entirely missing (all-NaN) after preprocessing** and had to be dropped, so the model could only learn from behavioural signals. The evidence pointed to **engagement over affluence** — hence the title.

The interactive dashboard lets anyone input their profile details and get a predicted **Success Tier**: 🟢 High · 🟡 Mid · 🔴 Low.

---

## Running the Dashboard

The dashboard is a **React + TypeScript + Vite** app (in `frontend/`) that runs the
trained XGBoost model **directly in the browser** via ONNX (`onnxruntime-web`) — no
Python server is needed at runtime.

**Tech stack:** React 19 · TypeScript · Vite · Tailwind CSS · Framer Motion
(animations) · React Router (Home / Predict / Team pages) · lucide-react (icons) ·
onnxruntime-web (in-browser inference). Python (scikit-learn, XGBoost, ONNX tools)
is used **only offline** to train and export the model.

---

## 🔄 Data Flow

There are two phases. The **training/export phase** happens once, offline in Python;
the **runtime phase** happens entirely in the user's browser with no server.

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

**Key points**
- `metadata.json` is the contract between Python and the browser: it stores the
  exact **feature order**, the **StandardScaler** mean/scale per numeric feature,
  the **category lists** for one-hot encoding, and the **class labels**. This is how
  `model.ts` reproduces the training preprocessing without any Python at runtime.
- The model and all inference run **client-side** — nothing about the user's input
  ever leaves their browser.

---

## 🚀 Quick Start 

If you just want to **run the dashboard on your computer**, this is all you need.
The trained model is already committed to the repo (`frontend/public/model/model.onnx`),
so you do **not** need Python, Colab, or the ONNX export steps below.

### Prerequisites
- [**Node.js 18+**](https://nodejs.org/) — that's it. Check with `node -v`.

### Steps

```bash
# 1. Clone the repo (or git pull if you already have it)
git clone https://github.com/dejettss/WIA1006-LoveBudget.git
cd WIA1006-LoveBudget

# 2. Go into the frontend folder
cd frontend

# 3. Install dependencies (first time only — takes a minute)
npm install

# 4. Start the dev server
npm run dev
```

> **Windows note:** the commands above work the same in PowerShell, Command Prompt,
> or Git Bash.

Then open the URL it prints (default **http://localhost:5173**) in your browser.
To stop the server, press `Ctrl+C` in the terminal.

That's it — skip straight to **[Step 4 — Use the dashboard](#step-4--use-the-dashboard)** below.

### Troubleshooting
- **`npm` / `node` not recognized** → install Node.js from the link above and reopen your terminal.
- **Port 5173 already in use** → Vite will automatically pick the next free port; use whatever URL it prints.
- **Blank page / model error** → make sure you pulled the latest `main` so `frontend/public/model/model.onnx` exists.

---

## Re-generating the model (optional — only if you change the ML notebook)

The steps below are **only needed if you retrain the model**. For just running the
dashboard, use the Quick Start above instead.

### Prerequisites
- Node.js 18+ (to run the React app)
- Python 3.9+ (only needed to re-generate / re-export the model)

---

### Step 1 — Generate the model files

The 3 model files (`best_model.pkl`, `scaler.pkl`, `feature_names.pkl`) are not included in this repo because they are generated by training. You need to produce them yourself by running the notebook.

1. Open `love_on_a_budget_+_rev1.ipynb` in [Google Colab](https://colab.research.google.com/)
2. Run **all cells** from top to bottom (Runtime → Run all)
3. Once finished, add a new cell at the bottom and run it:

```python
from google.colab import files
files.download('best_model.pkl')
files.download('scaler.pkl')
files.download('feature_names.pkl')
```

4. Move the 3 downloaded files into the root of this repo (`best_model.pkl`,
   `scaler.pkl`, `feature_names.pkl`).

---

### Step 2 — Export the model to ONNX

Convert the trained model so the browser can run it. From the repo root:

```bash
pip install -r requirements.txt
python export_onnx.py
```

This writes `frontend/public/model/model.onnx` and `metadata.json`, and verifies the
ONNX output matches the original model.

---

### Step 3 — Launch the dashboard

```bash
cd frontend
npm install
npm run dev
```

Open the printed URL (default `http://localhost:5173`).

---

<a id="step-4--use-the-dashboard"></a>
### Step 4 — Use the dashboard

The app has three pages, reachable from the floating nav bar (logo top-left,
**Home · Predict · Team** pill in the top-center):

**1. Home (`/`)** — the landing page. It explains the project, dataset, the
3-tier target, the ML pipeline, the model comparison, the SHAP findings, and the
honest limitations (all sourced from the group report). Click the big
**Predict My Success Tier** button to go to the predictor.

**2. Predict (`/predict`)** — the interactive tool:
1. Fill in your details across the three tabs:
   - **About You** — gender, orientation, location, income, education
   - **App Habits** — daily usage, swipe ratio, active hour, time of day
   - **Profile** — likes, matches, photos, bio length, messages, emoji rate
   - Tip: use the **Quick fill** presets (Power user / Casual swiper / New
     account) to populate the behavioural fields instantly, or tick **Live
     update** to re-predict automatically as you drag the sliders.
2. Click **Predict My Success Tier**.
3. Your result appears below: the predicted **tier**, a **probability
   breakdown** across Low/Mid/High, and a **“What Shaped Your Tier”** panel
   showing which of your inputs pushed the prediction up or down. Use **Copy
   result** to share it, or **Reset** to restore defaults.

**3. Team (`/team`)** — the group members behind the project.

To stop the server, press `Ctrl+C` in the terminal.

---

## Project Structure

| Path | Description |
|------|-------------|
| `frontend/` | React + TypeScript + Vite app (Tailwind CSS) |
| `frontend/src/App.tsx` | Routes (`/`, `/predict`, `/team`) + animated background |
| `frontend/src/pages/HomePage.tsx` | Landing page — project explanation (sourced from the report) |
| `frontend/src/components/Dashboard.tsx` | The prediction UI (form, result, explanation) |
| `frontend/src/pages/TeamPage.tsx` | Team members page |
| `frontend/src/components/NavBar.tsx` | Floating logo + Home/Predict/Team nav |
| `frontend/src/lib/model.ts` | In-browser ONNX inference, preprocessing & explanation |
| `frontend/src/lib/team.ts` | Team member data |
| `frontend/src/components/ui/background-gradient-animation.tsx` | Animated gradient background |
| `frontend/public/model/` | Exported `model.onnx` + `metadata.json` |
| `frontend/public/logo.png` | App logo (shown in the nav bar) |
| `export_onnx.py` | Converts the `.pkl` model to ONNX for the browser |
| `requirements.txt` | Python deps (only for the ONNX export) |
| `love_on_a_budget_+_rev1.ipynb` | Full ML notebook (run in Google Colab) |
| `best_model.pkl` / `scaler.pkl` / `feature_names.pkl` | Trained model artifacts *(generate from notebook)* |

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

> **KNN** scored the highest Macro F1 (0.2953), but **XGBoost** was tuned and deployed in the dashboard for its clean SHAP integration. Because the training data is synthetic — and the socioeconomic features were all-NaN — no model meaningfully outperformed the majority-class baseline. Predictions are for educational demonstration purposes.
