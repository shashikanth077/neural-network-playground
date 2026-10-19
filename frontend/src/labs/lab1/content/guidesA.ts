import { PATIENTS, HEIGHTS, AGES, SUSPECT_INDEX } from "../data";
import { groupStats, impute, minMax, pointReport, scaleMinMax } from "../math";
import type { GuideDef } from "./types";

/** Step guides 1-5. English first, then Kannada, then Lithuanian. Numbers are the lab's real values (checked by tests). */
export const guidesA: Record<string, GuideDef> = {
  "big-picture": {
    goal: [
      "See the whole journey in one view: six tasks from messy data to a working network, and why they come in this order.",
      "ಒಂದೇ ನೋಟದಲ್ಲಿ ಇಡೀ ಪ್ರಯಾಣವನ್ನು ನೋಡಿ: ಅಸ್ತವ್ಯಸ್ತ ಡೇಟಾದಿಂದ ಕೆಲಸ ಮಾಡುವ ನೆಟ್‌ವರ್ಕ್‌ವರೆಗೆ ಆರು ಕಾರ್ಯಗಳು, ಮತ್ತು ಅವು ಈ ಕ್ರಮದಲ್ಲಿ ಏಕೆ ಬರುತ್ತವೆ.",
      "Pamatykite visą kelią vienu žvilgsniu: šešios užduotys nuo netvarkingų duomenų iki veikiančio tinklo ir kodėl jos eina būtent šia tvarka.",
    ],
    fit: [
      "Everything later builds on this order: clean the data (Tasks 1-4), scale it (Task 5), teach the model (Tasks 5-6), then compare settings (6.1-6.3). Skipping the first part damages the last part.",
      "ನಂತರದ ಎಲ್ಲವೂ ಈ ಕ್ರಮದ ಮೇಲೆ ನಿಂತಿದೆ: ಡೇಟಾ ಸ್ವಚ್ಛಗೊಳಿಸಿ (ಕಾರ್ಯಗಳು 1-4), ಮಾಪನ ಮಾಡಿ (ಕಾರ್ಯ 5), ಮಾಡೆಲ್‌ಗೆ ಕಲಿಸಿ (ಕಾರ್ಯಗಳು 5-6), ನಂತರ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಹೋಲಿಸಿ (6.1-6.3). ಮೊದಲ ಭಾಗವನ್ನು ಬಿಟ್ಟರೆ ಕೊನೆಯ ಭಾಗ ಹಾಳಾಗುತ್ತದೆ.",
      "Viskas vėliau remiasi šia tvarka: išvalyti duomenis (1-4 užduotys), normuoti (5 užduotis), išmokyti modelį (5-6 užduotys), tada palyginti nustatymus (6.1-6.3). Praleidus pirmąją dalį, nukenčia paskutinė.",
    ],
    keywords: [
      [["Imputation", "ಭರ್ತಿ (imputation)", "Imputacija"], ["filling a missing value with a good guess", "ಕಾಣೆಯಾದ ಮೌಲ್ಯವನ್ನು ಉತ್ತಮ ಅಂದಾಜಿನಿಂದ ತುಂಬುವುದು", "trūkstamos reikšmės užpildymas geru įverčiu"]],
      [["Outlier", "ಅಸಂಗತ ಮೌಲ್ಯ", "Išskirtis"], ["a value that does not fit the rest", "ಉಳಿದವುಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗದ ಮೌಲ್ಯ", "reikšmė, netinkanti prie kitų"]],
      [["Normalization", "ಸಾಮಾನ್ಯೀಕರಣ", "Normavimas"], ["putting features on a common scale", "ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಸಾಮಾನ್ಯ ಮಾಪಕದಲ್ಲಿ ಇಡುವುದು", "požymių sudėjimas į bendrą skalę"]],
      [["Test set", "ಪರೀಕ್ಷಾ ಸೆಟ್", "Testavimo rinkinys"], ["data the model never saw, used for the honest score", "ಮಾಡೆಲ್ ಎಂದೂ ನೋಡದ ಡೇಟಾ, ಪ್ರಾಮಾಣಿಕ ಅಂಕಕ್ಕಾಗಿ", "duomenys, kurių modelis niekada nematė, sąžiningam įverčiui"]],
    ],
    tasks: [
      ["Read the six cards and say aloud, in one sentence each, what every task does.", "ಆರು ಕಾರ್ಡ್‌ಗಳನ್ನು ಓದಿ ಮತ್ತು ಪ್ರತಿ ಕಾರ್ಯ ಏನು ಮಾಡುತ್ತದೆ ಎಂದು ಒಂದೊಂದು ವಾಕ್ಯದಲ್ಲಿ ಗಟ್ಟಿಯಾಗಿ ಹೇಳಿ.", "Perskaitykite šešias korteles ir garsiai pasakykite po vieną sakinį, ką daro kiekviena užduotis."],
      ["Click “Open this step →” on the card Fill gaps, then use the pipeline map at the top to come back here.", "“ಖಾಲಿ ಜಾಗ ತುಂಬಿ” ಕಾರ್ಡ್‌ನ “ಈ ಹಂತವನ್ನು ತೆರೆಯಿರಿ →” ಕ್ಲಿಕ್ ಮಾಡಿ, ನಂತರ ಮೇಲಿನ ಪೈಪ್‌ಲೈನ್ ನಕ್ಷೆಯಿಂದ ಇಲ್ಲಿಗೆ ಮರಳಿ.", "Spustelėkite „Atidaryti šį žingsnį →“ kortelėje Užpildyti spragas, tada schemos viršuje grįžkite čia."],
      ["On the cards find how many handwritten digits MNIST contains (70 000) and how many classes there are (10).", "ಕಾರ್ಡ್‌ಗಳಲ್ಲಿ MNIST ಎಷ್ಟು ಕೈಬರಹದ ಅಂಕಿಗಳನ್ನು ಹೊಂದಿದೆ (70 000) ಮತ್ತು ಎಷ್ಟು ವರ್ಗಗಳಿವೆ (10) ಎಂದು ಹುಡುಕಿ.", "Kortelėse suraskite, kiek ranka rašytų skaitmenų turi MNIST (70 000) ir kiek yra klasių (10)."],
      ["Write one sentence in your own words: why must the test set stay unseen until the end?", "ನಿಮ್ಮ ಸ್ವಂತ ಮಾತುಗಳಲ್ಲಿ ಒಂದು ವಾಕ್ಯ ಬರೆಯಿರಿ: ಪರೀಕ್ಷಾ ಸೆಟ್ ಕೊನೆಯವರೆಗೆ ಕಾಣದಿರಬೇಕಾದದ್ದು ಏಕೆ?", "Parašykite vieną sakinį savais žodžiais: kodėl testavimo rinkinys turi likti nematytas iki pat galo?"],
    ],
    questions: [
      {
        q: ["Which order do real machine-learning projects follow?", "ನಿಜವಾದ ಮೆಷಿನ್ ಲರ್ನಿಂಗ್ ಯೋಜನೆಗಳು ಯಾವ ಕ್ರಮವನ್ನು ಅನುಸರಿಸುತ್ತವೆ?", "Kokia tvarka vyksta tikri mašininio mokymosi projektai?"],
        options: [
          ["Train the model first, then clean the data", "ಮೊದಲು ಮಾಡೆಲ್‌ಗೆ ತರಬೇತಿ ನೀಡಿ, ನಂತರ ಡೇಟಾ ಸ್ವಚ್ಛಗೊಳಿಸಿ", "Pirmiausia mokyti modelį, paskui valyti duomenis"],
          ["Clean and scale the data, then train, then compare settings", "ಡೇಟಾ ಸ್ವಚ್ಛಗೊಳಿಸಿ ಮತ್ತು ಮಾಪನ ಮಾಡಿ, ನಂತರ ತರಬೇತಿ ನೀಡಿ, ನಂತರ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಹೋಲಿಸಿ", "Išvalyti ir normuoti duomenis, tada mokyti, tada lyginti nustatymus"],
          ["Pick the optimizer first, then collect the data", "ಮೊದಲು ಆಪ್ಟಿಮೈಜರ್ ಆರಿಸಿ, ನಂತರ ಡೇಟಾ ಸಂಗ್ರಹಿಸಿ", "Pirmiausia pasirinkti optimizatorių, paskui rinkti duomenis"],
        ],
        correct: 1,
        why: ["The model only learns what you show it, so gaps, typos and wrong scales are fixed first. Settings are compared last, on the same prepared data.", "ಮಾಡೆಲ್ ನೀವು ತೋರಿಸಿದ್ದನ್ನು ಮಾತ್ರ ಕಲಿಯುತ್ತದೆ, ಆದ್ದರಿಂದ ಖಾಲಿ ಜಾಗಗಳು, ಮುದ್ರಣ ದೋಷಗಳು ಮತ್ತು ತಪ್ಪು ಮಾಪಕಗಳನ್ನು ಮೊದಲು ಸರಿಪಡಿಸಲಾಗುತ್ತದೆ. ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಕೊನೆಯಲ್ಲಿ, ಅದೇ ಸಿದ್ಧಪಡಿಸಿದ ಡೇಟಾದ ಮೇಲೆ ಹೋಲಿಸಲಾಗುತ್ತದೆ.", "Modelis išmoksta tik tai, ką jam parodote, todėl spragos, rašybos klaidos ir blogi mastelai taisomi pirmiausia. Nustatymai lyginami paskiausiai, tuose pačiuose paruoštuose duomenyse."],
      },
      {
        q: ["Why do we report the final score on the test set?", "ಅಂತಿಮ ಅಂಕವನ್ನು ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಏಕೆ ವರದಿ ಮಾಡುತ್ತೇವೆ?", "Kodėl galutinį įvertį pateikiame testavimo rinkinyje?"],
        options: [
          ["Because it is the largest part of the data", "ಏಕೆಂದರೆ ಅದು ಡೇಟಾದ ಅತಿ ದೊಡ್ಡ ಭಾಗ", "Nes tai didžiausia duomenų dalis"],
          ["Because it makes training faster", "ಏಕೆಂದರೆ ಅದು ತರಬೇತಿಯನ್ನು ವೇಗಗೊಳಿಸುತ್ತದೆ", "Nes tai pagreitina mokymą"],
          ["Because the model never saw it, so the score is honest", "ಏಕೆಂದರೆ ಮಾಡೆಲ್ ಅದನ್ನು ಎಂದೂ ನೋಡಿಲ್ಲ, ಆದ್ದರಿಂದ ಅಂಕ ಪ್ರಾಮಾಣಿಕ", "Nes modelis jo niekada nematė, todėl įvertis sąžiningas"],
        ],
        correct: 2,
        why: ["A score on data the model has memorised proves nothing; unseen data shows how it behaves on new cases.", "ಮಾಡೆಲ್ ಕಂಠಪಾಠ ಮಾಡಿದ ಡೇಟಾದ ಮೇಲಿನ ಅಂಕ ಏನನ್ನೂ ಸಾಬೀತುಪಡಿಸುವುದಿಲ್ಲ; ಕಾಣದ ಡೇಟಾ ಹೊಸ ಸಂದರ್ಭಗಳಲ್ಲಿ ಅದು ಹೇಗೆ ವರ್ತಿಸುತ್ತದೆ ಎಂದು ತೋರಿಸುತ್ತದೆ.", "Įvertis duomenyse, kuriuos modelis įsiminė, nieko neįrodo; nematyti duomenys parodo, kaip jis elgiasi naujais atvejais."],
      },
      {
        q: ["How many numbers describe one MNIST picture, and how many classes are there?", "ಒಂದು MNIST ಚಿತ್ರವನ್ನು ಎಷ್ಟು ಸಂಖ್ಯೆಗಳು ವಿವರಿಸುತ್ತವೆ, ಮತ್ತು ಎಷ್ಟು ವರ್ಗಗಳಿವೆ?", "Kiek skaičių apibūdina vieną MNIST paveikslą ir kiek yra klasių?"],
        options: [
          ["784 numbers, 10 classes", "784 ಸಂಖ್ಯೆಗಳು, 10 ವರ್ಗಗಳು", "784 skaičiai, 10 klasių"],
          ["28 numbers, 10 classes", "28 ಸಂಖ್ಯೆಗಳು, 10 ವರ್ಗಗಳು", "28 skaičiai, 10 klasių"],
          ["784 numbers, 784 classes", "784 ಸಂಖ್ಯೆಗಳು, 784 ವರ್ಗಗಳು", "784 skaičiai, 784 klasės"],
        ],
        correct: 0,
        why: ["28 × 28 = 784 pixels, and there is one class per digit 0-9.", "28 × 28 = 784 ಪಿಕ್ಸೆಲ್‌ಗಳು, ಮತ್ತು 0-9 ಪ್ರತಿ ಅಂಕಿಗೆ ಒಂದು ವರ್ಗ.", "28 × 28 = 784 pikseliai, o kiekvienam skaitmeniui 0-9 yra po vieną klasę."],
        verify: () => 28 * 28 === 784,
      },
    ],
    takeaways: [
      ["Data preparation (Tasks 1-4) comes before the model; the model is only the last third of the work.", "ಡೇಟಾ ಸಿದ್ಧತೆ (ಕಾರ್ಯಗಳು 1-4) ಮಾಡೆಲ್‌ಗಿಂತ ಮೊದಲು ಬರುತ್ತದೆ; ಮಾಡೆಲ್ ಕೆಲಸದ ಕೊನೆಯ ಮೂರನೇ ಒಂದು ಭಾಗ ಮಾತ್ರ.", "Duomenų paruošimas (1-4 užduotys) eina prieš modelį; modelis yra tik paskutinis darbo trečdalis."],
      ["“Garbage in, garbage out”: the network learns typos and wrong scales as faithfully as real patterns.", "“Garbage in, garbage out”: ನೆಟ್‌ವರ್ಕ್ ನಿಜವಾದ ಮಾದರಿಗಳಷ್ಟೇ ನಿಷ್ಠೆಯಿಂದ ಮುದ್ರಣ ದೋಷಗಳನ್ನು ಮತ್ತು ತಪ್ಪು ಮಾಪಕಗಳನ್ನು ಕಲಿಯುತ್ತದೆ.", "„Garbage in, garbage out“: tinklas rašybos klaidas ir blogus mastelius išmoksta taip pat ištikimai kaip tikrus dėsningumus."],
      ["Always judge a model on data it has never seen.", "ಮಾಡೆಲ್ ಅನ್ನು ಯಾವಾಗಲೂ ಅದು ಎಂದೂ ನೋಡದ ಡೇಟಾದ ಮೇಲೆ ಅಳೆಯಿರಿ.", "Modelį visada vertinkite duomenimis, kurių jis niekada nematė."],
    ],
    mistakes: [
      ["Treating the neural network as magic that fixes dirty data by itself.", "ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್ ಅನ್ನು ಕೊಳಕು ಡೇಟಾವನ್ನು ತಾನೇ ಸರಿಪಡಿಸುವ ಮಾಯಾಜಾಲ ಎಂದು ಭಾವಿಸುವುದು.", "Neuroninį tinklą laikyti magija, kuri pati ištaiso nešvarius duomenis."],
      ["Reporting accuracy on the same data the model was trained on.", "ಮಾಡೆಲ್‌ಗೆ ತರಬೇತಿ ನೀಡಿದ ಅದೇ ಡೇಟಾದ ಮೇಲೆ ನಿಖರತೆಯನ್ನು ವರದಿ ಮಾಡುವುದು.", "Pateikti tikslumą tuose pačiuose duomenyse, kuriais modelis buvo mokytas."],
    ],
  },

  "real-world": {
    goal: [
      "Connect each task to something companies really do, so the numbers feel real.",
      "ಪ್ರತಿ ಕಾರ್ಯವನ್ನು ಕಂಪನಿಗಳು ನಿಜವಾಗಿ ಮಾಡುವ ಕೆಲಸಕ್ಕೆ ಜೋಡಿಸಿ, ಇದರಿಂದ ಸಂಖ್ಯೆಗಳು ನಿಜವೆನಿಸುತ್ತವೆ.",
      "Susiekite kiekvieną užduotį su tuo, ką įmonės daro iš tikrųjų, kad skaičiai taptų gyvi.",
    ],
    fit: [
      "Imputation, anomaly detection and digit reading are everyday tools in hospitals, schools and post offices. This step shows why the following steps matter before you meet the maths.",
      "ಭರ್ತಿ, ಅಸಂಗತತೆ ಪತ್ತೆ ಮತ್ತು ಅಂಕಿ ಓದುವಿಕೆ ಆಸ್ಪತ್ರೆಗಳು, ಶಾಲೆಗಳು ಮತ್ತು ಅಂಚೆ ಕಚೇರಿಗಳಲ್ಲಿ ದೈನಂದಿನ ಸಾಧನಗಳು. ಗಣಿತವನ್ನು ಭೇಟಿಯಾಗುವ ಮೊದಲು ಮುಂದಿನ ಹಂತಗಳು ಏಕೆ ಮುಖ್ಯ ಎಂದು ಈ ಹಂತ ತೋರಿಸುತ್ತದೆ.",
      "Imputacija, anomalijų aptikimas ir skaitmenų skaitymas yra kasdieniai įrankiai ligoninėse, mokyklose ir pašte. Šis žingsnis parodo, kodėl tolesni žingsniai svarbūs, dar prieš sutinkant matematiką.",
    ],
    keywords: [
      [["Imputation", "ಭರ್ತಿ (imputation)", "Imputacija"], ["replacing a gap by an estimate from similar records", "ಖಾಲಿ ಜಾಗವನ್ನು ಹೋಲುವ ದಾಖಲೆಗಳ ಅಂದಾಜಿನಿಂದ ಬದಲಿಸುವುದು", "spragos pakeitimas įverčiu iš panašių įrašų"]],
      [["Anomaly", "ಅಸಂಗತತೆ", "Anomalija"], ["a record that is statistically too far from the rest", "ಸಾಂಖ್ಯಿಕವಾಗಿ ಉಳಿದವುಗಳಿಂದ ತುಂಬಾ ದೂರದ ದಾಖಲೆ", "įrašas, statistiškai per toli nuo kitų"]],
      [["Confidence", "ವಿಶ್ವಾಸ", "Pasitikėjimas"], ["how sure the model is, e.g. the top probability", "ಮಾಡೆಲ್ ಎಷ್ಟು ಖಚಿತ, ಉದಾ. ಅತ್ಯುನ್ನತ ಸಂಭವನೀಯತೆ", "kiek modelis tikras, pvz., didžiausia tikimybė"]],
      [["Human review", "ಮಾನವ ಪರಿಶೀಲನೆ", "Žmogaus peržiūra"], ["a person checks the cases the software is unsure about", "ಸಾಫ್ಟ್‌ವೇರ್ ಖಚಿತವಿಲ್ಲದ ಪ್ರಕರಣಗಳನ್ನು ವ್ಯಕ್ತಿ ಪರಿಶೀಲಿಸುತ್ತಾನೆ", "žmogus tikrina atvejus, dėl kurių programa nėra tikra"]],
    ],
    tasks: [
      ["Click each of the six boxes in “Life of one data point” and read what happens to the data there.", "“ಒಂದು ಡೇಟಾ ಬಿಂದುವಿನ ಜೀವನ” ದ ಆರು ಪೆಟ್ಟಿಗೆಗಳಲ್ಲಿ ಪ್ರತಿಯೊಂದನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು ಅಲ್ಲಿ ಡೇಟಾಗೆ ಏನಾಗುತ್ತದೆ ಎಂದು ಓದಿ.", "Spustelėkite kiekvieną iš šešių langelių „Vieno duomenų taško gyvenime“ ir perskaitykite, kas ten nutinka duomenims."],
      ["Find the sentence that explains why a missing height must not be replaced by 0 cm.", "ಕಾಣೆಯಾದ ಎತ್ತರವನ್ನು 0 cm ನಿಂದ ಏಕೆ ಬದಲಿಸಬಾರದು ಎಂದು ವಿವರಿಸುವ ವಾಕ್ಯವನ್ನು ಹುಡುಕಿ.", "Suraskite sakinį, paaiškinantį, kodėl trūkstamo ūgio negalima pakeisti 0 cm."],
      ["Name one more real situation (not in the text) where an outlier check would help.", "ಹೊರಗಣ ಮೌಲ್ಯ ಪರಿಶೀಲನೆ ಸಹಾಯ ಮಾಡುವ ಇನ್ನೊಂದು ನಿಜ ಸನ್ನಿವೇಶವನ್ನು (ಪಠ್ಯದಲ್ಲಿಲ್ಲದ) ಹೆಸರಿಸಿ.", "Įvardykite dar vieną realią situaciją (tekste nenurodytą), kur išskirčių tikrinimas padėtų."],
      ["On the Scale stage check the arithmetic yourself: (54 − 52) / (102 − 52) = 0.04.", "Scale ಹಂತದಲ್ಲಿ ಲೆಕ್ಕವನ್ನು ನೀವೇ ಪರಿಶೀಲಿಸಿ: (54 − 52) / (102 − 52) = 0.04.", "Etape Normuoti patys patikrinkite aritmetiką: (54 − 52) / (102 − 52) = 0.04."],
    ],
    questions: [
      {
        q: ["Why does the hospital system not simply enter 0 cm for a missing height?", "ಕಾಣೆಯಾದ ಎತ್ತರಕ್ಕೆ ಆಸ್ಪತ್ರೆ ವ್ಯವಸ್ಥೆ ಕೇವಲ 0 cm ಏಕೆ ನಮೂದಿಸುವುದಿಲ್ಲ?", "Kodėl ligoninės sistema trūkstamą ūgį tiesiog nepakeičia 0 cm?"],
        options: [
          ["0 cm would ruin averages and dose calculations", "0 cm ಸರಾಸರಿ ಮತ್ತು ಡೋಸ್ ಲೆಕ್ಕಾಚಾರಗಳನ್ನು ಹಾಳುಮಾಡುತ್ತದೆ", "0 cm sugadintų vidurkius ir dozių skaičiavimus"],
          ["The database cannot store zero", "ಡೇಟಾಬೇಸ್ ಸೊನ್ನೆಯನ್ನು ಸಂಗ್ರಹಿಸಲಾಗದು", "Duomenų bazė negali saugoti nulio"],
          ["Zero equals the women's mean", "ಸೊನ್ನೆ ಮಹಿಳೆಯರ ಸರಾಸರಿಗೆ ಸಮ", "Nulis lygus moterų vidurkiui"],
        ],
        correct: 0,
        why: ["A fake 0 cm is treated as a real measurement and drags every average down. A sensible estimate from similar patients, flagged as “estimated”, does far less harm.", "ನಕಲಿ 0 cm ಅನ್ನು ನಿಜವಾದ ಮಾಪನ ಎಂದು ಪರಿಗಣಿಸಲಾಗಿ ಪ್ರತಿ ಸರಾಸರಿಯನ್ನು ಕೆಳಗೆ ಎಳೆಯುತ್ತದೆ. ಹೋಲುವ ರೋಗಿಗಳಿಂದ ಸಮಂಜಸ ಅಂದಾಜು, “ಅಂದಾಜು” ಎಂದು ಗುರುತಿಸಿ, ಬಹಳ ಕಡಿಮೆ ಹಾನಿ ಮಾಡುತ್ತದೆ.", "Netikras 0 cm laikomas tikru matavimu ir nuvelka kiekvieną vidurkį žemyn. Prasmingas įvertis iš panašių pacientų, pažymėtas kaip „įvertintas“, daro kur kas mažiau žalos."],
      },
      {
        q: ["A model says “7, with 98% confidence”. What should happen if the confidence were only 40%?", "ಮಾಡೆಲ್ “98% ವಿಶ್ವಾಸದೊಂದಿಗೆ 7” ಎನ್ನುತ್ತದೆ. ವಿಶ್ವಾಸ ಕೇವಲ 40% ಆಗಿದ್ದರೆ ಏನಾಗಬೇಕು?", "Modelis sako „7 su 98 % pasitikėjimu“. Kas turėtų nutikti, jei pasitikėjimas būtų tik 40 %?"],
        options: [
          ["Accept it anyway", "ಹೇಗಾದರೂ ಒಪ್ಪಿಕೊಳ್ಳಿ", "Vis tiek priimti"],
          ["Send the item to a person for review", "ವಸ್ತುವನ್ನು ಪರಿಶೀಲನೆಗಾಗಿ ವ್ಯಕ್ತಿಗೆ ಕಳುಹಿಸಿ", "Išsiųsti prekę žmogui peržiūrėti"],
          ["Delete the picture", "ಚಿತ್ರವನ್ನು ಅಳಿಸಿ", "Ištrinti paveikslą"],
        ],
        correct: 1,
        why: ["Software flags, people decide: when confidence is low, a human checks the item.", "ಸಾಫ್ಟ್‌ವೇರ್ ಗುರುತಿಸುತ್ತದೆ, ಜನರು ನಿರ್ಧರಿಸುತ್ತಾರೆ: ವಿಶ್ವಾಸ ಕಡಿಮೆಯಾದಾಗ ಮಾನವ ವಸ್ತುವನ್ನು ಪರಿಶೀಲಿಸುತ್ತಾನೆ.", "Programa žymi, žmonės sprendžia: kai pasitikėjimas mažas, prekę patikrina žmogus."],
      },
      {
        q: ["In the Scale stage a weight of 54 kg (min 52, max 102) becomes…", "Scale ಹಂತದಲ್ಲಿ 54 kg ತೂಕ (ಕನಿಷ್ಠ 52, ಗರಿಷ್ಠ 102) ಆಗುತ್ತದೆ…", "Etape Normuoti 54 kg svoris (min 52, max 102) tampa…"],
        options: [
          ["0.54", "0.54", "0.54"],
          ["2.0", "2.0", "2.0"],
          ["0.04", "0.04", "0.04"],
        ],
        correct: 2,
        why: ["(54 − 52) / (102 − 52) = 2 / 50 = 0.04: the lightest patient is 0 and the heaviest is 1, so 54 kg is almost at the bottom.", "(54 − 52) / (102 − 52) = 2 / 50 = 0.04: ಅತಿ ಹಗುರ ರೋಗಿ 0 ಮತ್ತು ಅತಿ ಭಾರ 1, ಆದ್ದರಿಂದ 54 kg ಬಹುತೇಕ ತಳದಲ್ಲಿದೆ.", "(54 − 52) / (102 − 52) = 2 / 50 = 0.04: lengviausias pacientas yra 0, sunkiausias – 1, todėl 54 kg yra beveik apačioje."],
        verify: () => Math.abs(scaleMinMax(54, 52, 102) - 0.04) < 1e-9,
      },
    ],
    takeaways: [
      ["Each task is a miniature of daily work: fill gaps, catch impossible values, read pictures.", "ಪ್ರತಿ ಕಾರ್ಯ ದೈನಂದಿನ ಕೆಲಸದ ಚಿಕ್ಕ ರೂಪ: ಖಾಲಿ ಜಾಗ ತುಂಬಿ, ಅಸಾಧ್ಯ ಮೌಲ್ಯಗಳನ್ನು ಹಿಡಿಯಿರಿ, ಚಿತ್ರಗಳನ್ನು ಓದಿ.", "Kiekviena užduotis – kasdienio darbo miniatiūra: užpildyti spragas, pagauti neįmanomas reikšmes, skaityti paveikslus."],
      ["Software flags, people decide: low confidence goes to a human.", "ಸಾಫ್ಟ್‌ವೇರ್ ಗುರುತಿಸುತ್ತದೆ, ಜನರು ನಿರ್ಧರಿಸುತ್ತಾರೆ: ಕಡಿಮೆ ವಿಶ್ವಾಸ ಮಾನವನಿಗೆ ಹೋಗುತ್ತದೆ.", "Programa žymi, žmonės sprendžia: mažas pasitikėjimas siunčiamas žmogui."],
      ["One record passes every stage of the pipeline map: clean, scale, model, decide.", "ಒಂದು ದಾಖಲೆ ಪೈಪ್‌ಲೈನ್ ನಕ್ಷೆಯ ಪ್ರತಿ ಹಂತವನ್ನು ದಾಟುತ್ತದೆ: ಸ್ವಚ್ಛ, ಮಾಪನ, ಮಾಡೆಲ್, ನಿರ್ಧಾರ.", "Vienas įrašas pereina kiekvieną schemos etapą: valymas, normavimas, modelis, sprendimas."],
    ],
    mistakes: [
      ["Filling missing values with 0 and forgetting that 0 is a real number that changes the averages.", "ಕಾಣೆಯಾದ ಮೌಲ್ಯಗಳನ್ನು 0 ನಿಂದ ತುಂಬಿ, 0 ಸರಾಸರಿಗಳನ್ನು ಬದಲಿಸುವ ನಿಜವಾದ ಸಂಖ್ಯೆ ಎಂಬುದನ್ನು ಮರೆಯುವುದು.", "Trūkstamas reikšmes užpildyti 0 ir pamiršti, kad 0 yra tikras skaičius, keičiantis vidurkius."],
      ["Believing that a confident prediction is automatically a correct one.", "ವಿಶ್ವಾಸದ ಭವಿಷ್ಯ ನುಡಿ ತಾನಾಗಿಯೇ ಸರಿ ಎಂದು ನಂಬುವುದು.", "Tikėti, kad užtikrinta prognozė automatiškai yra teisinga."],
    ],
  },

  "missing-values": {
    goal: [
      "Estimate the missing height of Name 11 (a woman) and see how the choice of group and statistic changes the error.",
      "Name 11 (ಮಹಿಳೆ) ರ ಕಾಣೆಯಾದ ಎತ್ತರವನ್ನು ಅಂದಾಜಿಸಿ ಮತ್ತು ಗುಂಪು ಹಾಗೂ ಅಂಕಿಅಂಶದ ಆಯ್ಕೆ ದೋಷವನ್ನು ಹೇಗೆ ಬದಲಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ.",
      "Įvertinkite trūkstamą Name 11 (moters) ūgį ir pažiūrėkite, kaip grupės ir statistikos pasirinkimas keičia paklaidą.",
    ],
    fit: [
      "Task 1. A network cannot compute with an empty cell, and a bad fill pollutes everything after it, so gaps are fixed first. The completed column then goes to the anomaly checks and to scaling.",
      "ಕಾರ್ಯ 1. ಖಾಲಿ ಕೋಶದೊಂದಿಗೆ ನೆಟ್‌ವರ್ಕ್ ಲೆಕ್ಕ ಮಾಡಲಾಗದು, ಮತ್ತು ಕೆಟ್ಟ ಭರ್ತಿ ನಂತರದ ಎಲ್ಲವನ್ನೂ ಕಲುಷಿತಗೊಳಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಖಾಲಿ ಜಾಗಗಳನ್ನು ಮೊದಲು ಸರಿಪಡಿಸಲಾಗುತ್ತದೆ. ಪೂರ್ಣಗೊಂಡ ಕಾಲಮ್ ನಂತರ ಅಸಂಗತತೆ ಪರಿಶೀಲನೆ ಮತ್ತು ಮಾಪನಕ್ಕೆ ಹೋಗುತ್ತದೆ.",
      "1 užduotis. Tinklas negali skaičiuoti su tuščiu langeliu, o bloga imputacija užteršia viską toliau, todėl spragos taisomos pirmiausia. Užbaigtas stulpelis keliauja į anomalijų patikrą ir normavimą.",
    ],
    keywords: [
      [["Imputation", "ಭರ್ತಿ (imputation)", "Imputacija"], ["filling a missing value with a good guess", "ಕಾಣೆಯಾದ ಮೌಲ್ಯವನ್ನು ಉತ್ತಮ ಅಂದಾಜಿನಿಂದ ತುಂಬುವುದು", "trūkstamos reikšmės užpildymas geru įverčiu"]],
      [["Mean", "ಸರಾಸರಿ", "Vidurkis"], ["the sum of the values divided by how many there are", "ಮೌಲ್ಯಗಳ ಮೊತ್ತವನ್ನು ಎಷ್ಟಿವೆ ಎಂಬುದರಿಂದ ಭಾಗಿಸಿದ್ದು", "reikšmių suma, padalinta iš jų skaičiaus"]],
      [["Median", "ಮಧ್ಯಾಂಕ", "Mediana"], ["the middle value after sorting; ignores extremes", "ಕ್ರಮಗೊಳಿಸಿದ ನಂತರ ಮಧ್ಯದ ಮೌಲ್ಯ; ತೀವ್ರ ಮೌಲ್ಯಗಳನ್ನು ನಿರ್ಲಕ್ಷಿಸುತ್ತದೆ", "vidurinė reikšmė surikiavus; nepaiso kraštutinių"]],
      [["Group", "ಗುಂಪು", "Grupė"], ["the subset used for the estimate, here the same gender", "ಅಂದಾಜಿಗೆ ಬಳಸುವ ಉಪಗುಂಪು, ಇಲ್ಲಿ ಅದೇ ಲಿಂಗ", "įverčiui naudojamas poaibis, čia – tos pačios lyties"]],
    ],
    tasks: [
      ["Before pressing anything, type your own guess for Name 11 in “Predict first, then reveal” and press Reveal.", "ಯಾವುದನ್ನೂ ಒತ್ತುವ ಮೊದಲು “ಮೊದಲು ಊಹಿಸಿ, ನಂತರ ಬಹಿರಂಗಪಡಿಸಿ” ನಲ್ಲಿ Name 11 ಗೆ ನಿಮ್ಮ ಸ್ವಂತ ಊಹೆಯನ್ನು ಟೈಪ್ ಮಾಡಿ ಮತ್ತು ಬಹಿರಂಗಪಡಿಸಿ ಒತ್ತಿ.", "Prieš ką nors spausdami, skiltyje „Pirmiausia prognozuokite, tada atskleiskite“ įveskite savo spėjimą Name 11 ir spauskite Atskleisti."],
      ["In the first demo, switch between “Same gender only” and “Everyone” and note how far the red line moves (about 10 cm).", "ಮೊದಲ ಡೆಮೊದಲ್ಲಿ “ಅದೇ ಲಿಂಗ ಮಾತ್ರ” ಮತ್ತು “ಎಲ್ಲರೂ” ನಡುವೆ ಬದಲಿಸಿ ಮತ್ತು ಕೆಂಪು ರೇಖೆ ಎಷ್ಟು ಚಲಿಸುತ್ತದೆ ಎಂದು ಗಮನಿಸಿ (ಸುಮಾರು 10 cm).", "Pirmoje demonstracijoje perjunkite tarp „Tik ta pati lytis“ ir „Visi“ ir pažiūrėkite, kiek pasislenka raudona linija (apie 10 cm)."],
      ["In the editable table press “Add a typo” with Mean selected, then switch to Median and compare 413.33 with 168.", "ತಿದ್ದಬಹುದಾದ ಕೋಷ್ಟಕದಲ್ಲಿ ಸರಾಸರಿ ಆಯ್ಕೆಯಾಗಿರುವಾಗ “ಮುದ್ರಣ ದೋಷ ಸೇರಿಸಿ” ಒತ್ತಿ, ನಂತರ ಮಧ್ಯಾಂಕಕ್ಕೆ ಬದಲಿಸಿ ಮತ್ತು 413.33 ಅನ್ನು 168 ರೊಂದಿಗೆ ಹೋಲಿಸಿ.", "Redaguojamoje lentelėje pasirinkę Vidurkį paspauskite „Įdėti rašybos klaidą“, tada perjunkite į Medianą ir palyginkite 413.33 su 168."],
      ["Drop two women's heights with the drop buttons, watch n and the mean change, then reset the data.", "ತೆಗೆ ಬಟನ್‌ಗಳಿಂದ ಇಬ್ಬರು ಮಹಿಳೆಯರ ಎತ್ತರಗಳನ್ನು ತೆಗೆಯಿರಿ, n ಮತ್ತು ಸರಾಸರಿ ಬದಲಾಗುವುದನ್ನು ನೋಡಿ, ನಂತರ ಡೇಟಾ ಮರುಹೊಂದಿಸಿ.", "Mygtukais „išmesti“ pašalinkite dviejų moterų ūgius, stebėkite n ir vidurkio pokytį, tada atstatykite duomenis."],
    ],
    questions: [
      {
        q: ["What is the mean of the six known women's heights?", "ತಿಳಿದ ಆರು ಮಹಿಳೆಯರ ಎತ್ತರಗಳ ಸರಾಸರಿ ಎಷ್ಟು?", "Koks yra šešių žinomų moterų ūgių vidurkis?"],
        options: [
          ["165.83 cm", "165.83 cm", "165.83 cm"],
          ["175.93 cm", "175.93 cm", "175.93 cm"],
          ["182.67 cm", "182.67 cm", "182.67 cm"],
        ],
        correct: 0,
        why: ["The six heights add up to 995, and 995 / 6 = 165.83. 175.93 is everyone's mean and 182.67 is the men's mean.", "ಆರು ಎತ್ತರಗಳ ಮೊತ್ತ 995, ಮತ್ತು 995 / 6 = 165.83. 175.93 ಎಲ್ಲರ ಸರಾಸರಿ ಮತ್ತು 182.67 ಪುರುಷರ ಸರಾಸರಿ.", "Šeši ūgiai sudeda 995, o 995 / 6 = 165.83. 175.93 yra visų vidurkis, o 182.67 – vyrų."],
        verify: () => Math.abs(impute(PATIENTS, "mean", "group").value - 165.83) < 0.005 && groupStats(PATIENTS, 0).sum === 995,
      },
      {
        q: ["Using everyone's mean instead of the women's mean for Name 11 gives an error of about…", "Name 11 ಗೆ ಮಹಿಳೆಯರ ಸರಾಸರಿಯ ಬದಲು ಎಲ್ಲರ ಸರಾಸರಿಯನ್ನು ಬಳಸಿದರೆ ದೋಷ ಸುಮಾರು…", "Naudojant visų vidurkį vietoj moterų vidurkio Name 11, paklaida yra maždaug…"],
        options: [
          ["0.2 cm", "0.2 cm", "0.2 cm"],
          ["10.1 cm", "10.1 cm", "10.1 cm"],
          ["17 cm", "17 cm", "17 cm"],
        ],
        correct: 1,
        why: ["175.93 − 165.83 = 10.1 cm: the men in the pool pull the average up, so a woman is estimated far too tall.", "175.93 − 165.83 = 10.1 cm: ಗುಂಪಿನಲ್ಲಿರುವ ಪುರುಷರು ಸರಾಸರಿಯನ್ನು ಮೇಲಕ್ಕೆ ಎಳೆಯುತ್ತಾರೆ, ಆದ್ದರಿಂದ ಮಹಿಳೆಯನ್ನು ತುಂಬಾ ಎತ್ತರ ಎಂದು ಅಂದಾಜಿಸಲಾಗುತ್ತದೆ.", "175.93 − 165.83 = 10.1 cm: imtyje esantys vyrai kelia vidurkį, todėl moteris įvertinama per aukšta."],
        verify: () => Math.abs(Math.abs(groupStats(PATIENTS, "all").mean - groupStats(PATIENTS, 0).mean) - 10.1) < 0.005,
      },
      {
        q: ["One woman's height is mistyped as 1650. Which statistic changes least?", "ಒಬ್ಬ ಮಹಿಳೆಯ ಎತ್ತರವನ್ನು 1650 ಎಂದು ತಪ್ಪಾಗಿ ಟೈಪ್ ಮಾಡಲಾಗಿದೆ. ಯಾವ ಅಂಕಿಅಂಶ ಕಡಿಮೆ ಬದಲಾಗುತ್ತದೆ?", "Vienos moters ūgis per klaidą įvestas 1650. Kuri statistika pasikeičia mažiausiai?"],
        options: [
          ["Both change equally", "ಎರಡೂ ಸಮನಾಗಿ ಬದಲಾಗುತ್ತವೆ", "Abi keičiasi vienodai"],
          ["The mean", "ಸರಾಸರಿ", "Vidurkis"],
          ["The median", "ಮಧ್ಯಾಂಕ", "Mediana"],
        ],
        correct: 2,
        why: ["The mean jumps from 165.83 to 413.33 while the median only moves from 166 to 168: one extreme value cannot move the middle of a sorted list much.", "ಸರಾಸರಿ 165.83 ರಿಂದ 413.33 ಕ್ಕೆ ಜಿಗಿಯುತ್ತದೆ, ಮಧ್ಯಾಂಕ 166 ರಿಂದ 168 ಕ್ಕೆ ಮಾತ್ರ ಚಲಿಸುತ್ತದೆ: ಒಂದು ತೀವ್ರ ಮೌಲ್ಯ ಕ್ರಮಗೊಳಿಸಿದ ಪಟ್ಟಿಯ ಮಧ್ಯವನ್ನು ಹೆಚ್ಚು ಚಲಿಸಲಾಗದು.", "Vidurkis šoka nuo 165.83 iki 413.33, o mediana pasislenka tik nuo 166 iki 168: viena kraštutinė reikšmė negali daug pajudinti surikiuoto sąrašo vidurio."],
        verify: () => {
          const rows = PATIENTS.map(([g, h]) => [g, h] as [0 | 1, number | null]);
          rows[0] = [0, 1650];
          return Math.abs(impute(rows, "mean", "group").value - 413.3333) < 0.001 && impute(rows, "median", "group").value === 168;
        },
      },
    ],
    takeaways: [
      ["Use the group the person belongs to: women 165.83 cm, men 182.67 cm, everyone 175.93 cm.", "ವ್ಯಕ್ತಿ ಸೇರಿರುವ ಗುಂಪನ್ನು ಬಳಸಿ: ಮಹಿಳೆಯರು 165.83 cm, ಪುರುಷರು 182.67 cm, ಎಲ್ಲರೂ 175.93 cm.", "Naudokite grupę, kuriai asmuo priklauso: moterys 165.83 cm, vyrai 182.67 cm, visi 175.93 cm."],
      ["Mean and median agree on clean data (165.83 vs 166) but split apart after a typo (413.33 vs 168).", "ಸ್ವಚ್ಛ ಡೇಟಾದಲ್ಲಿ ಸರಾಸರಿ ಮತ್ತು ಮಧ್ಯಾಂಕ ಒಪ್ಪುತ್ತವೆ (165.83 vs 166) ಆದರೆ ಮುದ್ರಣ ದೋಷದ ನಂತರ ಬೇರ್ಪಡುತ್ತವೆ (413.33 vs 168).", "Švariuose duomenyse vidurkis ir mediana sutampa (165.83 ir 166), bet po rašybos klaidos išsiskiria (413.33 ir 168)."],
      ["Always flag a filled value as “estimated” so nobody mistakes it for a measurement.", "ಭರ್ತಿ ಮಾಡಿದ ಮೌಲ್ಯವನ್ನು ಯಾವಾಗಲೂ “ಅಂದಾಜು” ಎಂದು ಗುರುತಿಸಿ, ಯಾರೂ ಅದನ್ನು ಮಾಪನ ಎಂದು ತಪ್ಪಾಗಿ ಭಾವಿಸದಂತೆ.", "Visada pažymėkite užpildytą reikšmę kaip „įvertintą“, kad niekas jos nelaikytų matavimu."],
    ],
    mistakes: [
      ["Using the overall mean when the groups differ a lot: here it is 10.1 cm off for a woman.", "ಗುಂಪುಗಳು ಬಹಳ ಭಿನ್ನವಾಗಿರುವಾಗ ಒಟ್ಟು ಸರಾಸರಿಯನ್ನು ಬಳಸುವುದು: ಇಲ್ಲಿ ಮಹಿಳೆಗೆ ಅದು 10.1 cm ತಪ್ಪು.", "Naudoti bendrą vidurkį, kai grupės labai skiriasi: čia jis moteriai klysta 10.1 cm."],
      ["Using the mean when a value may be a typo; prefer the median or check the data first.", "ಒಂದು ಮೌಲ್ಯ ಮುದ್ರಣ ದೋಷವಾಗಿರಬಹುದಾದಾಗ ಸರಾಸರಿ ಬಳಸುವುದು; ಮಧ್ಯಾಂಕ ಆದ್ಯತೆ ನೀಡಿ ಅಥವಾ ಮೊದಲು ಡೇಟಾ ಪರಿಶೀಲಿಸಿ.", "Naudoti vidurkį, kai reikšmė gali būti rašybos klaida; verčiau rinkitės medianą arba pirmiausia patikrinkite duomenis."],
    ],
  },

  "anomalies": {
    goal: [
      "Find the wrong age 88 in a list of 30 children with three rules (Z-score, Chauvenet, IQR) and see when each rule fails.",
      "30 ಮಕ್ಕಳ ಪಟ್ಟಿಯಲ್ಲಿ ತಪ್ಪು ವಯಸ್ಸು 88 ಅನ್ನು ಮೂರು ನಿಯಮಗಳಿಂದ (Z-score, Chauvenet, IQR) ಕಂಡುಹಿಡಿಯಿರಿ ಮತ್ತು ಪ್ರತಿ ನಿಯಮ ಯಾವಾಗ ವಿಫಲವಾಗುತ್ತದೆ ಎಂದು ನೋಡಿ.",
      "Raskite klaidingą amžių 88 30 vaikų sąraše trimis taisyklėmis (Z-įvertis, Chauvenet, IQR) ir pažiūrėkite, kada kiekviena taisyklė nepavyksta.",
    ],
    fit: [
      "Tasks 2-4. Outliers distort the mean, the standard deviation and the min-max scale used later, so they are found before scaling and training.",
      "ಕಾರ್ಯಗಳು 2-4. ಅಸಂಗತ ಮೌಲ್ಯಗಳು ಸರಾಸರಿ, ಪ್ರಮಾಣಿತ ವಿಚಲನ ಮತ್ತು ನಂತರ ಬಳಸುವ min-max ಮಾಪಕವನ್ನು ವಿರೂಪಗೊಳಿಸುತ್ತವೆ, ಆದ್ದರಿಂದ ಅವನ್ನು ಮಾಪನ ಮತ್ತು ತರಬೇತಿಗಿಂತ ಮೊದಲು ಕಂಡುಹಿಡಿಯಲಾಗುತ್ತದೆ.",
      "2-4 užduotys. Išskirtys iškraipo vidurkį, standartinį nuokrypį ir vėliau naudojamą min-max skalę, todėl jos randamos prieš normavimą ir mokymą.",
    ],
    keywords: [
      [["Z-score", "Z-score", "Z-įvertis"], ["how many standard deviations a value is from the mean", "ಒಂದು ಮೌಲ್ಯ ಸರಾಸರಿಯಿಂದ ಎಷ್ಟು ಪ್ರಮಾಣಿತ ವಿಚಲನ ದೂರದಲ್ಲಿದೆ", "kiek standartinių nuokrypių reikšmė nutolusi nuo vidurkio"]],
      [["Chauvenet", "Chauvenet", "Chauvenet"], ["reject a value if fewer than half a sample would be that extreme by chance (n·P < 0.5)", "ಅಷ್ಟು ತೀವ್ರವಾದ ಅರ್ಧ ಮಾದರಿಗಿಂತ ಕಡಿಮೆ ಆಕಸ್ಮಿಕವಾಗಿ ಬರುವುದಾದರೆ ಮೌಲ್ಯವನ್ನು ತಿರಸ್ಕರಿಸಿ (n·P < 0.5)", "atmesti reikšmę, jei atsitiktinai tokių kraštutinių būtų mažiau nei pusė elemento (n·P < 0.5)"]],
      [["IQR", "IQR", "IQR"], ["Q3 − Q1, the width of the middle 50%; fences 1.5 × IQR beyond the quartiles", "Q3 − Q1, ಮಧ್ಯದ 50% ರ ಅಗಲ; ಕ್ವಾರ್ಟೈಲ್‌ಗಳಿಂದ 1.5 × IQR ದೂರದ ಬೇಲಿಗಳು", "Q3 − Q1, vidurinių 50 % plotis; ribos 1.5 × IQR už kvartilių"]],
      [["Masking", "ಮರೆಮಾಚುವಿಕೆ", "Maskavimas"], ["a big outlier inflates σ and hides itself from the Z-score", "ದೊಡ್ಡ ಅಸಂಗತ ಮೌಲ್ಯ σ ಅನ್ನು ಹೆಚ್ಚಿಸಿ Z-score ನಿಂದ ತನ್ನನ್ನು ಅಡಗಿಸಿಕೊಳ್ಳುತ್ತದೆ", "didelė išskirtis padidina σ ir pasislepia nuo Z-įverčio"]],
    ],
    tasks: [
      ["Keep 88 and read, for each method, the numbers in the output line: z = 5.22, n·P ≈ 5.4×10⁻⁶ and the fences 4.625 … 19.625.", "88 ಅನ್ನು ಇರಿಸಿ ಮತ್ತು ಪ್ರತಿ ವಿಧಾನಕ್ಕೆ ಔಟ್‌ಪುಟ್ ಸಾಲಿನ ಸಂಖ್ಯೆಗಳನ್ನು ಓದಿ: z = 5.22, n·P ≈ 5.4×10⁻⁶ ಮತ್ತು ಬೇಲಿಗಳು 4.625 … 19.625.", "Palikite 88 ir kiekvienam metodui perskaitykite skaičius išvesties eilutėje: z = 5.22, n·P ≈ 5.4×10⁻⁶ ir ribos 4.625 … 19.625."],
      ["With Z-score selected, drag the suspicious value down to 20: the outlier hides. Then switch to Quartile.", "Z-score ಆಯ್ಕೆಯಾಗಿರುವಾಗ ಸಂಶಯಾಸ್ಪದ ಮೌಲ್ಯವನ್ನು 20 ಕ್ಕೆ ಎಳೆಯಿರಿ: ಅಸಂಗತ ಮೌಲ್ಯ ಅಡಗುತ್ತದೆ. ನಂತರ ಕ್ವಾರ್ಟೈಲ್‌ಗೆ ಬದಲಿಸಿ.", "Pasirinkę Z-įvertį nuvilkite įtartiną reikšmę iki 20: išskirtis pasislepia. Tada perjunkite į Kvartilius."],
      ["In “Edit any age” press “Just masked (21)” and read the formula for child 11: z = 2.98.", "“ಯಾವುದೇ ವಯಸ್ಸನ್ನು ತಿದ್ದಿ” ನಲ್ಲಿ “ಈಗಷ್ಟೇ ಮರೆಮಾಚಿದೆ (21)” ಒತ್ತಿ ಮತ್ತು ಮಗು 11 ರ ಸೂತ್ರವನ್ನು ಓದಿ: z = 2.98.", "Skiltyje „Redaguokite bet kurį amžių“ paspauskite „Ką tik pasislėpė (21)“ ir perskaitykite 11-ojo vaiko formulę: z = 2.98."],
      ["Press “Two outliers (88 and 90)” and note how σ grows to about 19.62 while both stay flagged.", "“ಎರಡು ಅಸಂಗತ ಮೌಲ್ಯಗಳು (88 ಮತ್ತು 90)” ಒತ್ತಿ ಮತ್ತು σ ಸುಮಾರು 19.62 ಕ್ಕೆ ಬೆಳೆಯುವುದನ್ನು, ಎರಡೂ ಗುರುತಿಸಲ್ಪಟ್ಟಿರುವುದನ್ನು ಗಮನಿಸಿ.", "Paspauskite „Dvi išskirtys (88 ir 90)“ ir pastebėkite, kaip σ išauga iki maždaug 19.62, o abi lieka pažymėtos."],
      ["Type 22 into child 11 and check that the Z-score rule (limit 3) catches it again: z = 3.20.", "ಮಗು 11 ರಲ್ಲಿ 22 ಟೈಪ್ ಮಾಡಿ ಮತ್ತು Z-score ನಿಯಮ (ಮಿತಿ 3) ಅದನ್ನು ಮತ್ತೆ ಹಿಡಿಯುತ್ತದೆ ಎಂದು ಪರಿಶೀಲಿಸಿ: z = 3.20.", "Įveskite 22 11-am vaikui ir patikrinkite, kad Z-įverčio taisyklė (riba 3) vėl jį pagauna: z = 3.20."],
    ],
    questions: [
      {
        q: ["With the original 30 ages, what is z for the value 88?", "ಮೂಲ 30 ವಯಸ್ಸುಗಳೊಂದಿಗೆ, ಮೌಲ್ಯ 88 ರ z ಎಷ್ಟು?", "Su pradiniais 30 amžių, kam lygus reikšmės 88 z?"],
        options: [
          ["5.22", "5.22", "5.22"],
          ["14.04", "14.04", "14.04"],
          ["3.0", "3.0", "3.0"],
        ],
        correct: 0,
        why: ["z = (88 − 14.73) / 14.04 = 5.22. 14.04 is σ, not z, and 3 is only the usual threshold.", "z = (88 − 14.73) / 14.04 = 5.22. 14.04 σ ಆಗಿದೆ, z ಅಲ್ಲ, ಮತ್ತು 3 ಕೇವಲ ಸಾಮಾನ್ಯ ಮಿತಿ.", "z = (88 − 14.73) / 14.04 = 5.22. 14.04 yra σ, o ne z, o 3 – tik įprastinė riba."],
        verify: () => Math.abs(pointReport(AGES, SUSPECT_INDEX).z - 5.22) < 0.005,
      },
      {
        q: ["The outlier is lowered to 21. Which rules still flag it?", "ಅಸಂಗತ ಮೌಲ್ಯವನ್ನು 21 ಕ್ಕೆ ಇಳಿಸಲಾಗಿದೆ. ಯಾವ ನಿಯಮಗಳು ಇನ್ನೂ ಅದನ್ನು ಗುರುತಿಸುತ್ತವೆ?", "Išskirtis sumažinta iki 21. Kurios taisyklės vis dar ją pažymi?"],
        options: [
          ["All three rules", "ಮೂರೂ ನಿಯಮಗಳು", "Visos trys taisyklės"],
          ["None of them", "ಯಾವುದೂ ಇಲ್ಲ", "Nė viena"],
          ["Chauvenet and IQR, but not the Z-score rule with limit 3", "Chauvenet ಮತ್ತು IQR, ಆದರೆ ಮಿತಿ 3 ರ Z-score ನಿಯಮವಲ್ಲ", "Chauvenet ir IQR, bet ne Z-įverčio taisyklė su riba 3"],
        ],
        correct: 2,
        why: ["At 21 the standard deviation shrinks to 2.85, so z = 2.98, just below 3. Chauvenet (n·P = 0.0857) and the IQR fence (19.625) still catch it. This is masking.", "21 ರಲ್ಲಿ ಪ್ರಮಾಣಿತ ವಿಚಲನ 2.85 ಕ್ಕೆ ಇಳಿಯುತ್ತದೆ, ಆದ್ದರಿಂದ z = 2.98, 3 ಕ್ಕಿಂತ ಸ್ವಲ್ಪ ಕೆಳಗೆ. Chauvenet (n·P = 0.0857) ಮತ್ತು IQR ಬೇಲಿ (19.625) ಇನ್ನೂ ಹಿಡಿಯುತ್ತವೆ. ಇದೇ ಮರೆಮಾಚುವಿಕೆ.", "Ties 21 standartinis nuokrypis sumažėja iki 2.85, todėl z = 2.98 – ką tik žemiau 3. Chauvenet (n·P = 0.0857) ir IQR riba (19.625) vis dar pagauna. Tai maskavimas."],
        verify: () => {
          const a = AGES.slice();
          a[SUSPECT_INDEX] = 21;
          const r = pointReport(a, SUSPECT_INDEX);
          return !r.zFlag && r.chauvenetFlag && r.iqrFlag;
        },
      },
      {
        q: ["Why can the Z-score rule miss a large outlier?", "Z-score ನಿಯಮ ದೊಡ್ಡ ಅಸಂಗತ ಮೌಲ್ಯವನ್ನು ಏಕೆ ತಪ್ಪಿಸಬಹುದು?", "Kodėl Z-įverčio taisyklė gali nepastebėti didelės išskirties?"],
        options: [
          ["The outlier inflates the standard deviation, which shrinks its own z", "ಅಸಂಗತ ಮೌಲ್ಯ ಪ್ರಮಾಣಿತ ವಿಚಲನವನ್ನು ಹೆಚ್ಚಿಸುತ್ತದೆ, ಅದು ಅದರ ಸ್ವಂತ z ಅನ್ನು ಕುಗ್ಗಿಸುತ್ತದೆ", "Išskirtis padidina standartinį nuokrypį, o tai sumažina jos pačios z"],
          ["Z-score only works for whole numbers", "Z-score ಪೂರ್ಣ ಸಂಖ್ಯೆಗಳಿಗೆ ಮಾತ್ರ ಕೆಲಸ ಮಾಡುತ್ತದೆ", "Z-įvertis veikia tik sveikiesiems skaičiams"],
          ["It ignores every value above 50", "ಇದು 50 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ಪ್ರತಿ ಮೌಲ್ಯವನ್ನು ನಿರ್ಲಕ್ಷಿಸುತ್ತದೆ", "Jis ignoruoja visas reikšmes virš 50"],
        ],
        correct: 0,
        why: ["The outlier takes part in the mean and σ it is compared with. With 88, σ = 14.04; without it, σ ≈ 2.4. A larger σ means a smaller z.", "ಅಸಂಗತ ಮೌಲ್ಯ ಅದನ್ನು ಹೋಲಿಸುವ ಸರಾಸರಿ ಮತ್ತು σ ನಲ್ಲಿ ಭಾಗವಹಿಸುತ್ತದೆ. 88 ಜೊತೆ σ = 14.04; ಅದಿಲ್ಲದೆ σ ≈ 2.4. ದೊಡ್ಡ σ ಎಂದರೆ ಚಿಕ್ಕ z.", "Išskirtis dalyvauja skaičiuojant vidurkį ir σ, su kuriais ji lyginama. Su 88 σ = 14.04; be jos σ ≈ 2.4. Didesnė σ reiškia mažesnę z."],
      },
    ],
    takeaways: [
      ["88 gives z = 5.22, n·P ≈ 5.4×10⁻⁶ and lies far outside 4.625 … 19.625: all three rules agree.", "88 z = 5.22, n·P ≈ 5.4×10⁻⁶ ನೀಡುತ್ತದೆ ಮತ್ತು 4.625 … 19.625 ರ ತುಂಬಾ ಹೊರಗಿದೆ: ಮೂರೂ ನಿಯಮಗಳು ಒಪ್ಪುತ್ತವೆ.", "88 duoda z = 5.22, n·P ≈ 5.4×10⁻⁶ ir yra gerokai už 4.625 … 19.625: visos trys taisyklės sutaria."],
      ["Without 88 the spread is only about 2.4, with it 14.04: the outlier made σ almost six times larger.", "88 ಇಲ್ಲದೆ ಹರಡುವಿಕೆ ಕೇವಲ ಸುಮಾರು 2.4, ಅದರೊಂದಿಗೆ 14.04: ಅಸಂಗತ ಮೌಲ್ಯ σ ಅನ್ನು ಸುಮಾರು ಆರು ಪಟ್ಟು ದೊಡ್ಡದಾಗಿಸಿತು.", "Be 88 sklaida tik apie 2.4, su ja 14.04: išskirtis padarė σ beveik šešis kartus didesnę."],
      ["Use more than one method: Z-score and Chauvenet rely on μ and σ, IQR relies on quartiles an outlier cannot move.", "ಒಂದಕ್ಕಿಂತ ಹೆಚ್ಚು ವಿಧಾನ ಬಳಸಿ: Z-score ಮತ್ತು Chauvenet μ ಮತ್ತು σ ಮೇಲೆ ಅವಲಂಬಿತ, IQR ಅಸಂಗತ ಮೌಲ್ಯ ಚಲಿಸಲಾಗದ ಕ್ವಾರ್ಟೈಲ್‌ಗಳ ಮೇಲೆ.", "Naudokite daugiau nei vieną metodą: Z-įvertis ir Chauvenet remiasi μ ir σ, o IQR – kvartiliais, kurių išskirtis nepajudina."],
    ],
    mistakes: [
      ["Trusting one rule: at 21 the Z-score rule is silent although the data is clearly wrong.", "ಒಂದೇ ನಿಯಮವನ್ನು ನಂಬುವುದು: 21 ರಲ್ಲಿ ಡೇಟಾ ಸ್ಪಷ್ಟವಾಗಿ ತಪ್ಪಾಗಿದ್ದರೂ Z-score ನಿಯಮ ಮೌನ.", "Pasitikėti viena taisykle: ties 21 Z-įverčio taisyklė tyli, nors duomenys akivaizdžiai klaidingi."],
      ["Deleting flagged values without looking: a flag means “check this”, not “this is certainly wrong”.", "ಗುರುತಿಸಿದ ಮೌಲ್ಯಗಳನ್ನು ನೋಡದೆ ಅಳಿಸುವುದು: ಧ್ವಜ ಎಂದರೆ “ಇದನ್ನು ಪರಿಶೀಲಿಸಿ”, “ಇದು ಖಂಡಿತ ತಪ್ಪು” ಅಲ್ಲ.", "Ištrinti pažymėtas reikšmes jų nepasižiūrėjus: vėliavėlė reiškia „patikrinkite“, o ne „tai tikrai klaida“."],
    ],
  },

  "scaling": {
    goal: [
      "Put height (cm) and weight (kg) on comparable scales with min-max and standardization, and know which numbers must be remembered.",
      "ಎತ್ತರ (cm) ಮತ್ತು ತೂಕವನ್ನು (kg) min-max ಮತ್ತು ಪ್ರಮಾಣೀಕರಣದಿಂದ ಹೋಲಿಸಬಹುದಾದ ಮಾಪಕಗಳಲ್ಲಿ ಇಡಿ, ಮತ್ತು ಯಾವ ಸಂಖ್ಯೆಗಳನ್ನು ನೆನಪಿಡಬೇಕು ಎಂದು ತಿಳಿಯಿರಿ.",
      "Padėkite ūgį (cm) ir svorį (kg) ant palyginamų skalių naudodami min-max ir standartizavimą ir žinokite, kuriuos skaičius reikia prisiminti.",
    ],
    fit: [
      "Task 5 needs inputs of similar size so gradients stay stable. Scaling comes after outlier removal, because min and max are sensitive to extremes, and its numbers must be reused for every new patient.",
      "ಕಾರ್ಯ 5 ಗೆ ಗ್ರೇಡಿಯಂಟ್‌ಗಳು ಸ್ಥಿರವಾಗಿರಲು ಒಂದೇ ಗಾತ್ರದ ಇನ್‌ಪುಟ್‌ಗಳು ಬೇಕು. ಮಾಪನ ಅಸಂಗತ ಮೌಲ್ಯ ತೆಗೆದ ನಂತರ ಬರುತ್ತದೆ, ಏಕೆಂದರೆ min ಮತ್ತು max ತೀವ್ರ ಮೌಲ್ಯಗಳಿಗೆ ಸೂಕ್ಷ್ಮ, ಮತ್ತು ಅದರ ಸಂಖ್ಯೆಗಳನ್ನು ಪ್ರತಿ ಹೊಸ ರೋಗಿಗೆ ಮರುಬಳಸಬೇಕು.",
      "5 užduočiai reikia panašaus dydžio įėjimų, kad gradientai išliktų stabilūs. Normavimas eina po išskirčių šalinimo, nes min ir max jautrūs kraštutinėms reikšmėms, o jo skaičiai turi būti naudojami kiekvienam naujam pacientui.",
    ],
    keywords: [
      [["Min-max", "Min-max", "Min-max"], ["x′ = (x − min) / (max − min), maps values to 0…1", "x′ = (x − min) / (max − min), ಮೌಲ್ಯಗಳನ್ನು 0…1 ಕ್ಕೆ ನಕ್ಷೆ ಮಾಡುತ್ತದೆ", "x′ = (x − min) / (max − min), reikšmes atvaizduoja į 0…1"]],
      [["Standardization", "ಪ್ರಮಾಣೀಕರಣ", "Standartizavimas"], ["x′ = (x − μ) / σ, gives mean 0 and std 1", "x′ = (x − μ) / σ, ಸರಾಸರಿ 0 ಮತ್ತು std 1 ನೀಡುತ್ತದೆ", "x′ = (x − μ) / σ, duoda vidurkį 0 ir std 1"]],
      [["Feature", "ವೈಶಿಷ್ಟ್ಯ", "Požymis"], ["one input column, such as height", "ಒಂದು ಇನ್‌ಪುಟ್ ಕಾಲಮ್, ಉದಾ. ಎತ್ತರ", "vienas įėjimo stulpelis, pvz., ūgis"]],
      [["Training statistics", "ತರಬೇತಿ ಅಂಕಿಅಂಶಗಳು", "Mokymo statistikos"], ["min, max, μ, σ computed on training data only", "ತರಬೇತಿ ಡೇಟಾದ ಮೇಲೆ ಮಾತ್ರ ಲೆಕ್ಕ ಹಾಕಿದ min, max, μ, σ", "min, max, μ, σ, apskaičiuoti tik iš mokymo duomenų"]],
    ],
    tasks: [
      ["In the first demo switch between Min-max and Standardize and read where Name 5 (158 cm, 54 kg) lands: (0, 0.04) and (−1.501, −1.043).", "ಮೊದಲ ಡೆಮೊದಲ್ಲಿ Min-max ಮತ್ತು ಪ್ರಮಾಣೀಕರಣದ ನಡುವೆ ಬದಲಿಸಿ ಮತ್ತು Name 5 (158 cm, 54 kg) ಎಲ್ಲಿ ಬೀಳುತ್ತದೆ ಎಂದು ಓದಿ: (0, 0.04) ಮತ್ತು (−1.501, −1.043).", "Pirmoje demonstracijoje perjunkite tarp Min-max ir Standartizavimo ir perskaitykite, kur patenka Name 5 (158 cm, 54 kg): (0, 0.04) ir (−1.501, −1.043)."],
      ["In the table pick patient 5 and read both formulas filled with numbers.", "ಕೋಷ್ಟಕದಲ್ಲಿ ರೋಗಿ 5 ಅನ್ನು ಆರಿಸಿ ಮತ್ತು ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ತುಂಬಿದ ಎರಡೂ ಸೂತ್ರಗಳನ್ನು ಓದಿ.", "Lentelėje pasirinkite 5-ąjį pacientą ir perskaitykite abi formules su skaičiais."],
      ["Change patient 4's height to 250 cm and watch every other min-max height shrink; then reset.", "ರೋಗಿ 4 ರ ಎತ್ತರವನ್ನು 250 cm ಗೆ ಬದಲಿಸಿ ಮತ್ತು ಉಳಿದ ಪ್ರತಿ min-max ಎತ್ತರ ಕುಗ್ಗುವುದನ್ನು ನೋಡಿ; ನಂತರ ಮರುಹೊಂದಿಸಿ.", "Pakeiskite 4-ojo paciento ūgį į 250 cm ir stebėkite, kaip susitraukia visi kiti min-max ūgiai; tada atstatykite."],
      ["Enter a new patient of 200 cm and 105 kg and see that the scaled values exceed 1 (1.167 and 1.06).", "200 cm ಮತ್ತು 105 kg ಹೊಸ ರೋಗಿಯನ್ನು ನಮೂದಿಸಿ ಮತ್ತು ಮಾಪನ ಮಾಡಿದ ಮೌಲ್ಯಗಳು 1 ಅನ್ನು ಮೀರುವುದನ್ನು ನೋಡಿ (1.167 ಮತ್ತು 1.06).", "Įveskite naują pacientą – 200 cm ir 105 kg – ir pamatykite, kad normuotos reikšmės viršija 1 (1.167 ir 1.06)."],
    ],
    questions: [
      {
        q: ["With min 52 and max 102, a weight of 54 kg scales (min-max) to…", "min 52 ಮತ್ತು max 102 ಇರುವಾಗ, 54 kg ತೂಕ (min-max) ಮಾಪನವಾಗಿ…", "Su min 52 ir max 102 svoris 54 kg (min-max) tampa…"],
        options: [
          ["0.04", "0.04", "0.04"],
          ["0.54", "0.54", "0.54"],
          ["−1.04", "−1.04", "−1.04"],
        ],
        correct: 0,
        why: ["(54 − 52) / (102 − 52) = 0.04. −1.04 is the z-score of the same weight (standardization), not the min-max value.", "(54 − 52) / (102 − 52) = 0.04. −1.04 ಅದೇ ತೂಕದ z-score (ಪ್ರಮಾಣೀಕರಣ), min-max ಮೌಲ್ಯವಲ್ಲ.", "(54 − 52) / (102 − 52) = 0.04. −1.04 yra to paties svorio z-įvertis (standartizavimas), o ne min-max reikšmė."],
        verify: () => Math.abs(scaleMinMax(54, 52, 102) - 0.04) < 1e-12,
      },
      {
        q: ["Which min and max do you use to scale a NEW patient?", "ಹೊಸ ರೋಗಿಯನ್ನು ಮಾಪನ ಮಾಡಲು ಯಾವ min ಮತ್ತು max ಬಳಸುತ್ತೀರಿ?", "Kuriuos min ir max naudojate NAUJAM pacientui normuoti?"],
        options: [
          ["The new patient's own min and max", "ಹೊಸ ರೋಗಿಯ ಸ್ವಂತ min ಮತ್ತು max", "Paties naujo paciento min ir max"],
          ["The test set's min and max", "ಪರೀಕ್ಷಾ ಸೆಟ್‌ನ min ಮತ್ತು max", "Testavimo rinkinio min ir max"],
          ["The training data's min and max", "ತರಬೇತಿ ಡೇಟಾದ min ಮತ್ತು max", "Mokymo duomenų min ir max"],
        ],
        correct: 2,
        why: ["The network learned on data scaled with the training numbers, so every later input must use the same ones. One patient has no range of its own (max = min would divide by zero).", "ನೆಟ್‌ವರ್ಕ್ ತರಬೇತಿ ಸಂಖ್ಯೆಗಳಿಂದ ಮಾಪನ ಮಾಡಿದ ಡೇಟಾದ ಮೇಲೆ ಕಲಿತಿದೆ, ಆದ್ದರಿಂದ ನಂತರದ ಪ್ರತಿ ಇನ್‌ಪುಟ್ ಅದೇ ಸಂಖ್ಯೆಗಳನ್ನು ಬಳಸಬೇಕು. ಒಬ್ಬ ರೋಗಿಗೆ ಸ್ವಂತ ವ್ಯಾಪ್ತಿ ಇಲ್ಲ (max = min ಸೊನ್ನೆಯಿಂದ ಭಾಗಿಸುತ್ತದೆ).", "Tinklas mokėsi iš duomenų, normuotų mokymo skaičiais, todėl kiekvienas vėlesnis įėjimas turi naudoti tuos pačius. Vienas pacientas neturi savo intervalo (max = min reikštų dalybą iš nulio)."],
      },
      {
        q: ["One huge outlier is added to a column and you use min-max. What happens to the other values?", "ಒಂದು ಕಾಲಮ್‌ಗೆ ಒಂದು ಬೃಹತ್ ಅಸಂಗತ ಮೌಲ್ಯ ಸೇರಿಸಿ min-max ಬಳಸಿದರೆ ಉಳಿದ ಮೌಲ್ಯಗಳಿಗೆ ಏನಾಗುತ್ತದೆ?", "Į stulpelį pridedama viena milžiniška išskirtis ir naudojate min-max. Kas nutinka kitoms reikšmėms?"],
        options: [
          ["They are squeezed towards 0", "ಅವು 0 ಕಡೆಗೆ ಅದುಮಲ್ಪಡುತ್ತವೆ", "Jos suspaudžiamos link 0"],
          ["They stay exactly the same", "ಅವು ನಿಖರವಾಗಿ ಹಾಗೆಯೇ ಉಳಿಯುತ್ತವೆ", "Jos lieka lygiai tokios pat"],
          ["They become negative", "ಅವು ಋಣಾತ್ಮಕವಾಗುತ್ತವೆ", "Jos tampa neigiamos"],
        ],
        correct: 0,
        why: ["The maximum grows, so the denominator (max − min) grows and every ordinary value shrinks. A height of 165 cm, for example, falls from 0.19 to 0.08 when one patient is set to 250 cm. This is why outliers are removed first.", "ಗರಿಷ್ಠ ಬೆಳೆಯುತ್ತದೆ, ಆದ್ದರಿಂದ ಛೇದ (max − min) ಬೆಳೆಯುತ್ತದೆ ಮತ್ತು ಪ್ರತಿ ಸಾಮಾನ್ಯ ಮೌಲ್ಯ ಕುಗ್ಗುತ್ತದೆ. ಉದಾಹರಣೆಗೆ ಒಬ್ಬ ರೋಗಿಯನ್ನು 250 cm ಗೆ ಹೊಂದಿಸಿದಾಗ 165 cm ಎತ್ತರ 0.19 ರಿಂದ 0.08 ಕ್ಕೆ ಇಳಿಯುತ್ತದೆ. ಅದಕ್ಕಾಗಿಯೇ ಅಸಂಗತ ಮೌಲ್ಯಗಳನ್ನು ಮೊದಲು ತೆಗೆಯಲಾಗುತ್ತದೆ.", "Maksimumas auga, todėl vardiklis (max − min) auga ir kiekviena įprasta reikšmė mažėja. Pavyzdžiui, 165 cm ūgis nukrenta nuo 0.19 iki 0.08, kai vienas pacientas nustatomas 250 cm. Todėl išskirtys šalinamos pirmiausia."],
        verify: () => {
          const a = HEIGHTS.slice();
          a[3] = 250;
          const before = minMax(HEIGHTS)[0];
          const after = minMax(a)[0];
          return after < before && Math.abs(before - 0.1944) < 0.001 && Math.abs(after - 0.0761) < 0.001;
        },
      },
    ],
    takeaways: [
      ["Min-max gives 0…1 (Name 5 → (0, 0.04)); standardization gives mean 0 and std 1 (Name 5 → (−1.50, −1.04)).", "Min-max 0…1 ನೀಡುತ್ತದೆ (Name 5 → (0, 0.04)); ಪ್ರಮಾಣೀಕರಣ ಸರಾಸರಿ 0 ಮತ್ತು std 1 ನೀಡುತ್ತದೆ (Name 5 → (−1.50, −1.04)).", "Min-max duoda 0…1 (Name 5 → (0, 0.04)); standartizavimas duoda vidurkį 0 ir std 1 (Name 5 → (−1.50, −1.04))."],
      ["The scaler's min, max, μ and σ come from the training data and are reused for every new patient: 200 cm becomes 1.167.", "ಮಾಪಕದ min, max, μ ಮತ್ತು σ ತರಬೇತಿ ಡೇಟಾದಿಂದ ಬರುತ್ತವೆ ಮತ್ತು ಪ್ರತಿ ಹೊಸ ರೋಗಿಗೆ ಮರುಬಳಸಲಾಗುತ್ತದೆ: 200 cm 1.167 ಆಗುತ್ತದೆ.", "Normuoklio min, max, μ ir σ imami iš mokymo duomenų ir naudojami kiekvienam naujam pacientui: 200 cm tampa 1.167."],
      ["Remove outliers first: one extreme value squeezes everything else in min-max.", "ಮೊದಲು ಅಸಂಗತ ಮೌಲ್ಯಗಳನ್ನು ತೆಗೆಯಿರಿ: ಒಂದು ತೀವ್ರ ಮೌಲ್ಯ min-max ನಲ್ಲಿ ಉಳಿದೆಲ್ಲವನ್ನೂ ಅದುಮುತ್ತದೆ.", "Pirmiausia pašalinkite išskirtis: viena kraštutinė reikšmė min-max suspaudžia visas kitas."],
    ],
    mistakes: [
      ["Recomputing min and max on the test set or on a single new patient.", "ಪರೀಕ್ಷಾ ಸೆಟ್ ಅಥವಾ ಒಬ್ಬ ಹೊಸ ರೋಗಿಯ ಮೇಲೆ min ಮತ್ತು max ಮರುಲೆಕ್ಕ ಹಾಕುವುದು.", "Perskaičiuoti min ir max testavimo rinkinyje arba vienam naujam pacientui."],
      ["Forgetting to scale new data before asking the network: it would see 200 instead of 1.167.", "ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಕೇಳುವ ಮೊದಲು ಹೊಸ ಡೇಟಾವನ್ನು ಮಾಪನ ಮಾಡಲು ಮರೆಯುವುದು: ಅದು 1.167 ಬದಲು 200 ನೋಡುತ್ತದೆ.", "Pamiršti normuoti naujus duomenis prieš klausiant tinklo: jis matytų 200, o ne 1.167."],
    ],
  },
};
