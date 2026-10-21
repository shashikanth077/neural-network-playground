import { CODE_FILES } from "../data/expCode";
import { LR_TOP_NEG, LR_TOP_POS } from "../data/expLrTop";
import { CURVE, DATASET, MODELS, PAIRS, SUBSETS, SUBSET_SIZES } from "../data/expModels";
import { byTag, curveAt, memoryMB, recommend, secondsFor, softmax, type DecideInput } from "../expMath";
import type { GuideDef } from "./types";

const pair = (a: string, b: string) => PAIRS.find((p) => p.a === a && p.b === b)!;
const top = (list: { t: string; w: number }[], t: string) => list.find((x) => x.t === t)!.w;
const base: DecideInput = { publicInDomain: false, publicRelated: false, labels: 8000, maxLatencyMs: 200, maxTrainMinutes: 180, english: true };

/**
 * Step guides of the experiment steps (baselines ... defense). Quiz answers marked with verify() are proven against the
 * recorded data (small modules only: no per-sentence predictions are imported here, see PAIRS and SUBSET_SIZES).
 * The Kannada and Lithuanian texts have not been reviewed by a native speaker.
 */
export const guidesB: Record<string, GuideDef> = {
  baselines: {
    goal: [
      "Run the paper's real TF-IDF + logistic regression on your own sentence, see why “not good” fools a model that counts words, and recall the BiLSTM baseline.",
      "ಪ್ರಬಂಧದ ನಿಜವಾದ TF-IDF + ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್ ಅನ್ನು ನಿಮ್ಮದೇ ವಾಕ್ಯದ ಮೇಲೆ ಚಲಾಯಿಸಿ, ಪದಗಳನ್ನು ಎಣಿಸುವ ಮಾದರಿಯನ್ನು “not good” ಏಕೆ ಮೋಸಗೊಳಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ, ಮತ್ತು BiLSTM ಮೂಲ ಮಾದರಿಯನ್ನು ನೆನಪಿಸಿಕೊಳ್ಳಿ.",
      "Paleiskite tikrąją straipsnio TF-IDF + logistinę regresiją su savo sakiniu, pamatykite, kodėl „not good“ apgauna žodžius skaičiuojantį modelį, ir prisiminkite BiLSTM bazinį modelį.",
    ],
    fit: [
      "These cheap models set the bar the Transformers must beat. If you cannot say what they see in a sentence, you cannot say what a Transformer adds.",
      "ಈ ಅಗ್ಗದ ಮಾದರಿಗಳು ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ದಾಟಬೇಕಾದ ಮಟ್ಟವನ್ನು ನಿಗದಿಪಡಿಸುತ್ತವೆ. ಅವು ವಾಕ್ಯದಲ್ಲಿ ಏನು ನೋಡುತ್ತವೆ ಎಂದು ಹೇಳಲಾಗದಿದ್ದರೆ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಏನು ಸೇರಿಸುತ್ತದೆ ಎಂದು ಹೇಳಲಾಗದು.",
      "Šie pigūs modeliai nustato kartelę, kurią turi įveikti transformeriai. Jei negalite pasakyti, ką jie mato sakinyje, negalite pasakyti ir to, ką prideda transformeris.",
    ],
    keywords: [
      [["TF-IDF", "TF-IDF", "TF-IDF"], ["A word's weight: frequent in the sentence, rare in the collection.", "ಪದದ ತೂಕ: ವಾಕ್ಯದಲ್ಲಿ ಆಗಾಗ, ಸಂಗ್ರಹದಲ್ಲಿ ಅಪರೂಪ.", "Žodžio svoris: dažnas sakinyje, retas rinkinyje."]],
      [["n-gram", "n-ಗ್ರಾಮ್", "n-grama"], ["A word or a pair of neighbouring words used as a feature.", "ಒಂದು ಪದ ಅಥವಾ ಪಕ್ಕದ ಪದಗಳ ಜೋಡಿ, ಲಕ್ಷಣವಾಗಿ ಬಳಕೆ.", "Žodis arba gretimų žodžių pora, naudojama kaip požymis."]],
      [["Logistic regression", "ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್", "Logistinė regresija"], ["A sigmoid of a weighted sum of the features.", "ಲಕ್ಷಣಗಳ ತೂಕದ ಮೊತ್ತದ ಸಿಗ್ಮಾಯ್ಡ್.", "Svertinės požymių sumos sigmoidė."]],
      [["Naive Bayes", "ನೈವ್ ಬೇಯ್ಸ್", "Naivusis Bajesas"], ["Adds the log-probability of each word given the class.", "ವರ್ಗ ನೀಡಿದಾಗ ಪ್ರತಿ ಪದದ ಲಾಗ್-ಸಂಭಾವ್ಯತೆಯನ್ನು ಕೂಡಿಸುತ್ತದೆ.", "Sumuoja kiekvieno žodžio logaritmuotą tikimybę, žinant klasę."]],
      [["BiLSTM", "BiLSTM", "BiLSTM"], ["Reads the sentence in both directions, no pre-training.", "ವಾಕ್ಯವನ್ನು ಎರಡೂ ದಿಕ್ಕಿನಲ್ಲಿ ಓದುತ್ತದೆ, ಪೂರ್ವ-ತರಬೇತಿ ಇಲ್ಲ.", "Skaito sakinį į abi puses, be išankstinio mokymo."]],
    ],
    tasks: [
      ["Type “not good”, then “good”, and compare P(positive).", "“not good” ಟೈಪ್ ಮಾಡಿ, ನಂತರ “good”, ಮತ್ತು P(ಧನಾತ್ಮಕ) ಹೋಲಿಸಿ.", "Įveskite „not good“, paskui „good“ ir palyginkite P(teigiama)."],
      ["Find the bigram “not good” in the table and read its weight.", "ಕೋಷ್ಟಕದಲ್ಲಿ ಬೈಗ್ರಾಮ್ “not good” ಹುಡುಕಿ ಅದರ ತೂಕ ಓದಿ.", "Lentelėje raskite bigramą „not good“ ir perskaitykite jos svorį."],
      ["Click “not bad” and note the sign of its weight.", "“not bad” ಕ್ಲಿಕ್ ಮಾಡಿ ಅದರ ತೂಕದ ಚಿಹ್ನೆ ಗಮನಿಸಿ.", "Spustelėkite „not bad“ ir atkreipkite dėmesį į jos svorio ženklą."],
      ["In the naive Bayes demo, add a word with a large Δ and watch the posterior move.", "ನೈವ್ ಬೇಯ್ಸ್ ಡೆಮೊದಲ್ಲಿ ದೊಡ್ಡ Δ ಇರುವ ಪದ ಸೇರಿಸಿ, ಪೋಸ್ಟೀರಿಯರ್ ಚಲಿಸುವುದನ್ನು ನೋಡಿ.", "Naiviojo Bajeso demonstracijoje pridėkite žodį su dideliu Δ ir stebėkite, kaip juda aposteriorinė tikimybė."],
    ],
    questions: [
      {
        q: ["In the real weights, what is true of the word “not” and the bigram “not bad”?", "ನಿಜವಾದ ತೂಕಗಳಲ್ಲಿ “not” ಪದ ಮತ್ತು ಬೈಗ್ರಾಮ್ “not bad” ಬಗ್ಗೆ ಯಾವುದು ಸತ್ಯ?", "Kas tiesa apie žodį „not“ ir bigramą „not bad“ tikruosiuose svoriuose?"],
        options: [
          ["“not” is negative (−7.5) and “not bad” is positive (+6.986)", "“not” ಋಣಾತ್ಮಕ (−7.5) ಮತ್ತು “not bad” ಧನಾತ್ಮಕ (+6.986)", "„not“ neigiamas (−7,5), o „not bad“ teigiama (+6,986)"],
          ["Both are negative", "ಎರಡೂ ಋಣಾತ್ಮಕ", "Abu neigiami"],
          ["Both are positive", "ಎರಡೂ ಧನಾತ್ಮಕ", "Abu teigiami"],
        ],
        correct: 0,
        why: ["The model learned “not” as a negative word, but the pair “not bad” occurred often enough in positive sentences to get its own positive weight. That is how a bag of n-grams learns some negations by heart.", "ಮಾದರಿ “not” ಅನ್ನು ಋಣಾತ್ಮಕ ಪದವಾಗಿ ಕಲಿತಿದೆ, ಆದರೆ “not bad” ಜೋಡಿ ಧನಾತ್ಮಕ ವಾಕ್ಯಗಳಲ್ಲಿ ಸಾಕಷ್ಟು ಬಾರಿ ಬಂದು ತನ್ನದೇ ಧನಾತ್ಮಕ ತೂಕ ಪಡೆಯಿತು. ಹೀಗೆ n-ಗ್ರಾಮ್‌ಗಳ ಚೀಲ ಕೆಲವು ನಿರಾಕರಣೆಗಳನ್ನು ಬಾಯಿಪಾಠ ಮಾಡುತ್ತದೆ.", "Modelis išmoko „not“ kaip neigiamą žodį, bet pora „not bad“ teigiamuose sakiniuose pasitaikė pakankamai dažnai ir gavo savo teigiamą svorį. Taip n-gramų maišas kai kuriuos neigimus išmoksta mintinai."],
        verify: () => top(LR_TOP_NEG, "not") < 0 && top(LR_TOP_POS, "not bad") > 0,
      },
      {
        q: ["What does the naive Bayes demo on this page train on?", "ಈ ಪುಟದ ನೈವ್ ಬೇಯ್ಸ್ ಡೆಮೊ ಯಾವುದರ ಮೇಲೆ ತರಬೇತಿ ಪಡೆಯುತ್ತದೆ?", "Su kuo mokomas šio puslapio naiviojo Bajeso demonstracinis modelis?"],
        options: [
          ["The 65,349 training sentences of the paper", "ಪ್ರಬಂಧದ 65,349 ತರಬೇತಿ ವಾಕ್ಯಗಳು", "65 349 straipsnio mokymo sakiniai"],
          ["The 872 labelled test sentences, as an illustration only", "ಲೇಬಲ್ ಮಾಡಿದ 872 ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳು, ಕೇವಲ ಚಿತ್ರಣಕ್ಕಾಗಿ", "872 pažymėti testo sakiniai, tik kaip iliustracija"],
          ["Nothing: its numbers are typed in", "ಏನೂ ಇಲ್ಲ: ಅದರ ಸಂಖ್ಯೆಗಳನ್ನು ಕೈಯಿಂದ ಟೈಪ್ ಮಾಡಲಾಗಿದೆ", "Nieko: jo skaičiai surinkti ranka"],
        ],
        correct: 1,
        why: ["The repository does not save the naive Bayes word counts, so the demo trains a small model on the 872 labelled sentences to show the formula. It is not the paper's model.", "ರೆಪೊಸಿಟರಿ ನೈವ್ ಬೇಯ್ಸ್ ಪದ ಎಣಿಕೆಗಳನ್ನು ಉಳಿಸುವುದಿಲ್ಲ, ಆದ್ದರಿಂದ ಸೂತ್ರ ತೋರಿಸಲು ಡೆಮೊ 872 ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳಲ್ಲಿ ಸಣ್ಣ ಮಾದರಿ ತರಬೇತಿ ಮಾಡುತ್ತದೆ. ಅದು ಪ್ರಬಂಧದ ಮಾದರಿ ಅಲ್ಲ.", "Saugykla neišsaugo naiviojo Bajeso žodžių skaičių, todėl demonstracija formulei parodyti moko mažą modelį iš 872 pažymėtų sakinių. Tai ne straipsnio modelis."],
      },
      {
        q: ["The BiLSTM reached 91.3 % dev accuracy but only 82.8 % on the test set. Why?", "BiLSTM ಡೆವ್ ನಿಖರತೆ 91.3 % ತಲುಪಿತು ಆದರೆ ಪರೀಕ್ಷಾ ಗುಂಪಿನಲ್ಲಿ ಕೇವಲ 82.8 %. ಏಕೆ?", "BiLSTM dev tikslumas siekė 91,3 %, bet testo aibėje tik 82,8 %. Kodėl?"],
        options: [
          ["The test set is much smaller", "ಪರೀಕ್ಷಾ ಗುಂಪು ಬಹಳ ಚಿಕ್ಕದು", "Testo aibė gerokai mažesnė"],
          ["The dev set was used for training", "ಡೆವ್ ಗುಂಪನ್ನು ತರಬೇತಿಗೆ ಬಳಸಲಾಗಿದೆ", "Dev aibė buvo naudota mokymui"],
          ["The dev set is cut from the training data (short phrases), the test set has full sentences", "ಡೆವ್ ಗುಂಪನ್ನು ತರಬೇತಿ ಡೇಟಾದಿಂದ ಕತ್ತರಿಸಲಾಗಿದೆ (ಚಿಕ್ಕ ನುಡಿಗಟ್ಟುಗಳು), ಪರೀಕ್ಷಾ ಗುಂಪಿನಲ್ಲಿ ಪೂರ್ಣ ವಾಕ್ಯಗಳಿವೆ", "Dev aibė išpjauta iš mokymo duomenų (trumpos frazės), o testo aibėje yra pilni sakiniai"],
        ],
        correct: 2,
        why: ["The model fits the short-phrase distribution of the training data well and generalises less to complete sentences (9.4 against 19.5 words on average).", "ಮಾದರಿ ತರಬೇತಿ ಡೇಟಾದ ಚಿಕ್ಕ ನುಡಿಗಟ್ಟುಗಳ ವಿತರಣೆಗೆ ಚೆನ್ನಾಗಿ ಹೊಂದುತ್ತದೆ ಮತ್ತು ಪೂರ್ಣ ವಾಕ್ಯಗಳಿಗೆ ಕಡಿಮೆ ಸಾಮಾನ್ಯೀಕರಿಸುತ್ತದೆ (ಸರಾಸರಿ 9.4 ವಿರುದ್ಧ 19.5 ಪದಗಳು).", "Modelis gerai pritampa prie trumpų frazių skirstinio mokymo duomenyse ir prasčiau apibendrina pilnus sakinius (vidutiniškai 9,4 prieš 19,5 žodžio)."],
        verify: () => {
          const m = byTag("bilstm");
          return Math.abs(m.devHistory[m.devHistory.length - 1] - 0.913) < 1e-9 && m.accuracy.toFixed(3) === "0.828" && DATASET.train_len.toFixed(1) === "9.4" && DATASET.test_len.toFixed(1) === "19.5";
        },
      },
    ],
    takeaways: [
      ["Word-counting models see weights, not meaning: the same word has the same weight in every sentence.", "ಪದ ಎಣಿಸುವ ಮಾದರಿಗಳು ತೂಕ ನೋಡುತ್ತವೆ, ಅರ್ಥವಲ್ಲ: ಒಂದೇ ಪದಕ್ಕೆ ಪ್ರತಿ ವಾಕ್ಯದಲ್ಲೂ ಒಂದೇ ತೂಕ.", "Žodžius skaičiuojantys modeliai mato svorius, o ne prasmę: tas pats žodis visuose sakiniuose turi tą patį svorį."],
      ["Bigrams rescue a few negations such as “not bad”, not the general rule.", "ಬೈಗ್ರಾಮ್‌ಗಳು “not bad” ಮುಂತಾದ ಕೆಲವು ನಿರಾಕರಣೆಗಳನ್ನು ಉಳಿಸುತ್ತವೆ, ಸಾಮಾನ್ಯ ನಿಯಮವನ್ನು ಅಲ್ಲ.", "Bigramos išgelbsti kelis neigimus, pvz., „not bad“, bet ne bendrą taisyklę."],
      ["The BiLSTM without pre-training only matched these baselines (82.8 %).", "ಪೂರ್ವ-ತರಬೇತಿ ಇಲ್ಲದ BiLSTM ಈ ಮೂಲ ಮಾದರಿಗಳಿಗೆ ಮಾತ್ರ ಸಮವಾಯಿತು (82.8 %).", "BiLSTM be išankstinio mokymo tik prilygo šiems baziniams modeliams (82,8 %)."],
    ],
    mistakes: [
      ["Reading the naive Bayes demo as the paper's naive Bayes model.", "ನೈವ್ ಬೇಯ್ಸ್ ಡೆಮೊವನ್ನು ಪ್ರಬಂಧದ ನೈವ್ ಬೇಯ್ಸ್ ಮಾದರಿ ಎಂದು ಓದುವುದು.", "Naiviojo Bajeso demonstracijos laikymas straipsnio naiviuoju Bajesu."],
      ["Thinking the BiLSTM must beat TF-IDF because it reads word order.", "BiLSTM ಪದ ಕ್ರಮ ಓದುವುದರಿಂದ TF-IDF ಅನ್ನು ಮೀರಿಸಬೇಕು ಎಂದು ಭಾವಿಸುವುದು.", "Manymas, kad BiLSTM turi nugalėti TF-IDF, nes skaito žodžių tvarką."],
    ],
  },

  design: {
    goal: [
      "Know exactly what was compared and how: the three splits, the ten models, the criteria, the protocol and the threats to validity.",
      "ಏನನ್ನು ಹೇಗೆ ಹೋಲಿಸಲಾಯಿತು ಎಂದು ನಿಖರವಾಗಿ ತಿಳಿಯಿರಿ: ಮೂರು ವಿಭಜನೆಗಳು, ಹತ್ತು ಮಾದರಿಗಳು, ಮಾನದಂಡಗಳು, ಪ್ರೋಟೋಕಾಲ್ ಮತ್ತು ಮಾನ್ಯತೆಗೆ ಅಪಾಯಗಳು.",
      "Tiksliai žinokite, kas ir kaip buvo lyginama: trys skaidiniai, dešimt modelių, kriterijai, protokolas ir validumo grėsmės.",
    ],
    fit: [
      "A result is only as good as its design. The paper's claim that Transformers win by about 6 points rests on equal treatment, a held-out test set and honest limits.",
      "ಫಲಿತಾಂಶ ಅದರ ವಿನ್ಯಾಸದಷ್ಟೇ ಉತ್ತಮ. ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಸುಮಾರು 6 ಪಾಯಿಂಟ್‌ಗಳಿಂದ ಗೆಲ್ಲುತ್ತವೆ ಎಂಬ ಪ್ರಬಂಧದ ಹೇಳಿಕೆ ಸಮಾನ ವರ್ತನೆ, ಹೊರಗಿಟ್ಟ ಪರೀಕ್ಷಾ ಗುಂಪು ಮತ್ತು ಪ್ರಾಮಾಣಿಕ ಮಿತಿಗಳ ಮೇಲೆ ನಿಂತಿದೆ.",
      "Rezultatas tiek geras, kiek geras jo planas. Straipsnio teiginys, kad transformeriai laimi maždaug 6 punktais, remiasi vienodu požiūriu, atskira testo aibe ir sąžiningomis ribomis.",
    ],
    keywords: [
      [["SST-2", "SST-2", "SST-2"], ["Binary movie-review sentiment data from the GLUE benchmark.", "GLUE ಮಾನದಂಡದ ದ್ವಿಮಾನ ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆ ಭಾವನೆ ಡೇಟಾ.", "Dvejetainiai filmų apžvalgų nuotaikų duomenys iš GLUE etalono."]],
      [["Dev set", "ಡೆವ್ ಗುಂಪು", "Dev aibė"], ["Data used to choose (the epoch), never to report.", "ಆಯ್ಕೆಗೆ (ಎಪೋಕ್) ಬಳಸುವ ಡೇಟಾ, ವರದಿಗೆ ಎಂದಿಗೂ ಅಲ್ಲ.", "Duomenys, naudojami pasirinkti (epochą), niekada ataskaitai."]],
      [["Stratified", "ಸ್ತರೀಕೃತ", "Stratifikuota"], ["A random split that keeps the class shares.", "ವರ್ಗ ಪಾಲುಗಳನ್ನು ಉಳಿಸುವ ಯಾದೃಚ್ಛಿಕ ವಿಭಜನೆ.", "Atsitiktinis skaidymas, išlaikantis klasių dalis."]],
      [["Macro average", "ಮ್ಯಾಕ್ರೋ ಸರಾಸರಿ", "Makro vidurkis"], ["The mean of the per-class scores, so both classes count equally.", "ವರ್ಗವಾರು ಅಂಕಗಳ ಸರಾಸರಿ, ಎರಡೂ ವರ್ಗ ಸಮಾನವಾಗಿ ಲೆಕ್ಕಕ್ಕೆ.", "Klasių įverčių vidurkis, todėl abi klasės sveria vienodai."]],
    ],
    tasks: [
      ["In the splits table, find the split that is nearly balanced.", "ವಿಭಜನೆ ಕೋಷ್ಟಕದಲ್ಲಿ ಬಹುತೇಕ ಸಮತೋಲಿತ ವಿಭಜನೆ ಹುಡುಕಿ.", "Skaidinių lentelėje raskite beveik subalansuotą skaidinį."],
      ["Filter the ten competitors by family and count the pre-trained ones.", "ಹತ್ತು ಸ್ಪರ್ಧಿಗಳನ್ನು ಕುಟುಂಬದ ಪ್ರಕಾರ ಫಿಲ್ಟರ್ ಮಾಡಿ ಪೂರ್ವ-ತರಬೇತಿ ಪಡೆದವನ್ನು ಎಣಿಸಿ.", "Išfiltruokite dešimt dalyvių pagal šeimą ir suskaičiuokite iš anksto išmokytus."],
      ["Read the learning rate of each fine-tuned model.", "ಪ್ರತಿ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ ಮಾದರಿಯ ಕಲಿಕೆ ದರ ಓದಿ.", "Perskaitykite kiekvieno sutikslinto modelio mokymosi greitį."],
      ["Pick the threat to validity you think matters most and say why.", "ನಿಮ್ಮ ಪ್ರಕಾರ ಅತಿ ಮುಖ್ಯ ಮಾನ್ಯತೆ ಅಪಾಯ ಆರಿಸಿ, ಏಕೆ ಎಂದು ಹೇಳಿ.", "Pasirinkite, jūsų nuomone, svarbiausią validumo grėsmę ir pasakykite kodėl."],
    ],
    questions: [
      {
        q: ["Why is the official SST-2 validation split used as the test set?", "ಅಧಿಕೃತ SST-2 ಮೌಲ್ಯೀಕರಣ ವಿಭಜನೆಯನ್ನು ಪರೀಕ್ಷಾ ಗುಂಪಾಗಿ ಏಕೆ ಬಳಸಲಾಗಿದೆ?", "Kodėl oficialus SST-2 validavimo skaidinys naudojamas kaip testo aibė?"],
        options: [
          ["It is the largest split", "ಅದು ಅತಿ ದೊಡ್ಡ ವಿಭಜನೆ", "Tai didžiausias skaidinys"],
          ["GLUE keeps the real test labels hidden", "GLUE ನಿಜವಾದ ಪರೀಕ್ಷಾ ಲೇಬಲ್‌ಗಳನ್ನು ಮರೆಮಾಡುತ್ತದೆ", "GLUE slepia tikrąsias testo etiketes"],
          ["Validation sets are always easier", "ಮೌಲ್ಯೀಕರಣ ಗುಂಪುಗಳು ಯಾವಾಗಲೂ ಸುಲಭ", "Validavimo aibės visada lengvesnės"],
        ],
        correct: 1,
        why: ["The real test labels are not public, so common practice is to hold out the validation split as the test set and to cut a dev set from the training data (65,349 + 2,000 rows).", "ನಿಜವಾದ ಪರೀಕ್ಷಾ ಲೇಬಲ್‌ಗಳು ಸಾರ್ವಜನಿಕವಲ್ಲ, ಆದ್ದರಿಂದ ಮೌಲ್ಯೀಕರಣ ವಿಭಜನೆಯನ್ನು ಪರೀಕ್ಷಾ ಗುಂಪಾಗಿ ಹೊರಗಿಟ್ಟು ತರಬೇತಿ ಡೇಟಾದಿಂದ ಡೆವ್ ಗುಂಪು ಕತ್ತರಿಸುವುದು ಸಾಮಾನ್ಯ ಪದ್ಧತಿ (65,349 + 2,000 ಸಾಲುಗಳು).", "Tikrosios testo etiketės nėra viešos, todėl įprasta validavimo skaidinį palikti kaip testo aibę, o dev aibę išpjauti iš mokymo duomenų (65 349 + 2 000 eilučių)."],
        verify: () => DATASET.train === 65349 && DATASET.dev === 2000 && DATASET.test === 872,
      },
      {
        q: ["About how many sentences is one percentage point on the 872-sentence test set?", "872 ವಾಕ್ಯಗಳ ಪರೀಕ್ಷಾ ಗುಂಪಿನಲ್ಲಿ ಒಂದು ಶೇಕಡಾ ಪಾಯಿಂಟ್ ಸುಮಾರು ಎಷ್ಟು ವಾಕ್ಯಗಳು?", "Maždaug kiek sakinių yra vienas procentinis punktas 872 sakinių testo aibėje?"],
        options: [
          ["About 1", "ಸುಮಾರು 1", "Maždaug 1"],
          ["About 87", "ಸುಮಾರು 87", "Maždaug 87"],
          ["About 9", "ಸುಮಾರು 9", "Maždaug 9"],
        ],
        correct: 2,
        why: ["872 / 100 = 8.7 sentences. A difference of one point is the answer to about nine sentences, so it is easily chance.", "872 / 100 = 8.7 ವಾಕ್ಯಗಳು. ಒಂದು ಪಾಯಿಂಟ್ ವ್ಯತ್ಯಾಸ ಸುಮಾರು ಒಂಬತ್ತು ವಾಕ್ಯಗಳು, ಆದ್ದರಿಂದ ಅದು ಸುಲಭವಾಗಿ ಆಕಸ್ಮಿಕ.", "872 / 100 = 8,7 sakinio. Vieno punkto skirtumas yra maždaug devyni sakiniai, todėl jis lengvai gali būti atsitiktinis."],
        verify: () => Math.round(872 / 100) === 9,
      },
      {
        q: ["Which peak learning rate did the paper use for BERT-tiny?", "BERT-tiny ಗೆ ಪ್ರಬಂಧ ಯಾವ ಗರಿಷ್ಠ ಕಲಿಕೆ ದರ ಬಳಸಿತು?", "Kokį didžiausią mokymosi greitį straipsnis naudojo BERT-tiny?"],
        options: [
          ["5·10⁻⁵", "5·10⁻⁵", "5·10⁻⁵"],
          ["1·10⁻⁴", "1·10⁻⁴", "1·10⁻⁴"],
          ["2·10⁻⁴", "2·10⁻⁴", "2·10⁻⁴"],
        ],
        correct: 2,
        why: ["The smallest models get a higher learning rate (2·10⁻⁴ for BERT-tiny, 1·10⁻⁴ for BERT-small, 5·10⁻⁵ for DistilBERT), which is usual for compact BERT variants.", "ಅತಿ ಚಿಕ್ಕ ಮಾದರಿಗಳಿಗೆ ಹೆಚ್ಚಿನ ಕಲಿಕೆ ದರ (BERT-tiny ಗೆ 2·10⁻⁴, BERT-small ಗೆ 1·10⁻⁴, DistilBERT ಗೆ 5·10⁻⁵), ಇದು ಸಣ್ಣ BERT ರೂಪಾಂತರಗಳಿಗೆ ಸಾಮಾನ್ಯ.", "Mažiausiems modeliams skiriamas didesnis mokymosi greitis (2·10⁻⁴ BERT-tiny, 1·10⁻⁴ BERT-small, 5·10⁻⁵ DistilBERT), kas įprasta kompaktiškiems BERT variantams."],
        verify: () => byTag("ft_bert-tiny_8000").lr === 2e-4 && byTag("ft_bert-small_8000").lr === 1e-4 && byTag("ft_distilbert_8000").lr === 5e-5,
      },
    ],
    takeaways: [
      ["Every model reads the same stored splits and the test set is used once per model.", "ಪ್ರತಿ ಮಾದರಿ ಅದೇ ಉಳಿಸಿದ ವಿಭಜನೆಗಳನ್ನು ಓದುತ್ತದೆ ಮತ್ತು ಪರೀಕ್ಷಾ ಗುಂಪನ್ನು ಪ್ರತಿ ಮಾದರಿಗೆ ಒಮ್ಮೆ ಬಳಸಲಾಗುತ್ತದೆ.", "Kiekvienas modelis skaito tuos pačius išsaugotus skaidinius, o testo aibė naudojama vieną kartą kiekvienam modeliui."],
      ["Train sentences are short phrases, test sentences are complete: a built-in distribution shift.", "ತರಬೇತಿ ವಾಕ್ಯಗಳು ಚಿಕ್ಕ ನುಡಿಗಟ್ಟುಗಳು, ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳು ಪೂರ್ಣ: ಅಂತರ್ಗತ ವಿತರಣೆ ಬದಲಾವಣೆ.", "Mokymo sakiniai – trumpos frazės, testo sakiniai – pilni: įmontuotas skirstinio poslinkis."],
      ["Five threats limit the claims: one seed, keyword subsets, one domain, one laptop, ready-made models.", "ಐದು ಅಪಾಯಗಳು ಹೇಳಿಕೆಗಳನ್ನು ಮಿತಿಗೊಳಿಸುತ್ತವೆ: ಒಂದು ಸೀಡ್, ಕೀವರ್ಡ್ ಉಪಗುಂಪುಗಳು, ಒಂದು ಕ್ಷೇತ್ರ, ಒಂದು ಲ್ಯಾಪ್‌ಟಾಪ್, ಸಿದ್ಧ ಮಾದರಿಗಳು.", "Penkios grėsmės riboja teiginius: viena sėkla, raktažodžių poaibiai, viena sritis, vienas kompiuteris, paruošti modeliai."],
    ],
    mistakes: [
      ["Treating the dev accuracy as the test result.", "ಡೆವ್ ನಿಖರತೆಯನ್ನು ಪರೀಕ್ಷಾ ಫಲಿತಾಂಶವೆಂದು ಪರಿಗಣಿಸುವುದು.", "Dev tikslumo laikymas testo rezultatu."],
      ["Reading the ready-made models as a controlled comparison.", "ಸಿದ್ಧ ಮಾದರಿಗಳನ್ನು ನಿಯಂತ್ರಿತ ಹೋಲಿಕೆ ಎಂದು ಓದುವುದು.", "Paruoštų modelių laikymas kontroliuojamu palyginimu."],
    ],
  },

  results: {
    goal: [
      "Read the ten-model table, sort it by any column, and check the paper's statistics yourself: the b and c counts, exact McNemar p-values, confidence intervals and confusion matrices recomputed from the predictions.",
      "ಹತ್ತು ಮಾದರಿಗಳ ಕೋಷ್ಟಕ ಓದಿ, ಯಾವುದೇ ಕಾಲಂನಿಂದ ವಿಂಗಡಿಸಿ, ಮತ್ತು ಪ್ರಬಂಧದ ಅಂಕಿಅಂಶಗಳನ್ನು ನೀವೇ ಪರಿಶೀಲಿಸಿ: b ಮತ್ತು c ಎಣಿಕೆಗಳು, ನಿಖರ ಮೆಕ್‌ನೆಮಾರ್ p-ಮೌಲ್ಯಗಳು, ವಿಶ್ವಾಸಾರ್ಹ ಅಂತರಗಳು ಮತ್ತು ಭವಿಷ್ಯವಾಣಿಗಳಿಂದ ಮರು ಲೆಕ್ಕಿಸಿದ ಗೊಂದಲ ಮ್ಯಾಟ್ರಿಕ್ಸ್‌ಗಳು.",
      "Perskaitykite dešimties modelių lentelę, surikiuokite pagal bet kurį stulpelį ir patys patikrinkite straipsnio statistiką: b ir c skaičius, tikslias McNemaro p reikšmes, pasikliautinuosius intervalus ir klaidų matricas, perskaičiuotas iš prognozių.",
    ],
    fit: [
      "With 872 test sentences a one-point gap is only about nine sentences. Statistics tell you which differences are real and which are chance.",
      "872 ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳಲ್ಲಿ ಒಂದು ಪಾಯಿಂಟ್ ಅಂತರ ಕೇವಲ ಸುಮಾರು ಒಂಬತ್ತು ವಾಕ್ಯಗಳು. ಯಾವ ವ್ಯತ್ಯಾಸಗಳು ನಿಜ, ಯಾವುವು ಆಕಸ್ಮಿಕ ಎಂದು ಅಂಕಿಅಂಶಗಳು ಹೇಳುತ್ತವೆ.",
      "Su 872 testo sakiniais vieno punkto skirtumas yra tik apie devynis sakinius. Statistika parodo, kurie skirtumai tikri, o kurie atsitiktiniai.",
    ],
    keywords: [
      [["McNemar test", "ಮೆಕ್‌ನೆಮಾರ್ ಪರೀಕ್ಷೆ", "McNemaro testas"], ["Compares two models on the sentences where exactly one is right.", "ಒಂದೇ ಸರಿ ಇರುವ ವಾಕ್ಯಗಳಲ್ಲಿ ಎರಡು ಮಾದರಿಗಳನ್ನು ಹೋಲಿಸುತ್ತದೆ.", "Lygina du modelius sakiniuose, kuriuose teisingas lygiai vienas."]],
      [["b and c", "b ಮತ್ತು c", "b ir c"], ["Sentences only A gets right, and only B gets right.", "A ಮಾತ್ರ ಸರಿ ಮತ್ತು B ಮಾತ್ರ ಸರಿ ಇರುವ ವಾಕ್ಯಗಳು.", "Sakiniai, kuriuos teisingai klasifikuoja tik A ir tik B."]],
      [["Bootstrap interval", "ಬೂಟ್‌ಸ್ಟ್ರ್ಯಾಪ್ ಅಂತರ", "Bootstrap intervalas"], ["Resample the test set many times; take the 2.5th and 97.5th percentile.", "ಪರೀಕ್ಷಾ ಗುಂಪನ್ನು ಹಲವು ಬಾರಿ ಮರುಮಾದರಿ ಮಾಡಿ; 2.5 ಮತ್ತು 97.5 ಶತಮಾನ ತೆಗೆಯಿರಿ.", "Daug kartų perimkite testo aibę; imkite 2,5 ir 97,5 procentilius."]],
      [["Confusion matrix", "ಗೊಂದಲ ಮ್ಯಾಟ್ರಿಕ್ಸ್", "Klaidų matrica"], ["Counts of true against predicted classes.", "ನಿಜ ಮತ್ತು ಭವಿಷ್ಯ ನುಡಿದ ವರ್ಗಗಳ ಎಣಿಕೆ.", "Tikrų ir prognozuotų klasių skaičiai."]],
    ],
    tasks: [
      ["Sort the table by latency, then by accuracy.", "ಕೋಷ್ಟಕವನ್ನು ವಿಳಂಬದಿಂದ, ನಂತರ ನಿಖರತೆಯಿಂದ ವಿಂಗಡಿಸಿ.", "Surikiuokite lentelę pagal delsą, paskui pagal tikslumą."],
      ["Compare fine-tuned DistilBERT with the SVM and read b, c and p.", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT ಅನ್ನು SVM ಜೊತೆ ಹೋಲಿಸಿ b, c ಮತ್ತು p ಓದಿ.", "Palyginkite sutikslintą DistilBERT su SVM ir perskaitykite b, c ir p."],
      ["Find a pair whose difference is not significant.", "ವ್ಯತ್ಯಾಸ ಗಮನಾರ್ಹವಲ್ಲದ ಜೋಡಿ ಹುಡುಕಿ.", "Raskite porą, kurios skirtumas nereikšmingas."],
      ["Open the confusion matrix of the zero-shot model: which class does it miss more?", "ಜೀರೋ-ಶಾಟ್ ಮಾದರಿಯ ಗೊಂದಲ ಮ್ಯಾಟ್ರಿಕ್ಸ್ ತೆರೆಯಿರಿ: ಅದು ಯಾವ ವರ್ಗವನ್ನು ಹೆಚ್ಚು ತಪ್ಪಿಸುತ್ತದೆ?", "Atidarykite zero-shot modelio klaidų matricą: kurią klasę jis dažniau praleidžia?"],
    ],
    questions: [
      {
        q: ["Fine-tuned DistilBERT is right where the SVM is wrong on 104 sentences, the SVM on 53. What follows?", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT SVM ತಪ್ಪಿದ 104 ವಾಕ್ಯಗಳಲ್ಲಿ ಸರಿ, SVM 53 ರಲ್ಲಿ. ಏನು ಅನುಸರಿಸುತ್ತದೆ?", "Sutikslintas DistilBERT teisus, kur SVM klysta, 104 sakiniuose, o SVM – 53. Kas iš to išplaukia?"],
        options: [
          ["The two models are equally good", "ಎರಡು ಮಾದರಿಗಳು ಸಮಾನವಾಗಿ ಒಳ್ಳೆಯವು", "Abu modeliai vienodai geri"],
          ["DistilBERT is significantly better (p < 0.001)", "DistilBERT ಗಮನಾರ್ಹವಾಗಿ ಉತ್ತಮ (p < 0.001)", "DistilBERT statistiškai reikšmingai geresnis (p < 0.001)"],
          ["The SVM is better", "SVM ಉತ್ತಮ", "SVM geresnis"],
        ],
        correct: 1,
        why: ["Under equal accuracy b and c would be about equal. An exact binomial test of 53 against 104 gives p ≈ 0.00006, so the gap is not chance.", "ಸಮಾನ ನಿಖರತೆಯಲ್ಲಿ b ಮತ್ತು c ಸುಮಾರು ಸಮ ಇರಬೇಕಿತ್ತು. 53 ವಿರುದ್ಧ 104 ರ ನಿಖರ ದ್ವಿಪದ ಪರೀಕ್ಷೆ p ≈ 0.00006 ನೀಡುತ್ತದೆ, ಆದ್ದರಿಂದ ಅಂತರ ಆಕಸ್ಮಿಕವಲ್ಲ.", "Esant vienodam tikslumui b ir c būtų maždaug lygūs. Tikslusis binominis testas 53 prieš 104 duoda p ≈ 0,00006, taigi skirtumas nėra atsitiktinis."],
        verify: () => { const p = pair("ft_distilbert_8000", "tfidf_svm"); return p.onlyA === 104 && p.onlyB === 53 && p.p < 0.001; },
      },
      {
        q: ["BERT-small is right where the SVM is wrong on 71 sentences, the SVM on 64. What follows?", "BERT-small SVM ತಪ್ಪಿದ 71 ವಾಕ್ಯಗಳಲ್ಲಿ ಸರಿ, SVM 64 ರಲ್ಲಿ. ಏನು ಅನುಸರಿಸುತ್ತದೆ?", "BERT-small teisus, kur SVM klysta, 71 sakinyje, o SVM – 64. Kas iš to išplaukia?"],
        options: [
          ["No significant difference (p ≈ 0.61): the gap can be chance", "ಗಮನಾರ್ಹ ವ್ಯತ್ಯಾಸವಿಲ್ಲ (p ≈ 0.61): ಅಂತರ ಆಕಸ್ಮಿಕವಾಗಿರಬಹುದು", "Reikšmingo skirtumo nėra (p ≈ 0,61): skirtumas gali būti atsitiktinis"],
          ["BERT-small is significantly better", "BERT-small ಗಮನಾರ್ಹವಾಗಿ ಉತ್ತಮ", "BERT-small statistiškai reikšmingai geresnis"],
          ["BERT-small is significantly worse", "BERT-small ಗಮನಾರ್ಹವಾಗಿ ಕೆಟ್ಟದು", "BERT-small statistiškai reikšmingai prastesnis"],
        ],
        correct: 0,
        why: ["71 against 64 is a close split of 135 sentences; the exact test gives p ≈ 0.61. A compact Transformer only matches the classical baseline here.", "135 ವಾಕ್ಯಗಳಲ್ಲಿ 71 ವಿರುದ್ಧ 64 ಹತ್ತಿರದ ವಿಭಜನೆ; ನಿಖರ ಪರೀಕ್ಷೆ p ≈ 0.61 ನೀಡುತ್ತದೆ. ಸಣ್ಣ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಇಲ್ಲಿ ಕ್ಲಾಸಿಕಲ್ ಮೂಲ ಮಾದರಿಗೆ ಮಾತ್ರ ಸಮ.", "71 prieš 64 yra artimas pasidalijimas iš 135 sakinių; tikslusis testas duoda p ≈ 0,61. Kompaktiškas transformeris čia tik prilygsta klasikiniam baziniam modeliui."],
        verify: () => { const p = pair("ft_bert-small_8000", "tfidf_svm"); return p.onlyA === 71 && p.onlyB === 64 && p.p.toFixed(2) === "0.61"; },
      },
      {
        q: ["The recomputed bootstrap interval on this page differs slightly from the recorded one. Why?", "ಈ ಪುಟದ ಮರು ಲೆಕ್ಕಿಸಿದ ಬೂಟ್‌ಸ್ಟ್ರ್ಯಾಪ್ ಅಂತರ ದಾಖಲಾದದ್ದಕ್ಕಿಂತ ಸ್ವಲ್ಪ ಭಿನ್ನ. ಏಕೆ?", "Šiame puslapyje perskaičiuotas bootstrap intervalas šiek tiek skiriasi nuo įrašyto. Kodėl?"],
        options: [
          ["The recorded interval is wrong", "ದಾಖಲಾದ ಅಂತರ ತಪ್ಪು", "Įrašytas intervalas neteisingas"],
          ["It uses different predictions", "ಅದು ಬೇರೆ ಭವಿಷ್ಯವಾಣಿಗಳನ್ನು ಬಳಸುತ್ತದೆ", "Naudojamos kitos prognozės"],
          ["Same method, a different random generator: the ends differ by a few tenths of a point", "ಅದೇ ವಿಧಾನ, ಬೇರೆ ಯಾದೃಚ್ಛಿಕ ಜನರೇಟರ್: ತುದಿಗಳು ಕೆಲವು ದಶಮಾಂಶ ಪಾಯಿಂಟ್‌ಗಳಷ್ಟು ಭಿನ್ನ", "Tas pats metodas, kitas atsitiktinių skaičių generatorius: galai skiriasi keliomis dešimtosiomis punkto"],
        ],
        correct: 2,
        why: ["The bootstrap is random. The page resamples the same 872 predictions 2,000 times with its own seeded generator, so the ends move a little; the McNemar counts and p-values have no randomness and match exactly.", "ಬೂಟ್‌ಸ್ಟ್ರ್ಯಾಪ್ ಯಾದೃಚ್ಛಿಕ. ಪುಟ ಅದೇ 872 ಭವಿಷ್ಯವಾಣಿಗಳನ್ನು ತನ್ನದೇ ಸೀಡ್ ಜನರೇಟರ್‌ನಿಂದ 2,000 ಬಾರಿ ಮರುಮಾದರಿ ಮಾಡುತ್ತದೆ, ಆದ್ದರಿಂದ ತುದಿಗಳು ಸ್ವಲ್ಪ ಚಲಿಸುತ್ತವೆ; ಮೆಕ್‌ನೆಮಾರ್ ಎಣಿಕೆಗಳು ಮತ್ತು p-ಮೌಲ್ಯಗಳಲ್ಲಿ ಯಾದೃಚ್ಛಿಕತೆ ಇಲ್ಲ ಮತ್ತು ನಿಖರವಾಗಿ ಹೊಂದುತ್ತವೆ.", "Bootstrap yra atsitiktinis. Puslapis 2 000 kartų perima tas pačias 872 prognozes savo generatoriumi su sėkla, todėl galai šiek tiek pasislenka; McNemaro skaičiai ir p reikšmės neturi atsitiktinumo ir sutampa tiksliai."],
      },
    ],
    takeaways: [
      ["The best model is ready-made DistilBERT-SST2 (91.1 %); every other model is significantly worse.", "ಅತ್ಯುತ್ತಮ ಮಾದರಿ ಸಿದ್ಧ DistilBERT-SST2 (91.1 %); ಉಳಿದ ಪ್ರತಿ ಮಾದರಿ ಗಮನಾರ್ಹವಾಗಿ ಕೆಟ್ಟದು.", "Geriausias modelis yra paruoštas DistilBERT-SST2 (91,1 %); visi kiti reikšmingai prastesni."],
      ["Our fine-tuned DistilBERT (88.8 %) beats the best classical model significantly; BERT-small and the BiLSTM do not.", "ನಮ್ಮ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT (88.8 %) ಅತ್ಯುತ್ತಮ ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಯನ್ನು ಗಮನಾರ್ಹವಾಗಿ ಮೀರಿಸುತ್ತದೆ; BERT-small ಮತ್ತು BiLSTM ಅಲ್ಲ.", "Mūsų sutikslintas DistilBERT (88,8 %) reikšmingai lenkia geriausią klasikinį modelį; BERT-small ir BiLSTM – ne."],
      ["Counts and p-values are exact; only the bootstrap interval depends on a random seed.", "ಎಣಿಕೆಗಳು ಮತ್ತು p-ಮೌಲ್ಯಗಳು ನಿಖರ; ಬೂಟ್‌ಸ್ಟ್ರ್ಯಾಪ್ ಅಂತರ ಮಾತ್ರ ಯಾದೃಚ್ಛಿಕ ಸೀಡ್ ಅನ್ನು ಅವಲಂಬಿಸುತ್ತದೆ.", "Skaičiai ir p reikšmės yra tikslūs; tik bootstrap intervalas priklauso nuo atsitiktinės sėklos."],
    ],
    mistakes: [
      ["Calling a gap of one or two points a win without looking at b, c and p.", "b, c ಮತ್ತು p ನೋಡದೆ ಒಂದು ಅಥವಾ ಎರಡು ಪಾಯಿಂಟ್ ಅಂತರವನ್ನು ಗೆಲುವೆಂದು ಕರೆಯುವುದು.", "Vieno ar dviejų punktų skirtumo vadinimas pergale nežiūrint į b, c ir p."],
      ["Reading the bar chart axis (which starts at 70 %) as if it started at zero.", "70 % ರಿಂದ ಆರಂಭವಾಗುವ ಪಟ್ಟಿ ಚಾರ್ಟ್ ಅಕ್ಷವನ್ನು ಸೊನ್ನೆಯಿಂದ ಆರಂಭವಾದಂತೆ ಓದುವುದು.", "Stulpelinės diagramos ašies (prasidedančios nuo 70 %) skaitymas, tarsi ji prasidėtų nuo nulio."],
    ],
  },

  cost: {
    goal: [
      "See what the accuracy costs: training time, latency per sentence, parameters and memory, and compute your own cost figures with the calculators.",
      "ನಿಖರತೆಗೆ ಏನು ವೆಚ್ಚ ಎಂದು ನೋಡಿ: ತರಬೇತಿ ಸಮಯ, ವಾಕ್ಯಕ್ಕೆ ವಿಳಂಬ, ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಮತ್ತು ಮೆಮೊರಿ, ಮತ್ತು ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳಿಂದ ನಿಮ್ಮದೇ ವೆಚ್ಚ ಸಂಖ್ಯೆಗಳನ್ನು ಲೆಕ್ಕಿಸಿ.",
      "Pamatykite, kiek kainuoja tikslumas: mokymo laikas, delsa vienam sakiniui, parametrai ir atmintis, ir skaičiuoklėmis apskaičiuokite savo kainos skaičius.",
    ],
    fit: [
      "A model that is 6 points better but hundreds of times slower may be the wrong choice. The cost side of the ledger decides which accuracy you can afford.",
      "6 ಪಾಯಿಂಟ್ ಉತ್ತಮವಾದರೂ ನೂರಾರು ಪಟ್ಟು ನಿಧಾನ ಮಾದರಿ ತಪ್ಪು ಆಯ್ಕೆಯಾಗಿರಬಹುದು. ಯಾವ ನಿಖರತೆಯನ್ನು ಭರಿಸಬಹುದು ಎಂದು ವೆಚ್ಚದ ಬದಿ ನಿರ್ಧರಿಸುತ್ತದೆ.",
      "Modelis, kuris 6 punktais geresnis, bet šimtus kartų lėtesnis, gali būti netinkamas pasirinkimas. Kainos pusė nusprendžia, kokį tikslumą galite sau leisti.",
    ],
    keywords: [
      [["Latency", "ವಿಳಂಬ", "Delsa"], ["Milliseconds to classify one sentence.", "ಒಂದು ವಾಕ್ಯ ವರ್ಗೀಕರಿಸಲು ಮಿಲಿಸೆಕೆಂಡ್‌ಗಳು.", "Milisekundės vienam sakiniui klasifikuoti."]],
      [["Throughput", "ಥ್ರೂಪುಟ್", "Pralaidumas"], ["Sentences per second: 1000 divided by the latency in ms.", "ಸೆಕೆಂಡ್‌ಗೆ ವಾಕ್ಯಗಳು: 1000 ಭಾಗಿಸು ms ವಿಳಂಬ.", "Sakiniai per sekundę: 1000, padalyta iš delsos ms."]],
      [["Parameters", "ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು", "Parametrai"], ["The numbers a model stores; at 32 bit each takes 4 bytes.", "ಮಾದರಿ ಸಂಗ್ರಹಿಸುವ ಸಂಖ್ಯೆಗಳು; 32 ಬಿಟ್‌ನಲ್ಲಿ ಪ್ರತಿಯೊಂದಕ್ಕೆ 4 ಬೈಟ್.", "Skaičiai, kuriuos saugo modelis; 32 bitų atveju kiekvienas užima 4 baitus."]],
      [["Log axis", "ಲಾಗ್ ಅಕ್ಷ", "Log ašis"], ["Each gridline is a multiple of the last: needed when values span orders of magnitude.", "ಪ್ರತಿ ಗ್ರಿಡ್ ಗೆರೆ ಹಿಂದಿನದರ ಗುಣಕ: ಮೌಲ್ಯಗಳು ಹಲವು ಮಟ್ಟ ವ್ಯಾಪಿಸಿದಾಗ ಬೇಕು.", "Kiekviena tinklelio linija yra ankstesnės kartotinis: reikia, kai reikšmės apima kelias dydžių eiles."]],
    ],
    tasks: [
      ["Click the DistilBERT bubble and read its numbers.", "DistilBERT ಬಬಲ್ ಕ್ಲಿಕ್ ಮಾಡಿ ಅದರ ಸಂಖ್ಯೆಗಳನ್ನು ಓದಿ.", "Spustelėkite DistilBERT burbulą ir perskaitykite jo skaičius."],
      ["In the calculator, set 1,000,000 sentences and compare DistilBERT with the SVM.", "ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ನಲ್ಲಿ 1,000,000 ವಾಕ್ಯಗಳನ್ನು ಹೊಂದಿಸಿ DistilBERT ಅನ್ನು SVM ಜೊತೆ ಹೋಲಿಸಿ.", "Skaičiuoklėje nustatykite 1 000 000 sakinių ir palyginkite DistilBERT su SVM."],
      ["Switch the memory to 16-bit and read Twitter-RoBERTa again.", "ಮೆಮೊರಿಯನ್ನು 16-ಬಿಟ್‌ಗೆ ಬದಲಿಸಿ Twitter-RoBERTa ಮತ್ತೆ ಓದಿ.", "Perjunkite atmintį į 16 bitų ir dar kartą perskaitykite Twitter-RoBERTa."],
      ["Sort the cost table by memory and by training time.", "ವೆಚ್ಚ ಕೋಷ್ಟಕವನ್ನು ಮೆಮೊರಿ ಮತ್ತು ತರಬೇತಿ ಸಮಯದಿಂದ ವಿಂಗಡಿಸಿ.", "Surikiuokite kainos lentelę pagal atmintį ir pagal mokymo laiką."],
    ],
    questions: [
      {
        q: ["At its measured latency, how long would fine-tuned DistilBERT need for 1,000,000 sentences?", "ಅಳೆದ ವಿಳಂಬದಲ್ಲಿ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT ಗೆ 1,000,000 ವಾಕ್ಯಗಳಿಗೆ ಎಷ್ಟು ಸಮಯ ಬೇಕು?", "Su išmatuota delsa, kiek laiko sutikslintam DistilBERT reikėtų 1 000 000 sakinių?"],
        options: [
          ["About 40 seconds", "ಸುಮಾರು 40 ಸೆಕೆಂಡ್", "Apie 40 sekundžių"],
          ["About 11 hours", "ಸುಮಾರು 11 ಗಂಟೆ", "Apie 11 valandų"],
          ["About 4 days", "ಸುಮಾರು 4 ದಿನ", "Apie 4 dienas"],
        ],
        correct: 1,
        why: ["39.1 ms × 1,000,000 = 39,100 s, which is about 10.9 hours.", "39.1 ms × 1,000,000 = 39,100 ಸೆ, ಅಂದರೆ ಸುಮಾರು 10.9 ಗಂಟೆ.", "39,1 ms × 1 000 000 = 39 100 s, tai apie 10,9 valandos."],
        verify: () => { const h = secondsFor(1e6, byTag("ft_distilbert_8000").latencyMs) / 3600; return h > 10.8 && h < 11; },
      },
      {
        q: ["Twitter-RoBERTa has 124,647,939 parameters. How much memory do its weights need at 32-bit?", "Twitter-RoBERTa ಗೆ 124,647,939 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ. 32-ಬಿಟ್‌ನಲ್ಲಿ ಅದರ ತೂಕಗಳಿಗೆ ಎಷ್ಟು ಮೆಮೊರಿ ಬೇಕು?", "Twitter-RoBERTa turi 124 647 939 parametrų. Kiek atminties reikia jo svoriams esant 32 bitų?"],
        options: [
          ["About 125 MB", "ಸುಮಾರು 125 MB", "Apie 125 MB"],
          ["About 250 MB", "ಸುಮಾರು 250 MB", "Apie 250 MB"],
          ["About 500 MB", "ಸುಮಾರು 500 MB", "Apie 500 MB"],
        ],
        correct: 2,
        why: ["124.6 million × 4 bytes ≈ 499 MB (the paper writes 17 to 500 MB for the Transformers).", "124.6 ಮಿಲಿಯನ್ × 4 ಬೈಟ್ ≈ 499 MB (ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳಿಗೆ ಪ್ರಬಂಧ 17 ರಿಂದ 500 MB ಎಂದು ಬರೆಯುತ್ತದೆ).", "124,6 mln. × 4 baitai ≈ 499 MB (straipsnis transformeriams nurodo 17–500 MB)."],
        verify: () => Math.round(memoryMB(byTag("pt_twitter_roberta").params)) === 499 && Math.round(memoryMB(byTag("ft_bert-tiny_8000").params)) === 18,
      },
      {
        q: ["Why should the training times be read as upper bounds?", "ತರಬೇತಿ ಸಮಯಗಳನ್ನು ಮೇಲಿನ ಮಿತಿಗಳಾಗಿ ಏಕೆ ಓದಬೇಕು?", "Kodėl mokymo laikus reikia vertinti kaip viršutines ribas?"],
        options: [
          ["The laptop was also used for other tasks during the longest runs", "ಅತಿ ಉದ್ದದ ಚಾಲನೆಗಳ ಸಮಯದಲ್ಲಿ ಲ್ಯಾಪ್‌ಟಾಪ್ ಅನ್ನು ಇತರ ಕೆಲಸಗಳಿಗೂ ಬಳಸಲಾಗಿತ್ತು", "Ilgiausių paleidimų metu kompiuteris buvo naudojamas ir kitam darbui"],
          ["A GPU was used", "GPU ಬಳಸಲಾಗಿತ್ತು", "Buvo naudotas GPU"],
          ["The models were also pre-trained", "ಮಾದರಿಗಳನ್ನು ಪೂರ್ವ-ತರಬೇತಿಯನ್ನೂ ಮಾಡಲಾಗಿತ್ತು", "Modeliai taip pat buvo mokomi iš anksto"],
        ],
        correct: 0,
        why: ["The paper says other work slowed the longest runs. Nothing was pre-trained (only fine-tuned) and no GPU was used, so the orders of magnitude are reliable and the exact seconds are not.", "ಇತರ ಕೆಲಸ ಅತಿ ಉದ್ದದ ಚಾಲನೆಗಳನ್ನು ನಿಧಾನಗೊಳಿಸಿತು ಎಂದು ಪ್ರಬಂಧ ಹೇಳುತ್ತದೆ. ಏನನ್ನೂ ಪೂರ್ವ-ತರಬೇತಿ ಮಾಡಿಲ್ಲ (ಫೈನ್-ಟ್ಯೂನ್ ಮಾತ್ರ) ಮತ್ತು GPU ಬಳಸಿಲ್ಲ, ಆದ್ದರಿಂದ ಮಟ್ಟಗಳು ನಂಬಲರ್ಹ, ನಿಖರ ಸೆಕೆಂಡ್‌ಗಳು ಅಲ್ಲ.", "Straipsnis sako, kad kitas darbas sulėtino ilgiausius paleidimus. Niekas nebuvo mokomas iš anksto (tik sutikslinimas) ir GPU nenaudotas, todėl dydžių eilės patikimos, o tikslios sekundės – ne."],
      },
    ],
    takeaways: [
      ["TF-IDF models classify in about 0.05 ms and train in seconds; Transformers need 1 to 107 ms and minutes to hours.", "TF-IDF ಮಾದರಿಗಳು ಸುಮಾರು 0.05 ms ನಲ್ಲಿ ವರ್ಗೀಕರಿಸುತ್ತವೆ ಮತ್ತು ಸೆಕೆಂಡ್‌ಗಳಲ್ಲಿ ತರಬೇತಿ ಪಡೆಯುತ್ತವೆ; ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳಿಗೆ 1 ರಿಂದ 107 ms ಮತ್ತು ನಿಮಿಷಗಳಿಂದ ಗಂಟೆಗಳು ಬೇಕು.", "TF-IDF modeliai klasifikuoja per ~0,05 ms ir išmoksta per sekundes; transformeriams reikia 1–107 ms ir minučių ar valandų."],
      ["The weights of the Transformers take about 17 to 500 MB at 32 bit.", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳ ತೂಕಗಳಿಗೆ 32 ಬಿಟ್‌ನಲ್ಲಿ ಸುಮಾರು 17 ರಿಂದ 500 MB ಬೇಕು.", "Transformerių svoriai užima apie 17–500 MB esant 32 bitams."],
      ["Times come from one partly busy laptop: trust orders of magnitude, not exact seconds.", "ಸಮಯಗಳು ಭಾಗಶಃ ಕಾರ್ಯನಿರತ ಒಂದು ಲ್ಯಾಪ್‌ಟಾಪ್‌ನಿಂದ: ಮಟ್ಟಗಳನ್ನು ನಂಬಿ, ನಿಖರ ಸೆಕೆಂಡ್‌ಗಳನ್ನು ಅಲ್ಲ.", "Laikai gauti iš vieno iš dalies užimto kompiuterio: pasitikėkite dydžių eilėmis, o ne tiksliomis sekundėmis."],
    ],
    mistakes: [
      ["Comparing latencies on a linear axis: the classical models would all sit at zero.", "ವಿಳಂಬಗಳನ್ನು ರೇಖೀಯ ಅಕ್ಷದಲ್ಲಿ ಹೋಲಿಸುವುದು: ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಗಳೆಲ್ಲ ಸೊನ್ನೆಯಲ್ಲಿ ಇರುತ್ತಿದ್ದವು.", "Delsų lyginimas tiesinėje ašyje: visi klasikiniai modeliai atsidurtų ties nuliu."],
      ["Mixing up training cost (once) and inference cost (every sentence).", "ತರಬೇತಿ ವೆಚ್ಚ (ಒಮ್ಮೆ) ಮತ್ತು ಅನುಮಾನ ವೆಚ್ಚ (ಪ್ರತಿ ವಾಕ್ಯ) ಗೊಂದಲ ಮಾಡುವುದು.", "Mokymo kainos (vieną kartą) ir išvados kainos (kiekvienam sakiniui) painiojimas."],
    ],
  },

  efficiency: {
    goal: [
      "Read the learning curves: how many labelled sentences BERT-small and TF-IDF need, and what “matches the SVM with 16 times less data” means.",
      "ಕಲಿಕೆ ರೇಖೆಗಳನ್ನು ಓದಿ: BERT-small ಮತ್ತು TF-IDF ಗೆ ಎಷ್ಟು ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳು ಬೇಕು, ಮತ್ತು “16 ಪಟ್ಟು ಕಡಿಮೆ ಡೇಟಾದಲ್ಲಿ SVM ಗೆ ಸಮ” ಎಂದರೇನು.",
      "Perskaitykite mokymosi kreives: kiek pažymėtų sakinių reikia BERT-small ir TF-IDF ir ką reiškia „prilygsta SVM su 16 kartų mažiau duomenų“.",
    ],
    fit: [
      "Labelled data is often the scarce resource, especially for smaller languages. The curves show where pre-training pays most.",
      "ಲೇಬಲ್ ಮಾಡಿದ ಡೇಟಾ ಹೆಚ್ಚಾಗಿ ಕೊರತೆಯ ಸಂಪನ್ಮೂಲ, ವಿಶೇಷವಾಗಿ ಚಿಕ್ಕ ಭಾಷೆಗಳಿಗೆ. ಪೂರ್ವ-ತರಬೇತಿ ಎಲ್ಲಿ ಹೆಚ್ಚು ಲಾಭ ನೀಡುತ್ತದೆ ಎಂದು ರೇಖೆಗಳು ತೋರಿಸುತ್ತವೆ.",
      "Pažymėti duomenys dažnai yra trūkstamas išteklius, ypač mažesnėms kalboms. Kreivės rodo, kur išankstinis mokymas atsiperka labiausiai.",
    ],
    keywords: [
      [["Learning curve", "ಕಲಿಕೆ ರೇಖೆ", "Mokymosi kreivė"], ["Test accuracy as a function of the number of training examples.", "ತರಬೇತಿ ಉದಾಹರಣೆಗಳ ಸಂಖ್ಯೆಯ ಫಂಕ್ಷನ್ ಆಗಿ ಪರೀಕ್ಷಾ ನಿಖರತೆ.", "Testo tikslumas kaip mokymo pavyzdžių skaičiaus funkcija."]],
      [["Pre-training", "ಪೂರ್ವ-ತರಬೇತಿ", "Išankstinis mokymas"], ["General language knowledge learned before the task data.", "ಕಾರ್ಯ ಡೇಟಾಗೆ ಮೊದಲು ಕಲಿತ ಸಾಮಾನ್ಯ ಭಾಷಾ ಜ್ಞಾನ.", "Bendros kalbos žinios, išmoktos prieš užduoties duomenis."]],
      [["Interpolation", "ಅಂತರ್ಗತ ಲೆಕ್ಕ", "Interpoliacija"], ["An estimate between two measured points; not a measurement.", "ಎರಡು ಅಳೆದ ಬಿಂದುಗಳ ನಡುವಿನ ಅಂದಾಜು; ಅಳತೆಯಲ್ಲ.", "Įvertis tarp dviejų išmatuotų taškų; ne matavimas."]],
    ],
    tasks: [
      ["Move the slider to 500 and read the difference.", "ಸ್ಲೈಡರ್ ಅನ್ನು 500 ಕ್ಕೆ ಸರಿಸಿ ವ್ಯತ್ಯಾಸ ಓದಿ.", "Pastumkite slankiklį iki 500 ir perskaitykite skirtumą."],
      ["Move it to 4,000 and compare BERT-small with the dashed SVM line.", "4,000 ಕ್ಕೆ ಸರಿಸಿ BERT-small ಅನ್ನು ಚುಕ್ಕೆ SVM ಗೆರೆಯೊಂದಿಗೆ ಹೋಲಿಸಿ.", "Pastumkite iki 4 000 ir palyginkite BERT-small su brūkšnine SVM linija."],
      ["Find a size where the page says “interpolated”.", "ಪುಟ “ಅಂತರ್ಗತ” ಎನ್ನುವ ಗಾತ್ರ ಹುಡುಕಿ.", "Raskite dydį, kuriam puslapis sako „interpoliuota“."],
      ["Read how long BERT-small needed to fine-tune at each size.", "ಪ್ರತಿ ಗಾತ್ರದಲ್ಲಿ BERT-small ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಲು ಎಷ್ಟು ಸಮಯ ಬೇಕಾಯಿತು ಎಂದು ಓದಿ.", "Perskaitykite, kiek laiko BERT-small sutikslinti prireikė prie kiekvieno dydžio."],
    ],
    questions: [
      {
        q: ["With only 500 labelled sentences, how far ahead of TF-IDF logistic regression is BERT-small?", "ಕೇವಲ 500 ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳೊಂದಿಗೆ BERT-small TF-IDF ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್‌ಗಿಂತ ಎಷ್ಟು ಮುಂದಿದೆ?", "Su vos 500 pažymėtų sakinių, kiek BERT-small lenkia TF-IDF logistinę regresiją?"],
        options: [
          ["About 1.4 points", "ಸುಮಾರು 1.4 ಪಾಯಿಂಟ್", "Apie 1,4 punkto"],
          ["About 14 points", "ಸುಮಾರು 14 ಪಾಯಿಂಟ್", "Apie 14 punktų"],
          ["About 41 points", "ಸುಮಾರು 41 ಪಾಯಿಂಟ್", "Apie 41 punktą"],
        ],
        correct: 1,
        why: ["75.9 % against 61.8 %: 14.1 points. The pre-trained model already knows most of the words that the TF-IDF model has never seen.", "75.9 % ವಿರುದ್ಧ 61.8 %: 14.1 ಪಾಯಿಂಟ್. TF-IDF ಮಾದರಿ ಎಂದೂ ನೋಡದ ಹೆಚ್ಚಿನ ಪದಗಳು ಪೂರ್ವ-ತರಬೇತಿ ಮಾದರಿಗೆ ಈಗಾಗಲೇ ತಿಳಿದಿವೆ.", "75,9 % prieš 61,8 %: 14,1 punkto. Iš anksto išmokytas modelis jau žino daugumą žodžių, kurių TF-IDF modelis niekada nematė."],
        verify: () => ((curveAt("bert-small", 500) - curveAt("tfidf-lr", 500)) * 100).toFixed(1) === "14.1",
      },
      {
        q: ["BERT-small trained on 4,000 sentences reaches 82.7 %. Which model trained on all 65,349 sentences does it match?", "4,000 ವಾಕ್ಯಗಳಲ್ಲಿ ತರಬೇತಿ ಪಡೆದ BERT-small 82.7 % ತಲುಪುತ್ತದೆ. ಎಲ್ಲಾ 65,349 ವಾಕ್ಯಗಳಲ್ಲಿ ತರಬೇತಿ ಪಡೆದ ಯಾವ ಮಾದರಿಗೆ ಅದು ಸಮ?", "BERT-small, mokytas su 4 000 sakinių, pasiekia 82,7 %. Kokiam modeliui, mokytam su visais 65 349 sakiniais, jis prilygsta?"],
        options: [
          ["TF-IDF + linear SVM (82.9 %)", "TF-IDF + ರೇಖೀಯ SVM (82.9 %)", "TF-IDF + tiesinis SVM (82,9 %)"],
          ["DistilBERT-SST2 (91.1 %)", "DistilBERT-SST2 (91.1 %)", "DistilBERT-SST2 (91,1 %)"],
          ["BERT-tiny (76.6 %)", "BERT-tiny (76.6 %)", "BERT-tiny (76,6 %)"],
        ],
        correct: 0,
        why: ["The best classical model, the linear SVM, reaches 82.9 %: BERT-small matches it with about 16 times less labelled data (65,349 / 4,000).", "ಅತ್ಯುತ್ತಮ ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿ, ರೇಖೀಯ SVM, 82.9 % ತಲುಪುತ್ತದೆ: BERT-small ಸುಮಾರು 16 ಪಟ್ಟು ಕಡಿಮೆ ಲೇಬಲ್ ಡೇಟಾದಲ್ಲಿ ಅದಕ್ಕೆ ಸಮ (65,349 / 4,000).", "Geriausias klasikinis modelis, tiesinis SVM, pasiekia 82,9 %: BERT-small prilygsta jam su maždaug 16 kartų mažiau pažymėtų duomenų (65 349 / 4 000)."],
        verify: () => curveAt("bert-small", 4000).toFixed(3) === "0.827" && byTag("tfidf_svm").accuracy.toFixed(3) === "0.829" && Math.round(65349 / 4000) === 16 && CURVE["bert-small"][3].n === 4000,
      },
      {
        q: ["Between two measured points of the curve, the values on this page are…", "ರೇಖೆಯ ಎರಡು ಅಳೆದ ಬಿಂದುಗಳ ನಡುವೆ ಈ ಪುಟದ ಮೌಲ್ಯಗಳು…", "Tarp dviejų išmatuotų kreivės taškų šio puslapio reikšmės yra…"],
        options: [
          ["also measured in the experiment", "ಪ್ರಯೋಗದಲ್ಲಿ ಅಳೆದವೂ ಆಗಿವೆ", "taip pat išmatuotos eksperimente"],
          ["straight-line estimates on the log axis", "ಲಾಗ್ ಅಕ್ಷದಲ್ಲಿ ನೇರ ಗೆರೆ ಅಂದಾಜುಗಳು", "tiesinės interpoliacijos įverčiai log ašyje"],
          ["random numbers", "ಯಾದೃಚ್ಛಿಕ ಸಂಖ್ಯೆಗಳು", "atsitiktiniai skaičiai"],
        ],
        correct: 1,
        why: ["Only 500, 1,000, 2,000, 4,000 and 8,000 were trained. Everything in between is interpolated and the page says so.", "500, 1,000, 2,000, 4,000 ಮತ್ತು 8,000 ಮಾತ್ರ ತರಬೇತಿ ಮಾಡಲಾಗಿದೆ. ಮಧ್ಯದ ಎಲ್ಲವೂ ಅಂತರ್ಗತ ಲೆಕ್ಕ, ಪುಟ ಹಾಗೆಂದು ಹೇಳುತ್ತದೆ.", "Mokyta tik su 500, 1 000, 2 000, 4 000 ir 8 000. Viskas tarp jų interpoliuota, ir puslapis tai sako."],
        verify: () => CURVE["bert-small"].map((p) => p.n).join() === "500,1000,2000,4000,8000" && curveAt("bert-small", 1414) > CURVE["bert-small"][1].accuracy && curveAt("bert-small", 1414) < CURVE["bert-small"][2].accuracy,
      },
    ],
    takeaways: [
      ["Pre-training is worth most when labels are scarce: +14.1 points at 500, +6.2 at 8,000.", "ಲೇಬಲ್‌ಗಳು ಕಡಿಮೆ ಇದ್ದಾಗ ಪೂರ್ವ-ತರಬೇತಿ ಹೆಚ್ಚು ಮೌಲ್ಯದ್ದು: 500 ರಲ್ಲಿ +14.1 ಪಾಯಿಂಟ್, 8,000 ರಲ್ಲಿ +6.2.", "Išankstinis mokymas vertingiausias, kai etikečių mažai: +14,1 punkto prie 500, +6,2 prie 8 000."],
      ["BERT-small with 4,000 labels matches the SVM with 65,349.", "4,000 ಲೇಬಲ್‌ಗಳ BERT-small 65,349 ರ SVM ಗೆ ಸಮ.", "BERT-small su 4 000 etikečių prilygsta SVM su 65 349."],
      ["The curves are single runs on one random subset, and still rising at 8,000.", "ರೇಖೆಗಳು ಒಂದು ಯಾದೃಚ್ಛಿಕ ಉಪಗುಂಪಿನ ಒಂದೇ ಚಾಲನೆ, ಮತ್ತು 8,000 ರಲ್ಲೂ ಏರುತ್ತಿವೆ.", "Kreivės yra pavieniai paleidimai su vienu atsitiktiniu poaibiu ir ties 8 000 vis dar kyla."],
    ],
    mistakes: [
      ["Reading interpolated values as measurements.", "ಅಂತರ್ಗತ ಮೌಲ್ಯಗಳನ್ನು ಅಳತೆಗಳೆಂದು ಓದುವುದು.", "Interpoliuotų reikšmių laikymas matavimais."],
      ["Concluding that the advantage is constant: it shrinks as data grows.", "ಪ್ರಯೋಜನ ಸ್ಥಿರ ಎಂದು ತೀರ್ಮಾನಿಸುವುದು: ಡೇಟಾ ಬೆಳೆದಂತೆ ಅದು ಕುಗ್ಗುತ್ತದೆ.", "Išvada, kad pranašumas pastovus: jis mažėja augant duomenims."],
    ],
  },

  readymade: {
    goal: [
      "Tell the three ready-made models apart (in-domain, out-of-domain, zero-shot), see the paper's hypothesis template, and run the softmax toy.",
      "ಮೂರು ಸಿದ್ಧ ಮಾದರಿಗಳನ್ನು ಬೇರ್ಪಡಿಸಿ (ಅದೇ ಕ್ಷೇತ್ರ, ಬೇರೆ ಕ್ಷೇತ್ರ, ಜೀರೋ-ಶಾಟ್), ಪ್ರಬಂಧದ ಊಹೆ ಟೆಂಪ್ಲೇಟ್ ನೋಡಿ, ಮತ್ತು ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಆಟಿಕೆ ಚಲಾಯಿಸಿ.",
      "Atskirkite tris paruoštus modelius (tos pačios srities, kitos srities, zero-shot), pamatykite straipsnio hipotezės šabloną ir paleiskite softmax žaislą.",
    ],
    fit: [
      "You can often skip training: a public model for your domain, or a model that classifies from a sentence describing the label.",
      "ನೀವು ಹೆಚ್ಚಾಗಿ ತರಬೇತಿಯನ್ನೇ ಬಿಟ್ಟುಬಿಡಬಹುದು: ನಿಮ್ಮ ಕ್ಷೇತ್ರದ ಸಾರ್ವಜನಿಕ ಮಾದರಿ, ಅಥವಾ ಲೇಬಲ್ ವಿವರಿಸುವ ವಾಕ್ಯದಿಂದ ವರ್ಗೀಕರಿಸುವ ಮಾದರಿ.",
      "Dažnai mokymo galima išvis nedaryti: viešas modelis jūsų sričiai arba modelis, klasifikuojantis pagal etiketę aprašantį sakinį.",
    ],
    keywords: [
      [["In-domain model", "ಅದೇ ಕ್ಷೇತ್ರದ ಮಾದರಿ", "Tos pačios srities modelis"], ["Already trained for your task on your kind of text.", "ನಿಮ್ಮ ರೀತಿಯ ಪಠ್ಯದಲ್ಲಿ ನಿಮ್ಮ ಕಾರ್ಯಕ್ಕೆ ಈಗಾಗಲೇ ತರಬೇತಿ ಪಡೆದಿದೆ.", "Jau išmokytas jūsų užduočiai su jūsų tipo tekstu."]],
      [["Zero-shot", "ಜೀರೋ-ಶಾಟ್", "Zero-shot"], ["Classifying without any labelled example of the task.", "ಕಾರ್ಯದ ಯಾವುದೇ ಲೇಬಲ್ ಮಾಡಿದ ಉದಾಹರಣೆ ಇಲ್ಲದೆ ವರ್ಗೀಕರಣ.", "Klasifikavimas be jokio pažymėto užduoties pavyzdžio."]],
      [["NLI (entailment)", "NLI (ಅಂತರ್ಗತ)", "NLI (įtraukimas)"], ["Does the premise imply the hypothesis?", "ಪೂರ್ವಭಾವನೆ ಊಹೆಯನ್ನು ಸೂಚಿಸುತ್ತದೆಯೇ?", "Ar prielaida implikuoja hipotezę?"]],
      [["Softmax", "ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್", "Softmax"], ["Turns scores into probabilities that sum to one.", "ಅಂಕಗಳನ್ನು ಮೊತ್ತ ಒಂದಾಗುವ ಸಂಭಾವ್ಯತೆಗಳಾಗಿ ಬದಲಿಸುತ್ತದೆ.", "Paverčia įverčius tikimybėmis, kurių suma lygi vienam."]],
    ],
    tasks: [
      ["Read the three model cards and note which one needs no training.", "ಮೂರು ಮಾದರಿ ಕಾರ್ಡ್‌ಗಳನ್ನು ಓದಿ ಯಾವುದಕ್ಕೆ ತರಬೇತಿ ಬೇಕಿಲ್ಲ ಎಂದು ಗಮನಿಸಿ.", "Perskaitykite tris modelių korteles ir pažymėkite, kuriam mokymo nereikia."],
      ["Compare the recall of positive and negative sentences for the zero-shot model.", "ಜೀರೋ-ಶಾಟ್ ಮಾದರಿಗೆ ಧನಾತ್ಮಕ ಮತ್ತು ಋಣಾತ್ಮಕ ವಾಕ್ಯಗಳ ರಿಕಾಲ್ ಹೋಲಿಸಿ.", "Palyginkite teigiamų ir neigiamų sakinių pilnumą zero-shot modeliui."],
      ["In the toy, set both scores equal and read the probabilities.", "ಆಟಿಕೆಯಲ್ಲಿ ಎರಡೂ ಅಂಕಗಳನ್ನು ಸಮ ಮಾಡಿ ಸಂಭಾವ್ಯತೆಗಳನ್ನು ಓದಿ.", "Žaisle nustatykite abu įverčius vienodus ir perskaitykite tikimybes."],
      ["Read the template in the code and say what the {} stands for.", "ಕೋಡ್‌ನಲ್ಲಿ ಟೆಂಪ್ಲೇಟ್ ಓದಿ, {} ಯಾವುದನ್ನು ಸೂಚಿಸುತ್ತದೆ ಎಂದು ಹೇಳಿ.", "Perskaitykite šabloną kode ir pasakykite, ką žymi {}."],
    ],
    questions: [
      {
        q: ["How many points did Twitter-RoBERTa lose against DistilBERT-SST2?", "Twitter-RoBERTa DistilBERT-SST2 ಗೆ ಹೋಲಿಸಿ ಎಷ್ಟು ಪಾಯಿಂಟ್ ಕಳೆದುಕೊಂಡಿತು?", "Kiek punktų Twitter-RoBERTa prarado, palyginti su DistilBERT-SST2?"],
        options: [
          ["About 0.5 points", "ಸುಮಾರು 0.5 ಪಾಯಿಂಟ್", "Apie 0,5 punkto"],
          ["About 5.3 points", "ಸುಮಾರು 5.3 ಪಾಯಿಂಟ್", "Apie 5,3 punkto"],
          ["About 15 points", "ಸುಮಾರು 15 ಪಾಯಿಂಟ್", "Apie 15 punktų"],
        ],
        correct: 1,
        why: ["91.1 % against 85.8 %. The tweet model still beats every classical model, but a model for another domain gives up several points.", "91.1 % ವಿರುದ್ಧ 85.8 %. ಟ್ವೀಟ್ ಮಾದರಿ ಇನ್ನೂ ಪ್ರತಿ ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಯನ್ನು ಮೀರಿಸುತ್ತದೆ, ಆದರೆ ಬೇರೆ ಕ್ಷೇತ್ರದ ಮಾದರಿ ಹಲವು ಪಾಯಿಂಟ್ ಬಿಟ್ಟುಕೊಡುತ್ತದೆ.", "91,1 % prieš 85,8 %. Tviterio modelis vis tiek lenkia visus klasikinius modelius, bet kitos srities modelis praranda kelis punktus."],
        verify: () => ((byTag("pt_distilbert_sst2").accuracy - byTag("pt_twitter_roberta").accuracy) * 100).toFixed(1) === "5.3" && byTag("pt_twitter_roberta").accuracy > Math.max(...["tfidf_nb", "tfidf_logreg", "tfidf_svm"].map((t) => byTag(t).accuracy)),
      },
      {
        q: ["The zero-shot model never saw a sentiment label. What accuracy did it reach?", "ಜೀರೋ-ಶಾಟ್ ಮಾದರಿ ಎಂದೂ ಭಾವನೆ ಲೇಬಲ್ ನೋಡಿಲ್ಲ. ಅದು ಯಾವ ನಿಖರತೆ ತಲುಪಿತು?", "Zero-shot modelis niekada nematė nuotaikų etikečių. Kokį tikslumą jis pasiekė?"],
        options: [
          ["About 50 %, which is chance", "ಸುಮಾರು 50 %, ಅಂದರೆ ಆಕಸ್ಮಿಕ", "Apie 50 %, tai atsitiktinumas"],
          ["About 91 %, like the best model", "ಸುಮಾರು 91 %, ಅತ್ಯುತ್ತಮ ಮಾದರಿಯಂತೆ", "Apie 91 %, kaip geriausias modelis"],
          ["About 81.8 %, like logistic regression trained on 65 thousand sentences", "ಸುಮಾರು 81.8 %, 65 ಸಾವಿರ ವಾಕ್ಯಗಳಲ್ಲಿ ತರಬೇತಿ ಪಡೆದ ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್‌ನಂತೆ", "Apie 81,8 %, kaip logistinė regresija, mokyta iš 65 tūkstančių sakinių"],
        ],
        correct: 2,
        why: ["81.8 % against 81.9 % for TF-IDF logistic regression: general language understanding from pre-training is enough for a usable baseline, at the highest latency.", "81.8 % ವಿರುದ್ಧ TF-IDF ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್‌ನ 81.9 %: ಪೂರ್ವ-ತರಬೇತಿಯಿಂದ ಬಂದ ಸಾಮಾನ್ಯ ಭಾಷಾ ತಿಳಿವಳಿಕೆ ಬಳಸಬಹುದಾದ ಮೂಲ ಮಟ್ಟಕ್ಕೆ ಸಾಕು, ಅತಿ ಹೆಚ್ಚು ವಿಳಂಬದಲ್ಲಿ.", "81,8 % prieš 81,9 % TF-IDF logistinei regresijai: bendra kalbos supratimas iš išankstinio mokymo pakanka naudingam baziniam lygiui, bet su didžiausia delsa."],
        verify: () => byTag("zs_nli_distilroberta").accuracy.toFixed(3) === "0.818" && byTag("tfidf_logreg").accuracy.toFixed(3) === "0.819" && byTag("zs_nli_distilroberta").latencyMs === Math.max(...MODELS.map((m) => m.latencyMs)),
      },
      {
        q: ["In the toy, both entailment scores are equal. What does softmax return?", "ಆಟಿಕೆಯಲ್ಲಿ ಎರಡೂ ಅಂತರ್ಗತ ಅಂಕಗಳು ಸಮ. ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಏನು ಹಿಂದಿರುಗಿಸುತ್ತದೆ?", "Žaisle abu įtraukimo įverčiai lygūs. Ką grąžina softmax?"],
        options: [
          ["100 % and 0 %", "100 % ಮತ್ತು 0 %", "100 % ir 0 %"],
          ["50 % and 50 %", "50 % ಮತ್ತು 50 %", "50 % ir 50 %"],
          ["An error", "ದೋಷ", "Klaidą"],
        ],
        correct: 1,
        why: ["softmax divides e^score by the sum of e^scores, so equal scores give equal probabilities. The label is then a coin toss, which is what a real model's near-tie means.", "softmax e^ಅಂಕವನ್ನು e^ಅಂಕಗಳ ಮೊತ್ತದಿಂದ ಭಾಗಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಸಮ ಅಂಕಗಳು ಸಮ ಸಂಭಾವ್ಯತೆ ನೀಡುತ್ತವೆ. ಆಗ ಲೇಬಲ್ ನಾಣ್ಯ ಎಸೆತ, ನಿಜವಾದ ಮಾದರಿಯ ಹತ್ತಿರದ ಸಮಬಲದ ಅರ್ಥ ಅದೇ.", "softmax dalija e^įvertį iš e^įverčių sumos, todėl vienodi įverčiai duoda vienodas tikimybes. Etiketė tada yra monetos metimas – tai ir reiškia artimas lygiųjų rezultatas tikrame modelyje."],
        verify: () => softmax([2, 2])[0] === 0.5 && Math.abs(softmax([3.2, -2.6])[0] + softmax([3.2, -2.6])[1] - 1) < 1e-12,
      },
    ],
    takeaways: [
      ["A public model fine-tuned on your task and domain is the best case: 91.1 % with no training.", "ನಿಮ್ಮ ಕಾರ್ಯ ಮತ್ತು ಕ್ಷೇತ್ರದಲ್ಲಿ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ ಸಾರ್ವಜನಿಕ ಮಾದರಿ ಅತ್ಯುತ್ತಮ ಸಂದರ್ಭ: ತರಬೇತಿ ಇಲ್ಲದೆ 91.1 %.", "Viešas modelis, sutikslintas jūsų užduočiai ir sričiai, yra geriausias atvejis: 91,1 % be mokymo."],
      ["Another domain costs about 5 points; zero-shot reaches the classical level at the highest latency.", "ಬೇರೆ ಕ್ಷೇತ್ರಕ್ಕೆ ಸುಮಾರು 5 ಪಾಯಿಂಟ್ ವೆಚ್ಚ; ಜೀರೋ-ಶಾಟ್ ಅತಿ ಹೆಚ್ಚು ವಿಳಂಬದಲ್ಲಿ ಕ್ಲಾಸಿಕಲ್ ಮಟ್ಟ ತಲುಪುತ್ತದೆ.", "Kita sritis kainuoja apie 5 punktus; zero-shot pasiekia klasikinį lygį su didžiausia delsa."],
      ["The toy only shows the softmax step; its numbers are invented.", "ಆಟಿಕೆ ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಹಂತವನ್ನು ಮಾತ್ರ ತೋರಿಸುತ್ತದೆ; ಅದರ ಸಂಖ್ಯೆಗಳು ಕಲ್ಪಿತ.", "Žaislas rodo tik softmax žingsnį; jo skaičiai išgalvoti."],
    ],
    mistakes: [
      ["Reading the toy probabilities as the real model's confidence.", "ಆಟಿಕೆ ಸಂಭಾವ್ಯತೆಗಳನ್ನು ನಿಜವಾದ ಮಾದರಿಯ ವಿಶ್ವಾಸವೆಂದು ಓದುವುದು.", "Žaislo tikimybių laikymas tikro modelio pasitikėjimu."],
      ["Assuming a model fine-tuned on tweets works as well on film reviews.", "ಟ್ವೀಟ್‌ಗಳಲ್ಲಿ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ ಮಾದರಿ ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆಗಳಲ್ಲೂ ಅಷ್ಟೇ ಚೆನ್ನಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ಭಾವಿಸುವುದು.", "Manymas, kad tviterio žinutėms sutikslintas modelis filmų apžvalgoms veikia taip pat gerai."],
    ],
  },

  errors: {
    goal: [
      "Measure how much each model loses on sentences with negation and contrast, recompute the two subsets from the rules, and explore every test sentence in the sentence lab.",
      "ನಿರಾಕರಣೆ ಮತ್ತು ವೈರುದ್ಧ್ಯದ ವಾಕ್ಯಗಳಲ್ಲಿ ಪ್ರತಿ ಮಾದರಿ ಎಷ್ಟು ಕಳೆದುಕೊಳ್ಳುತ್ತದೆ ಎಂದು ಅಳೆಯಿರಿ, ನಿಯಮಗಳಿಂದ ಎರಡು ಉಪಗುಂಪುಗಳನ್ನು ಮರು ಲೆಕ್ಕಿಸಿ, ಮತ್ತು ವಾಕ್ಯ ಪ್ರಯೋಗಾಲಯದಲ್ಲಿ ಪ್ರತಿ ಪರೀಕ್ಷಾ ವಾಕ್ಯವನ್ನು ಅನ್ವೇಷಿಸಿ.",
      "Išmatuokite, kiek kiekvienas modelis praranda sakiniuose su neigimu ir kontrastu, perskaičiuokite du poaibius pagal taisykles ir naršykite kiekvieną testo sakinį sakinių laboratorijoje.",
    ],
    fit: [
      "Overall accuracy hides where models break. Negation and contrast are the cases where counting words fails and context should help.",
      "ಒಟ್ಟು ನಿಖರತೆ ಮಾದರಿಗಳು ಎಲ್ಲಿ ಒಡೆಯುತ್ತವೆ ಎಂದು ಮರೆಮಾಡುತ್ತದೆ. ನಿರಾಕರಣೆ ಮತ್ತು ವೈರುದ್ಧ್ಯ ಪದ ಎಣಿಕೆ ವಿಫಲವಾಗುವ ಮತ್ತು ಸಂದರ್ಭ ಸಹಾಯ ಮಾಡಬೇಕಾದ ಪ್ರಕರಣಗಳು.",
      "Bendras tikslumas slepia, kur modeliai lūžta. Neigimas ir kontrastas yra atvejai, kai žodžių skaičiavimas nepavyksta, o kontekstas turėtų padėti.",
    ],
    keywords: [
      [["Negation", "ನಿರಾಕರಣೆ", "Neigimas"], ["Words such as not, no, never that flip the meaning.", "not, no, never ಮುಂತಾದ ಅರ್ಥ ತಿರುಗಿಸುವ ಪದಗಳು.", "Žodžiai, tokie kaip not, no, never, apverčiantys prasmę."]],
      [["Contrast", "ವೈರುದ್ಧ್ಯ", "Kontrastas"], ["Markers such as but, although, however: two clauses that disagree.", "but, although, however ಮುಂತಾದ ಗುರುತುಗಳು: ಭಿನ್ನಾಭಿಪ್ರಾಯದ ಎರಡು ವಾಕ್ಯಾಂಶಗಳು.", "Žymekliai, tokie kaip but, although, however: dvi nesutampančios dalys."]],
      [["Subset", "ಉಪಗುಂಪು", "Poaibis"], ["The test sentences that match a rule.", "ನಿಯಮಕ್ಕೆ ಹೊಂದುವ ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳು.", "Testo sakiniai, atitinkantys taisyklę."]],
      [["Attention sink", "ಅಟೆನ್ಷನ್ ಸಿಂಕ್", "Dėmesio kriauklė"], ["A token, often punctuation, that collects much attention.", "ಹೆಚ್ಚಿನ ಅಟೆನ್ಷನ್ ಸಂಗ್ರಹಿಸುವ ಟೋಕನ್, ಹೆಚ್ಚಾಗಿ ವಿರಾಮಚಿಹ್ನೆ.", "Žetonas, dažnai skyrybos ženklas, surenkantis daug dėmesio."]],
    ],
    tasks: [
      ["Sort the subset table by “Δ negation” and find who loses most and least.", "ಉಪಗುಂಪು ಕೋಷ್ಟಕವನ್ನು “Δ ನಿರಾಕರಣೆ” ಯಿಂದ ವಿಂಗಡಿಸಿ ಯಾರು ಹೆಚ್ಚು, ಕಡಿಮೆ ಕಳೆದುಕೊಳ್ಳುತ್ತಾರೆ ಎಂದು ಹುಡುಕಿ.", "Surikiuokite poaibių lentelę pagal „Δ neigimas“ ir raskite, kas praranda daugiausia ir mažiausia."],
      ["Check that the rules give 184 and 130 sentences.", "ನಿಯಮಗಳು 184 ಮತ್ತು 130 ವಾಕ್ಯಗಳನ್ನು ನೀಡುತ್ತವೆ ಎಂದು ಪರಿಶೀಲಿಸಿ.", "Patikrinkite, ar taisyklės duoda 184 ir 130 sakinių."],
      ["In the sentence lab, show “SVM right, fine-tuned DistilBERT wrong” and read three sentences.", "ವಾಕ್ಯ ಪ್ರಯೋಗಾಲಯದಲ್ಲಿ “SVM ಸರಿ, ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT ತಪ್ಪು” ತೋರಿಸಿ ಮೂರು ವಾಕ್ಯ ಓದಿ.", "Sakinių laboratorijoje parodykite „SVM teisingas, sutikslintas DistilBERT klysta“ ir perskaitykite tris sakinius."],
      ["Search for “never” and see which models agree.", "“never” ಹುಡುಕಿ ಯಾವ ಮಾದರಿಗಳು ಒಪ್ಪುತ್ತವೆ ಎಂದು ನೋಡಿ.", "Ieškokite „never“ ir pažiūrėkite, kurie modeliai sutaria."],
    ],
    questions: [
      {
        q: ["How many of the 872 test sentences contain a negation word by the paper's rule?", "872 ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳಲ್ಲಿ ಪ್ರಬಂಧದ ನಿಯಮದ ಪ್ರಕಾರ ಎಷ್ಟು ನಿರಾಕರಣೆ ಪದ ಹೊಂದಿವೆ?", "Kiek iš 872 testo sakinių pagal straipsnio taisyklę turi neigimo žodį?"],
        options: [
          ["130", "130", "130"],
          ["184", "184", "184"],
          ["872", "872", "872"],
        ],
        correct: 1,
        why: ["184 sentences have negation and 130 have contrast; some have both.", "184 ವಾಕ್ಯಗಳಲ್ಲಿ ನಿರಾಕರಣೆ ಮತ್ತು 130 ರಲ್ಲಿ ವೈರುದ್ಧ್ಯ ಇದೆ; ಕೆಲವಕ್ಕೆ ಎರಡೂ ಇವೆ.", "184 sakiniai turi neigimą, 130 – kontrastą; kai kurie turi abu."],
        verify: () => SUBSET_SIZES.negation === 184 && SUBSET_SIZES.contrast === 130,
      },
      {
        q: ["On negation sentences, which model loses almost nothing?", "ನಿರಾಕರಣೆ ವಾಕ್ಯಗಳಲ್ಲಿ ಯಾವ ಮಾದರಿ ಬಹುತೇಕ ಏನೂ ಕಳೆದುಕೊಳ್ಳುವುದಿಲ್ಲ?", "Kuris modelis neigimo sakiniuose praranda beveik nieko?"],
        options: [
          ["TF-IDF + linear SVM", "TF-IDF + ರೇಖೀಯ SVM", "TF-IDF + tiesinis SVM"],
          ["BERT-small", "BERT-small", "BERT-small"],
          ["The zero-shot NLI model", "ಜೀರೋ-ಶಾಟ್ NLI ಮಾದರಿ", "Zero-shot NLI modelis"],
        ],
        correct: 2,
        why: ["The zero-shot NLI model changes by −0.2 points; NLI training specifically teaches negation and contradiction. The SVM loses 8.5 and BERT-small 9.3 points.", "ಜೀರೋ-ಶಾಟ್ NLI ಮಾದರಿ −0.2 ಪಾಯಿಂಟ್ ಬದಲಾಗುತ್ತದೆ; NLI ತರಬೇತಿ ನಿರಾಕರಣೆ ಮತ್ತು ವಿರೋಧವನ್ನು ವಿಶೇಷವಾಗಿ ಕಲಿಸುತ್ತದೆ. SVM 8.5 ಮತ್ತು BERT-small 9.3 ಪಾಯಿಂಟ್ ಕಳೆದುಕೊಳ್ಳುತ್ತವೆ.", "Zero-shot NLI modelis pasikeičia −0,2 punkto; NLI mokymas specialiai moko neigimo ir prieštaravimo. SVM praranda 8,5, o BERT-small – 9,3 punkto."],
        verify: () => {
          const d = (t: string) => (SUBSETS[t].negation - SUBSETS[t].all) * 100;
          return d("zs_nli_distilroberta").toFixed(1) === "-0.2" && d("tfidf_svm").toFixed(1) === "-8.5" && d("ft_bert-small_8000").toFixed(1) === "-9.3";
        },
      },
      {
        q: ["What does the attention heat map prove about the model's decision?", "ಅಟೆನ್ಷನ್ ಹೀಟ್ ಮ್ಯಾಪ್ ಮಾದರಿಯ ನಿರ್ಧಾರದ ಬಗ್ಗೆ ಏನನ್ನು ಸಾಬೀತುಪಡಿಸುತ್ತದೆ?", "Ką šilumos žemėlapis įrodo apie modelio sprendimą?"],
        options: [
          ["Exactly how it reasons", "ಅದು ಹೇಗೆ ತರ್ಕಿಸುತ್ತದೆ ಎಂದು ನಿಖರವಾಗಿ", "Tiksliai, kaip jis samprotauja"],
          ["Nothing by itself: it illustrates information flow and is not a faithful explanation", "ತಾನಾಗಿ ಏನೂ ಇಲ್ಲ: ಅದು ಮಾಹಿತಿ ಹರಿವನ್ನು ಚಿತ್ರಿಸುತ್ತದೆ, ನಿಷ್ಠ ವಿವರಣೆ ಅಲ್ಲ", "Pats savaime nieko: jis iliustruoja informacijos srautą ir nėra ištikimas paaiškinimas"],
          ["The sentiment score of each word", "ಪ್ರತಿ ಪದದ ಭಾವನೆ ಅಂಕ", "Kiekvieno žodžio nuotaikos įvertį"],
        ],
        correct: 1,
        why: ["Jain and Wallace (2019) showed that attention weights are not necessarily faithful explanations. The picture is an illustration.", "ಅಟೆನ್ಷನ್ ತೂಕಗಳು ನಿಷ್ಠ ವಿವರಣೆಗಳಾಗಿರಬೇಕೆಂದಿಲ್ಲ ಎಂದು Jain ಮತ್ತು Wallace (2019) ತೋರಿಸಿದರು. ಚಿತ್ರ ಒಂದು ಚಿತ್ರಣ.", "Jain ir Wallace (2019) parodė, kad dėmesio svoriai nebūtinai yra ištikimi paaiškinimai. Paveikslas yra iliustracija."],
      },
    ],
    takeaways: [
      ["Bag-of-words models lose 8 to 9 points on negation; large Transformers 2 to 4.", "ಪದಗಳ ಚೀಲ ಮಾದರಿಗಳು ನಿರಾಕರಣೆಯಲ್ಲಿ 8 ರಿಂದ 9 ಪಾಯಿಂಟ್ ಕಳೆದುಕೊಳ್ಳುತ್ತವೆ; ದೊಡ್ಡ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು 2 ರಿಂದ 4.", "Žodžių maišo modeliai neigime praranda 8–9 punktus; dideli transformeriai – 2–4."],
      ["BERT-small and BERT-tiny behave like the classical models: capacity and pre-training both matter.", "BERT-small ಮತ್ತು BERT-tiny ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಗಳಂತೆ ವರ್ತಿಸುತ್ತವೆ: ಸಾಮರ್ಥ್ಯ ಮತ್ತು ಪೂರ್ವ-ತರಬೇತಿ ಎರಡೂ ಮುಖ್ಯ.", "BERT-small ir BERT-tiny elgiasi kaip klasikiniai modeliai: svarbi ir talpa, ir išankstinis mokymas."],
      ["Keyword subsets are a simple proxy; the sentence lab lets you check the real sentences.", "ಕೀವರ್ಡ್ ಉಪಗುಂಪುಗಳು ಸರಳ ಪ್ರತಿನಿಧಿ; ನಿಜವಾದ ವಾಕ್ಯಗಳನ್ನು ವಾಕ್ಯ ಪ್ರಯೋಗಾಲಯದಲ್ಲಿ ಪರಿಶೀಲಿಸಬಹುದು.", "Raktažodžių poaibiai yra paprastas pakaitalas; sakinių laboratorijoje galite patikrinti tikrus sakinius."],
    ],
    mistakes: [
      ["Treating the keyword rules as a perfect detector of negation.", "ಕೀವರ್ಡ್ ನಿಯಮಗಳನ್ನು ನಿರಾಕರಣೆಯ ಪರಿಪೂರ್ಣ ಪತ್ತೆಕಾರ ಎಂದು ಪರಿಗಣಿಸುವುದು.", "Raktažodžių taisyklių laikymas tobulu neigimo detektoriumi."],
      ["Explaining a prediction with an attention picture alone.", "ಅಟೆನ್ಷನ್ ಚಿತ್ರದಿಂದ ಮಾತ್ರ ಭವಿಷ್ಯವಾಣಿಯನ್ನು ವಿವರಿಸುವುದು.", "Prognozės aiškinimas vien dėmesio paveikslu."],
    ],
  },

  decide: {
    goal: [
      "Turn the paper's four recommendations into decisions for situations of your own, and defend each answer with numbers.",
      "ಪ್ರಬಂಧದ ನಾಲ್ಕು ಶಿಫಾರಸುಗಳನ್ನು ನಿಮ್ಮದೇ ಸ್ಥಿತಿಗಳ ನಿರ್ಧಾರಗಳಾಗಿ ಬದಲಿಸಿ, ಪ್ರತಿ ಉತ್ತರವನ್ನು ಸಂಖ್ಯೆಗಳಿಂದ ಸಮರ್ಥಿಸಿ.",
      "Paverskite keturias straipsnio rekomendacijas sprendimais savo situacijoms ir pagrįskite kiekvieną atsakymą skaičiais.",
    ],
    fit: [
      "The point of the experiment is a choice: reuse, fine-tune, zero-shot, or TF-IDF. The right choice depends on labels, speed and hardware, not on the highest score.",
      "ಪ್ರಯೋಗದ ಉದ್ದೇಶ ಒಂದು ಆಯ್ಕೆ: ಮರುಬಳಕೆ, ಫೈನ್-ಟ್ಯೂನ್, ಜೀರೋ-ಶಾಟ್ ಅಥವಾ TF-IDF. ಸರಿಯಾದ ಆಯ್ಕೆ ಲೇಬಲ್‌ಗಳು, ವೇಗ ಮತ್ತು ಯಂತ್ರಾಂಶವನ್ನು ಅವಲಂಬಿಸುತ್ತದೆ, ಅತ್ಯಧಿಕ ಅಂಕವನ್ನಲ್ಲ.",
      "Eksperimento tikslas – pasirinkimas: pakartotinis naudojimas, sutikslinimas, zero-shot ar TF-IDF. Tinkamas pasirinkimas priklauso nuo etikečių, greičio ir įrangos, o ne nuo aukščiausio balo.",
    ],
    keywords: [
      [["Reuse", "ಮರುಬಳಕೆ", "Pakartotinis naudojimas"], ["Take a public model that already fits your task and domain.", "ನಿಮ್ಮ ಕಾರ್ಯ ಮತ್ತು ಕ್ಷೇತ್ರಕ್ಕೆ ಈಗಾಗಲೇ ಹೊಂದುವ ಸಾರ್ವಜನಿಕ ಮಾದರಿ ತೆಗೆದುಕೊಳ್ಳಿ.", "Paimkite viešą modelį, jau tinkantį jūsų užduočiai ir sričiai."]],
      [["Fine-tune", "ಫೈನ್-ಟ್ಯೂನ್", "Sutikslinti"], ["Continue training a pre-trained model on a few thousand labelled examples.", "ಪೂರ್ವ-ತರಬೇತಿ ಮಾದರಿಯನ್ನು ಕೆಲವು ಸಾವಿರ ಲೇಬಲ್ ಮಾಡಿದ ಉದಾಹರಣೆಗಳಲ್ಲಿ ತರಬೇತಿ ಮುಂದುವರಿಸಿ.", "Tęskite iš anksto išmokyto modelio mokymą su keliais tūkstančiais pažymėtų pavyzdžių."]],
      [["Latency budget", "ವಿಳಂಬ ಮಿತಿ", "Delsos riba"], ["The longest time per sentence your application can accept.", "ನಿಮ್ಮ ಅಪ್ಲಿಕೇಶನ್ ಒಪ್ಪಬಹುದಾದ ವಾಕ್ಯಕ್ಕೆ ಗರಿಷ್ಠ ಸಮಯ.", "Ilgiausias laikas vienam sakiniui, kurį gali priimti jūsų taikomoji programa."]],
    ],
    tasks: [
      ["Click the first example situation and read the recommendation.", "ಮೊದಲ ಉದಾಹರಣೆ ಸ್ಥಿತಿ ಕ್ಲಿಕ್ ಮಾಡಿ ಶಿಫಾರಸು ಓದಿ.", "Spustelėkite pirmąją pavyzdinę situaciją ir perskaitykite rekomendaciją."],
      ["Set no public model and no labels: which rule applies?", "ಸಾರ್ವಜನಿಕ ಮಾದರಿ ಮತ್ತು ಲೇಬಲ್ ಇಲ್ಲ ಎಂದು ಹೊಂದಿಸಿ: ಯಾವ ನಿಯಮ ಅನ್ವಯಿಸುತ್ತದೆ?", "Nustatykite, kad nėra viešo modelio ir etikečių: kuri taisyklė taikoma?"],
      ["Tighten the latency limit to 0.1 ms and see which models disappear.", "ವಿಳಂಬ ಮಿತಿಯನ್ನು 0.1 ms ಗೆ ಬಿಗಿಗೊಳಿಸಿ ಯಾವ ಮಾದರಿಗಳು ಮಾಯವಾಗುತ್ತವೆ ಎಂದು ನೋಡಿ.", "Sugriežtinkite delsos ribą iki 0,1 ms ir pažiūrėkite, kurie modeliai išnyksta."],
      ["Untick “English” and read the caveat.", "“ಇಂಗ್ಲಿಷ್” ಟಿಕ್ ತೆಗೆದು ಎಚ್ಚರಿಕೆ ಓದಿ.", "Nuimkite žymę „angliški“ ir perskaitykite įspėjimą."],
    ],
    questions: [
      {
        q: ["No public model, 8,000 labelled sentences, a CPU laptop and no tight limits. What does the paper recommend?", "ಸಾರ್ವಜನಿಕ ಮಾದರಿ ಇಲ್ಲ, 8,000 ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳು, CPU ಲ್ಯಾಪ್‌ಟಾಪ್, ಬಿಗಿ ಮಿತಿ ಇಲ್ಲ. ಪ್ರಬಂಧ ಏನು ಶಿಫಾರಸು ಮಾಡುತ್ತದೆ?", "Nėra viešo modelio, 8 000 pažymėtų sakinių, CPU nešiojamasis kompiuteris ir nėra griežtų apribojimų. Ką rekomenduoja straipsnis?"],
        options: [
          ["TF-IDF + linear SVM", "TF-IDF + ರೇಖೀಯ SVM", "TF-IDF + tiesinis SVM"],
          ["Fine-tune a distilled Transformer (DistilBERT)", "ಡಿಸ್ಟಿಲ್ ಮಾಡಿದ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ (DistilBERT) ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿ", "Sutikslinti distiliuotą transformerį (DistilBERT)"],
          ["A zero-shot NLI model", "ಜೀರೋ-ಶಾಟ್ NLI ಮಾದರಿ", "Zero-shot NLI modelį"],
        ],
        correct: 1,
        why: ["Recommendation 2: a few thousand labelled sentences are enough to fine-tune DistilBERT on a CPU (88.8 % in about 2.6 hours), much better than the SVM (82.9 %).", "ಶಿಫಾರಸು 2: CPU ನಲ್ಲಿ DistilBERT ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಲು ಕೆಲವು ಸಾವಿರ ಲೇಬಲ್ ಮಾಡಿದ ವಾಕ್ಯಗಳು ಸಾಕು (ಸುಮಾರು 2.6 ಗಂಟೆಯಲ್ಲಿ 88.8 %), SVM (82.9 %) ಗಿಂತ ಬಹಳ ಉತ್ತಮ.", "2 rekomendacija: kelių tūkstančių pažymėtų sakinių pakanka DistilBERT sutikslinti CPU (88,8 % per apie 2,6 val.), gerokai geriau nei SVM (82,9 %)."],
        verify: () => { const r = recommend(base); return r.step === 2 && r.tag === "ft_distilbert_8000"; },
      },
      {
        q: ["You have no labels at all and no public model. Which model does the helper pick?", "ನಿಮ್ಮ ಬಳಿ ಲೇಬಲ್ ಇಲ್ಲವೇ ಇಲ್ಲ ಮತ್ತು ಸಾರ್ವಜನಿಕ ಮಾದರಿ ಇಲ್ಲ. ಸಹಾಯಕ ಯಾವ ಮಾದರಿ ಆರಿಸುತ್ತದೆ?", "Neturite jokių etikečių ir viešo modelio. Kurį modelį parenka pagalbininkas?"],
        options: [
          ["The zero-shot NLI model", "ಜೀರೋ-ಶಾಟ್ NLI ಮಾದರಿ", "Zero-shot NLI modelį"],
          ["Fine-tuned DistilBERT", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT", "Sutikslintą DistilBERT"],
          ["TF-IDF + linear SVM", "TF-IDF + ರೇಖೀಯ SVM", "TF-IDF + tiesinį SVM"],
        ],
        correct: 0,
        why: ["Recommendation 3: with no labelled data only the zero-shot model can be used; it needs no training and reaches 81.8 %.", "ಶಿಫಾರಸು 3: ಲೇಬಲ್ ಮಾಡಿದ ಡೇಟಾ ಇಲ್ಲದಿದ್ದರೆ ಜೀರೋ-ಶಾಟ್ ಮಾದರಿಯನ್ನು ಮಾತ್ರ ಬಳಸಬಹುದು; ಅದಕ್ಕೆ ತರಬೇತಿ ಬೇಕಿಲ್ಲ ಮತ್ತು 81.8 % ತಲುಪುತ್ತದೆ.", "3 rekomendacija: neturint pažymėtų duomenų galima naudoti tik zero-shot modelį; jam mokymo nereikia ir jis pasiekia 81,8 %."],
        verify: () => { const r = recommend({ ...base, labels: 0 }); return r.step === 3 && r.tag === "zs_nli_distilroberta"; },
      },
      {
        q: ["Millions of items per hour on very limited hardware: 0.1 ms per sentence at most. Which approach fits?", "ಬಹಳ ಸೀಮಿತ ಯಂತ್ರಾಂಶದಲ್ಲಿ ಗಂಟೆಗೆ ಲಕ್ಷಾಂತರ ಐಟಂಗಳು: ವಾಕ್ಯಕ್ಕೆ ಗರಿಷ್ಠ 0.1 ms. ಯಾವ ವಿಧಾನ ಹೊಂದುತ್ತದೆ?", "Milijonai įrašų per valandą labai ribotoje įrangoje: daugiausia 0,1 ms vienam sakiniui. Kuris metodas tinka?"],
        options: [
          ["BERT-small", "BERT-small", "BERT-small"],
          ["DistilBERT-SST2", "DistilBERT-SST2", "DistilBERT-SST2"],
          ["A TF-IDF model", "TF-IDF ಮಾದರಿ", "TF-IDF modelis"],
        ],
        correct: 2,
        why: ["Only the TF-IDF models (about 0.05 ms) are fast enough; every Transformer needs at least 1.2 ms.", "TF-IDF ಮಾದರಿಗಳು (ಸುಮಾರು 0.05 ms) ಮಾತ್ರ ಸಾಕಷ್ಟು ವೇಗ; ಪ್ರತಿ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗೆ ಕನಿಷ್ಠ 1.2 ms ಬೇಕು.", "Pakankamai greiti tik TF-IDF modeliai (apie 0,05 ms); kiekvienam transformeriui reikia bent 1,2 ms."],
        verify: () => { const r = recommend({ ...base, labels: 65349, maxLatencyMs: 0.1 }); return r.step === 4 && ["tfidf_svm", "tfidf_logreg", "tfidf_nb"].includes(r.tag!); },
      },
    ],
    takeaways: [
      ["Order matters: reuse, then fine-tune, then zero-shot, and TF-IDF when speed or hardware is the limit.", "ಕ್ರಮ ಮುಖ್ಯ: ಮರುಬಳಕೆ, ನಂತರ ಫೈನ್-ಟ್ಯೂನ್, ನಂತರ ಜೀರೋ-ಶಾಟ್, ಮತ್ತು ವೇಗ ಅಥವಾ ಯಂತ್ರಾಂಶ ಮಿತಿಯಾದಾಗ TF-IDF.", "Tvarka svarbi: pakartotinis naudojimas, tada sutikslinimas, tada zero-shot, o TF-IDF – kai riba yra greitis ar įranga."],
      ["Every recommendation can be backed by a number from this lab.", "ಪ್ರತಿ ಶಿಫಾರಸನ್ನು ಈ ಲ್ಯಾಬ್‌ನ ಒಂದು ಸಂಖ್ಯೆಯಿಂದ ಬೆಂಬಲಿಸಬಹುದು.", "Kiekvieną rekomendaciją galima paremti šios laboratorijos skaičiumi."],
      ["The numbers are English movie reviews on a CPU laptop: other languages need the procedure repeated.", "ಸಂಖ್ಯೆಗಳು CPU ಲ್ಯಾಪ್‌ಟಾಪ್‌ನಲ್ಲಿ ಇಂಗ್ಲಿಷ್ ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆಗಳದ್ದು: ಬೇರೆ ಭಾಷೆಗಳಿಗೆ ವಿಧಾನ ಪುನರಾವರ್ತಿಸಬೇಕು.", "Skaičiai gauti su angliškomis filmų apžvalgomis CPU kompiuteryje: kitoms kalboms procedūrą reikia pakartoti."],
    ],
    mistakes: [
      ["Picking the model with the highest accuracy regardless of latency and hardware.", "ವಿಳಂಬ ಮತ್ತು ಯಂತ್ರಾಂಶವನ್ನು ಲೆಕ್ಕಿಸದೆ ಅತ್ಯಧಿಕ ನಿಖರತೆಯ ಮಾದರಿ ಆರಿಸುವುದು.", "Modelio su didžiausiu tikslumu parinkimas nepaisant delsos ir įrangos."],
      ["Applying English numbers to Lithuanian or other texts without repeating the experiment.", "ಪ್ರಯೋಗ ಪುನರಾವರ್ತಿಸದೆ ಇಂಗ್ಲಿಷ್ ಸಂಖ್ಯೆಗಳನ್ನು ಲಿಥುವೇನಿಯನ್ ಅಥವಾ ಇತರ ಪಠ್ಯಗಳಿಗೆ ಅನ್ವಯಿಸುವುದು.", "Angliškų skaičių taikymas lietuviškiems ar kitiems tekstams nepakartojus eksperimento."],
    ],
  },

  code: {
    goal: [
      "Follow the experiment through its nine scripts: what each reads and writes, in which order they run, and where the real numbers come from.",
      "ಪ್ರಯೋಗವನ್ನು ಅದರ ಒಂಬತ್ತು ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳ ಮೂಲಕ ಅನುಸರಿಸಿ: ಪ್ರತಿಯೊಂದು ಏನು ಓದುತ್ತದೆ ಮತ್ತು ಬರೆಯುತ್ತದೆ, ಯಾವ ಕ್ರಮದಲ್ಲಿ ಚಲಿಸುತ್ತವೆ, ಮತ್ತು ನಿಜವಾದ ಸಂಖ್ಯೆಗಳು ಎಲ್ಲಿಂದ ಬರುತ್ತವೆ.",
      "Sekite eksperimentą per jo devynis scenarijus: ką kiekvienas skaito ir rašo, kokia tvarka jie vykdomi ir iš kur atsiranda tikrieji skaičiai.",
    ],
    fit: [
      "The code is the experiment: every number in the paper traces back to a result file written by one of these scripts.",
      "ಕೋಡ್ ಎಂದರೆ ಪ್ರಯೋಗ: ಪ್ರಬಂಧದ ಪ್ರತಿ ಸಂಖ್ಯೆ ಈ ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳಲ್ಲಿ ಒಂದು ಬರೆದ ಫಲಿತಾಂಶ ಫೈಲ್‌ಗೆ ಹಿಂದಿರುಗುತ್ತದೆ.",
      "Kodas yra eksperimentas: kiekvienas straipsnio skaičius veda į rezultatų failą, kurį užrašė vienas iš šių scenarijų.",
    ],
    keywords: [
      [["Pipeline of scripts", "ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳ ಪೈಪ್‌ಲೈನ್", "Scenarijų konvejeris"], ["Independent programs that talk through files.", "ಫೈಲ್‌ಗಳ ಮೂಲಕ ಮಾತನಾಡುವ ಸ್ವತಂತ್ರ ಪ್ರೋಗ್ರಾಂಗಳು.", "Nepriklausomos programos, bendraujančios per failus."]],
      [["Result file", "ಫಲಿತಾಂಶ ಫೈಲ್", "Rezultatų failas"], ["A JSON with metrics, timings, parameters and all predictions.", "ಮೆಟ್ರಿಕ್‌ಗಳು, ಸಮಯಗಳು, ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಮತ್ತು ಎಲ್ಲಾ ಭವಿಷ್ಯವಾಣಿಗಳ JSON.", "JSON su metrikomis, laikais, parametrais ir visomis prognozėmis."]],
      [["Seed", "ಸೀಡ್", "Sėkla"], ["A fixed number (42) that makes random steps repeatable.", "ಯಾದೃಚ್ಛಿಕ ಹಂತಗಳನ್ನು ಪುನರಾವರ್ತನೀಯ ಮಾಡುವ ಸ್ಥಿರ ಸಂಖ್ಯೆ (42).", "Fiksuotas skaičius (42), padarantis atsitiktinius žingsnius pakartojamus."]],
    ],
    tasks: [
      ["Read the run order and find the script that is not started.", "ಚಾಲನೆ ಕ್ರಮ ಓದಿ, ಆರಂಭವಾಗದ ಸ್ಕ್ರಿಪ್ಟ್ ಹುಡುಕಿ.", "Perskaitykite vykdymo tvarką ir raskite scenarijų, kuris nepaleidžiamas."],
      ["Search the code for “predictions” and see which files mention it.", "ಕೋಡ್‌ನಲ್ಲಿ “predictions” ಹುಡುಕಿ ಯಾವ ಫೈಲ್‌ಗಳು ಹೇಳುತ್ತವೆ ಎಂದು ನೋಡಿ.", "Ieškokite kode „predictions“ ir pažiūrėkite, kurie failai jį mini."],
      ["Open 04_finetune_transformer.py and find the gradient clipping line.", "04_finetune_transformer.py ತೆರೆದು ಗ್ರೇಡಿಯಂಟ್ ಕ್ಲಿಪ್ಪಿಂಗ್ ಸಾಲು ಹುಡುಕಿ.", "Atidarykite 04_finetune_transformer.py ir raskite gradientų apkarpymo eilutę."],
      ["Open Setup & run and compare the commands with run_all.sh.", "ಸೆಟಪ್ ಮತ್ತು ಚಾಲನೆ ತೆರೆದು ಕಮಾಂಡ್‌ಗಳನ್ನು run_all.sh ಜೊತೆ ಹೋಲಿಸಿ.", "Atidarykite Paruošimą ir paleidimą ir palyginkite komandas su run_all.sh."],
    ],
    questions: [
      {
        q: ["Which script is not started by run_all.sh?", "run_all.sh ಯಾವ ಸ್ಕ್ರಿಪ್ಟ್ ಅನ್ನು ಆರಂಭಿಸುವುದಿಲ್ಲ?", "Kurio scenarijaus nepaleidžia run_all.sh?"],
        options: [
          ["08_report.py", "08_report.py", "08_report.py"],
          ["09_diagrams.py", "09_diagrams.py", "09_diagrams.py"],
          ["03_bilstm.py", "03_bilstm.py", "03_bilstm.py"],
        ],
        correct: 1,
        why: ["09_diagrams.py only draws the architecture and pipeline diagrams of the paper; run_all.sh runs 02 to 08 and, when needed, 01.", "09_diagrams.py ಪ್ರಬಂಧದ ವಾಸ್ತುಶಿಲ್ಪ ಮತ್ತು ಪೈಪ್‌ಲೈನ್ ರೇಖಾಚಿತ್ರಗಳನ್ನು ಮಾತ್ರ ಬರೆಯುತ್ತದೆ; run_all.sh 02 ರಿಂದ 08 ಮತ್ತು ಬೇಕಾದಾಗ 01 ಚಲಾಯಿಸುತ್ತದೆ.", "09_diagrams.py tik braižo straipsnio architektūros ir konvejerio diagramas; run_all.sh vykdo 02–08 ir, jei reikia, 01."],
        verify: () => {
          const run = CODE_FILES.find((f) => f.file === "run_all.sh")!.code;
          return !run.includes("09_diagrams") && run.includes("08_report.py") && run.includes("03_bilstm.py");
        },
      },
      {
        q: ["What does every model script write to results/?", "ಪ್ರತಿ ಮಾದರಿ ಸ್ಕ್ರಿಪ್ಟ್ results/ ಗೆ ಏನು ಬರೆಯುತ್ತದೆ?", "Ką kiekvieno modelio scenarijus įrašo į results/?"],
        options: [
          ["A PNG picture", "PNG ಚಿತ್ರ", "PNG paveikslą"],
          ["Only the accuracy as one number", "ಕೇವಲ ನಿಖರತೆ, ಒಂದು ಸಂಖ್ಯೆಯಾಗಿ", "Tik tikslumą kaip vieną skaičių"],
          ["A JSON file with metrics, timings, parameter count and all test predictions", "ಮೆಟ್ರಿಕ್‌ಗಳು, ಸಮಯಗಳು, ಪ್ಯಾರಾಮೀಟರ್ ಎಣಿಕೆ ಮತ್ತು ಎಲ್ಲಾ ಪರೀಕ್ಷಾ ಭವಿಷ್ಯವಾಣಿಗಳ JSON ಫೈಲ್", "JSON failą su metrikomis, laikais, parametrų skaičiumi ir visomis testo prognozėmis"],
        ],
        correct: 2,
        why: ["Saving every prediction is what makes paired statistics and error analysis possible afterwards, without re-running any model.", "ಪ್ರತಿ ಭವಿಷ್ಯವಾಣಿಯನ್ನು ಉಳಿಸುವುದೇ ಯಾವ ಮಾದರಿಯನ್ನೂ ಮರುಚಾಲನೆ ಮಾಡದೆ ನಂತರ ಜೋಡಿ ಅಂಕಿಅಂಶ ಮತ್ತು ದೋಷ ವಿಶ್ಲೇಷಣೆಯನ್ನು ಸಾಧ್ಯವಾಗಿಸುತ್ತದೆ.", "Visų prognozių išsaugojimas leidžia vėliau atlikti porines statistikas ir klaidų analizę, nepaleidžiant jokio modelio iš naujo."],
        verify: () => {
          const get = (n: string) => CODE_FILES.find((f) => f.file === n)!.code;
          return get("utils.py").includes("def save_result") && get("04_finetune_transformer.py").includes('"predictions"') && get("02_classical_baselines.py").includes('"predictions"');
        },
      },
      {
        q: ["How long does `bash run_all.sh` take on the paper's 4-core laptop?", "ಪ್ರಬಂಧದ 4-ಕೋರ್ ಲ್ಯಾಪ್‌ಟಾಪ್‌ನಲ್ಲಿ `bash run_all.sh` ಗೆ ಎಷ್ಟು ಸಮಯ ಬೇಕು?", "Kiek laiko trunka `bash run_all.sh` straipsnio 4 branduolių nešiojamajame kompiuteryje?"],
        options: [
          ["About 3 minutes", "ಸುಮಾರು 3 ನಿಮಿಷ", "Apie 3 minutes"],
          ["About 30 minutes", "ಸುಮಾರು 30 ನಿಮಿಷ", "Apie 30 minučių"],
          ["About 2.5 to 3 hours", "ಸುಮಾರು 2.5 ರಿಂದ 3 ಗಂಟೆ", "Apie 2,5–3 valandas"],
        ],
        correct: 2,
        why: ["The header of run_all.sh says about 2.5 to 3 hours; the longest single job is the DistilBERT fine-tuning (about 2.6 hours on its own in the recorded run).", "run_all.sh ನ ಶೀರ್ಷಿಕೆ ಸುಮಾರು 2.5 ರಿಂದ 3 ಗಂಟೆ ಎನ್ನುತ್ತದೆ; ಅತಿ ಉದ್ದದ ಒಂದು ಕೆಲಸ DistilBERT ಫೈನ್-ಟ್ಯೂನಿಂಗ್ (ದಾಖಲಾದ ಚಾಲನೆಯಲ್ಲಿ ಒಂದೇ ಸುಮಾರು 2.6 ಗಂಟೆ).", "run_all.sh antraštė sako apie 2,5–3 valandas; ilgiausias pavienis darbas – DistilBERT sutikslinimas (įrašytame paleidime vien jis užtruko apie 2,6 val.)."],
        verify: () => CODE_FILES.find((f) => f.file === "run_all.sh")!.code.includes("2.5-3 h") && byTag("ft_distilbert_8000").trainSeconds / 3600 > 2.5,
      },
    ],
    takeaways: [
      ["Nine small scripts and one helper: about 770 lines in total.", "ಒಂಬತ್ತು ಸಣ್ಣ ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳು ಮತ್ತು ಒಂದು ಸಹಾಯಕ: ಒಟ್ಟು ಸುಮಾರು 770 ಸಾಲುಗಳು.", "Devyni maži scenarijai ir vienas pagalbininkas: iš viso apie 770 eilučių."],
      ["Files are the interface: any stage can be re-run on its own.", "ಫೈಲ್‌ಗಳೇ ಇಂಟರ್‌ಫೇಸ್: ಯಾವುದೇ ಹಂತವನ್ನು ಬೇರೆಯಾಗಿ ಮರುಚಾಲನೆ ಮಾಡಬಹುದು.", "Failai yra sąsaja: bet kurį etapą galima paleisti atskirai."],
      ["This lab shows the code and the recorded results; reproducing them needs Python on your computer.", "ಈ ಲ್ಯಾಬ್ ಕೋಡ್ ಮತ್ತು ದಾಖಲಾದ ಫಲಿತಾಂಶಗಳನ್ನು ತೋರಿಸುತ್ತದೆ; ಅವನ್ನು ಪುನರುತ್ಪಾದಿಸಲು ನಿಮ್ಮ ಕಂಪ್ಯೂಟರ್‌ನಲ್ಲಿ ಪೈಥಾನ್ ಬೇಕು.", "Ši laboratorija rodo kodą ir įrašytus rezultatus; jiems atkurti reikia Python jūsų kompiuteryje."],
    ],
    mistakes: [
      ["Expecting the browser to run the PyTorch scripts.", "ಬ್ರೌಸರ್ PyTorch ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳನ್ನು ಚಲಾಯಿಸುತ್ತದೆ ಎಂದು ನಿರೀಕ್ಷಿಸುವುದು.", "Tikėjimasis, kad naršyklė paleis PyTorch scenarijus."],
      ["Forgetting the 1.5 GB of first-run downloads when planning the run.", "ಚಾಲನೆ ಯೋಜಿಸುವಾಗ ಮೊದಲ ಚಾಲನೆಯ 1.5 GB ಡೌನ್‌ಲೋಡ್ ಮರೆಯುವುದು.", "Planuojant paleidimą pamiršti pirmojo paleidimo 1,5 GB atsisiuntimus."],
    ],
  },

  checklist: {
    goal: [
      "Check yourself against the concepts of the whole lab and save your progress in this browser.",
      "ಇಡೀ ಲ್ಯಾಬ್‌ನ ಪರಿಕಲ್ಪನೆಗಳ ವಿರುದ್ಧ ನಿಮ್ಮನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಪ್ರಗತಿಯನ್ನು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಸಿ.",
      "Patikrinkite save pagal visos laboratorijos sąvokas ir išsaugokite savo pažangą šioje naršyklėje.",
    ],
    fit: [
      "Ticking only what you can explain without looking turns reading into understanding, and shows which step to reopen.",
      "ನೋಡದೆ ವಿವರಿಸಬಲ್ಲದ್ದನ್ನು ಮಾತ್ರ ಟಿಕ್ ಮಾಡುವುದು ಓದನ್ನು ತಿಳುವಳಿಕೆಯಾಗಿ ಬದಲಿಸುತ್ತದೆ ಮತ್ತು ಯಾವ ಹಂತವನ್ನು ಮತ್ತೆ ತೆರೆಯಬೇಕು ಎಂದು ತೋರಿಸುತ್ತದೆ.",
      "Žymėjimas tik to, ką galite paaiškinti nežiūrėdami, paverčia skaitymą supratimu ir parodo, kurį žingsnį atsidaryti iš naujo.",
    ],
    keywords: [
      [["Claim", "ಹೇಳಿಕೆ", "Teiginys"], ["A statement the paper makes, such as “Transformers win by about 6 points”.", "“ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಸುಮಾರು 6 ಪಾಯಿಂಟ್‌ಗಳಿಂದ ಗೆಲ್ಲುತ್ತವೆ” ಮುಂತಾದ ಪ್ರಬಂಧದ ಹೇಳಿಕೆ.", "Straipsnio teiginys, pvz., „transformeriai laimi maždaug 6 punktais“."]],
      [["Evidence", "ಸಾಕ್ಷ್ಯ", "Įrodymas"], ["The number or test that supports a claim.", "ಹೇಳಿಕೆಯನ್ನು ಬೆಂಬಲಿಸುವ ಸಂಖ್ಯೆ ಅಥವಾ ಪರೀಕ್ಷೆ.", "Skaičius ar testas, remiantis teiginį."]],
      [["Caveat", "ಎಚ್ಚರಿಕೆ", "Išlyga"], ["A limit on how far a claim reaches.", "ಹೇಳಿಕೆ ಎಷ್ಟು ದೂರ ತಲುಪುತ್ತದೆ ಎಂಬುದರ ಮಿತಿ.", "Riba, iki kur siekia teiginys."]],
    ],
    tasks: [
      ["Tick the three items of the first group that you can explain.", "ಮೊದಲ ಗುಂಪಿನ ನೀವು ವಿವರಿಸಬಲ್ಲ ಮೂರು ಅಂಶಗಳನ್ನು ಟಿಕ್ ಮಾಡಿ.", "Pažymėkite tris pirmos grupės punktus, kuriuos galite paaiškinti."],
      ["For one unticked item, reopen its step and try again.", "ಟಿಕ್ ಆಗದ ಒಂದು ಅಂಶಕ್ಕೆ ಅದರ ಹಂತ ಮತ್ತೆ ತೆರೆದು ಪ್ರಯತ್ನಿಸಿ.", "Vienam nepažymėtam punktui vėl atidarykite jo žingsnį ir pabandykite dar kartą."],
      ["Say aloud the claim, the number and the caveat of the main result.", "ಮುಖ್ಯ ಫಲಿತಾಂಶದ ಹೇಳಿಕೆ, ಸಂಖ್ಯೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಯನ್ನು ಗಟ್ಟಿಯಾಗಿ ಹೇಳಿ.", "Garsiai pasakykite pagrindinio rezultato teiginį, skaičių ir išlygą."],
    ],
    questions: [
      {
        q: ["Which pair of numbers summarises the main result?", "ಯಾವ ಸಂಖ್ಯೆಗಳ ಜೋಡಿ ಮುಖ್ಯ ಫಲಿತಾಂಶವನ್ನು ಸಾರಾಂಶಿಸುತ್ತದೆ?", "Kuri skaičių pora apibendrina pagrindinį rezultatą?"],
        options: [
          ["88.8 % (DistilBERT, 8,000 sentences) against 82.9 % (SVM, 65,349 sentences)", "88.8 % (DistilBERT, 8,000 ವಾಕ್ಯಗಳು) ವಿರುದ್ಧ 82.9 % (SVM, 65,349 ವಾಕ್ಯಗಳು)", "88,8 % (DistilBERT, 8 000 sakinių) prieš 82,9 % (SVM, 65 349 sakiniai)"],
          ["91.1 % against 88.8 % only", "91.1 % ವಿರುದ್ಧ 88.8 % ಮಾತ್ರ", "Tik 91,1 % prieš 88,8 %"],
          ["76.6 % against 82.8 %", "76.6 % ವಿರುದ್ಧ 82.8 %", "76,6 % prieš 82,8 %"],
        ],
        correct: 0,
        why: ["That pair carries the main claim: a Transformer trained on eight times less data is significantly more accurate than the best classical model (p < 0.001 on the same sentences).", "ಆ ಜೋಡಿ ಮುಖ್ಯ ಹೇಳಿಕೆಯನ್ನು ಹೊತ್ತಿದೆ: ಎಂಟು ಪಟ್ಟು ಕಡಿಮೆ ಡೇಟಾದಲ್ಲಿ ತರಬೇತಿ ಪಡೆದ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಅತ್ಯುತ್ತಮ ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಗಿಂತ ಗಮನಾರ್ಹವಾಗಿ ಹೆಚ್ಚು ನಿಖರ (ಅದೇ ವಾಕ್ಯಗಳಲ್ಲಿ p < 0.001).", "Ši pora neša pagrindinį teiginį: transformeris, mokytas aštuonis kartus mažesniais duomenimis, yra reikšmingai tikslesnis už geriausią klasikinį modelį (p < 0,001 tuose pačiuose sakiniuose)."],
        verify: () => byTag("ft_distilbert_8000").accuracy.toFixed(3) === "0.888" && byTag("tfidf_svm").accuracy.toFixed(3) === "0.829" && byTag("ft_distilbert_8000").trainSize === 8000 && byTag("tfidf_svm").trainSize === 65349 && pair("ft_distilbert_8000", "tfidf_svm").p < 0.001,
      },
      {
        q: ["Where are your ticks stored?", "ನಿಮ್ಮ ಟಿಕ್‌ಗಳನ್ನು ಎಲ್ಲಿ ಉಳಿಸಲಾಗುತ್ತದೆ?", "Kur saugomos jūsų žymės?"],
        options: [
          ["On a server of the lab", "ಲ್ಯಾಬ್‌ನ ಸರ್ವರ್‌ನಲ್ಲಿ", "Laboratorijos serveryje"],
          ["Only in this browser", "ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮಾತ್ರ", "Tik šioje naršyklėje"],
          ["In the paper", "ಪ್ರಬಂಧದಲ್ಲಿ", "Straipsnyje"],
        ],
        correct: 1,
        why: ["The lab has no server for it: the ticks live in this browser's storage, so another device or a private window starts empty.", "ಅದಕ್ಕೆ ಲ್ಯಾಬ್‌ನಲ್ಲಿ ಸರ್ವರ್ ಇಲ್ಲ: ಟಿಕ್‌ಗಳು ಈ ಬ್ರೌಸರ್‌ನ ಸಂಗ್ರಹಣೆಯಲ್ಲಿವೆ, ಆದ್ದರಿಂದ ಬೇರೆ ಸಾಧನ ಅಥವಾ ಖಾಸಗಿ ವಿಂಡೋ ಖಾಲಿಯಾಗಿ ಆರಂಭವಾಗುತ್ತದೆ.", "Tam laboratorija neturi serverio: žymės yra šios naršyklės saugykloje, todėl kitas įrenginys ar privatus langas prasideda tuščias."],
      },
    ],
    takeaways: [
      ["Know the main claim with its number, its test and its caveat.", "ಮುಖ್ಯ ಹೇಳಿಕೆಯನ್ನು ಅದರ ಸಂಖ್ಯೆ, ಪರೀಕ್ಷೆ ಮತ್ತು ಎಚ್ಚರಿಕೆಯೊಂದಿಗೆ ತಿಳಿಯಿರಿ.", "Žinokite pagrindinį teiginį su jo skaičiumi, testu ir išlyga."],
      ["Separate what was recorded from what you recomputed in the browser.", "ದಾಖಲಾದದ್ದನ್ನು ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಮರು ಲೆಕ್ಕಿಸಿದ್ದರಿಂದ ಬೇರ್ಪಡಿಸಿ.", "Atskirkite tai, kas įrašyta, nuo to, ką perskaičiavote naršyklėje."],
      ["Go back to any step with an unticked item.", "ಟಿಕ್ ಆಗದ ಅಂಶ ಇರುವ ಯಾವುದೇ ಹಂತಕ್ಕೆ ಹಿಂದಿರುಗಿ.", "Grįžkite prie bet kurio žingsnio su nepažymėtu punktu."],
    ],
    mistakes: [
      ["Ticking an item you only recognise, not one you can explain.", "ನೀವು ಗುರುತಿಸುವ ಅಂಶವನ್ನು ಟಿಕ್ ಮಾಡುವುದು, ವಿವರಿಸಬಲ್ಲದ್ದನ್ನಲ್ಲ.", "Žymėti punktą, kurį tik atpažįstate, o ne tą, kurį galite paaiškinti."],
    ],
  },

  defense: {
    goal: [
      "Prepare short, number-backed answers to the questions a supervisor or committee is likely to ask.",
      "ಮೇಲ್ವಿಚಾರಕ ಅಥವಾ ಸಮಿತಿ ಕೇಳಬಹುದಾದ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಂಖ್ಯೆಗಳಿಂದ ಬೆಂಬಲಿತ ಸಣ್ಣ ಉತ್ತರಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಿ.",
      "Parenkite trumpus, skaičiais paremtus atsakymus į klausimus, kuriuos greičiausiai užduos vadovas ar komisija.",
    ],
    fit: [
      "A good answer states the claim, gives one number, and names the limit. The answers on this page do exactly that, with numbers filled in from the recorded results.",
      "ಉತ್ತಮ ಉತ್ತರ ಹೇಳಿಕೆ ಹೇಳುತ್ತದೆ, ಒಂದು ಸಂಖ್ಯೆ ನೀಡುತ್ತದೆ ಮತ್ತು ಮಿತಿ ಹೆಸರಿಸುತ್ತದೆ. ಈ ಪುಟದ ಉತ್ತರಗಳು ಅದನ್ನೇ ಮಾಡುತ್ತವೆ, ಸಂಖ್ಯೆಗಳನ್ನು ದಾಖಲಾದ ಫಲಿತಾಂಶಗಳಿಂದ ತುಂಬಲಾಗಿದೆ.",
      "Geras atsakymas nurodo teiginį, pateikia vieną skaičių ir įvardija ribą. Šio puslapio atsakymai daro būtent tai, o skaičiai užpildomi iš įrašytų rezultatų.",
    ],
    keywords: [
      [["Main result", "ಮುಖ್ಯ ಫಲಿತಾಂಶ", "Pagrindinis rezultatas"], ["88.8 % against 82.9 %, p < 0.001.", "88.8 % ವಿರುದ್ಧ 82.9 %, p < 0.001.", "88,8 % prieš 82,9 %, p < 0,001."]],
      [["Upper bound", "ಮೇಲಿನ ಮಿತಿ", "Viršutinė riba"], ["A value that can only be too high, like the busy-laptop training times.", "ಅತಿಯಾಗಿ ಮಾತ್ರ ಇರಬಹುದಾದ ಮೌಲ್ಯ, ಕಾರ್ಯನಿರತ ಲ್ಯಾಪ್‌ಟಾಪ್‌ನ ತರಬೇತಿ ಸಮಯಗಳಂತೆ.", "Reikšmė, kuri gali būti tik per didelė, kaip užimto kompiuterio mokymo laikai."]],
      [["Leakage", "ಸೋರಿಕೆ", "Nutekėjimas"], ["Test information reaching training or model selection.", "ಪರೀಕ್ಷಾ ಮಾಹಿತಿ ತರಬೇತಿ ಅಥವಾ ಮಾದರಿ ಆಯ್ಕೆಗೆ ತಲುಪುವುದು.", "Testo informacija, patenkanti į mokymą ar modelio parinkimą."]],
    ],
    tasks: [
      ["Open each question and say the answer in your own words.", "ಪ್ರತಿ ಪ್ರಶ್ನೆ ತೆರೆದು ಉತ್ತರವನ್ನು ನಿಮ್ಮದೇ ಮಾತಿನಲ್ಲಿ ಹೇಳಿ.", "Atidarykite kiekvieną klausimą ir pasakykite atsakymą savais žodžiais."],
      ["Underline the number in each answer and learn it.", "ಪ್ರತಿ ಉತ್ತರದ ಸಂಖ್ಯೆಗೆ ಅಡಿಗೆರೆ ಎಳೆದು ಕಲಿಯಿರಿ.", "Pabraukite skaičių kiekviename atsakyme ir išmokite jį."],
      ["Find the answer that names a limitation and add one of your own.", "ಮಿತಿಯನ್ನು ಹೆಸರಿಸುವ ಉತ್ತರ ಹುಡುಕಿ ಮತ್ತು ನಿಮ್ಮದೇ ಒಂದು ಸೇರಿಸಿ.", "Raskite atsakymą, įvardijantį apribojimą, ir pridėkite savo."],
    ],
    questions: [
      {
        q: ["A committee member asks whether 88.8 % against 82.9 % could be noise. What is the best answer?", "88.8 % ವಿರುದ್ಧ 82.9 % ಶಬ್ದ ಆಗಿರಬಹುದೇ ಎಂದು ಸಮಿತಿ ಸದಸ್ಯ ಕೇಳುತ್ತಾರೆ. ಅತ್ಯುತ್ತಮ ಉತ್ತರ ಯಾವುದು?", "Komisijos narys klausia, ar 88,8 % prieš 82,9 % gali būti triukšmas. Koks geriausias atsakymas?"],
        options: [
          ["No, because six points is a lot", "ಇಲ್ಲ, ಏಕೆಂದರೆ ಆರು ಪಾಯಿಂಟ್ ಬಹಳ", "Ne, nes šeši punktai yra daug"],
          ["McNemar on the same 872 sentences: 104 against 53, p < 0.001; the intervals are about ±2.5 points", "ಅದೇ 872 ವಾಕ್ಯಗಳಲ್ಲಿ ಮೆಕ್‌ನೆಮಾರ್: 104 ವಿರುದ್ಧ 53, p < 0.001; ಅಂತರಗಳು ಸುಮಾರು ±2.5 ಪಾಯಿಂಟ್", "McNemaras tuose pačiuose 872 sakiniuose: 104 prieš 53, p < 0,001; intervalai apie ±2,5 punkto"],
          ["We did not test it", "ನಾವು ಪರೀಕ್ಷಿಸಿಲ್ಲ", "Mes to netestavome"],
        ],
        correct: 1,
        why: ["A claim needs a test, not just a gap. The paired exact test on the same sentences answers the question and gives a number to quote.", "ಹೇಳಿಕೆಗೆ ಅಂತರ ಮಾತ್ರವಲ್ಲ, ಪರೀಕ್ಷೆ ಬೇಕು. ಅದೇ ವಾಕ್ಯಗಳಲ್ಲಿ ಜೋಡಿ ನಿಖರ ಪರೀಕ್ಷೆ ಪ್ರಶ್ನೆಗೆ ಉತ್ತರಿಸಿ ಉಲ್ಲೇಖಿಸಲು ಸಂಖ್ಯೆ ನೀಡುತ್ತದೆ.", "Teiginiui reikia testo, o ne vien skirtumo. Porinis tikslusis testas tuose pačiuose sakiniuose atsako į klausimą ir duoda skaičių cituoti."],
        verify: () => { const p = pair("ft_distilbert_8000", "tfidf_svm"); return p.onlyA === 104 && p.onlyB === 53 && p.p < 0.001; },
      },
      {
        q: ["Which limitation of the timing results must you state?", "ಸಮಯ ಫಲಿತಾಂಶಗಳ ಯಾವ ಮಿತಿಯನ್ನು ನೀವು ಹೇಳಬೇಕು?", "Kokį laiko rezultatų apribojimą privalote nurodyti?"],
        options: [
          ["They are exact seconds", "ಅವು ನಿಖರ ಸೆಕೆಂಡ್‌ಗಳು", "Tai tikslios sekundės"],
          ["They were measured on a GPU", "ಅವನ್ನು GPU ನಲ್ಲಿ ಅಳೆಯಲಾಗಿದೆ", "Jie išmatuoti GPU"],
          ["They are upper bounds: the laptop shared the longest runs with other work", "ಅವು ಮೇಲಿನ ಮಿತಿಗಳು: ಅತಿ ಉದ್ದದ ಚಾಲನೆಗಳಲ್ಲಿ ಲ್ಯಾಪ್‌ಟಾಪ್ ಇತರ ಕೆಲಸ ಹಂಚಿಕೊಂಡಿತ್ತು", "Tai viršutinės ribos: ilgiausių paleidimų metu kompiuteris dalijosi su kitu darbu"],
        ],
        correct: 2,
        why: ["The paper itself says the longest runs were slowed by other work, and no GPU was used. Stating this first is honest and pre-empts the question.", "ಅತಿ ಉದ್ದದ ಚಾಲನೆಗಳು ಇತರ ಕೆಲಸದಿಂದ ನಿಧಾನವಾದವು ಮತ್ತು GPU ಬಳಸಿಲ್ಲ ಎಂದು ಪ್ರಬಂಧವೇ ಹೇಳುತ್ತದೆ. ಇದನ್ನು ಮೊದಲು ಹೇಳುವುದು ಪ್ರಾಮಾಣಿಕ ಮತ್ತು ಪ್ರಶ್ನೆಯನ್ನು ಮುಂಚಿತವಾಗಿಯೇ ತಡೆಯುತ್ತದೆ.", "Pats straipsnis sako, kad ilgiausius paleidimus sulėtino kitas darbas ir GPU nenaudotas. Tai pasakyti pirmiems yra sąžininga ir užbėga klausimui už akių."],
      },
    ],
    takeaways: [
      ["State the claim, one number and the limit.", "ಹೇಳಿಕೆ, ಒಂದು ಸಂಖ್ಯೆ ಮತ್ತು ಮಿತಿ ಹೇಳಿ.", "Nurodykite teiginį, vieną skaičių ir ribą."],
      ["Back every comparison with the paired test, not only the gap.", "ಪ್ರತಿ ಹೋಲಿಕೆಯನ್ನು ಅಂತರದಿಂದ ಮಾತ್ರವಲ್ಲ, ಜೋಡಿ ಪರೀಕ್ಷೆಯಿಂದ ಬೆಂಬಲಿಸಿ.", "Kiekvieną palyginimą paremkite poriniu testu, o ne vien skirtumu."],
      ["Say what was recorded, what was recomputed, and what could not be verified.", "ದಾಖಲಾದದ್ದು, ಮರು ಲೆಕ್ಕಿಸಿದ್ದು ಮತ್ತು ಪರಿಶೀಲಿಸಲಾಗದ್ದನ್ನು ಹೇಳಿ.", "Pasakykite, kas įrašyta, kas perskaičiuota ir ko nepavyko patikrinti."],
    ],
    mistakes: [
      ["Quoting a number without the sample size or the test behind it.", "ಮಾದರಿ ಗಾತ್ರ ಅಥವಾ ಹಿಂದಿನ ಪರೀಕ್ಷೆ ಇಲ್ಲದೆ ಸಂಖ್ಯೆ ಉಲ್ಲೇಖಿಸುವುದು.", "Skaičiaus cituojimas be imties dydžio ar už jo slypinčio testo."],
    ],
  },
};
