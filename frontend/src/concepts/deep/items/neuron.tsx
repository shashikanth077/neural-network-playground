import { useState } from "react";
import { useT } from "../../../i18n";
import type { DeepDive } from "../types";

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));
/** The guide's student: study 0.8, attendance 0.9; hidden w = (0.5, 0.4), b = 0.1; output w = 2, b = −0.2. */
export const student = () => {
  const zh = 0.8 * 0.5 + 0.9 * 0.4 + 0.1;
  const h = Math.max(0, zh);
  const zo = h * 2 - 0.2;
  const p = sigmoid(zo);
  return { zh, h, zo, p, loss: -Math.log(p), lossIfFail: -Math.log(1 - p), grad: (p - 1) * h, wNew: 2 - 0.1 * (p - 1) * h };
};

function NeuronLab() {
  const t = useT();
  const [x1, setX1] = useState(0.8);
  const [x2, setX2] = useState(0.9);
  const [w1, setW1] = useState(0.5);
  const [w2, setW2] = useState(0.4);
  const [b, setB] = useState(0.1);
  const [act, setAct] = useState<"relu" | "sigmoid" | "tanh">("relu");
  const z = x1 * w1 + x2 * w2 + b;
  const a = act === "relu" ? Math.max(0, z) : act === "sigmoid" ? sigmoid(z) : Math.tanh(z);
  const slider = (label: string, v: number, set: (n: number) => void, min: number, max: number) => (
    <label className="block text-sm">
      <span className="flex justify-between font-medium"><span>{label}</span><span className="font-mono">{v.toFixed(2)}</span></span>
      <input type="range" min={min} max={max} step={0.05} value={v} onChange={(e) => set(+e.target.value)} className="w-full" aria-label={label} />
    </label>
  );
  return (
    <div className="card grid gap-5 p-4 md:grid-cols-2">
      <div className="space-y-2">
        {slider("x₁ (study, scaled)", x1, setX1, 0, 1)}
        {slider("x₂ (attendance, scaled)", x2, setX2, 0, 1)}
        {slider("w₁", w1, setW1, -2, 2)}
        {slider("w₂", w2, setW2, -2, 2)}
        {slider("b", b, setB, -2, 2)}
        <div role="radiogroup" aria-label={t("cc.deep.activation")} className="flex gap-1.5 pt-1">
          {(["relu", "sigmoid", "tanh"] as const).map((k) => (
            <button key={k} type="button" role="radio" aria-checked={act === k} onClick={() => setAct(k)}
              className={`rounded-lg border px-3 py-1 text-sm ${act === k ? "border-brand bg-brand/10 text-brand" : "border-line"}`}>{k}</button>
          ))}
        </div>
      </div>
      <div className="min-w-0 space-y-2 font-mono text-sm" aria-live="polite">
        <p className="rounded-lg bg-raised px-3 py-2">z = {x1.toFixed(2)}×{w1.toFixed(2)} + {x2.toFixed(2)}×{w2.toFixed(2)} + {b.toFixed(2)} = <b>{z.toFixed(4)}</b></p>
        <p className="rounded-lg bg-raised px-3 py-2">a = {act}({z.toFixed(4)}) = <b data-testid="neuron-a">{a.toFixed(4)}</b></p>
        <p className="font-sans text-xs text-muted">{t("cc.deep.neuronHint")}</p>
      </div>
    </div>
  );
}

const s = student();
const f = (n: number, d = 4) => n.toFixed(d);

export const deep: DeepDive = {
  id: "neuron",
  story: {
    title: ["Will this student pass?", "ಈ ವಿದ್ಯಾರ್ಥಿ ಉತ್ತೀರ್ಣರಾಗುತ್ತಾರೆಯೇ?", "Ar šis studentas išlaikys?"],
    body: [
      ["A university wants an early warning: from two signals, **study time** and **attendance** (both scaled to 0–1), estimate whether a student will pass. One neuron is the smallest piece of such a model: it weighs each signal, adds a bias, and passes the sum through an activation.",
        "ಒಂದು ವಿಶ್ವವಿದ್ಯಾಲಯ ಮುಂಚಿತ ಎಚ್ಚರಿಕೆ ಬಯಸುತ್ತದೆ: **ಅಧ್ಯಯನ ಸಮಯ** ಮತ್ತು **ಹಾಜರಾತಿ** (ಎರಡನ್ನೂ 0–1 ಕ್ಕೆ ಮಾಪನ ಮಾಡಲಾಗಿದೆ) ಎಂಬ ಎರಡು ಸಂಕೇತಗಳಿಂದ ವಿದ್ಯಾರ್ಥಿ ಉತ್ತೀರ್ಣರಾಗುತ್ತಾರೆಯೇ ಎಂದು ಅಂದಾಜಿಸುವುದು. ಅಂತಹ ಮಾದರಿಯ ಅತಿ ಚಿಕ್ಕ ಭಾಗವೇ ಒಂದು ನ್ಯೂರಾನ್: ಅದು ಪ್ರತಿ ಸಂಕೇತಕ್ಕೆ ತೂಕ ನೀಡಿ, ಬಯಾಸ್ ಸೇರಿಸಿ, ಮೊತ್ತವನ್ನು ಆಕ್ಟಿವೇಷನ್ ಮೂಲಕ ಹಾಯಿಸುತ್ತದೆ.",
        "Universitetas nori išankstinio įspėjimo: iš dviejų signalų, **mokymosi laiko** ir **lankomumo** (abu normuoti į 0–1), įvertinti, ar studentas išlaikys. Vienas neuronas yra mažiausia tokio modelio dalis: jis pasveria kiekvieną signalą, prideda poslinkį ir perleidžia sumą per aktyvaciją."],
      ["The weights are **learned** from many past students; the numbers below are fixed only so you can follow the arithmetic.",
        "ತೂಕಗಳನ್ನು ಹಿಂದಿನ ಅನೇಕ ವಿದ್ಯಾರ್ಥಿಗಳಿಂದ **ಕಲಿಯಲಾಗುತ್ತದೆ**; ಕೆಳಗಿನ ಸಂಖ್ಯೆಗಳನ್ನು ನೀವು ಲೆಕ್ಕವನ್ನು ಅನುಸರಿಸಲು ಮಾತ್ರ ಸ್ಥಿರವಾಗಿ ಇಡಲಾಗಿದೆ.",
        "Svoriai **išmokstami** iš daugelio ankstesnių studentų; žemiau esantys skaičiai užfiksuoti tik tam, kad galėtumėte sekti skaičiavimą."],
    ],
  },
  analogy: ["A neuron is like a judge's scorecard: each piece of evidence gets a weight, the bias is the judge's starting lean, and the activation is the rule that turns the total into a verdict.",
    "ನ್ಯೂರಾನ್ ಒಬ್ಬ ತೀರ್ಪುಗಾರರ ಅಂಕಪಟ್ಟಿಯಂತೆ: ಪ್ರತಿ ಸಾಕ್ಷ್ಯಕ್ಕೂ ಒಂದು ತೂಕ, ಬಯಾಸ್ ತೀರ್ಪುಗಾರರ ಆರಂಭಿಕ ಒಲವು, ಆಕ್ಟಿವೇಷನ್ ಒಟ್ಟು ಮೊತ್ತವನ್ನು ತೀರ್ಪಾಗಿ ಬದಲಿಸುವ ನಿಯಮ.",
    "Neuronas panašus į teisėjo vertinimo lapą: kiekvienas įrodymas gauna svorį, poslinkis yra teisėjo pradinis polinkis, o aktyvacija yra taisyklė, paverčianti sumą sprendimu."],
  worked: {
    title: ["one student, from inputs to a weight update", "ಒಬ್ಬ ವಿದ್ಯಾರ್ಥಿ, ಇನ್‌ಪುಟ್‌ನಿಂದ ತೂಕದ ನವೀಕರಣದವರೆಗೆ", "vienas studentas nuo įėjimų iki svorio atnaujinimo"],
    intro: ["Study = 0.8, attendance = 0.9, the student really passed (y = 1). One hidden ReLU neuron, one sigmoid output.",
      "ಅಧ್ಯಯನ = 0.8, ಹಾಜರಾತಿ = 0.9, ವಿದ್ಯಾರ್ಥಿ ನಿಜವಾಗಿ ಉತ್ತೀರ್ಣರಾದರು (y = 1). ಒಂದು ಗುಪ್ತ ReLU ನ್ಯೂರಾನ್, ಒಂದು sigmoid ಔಟ್‌ಪುಟ್.",
      "Mokymasis = 0.8, lankomumas = 0.9, studentas iš tikrųjų išlaikė (y = 1). Vienas paslėptas ReLU neuronas, vienas sigmoidinis išėjimas."],
    steps: [
      { title: ["Multiply each input by its weight", "ಪ್ರತಿ ಇನ್‌ಪುಟ್ ಅನ್ನು ಅದರ ತೂಕದಿಂದ ಗುಣಿಸಿ", "Padauginkite kiekvieną įėjimą iš jo svorio"], body: ["Hidden weights 0.5 and 0.4.", "ಗುಪ್ತ ತೂಕಗಳು 0.5 ಮತ್ತು 0.4.", "Paslėpti svoriai 0.5 ir 0.4."], calc: "0.8 × 0.5 = 0.40    0.9 × 0.4 = 0.36" },
      { title: ["Add the bias", "ಬಯಾಸ್ ಸೇರಿಸಿ", "Pridėkite poslinkį"], body: ["This is the raw score z, before the activation.", "ಇದು ಆಕ್ಟಿವೇಷನ್‌ಗೆ ಮೊದಲಿನ ಕಚ್ಚಾ ಅಂಕ z.", "Tai neapdorotas balas z prieš aktyvaciją."], calc: `z = 0.40 + 0.36 + 0.10 = ${f(s.zh, 2)}` },
      { title: ["Apply ReLU", "ReLU ಅನ್ವಯಿಸಿ", "Pritaikykite ReLU"], body: ["The score is positive, so ReLU keeps it.", "ಅಂಕ ಧನಾತ್ಮಕವಾಗಿರುವುದರಿಂದ ReLU ಅದನ್ನು ಉಳಿಸಿಕೊಳ್ಳುತ್ತದೆ.", "Balas teigiamas, todėl ReLU jį palieka."], calc: `a = max(0, ${f(s.zh, 2)}) = ${f(s.h, 2)}` },
      { title: ["Output neuron score", "ಔಟ್‌ಪುಟ್ ನ್ಯೂರಾನ್ ಅಂಕ", "Išėjimo neurono balas"], body: ["Output weight 2, output bias −0.2.", "ಔಟ್‌ಪುಟ್ ತೂಕ 2, ಔಟ್‌ಪುಟ್ ಬಯಾಸ್ −0.2.", "Išėjimo svoris 2, išėjimo poslinkis −0.2."], calc: `z_out = ${f(s.h, 2)} × 2 − 0.2 = ${f(s.zo, 2)}` },
      { title: ["Sigmoid gives a probability", "Sigmoid ಸಂಭವನೀಯತೆ ನೀಡುತ್ತದೆ", "Sigmoidas duoda tikimybę"], body: ["The model leans strongly towards pass.", "ಮಾದರಿ ಉತ್ತೀರ್ಣದ ಕಡೆಗೆ ಬಲವಾಗಿ ಒಲವು ತೋರುತ್ತದೆ.", "Modelis stipriai linksta į išlaikymą."], calc: `p = 1 / (1 + e^(−${f(s.zo, 2)})) = ${f(s.p)}  (${(s.p * 100).toFixed(2)} %)` },
      { title: ["Measure the error (binary cross-entropy)", "ದೋಷವನ್ನು ಅಳೆಯಿರಿ (ಬೈನರಿ ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ)", "Išmatuokite klaidą (dvejetainė kryžminė entropija)"], body: ["Had the student failed, the same p would cost much more.", "ವಿದ್ಯಾರ್ಥಿ ಅನುತ್ತೀರ್ಣರಾಗಿದ್ದರೆ, ಅದೇ p ಹೆಚ್ಚು ದುಬಾರಿಯಾಗುತ್ತಿತ್ತು.", "Jei studentas būtų neišlaikęs, tas pats p kainuotų daug daugiau."], calc: `L = −ln(${f(s.p)}) = ${f(s.loss)}    (if y = 0: −ln(1 − p) = ${f(s.lossIfFail)})` },
      { title: ["Gradient for the output weight", "ಔಟ್‌ಪುಟ್ ತೂಕದ ಗ್ರೇಡಿಯಂಟ್", "Išėjimo svorio gradientas"], body: ["For sigmoid + cross-entropy, dL/dz_out = p − y.", "sigmoid + ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿಗೆ, dL/dz_out = p − y.", "Sigmoidui su kryžmine entropija dL/dz_out = p − y."], calc: `dL/dw_out = (p − y) × a = (${f(s.p)} − 1) × ${f(s.h, 2)} = ${f(s.grad)}` },
      { title: ["One gradient-descent step (learning rate 0.1)", "ಒಂದು ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಹೆಜ್ಜೆ (ಕಲಿಕಾ ದರ 0.1)", "Vienas gradientinio nusileidimo žingsnis (mokymosi greitis 0.1)"], body: ["The weight grows a little, so next time p is closer to 1. Real training updates every weight, over many students.", "ತೂಕ ಸ್ವಲ್ಪ ಹೆಚ್ಚುತ್ತದೆ, ಆದ್ದರಿಂದ ಮುಂದಿನ ಬಾರಿ p 1 ಕ್ಕೆ ಹತ್ತಿರವಾಗುತ್ತದೆ. ನಿಜವಾದ ತರಬೇತಿ ಅನೇಕ ವಿದ್ಯಾರ್ಥಿಗಳ ಮೇಲೆ ಪ್ರತಿ ತೂಕವನ್ನೂ ನವೀಕರಿಸುತ್ತದೆ.", "Svoris šiek tiek padidėja, todėl kitą kartą p bus arčiau 1. Tikras mokymas atnaujina visus svorius per daugelį studentų."], calc: `w_out = 2 − 0.1 × (${f(s.grad)}) = ${f(s.wNew)}` },
    ],
    result: [`The neuron predicts **${(s.p * 100).toFixed(2)} %** pass; the loss is **${f(s.loss)}**; one step moves the output weight to **${f(s.wNew)}**.`,
      `ನ್ಯೂರಾನ್ **${(s.p * 100).toFixed(2)} %** ಉತ್ತೀರ್ಣ ಎಂದು ಊಹಿಸುತ್ತದೆ; ನಷ್ಟ **${f(s.loss)}**; ಒಂದು ಹೆಜ್ಜೆ ಔಟ್‌ಪುಟ್ ತೂಕವನ್ನು **${f(s.wNew)}** ಗೆ ಸರಿಸುತ್ತದೆ.`,
      `Neuronas prognozuoja **${(s.p * 100).toFixed(2)} %** išlaikymo tikimybę; nuostolis **${f(s.loss)}**; vienas žingsnis pakeičia išėjimo svorį į **${f(s.wNew)}**.`],
  },
  Lab: NeuronLab,
  labTitle: ["build your own neuron", "ನಿಮ್ಮದೇ ನ್ಯೂರಾನ್ ನಿರ್ಮಿಸಿ", "susikurkite savo neuroną"],
  code: {
    title: ["the worked example in NumPy", "NumPy ನಲ್ಲಿ ಉದಾಹರಣೆ", "pavyzdys su NumPy"],
    source: `import numpy as np

x = np.array([0.8, 0.9])            # study, attendance (scaled)
w_hidden, b_hidden = np.array([0.5, 0.4]), 0.1
h = max(0.0, x @ w_hidden + b_hidden)  # ReLU -> 0.86

w_out, b_out = 2.0, -0.2
p = 1 / (1 + np.exp(-(h * w_out + b_out)))  # sigmoid
y = 1                                      # the student passed
loss = -(y * np.log(p) + (1 - y) * np.log(1 - p))

grad_w_out = (p - y) * h
w_out_new = w_out - 0.1 * grad_w_out
print(f"{h:.4f} {p:.4f} {loss:.4f} {w_out_new:.4f}")`,
    output: `${f(s.h)} ${f(s.p)} ${f(s.loss)} ${f(s.wNew)}`,
  },
  uses: [
    { domain: ["Education", "ಶಿಕ್ಷಣ", "Švietimas"], example: ["Early-warning systems weigh attendance, assignment marks and logins to flag students who may need help.", "ಮುಂಚಿತ ಎಚ್ಚರಿಕೆ ವ್ಯವಸ್ಥೆಗಳು ಸಹಾಯ ಬೇಕಾಗಬಹುದಾದ ವಿದ್ಯಾರ್ಥಿಗಳನ್ನು ಗುರುತಿಸಲು ಹಾಜರಾತಿ, ಅಸೈನ್‌ಮೆಂಟ್ ಅಂಕಗಳು ಮತ್ತು ಲಾಗಿನ್‌ಗಳನ್ನು ತೂಗುತ್ತವೆ.", "Ankstyvojo įspėjimo sistemos pasveria lankomumą, užduočių pažymius ir prisijungimus, kad pažymėtų studentus, kuriems gali prireikti pagalbos."] },
    { domain: ["Banking", "ಬ್ಯಾಂಕಿಂಗ್", "Bankininkystė"], example: ["A credit score is, at its simplest, a weighted sum of income, debts and payment history passed through a squashing function.", "ಅತ್ಯಂತ ಸರಳವಾಗಿ, ಕ್ರೆಡಿಟ್ ಸ್ಕೋರ್ ಎಂದರೆ ಆದಾಯ, ಸಾಲಗಳು ಮತ್ತು ಪಾವತಿ ಇತಿಹಾಸದ ತೂಕದ ಮೊತ್ತವನ್ನು ಸಂಕುಚಿಸುವ ಕಾರ್ಯದ ಮೂಲಕ ಹಾಯಿಸಿದ್ದು.", "Kredito balas paprasčiausiu atveju yra pajamų, skolų ir mokėjimų istorijos svertinė suma, perleista per suspaudimo funkciją."] },
    { domain: ["Email", "ಇಮೇಲ್", "El. paštas"], example: ["A spam filter's last layer is one neuron: word evidence goes in, a sigmoid probability of spam comes out.", "ಸ್ಪ್ಯಾಮ್ ಫಿಲ್ಟರ್‌ನ ಕೊನೆಯ ಪದರ ಒಂದು ನ್ಯೂರಾನ್: ಪದಗಳ ಸಾಕ್ಷ್ಯ ಒಳಗೆ ಹೋಗುತ್ತದೆ, ಸ್ಪ್ಯಾಮ್‌ನ sigmoid ಸಂಭವನೀಯತೆ ಹೊರಬರುತ್ತದೆ.", "Šlamšto filtro paskutinis sluoksnis yra vienas neuronas: žodžių įrodymai įeina, išeina sigmoidinė šlamšto tikimybė."] },
  ],
  mistakes: [
    ["Reading a weight as a fixed \"importance rating\": weights are learned together and depend on how the inputs are scaled.", "ತೂಕವನ್ನು ಸ್ಥಿರ \"ಮಹತ್ವದ ರೇಟಿಂಗ್\" ಎಂದು ಓದುವುದು: ತೂಕಗಳನ್ನು ಒಟ್ಟಿಗೆ ಕಲಿಯಲಾಗುತ್ತದೆ ಮತ್ತು ಇನ್‌ಪುಟ್‌ಗಳನ್ನು ಹೇಗೆ ಮಾಪನ ಮಾಡಲಾಗಿದೆ ಎಂಬುದರ ಮೇಲೆ ಅವಲಂಬಿತವಾಗಿವೆ.", "Laikyti svorį pastoviu „svarbos įvertinimu“: svoriai išmokstami kartu ir priklauso nuo to, kaip normuoti įėjimai."],
    ["Forgetting the bias: without it every neuron's boundary must pass through the origin.", "ಬಯಾಸ್ ಅನ್ನು ಮರೆಯುವುದು: ಅದಿಲ್ಲದೆ ಪ್ರತಿ ನ್ಯೂರಾನ್‌ನ ಗಡಿ ಮೂಲಬಿಂದುವಿನ ಮೂಲಕವೇ ಹಾದುಹೋಗಬೇಕಾಗುತ್ತದೆ.", "Pamiršti poslinkį: be jo kiekvieno neurono riba turi eiti per koordinačių pradžią."],
    ["Treating ReLU output as a probability: it can be any value ≥ 0, even above 1.", "ReLU ಔಟ್‌ಪುಟ್ ಅನ್ನು ಸಂಭವನೀಯತೆ ಎಂದು ಪರಿಗಣಿಸುವುದು: ಅದು ≥ 0 ಯಾವುದೇ ಮೌಲ್ಯವಾಗಿರಬಹುದು, 1 ಕ್ಕಿಂತ ಹೆಚ್ಚೂ ಆಗಬಹುದು.", "Laikyti ReLU išėjimą tikimybe: jis gali būti bet kokia reikšmė ≥ 0, net didesnė už 1."],
  ],
  quiz: [
    { q: ["With x = (0.8, 0.9), w = (0.5, 0.4) and b = 0.1, what is z?", "x = (0.8, 0.9), w = (0.5, 0.4) ಮತ್ತು b = 0.1 ಆದಾಗ z ಎಷ್ಟು?", "Kai x = (0.8, 0.9), w = (0.5, 0.4) ir b = 0.1, koks yra z?"],
      options: [["0.76", "0.76", "0.76"], ["0.86", "0.86", "0.86"], ["1.52", "1.52", "1.52"]], correct: 1,
      why: ["0.40 + 0.36 + 0.10 = 0.86; 1.52 is the output neuron's score.", "0.40 + 0.36 + 0.10 = 0.86; 1.52 ಔಟ್‌ಪುಟ್ ನ್ಯೂರಾನ್‌ನ ಅಂಕ.", "0.40 + 0.36 + 0.10 = 0.86; 1.52 yra išėjimo neurono balas."],
      verify: () => Math.abs(student().zh - 0.86) < 1e-9 },
    { q: ["What is ReLU(−3)?", "ReLU(−3) ಎಷ್ಟು?", "Kiek yra ReLU(−3)?"], options: [["−3", "−3", "−3"], ["0", "0", "0"], ["3", "3", "3"]], correct: 1,
      why: ["ReLU(z) = max(0, z): negatives become zero.", "ReLU(z) = max(0, z): ಋಣ ಮೌಲ್ಯಗಳು ಸೊನ್ನೆಯಾಗುತ್ತವೆ.", "ReLU(z) = max(0, z): neigiamos reikšmės tampa nuliu."], verify: () => Math.max(0, -3) === 0 },
    { q: ["The student passed and p = 0.8205. Which update direction does gradient descent give the output weight 2?", "ವಿದ್ಯಾರ್ಥಿ ಉತ್ತೀರ್ಣರಾದರು ಮತ್ತು p = 0.8205. ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಔಟ್‌ಪುಟ್ ತೂಕ 2 ಅನ್ನು ಯಾವ ದಿಕ್ಕಿನಲ್ಲಿ ನವೀಕರಿಸುತ್ತದೆ?", "Studentas išlaikė, p = 0.8205. Kuria kryptimi gradientinis nusileidimas pakeis išėjimo svorį 2?"],
      options: [["Up, to about 2.0154", "ಮೇಲೆ, ಸುಮಾರು 2.0154 ಕ್ಕೆ", "Aukštyn, iki maždaug 2.0154"], ["Down, to about 1.9846", "ಕೆಳಗೆ, ಸುಮಾರು 1.9846 ಕ್ಕೆ", "Žemyn, iki maždaug 1.9846"], ["It stays 2", "ಅದು 2 ಆಗಿಯೇ ಉಳಿಯುತ್ತದೆ", "Lieka 2"]], correct: 0,
      why: ["The gradient (p − 1) × 0.86 is negative, and we subtract it.", "ಗ್ರೇಡಿಯಂಟ್ (p − 1) × 0.86 ಋಣಾತ್ಮಕ, ಮತ್ತು ನಾವು ಅದನ್ನು ಕಳೆಯುತ್ತೇವೆ.", "Gradientas (p − 1) × 0.86 yra neigiamas, o mes jį atimame."],
      verify: () => Math.abs(student().wNew - 2.0154) < 5e-5 },
  ],
  sources: ["Lecture 4 (activation and loss) and the uploaded guide \"Activation & Loss Functions — Visual Neural Network Lab\".", "ಉಪನ್ಯಾಸ 4 (ಆಕ್ಟಿವೇಷನ್ ಮತ್ತು ನಷ್ಟ) ಮತ್ತು ಅಪ್‌ಲೋಡ್ ಮಾಡಿದ ಮಾರ್ಗದರ್ಶಿ \"Activation & Loss Functions — Visual Neural Network Lab\".", "4 paskaita (aktyvacija ir nuostolis) ir įkeltas vadovas „Activation & Loss Functions — Visual Neural Network Lab“."],
};
