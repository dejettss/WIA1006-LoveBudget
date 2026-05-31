# 💸 Love on a Budget
### How Socioeconomic Status Shapes Dating App Success
**WIA1006/WID3006 Machine Learning | Group Assignment | Sem 2, 2025/2026**

---

## About
This project investigates whether a user's income bracket and education level can predict their dating app success — even after controlling for behavioural factors like app usage and swipe patterns.

The interactive dashboard lets anyone input their profile details and get a predicted **Success Tier**: 🟢 High · 🟡 Mid · 🔴 Low.

---

## Running the Dashboard on Your Laptop

### Prerequisites
- Python 3.9 or newer installed on your laptop
- The 3 model files from Google Colab (see Step 1 below)

---

### Step 1 — Download the model files from Colab

The dashboard needs 3 files that are generated when you run the notebook in Google Colab.
Open the notebook, make sure all cells have been run (especially **Section 11 — Save Model**), then add a new cell at the bottom and run it:

```python
from google.colab import files
files.download('best_model.pkl')
files.download('scaler.pkl')
files.download('feature_names.pkl')
```

Your browser will download all 3 files. Move them into this project folder so the structure looks like this:

```
WIA1006-LoveBudget/
├── app.py
├── requirements.txt
├── love_on_a_budget_+_rev1.ipynb
├── best_model.pkl        ← from Colab
├── scaler.pkl            ← from Colab
└── feature_names.pkl     ← from Colab
```

> **Note:** If your Colab session was reset or disconnected, re-run the notebook from **Section 6** (Model Training) onwards before downloading.

---

### Step 2 — Open a terminal in the project folder

In VS Code, press `` Ctrl+` `` to open the integrated terminal.
Make sure you are inside the project folder:

```bash
cd "c:\path\to\WIA1006-LoveBudget"
```

---

### Step 3 — Install dependencies

Run this once to install all required packages:

```bash
pip install -r requirements.txt
```

This installs: `streamlit`, `pandas`, `numpy`, `scikit-learn`, `xgboost`, and `joblib`.

---

### Step 4 — Launch the dashboard

```bash
streamlit run app.py
```

Streamlit will print a local URL and automatically open it in your browser:

```
  Local URL: http://localhost:8501
```

If the browser does not open automatically, copy that URL and paste it into your browser.

---

### Step 5 — Use the dashboard

1. Fill in your profile details across the three sections:
   - **About You** — gender, orientation, location, income, education
   - **App Behaviour** — daily usage, swipe ratio, active hour, time of day
   - **Profile & Engagement** — likes, matches, photos, bio length, messages, emoji rate
2. Click **🔮 Predict My Success Tier**
3. Your predicted tier and probability breakdown will appear below

---

### Stopping the dashboard

Press `Ctrl+C` in the terminal to stop the Streamlit server.

---

## Project Structure

| File | Description |
|------|-------------|
| `app.py` | Streamlit dashboard |
| `requirements.txt` | Python dependencies |
| `love_on_a_budget_+_rev1.ipynb` | Full ML notebook (run in Google Colab) |
| `best_model.pkl` | Trained XGBoost model (download from Colab) |
| `scaler.pkl` | Fitted StandardScaler (download from Colab) |
| `feature_names.pkl` | Training feature column names (download from Colab) |

---

## Models Used

| Model | Macro F1 |
|-------|----------|
| KNN *(best)* | 0.2953 |
| Random Forest | 0.2637 |
| XGBoost (tuned) | 0.2890 |
| SVC | 0.2229 |
| Logistic Regression | 0.2225 |
| Baseline (majority class) | 0.2225 |

> The dashboard uses the **tuned XGBoost** model. Because the training data is synthetic, no model meaningfully outperformed the majority-class baseline — predictions are for educational demonstration purposes.
