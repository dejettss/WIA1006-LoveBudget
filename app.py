import streamlit as st
import pandas as pd
import numpy as np
import os

# ─── Page config ──────────────────────────────────────────────────────────────
st.set_page_config(
    page_title="Love on a Budget",
    page_icon="💸",
    layout="centered",
    initial_sidebar_state="collapsed",
)

# ─── Load model artifacts ──────────────────────────────────────────────────────
REQUIRED_FILES = ["best_model.pkl", "scaler.pkl", "feature_names.pkl"]
missing = [f for f in REQUIRED_FILES if not os.path.exists(f)]

if missing:
    st.error("### Model files not found")
    st.markdown(
        f"The following files are missing from this directory: **{', '.join(missing)}**\n\n"
        "They were saved at the end of the Colab notebook (Section 11). "
        "Download them from your Colab session and place them in the same folder as `app.py`:\n\n"
        "```\n"
        "Files.download('best_model.pkl')\n"
        "Files.download('scaler.pkl')\n"
        "Files.download('feature_names.pkl')\n"
        "```\n"
        "Then refresh this page."
    )
    st.stop()

import joblib  # only import after files confirmed present

@st.cache_resource
def load_artifacts():
    model        = joblib.load("best_model.pkl")
    scaler       = joblib.load("scaler.pkl")
    feature_names = joblib.load("feature_names.pkl")
    return model, scaler, feature_names

model, scaler, feature_names = load_artifacts()

# Derive one-hot category labels from saved feature names
_cat_cols = ["gender", "sexual_orientation", "location_type", "swipe_time_of_day"]
categories: dict[str, list[str]] = {}
for col in _cat_cols:
    prefix = col + "_"
    categories[col] = sorted([f[len(prefix):] for f in feature_names if f.startswith(prefix)])

# Numerical feature order — must match how the scaler was fitted in the notebook
_num_features = [
    "app_usage_time_min", "swipe_right_ratio", "likes_received",
    "mutual_matches", "profile_pics_count", "bio_length",
    "message_sent_count", "emoji_usage_rate", "last_active_hour",
    "income_bracket", "education_level",
]

# ─── Header ───────────────────────────────────────────────────────────────────
st.title("💸 Love on a Budget")
st.subheader("How Socioeconomic Status Shapes Dating App Success")
st.markdown(
    "Tell us about yourself and your dating-app habits. "
    "Our ML model will predict your **Success Tier**: 🟢 High · 🟡 Mid · 🔴 Low."
)

with st.expander("ℹ️ About this model"):
    st.markdown(
        """
        **Model:** Tuned XGBoost — WIA1006/WID3006 Group Assignment
        **Data:** Synthetic dating-app dataset (50 000 rows)
        **Honest caveat:** No model beat the majority-class baseline by a meaningful margin
        on this synthetic dataset. Treat predictions as an *educational demonstration*.

        **Key finding from the research:** behavioural features (likes received, app usage,
        bio length) carry slightly more weight than socioeconomic ones, but even they have
        very small SHAP magnitudes — consistent with the absence of a real signal in
        synthetic data.
        """
    )

st.divider()

# ─── Section 1: About You ─────────────────────────────────────────────────────
st.markdown("### 👤 About You")
col1, col2 = st.columns(2)

with col1:
    gender = st.selectbox(
        "Gender",
        categories.get("gender", ["Female", "Genderfluid", "Male", "Non-binary", "Prefer Not to Say"]),
    )
    sexual_orientation = st.selectbox(
        "Sexual Orientation",
        categories.get("sexual_orientation", ["Asexual", "Bisexual", "Gay", "Lesbian", "Pansexual", "Straight"]),
    )
    location_type = st.selectbox(
        "Location Type",
        categories.get("location_type", ["Metro", "Rural", "Suburban", "Urban"]),
    )

with col2:
    income_bracket = st.selectbox(
        "Income Bracket",
        ["Very Low", "Low", "Lower-Middle", "Middle", "Upper-Middle", "High", "Very High"],
        index=3,
        help="Note: this was not meaningfully encoded in the trained model (see About section).",
    )
    education_level = st.selectbox(
        "Education Level",
        ["No Formal Education", "High School", "Diploma", "Associate's",
         "Bachelor's", "MBA", "Master's", "PhD", "Postdoc"],
        index=4,
        help="Note: same caveat as income bracket.",
    )

# ─── Section 2: App Behaviour ─────────────────────────────────────────────────
st.markdown("### 📱 App Behaviour")
col3, col4 = st.columns(2)

with col3:
    app_usage_time_min = st.slider("Daily App Usage (minutes)", 0, 300, 90, step=5)
    swipe_right_ratio  = st.slider(
        "Swipe Right Ratio", 0.0, 1.0, 0.50, step=0.01,
        help="What fraction of profiles do you swipe right on?",
    )
    last_active_hour = st.slider(
        "Last Active Hour (0 – 23)", 0, 23, 12,
        help="Hour of day you were last active (24-h clock)",
    )

with col4:
    swipe_time_of_day = st.selectbox(
        "When Do You Usually Swipe?",
        categories.get(
            "swipe_time_of_day",
            ["After Midnight", "Afternoon", "Early Morning", "Evening", "Morning", "Night"],
        ),
    )

# ─── Section 3: Profile & Engagement ─────────────────────────────────────────
st.markdown("### 💌 Profile & Engagement")
col5, col6 = st.columns(2)

with col5:
    likes_received      = st.slider("Likes Received",      0, 200,  50)
    mutual_matches      = st.slider("Mutual Matches",       0,  30,   7)
    profile_pics_count  = st.slider("Profile Pictures",     0,   6,   3)

with col6:
    bio_length          = st.slider("Bio Length (characters)", 0, 500, 150, step=10)
    message_sent_count  = st.slider("Messages Sent",           0, 100,  25)
    emoji_usage_rate    = st.slider("Emoji Usage Rate",      0.0, 1.0, 0.30, step=0.01)

st.divider()

# ─── Predict ──────────────────────────────────────────────────────────────────
if st.button("🔮 Predict My Success Tier", type="primary", use_container_width=True):

    # Build feature vector aligned to training column order
    X_pred = pd.DataFrame(0.0, index=[0], columns=feature_names)

    # One-hot columns
    for col, val in [
        ("gender",             gender),
        ("sexual_orientation", sexual_orientation),
        ("location_type",      location_type),
        ("swipe_time_of_day",  swipe_time_of_day),
    ]:
        key = f"{col}_{val}"
        if key in X_pred.columns:
            X_pred.at[0, key] = 1.0

    # Scale numerical features using the saved scaler.
    # income_bracket / education_level were all-NaN in the notebook (string values
    # failed pd.to_numeric), so we replicate that by passing NaN — XGBoost handles
    # missing values natively via its learned default directions.
    raw = np.array([[
        app_usage_time_min, swipe_right_ratio, likes_received,
        mutual_matches, profile_pics_count, bio_length,
        message_sent_count, emoji_usage_rate, last_active_hour,
        np.nan, np.nan,   # income_bracket, education_level — always missing in training
    ]], dtype=float)

    # Apply StandardScaler formula manually to avoid sklearn's NaN-validation check
    scaled = (raw - scaler.mean_) / scaler.scale_   # NaN propagates for last 2 cols

    for i, col in enumerate(_num_features):
        if col in X_pred.columns:
            X_pred.at[0, col] = scaled[0, i]

    # Run prediction — model was trained without income_bracket / education_level
    X_for_model = X_pred.drop(columns=["income_bracket", "education_level"], errors="ignore")
    pred_class = int(model.predict(X_for_model)[0])
    probas     = model.predict_proba(X_for_model)[0]   # [P(Low), P(Mid), P(High)]

    tier_label  = {0: "Low",  1: "Mid",  2: "High"}
    tier_emoji  = {0: "🔴",   1: "🟡",   2: "🟢"}
    tier_desc   = {
        0: "Low signal right now — but every swipe is a data point. Try improving your bio and engagement.",
        1: "Some sparks! A bit more activity and a polished profile could push you to High.",
        2: "Strong engagement signals — you're set up for real connections. Keep it up!",
    }

    # ── Result card ──────────────────────────────────────────────────────────
    st.markdown(f"## {tier_emoji[pred_class]} Your Success Tier: **{tier_label[pred_class]}**")

    if pred_class == 2:
        st.success(tier_desc[pred_class])
    elif pred_class == 1:
        st.warning(tier_desc[pred_class])
    else:
        st.error(tier_desc[pred_class])

    # ── Probability breakdown ─────────────────────────────────────────────────
    st.markdown("### Probability Breakdown")
    m1, m2, m3 = st.columns(3)
    m1.metric("🔴 Low",  f"{probas[0]:.1%}")
    m2.metric("🟡 Mid",  f"{probas[1]:.1%}")
    m3.metric("🟢 High", f"{probas[2]:.1%}")

    prob_df = pd.DataFrame(
        {"Probability": probas},
        index=["Low", "Mid", "High"]
    )
    st.bar_chart(prob_df)

    # ── Feature tip ──────────────────────────────────────────────────────────
    st.markdown("### 💡 What drives the prediction?")
    inputs = {
        "Likes Received":     likes_received,
        "Mutual Matches":     mutual_matches,
        "App Usage (min/day)":app_usage_time_min,
        "Messages Sent":      message_sent_count,
        "Bio Length":         bio_length,
    }
    top_feature = max(inputs, key=lambda k: abs(inputs[k] - {"Likes Received": 100, "Mutual Matches": 14,
        "App Usage (min/day)": 150, "Messages Sent": 50, "Bio Length": 250}[k]))
    st.info(
        f"Based on SHAP analysis from the research, the most influential features are "
        f"**likes received**, **app usage time**, and **bio length**. "
        f"Your **{top_feature}** value stands out most from the average."
    )

    st.caption(
        "⚠️ Accuracy disclaimer: this model scores ~47–50% accuracy (barely above a coin flip). "
        "The synthetic training data contains little real signal — results are illustrative, not predictive."
    )
