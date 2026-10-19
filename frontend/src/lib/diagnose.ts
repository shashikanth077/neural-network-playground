import type { EpochMetrics, Loss } from "../types";

export type Verdict = "too-early" | "underfitting" | "overfitting" | "good-fit" | "no-validation";

export interface Diagnosis {
  verdict: Verdict;
  title: string;
  reason: string;
  bestEpoch: number | null;
}

const tail = (a: number[], n: number) => a.slice(-Math.max(1, n));
const mean = (a: number[]) => a.reduce((s, x) => s + x, 0) / a.length;

/**
 * Reads the learning curves the way lecture 5 does. This is a rule of thumb, not a proof:
 *  - overfitting: validation loss rose clearly above its minimum while training loss kept falling;
 *  - underfitting: training accuracy is still low and training and validation are close together;
 *  - good fit: both are low and close.
 */
export function diagnose(history: EpochMetrics[], loss: Loss = "bce"): Diagnosis {
  if (history.length < 8) return { verdict: "too-early", title: "Too early to say", reason: "Train for at least 8 epochs, then the curves can be read.", bestEpoch: null };
  const val = history.filter((h) => h.val_loss !== null);
  if (val.length < 8) return { verdict: "no-validation", title: "No validation curve", reason: "Set a validation split above 0 to tell overfitting from underfitting.", bestEpoch: null };

  const best = val.reduce((b, h) => (h.val_loss! < b.val_loss! ? h : b), val[0]);
  const win = Math.max(3, Math.round(history.length * 0.1));
  const trainLoss = mean(tail(history.map((h) => h.train_loss), win));
  const valLoss = mean(tail(val.map((h) => h.val_loss!), win));
  const trainAcc = mean(tail(history.map((h) => h.train_acc), win));
  const valAcc = mean(tail(val.map((h) => h.val_acc!), win));
  const rise = valLoss - best.val_loss!;
  const trainAtBest = history[best.epoch - 1].train_loss;
  const scale = Math.max(best.val_loss!, 0.05);

  if (rise > 0.15 * scale && best.epoch < history.length - win && trainLoss < trainAtBest) {
    return {
      verdict: "overfitting",
      title: "Overfitting",
      reason: `Validation loss was lowest at epoch ${best.epoch} (${best.val_loss!.toFixed(3)}) and has since risen to ${valLoss.toFixed(3)} while training loss kept falling (${trainAtBest.toFixed(3)} → ${trainLoss.toFixed(3)}). The model is starting to memorise. Try early stopping, dropout, L2, or a smaller network.`,
      bestEpoch: best.epoch,
    };
  }
  const chance = loss === "bce" ? Math.LN2 : undefined;
  if (trainAcc < 0.8 && Math.abs(trainAcc - valAcc) < 0.1 && (chance === undefined || trainLoss > 0.45 * chance)) {
    return {
      verdict: "underfitting",
      title: "Underfitting",
      reason: `Training accuracy is only ${(trainAcc * 100).toFixed(1)}% and validation accuracy is similar (${(valAcc * 100).toFixed(1)}%): the model is too simple or trained too briefly. Add neurons or layers, train longer, or raise the learning rate.`,
      bestEpoch: best.epoch,
    };
  }
  return {
    verdict: "good-fit",
    title: "Reasonable fit",
    reason: `Training (${(trainAcc * 100).toFixed(1)}%) and validation (${(valAcc * 100).toFixed(1)}%) accuracy are close and validation loss is not rising (best at epoch ${best.epoch}).`,
    bestEpoch: best.epoch,
  };
}
