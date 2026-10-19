import type { Img } from "./math";

/**
 * The last handwritten digit (28 × 28, after preprocessing) that the learner made on the digit step.
 * The convolution step reads it, so "use this digit" carries the picture over. Per-viewer and in memory only.
 */
let lastDigit: Img | null = null;

export const setSharedDigit = (img: Img) => { lastDigit = img; };
export const getSharedDigit = (): Img | null => lastDigit;
