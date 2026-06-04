import * as ort from "onnxruntime-web";

// Serve the WASM backend from a CDN matching the installed version,
// so we don't have to copy ort-*.wasm files into /public.
ort.env.wasm.wasmPaths =
  "https://cdn.jsdelivr.net/npm/onnxruntime-web@1.26.0/dist/";

export interface Metadata {
  modelFeatureOrder: string[];
  numericScaling: Record<string, { mean: number; scale: number }>;
  categories: Record<string, string[]>;
  classLabels: Record<string, string>;
  probaOutputName: string;
}

export interface RawInputs {
  // categorical
  gender: string;
  sexual_orientation: string;
  location_type: string;
  swipe_time_of_day: string;
  // numerical (model features)
  app_usage_time_min: number;
  swipe_right_ratio: number;
  likes_received: number;
  mutual_matches: number;
  profile_pics_count: number;
  bio_length: number;
  message_sent_count: number;
  emoji_usage_rate: number;
  last_active_hour: number;
}

export interface Prediction {
  tier: number; // 0 = Low, 1 = Mid, 2 = High
  label: string;
  probabilities: number[]; // [P(Low), P(Mid), P(High)]
}

let sessionPromise: Promise<ort.InferenceSession> | null = null;
let metaPromise: Promise<Metadata> | null = null;

const CAT_COLS = [
  "gender",
  "sexual_orientation",
  "location_type",
  "swipe_time_of_day",
] as const;

export async function loadModel(): Promise<{
  session: ort.InferenceSession;
  meta: Metadata;
}> {
  if (!metaPromise) {
    metaPromise = fetch(`${import.meta.env.BASE_URL}model/metadata.json`).then(
      (r) => r.json() as Promise<Metadata>
    );
  }
  if (!sessionPromise) {
    sessionPromise = ort.InferenceSession.create(
      `${import.meta.env.BASE_URL}model/model.onnx`
    );
  }
  const [session, meta] = await Promise.all([sessionPromise, metaPromise]);
  return { session, meta };
}

/** Build the 35-length feature vector in the exact order the model expects. */
export function buildFeatureVector(
  inputs: RawInputs,
  meta: Metadata
): Float32Array {
  // active one-hot column names, e.g. "gender_Male"
  const record = inputs as unknown as Record<string, unknown>;
  const active = new Set(CAT_COLS.map((col) => `${col}_${record[col]}`));

  const vec = new Float32Array(meta.modelFeatureOrder.length);
  meta.modelFeatureOrder.forEach((name, i) => {
    const scaling = meta.numericScaling[name];
    if (scaling) {
      const raw = (inputs as unknown as Record<string, number>)[name];
      vec[i] = (raw - scaling.mean) / scaling.scale; // StandardScaler
    } else {
      vec[i] = active.has(name) ? 1 : 0; // one-hot
    }
  });
  return vec;
}

/** Run the ONNX model and return the raw class probabilities. */
async function runProba(
  session: ort.InferenceSession,
  meta: Metadata,
  inputs: RawInputs
): Promise<number[]> {
  const vec = buildFeatureVector(inputs, meta);
  const tensor = new ort.Tensor("float32", vec, [1, vec.length]);
  const output = await session.run({ [session.inputNames[0]]: tensor });
  const probaTensor =
    output[meta.probaOutputName] ?? output[session.outputNames.at(-1)!];
  return Array.from(probaTensor.data as Float32Array);
}

function argmax(arr: number[]): number {
  let best = 0;
  for (let i = 1; i < arr.length; i++) if (arr[i] > arr[best]) best = i;
  return best;
}

export async function predict(inputs: RawInputs): Promise<Prediction> {
  const { session, meta } = await loadModel();
  const probabilities = await runProba(session, meta, inputs);
  const tier = argmax(probabilities);
  return {
    tier,
    label: meta.classLabels[String(tier)] ?? String(tier),
    probabilities,
  };
}

export interface Contribution {
  feature: keyof RawInputs;
  /** Change in P(predicted tier) caused by this input vs. the baseline value.
      Positive = your value pushed the tier up; negative = pushed it down. */
  contribution: number;
}

/**
 * Local, per-prediction explanation via baseline substitution.
 * For each input, swap it back to `baseline` and re-run the model; the drop in
 * P(predicted tier) is that input's contribution. Pure inference — no retrain.
 */
export async function explain(
  inputs: RawInputs,
  baseline: RawInputs
): Promise<{ tier: number; contributions: Contribution[] }> {
  const { session, meta } = await loadModel();
  const full = await runProba(session, meta, inputs);
  const tier = argmax(full);

  const keys = Object.keys(inputs) as (keyof RawInputs)[];
  const contributions: Contribution[] = [];
  for (const k of keys) {
    if (inputs[k] === baseline[k]) {
      contributions.push({ feature: k, contribution: 0 });
      continue;
    }
    const swapped = { ...inputs, [k]: baseline[k] };
    const p = await runProba(session, meta, swapped);
    contributions.push({ feature: k, contribution: full[tier] - p[tier] });
  }
  return { tier, contributions };
}
