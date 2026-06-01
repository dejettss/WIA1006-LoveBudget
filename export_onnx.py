"""
Export the trained XGBoost model to ONNX for in-browser inference (onnxruntime-web),
and emit a metadata.json describing the exact preprocessing the React app must replicate.

Run:  python export_onnx.py
Outputs (written into frontend/public/model/):
  - model.onnx
  - metadata.json
"""
import json
import os
import numpy as np
import joblib

from onnxmltools.convert import convert_xgboost
from onnxmltools.convert.common.data_types import FloatTensorType
import onnxruntime as ort

OUT_DIR = os.path.join("frontend", "public", "model")
os.makedirs(OUT_DIR, exist_ok=True)

# ── Load artifacts ────────────────────────────────────────────────────────────
model = joblib.load("best_model.pkl")
scaler = joblib.load("scaler.pkl")
feature_names = list(joblib.load("feature_names.pkl"))

# Columns dropped before the model in the original app (all-NaN in training)
DROPPED = ["income_bracket", "education_level"]
model_features = [f for f in feature_names if f not in DROPPED]
assert len(model_features) == model.n_features_in_, (
    f"feature mismatch: {len(model_features)} vs {model.n_features_in_}"
)

# Numerical features (order the StandardScaler was fitted in)
NUM_FEATURES = [
    "app_usage_time_min", "swipe_right_ratio", "likes_received",
    "mutual_matches", "profile_pics_count", "bio_length",
    "message_sent_count", "emoji_usage_rate", "last_active_hour",
    "income_bracket", "education_level",
]
# Map each numeric feature used by the model -> its (mean, scale) from the scaler
numeric_scaling = {}
for i, name in enumerate(NUM_FEATURES):
    if name in DROPPED:
        continue
    numeric_scaling[name] = {
        "mean": float(scaler.mean_[i]),
        "scale": float(scaler.scale_[i]),
    }

# Derive categorical options from one-hot column prefixes
CAT_COLS = ["gender", "sexual_orientation", "location_type", "swipe_time_of_day"]
categories = {}
for col in CAT_COLS:
    prefix = col + "_"
    categories[col] = [f[len(prefix):] for f in feature_names if f.startswith(prefix)]

# ── Convert to ONNX ───────────────────────────────────────────────────────────
initial_type = [("input", FloatTensorType([None, len(model_features)]))]
onnx_model = convert_xgboost(model, initial_types=initial_type)
onnx_path = os.path.join(OUT_DIR, "model.onnx")
with open(onnx_path, "wb") as f:
    f.write(onnx_model.SerializeToString())
print(f"[ok] wrote {onnx_path}")

# ── Verify ONNX matches the original model on random inputs ────────────────────
sess = ort.InferenceSession(onnx_path, providers=["CPUExecutionProvider"])
out_names = [o.name for o in sess.get_outputs()]
print("[info] onnx outputs:", out_names)

rng = np.random.default_rng(0)
X = rng.standard_normal((20, len(model_features))).astype(np.float32)
# one-hot region: force exactly one 1.0 per categorical block to be realistic
proba_sk = model.predict_proba(X)
onnx_out = sess.run(None, {"input": X})
# probabilities are usually the 2nd output (zipmap) or a tensor
proba_onnx = None
for arr in onnx_out:
    a = np.asarray(arr)
    if a.ndim == 2 and a.shape[1] == 3:
        proba_onnx = a
        break
    if isinstance(arr, list):  # zipmap -> list of dicts
        proba_onnx = np.array([[row[k] for k in sorted(row)] for row in arr])
        break

max_diff = float(np.max(np.abs(proba_sk - proba_onnx)))
print(f"[verify] max |proba_sklearn - proba_onnx| = {max_diff:.6e}")
assert max_diff < 1e-4, "ONNX output diverges from the original model!"
print("[ok] ONNX parity verified (<1e-4)")

# ── Write metadata for the React preprocessing ────────────────────────────────
meta = {
    "modelFeatureOrder": model_features,   # exact column order the ONNX model expects
    "numericScaling": numeric_scaling,     # name -> {mean, scale}
    "categories": categories,              # col -> [options...]
    "classLabels": {"0": "Low", "1": "Mid", "2": "High"},
    "probaOutputName": out_names[-1],
}
meta_path = os.path.join(OUT_DIR, "metadata.json")
with open(meta_path, "w", encoding="utf-8") as f:
    json.dump(meta, f, indent=2)
print(f"[ok] wrote {meta_path}")
print(f"[info] model expects {len(model_features)} features")
