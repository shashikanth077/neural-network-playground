import { RECORDED } from "../../data/theoryRecorded";
import type { GuideDef } from "../../content/types";
import { BERT_TINY, paramBreakdown, paramTotal, sinusoidalPE } from "../../transformerMath";

const acc = (name: string) => RECORDED.models.find((m) => m.name.startsWith(name))!.acc;

/** Guides of overview, history, tokens and position. */
export const guides1: Record<string, GuideDef> = {
  overview: {
    goal: [
      "State the research problem and the five research questions of the paper, and name the ten models that are compared.",
      "ಪ್ರಬಂಧದ ಸಂಶೋಧನಾ ಸಮಸ್ಯೆ ಮತ್ತು ಐದು ಸಂಶೋಧನಾ ಪ್ರಶ್ನೆಗಳನ್ನು ಹೇಳಿ, ಹೋಲಿಸಲಾದ ಹತ್ತು ಮಾದರಿಗಳನ್ನು ಹೆಸರಿಸಿ.",
      "Nusakyti straipsnio tyrimo problemą ir penkis tyrimo klausimus bei įvardyti dešimt lyginamų modelių.",
    ],
    fit: [
      "Every later step answers one of the questions, so knowing them first tells you what each demo is for.",
      "ನಂತರದ ಪ್ರತಿ ಹಂತವೂ ಒಂದು ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಮೊದಲು ಅವನ್ನು ತಿಳಿದರೆ ಪ್ರತಿ ಡೆಮೊ ಯಾವುದಕ್ಕೆ ಎಂದು ತಿಳಿಯುತ್ತದೆ.",
      "Kiekvienas tolesnis žingsnis atsako į vieną klausimą, todėl žinodami juos iš anksto suprasite, kam skirta kiekviena demonstracija.",
    ],
    keywords: [
      [["SST-2", "SST-2", "SST-2"], ["Binary movie-review sentiment benchmark, 872 test sentences.", "ದ್ವಿಮಾನ ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆ ಭಾವನೆ ಬೆಂಚ್‌ಮಾರ್ಕ್, 872 ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳು.", "Dvejetainis filmų apžvalgų nuotaikų testas, 872 testo sakiniai."]],
      [["Fine-tuning", "ಫೈನ್-ಟ್ಯೂನಿಂಗ್", "Derinimas"], ["Training a pre-trained model further on the task data.", "ಪೂರ್ವ-ತರಬೇತಿ ಪಡೆದ ಮಾದರಿಯನ್ನು ಕಾರ್ಯದ ಡೇಟಾದ ಮೇಲೆ ಮತ್ತಷ್ಟು ತರಬೇತಿ ಮಾಡುವುದು.", "Iš anksto išmokyto modelio tolesnis mokymas su užduoties duomenimis."]],
      [["Zero-shot", "ಝೀರೋ-ಶಾಟ್", "Be pavyzdžių"], ["Classifying with no labelled training examples at all.", "ಯಾವುದೇ ಲೇಬಲ್ ಮಾಡಿದ ತರಬೇತಿ ಉದಾಹರಣೆಗಳಿಲ್ಲದೆ ವರ್ಗೀಕರಿಸುವುದು.", "Klasifikavimas be jokių pažymėtų mokymo pavyzdžių."]],
    ],
    tasks: [
      ["Read the five research questions and open the step that answers RQ2.", "ಐದು ಸಂಶೋಧನಾ ಪ್ರಶ್ನೆಗಳನ್ನು ಓದಿ ಮತ್ತು RQ2 ಗೆ ಉತ್ತರಿಸುವ ಹಂತವನ್ನು ತೆರೆಯಿರಿ.", "Perskaitykite penkis tyrimo klausimus ir atidarykite žingsnį, atsakantį į RQ2."],
      ["Sort the ten models by accuracy, then by size, and compare the two orders.", "ಹತ್ತು ಮಾದರಿಗಳನ್ನು ನಿಖರತೆಯ ಪ್ರಕಾರ, ನಂತರ ಗಾತ್ರದ ಪ್ರಕಾರ ವಿಂಗಡಿಸಿ ಮತ್ತು ಎರಡು ಕ್ರಮಗಳನ್ನು ಹೋಲಿಸಿ.", "Surūšiuokite dešimt modelių pagal tikslumą, tada pagal dydį ir palyginkite abi tvarkas."],
      ["Filter to the recurrent family and write down its accuracy.", "ರಿಕರೆಂಟ್ ಕುಟುಂಬಕ್ಕೆ ಫಿಲ್ಟರ್ ಮಾಡಿ ಮತ್ತು ಅದರ ನಿಖರತೆಯನ್ನು ಬರೆದಿಡಿ.", "Pasirinkite rekurentinę šeimą ir užsirašykite jos tikslumą."],
    ],
    questions: [
      {
        q: ["Which of the ten models was the most accurate on the 872 test sentences?", "872 ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳಲ್ಲಿ ಹತ್ತು ಮಾದರಿಗಳ ಪೈಕಿ ಯಾವುದು ಅತ್ಯಂತ ನಿಖರ?", "Kuris iš dešimties modelių buvo tiksliausias 872 testo sakiniuose?"],
        options: [
          ["Twitter-RoBERTa (off the shelf)", "Twitter-RoBERTa (ಸಿದ್ಧ)", "Twitter-RoBERTa (paruoštas)"],
          ["DistilBERT-SST2 (off the shelf)", "DistilBERT-SST2 (ಸಿದ್ಧ)", "DistilBERT-SST2 (paruoštas)"],
          ["BiLSTM from scratch", "ಮೊದಲಿನಿಂದ BiLSTM", "BiLSTM nuo nulio"],
        ],
        correct: 1,
        why: ["DistilBERT-SST2, already fine-tuned on SST-2 by its authors, reached 91.1 %, the best of all.", "SST-2 ಮೇಲೆ ಅದರ ಲೇಖಕರೇ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT-SST2 91.1 % ತಲುಪಿ ಎಲ್ಲಕ್ಕಿಂತ ಉತ್ತಮವಾಯಿತು.", "DistilBERT-SST2, kurį jo autoriai jau suderino su SST-2, pasiekė 91,1 % – geriausią rezultatą."],
        verify: () => RECORDED.models.reduce((a, b) => (b.acc > a.acc ? b : a)).name.startsWith("DistilBERT-SST2"),
      },
      {
        q: ["Which model was the weakest?", "ಯಾವ ಮಾದರಿ ಅತ್ಯಂತ ದುರ್ಬಲ?", "Kuris modelis buvo silpniausias?"],
        options: [
          ["BERT-tiny fine-tuned (4.4 M parameters)", "BERT-tiny ಫೈನ್-ಟ್ಯೂನ್ (4.4 M ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು)", "BERT-tiny suderintas (4,4 mln. parametrų)"],
          ["TF-IDF + Naive Bayes", "TF-IDF + ನೇವ್ ಬೇಯ್ಸ್", "TF-IDF + naivusis Bajesas"],
          ["Zero-shot NLI DistilRoBERTa", "ಝೀರೋ-ಶಾಟ್ NLI DistilRoBERTa", "NLI DistilRoBERTa be pavyzdžių"],
        ],
        correct: 0,
        why: ["With 76.6 % the smallest Transformer was the weakest: a Transformer is not automatically better, its capacity must be sufficient.", "76.6 % ನೊಂದಿಗೆ ಅತಿ ಚಿಕ್ಕ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಅತ್ಯಂತ ದುರ್ಬಲ: ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ತಾನಾಗಿ ಉತ್ತಮವಲ್ಲ, ಅದರ ಸಾಮರ್ಥ್ಯ ಸಾಕಾಗಬೇಕು.", "Su 76,6 % mažiausias transformeris buvo silpniausias: transformeris savaime negeresnis, jo talpa turi pakakti."],
        verify: () => RECORDED.models.reduce((a, b) => (b.acc < a.acc ? b : a)).name.startsWith("BERT-tiny") && acc("BERT-tiny") < 77,
      },
      {
        q: ["Which research question asks how many labelled sentences are needed?", "ಎಷ್ಟು ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳು ಬೇಕು ಎಂದು ಯಾವ ಸಂಶೋಧನಾ ಪ್ರಶ್ನೆ ಕೇಳುತ್ತದೆ?", "Kuris tyrimo klausimas klausia, kiek pažymėtų sakinių reikia?"],
        options: [["RQ1", "RQ1", "RQ1"], ["RQ3", "RQ3", "RQ3"], ["RQ5", "RQ5", "RQ5"]],
        correct: 1,
        why: ["RQ3 asks how the advantage of a pre-trained Transformer depends on the number of labelled training examples.", "RQ3 ಪೂರ್ವ-ತರಬೇತಿ ಪಡೆದ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ನ ಅನುಕೂಲ ಲೇಬಲ್ ಮಾಡಿದ ಉದಾಹರಣೆಗಳ ಸಂಖ್ಯೆಯನ್ನು ಹೇಗೆ ಅವಲಂಬಿಸುತ್ತದೆ ಎಂದು ಕೇಳುತ್ತದೆ.", "RQ3 klausia, kaip iš anksto išmokyto transformerio pranašumas priklauso nuo pažymėtų mokymo pavyzdžių skaičiaus."],
      },
    ],
    takeaways: [
      ["The paper asks a practical question: what do Transformers buy you on an ordinary CPU-only computer, and at what cost?", "ಪ್ರಬಂಧ ಪ್ರಾಯೋಗಿಕ ಪ್ರಶ್ನೆ ಕೇಳುತ್ತದೆ: ಸಾಮಾನ್ಯ CPU-ಮಾತ್ರ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಏನು ನೀಡುತ್ತವೆ, ಮತ್ತು ಯಾವ ಬೆಲೆಗೆ?", "Straipsnis klausia praktiškai: ką transformeriai duoda paprastame kompiuteryje vien su CPU ir kokia kaina?"],
      ["Ten models from four approaches are compared under equal conditions on the same SST-2 splits.", "ನಾಲ್ಕು ವಿಧಾನಗಳ ಹತ್ತು ಮಾದರಿಗಳನ್ನು ಅದೇ SST-2 ವಿಭಜನೆಗಳಲ್ಲಿ ಸಮಾನ ಪರಿಸ್ಥಿತಿಗಳಲ್ಲಿ ಹೋಲಿಸಲಾಗುತ್ತದೆ.", "Dešimt modelių iš keturių požiūrių lyginami vienodomis sąlygomis tuose pačiuose SST-2 skaidiniuose."],
      ["The biggest model is not the most accurate, and the smallest Transformer is the weakest.", "ಅತಿ ದೊಡ್ಡ ಮಾದರಿ ಅತ್ಯಂತ ನಿಖರವಲ್ಲ, ಮತ್ತು ಅತಿ ಚಿಕ್ಕ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಅತ್ಯಂತ ದುರ್ಬಲ.", "Didžiausias modelis nėra tiksliausias, o mažiausias transformeris – silpniausias."],
    ],
    mistakes: [
      ["Reading the “parameters” of the TF-IDF models as neural-network parameters: they are n-gram weights.", "TF-IDF ಮಾದರಿಗಳ “ಪ್ಯಾರಾಮೀಟರ್‌ಗಳನ್ನು” ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳೆಂದು ಓದುವುದು: ಅವು n-ಗ್ರಾಂ ತೂಕಗಳು.", "TF-IDF modelių „parametrus“ laikyti neuroninio tinklo parametrais: tai n-gramų svoriai."],
    ],
  },

  history: {
    goal: [
      "Place word2vec, attention, ELMo/ULMFiT, the Transformer, BERT and GPT in order, and tell the three Transformer families apart.",
      "word2vec, ಅಟೆನ್ಷನ್, ELMo/ULMFiT, ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್, BERT ಮತ್ತು GPT ಅನ್ನು ಕ್ರಮವಾಗಿ ಇರಿಸಿ ಮತ್ತು ಮೂರು ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಕುಟುಂಬಗಳನ್ನು ಬೇರ್ಪಡಿಸಿ.",
      "Išdėstyti word2vec, dėmesį, ELMo/ULMFiT, transformerį, BERT ir GPT tvarka ir atskirti tris transformerių šeimas.",
    ],
    fit: [
      "All three models the lab fine-tunes are encoders; knowing why tells you what they can and cannot do.",
      "ಈ ಲ್ಯಾಬ್ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡುವ ಮೂರೂ ಮಾದರಿಗಳು ಎನ್‌ಕೋಡರ್‌ಗಳು; ಏಕೆ ಎಂದು ತಿಳಿದರೆ ಅವು ಏನು ಮಾಡಬಲ್ಲವು ಮತ್ತು ಏನು ಮಾಡಲಾರವು ಎಂದು ತಿಳಿಯುತ್ತದೆ.",
      "Visi trys laboratorijos derinami modeliai yra kodavimo modeliai; žinodami kodėl, suprasite, ką jie gali ir ko negali.",
    ],
    keywords: [
      [["Encoder-only", "ಎನ್‌ಕೋಡರ್ ಮಾತ್ರ", "Tik kodavimo"], ["Reads both directions; good for understanding and classification (BERT).", "ಎರಡೂ ದಿಕ್ಕುಗಳಲ್ಲಿ ಓದುತ್ತದೆ; ಗ್ರಹಿಕೆ ಮತ್ತು ವರ್ಗೀಕರಣಕ್ಕೆ ಒಳ್ಳೆಯದು (BERT).", "Skaito abiem kryptimis; tinka supratimui ir klasifikavimui (BERT)."]],
      [["Decoder-only", "ಡಿಕೋಡರ್ ಮಾತ್ರ", "Tik dekodavimo"], ["Predicts the next token from the left context (GPT).", "ಎಡ ಸಂದರ್ಭದಿಂದ ಮುಂದಿನ ಟೋಕನ್ ಊಹಿಸುತ್ತದೆ (GPT).", "Nuspėja kitą leksemą pagal kairįjį kontekstą (GPT)."]],
      [["Distillation", "ಡಿಸ್ಟಿಲೇಶನ್", "Distiliavimas"], ["A small student learns from a large teacher (DistilBERT).", "ಸಣ್ಣ ವಿದ್ಯಾರ್ಥಿ ದೊಡ್ಡ ಶಿಕ್ಷಕನಿಂದ ಕಲಿಯುತ್ತದೆ (DistilBERT).", "Mažas mokinys mokosi iš didelio mokytojo (DistilBERT)."]],
    ],
    tasks: [
      ["Click through the timeline from word2vec to GPT-3 and say what each step fixed.", "word2vec ನಿಂದ GPT-3 ವರೆಗೆ ಟೈಮ್‌ಲೈನ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು ಪ್ರತಿ ಹಂತ ಏನನ್ನು ಸರಿಪಡಿಸಿತು ಎಂದು ಹೇಳಿ.", "Peržiūrėkite laiko juostą nuo word2vec iki GPT-3 ir pasakykite, ką ištaisė kiekvienas žingsnis."],
      ["Compare the three attention masks and count the allowed cells in each.", "ಮೂರು ಅಟೆನ್ಷನ್ ಮಾಸ್ಕ್‌ಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಪ್ರತಿಯೊಂದರಲ್ಲಿ ಅನುಮತಿಸಿದ ಕೋಶಗಳನ್ನು ಎಣಿಸಿ.", "Palyginkite tris dėmesio kaukes ir suskaičiuokite leidžiamus langelius kiekvienoje."],
      ["In the decoder-only view, pick a prompt and read the top next-word probability.", "ಡಿಕೋಡರ್-ಮಾತ್ರ ನೋಟದಲ್ಲಿ ಒಂದು ಪ್ರಾಂಪ್ಟ್ ಆರಿಸಿ ಮತ್ತು ಅತಿ ಹೆಚ್ಚಿನ ಮುಂದಿನ-ಪದ ಸಂಭವನೀಯತೆ ಓದಿ.", "Dekodavimo skiltyje pasirinkite užklausą ir perskaitykite didžiausią kito žodžio tikimybę."],
      ["Read the size chart and say how many times larger GPT-3 is than DistilBERT.", "ಗಾತ್ರ ಚಾರ್ಟ್ ಓದಿ ಮತ್ತು GPT-3 DistilBERT ಗಿಂತ ಎಷ್ಟು ಪಟ್ಟು ದೊಡ್ಡದು ಎಂದು ಹೇಳಿ.", "Perskaitykite dydžių diagramą ir pasakykite, kiek kartų GPT-3 didesnis už DistilBERT."],
    ],
    questions: [
      {
        q: ["DistilBERT is 40 % smaller than BERT-base (110 million parameters). Roughly how many parameters is that, and does it match the counted 66 955 010?", "DistilBERT BERT-base ಗಿಂತ (110 ದಶಲಕ್ಷ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು) 40 % ಚಿಕ್ಕದು. ಇದು ಸುಮಾರು ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು, ಮತ್ತು ಎಣಿಸಿದ 66 955 010 ಕ್ಕೆ ಹೊಂದುತ್ತದೆಯೇ?", "DistilBERT yra 40 % mažesnis už BERT-base (110 mln. parametrų). Maždaug kiek tai parametrų ir ar tai atitinka suskaičiuotą 66 955 010?"],
        options: [
          ["About 44 million; no match", "ಸುಮಾರು 44 ದಶಲಕ್ಷ; ಹೊಂದುವುದಿಲ್ಲ", "Apie 44 mln.; neatitinka"],
          ["About 66 million; it matches", "ಸುಮಾರು 66 ದಶಲಕ್ಷ; ಹೊಂದುತ್ತದೆ", "Apie 66 mln.; atitinka"],
          ["About 110 million; the same", "ಸುಮಾರು 110 ದಶಲಕ್ಷ; ಅದೇ", "Apie 110 mln.; tas pats"],
        ],
        correct: 1,
        why: ["110 million × 0.6 = 66 million, close to the exact 66 955 010 of the counter.", "110 ದಶಲಕ್ಷ × 0.6 = 66 ದಶಲಕ್ಷ, ಕೌಂಟರ್‌ನ ನಿಖರ 66 955 010 ಕ್ಕೆ ಹತ್ತಿರ.", "110 mln. × 0,6 = 66 mln., artima tikslaus skaičiuoklės 66 955 010."],
        verify: () => Math.abs(0.6 * 110e6 - 66955010) / 66955010 < 0.02,
      },
      {
        q: ["With a causal (decoder-only) mask over 6 tokens, how many (query, key) pairs may attend?", "6 ಟೋಕನ್‌ಗಳ ಮೇಲೆ ಕಾರ್ಯಕಾರಣ (ಡಿಕೋಡರ್-ಮಾತ್ರ) ಮಾಸ್ಕ್‌ನೊಂದಿಗೆ ಎಷ್ಟು (ಕ್ವೆರಿ, ಕೀ) ಜೋಡಿಗಳು ನೋಡಬಹುದು?", "Su priežastine (tik dekodavimo) kauke 6 leksemoms, kiek (užklausos, rakto) porų gali žiūrėti?"],
        options: [["36", "36", "36"], ["21", "21", "21"], ["15", "15", "15"]],
        correct: 1,
        why: ["Token i may look at tokens 1 … i, so the allowed cells are 1+2+3+4+5+6 = 21, against 36 for an encoder.", "ಟೋಕನ್ i ಟೋಕನ್ 1 … i ಅನ್ನು ನೋಡಬಹುದು, ಆದ್ದರಿಂದ ಅನುಮತಿಸಿದ ಕೋಶಗಳು 1+2+3+4+5+6 = 21, ಎನ್‌ಕೋಡರ್‌ಗೆ 36.", "Leksema i gali žiūrėti į leksemas 1 … i, todėl leidžiamų langelių 1+2+3+4+5+6 = 21, o kodavimo modeliui – 36."],
        verify: () => { let c = 0; for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) if (j <= i) c++; return c === 21; },
      },
      {
        q: ["Which family do BERT-tiny, BERT-small and DistilBERT belong to?", "BERT-tiny, BERT-small ಮತ್ತು DistilBERT ಯಾವ ಕುಟುಂಬಕ್ಕೆ ಸೇರಿವೆ?", "Kuriai šeimai priklauso BERT-tiny, BERT-small ir DistilBERT?"],
        options: [["Decoder-only", "ಡಿಕೋಡರ್ ಮಾತ್ರ", "Tik dekodavimo"], ["Encoder–decoder", "ಎನ್‌ಕೋಡರ್–ಡಿಕೋಡರ್", "Kodavimo ir dekodavimo"], ["Encoder-only", "ಎನ್‌ಕೋಡರ್ ಮಾತ್ರ", "Tik kodavimo"]],
        correct: 2,
        why: ["They are BERT-type encoders pre-trained with masked language modelling.", "ಅವು ಮಾಸ್ಕ್ಡ್ ಭಾಷಾ ಮಾದರಿಯಿಂದ ಪೂರ್ವ-ತರಬೇತಿ ಪಡೆದ BERT-ಮಾದರಿಯ ಎನ್‌ಕೋಡರ್‌ಗಳು.", "Tai BERT tipo kodavimo modeliai, iš anksto mokyti maskuotu kalbos modeliavimu."],
      },
    ],
    takeaways: [
      ["Static vectors, then attention, then contextual pre-trained models, then the Transformer: each step fixed a weakness of the previous one.", "ಸ್ಥಿರ ವೆಕ್ಟರ್‌ಗಳು, ನಂತರ ಅಟೆನ್ಷನ್, ನಂತರ ಸಂದರ್ಭಾಧಾರಿತ ಪೂರ್ವ-ತರಬೇತಿ ಮಾದರಿಗಳು, ನಂತರ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್: ಪ್ರತಿ ಹಂತ ಹಿಂದಿನ ದೌರ್ಬಲ್ಯ ಸರಿಪಡಿಸಿತು.", "Statiniai vektoriai, tada dėmesys, tada kontekstiniai iš anksto išmokyti modeliai, tada transformeris: kiekvienas žingsnis ištaisė ankstesnio silpnybę."],
      ["Encoder-only models read both ways and suit classification; decoder-only models generate text left to right.", "ಎನ್‌ಕೋಡರ್-ಮಾತ್ರ ಮಾದರಿಗಳು ಎರಡೂ ದಿಕ್ಕು ಓದುತ್ತವೆ ಮತ್ತು ವರ್ಗೀಕರಣಕ್ಕೆ ಹೊಂದುತ್ತವೆ; ಡಿಕೋಡರ್-ಮಾತ್ರ ಮಾದರಿಗಳು ಎಡದಿಂದ ಬಲಕ್ಕೆ ಪಠ್ಯ ಸೃಷ್ಟಿಸುತ್ತವೆ.", "Tik kodavimo modeliai skaito abiem kryptimis ir tinka klasifikavimui; tik dekodavimo modeliai generuoja tekstą iš kairės į dešinę."],
      ["DistilBERT: 40 % smaller, 60 % faster, about 97 % of BERT's quality; GPT-3 is thousands of times larger.", "DistilBERT: 40 % ಚಿಕ್ಕದು, 60 % ವೇಗ, BERT ಗುಣಮಟ್ಟದ ಸುಮಾರು 97 %; GPT-3 ಸಾವಿರಾರು ಪಟ್ಟು ದೊಡ್ಡದು.", "DistilBERT: 40 % mažesnis, 60 % greitesnis, apie 97 % BERT kokybės; GPT-3 tūkstančius kartų didesnis."],
    ],
    mistakes: [
      ["Thinking BERT generates text like GPT: an encoder has no left-to-right prediction of the next word.", "BERT GPT ಯಂತೆ ಪಠ್ಯ ಸೃಷ್ಟಿಸುತ್ತದೆ ಎಂದು ಭಾವಿಸುವುದು: ಎನ್‌ಕೋಡರ್ ಮುಂದಿನ ಪದದ ಎಡದಿಂದ ಬಲದ ಊಹೆ ಮಾಡುವುದಿಲ್ಲ.", "Manyti, kad BERT generuoja tekstą kaip GPT: kodavimo modelis nenuspėja kito žodžio iš kairės į dešinę."],
    ],
  },

  tokens: {
    goal: [
      "Explain how text becomes WordPiece tokens and then vectors, and where most parameters of a small model sit.",
      "ಪಠ್ಯ ಹೇಗೆ WordPiece ಟೋಕನ್‌ಗಳಾಗಿ, ನಂತರ ವೆಕ್ಟರ್‌ಗಳಾಗುತ್ತದೆ ಮತ್ತು ಸಣ್ಣ ಮಾದರಿಯ ಹೆಚ್ಚಿನ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಎಲ್ಲಿವೆ ಎಂದು ವಿವರಿಸಿ.",
      "Paaiškinti, kaip tekstas tampa WordPiece leksemomis, o paskui vektoriais, ir kur slypi dauguma mažo modelio parametrų.",
    ],
    fit: [
      "Every sentence the experiment feeds to BERT-tiny, BERT-small or DistilBERT passes through exactly this step first.",
      "ಪ್ರಯೋಗ BERT-tiny, BERT-small ಅಥವಾ DistilBERT ಗೆ ನೀಡುವ ಪ್ರತಿ ವಾಕ್ಯವೂ ಮೊದಲು ಇದೇ ಹಂತದ ಮೂಲಕ ಹೋಗುತ್ತದೆ.",
      "Kiekvienas sakinys, kurį eksperimentas paduoda BERT-tiny, BERT-small ar DistilBERT, pirmiausia praeina būtent šį žingsnį.",
    ],
    keywords: [
      [["WordPiece", "WordPiece", "WordPiece"], ["Sub-word vocabulary: frequent words whole, rare words in pieces.", "ಉಪ-ಪದ ಶಬ್ದಕೋಶ: ಸಾಮಾನ್ಯ ಪದ ಪೂರ್ಣ, ಅಪರೂಪದ ಪದ ತುಣುಕುಗಳಲ್ಲಿ.", "Žodžių dalių žodynas: dažni žodžiai sveiki, reti – dalimis."]],
      [["[CLS], [SEP]", "[CLS], [SEP]", "[CLS], [SEP]"], ["Special tokens at the start and the end of the input.", "ಇನ್‌ಪುಟ್‌ನ ಆರಂಭ ಮತ್ತು ಕೊನೆಯಲ್ಲಿನ ವಿಶೇಷ ಟೋಕನ್‌ಗಳು.", "Specialios leksemos įvesties pradžioje ir pabaigoje."]],
      [["Embedding", "ಎಂಬೆಡ್ಡಿಂಗ್", "Įterpinys"], ["The row of table E that a token id selects: a vector of d numbers.", "ಟೋಕನ್ id ಆರಿಸುವ ಕೋಷ್ಟಕ E ಯ ಸಾಲು: d ಸಂಖ್ಯೆಗಳ ವೆಕ್ಟರ್.", "Lentelės E eilutė, kurią parenka leksemos id: d skaičių vektorius."]],
    ],
    tasks: [
      ["Click “unwatchable” and count its pieces.", "“unwatchable” ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು ಅದರ ತುಣುಕುಗಳನ್ನು ಎಣಿಸಿ.", "Spustelėkite „unwatchable“ ir suskaičiuokite jo dalis."],
      ["Type a sentence into the toy WordPiece and find a word it cannot split.", "ಆಟಿಕೆ WordPiece ಗೆ ವಾಕ್ಯ ಟೈಪ್ ಮಾಡಿ ಮತ್ತು ಅದು ವಿಭಜಿಸಲಾಗದ ಪದ ಕಂಡುಹಿಡಿಯಿರಿ.", "Įveskite sakinį į žaislinį WordPiece ir raskite žodį, kurio jis nesugeba suskaidyti."],
      ["Redraw the random embedding table and check that equal tokens share a row.", "ಯಾದೃಚ್ಛಿಕ ಎಂಬೆಡ್ಡಿಂಗ್ ಕೋಷ್ಟಕವನ್ನು ಮತ್ತೆ ಎಳೆಯಿರಿ ಮತ್ತು ಒಂದೇ ಟೋಕನ್‌ಗಳು ಒಂದೇ ಸಾಲನ್ನು ಹಂಚಿಕೊಳ್ಳುತ್ತವೆ ಎಂದು ಪರಿಶೀಲಿಸಿ.", "Iš naujo ištraukite atsitiktinę įterpinių lentelę ir patikrinkite, ar vienodos leksemos turi tą pačią eilutę."],
    ],
    questions: [
      {
        q: ["How does the DistilBERT tokeniser split “unwatchable”?", "DistilBERT ಟೋಕನೈಸರ್ “unwatchable” ಅನ್ನು ಹೇಗೆ ವಿಭಜಿಸುತ್ತದೆ?", "Kaip DistilBERT skaidyklė suskaido „unwatchable“?"],
        options: [["un + ##watch + ##able", "un + ##watch + ##able", "un + ##watch + ##able"], ["unwatch + able", "unwatch + able", "unwatch + able"], ["It stays one token", "ಒಂದೇ ಟೋಕನ್ ಆಗಿ ಉಳಿಯುತ್ತದೆ", "Lieka viena leksema"]],
        correct: 0,
        why: ["The recorded run gives un, ##watch, ##able: three pieces, the ## marking a continuation.", "ದಾಖಲಿಸಿದ ರನ್ un, ##watch, ##able ನೀಡುತ್ತದೆ: ಮೂರು ತುಣುಕುಗಳು, ## ಮುಂದುವರಿಕೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆ.", "Užfiksuotas paleidimas duoda un, ##watch, ##able: tris dalis, o ## žymi tęsinį."],
        verify: () => RECORDED.tokenisation[0].pieces.join("+") === "un+##watch+##able",
      },
      {
        q: ["What share of BERT-tiny's 4 386 178 parameters is the word-embedding table (30 522 × 128)?", "BERT-tiny ಯ 4 386 178 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಲ್ಲಿ ಪದ-ಎಂಬೆಡ್ಡಿಂಗ್ ಕೋಷ್ಟಕ (30 522 × 128) ಎಷ್ಟು ಪಾಲು?", "Kokią dalį BERT-tiny 4 386 178 parametrų sudaro žodžių įterpinių lentelė (30 522 × 128)?"],
        options: [["About 11 %", "ಸುಮಾರು 11 %", "Apie 11 %"], ["About 50 %", "ಸುಮಾರು 50 %", "Apie 50 %"], ["About 89 %", "ಸುಮಾರು 89 %", "Apie 89 %"]],
        correct: 2,
        why: ["30 522 × 128 = 3 906 816, which is 89 % of the total.", "30 522 × 128 = 3 906 816, ಇದು ಒಟ್ಟಿನ 89 %.", "30 522 × 128 = 3 906 816, tai 89 % visos sumos."],
        verify: () => Math.round((paramBreakdown(BERT_TINY)[0].count / paramTotal(BERT_TINY)) * 100) === 89,
      },
      {
        q: ["What does the prefix ## mean?", "## ಪೂರ್ವಪ್ರತ್ಯಯ ಏನು ಸೂಚಿಸುತ್ತದೆ?", "Ką reiškia priešdėlis ##?"],
        options: [["The piece is a special token", "ತುಣುಕು ವಿಶೇಷ ಟೋಕನ್", "Dalis yra speciali leksema"], ["The piece continues the previous piece of the same word", "ತುಣುಕು ಅದೇ ಪದದ ಹಿಂದಿನ ತುಣುಕಿನ ಮುಂದುವರಿಕೆ", "Dalis tęsia ankstesnę to paties žodžio dalį"], ["The word is unknown", "ಪದ ಅಜ್ಞಾತ", "Žodis nežinomas"]],
        correct: 1,
        why: ["## marks a piece that is not at the start of a word.", "## ಪದದ ಆರಂಭದಲ್ಲಿ ಇಲ್ಲದ ತುಣುಕನ್ನು ಗುರುತಿಸುತ್ತದೆ.", "## žymi dalį, kuri nėra žodžio pradžioje."],
      },
    ],
    takeaways: [
      ["Sub-word tokens keep the vocabulary near 30 000 and make out-of-vocabulary words disappear.", "ಉಪ-ಪದ ಟೋಕನ್‌ಗಳು ಶಬ್ದಕೋಶವನ್ನು ಸುಮಾರು 30 000 ರಲ್ಲಿ ಇಡುತ್ತವೆ ಮತ್ತು ಶಬ್ದಕೋಶದ ಹೊರಗಿನ ಪದಗಳನ್ನು ಇಲ್ಲವಾಗಿಸುತ್ತವೆ.", "Žodžių dalių leksemos išlaiko žodyną apie 30 000 ir pašalina žodžius už žodyno ribų."],
      ["[CLS] starts and [SEP] ends every input; the final [CLS] vector later represents the whole sentence.", "[CLS] ಪ್ರತಿ ಇನ್‌ಪುಟ್ ಅನ್ನು ಪ್ರಾರಂಭಿಸುತ್ತದೆ ಮತ್ತು [SEP] ಮುಗಿಸುತ್ತದೆ; ಅಂತಿಮ [CLS] ವೆಕ್ಟರ್ ನಂತರ ಇಡೀ ವಾಕ್ಯವನ್ನು ಪ್ರತಿನಿಧಿಸುತ್ತದೆ.", "[CLS] pradeda, o [SEP] baigia kiekvieną įvestį; galutinis [CLS] vektorius vėliau atspindi visą sakinį."],
      ["The embedding table is a learned V × d matrix, and in small models it holds most of the parameters.", "ಎಂಬೆಡ್ಡಿಂಗ್ ಕೋಷ್ಟಕ ಕಲಿತ V × d ಮ್ಯಾಟ್ರಿಕ್ಸ್, ಮತ್ತು ಸಣ್ಣ ಮಾದರಿಗಳಲ್ಲಿ ಹೆಚ್ಚಿನ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಅದರಲ್ಲಿವೆ.", "Įterpinių lentelė yra išmokta V × d matrica, o mažuose modeliuose joje slypi dauguma parametrų."],
    ],
    mistakes: [
      ["Assuming the toy WordPiece splits are what DistilBERT does: the toy vocabulary is tiny and hand-made.", "ಆಟಿಕೆ WordPiece ವಿಭಜನೆಗಳೇ DistilBERT ಮಾಡುವುದು ಎಂದು ಭಾವಿಸುವುದು: ಆಟಿಕೆ ಶಬ್ದಕೋಶ ಚಿಕ್ಕದು ಮತ್ತು ಕೈಯಿಂದ ಮಾಡಿದ್ದು.", "Manyti, kad žaislinio WordPiece skaidymai yra tai, ką daro DistilBERT: žaislinis žodynas mažas ir sudarytas ranka."],
      ["Believing the same word always gets the same final vector: only its embedding row is the same; context changes it later.", "ಒಂದೇ ಪದಕ್ಕೆ ಯಾವಾಗಲೂ ಒಂದೇ ಅಂತಿಮ ವೆಕ್ಟರ್ ಸಿಗುತ್ತದೆ ಎಂದು ನಂಬುವುದು: ಅದರ ಎಂಬೆಡ್ಡಿಂಗ್ ಸಾಲು ಮಾತ್ರ ಒಂದೇ; ಸಂದರ್ಭ ನಂತರ ಅದನ್ನು ಬದಲಿಸುತ್ತದೆ.", "Tikėti, kad tas pats žodis visada gauna tą patį galutinį vektorių: tik jo įterpinio eilutė ta pati; kontekstas vėliau ją keičia."],
    ],
  },

  position: {
    goal: [
      "Explain why attention needs positions and compute the sinusoidal encoding by hand for a given position and dimension.",
      "ಅಟೆನ್ಷನ್‌ಗೆ ಸ್ಥಾನಗಳು ಏಕೆ ಬೇಕು ಎಂದು ವಿವರಿಸಿ ಮತ್ತು ನೀಡಿದ ಸ್ಥಾನ ಮತ್ತು ಆಯಾಮಕ್ಕೆ ಸೈನುಸಾಯ್ಡಲ್ ಎನ್‌ಕೋಡಿಂಗ್ ಅನ್ನು ಕೈಯಿಂದ ಲೆಕ್ಕಹಾಕಿ.",
      "Paaiškinti, kodėl dėmesiui reikia pozicijų, ir ranka apskaičiuoti sinusoidinį kodą duotai pozicijai ir matmeniui.",
    ],
    fit: [
      "Without positions “not good” and “good not” would look identical to the model, which would break negation handling.",
      "ಸ್ಥಾನಗಳಿಲ್ಲದೆ “not good” ಮತ್ತು “good not” ಮಾದರಿಗೆ ಒಂದೇ ರೀತಿ ಕಾಣುತ್ತವೆ, ಇದು ನಿರಾಕರಣೆ ನಿಭಾಯಿಸುವಿಕೆಯನ್ನು ಹಾಳುಮಾಡುತ್ತದೆ.",
      "Be pozicijų „not good“ ir „good not“ modeliui atrodytų vienodai, ir tai sugadintų neigimo apdorojimą.",
    ],
    keywords: [
      [["Positional encoding", "ಸ್ಥಾನ ಎನ್‌ಕೋಡಿಂಗ್", "Pozicinis kodavimas"], ["A position-dependent vector added to the token embedding.", "ಟೋಕನ್ ಎಂಬೆಡ್ಡಿಂಗ್‌ಗೆ ಸೇರಿಸುವ ಸ್ಥಾನ-ಅವಲಂಬಿತ ವೆಕ್ಟರ್.", "Nuo pozicijos priklausantis vektorius, pridedamas prie leksemos įterpinio."]],
      [["Sinusoid", "ಸೈನುಸಾಯ್ಡ್", "Sinusoidė"], ["sin and cos waves of different wavelengths, one pair per two dimensions.", "ವಿಭಿನ್ನ ತರಂಗಾಂತರಗಳ sin ಮತ್ತು cos ಅಲೆಗಳು, ಎರಡು ಆಯಾಮಗಳಿಗೆ ಒಂದು ಜೋಡಿ.", "Skirtingų ilgių sin ir cos bangos, viena pora dviem matmenims."]],
      [["Learned positions", "ಕಲಿತ ಸ್ಥಾನಗಳು", "Išmoktos pozicijos"], ["BERT's table of 512 trainable position vectors.", "BERT ನ 512 ತರಬೇತಿಗೊಳ್ಳುವ ಸ್ಥಾನ ವೆಕ್ಟರ್‌ಗಳ ಕೋಷ್ಟಕ.", "BERT 512 mokomų pozicijos vektorių lentelė."]],
    ],
    tasks: [
      ["Run the order test and note the difference with and without positions.", "ಕ್ರಮ ಪರೀಕ್ಷೆ ನಡೆಸಿ ಮತ್ತು ಸ್ಥಾನಗಳೊಂದಿಗೆ ಹಾಗೂ ಇಲ್ಲದೆ ವ್ಯತ್ಯಾಸ ಗಮನಿಸಿ.", "Atlikite tvarkos bandymą ir pastebėkite skirtumą su pozicijomis ir be jų."],
      ["Set position 5 and dimension 6 and read the value of PE(5, 6).", "ಸ್ಥಾನ 5 ಮತ್ತು ಆಯಾಮ 6 ಹೊಂದಿಸಿ ಮತ್ತು PE(5, 6) ಮೌಲ್ಯ ಓದಿ.", "Nustatykite poziciją 5 ir matmenį 6 ir perskaitykite PE(5, 6) reikšmę."],
      ["Raise d and watch the wavelength of the highest dimensions grow.", "d ಹೆಚ್ಚಿಸಿ ಮತ್ತು ಅತಿ ಹೆಚ್ಚಿನ ಆಯಾಮಗಳ ತರಂಗಾಂತರ ಬೆಳೆಯುವುದನ್ನು ನೋಡಿ.", "Didinkite d ir stebėkite, kaip auga aukščiausių matmenų bangos ilgis."],
    ],
    questions: [
      {
        q: ["What are the sinusoidal values at position 0 for the first pair of dimensions?", "ಮೊದಲ ಆಯಾಮ ಜೋಡಿಗೆ ಸ್ಥಾನ 0 ಯಲ್ಲಿ ಸೈನುಸಾಯ್ಡಲ್ ಮೌಲ್ಯಗಳು ಯಾವುವು?", "Kokios sinusoidinės reikšmės yra 0 pozicijoje pirmai matmenų porai?"],
        options: [["sin 0 = 0 and cos 0 = 1", "sin 0 = 0 ಮತ್ತು cos 0 = 1", "sin 0 = 0 ir cos 0 = 1"], ["both 0", "ಎರಡೂ 0", "abi 0"], ["both 1", "ಎರಡೂ 1", "abi 1"]],
        correct: 0,
        why: ["PE(0, 0) = sin(0) = 0 and PE(0, 1) = cos(0) = 1, in every pair.", "PE(0, 0) = sin(0) = 0 ಮತ್ತು PE(0, 1) = cos(0) = 1, ಪ್ರತಿ ಜೋಡಿಯಲ್ಲಿ.", "PE(0, 0) = sin(0) = 0 ir PE(0, 1) = cos(0) = 1, kiekvienoje poroje."],
        verify: () => { const r = sinusoidalPE(1, 2)[0]; return r[0] === 0 && r[1] === 1; },
      },
      {
        q: ["How many extra parameters do BERT-style learned positions add for d = 768 (512 positions)?", "d = 768 (512 ಸ್ಥಾನಗಳು) ಗೆ BERT-ಶೈಲಿಯ ಕಲಿತ ಸ್ಥಾನಗಳು ಎಷ್ಟು ಹೆಚ್ಚುವರಿ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳನ್ನು ಸೇರಿಸುತ್ತವೆ?", "Kiek papildomų parametrų prideda BERT tipo išmoktos pozicijos, kai d = 768 (512 pozicijų)?"],
        options: [["0", "0", "0"], ["393 216", "393 216", "393 216"], ["30 522", "30 522", "30 522"]],
        correct: 1,
        why: ["512 × 768 = 393 216; the sinusoidal formula needs none.", "512 × 768 = 393 216; ಸೈನುಸಾಯ್ಡಲ್ ಸೂತ್ರಕ್ಕೆ ಯಾವುದೂ ಬೇಡ.", "512 × 768 = 393 216; sinusoidinei formulei nereikia nė vieno."],
        verify: () => 512 * 768 === 393216,
      },
      {
        q: ["Why is a positional encoding added at all?", "ಸ್ಥಾನ ಎನ್‌ಕೋಡಿಂಗ್ ಅನ್ನು ಏಕೆ ಸೇರಿಸಲಾಗುತ್ತದೆ?", "Kodėl apskritai pridedamas pozicinis kodavimas?"],
        options: [["Self-attention alone cannot tell the order of the tokens", "ಸ್ವ-ಅಟೆನ್ಷನ್ ಮಾತ್ರ ಟೋಕನ್‌ಗಳ ಕ್ರಮವನ್ನು ಹೇಳಲಾರದು", "Vien savęs stebintis dėmesys negali nustatyti leksemų tvarkos"], ["To make the vectors longer", "ವೆಕ್ಟರ್‌ಗಳನ್ನು ಉದ್ದ ಮಾಡಲು", "Kad vektoriai būtų ilgesni"], ["To remove the [CLS] token", "[CLS] ಟೋಕನ್ ತೆಗೆಯಲು", "Kad būtų pašalinta [CLS] leksema"]],
        correct: 0,
        why: ["Attention treats the input as a bag of tokens, so order must be injected.", "ಅಟೆನ್ಷನ್ ಇನ್‌ಪುಟ್ ಅನ್ನು ಟೋಕನ್‌ಗಳ ಚೀಲದಂತೆ ಕಾಣುತ್ತದೆ, ಆದ್ದರಿಂದ ಕ್ರಮವನ್ನು ಸೇರಿಸಬೇಕು.", "Dėmesys įvestį traktuoja kaip leksemų maišą, todėl tvarką reikia įterpti."],
      },
    ],
    takeaways: [
      ["Self-attention is blind to order: the same words in another order give the same outputs, just permuted.", "ಸ್ವ-ಅಟೆನ್ಷನ್ ಕ್ರಮಕ್ಕೆ ಕುರುಡು: ಬೇರೆ ಕ್ರಮದಲ್ಲಿ ಅದೇ ಪದಗಳು ಅದೇ ಔಟ್‌ಪುಟ್‌ಗಳನ್ನು ನೀಡುತ್ತವೆ, ಕೇವಲ ಪಲ್ಲಟಗೊಂಡಿರುತ್ತವೆ.", "Savęs stebintis dėmesys akliai tvarkai: tie patys žodžiai kita tvarka duoda tas pačias išvestis, tik sukeistas."],
      ["The sinusoidal encoding uses waves of many wavelengths, like digits of a number, and needs no parameters.", "ಸೈನುಸಾಯ್ಡಲ್ ಎನ್‌ಕೋಡಿಂಗ್ ಸಂಖ್ಯೆಯ ಅಂಕಿಗಳಂತೆ ಹಲವು ತರಂಗಾಂತರಗಳ ಅಲೆಗಳನ್ನು ಬಳಸುತ್ತದೆ ಮತ್ತು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಬೇಡ.", "Sinusoidinis kodavimas naudoja daugelio ilgių bangas, kaip skaičiaus skaitmenis, ir parametrų nereikalauja."],
      ["BERT-type models learn one position vector per position up to 512 instead.", "BERT ಮಾದರಿಗಳು ಬದಲಿಗೆ 512 ವರೆಗಿನ ಪ್ರತಿ ಸ್ಥಾನಕ್ಕೆ ಒಂದು ಸ್ಥಾನ ವೆಕ್ಟರ್ ಕಲಿಯುತ್ತವೆ.", "BERT tipo modeliai vietoj to išmoksta po vieną pozicijos vektorių kiekvienai pozicijai iki 512."],
    ],
    mistakes: [
      ["Concatenating instead of adding: the position vector is added to the token embedding, so the size stays d.", "ಸೇರಿಸುವ ಬದಲು ಜೋಡಿಸುವುದು: ಸ್ಥಾನ ವೆಕ್ಟರ್ ಅನ್ನು ಟೋಕನ್ ಎಂಬೆಡ್ಡಿಂಗ್‌ಗೆ ಕೂಡಿಸಲಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ಗಾತ್ರ d ಆಗಿಯೇ ಉಳಿಯುತ್ತದೆ.", "Jungti vietoj sudėties: pozicijos vektorius pridedamas prie leksemos įterpinio, todėl dydis lieka d."],
    ],
  },
};
