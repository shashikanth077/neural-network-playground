import type { Row } from "../../content/types";

/** Step titles and summaries of the experiment steps, the group heading and the words shared by several steps. */
export const rowsShared: Row[] = [
  ["lab.group.Experiment", "Experiment", "ಪ್ರಯೋಗ", "Eksperimentas"],

  // ---- titles and summaries (English = index.ts)
  ["step.lab3.baselines.title", "The classical and recurrent baselines", "ಕ್ಲಾಸಿಕಲ್ ಮತ್ತು ಮರುಕಳಿಸುವ ಮೂಲ ಮಾದರಿಗಳು", "Klasikiniai ir LSTM modeliai"],
  ["step.lab3.baselines.summary", "TF-IDF, naive Bayes, logistic regression, linear SVM and the BiLSTM, with real weights.", "TF-IDF, ನೈವ್ ಬೇಯ್ಸ್, ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್, ರೇಖೀಯ SVM ಮತ್ತು BiLSTM, ನಿಜವಾದ ತೂಕಗಳೊಂದಿಗೆ.", "TF-IDF, naivusis Bajesas, logistinė regresija, tiesinis SVM ir BiLSTM su tikraisiais svoriais."],
  ["step.lab3.design.title", "Experiment design", "ಪ್ರಯೋಗ ವಿನ್ಯಾಸ", "Eksperimento planas"],
  ["step.lab3.design.summary", "SST-2 splits, the ten competitors, the criteria and the threats to validity.", "SST-2 ವಿಭಜನೆಗಳು, ಹತ್ತು ಸ್ಪರ್ಧಿಗಳು, ಮಾನದಂಡಗಳು ಮತ್ತು ಮಾನ್ಯತೆಗೆ ಅಪಾಯಗಳು.", "SST-2 skaidiniai, dešimt dalyvių, kriterijai ir validumo grėsmės."],
  ["step.lab3.results.title", "Results of the ten models", "ಹತ್ತು ಮಾದರಿಗಳ ಫಲಿತಾಂಶಗಳು", "Dešimties modelių rezultatai"],
  ["step.lab3.results.summary", "Accuracy, bootstrap confidence intervals and McNemar tests, recomputed from the real predictions.", "ನಿಖರತೆ, ಬೂಟ್‌ಸ್ಟ್ರ್ಯಾಪ್ ವಿಶ್ವಾಸಾರ್ಹ ಅಂತರಗಳು ಮತ್ತು ಮೆಕ್‌ನೆಮಾರ್ ಪರೀಕ್ಷೆಗಳು, ನಿಜವಾದ ಭವಿಷ್ಯವಾಣಿಗಳಿಂದ ಮರು ಲೆಕ್ಕಿಸಲಾಗಿದೆ.", "Tikslumas, bootstrap pasikliautinieji intervalai ir McNemaro testai, perskaičiuoti iš tikrųjų prognozių."],
  ["step.lab3.cost.title", "Cost: time, latency and size", "ವೆಚ್ಚ: ಸಮಯ, ವಿಳಂಬ ಮತ್ತು ಗಾತ್ರ", "Kaina: laikas, delsa ir dydis"],
  ["step.lab3.cost.summary", "What the accuracy costs on a CPU: training time, latency per sentence and parameters.", "CPU ನಲ್ಲಿ ನಿಖರತೆಗೆ ಏನು ವೆಚ್ಚ: ತರಬೇತಿ ಸಮಯ, ವಾಕ್ಯಕ್ಕೆ ವಿಳಂಬ ಮತ್ತು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು.", "Kiek kainuoja tikslumas CPU: mokymo laikas, delsa vienam sakiniui ir parametrai."],
  ["step.lab3.efficiency.title", "Data efficiency", "ಡೇಟಾ ದಕ್ಷತೆ", "Duomenų efektyvumas"],
  ["step.lab3.efficiency.summary", "Learning curves: how many labelled sentences each approach needs.", "ಕಲಿಕೆ ರೇಖೆಗಳು: ಪ್ರತಿ ವಿಧಾನಕ್ಕೆ ಎಷ್ಟು ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳು ಬೇಕು.", "Mokymosi kreivės: kiek pažymėtų sakinių reikia kiekvienam metodui."],
  ["step.lab3.readymade.title", "Ready-made and zero-shot models", "ಸಿದ್ಧ ಮತ್ತು ಜೀರೋ-ಶಾಟ್ ಮಾದರಿಗಳು", "Paruošti ir zero-shot modeliai"],
  ["step.lab3.readymade.summary", "Reuse a public model, or classify with natural-language inference and no labels.", "ಸಾರ್ವಜನಿಕ ಮಾದರಿಯನ್ನು ಮರುಬಳಸಿ, ಅಥವಾ ಲೇಬಲ್ ಇಲ್ಲದೆ ನೈಸರ್ಗಿಕ ಭಾಷಾ ಅನುಮಾನದಿಂದ ವರ್ಗೀಕರಿಸಿ.", "Panaudokite viešą modelį arba klasifikuokite natūralios kalbos išvadomis be etikečių."],
  ["step.lab3.errors.title", "Negation, contrast and the sentence lab", "ನಿರಾಕರಣೆ, ವೈರುದ್ಧ್ಯ ಮತ್ತು ವಾಕ್ಯ ಪ್ರಯೋಗಾಲಯ", "Neigimas, kontrastas ir sakinių laboratorija"],
  ["step.lab3.errors.summary", "Where models fail, and every test sentence with every model's answer.", "ಮಾದರಿಗಳು ಎಲ್ಲಿ ವಿಫಲವಾಗುತ್ತವೆ, ಮತ್ತು ಪ್ರತಿ ಪರೀಕ್ಷಾ ವಾಕ್ಯಕ್ಕೆ ಪ್ರತಿ ಮಾದರಿಯ ಉತ್ತರ.", "Kur modeliai klysta ir kiekvienas testo sakinys su kiekvieno modelio atsakymu."],
  ["step.lab3.decide.title", "Which model would you choose?", "ನೀವು ಯಾವ ಮಾದರಿಯನ್ನು ಆರಿಸುತ್ತೀರಿ?", "Kurį modelį rinktumėtės?"],
  ["step.lab3.decide.summary", "A decision helper that turns the paper's recommendations into questions.", "ಪ್ರಬಂಧದ ಶಿಫಾರಸುಗಳನ್ನು ಪ್ರಶ್ನೆಗಳಾಗಿ ಬದಲಿಸುವ ನಿರ್ಧಾರ ಸಹಾಯಕ.", "Sprendimo pagalbininkas, paverčiantis straipsnio rekomendacijas klausimais."],
  ["step.lab3.code.title", "Code walkthrough", "ಕೋಡ್ ಪರಿಶೀಲನೆ", "Kodo apžvalga"],
  ["step.lab3.code.summary", "The nine scripts of the experiment, one by one, with the real code.", "ಪ್ರಯೋಗದ ಒಂಬತ್ತು ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳು, ಒಂದೊಂದಾಗಿ, ನಿಜವಾದ ಕೋಡ್‌ನೊಂದಿಗೆ.", "Devyni eksperimento scenarijai po vieną su tikruoju kodu."],
  ["step.lab3.checklist.title", "What you need to learn", "ನೀವು ಕಲಿಯಬೇಕಾದದ್ದು", "Ką reikia išmokti"],
  ["step.lab3.checklist.summary", "A saved checklist of the concepts behind the lab.", "ಲ್ಯಾಬ್‌ನ ಹಿಂದಿನ ಪರಿಕಲ್ಪನೆಗಳ ಉಳಿಸಲಾದ ಪರಿಶೀಲನಾ ಪಟ್ಟಿ.", "Išsaugomas laboratorijos sąvokų kontrolinis sąrašas."],
  ["step.lab3.defense.title", "Defense Q&A", "ರಕ್ಷಣೆ ಪ್ರಶ್ನೋತ್ತರ", "Gynimo klausimai ir atsakymai"],
  ["step.lab3.defense.summary", "Likely questions with short answers and the numbers to quote.", "ಸಂಭವನೀಯ ಪ್ರಶ್ನೆಗಳು, ಸಣ್ಣ ಉತ್ತರಗಳು ಮತ್ತು ಉಲ್ಲೇಖಿಸಬೇಕಾದ ಸಂಖ್ಯೆಗಳು.", "Tikėtini klausimai su trumpais atsakymais ir skaičiais, kuriuos reikia paminėti."],

  // ---- shared words
  ["lab3.e.x.fam.classical", "Classical (TF-IDF)", "ಕ್ಲಾಸಿಕಲ್ (TF-IDF)", "Klasikiniai (TF-IDF)"],
  ["lab3.e.x.fam.recurrent", "Recurrent (BiLSTM)", "ಮರುಕಳಿಸುವ (BiLSTM)", "Pasikartojantis (BiLSTM)"],
  ["lab3.e.x.fam.transformer", "Transformer", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್", "Transformeris"],
  ["lab3.e.x.legend", "Model families", "ಮಾದರಿ ಕುಟುಂಬಗಳು", "Modelių šeimos"],
  ["lab3.e.x.loading", "Loading the recorded data…", "ದಾಖಲಾದ ಡೇಟಾ ಲೋಡ್ ಆಗುತ್ತಿದೆ…", "Įkeliami įrašyti duomenys…"],
  ["lab3.e.x.positive", "positive", "ಧನಾತ್ಮಕ", "teigiama"],
  ["lab3.e.x.negative", "negative", "ಋಣಾತ್ಮಕ", "neigiama"],
  ["lab3.e.x.yes", "yes", "ಹೌದು", "taip"],
  ["lab3.e.x.no", "no", "ಇಲ್ಲ", "ne"],
  ["lab3.e.x.all", "All", "ಎಲ್ಲಾ", "Visi"],
  ["lab3.e.x.recorded.title", "Recorded, not re-run", "ದಾಖಲಾಗಿದೆ, ಮರುಚಾಲನೆ ಮಾಡಿಲ್ಲ", "Įrašyta, neperleista"],
];
