import { describeDetail } from "../api/client";
import { downsample, duration, fmt, pct } from "../lib/format";
import { DEFAULT_CONFIG, PRESETS } from "../lib/presets";
import { countParameters, hasErrors, validateConfig } from "../lib/validation";

describe("validateConfig", () => {
  it("accepts the default config", () => {
    expect(hasErrors(validateConfig(DEFAULT_CONFIG, 200))).toBe(false);
  });
  it("flags out-of-range values with helpful messages", () => {
    const e = validateConfig({ ...DEFAULT_CONFIG, hidden_layers: [40], learning_rate: 0, epochs: 0, batch_size: 9999 }, 200);
    expect(e.hidden_layers).toMatch(/1–32/);
    expect(e.learning_rate).toBeDefined();
    expect(e.epochs).toBeDefined();
    expect(e.batch_size).toBeDefined();
  });
  it("rejects more than five hidden layers", () => {
    expect(validateConfig({ ...DEFAULT_CONFIG, hidden_layers: [2, 2, 2, 2, 2, 2] }, 200).hidden_layers).toMatch(/5/);
  });
  it("flags a validation split that leaves too few points", () => {
    expect(validateConfig({ ...DEFAULT_CONFIG, val_split: 0.1 }, 10).val_split).toBeDefined();
  });
});

describe("countParameters", () => {
  it("matches the dense-layer formula", () => {
    expect(countParameters([])).toBe(3);
    expect(countParameters([4, 3])).toBe(2 * 4 + 4 + 4 * 3 + 3 + 3 * 1 + 1);
  });
});

describe("format helpers", () => {
  it("formats numbers and handles missing values", () => {
    expect(fmt(0.123456)).toBe("0.1235");
    expect(fmt(null)).toBe("–");
    expect(pct(0.5)).toBe("50.0%");
    expect(duration(75)).toBe("1m 15s");
  });
  it("downsample keeps the last point and bounds length", () => {
    const a = Array.from({ length: 2000 }, (_, i) => i);
    const d = downsample(a, 100);
    expect(d.length).toBeLessThanOrEqual(101);
    expect(d[d.length - 1]).toBe(1999);
  });
});

describe("describeDetail", () => {
  it("flattens FastAPI validation errors", () => {
    expect(describeDetail([{ loc: ["body", "config", "epochs"], msg: "too big" }])).toBe("config.epochs: too big");
    expect(describeDetail("plain")).toBe("plain");
  });
});

describe("presets", () => {
  it("all presets produce valid configs", () => {
    for (const p of PRESETS) {
      const n = p.dataset.n_samples;
      expect(hasErrors(validateConfig({ ...DEFAULT_CONFIG, ...p.config }, n))).toBe(false);
      for (const v of p.variants ?? []) expect(hasErrors(validateConfig({ ...DEFAULT_CONFIG, ...p.config, ...v.config }, n))).toBe(false);
    }
  });
});
