import { T5, T61, T62 } from "../data";
import { mean } from "../math";
import type { GuideDef } from "./types";

/** Step guides 11-13 (wrap-up). English first, then Kannada, then Lithuanian. */
export const guidesC: Record<string, GuideDef> = {
  results: {
    goal: [
      "Read the notebook's results tables and charts, find the best model, and judge how much to trust each difference.",
      "ನೋಟ್‌ಬುಕ್‌ನ ಫಲಿತಾಂಶ ಕೋಷ್ಟಕಗಳು ಮತ್ತು ಚಾರ್ಟ್‌ಗಳನ್ನು ಓದಿ, ಅತ್ಯುತ್ತಮ ಮಾಡೆಲ್ ಅನ್ನು ಹುಡುಕಿ, ಮತ್ತು ಪ್ರತಿ ವ್ಯತ್ಯಾಸವನ್ನು ಎಷ್ಟು ನಂಬಬೇಕು ಎಂದು ನಿರ್ಣಯಿಸಿ.",
      "Perskaitykite užrašų knygelės rezultatų lenteles ir diagramas, raskite geriausią modelį ir įvertinkite, kiek pasitikėti kiekvienu skirtumu.",
    ],
    fit: [
      "Results close the story: Task 5's outputs, then 6.1-6.3 on MNIST. Reading them critically matters as much as producing them, because many gaps are smaller than the run-to-run noise.",
      "ಫಲಿತಾಂಶಗಳು ಕಥೆಯನ್ನು ಮುಗಿಸುತ್ತವೆ: ಕಾರ್ಯ 5 ರ ಔಟ್‌ಪುಟ್‌ಗಳು, ನಂತರ MNIST ಮೇಲೆ 6.1-6.3. ಅವನ್ನು ವಿಮರ್ಶಾತ್ಮಕವಾಗಿ ಓದುವುದು ಅವನ್ನು ತಯಾರಿಸುವಷ್ಟೇ ಮುಖ್ಯ, ಏಕೆಂದರೆ ಹಲವು ಅಂತರಗಳು ರನ್‌ನಿಂದ ರನ್‌ಗೆ ಶಬ್ದಕ್ಕಿಂತ ಚಿಕ್ಕವು.",
      "Rezultatai užbaigia istoriją: 5 užduoties išvestys, tada 6.1-6.3 su MNIST. Kritiškai juos skaityti yra tiek pat svarbu, kiek juos gauti, nes daug skirtumų mažesni už bandymų triukšmą.",
    ],
    keywords: [
      [["Test accuracy", "ಪರೀಕ್ಷಾ ನಿಖರತೆ", "Testo tikslumas"], ["share of the 10 000 test images classified correctly", "ಸರಿಯಾಗಿ ವರ್ಗೀಕರಿಸಿದ 10 000 ಪರೀಕ್ಷಾ ಚಿತ್ರಗಳ ಪಾಲು", "teisingai suklasifikuotų iš 10 000 testo vaizdų dalis"]],
      [["Test loss", "ಪರೀಕ್ಷಾ ನಷ್ಟ", "Testo nuostolis"], ["average cross-entropy on those images", "ಆ ಚಿತ್ರಗಳ ಮೇಲಿನ ಸರಾಸರಿ ಕ್ರಾಸ್-ಎಂಟ್ರೊಪಿ", "vidutinė kryžminė entropija tuose vaizduose"]],
      [["Repeat", "ಪುನರಾವರ್ತನೆ", "Kartojimas"], ["running the same experiment again with a new random start", "ಹೊಸ ಯಾದೃಚ್ಛಿಕ ಆರಂಭದೊಂದಿಗೆ ಅದೇ ಪ್ರಯೋಗವನ್ನು ಮತ್ತೆ ನಡೆಸುವುದು", "to paties eksperimento paleidimas iš naujo su nauja atsitiktine pradžia"]],
      [["Noise", "ಶಬ್ದ", "Triukšmas"], ["variation between runs that is not a real difference", "ನಿಜವಾದ ವ್ಯತ್ಯಾಸವಲ್ಲದ ರನ್‌ಗಳ ನಡುವಿನ ಬದಲಾವಣೆ", "bandymų skirtumai, kurie nėra tikras skirtumas"]],
    ],
    tasks: [
      ["Sort the 6.1 table by Test accuracy and confirm that run 5 comes first (0.9816).", "6.1 ಕೋಷ್ಟಕವನ್ನು ಪರೀಕ್ಷಾ ನಿಖರತೆಯ ಪ್ರಕಾರ ವಿಂಗಡಿಸಿ ಮತ್ತು ರನ್ 5 ಮೊದಲು ಬರುತ್ತದೆ ಎಂದು ದೃಢಪಡಿಸಿ (0.9816).", "Surūšiuokite 6.1 lentelę pagal Testo tikslumą ir patvirtinkite, kad pirmas yra 5 bandymas (0.9816)."],
      ["In the 6.3 chart find the best optimizer-rate pair (Adam 0.001) and the ones that fell to 11.35%.", "6.3 ಚಾರ್ಟ್‌ನಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಆಪ್ಟಿಮೈಜರ್-ದರ ಜೋಡಿಯನ್ನು (Adam 0.001) ಮತ್ತು 11.35% ಕ್ಕೆ ಇಳಿದವನ್ನು ಹುಡುಕಿ.", "6.3 diagramoje raskite geriausią optimizatoriaus ir greičio porą (Adam 0.001) ir tas, kurios nukrito iki 11.35 %."],
      ["Compare the three activation means in the 6.2 chart: relu 97.58, tanh 97.43, sigmoid 97.39.", "6.2 ಚಾರ್ಟ್‌ನಲ್ಲಿ ಮೂರು ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆಗಳ ಸರಾಸರಿಗಳನ್ನು ಹೋಲಿಸಿ: relu 97.58, tanh 97.43, sigmoid 97.39.", "6.2 diagramoje palyginkite tris aktyvacijų vidurkius: relu 97.58, tanh 97.43, sigmoid 97.39."],
      ["Write one sentence saying how big the differences are compared with the spread of the three repeats.", "ಮೂರು ಪುನರಾವರ್ತನೆಗಳ ಹರಡುವಿಕೆಗೆ ಹೋಲಿಸಿದರೆ ವ್ಯತ್ಯಾಸಗಳು ಎಷ್ಟು ದೊಡ್ಡವು ಎಂದು ಹೇಳುವ ಒಂದು ವಾಕ್ಯ ಬರೆಯಿರಿ.", "Parašykite vieną sakinį, kokie dideli skirtumai, palyginti su trijų kartojimų sklaida."],
    ],
    questions: [
      {
        q: ["Which run of experiment 6.1 had the highest test accuracy?", "6.1 ಪ್ರಯೋಗದ ಯಾವ ರನ್ ಅತಿ ಹೆಚ್ಚು ಪರೀಕ್ಷಾ ನಿಖರತೆ ಹೊಂದಿತ್ತು?", "Kuris 6.1 eksperimento bandymas turėjo didžiausią testo tikslumą?"],
        options: [
          ["Run 1 (one hidden layer of 128)", "ರನ್ 1 (128 ರ ಒಂದು ಗುಪ್ತ ಪದರ)", "1 bandymas (vienas 128 paslėptas sluoksnis)"],
          ["Run 5 (512-256-128-64)", "ರನ್ 5 (512-256-128-64)", "5 bandymas (512-256-128-64)"],
          ["Run 8 (validation split 30%)", "ರನ್ 8 (ಮೌಲ್ಯಮಾಪನ ವಿಭಜನೆ 30%)", "8 bandymas (validavimo dalis 30 %)"],
        ],
        correct: 1,
        why: ["Run 5 reached 0.9816, the highest of the eight runs. Run 1 had 0.9763.", "ರನ್ 5 0.9816 ತಲುಪಿತು, ಎಂಟು ರನ್‌ಗಳಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು. ರನ್ 1 0.9763 ಹೊಂದಿತ್ತು.", "5 bandymas pasiekė 0.9816 – aukščiausią iš aštuonių. 1 bandymas turėjo 0.9763."],
        verify: () => T61.reduce((best, r) => (r[6] > best[6] ? r : best), T61[0])[0] === 5 && T61[0][6] === 0.9763,
      },
      {
        q: ["The mean accuracies of relu, tanh and sigmoid differ by less than 0.2 percentage points. How should you describe the winner?", "relu, tanh ಮತ್ತು sigmoid ನ ಸರಾಸರಿ ನಿಖರತೆಗಳು 0.2 ಶೇಕಡಾ ಪಾಯಿಂಟ್‌ಗಿಂತ ಕಡಿಮೆ ಭಿನ್ನ. ವಿಜೇತನನ್ನು ಹೇಗೆ ವಿವರಿಸಬೇಕು?", "relu, tanh ir sigmoid vidutiniai tikslumai skiriasi mažiau nei 0.2 procentinio punkto. Kaip turėtumėte apibūdinti nugalėtoją?"],
        options: [
          ["“relu is clearly the best”", "“relu ಸ್ಪಷ್ಟವಾಗಿ ಅತ್ಯುತ್ತಮ”", "„relu aiškiai geriausias“"],
          ["“sigmoid is the worst”", "“sigmoid ಅತ್ಯಂತ ಕೆಟ್ಟದು”", "„sigmoid blogiausias“"],
          ["“relu is slightly better, but about the size of the noise”", "“relu ಸ್ವಲ್ಪ ಉತ್ತಮ, ಆದರೆ ಶಬ್ದದ ಗಾತ್ರದಷ್ಟೇ”", "„relu šiek tiek geresnis, bet apie triukšmo dydžio“"],
        ],
        correct: 2,
        why: ["relu 97.58, tanh 97.43, sigmoid 97.39: a gap of 0.19, while the three repeats of one activation already differ by 0.3-0.4 points.", "relu 97.58, tanh 97.43, sigmoid 97.39: ಅಂತರ 0.19, ಆದರೆ ಒಂದು ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆಯ ಮೂರು ಪುನರಾವರ್ತನೆಗಳು ಈಗಾಗಲೇ 0.3-0.4 ಪಾಯಿಂಟ್ ಭಿನ್ನ.", "relu 97.58, tanh 97.43, sigmoid 97.39: skirtumas 0.19, o trys vienos aktyvacijos kartojimai jau skiriasi 0.3-0.4 punkto."],
        verify: () => {
          const m = (k: string) => mean(T62[k]) * 100;
          const spread = (k: string) => (Math.max(...T62[k]) - Math.min(...T62[k])) * 100;
          return m("relu") - m("sigmoid") < 0.2 && Math.min(spread("relu"), spread("tanh"), spread("sigmoid")) >= 0.3 && Math.max(spread("relu"), spread("tanh"), spread("sigmoid")) <= 0.4;
        },
      },
      {
        q: ["Why is the 98.16% test score not perfectly honest?", "98.16% ಪರೀಕ್ಷಾ ಅಂಕ ಸಂಪೂರ್ಣ ಪ್ರಾಮಾಣಿಕವಲ್ಲ ಏಕೆ?", "Kodėl 98.16 % testo įvertis nėra visiškai sąžiningas?"],
        options: [
          ["The model was chosen on the test set", "ಮಾಡೆಲ್ ಅನ್ನು ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಆರಿಸಲಾಯಿತು", "Modelis buvo parinktas pagal testavimo rinkinį"],
          ["It was trained for too long", "ಅದನ್ನು ತುಂಬಾ ಹೊತ್ತು ತರಬೇತಿ ನೀಡಲಾಯಿತು", "Jis buvo mokytas per ilgai"],
          ["98% is too high to be true", "98% ನಿಜವಾಗಲು ತುಂಬಾ ಹೆಚ್ಚು", "98 % per daug, kad būtų tiesa"],
        ],
        correct: 0,
        why: ["Picking the best of eight runs on the test set lets the test set influence the choice, so the score is slightly optimistic. A separate validation set should choose, and the test set should be used once.", "ಎಂಟು ರನ್‌ಗಳಲ್ಲಿ ಉತ್ತಮವಾದುದನ್ನು ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಆರಿಸುವುದು ಪರೀಕ್ಷಾ ಸೆಟ್ ಆಯ್ಕೆಯ ಮೇಲೆ ಪ್ರಭಾವ ಬೀರಲು ಬಿಡುತ್ತದೆ, ಆದ್ದರಿಂದ ಅಂಕ ಸ್ವಲ್ಪ ಆಶಾವಾದಿ. ಪ್ರತ್ಯೇಕ ಮೌಲ್ಯಮಾಪನ ಸೆಟ್ ಆರಿಸಬೇಕು, ಮತ್ತು ಪರೀಕ್ಷಾ ಸೆಟ್ ಅನ್ನು ಒಮ್ಮೆ ಮಾತ್ರ ಬಳಸಬೇಕು.", "Geriausio iš aštuonių bandymų parinkimas pagal testavimo rinkinį leidžia jam paveikti pasirinkimą, todėl įvertis šiek tiek optimistinis. Rinktis turėtų atskiras validavimo rinkinys, o testavimo rinkinys naudojamas vieną kartą."],
      },
    ],
    takeaways: [
      ["Best model: Dense 512-256-128-64, relu, Adam 0.001, batch 128 → 98.16% test accuracy, loss 0.0845.", "ಅತ್ಯುತ್ತಮ ಮಾಡೆಲ್: Dense 512-256-128-64, relu, Adam 0.001, ಬ್ಯಾಚ್ 128 → 98.16% ಪರೀಕ್ಷಾ ನಿಖರತೆ, ನಷ್ಟ 0.0845.", "Geriausias modelis: Dense 512-256-128-64, relu, Adam 0.001, paketas 128 → 98.16 % testo tikslumas, nuostolis 0.0845."],
      ["Task 5 needs enough learning rate × epochs; then Name 5 is clearly female (output about 0.005 at lr 0.5 and 1000 epochs).", "ಕಾರ್ಯ 5 ಗೆ ಸಾಕಷ್ಟು ಕಲಿಕೆಯ ದರ × ಎಪೋಕ್‌ಗಳು ಬೇಕು; ನಂತರ Name 5 ಸ್ಪಷ್ಟವಾಗಿ ಮಹಿಳೆ (lr 0.5 ಮತ್ತು 1000 ಎಪೋಕ್‌ಗಳಲ್ಲಿ ಔಟ್‌ಪುಟ್ ಸುಮಾರು 0.005).", "5 užduočiai reikia pakankamo mokymosi greičio × epochų; tada Name 5 aiškiai moteris (išvestis apie 0.005 su lr 0.5 ir 1000 epochų)."],
      ["Small differences (about 0.5%) are close to repeat noise: say “slightly better”, not “much better”.", "ಸಣ್ಣ ವ್ಯತ್ಯಾಸಗಳು (ಸುಮಾರು 0.5%) ಪುನರಾವರ್ತನೆ ಶಬ್ದಕ್ಕೆ ಹತ್ತಿರ: “ಸ್ವಲ್ಪ ಉತ್ತಮ” ಎನ್ನಿ, “ಬಹಳ ಉತ್ತಮ” ಅಲ್ಲ.", "Maži skirtumai (apie 0.5 %) artimi kartojimų triukšmui: sakykite „šiek tiek geresnis“, o ne „daug geresnis“."],
    ],
    mistakes: [
      ["Presenting a 0.1% gap as proof that one setting is better.", "0.1% ಅಂತರವನ್ನು ಒಂದು ಸೆಟ್ಟಿಂಗ್ ಉತ್ತಮ ಎಂಬುದಕ್ಕೆ ಸಾಕ್ಷಿಯಾಗಿ ಪ್ರಸ್ತುತಪಡಿಸುವುದು.", "Pateikti 0.1 % skirtumą kaip įrodymą, kad vienas nustatymas geresnis."],
      ["Choosing the model on the test set and then calling that number unbiased.", "ಮಾಡೆಲ್ ಅನ್ನು ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಆರಿಸಿ ಆ ಸಂಖ್ಯೆಯನ್ನು ಪಕ್ಷಪಾತರಹಿತ ಎಂದು ಕರೆಯುವುದು.", "Pasirinkti modelį pagal testavimo rinkinį ir tą skaičių vadinti nešališku."],
    ],
  },

  checklist: {
    goal: [
      "Check which concepts you can already explain and which still need practice.",
      "ನೀವು ಈಗಾಗಲೇ ಯಾವ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ವಿವರಿಸಬಲ್ಲಿರಿ ಮತ್ತು ಯಾವುದಕ್ಕೆ ಇನ್ನೂ ಅಭ್ಯಾಸ ಬೇಕು ಎಂದು ಪರಿಶೀಲಿಸಿ.",
      "Patikrinkite, kurias sąvokas jau galite paaiškinti ir kurioms dar reikia praktikos.",
    ],
    fit: [
      "The checklist maps every topic of the lab to the tool or task where you met it. It turns the lab from something you did into something you can explain at the defense.",
      "ಪರಿಶೀಲನಾ ಪಟ್ಟಿ ಲ್ಯಾಬ್‌ನ ಪ್ರತಿ ವಿಷಯವನ್ನು ನೀವು ಭೇಟಿಯಾದ ಸಾಧನ ಅಥವಾ ಕಾರ್ಯಕ್ಕೆ ಜೋಡಿಸುತ್ತದೆ. ಅದು ಲ್ಯಾಬ್ ಅನ್ನು ನೀವು ಮಾಡಿದ್ದರಿಂದ ರಕ್ಷಣೆಯಲ್ಲಿ ವಿವರಿಸಬಲ್ಲದ್ದಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ.",
      "Kontrolinis sąrašas susieja kiekvieną laboratorijos temą su įrankiu ar užduotimi, kur ją sutikote. Jis paverčia laboratoriją iš to, ką atlikote, į tai, ką galite paaiškinti gynimo metu.",
    ],
    keywords: [
      [["Defense", "ರಕ್ಷಣೆ (defense)", "Gynimas"], ["an oral check where you explain your own code", "ನೀವು ನಿಮ್ಮ ಸ್ವಂತ ಕೋಡ್ ಅನ್ನು ವಿವರಿಸುವ ಮೌಖಿಕ ಪರೀಕ್ಷೆ", "žodinis patikrinimas, kur aiškinate savo kodą"]],
      [["Hyperparameter", "ಹೈಪರ್‌ಪ್ಯಾರಾಮೀಟರ್", "Hiperparametras"], ["a setting chosen before training, like the learning rate", "ತರಬೇತಿಗೆ ಮೊದಲು ಆರಿಸುವ ಸೆಟ್ಟಿಂಗ್, ಕಲಿಕೆಯ ದರದಂತೆ", "prieš mokymą parenkamas nustatymas, pvz., mokymosi greitis"]],
      [["Validation split", "ಮೌಲ್ಯಮಾಪನ ವಿಭಜನೆ", "Validavimo dalis"], ["part of the training data kept back to watch overfitting", "ಓವರ್‌ಫಿಟ್ಟಿಂಗ್ ಗಮನಿಸಲು ಹಿಡಿದಿಟ್ಟ ತರಬೇತಿ ಡೇಟಾದ ಭಾಗ", "mokymo duomenų dalis, palikta persimokymui stebėti"]],
      [["One-hot", "One-hot", "One-hot"], ["a label written as 0s with a single 1, e.g. [0,0,0,0,0,0,0,1,0,0] for a 7", "ಒಂದೇ 1 ಇರುವ 0 ಗಳಾಗಿ ಬರೆದ ಲೇಬಲ್, ಉದಾ. 7 ಗೆ [0,0,0,0,0,0,0,1,0,0]", "žymė, užrašyta nuliais su vienu 1, pvz., [0,0,0,0,0,0,0,1,0,0] skaitmeniui 7"]],
    ],
    tasks: [
      ["Tick every concept you could explain aloud in 30 seconds.", "30 ಸೆಕೆಂಡುಗಳಲ್ಲಿ ಗಟ್ಟಿಯಾಗಿ ವಿವರಿಸಬಲ್ಲ ಪ್ರತಿ ಪರಿಕಲ್ಪನೆಯನ್ನು ಟಿಕ್ ಮಾಡಿ.", "Pažymėkite kiekvieną sąvoką, kurią galėtumėte paaiškinti garsiai per 30 sekundžių."],
      ["For each unticked item, open the matching step in the pipeline map and redo its first task.", "ಟಿಕ್ ಮಾಡದ ಪ್ರತಿ ಐಟಂಗೆ, ಪೈಪ್‌ಲೈನ್ ನಕ್ಷೆಯಲ್ಲಿ ಹೊಂದುವ ಹಂತವನ್ನು ತೆರೆದು ಅದರ ಮೊದಲ ಕಾರ್ಯವನ್ನು ಮತ್ತೆ ಮಾಡಿ.", "Kiekvienam nepažymėtam punktui atidarykite atitinkamą žingsnį schemoje ir pakartokite jo pirmąją užduotį."],
      ["Pick three ticked items and write one example number for each (for instance 575 050 parameters).", "ಟಿಕ್ ಮಾಡಿದ ಮೂರು ಐಟಂಗಳನ್ನು ಆರಿಸಿ ಮತ್ತು ಪ್ರತಿಯೊಂದಕ್ಕೂ ಒಂದು ಉದಾಹರಣೆ ಸಂಖ್ಯೆ ಬರೆಯಿರಿ (ಉದಾ. 575 050 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು).", "Pasirinkite tris pažymėtus punktus ir kiekvienam užrašykite po pavyzdinį skaičių (pvz., 575 050 parametrų)."],
      ["Come back after the Defense step and tick again.", "ರಕ್ಷಣೆ ಹಂತದ ನಂತರ ಮರಳಿ ಬಂದು ಮತ್ತೆ ಟಿಕ್ ಮಾಡಿ.", "Grįžkite po Gynimo žingsnio ir pažymėkite dar kartą."],
    ],
    questions: [
      {
        q: ["Which concept is needed to prepare labels for categorical cross-entropy?", "ವರ್ಗೀಯ ಕ್ರಾಸ್-ಎಂಟ್ರೊಪಿಗೆ ಲೇಬಲ್‌ಗಳನ್ನು ಸಿದ್ಧಪಡಿಸಲು ಯಾವ ಪರಿಕಲ್ಪನೆ ಬೇಕು?", "Kuri sąvoka reikalinga žymėms kategorinei kryžminei entropijai paruošti?"],
        options: [
          ["Min-max scaling", "Min-max ಮಾಪನ", "Min-max normavimas"],
          ["Median imputation", "ಮಧ್ಯಾಂಕ ಭರ್ತಿ", "Medianos imputacija"],
          ["One-hot encoding", "One-hot ಎನ್‌ಕೋಡಿಂಗ್", "One-hot kodavimas"],
        ],
        correct: 2,
        why: ["The loss compares 10 probabilities with a label of 10 numbers, so the digit 7 must become [0,0,0,0,0,0,0,1,0,0].", "ನಷ್ಟ 10 ಸಂಭವನೀಯತೆಗಳನ್ನು 10 ಸಂಖ್ಯೆಗಳ ಲೇಬಲ್‌ನೊಂದಿಗೆ ಹೋಲಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಅಂಕಿ 7 [0,0,0,0,0,0,0,1,0,0] ಆಗಬೇಕು.", "Nuostolis lygina 10 tikimybių su 10 skaičių žyme, todėl skaitmuo 7 turi tapti [0,0,0,0,0,0,0,1,0,0]."],
      },
      {
        q: ["Which part of the data is used to watch overfitting during training?", "ತರಬೇತಿಯ ಸಮಯದಲ್ಲಿ ಓವರ್‌ಫಿಟ್ಟಿಂಗ್ ಗಮನಿಸಲು ಡೇಟಾದ ಯಾವ ಭಾಗವನ್ನು ಬಳಸಲಾಗುತ್ತದೆ?", "Kuri duomenų dalis naudojama persimokymui mokymo metu stebėti?"],
        options: [
          ["The validation split", "ಮೌಲ್ಯಮಾಪನ ವಿಭಜನೆ", "Validavimo dalis"],
          ["The test set", "ಪರೀಕ್ಷಾ ಸೆಟ್", "Testavimo rinkinys"],
          ["The labels only", "ಲೇಬಲ್‌ಗಳು ಮಾತ್ರ", "Tik žymės"],
        ],
        correct: 0,
        why: ["The validation split (20% of the 60 000 training images, 12 000) is held back from the weight updates, so its loss shows when the model starts to memorise. The test set stays untouched for the final score.", "ಮೌಲ್ಯಮಾಪನ ವಿಭಜನೆ (60 000 ತರಬೇತಿ ಚಿತ್ರಗಳ 20%, 12 000) ತೂಕ ನವೀಕರಣಗಳಿಂದ ಹೊರಗಿಡಲಾಗುತ್ತದೆ, ಆದ್ದರಿಂದ ಅದರ ನಷ್ಟ ಮಾಡೆಲ್ ಕಂಠಪಾಠ ಮಾಡಲು ಆರಂಭಿಸಿದಾಗ ತೋರಿಸುತ್ತದೆ. ಪರೀಕ್ಷಾ ಸೆಟ್ ಅಂತಿಮ ಅಂಕಕ್ಕಾಗಿ ಮುಟ್ಟದೆ ಉಳಿಯುತ್ತದೆ.", "Validavimo dalis (20 % iš 60 000 mokymo vaizdų, t. y. 12 000) nenaudojama svorių atnaujinimui, todėl jos nuostolis parodo, kada modelis pradeda įsiminti. Testavimo rinkinys lieka nepaliestas galutiniam įverčiui."],
        verify: () => 60000 * 0.2 === 12000,
      },
      {
        q: ["Which numbers must be computed on the training data only?", "ಯಾವ ಸಂಖ್ಯೆಗಳನ್ನು ತರಬೇತಿ ಡೇಟಾದ ಮೇಲೆ ಮಾತ್ರ ಲೆಕ್ಕ ಹಾಕಬೇಕು?", "Kuriuos skaičius reikia skaičiuoti tik iš mokymo duomenų?"],
        options: [
          ["The digit labels", "ಅಂಕಿ ಲೇಬಲ್‌ಗಳು", "Skaitmenų žymes"],
          ["The number of epochs", "ಎಪೋಕ್‌ಗಳ ಸಂಖ್ಯೆ", "Epochų skaičių"],
          ["The min and max (or mean and std) used for scaling", "ಮಾಪನಕ್ಕೆ ಬಳಸುವ min ಮತ್ತು max (ಅಥವಾ ಸರಾಸರಿ ಮತ್ತು std)", "Normavimui naudojamus min ir max (arba vidurkį ir std)"],
        ],
        correct: 2,
        why: ["The scaler is part of the trained model: its min and max come from training data and are reused unchanged for validation, test and new patients.", "ಮಾಪಕ ತರಬೇತಿ ಪಡೆದ ಮಾಡೆಲ್‌ನ ಭಾಗ: ಅದರ min ಮತ್ತು max ತರಬೇತಿ ಡೇಟಾದಿಂದ ಬರುತ್ತವೆ ಮತ್ತು ಮೌಲ್ಯಮಾಪನ, ಪರೀಕ್ಷೆ ಮತ್ತು ಹೊಸ ರೋಗಿಗಳಿಗೆ ಬದಲಾಯಿಸದೆ ಮರುಬಳಸಲಾಗುತ್ತದೆ.", "Normuoklis yra išmokyto modelio dalis: jo min ir max imami iš mokymo duomenų ir nekeičiami naudojami validavimui, testavimui ir naujiems pacientams."],
      },
    ],
    takeaways: [
      ["The lab has four layers of knowledge: foundations, data preparation, the neural-network core, and Keras with MNIST.", "ಲ್ಯಾಬ್‌ನಲ್ಲಿ ನಾಲ್ಕು ಪದರಗಳ ಜ್ಞಾನವಿದೆ: ಮೂಲಭೂತ ಅಂಶಗಳು, ಡೇಟಾ ಸಿದ್ಧತೆ, ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್‌ನ ತಿರುಳು, ಮತ್ತು Keras ಜೊತೆ MNIST.", "Laboratorija turi keturis žinių sluoksnius: pagrindai, duomenų paruošimas, neuroninio tinklo šerdis ir Keras su MNIST."],
      ["Every concept has a number you can quote: 165.83 cm, z = 5.22, 0.04, 9 parameters, 575 050, 98.16%.", "ಪ್ರತಿ ಪರಿಕಲ್ಪನೆಗೂ ಉಲ್ಲೇಖಿಸಬಹುದಾದ ಸಂಖ್ಯೆ ಇದೆ: 165.83 cm, z = 5.22, 0.04, 9 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು, 575 050, 98.16%.", "Kiekviena sąvoka turi skaičių, kurį galite paminėti: 165.83 cm, z = 5.22, 0.04, 9 parametrai, 575 050, 98.16 %."],
      ["Your ticks are saved in this browser; revisit them before the defense.", "ನಿಮ್ಮ ಟಿಕ್‌ಗಳು ಈ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಉಳಿಯುತ್ತವೆ; ರಕ್ಷಣೆಗೆ ಮೊದಲು ಅವನ್ನು ಮತ್ತೆ ನೋಡಿ.", "Jūsų varnelės išsaugomos šioje naršyklėje; peržiūrėkite jas prieš gynimą."],
    ],
    mistakes: [
      ["Ticking an item because it sounds familiar rather than because you can explain it.", "ಐಟಂ ವಿವರಿಸಬಲ್ಲಿರಿ ಎಂಬುದಕ್ಕಲ್ಲ, ಪರಿಚಿತವೆನಿಸುತ್ತದೆ ಎಂಬುದಕ್ಕೆ ಟಿಕ್ ಮಾಡುವುದು.", "Pažymėti punktą dėl to, kad jis skamba pažįstamai, o ne dėl to, kad galite jį paaiškinti."],
      ["Skipping the honest limits: they are part of what you must be able to say.", "ಪ್ರಾಮಾಣಿಕ ಮಿತಿಗಳನ್ನು ಬಿಟ್ಟುಬಿಡುವುದು: ಅವು ನೀವು ಹೇಳಲು ಸಾಧ್ಯವಾಗಬೇಕಾದ ಭಾಗ.", "Praleisti sąžiningus apribojimus: tai dalis to, ką turite sugebėti pasakyti."],
    ],
  },

  defense: {
    goal: [
      "Practise short, number-backed answers to the questions you are likely to get.",
      "ನಿಮಗೆ ಬರುವ ಸಾಧ್ಯತೆಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಸಂಖ್ಯೆಗಳ ಬೆಂಬಲವಿರುವ ಸಣ್ಣ ಉತ್ತರಗಳನ್ನು ಅಭ್ಯಾಸ ಮಾಡಿ.",
      "Pasitreniruokite trumpų, skaičiais paremtų atsakymų į klausimus, kuriuos greičiausiai gausite.",
    ],
    fit: [
      "At the defense you must explain your own code. These 14 Q&As summarise each task with the numbers to quote, and the table at the end says which notebook cell to open.",
      "ರಕ್ಷಣೆಯಲ್ಲಿ ನೀವು ನಿಮ್ಮ ಸ್ವಂತ ಕೋಡ್ ಅನ್ನು ವಿವರಿಸಬೇಕು. ಈ 14 ಪ್ರಶ್ನೋತ್ತರಗಳು ಉಲ್ಲೇಖಿಸಬೇಕಾದ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ಪ್ರತಿ ಕಾರ್ಯವನ್ನು ಸಂಕ್ಷೇಪಿಸುತ್ತವೆ, ಮತ್ತು ಕೊನೆಯ ಕೋಷ್ಟಕ ಯಾವ ನೋಟ್‌ಬುಕ್ ಸೆಲ್ ತೆರೆಯಬೇಕು ಎಂದು ಹೇಳುತ್ತದೆ.",
      "Gynimo metu turite paaiškinti savo kodą. Šie 14 klausimų ir atsakymų apibendrina kiekvieną užduotį su skaičiais, kuriuos reikia paminėti, o lentelė pabaigoje nurodo, kurį užrašų knygelės langelį atidaryti.",
    ],
    keywords: [
      [["Masking", "ಮರೆಮಾಚುವಿಕೆ", "Maskavimas"], ["a big outlier hides itself from the Z-score by inflating σ", "ದೊಡ್ಡ ಅಸಂಗತ ಮೌಲ್ಯ σ ಅನ್ನು ಹೆಚ್ಚಿಸಿ Z-score ನಿಂದ ತನ್ನನ್ನು ಅಡಗಿಸಿಕೊಳ್ಳುತ್ತದೆ", "didelė išskirtis pasislepia nuo Z-įverčio padidindama σ"]],
      [["Overfitting", "ಓವರ್‌ಫಿಟ್ಟಿಂಗ್", "Persimokymas"], ["the model memorises the training set", "ಮಾಡೆಲ್ ತರಬೇತಿ ಸೆಟ್ ಅನ್ನು ಕಂಠಪಾಠ ಮಾಡುತ್ತದೆ", "modelis įsimena mokymo rinkinį"]],
      [["Learning curve", "ಕಲಿಕೆಯ ವಕ್ರರೇಖೆ", "Mokymosi kreivė"], ["training and validation loss for every epoch", "ಪ್ರತಿ ಎಪೋಕ್‌ಗೆ ತರಬೇತಿ ಮತ್ತು ಮೌಲ್ಯಮಾಪನ ನಷ್ಟ", "mokymo ir validavimo nuostolis kiekvienai epochai"]],
      [["Chance level", "ಆಕಸ್ಮಿಕ ಮಟ್ಟ", "Atsitiktinis lygis"], ["accuracy of random guessing: 10% for 10 classes", "ಯಾದೃಚ್ಛಿಕ ಊಹೆಯ ನಿಖರತೆ: 10 ವರ್ಗಗಳಿಗೆ 10%", "atsitiktinio spėjimo tikslumas: 10 % esant 10 klasių"]],
    ],
    tasks: [
      ["Open three questions but cover the answer: say your own answer aloud first.", "ಮೂರು ಪ್ರಶ್ನೆಗಳನ್ನು ತೆರೆಯಿರಿ ಆದರೆ ಉತ್ತರವನ್ನು ಮುಚ್ಚಿ: ಮೊದಲು ನಿಮ್ಮ ಸ್ವಂತ ಉತ್ತರವನ್ನು ಗಟ್ಟಿಯಾಗಿ ಹೇಳಿ.", "Atidarykite tris klausimus, bet uždenkite atsakymą: pirmiausia garsiai pasakykite savo atsakymą."],
      ["Check each of your answers against the numbers quoted in the text.", "ನಿಮ್ಮ ಪ್ರತಿ ಉತ್ತರವನ್ನು ಪಠ್ಯದಲ್ಲಿ ಉಲ್ಲೇಖಿಸಿದ ಸಂಖ್ಯೆಗಳ ವಿರುದ್ಧ ಪರಿಶೀಲಿಸಿ.", "Palyginkite kiekvieną savo atsakymą su tekste paminėtais skaičiais."],
      ["Use the quick-map table to find the notebook cells for Tasks 3 and 5.", "ಕಾರ್ಯಗಳು 3 ಮತ್ತು 5 ರ ನೋಟ್‌ಬುಕ್ ಸೆಲ್‌ಗಳನ್ನು ಹುಡುಕಲು ತ್ವರಿತ ನಕ್ಷೆ ಕೋಷ್ಟಕವನ್ನು ಬಳಸಿ.", "Naudodamiesi greitos schemos lentele raskite 3 ir 5 užduočių užrašų knygelės langelius."],
      ["Practise the one-minute backpropagation answer without looking.", "ಒಂದು ನಿಮಿಷದ ಬ್ಯಾಕ್‌ಪ್ರಾಪಗೇಷನ್ ಉತ್ತರವನ್ನು ನೋಡದೆ ಅಭ್ಯಾಸ ಮಾಡಿ.", "Pasitreniruokite vienos minutės atgalinio sklidimo atsakymo nežiūrėdami."],
    ],
    questions: [
      {
        q: ["Why can the Z-score rule miss an outlier that Chauvenet and IQR catch?", "Chauvenet ಮತ್ತು IQR ಹಿಡಿಯುವ ಅಸಂಗತ ಮೌಲ್ಯವನ್ನು Z-score ನಿಯಮ ಏಕೆ ತಪ್ಪಿಸಬಹುದು?", "Kodėl Z-įverčio taisyklė gali nepastebėti išskirties, kurią pagauna Chauvenet ir IQR?"],
        options: [
          ["Masking: the outlier inflates σ and so shrinks its own z", "ಮರೆಮಾಚುವಿಕೆ: ಅಸಂಗತ ಮೌಲ್ಯ σ ಅನ್ನು ಹೆಚ್ಚಿಸಿ ತನ್ನದೇ z ಅನ್ನು ಕುಗ್ಗಿಸುತ್ತದೆ", "Maskavimas: išskirtis padidina σ ir taip sumažina savo z"],
          ["The Z-score rule ignores large values", "Z-score ನಿಯಮ ದೊಡ್ಡ ಮೌಲ್ಯಗಳನ್ನು ನಿರ್ಲಕ್ಷಿಸುತ್ತದೆ", "Z-įverčio taisyklė ignoruoja dideles reikšmes"],
          ["Chauvenet uses the MNIST data", "Chauvenet MNIST ಡೇಟಾ ಬಳಸುತ್ತದೆ", "Chauvenet naudoja MNIST duomenis"],
        ],
        correct: 0,
        why: ["With 88 present σ = 14.04; at 21 the value gives only z = 2.98, below the limit of 3, while n·P = 0.0857 and the IQR fence 19.625 still flag it.", "88 ಇರುವಾಗ σ = 14.04; 21 ರಲ್ಲಿ ಮೌಲ್ಯ ಕೇವಲ z = 2.98 ನೀಡುತ್ತದೆ, ಮಿತಿ 3 ಕ್ಕಿಂತ ಕೆಳಗೆ, ಆದರೆ n·P = 0.0857 ಮತ್ತು IQR ಬೇಲಿ 19.625 ಇನ್ನೂ ಗುರುತಿಸುತ್ತವೆ.", "Su 88 σ = 14.04; ties 21 reikšmė duoda tik z = 2.98 – žemiau ribos 3, o n·P = 0.0857 ir IQR riba 19.625 vis dar ją pažymi."],
      },
      {
        q: ["What did learning rate 0.01 with 100 epochs give in Task 5?", "ಕಾರ್ಯ 5 ರಲ್ಲಿ ಕಲಿಕೆಯ ದರ 0.01 ಮತ್ತು 100 ಎಪೋಕ್‌ಗಳು ಏನು ನೀಡಿದವು?", "Ką 5 užduotyje davė mokymosi greitis 0.01 su 100 epochų?"],
        options: [
          ["100% accuracy", "100% ನಿಖರತೆ", "100 % tikslumą"],
          ["About 53% accuracy and a wrong answer for Name 5", "ಸುಮಾರು 53% ನಿಖರತೆ ಮತ್ತು Name 5 ಗೆ ತಪ್ಪು ಉತ್ತರ", "Apie 53 % tikslumą ir klaidingą atsakymą Name 5"],
          ["The network diverged", "ನೆಟ್‌ವರ್ಕ್ ಅಪಸರಣವಾಯಿತು", "Tinklas diverguojo"],
        ],
        correct: 1,
        why: ["Run 1 of the notebook table: accuracy 0.533, output 0.5611, so Name 5 was called male, which is wrong. The step was too small to learn in 100 epochs.", "ನೋಟ್‌ಬುಕ್ ಕೋಷ್ಟಕದ ರನ್ 1: ನಿಖರತೆ 0.533, ಔಟ್‌ಪುಟ್ 0.5611, ಆದ್ದರಿಂದ Name 5 ಅನ್ನು ಪುರುಷ ಎಂದು ಕರೆಯಲಾಯಿತು, ಅದು ತಪ್ಪು. 100 ಎಪೋಕ್‌ಗಳಲ್ಲಿ ಕಲಿಯಲು ಹೆಜ್ಜೆ ತುಂಬಾ ಚಿಕ್ಕದಾಗಿತ್ತು.", "Užrašų knygelės lentelės 1 bandymas: tikslumas 0.533, išvestis 0.5611, todėl Name 5 pavadintas vyru – tai klaida. Žingsnis buvo per mažas, kad per 100 epochų išmoktų."],
        verify: () => T5[0][1] === 0.01 && T5[0][2] === 100 && T5[0][4] === 0.533 && T5[0][5] > 0.5,
      },
      {
        q: ["Why softmax with categorical cross-entropy for MNIST?", "MNIST ಗೆ ವರ್ಗೀಯ ಕ್ರಾಸ್-ಎಂಟ್ರೊಪಿಯೊಂದಿಗೆ softmax ಏಕೆ?", "Kodėl MNIST naudojami softmax ir kategorinė kryžminė entropija?"],
        options: [
          ["Ten exclusive classes: probabilities that sum to 1 and a loss that punishes confident wrong answers", "ಹತ್ತು ಪರಸ್ಪರ ಹೊರಗಿಡುವ ವರ್ಗಗಳು: ಮೊತ್ತ 1 ಆಗುವ ಸಂಭವನೀಯತೆಗಳು ಮತ್ತು ವಿಶ್ವಾಸದ ತಪ್ಪು ಉತ್ತರಗಳನ್ನು ಶಿಕ್ಷಿಸುವ ನಷ್ಟ", "Dešimt viena kitą paneigiančių klasių: tikimybės, kurių suma 1, ir nuostolis, baudžiantis užtikrintus klaidingus atsakymus"],
          ["Because sigmoid is not available in Keras", "Keras ನಲ್ಲಿ sigmoid ಲಭ್ಯವಿಲ್ಲದ ಕಾರಣ", "Nes Keras nėra sigmoid"],
          ["To reduce the number of pixels", "ಪಿಕ್ಸೆಲ್‌ಗಳ ಸಂಖ್ಯೆ ಕಡಿಮೆ ಮಾಡಲು", "Kad sumažintų pikselių skaičių"],
        ],
        correct: 0,
        why: ["A digit is exactly one of ten classes. Softmax gives ten probabilities summing to 1, and −ln(probability of the true class) is large when the network is confident and wrong.", "ಅಂಕಿ ನಿಖರವಾಗಿ ಹತ್ತು ವರ್ಗಗಳಲ್ಲಿ ಒಂದು. Softmax ಮೊತ್ತ 1 ಆಗುವ ಹತ್ತು ಸಂಭವನೀಯತೆಗಳನ್ನು ನೀಡುತ್ತದೆ, ಮತ್ತು ನೆಟ್‌ವರ್ಕ್ ವಿಶ್ವಾಸದಿಂದ ತಪ್ಪಾದಾಗ −ln(ನಿಜವಾದ ವರ್ಗದ ಸಂಭವನೀಯತೆ) ದೊಡ್ಡದು.", "Skaitmuo yra lygiai viena iš dešimties klasių. Softmax duoda dešimt tikimybių, kurių suma 1, o −ln(tikrosios klasės tikimybė) yra didelis, kai tinklas užtikrintas ir klysta."],
      },
    ],
    takeaways: [
      ["Put a number behind every claim: 165.83 cm, z = 5.22, limits 4.625 / 19.625, 98.16%.", "ಪ್ರತಿ ಹೇಳಿಕೆಯ ಹಿಂದೆ ಒಂದು ಸಂಖ್ಯೆ ಇಡಿ: 165.83 cm, z = 5.22, ಮಿತಿಗಳು 4.625 / 19.625, 98.16%.", "Prie kiekvieno teiginio pridėkite skaičių: 165.83 cm, z = 5.22, ribos 4.625 / 19.625, 98.16 %."],
      ["Explain masking, overfitting and the learning-rate effects in one sentence each.", "ಮರೆಮಾಚುವಿಕೆ, ಓವರ್‌ಫಿಟ್ಟಿಂಗ್ ಮತ್ತು ಕಲಿಕೆಯ ದರದ ಪರಿಣಾಮಗಳನ್ನು ಒಂದೊಂದು ವಾಕ್ಯದಲ್ಲಿ ವಿವರಿಸಿ.", "Paaiškinkite maskavimą, persimokymą ir mokymosi greičio poveikį po vieną sakinį."],
      ["Admit the limits: the model was chosen on the test set, only 3 repeats, one test digit.", "ಮಿತಿಗಳನ್ನು ಒಪ್ಪಿಕೊಳ್ಳಿ: ಮಾಡೆಲ್ ಅನ್ನು ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಆರಿಸಲಾಯಿತು, ಕೇವಲ 3 ಪುನರಾವರ್ತನೆಗಳು, ಒಂದು ಪರೀಕ್ಷಾ ಅಂಕಿ.", "Pripažinkite apribojimus: modelis parinktas pagal testavimo rinkinį, tik 3 kartojimai, vienas bandomasis skaitmuo."],
    ],
    mistakes: [
      ["Quoting numbers without being able to say where they came from.", "ಸಂಖ್ಯೆಗಳನ್ನು ಉಲ್ಲೇಖಿಸಿ ಅವು ಎಲ್ಲಿಂದ ಬಂದವು ಎಂದು ಹೇಳಲಾಗದಿರುವುದು.", "Minėti skaičius nesugebant pasakyti, iš kur jie atsirado."],
      ["Overclaiming: calling a 0.5% difference decisive.", "ಅತಿಯಾಗಿ ಹೇಳುವುದು: 0.5% ವ್ಯತ್ಯಾಸವನ್ನು ನಿರ್ಣಾಯಕ ಎನ್ನುವುದು.", "Pervertinimas: 0.5 % skirtumo vadinimas lemiamu."],
    ],
  },
};
