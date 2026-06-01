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

export async function predict(inputs: RawInputs): Promise<Prediction> {
  const { session, meta } = await loadModel();
  const vec = buildFeatureVector(inputs, meta);
  const tensor = new ort.Tensor("float32", vec, [1, vec.length]);

  const feeds: Record<string, ort.Tensor> = {
    [session.inputNames[0]]: tensor,
  };
  const output = await session.run(feeds);

  const probaTensor =
    output[meta.probaOutputName] ?? output[session.outputNames.at(-1)!];
  const probabilities = Array.from(probaTensor.data as Float32Array);

  let tier = 0;
  for (let i = 1; i < probabilities.length; i++) {
    if (probabilities[i] > probabilities[tier]) tier = i;
  }

  return {
    tier,
    label: meta.classLabels[String(tier)] ?? String(tier),
    probabilities,
  };
}
