import { CODE_STEPS } from "../data/code";
import { TASK11, TASK21, TASK23, SUMMARY } from "../data/results";
import { conv1dWindows, hashId, oneHotOnes, REVIEWS, wordsOf } from "../math";
import type { GuideDef } from "./types";

/** Guides of the text part and the wrap-up (steps 7–13). */
export const guides2: Record<string, GuideDef> = {
  text: {
    goal: [
      "Turn words into numbers the way the IMDB networks see them, and understand why word order matters.",
      "IMDB ಜಾಲಗಳು ನೋಡುವ ರೀತಿಯಲ್ಲಿ ಪದಗಳನ್ನು ಸಂಖ್ಯೆಗಳಾಗಿ ಪರಿವರ್ತಿಸಿ, ಪದಗಳ ಕ್ರಮ ಏಕೆ ಮುಖ್ಯ ಎಂದು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.",
      "Paverskite žodžius skaičiais taip, kaip jų mato IMDB tinklai, ir suprasykite, kodėl žodžių tvarka svarbi.",
    ],
    fit: [
      "Task 2 classifies movie reviews. A network computes only with numbers, and the encoding decides whether it can read the order of the words.",
      "ಕಾರ್ಯ 2 ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆಗಳನ್ನು ವರ್ಗೀಕರಿಸುತ್ತದೆ. ನೆಟ್‌ವರ್ಕ್ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ಮಾತ್ರ ಲೆಕ್ಕ ಮಾಡುತ್ತದೆ; ಎನ್ಕೋಡಿಂಗ್ ಪದಗಳ ಕ್ರಮವನ್ನು ಓದಬಹುದೇ ಎಂದು ನಿರ್ಧರಿಸುತ್ತದೆ.",
      "2 užduotis klasifikuoja filmų apžvalgas. Tinklas skaičiuoja tik su skaičiais, o kodavimas nusako, ar jis gali skaityti žodžių tvarką.",
    ],
    keywords: [
      [["Word number", "ಪದ ಸಂಖ್ಯೆ", "Žodžio numeris"], ["An integer id for each word.", "ಪ್ರತಿ ಪದಕ್ಕೆ ಒಂದು ಪೂರ್ಣಾಂಕ ಗುರುತು.", "Sveikasis kiekvieno žodžio identifikatorius."]],
      [["One-hot (multi-hot)", "ವನ್-ಹಾಟ್ (ಮಲ್ಟಿ-ಹಾಟ್)", "Vienas karštas (kelis karštus)"], ["A vector of 10 000 slots with a 1 where the word occurs.", "10 000 ಸ್ಥಾನಗಳ ವೆಕ್ಟರ್; ಪದ ಇರುವಲ್ಲಿ 1.", "10 000 vietų vektorius, kur 1 ten, kur yra žodis."]],
      [["Embedding", "ಎಂಬೆಡ್ಡಿಂಗ್", "Įterpimas (embedding)"], ["A learned short vector per word; keeps the order.", "ಪ್ರತಿ ಪದಕ್ಕೆ ಕಲಿತ ಸಣ್ಣ ವೆಕ್ಟರ್; ಕ್ರಮವನ್ನು ಉಳಿಸುತ್ತದೆ.", "Kiekvienam žodžiui išmoktas trumpas vektorius; išlaiko tvarką."]],
      [["Padding", "ಪ್ಯಾಡಿಂಗ್", "Užpildymas"], ["Reviews are cut or padded with zeros to 200 words.", "ವಿಮರ್ಶೆಗಳನ್ನು 200 ಪದಗಳಿಗೆ ಕತ್ತರಿಸಲಾಗುತ್ತದೆ ಅಥವಾ ಶೂನ್ಯಗಳಿಂದ ತುಂಬಲಾಗುತ್ತದೆ.", "Apžvalgos apkarpomos arba užpildomos nuliais iki 200 žodžių."]],
    ],
    tasks: [
      ["Type a sentence and count the distinct word numbers.", "ಒಂದು ವಾಕ್ಯ ಟೈಪ್ ಮಾಡಿ ವಿಭಿನ್ನ ಪದ ಸಂಖ್ಯೆಗಳನ್ನು ಎಣಿಸಿ.", "Įveskite sakinį ir suskaičiuokite skirtingus žodžių numerius."],
      ["Compare the one-hot pictures of 'good not bad' and 'bad not good'.", "'good not bad' ಮತ್ತು 'bad not good' ನ one-hot ಚಿತ್ರಗಳನ್ನು ಹೋಲಿಸಿ.", "Palyginkite „good not bad“ ir „bad not good“ vienas karštas vaizdus."],
      ["Find the embedding row of the word 'great'.", "'great' ಪದದ ಎಂಬೆಡ್ಡಿಂಗ್ ಸಾಲನ್ನು ಹುಡುಕಿ.", "Raskite žodžio „great“ įterpimo eilutę."],
      ["Explain why the embedding table is 200 × 16, not 10 000 long.", "ಎಂಬೆಡ್ಡಿಂಗ್ ಕೋಷ್ಟಕ 10 000 ಉದ್ದವಲ್ಲ, 200 × 16 ಏಕೆ ಎಂದು ವಿವರಿಸಿ.", "Paaiškinkite, kodėl įterpimo lentelė yra 200 × 16, o ne 10 000 ilgio."],
    ],
    questions: [
      {
        q: ["How many 1s are in the one-hot vector of 'this movie was wonderful and the acting was great'?", "'this movie was wonderful and the acting was great' ನ one-hot ವೆಕ್ಟರ್‌ನಲ್ಲಿ ಎಷ್ಟು 1 ಗಳಿವೆ?", "Kiek vienetų yra vienas karštas vektoriuje „this movie was wonderful and the acting was great“?"],
        options: [["8", "8", "8"], ["9", "9", "9"], ["10 000", "10 000", "10 000"]],
        correct: 0,
        why: ["There are 9 words, but 'was' appears twice, so there are 8 distinct word numbers and 8 ones.", "9 ಪದಗಳಿವೆ, ಆದರೆ 'was' ಎರಡು ಬಾರಿ ಬಂದಿದೆ; ಆದ್ದರಿಂದ 8 ವಿಭಿನ್ನ ಪದ ಸಂಖ್ಯೆಗಳು ಮತ್ತು 8 ಒಂದುಗಳು.", "Yra 9 žodžiai, bet „was“ kartojasi du kartus, todėl yra 8 skirtingi numeriai ir 8 vienetai."],
        verify: () => oneHotOnes(wordsOf("this movie was wonderful and the acting was great").map(hashId)) === 8,
      },
      {
        q: ["What does one-hot lose compared with an embedding?", "Embedding ಗೆ ಹೋಲಿಸಿದರೆ one-hot ಏನನ್ನು ಕಳೆದುಕೊಳ್ಳುತ್ತದೆ?", "Ko vienas karštas praranda, palyginti su įterpimu?"],
        options: [["The number of words", "ಪದಗಳ ಸಂಖ್ಯೆ", "Žodžių skaičių"], ["The labels", "ಲೇಬಲ್‌ಗಳು", "Etiketes"], ["The word order", "ಪದಗಳ ಕ್ರಮ", "Žodžių tvarką"]],
        correct: 2,
        why: ["A bag of ones treats 'good not bad' and 'bad not good' as the same. An embedding keeps the sequence.", "1 ಗಳ ಚೀಲ 'good not bad' ಮತ್ತು 'bad not good' ಅನ್ನು ಒಂದೇ ಎಂದು ಪರಿಗಣಿಸುತ್ತದೆ. ಎಂಬೆಡ್ಡಿಂಗ್ ಕ್ರಮವನ್ನು ಉಳಿಸುತ್ತದೆ.", "Vienetų krepšys laiko „good not bad“ ir „bad not good“ vienodais. Įterpimas išlaiko seką."],
      },
      {
        q: ["Are the placeholder embedding numbers in this demo learned?", "ಈ ಡೆಮೊದಲ್ಲಿನ ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್ ಎಂಬೆಡ್ಡಿಂಗ್ ಸಂಖ್ಯೆಗಳನ್ನು ಕಲಿಯಲಾಗಿದೆಯೇ?", "Ar šioje demonstracijoje įterpimo skaičiai yra išmokti?"],
        options: [["No: they are fixed pseudo-random values for illustration", "ಇಲ್ಲ: ಇವು ಚಿತ್ರಣಕ್ಕಾಗಿ ಸ್ಥಿರ ಹುಸಿ-ಯಾದೃಚ್ಛಿಕ ಮೌಲ್ಯಗಳು", "Ne: tai fiksuotos pseudoatsitiktinės reikšmės iliustracijai"], ["Yes, after 5 epochs", "ಹೌದು, 5 ಎಪೋಕ್ ನಂತರ", "Taip, po 5 epochų"], ["Yes, they come from IMDB", "ಹೌದು, ಇವು IMDB ಯಿಂದ ಬಂದಿವೆ", "Taip, jos ateina iš IMDB"]],
        correct: 0,
        why: ["In the lab the embedding values are learned during training. The page only shows fixed placeholders.", "ಲ್ಯಾಬ್‌ನಲ್ಲಿ ಎಂಬೆಡ್ಡಿಂಗ್ ಮೌಲ್ಯಗಳನ್ನು ತರಬೇತಿಯ ಸಮಯದಲ್ಲಿ ಕಲಿಯಲಾಗುತ್ತದೆ. ಪುಟ ಕೇವಲ ಸ್ಥಿರ ಪ್ಲೇಸ್‌ಹೋಲ್ಡರ್‌ಗಳನ್ನು ತೋರಿಸುತ್ತದೆ.", "Laboratorijoje įterpimo reikšmės mokymo metu išmokstamos. Puslapyje rodomos tik fiksuotos vietos reikšmės."],
      },
    ],
    takeaways: [
      ["A word number is an id, not a meaning.", "ಪದ ಸಂಖ್ಯೆ ಒಂದು ಗುರುತು, ಅರ್ಥವಲ್ಲ.", "Žodžio numeris – tai identifikatorius, o ne prasmė."],
      ["One-hot is long and forgets the order.", "One-hot ಉದ್ದ ಮತ್ತು ಕ್ರಮ ಮರೆಯುತ್ತದೆ.", "Vienas karštas – ilgas ir pamiršta tvarką."],
      ["Embeddings are short, learned and keep the sequence.", "ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳು ಚಿಕ್ಕವು, ಕಲಿತವು ಮತ್ತು ಕ್ರಮ ಉಳಿಸುತ್ತವೆ.", "Įterpimai trumpi, išmokti ir išlaiko seką."],
    ],
    mistakes: [
      ["Treating the hashed word numbers of this demo as the real IMDB ids.", "ಈ ಡೆಮೊದ ಹ್ಯಾಶ್ ಪದ ಸಂಖ್ಯೆಗಳನ್ನು ನಿಜವಾದ IMDB ಗುರುತುಗಳೆಂದು ಭಾವಿಸುವುದು.", "Laikyti šios demonstracijos maišos žodžių numerius tikrais IMDB identifikatoriais."],
    ],
  },

  conv1d: {
    goal: [
      "See how a 1D filter reads k neighbouring words and why global max pooling keeps the best match.",
      "1D ಫಿಲ್ಟರ್ k ನೆರೆಯ ಪದಗಳನ್ನು ಹೇಗೆ ಓದುತ್ತದೆ ಮತ್ತು ಗ್ಲೋಬಲ್ ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ಉತ್ತಮ ಹೊಂದಾಣಿಕೆಯನ್ನು ಏಕೆ ಉಳಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ.",
      "Pamatykite, kaip 1D filtras skaito k gretimų žodžių ir kodėl globalus didžiausias sujungimas išlaiko geriausią atitikimą.",
    ],
    fit: [
      "Task 2.2 uses Conv1D on the embeddings. The filter is the same idea as the 2D kernel, but it slides along the words.",
      "ಕಾರ್ಯ 2.2 ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳ ಮೇಲೆ Conv1D ಬಳಸುತ್ತದೆ. ಫಿಲ್ಟರ್ 2D ಕರ್ನಲ್‌ನ ಅದೇ ಕಲ್ಪನೆ, ಆದರೆ ಪದಗಳ ಉದ್ದಕ್ಕೂ ಜಾರುತ್ತದೆ.",
      "2.2 užduotis naudoja Conv1D ant įterpimų. Filtras – ta pati idėja kaip 2D branduolys, tik slenka išilgai žodžių.",
    ],
    keywords: [
      [["Window width k", "ಕಿಟಕಿ ಅಗಲ k", "Lango plotis k"], ["How many neighbouring words the filter reads at once.", "ಫಿಲ್ಟರ್ ಒಮ್ಮೆಗೆ ಎಷ್ಟು ನೆರೆಯ ಪದಗಳನ್ನು ಓದುತ್ತದೆ.", "Kiek gretimų žodžių filtras skaito vienu metu."]],
      [["Filter output", "ಫಿಲ್ಟರ್ ಔಟ್‌ಪುಟ್", "Filtro išvestis"], ["A score for each window.", "ಪ್ರತಿ ಕಿಟಕಿಗೆ ಒಂದು ಅಂಕ.", "Kiekvieno lango balas."]],
      [["Global max pooling", "ಗ್ಲೋಬಲ್ ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್", "Globalus didžiausias sujungimas"], ["The highest score anywhere in the review.", "ವಿಮರ್ಶೆಯಲ್ಲಿ ಎಲ್ಲೆಡೆಯ ಅತ್ಯಧಿಕ ಅಂಕ.", "Aukščiausias balas bet kurioje apžvalgos vietoje."]],
      [["Negation", "ನಿರಾಕರಣೆ", "Neigimas"], ["In this toy, 'not' flips the sentiment of the next word.", "ಈ ಆಟಿಕೆ ಮಾದರಿಯಲ್ಲಿ 'not' ಮುಂದಿನ ಪದದ ಭಾವನೆಯನ್ನು ತಿರುಗಿಸುತ್ತದೆ.", "Šiame žaislo modelyje „not“ apverčia kito žodžio nuotaiką."]],
    ],
    tasks: [
      ["Set k = 2 and find the window that contains 'not good'.", "k = 2 ಹೊಂದಿಸಿ 'not good' ಇರುವ ಕಿಟಕಿಯನ್ನು ಹುಡುಕಿ.", "Nustatykite k = 2 ir raskite langą su „not good“."],
      ["Select 'not bad but not great' and read the global max.", "'not bad but not great' ಆರಿಸಿ ಗ್ಲೋಬಲ್ ಮ್ಯಾಕ್ಸ್ ಓದಿ.", "Pasirinkite „not bad but not great“ ir perskaitykite globalų didžiausią."],
      ["Explain why the window 'not good' is negative.", "'not good' ಕಿಟಕಿ ಋಣಾತ್ಮಕ ಏಕೆ ಎಂದು ವಿವರಿಸಿ.", "Paaiškinkite, kodėl langas „not good“ yra neigiamas."],
      ["Compare k = 2 and k = 3 for 'a truly great film with great acting'.", "'a truly great film with great acting' ಗೆ k = 2 ಮತ್ತು k = 3 ಹೋಲಿಸಿ.", "Palyginkite k = 2 ir k = 3 sakiniui „a truly great film with great acting“."],
    ],
    questions: [
      {
        q: ["For 'the plot was not good at all' with k = 3, what is the largest window output?", "k = 3 ನೊಂದಿಗೆ 'the plot was not good at all' ನ ಅತಿ ದೊಡ್ಡ ಕಿಟಕಿ ಔಟ್‌ಪುಟ್ ಎಷ್ಟು?", "Su k = 3 sakiniui „the plot was not good at all“, kokia didžiausia lango išvestis?"],
        options: [["0.6", "0.6", "0.6"], ["0", "0", "0"], ["−0.6", "−0.6", "−0.6"]],
        correct: 0,
        why: ["The last window 'good at all' starts with 'good' (sentiment 1), giving 0.6. The windows 'was not good' and 'not good at' come out negative.", "ಕೊನೆಯ ಕಿಟಕಿ 'good at all' 'good' (ಭಾವನೆ 1) ನಿಂದ ಆರಂಭವಾಗಿ 0.6 ನೀಡುತ್ತದೆ. 'was not good' ಮತ್ತು 'not good at' ಕಿಟಕಿಗಳು ಋಣಾತ್ಮಕ.", "Paskutinis langas „good at all“ prasideda nuo „good“ (nuotaika 1) ir duoda 0,6. Langai „was not good“ ir „not good at“ yra neigiami."],
        verify: () => Math.max(...conv1dWindows(REVIEWS[0], 3)) === 0.6,
      },
      {
        q: ["What does global max pooling do?", "ಗ್ಲೋಬಲ್ ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ಏನು ಮಾಡುತ್ತದೆ?", "Ką daro globalus didžiausias sujungimas?"],
        options: [["Keeps the strongest window, wherever it was in the review", "ವಿಮರ್ಶೆಯಲ್ಲಿ ಎಲ್ಲೇ ಇದ್ದರೂ ಬಲವಾದ ಕಿಟಕಿಯನ್ನು ಉಳಿಸುತ್ತದೆ", "Išlaiko stipriausią langą, kur jis bebūtų apžvalgoje"], ["Averages all windows", "ಎಲ್ಲಾ ಕಿಟಕಿಗಳ ಸರಾಸರಿ", "Apskaičiuoja visų langų vidurkį"], ["Removes the last word", "ಕೊನೆಯ ಪದ ತೆಗೆದುಹಾಕುತ್ತದೆ", "Pašalina paskutinį žodį"]],
        correct: 0,
        why: ["The maximum is taken over all positions, so a phrase counts wherever it appears.", "ಗರಿಷ್ಠ ಎಲ್ಲಾ ಸ್ಥಾನಗಳ ಮೇಲೆ ತೆಗೆದುಕೊಳ್ಳಲಾಗುತ್ತದೆ; ಆದ್ದರಿಂದ ಪದಗುಚ್ಛ ಎಲ್ಲೇ ಬಂದರೂ ಎಣಿಕೆಯಾಗುತ್ತದೆ.", "Didžiausia reikšmė imama iš visų padėčių, todėl frazė skaičiuojama bet kur, kur ji pasirodo."],
      },
      {
        q: ["Why does a word window have a width k?", "ಪದ ಕಿಟಕಿಗೆ ಅಗಲ k ಏಕೆ?", "Kodėl žodžių langas turi plotį k?"],
        options: [["To set the number of hidden neurons", "ಗುಪ್ತ ನ್ಯೂರಾನ್‌ಗಳ ಸಂಖ್ಯೆ ನಿಗದಿಪಡಿಸಲು", "Kad nustatytų paslėptų neuronų skaičių"], ["To pad the review", "ವಿಮರ್ಶೆಯನ್ನು ತುಂಬಲು", "Kad užpildytų apžvalgą"], ["To see k neighbouring words at once, so a phrase such as 'not good' is one unit", "ಒಮ್ಮೆಗೆ k ನೆರೆಯ ಪದಗಳನ್ನು ನೋಡಲು; ಆದ್ದರಿಂದ 'not good' ನಂತಹ ಪದಗುಚ್ಛ ಒಂದು ಘಟಕ", "Kad vienu metu matytų k gretimų žodžių, todėl frazė „not good“ yra vienas vienetas"]],
        correct: 2,
        why: ["A phrase is only meaningful when its words are read together, so the filter looks at k words at a time.", "ಪದಗುಚ್ಛ ತನ್ನ ಪದಗಳನ್ನು ಒಟ್ಟಿಗೆ ಓದಿದಾಗ ಮಾತ್ರ ಅರ್ಥವಾಗುತ್ತದೆ; ಆದ್ದರಿಂದ ಫಿಲ್ಟರ್ ಒಮ್ಮೆಗೆ k ಪದಗಳನ್ನು ನೋಡುತ್ತದೆ.", "Frazė turi prasmę tik tada, kai žodžiai skaitomi kartu, todėl filtras žiūri į k žodžių vienu metu."],
      },
    ],
    takeaways: [
      ["Conv1D slides along the words, like a 2D kernel slides over pixels.", "Conv1D ಪದಗಳ ಉದ್ದಕ್ಕೂ ಜಾರುತ್ತದೆ, 2D ಕರ್ನಲ್ ಪಿಕ್ಸೆಲ್‌ಗಳ ಮೇಲೆ ಜಾರುವಂತೆ.", "Conv1D slenka išilgai žodžių, kaip 2D branduolys slenka per taškus."],
      ["Global max pooling answers: did the pattern appear anywhere?", "ಗ್ಲೋಬಲ್ ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ಉತ್ತರಿಸುತ್ತದೆ: ರಚನೆ ಎಲ್ಲೋ ಕಾಣಿಸಿತೇ?", "Globalus didžiausias sujungimas atsako: ar raštas kur nors pasirodė?"],
      ["The best window gives the review's score.", "ಅತ್ಯುತ್ತಮ ಕಿಟಕಿ ವಿಮರ್ಶೆಯ ಅಂಕವನ್ನು ನೀಡುತ್ತದೆ.", "Geriausias langas duoda apžvalgos balą."],
    ],
    mistakes: [
      ["Using k = 2 for a three-word phrase, so the window never sees the whole phrase.", "ಮೂರು ಪದಗಳ ಪದಗುಚ್ಛಕ್ಕೆ k = 2 ಬಳಸುವುದು; ಆಗ ಕಿಟಕಿ ಇಡೀ ಪದಗುಚ್ಛವನ್ನು ಎಂದಿಗೂ ನೋಡುವುದಿಲ್ಲ.", "Trijų žodžių frazei naudoti k = 2 – langas niekada nemato visos frazės."],
    ],
  },

  rnn: {
    goal: [
      "Follow the state of an LSTM and a GRU cell word by word, and see what each gate decides.",
      "LSTM ಮತ್ತು GRU ಕೋಶದ ಸ್ಥಿತಿಯನ್ನು ಪದ ಪದವಾಗಿ ಅನುಸರಿಸಿ, ಪ್ರತಿ ಗೇಟ್ ಏನು ನಿರ್ಧರಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ.",
      "Sekite LSTM ir GRU ląstelės būseną žodis po žodžio ir pamatykite, ką nusprendžia kiekvienas vartas.",
    ],
    fit: [
      "Task 2.3 uses LSTM and GRU layers. Both remember a review through a state that changes at every word; the gates say how much to keep and how much to write.",
      "ಕಾರ್ಯ 2.3 LSTM ಮತ್ತು GRU ಪದರಗಳನ್ನು ಬಳಸುತ್ತದೆ. ಎರಡೂ ಪ್ರತಿ ಪದದಲ್ಲಿ ಬದಲಾಗುವ ಸ್ಥಿತಿಯ ಮೂಲಕ ವಿಮರ್ಶೆಯನ್ನು ನೆನಪಿಡುತ್ತವೆ; ಗೇಟ್‌ಗಳು ಎಷ್ಟನ್ನು ಉಳಿಸಬೇಕು ಮತ್ತು ಎಷ್ಟನ್ನು ಬರೆಯಬೇಕು ಎಂದು ಹೇಳುತ್ತವೆ.",
      "2.3 užduotis naudoja LSTM ir GRU sluoksnius. Abu prisimena apžvalgą per būseną, kuri keičiasi kiekvienu žodžiu; vartai nusako, kiek išlaikyti ir kiek įrašyti.",
    ],
    keywords: [
      [["Hidden state h", "ಗುಪ್ತ ಸ್ಥಿತಿ h", "Paslėpta būsena h"], ["The memory the cell passes on to the next word.", "ಕೋಶ ಮುಂದಿನ ಪದಕ್ಕೆ ರವಾನಿಸುವ ಸ್ಮರಣೆ.", "Atmintis, kurią ląstelė perduoda kitam žodžiui."]],
      [["Cell state c (LSTM)", "ಕೋಶ ಸ್ಥಿತಿ c (LSTM)", "Ląstelės būsena c (LSTM)"], ["A second memory that only the gates change.", "ಎರಡನೇ ಸ್ಮರಣೆ; ಇದನ್ನು ಗೇಟ್‌ಗಳು ಮಾತ್ರ ಬದಲಿಸುತ್ತವೆ.", "Antra atmintis, kurią keičia tik vartai."]],
      [["Gate", "ಗೇಟ್", "Vartai"], ["A sigmoid from 0 to 1 that scales how much passes.", "0 ರಿಂದ 1 ರವರೆಗಿನ ಸಿಗ್ಮಾಯ್ಡ್; ಎಷ್ಟು ಹಾದುಹೋಗುತ್ತದೆ ಎಂದು ನಿರ್ಧರಿಸುತ್ತದೆ.", "Sigmoidė nuo 0 iki 1, nusakanti, kiek perduodama."]],
      [["Update gate z (GRU)", "ಅಪ್‌ಡೇಟ್ ಗೇಟ್ z (GRU)", "Atnaujinimo vartai z (GRU)"], ["How much of the old state is replaced.", "ಹಳೆಯ ಸ್ಥಿತಿಯಲ್ಲಿ ಎಷ್ಟನ್ನು ಬದಲಿಸಲಾಗುತ್ತದೆ.", "Kiek senos būsenos pakeičiama."]],
    ],
    tasks: [
      ["Press 'Next word' six times with LSTM and read the forget gate on 'not'.", "LSTM ನಲ್ಲಿ 'Next word' ಆರು ಬಾರಿ ಒತ್ತಿ 'not' ನಲ್ಲಿ forget gate ಓದಿ.", "Su LSTM šešis kartus paspauskite „Kitas žodis“ ir perskaitykite užmiršimo vartus ties „not“."],
      ["Switch to GRU and find the step where the state changes most.", "GRU ಗೆ ಬದಲಿಸಿ ಸ್ಥಿತಿ ಅತಿ ಹೆಚ್ಚು ಬದಲಾಗುವ ಹಂತ ಹುಡುಕಿ.", "Perjunkite į GRU ir raskite žingsnį, kur būsena labiausiai keičiasi."],
      ["Reset and compare the final h of the LSTM and the GRU.", "ಮರುಹೊಂದಿಸಿ LSTM ಮತ್ತು GRU ನ ಅಂತಿಮ h ಹೋಲಿಸಿ.", "Iš naujo nustatykite ir palyginkite LSTM bei GRU galutinį h."],
      ["Name the gate that decides how much of the old memory is kept.", "ಹಳೆಯ ಸ್ಮರಣೆಯಲ್ಲಿ ಎಷ್ಟನ್ನು ಉಳಿಸಬೇಕೆಂದು ನಿರ್ಧರಿಸುವ ಗೇಟ್ ಹೆಸರಿಸಿ.", "Įvardykite vartus, kurie nusprendžia, kiek senos atminties išlaikyti."],
    ],
    questions: [
      {
        q: ["Which LSTM gate decides how much of the old cell state c is kept?", "ಹಳೆಯ ಕೋಶ ಸ್ಥಿತಿ c ನಲ್ಲಿ ಎಷ್ಟನ್ನು ಉಳಿಸಬೇಕೆಂದು LSTM ನ ಯಾವ ಗೇಟ್ ನಿರ್ಧರಿಸುತ್ತದೆ?", "Kurie LSTM vartai nusprendžia, kiek senos ląstelės būsenos c išlaikyti?"],
        options: [["The forget gate", "ಮರೆಯುವ ಗೇಟ್ (forget gate)", "Užmiršimo vartai"], ["The output gate", "ಔಟ್‌ಪುಟ್ ಗೇಟ್", "Išvesties vartai"], ["The candidate g", "ಅಭ್ಯರ್ಥಿ g", "Kandidatas g"]],
        correct: 0,
        why: ["f = sigmoid(...) multiplies the old c. The input gate writes new information and the output gate decides what is shown as h.", "f = sigmoid(...) ಹಳೆಯ c ಯನ್ನು ಗುಣಿಸುತ್ತದೆ. ಇನ್‌ಪುಟ್ ಗೇಟ್ ಹೊಸ ಮಾಹಿತಿ ಬರೆಯುತ್ತದೆ, ಔಟ್‌ಪುಟ್ ಗೇಟ್ h ಆಗಿ ಏನು ತೋರಿಸಬೇಕೆಂದು ನಿರ್ಧರಿಸುತ್ತದೆ.", "f = sigmoid(...) padaugina seną c. Įvesties vartai įrašo naują informaciją, išvesties vartai nusprendžia, kas rodoma kaip h."],
      },
      {
        q: ["How many state vectors does a GRU keep, compared with an LSTM?", "LSTM ಗೆ ಹೋಲಿಸಿದರೆ GRU ಎಷ್ಟು ಸ್ಥಿತಿ ವೆಕ್ಟರ್‌ಗಳನ್ನು ಇಡುತ್ತದೆ?", "Kiek būsenos vektorių saugo GRU, palyginti su LSTM?"],
        options: [["One (h), with no separate cell state", "ಒಂದು (h), ಪ್ರತ್ಯೇಕ ಕೋಶ ಸ್ಥಿತಿ ಇಲ್ಲ", "Vieną (h), be atskiros ląstelės būsenos"], ["Two, like the LSTM", "ಎರಡು, LSTM ನಂತೆ", "Du, kaip LSTM"], ["Three", "ಮೂರು", "Tris"]],
        correct: 0,
        why: ["The GRU merges the cell state into h, which is why it has fewer parameters.", "GRU ಕೋಶ ಸ್ಥಿತಿಯನ್ನು h ನಲ್ಲಿ ವಿಲೀನಗೊಳಿಸುತ್ತದೆ; ಆದ್ದರಿಂದ ಅದರಲ್ಲಿ ಕಡಿಮೆ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು.", "GRU ląstelės būseną sujungia su h, todėl jame mažiau parametrų."],
      },
      {
        q: ["In the recorded run, which cell gave the best recurrent text model in Task 2.3?", "ದಾಖಲಾದ ರನ್‌ನಲ್ಲಿ ಕಾರ್ಯ 2.3 ರಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಮರುಕಳಿಸುವ ಪಠ್ಯ ಮಾದರಿಯನ್ನು ಯಾವ ಕೋಶ ನೀಡಿತು?", "Įrašytame paleidime, kuri ląstelė davė geriausią pasikartojantį teksto modelį užduotyje 2.3?"],
        options: [["GRU with 32 neurons (85.87 % test accuracy)", "32 ನ್ಯೂರಾನ್‌ಗಳ GRU (85.87 % ಪರೀಕ್ಷಾ ನಿಖರತೆ)", "GRU su 32 neuronais (85,87 % testavimo tikslumas)"], ["LSTM with 64 neurons and ReLU", "64 ನ್ಯೂರಾನ್‌ಗಳ ಮತ್ತು ReLU ನ LSTM", "LSTM su 64 neuronais ir ReLU"], ["LSTM with two layers", "ಎರಡು ಪದರಗಳ LSTM", "LSTM su dviem sluoksniais"]],
        correct: 0,
        why: ["Run 7 (GRU, 32 neurons, tanh, Adam) has the highest validation accuracy of the recurrent runs, and 0.8587 on test.", "ರನ್ 7 (GRU, 32 ನ್ಯೂರಾನ್, tanh, Adam) ಮರುಕಳಿಸುವ ರನ್‌ಗಳಲ್ಲಿ ಅತ್ಯಧಿಕ ಮೌಲ್ಯೀಕರಣ ನಿಖರತೆ ಹೊಂದಿದೆ; ಪರೀಕ್ಷೆಯಲ್ಲಿ 0.8587.", "2 paleidimas (GRU, 32 neuronai, tanh, Adam) turi didžiausią validavimo tikslumą tarp pasikartojančių paleidimų; testavime – 0,8587."],
        verify: () => TASK23.find((r) => r.Run === 7)!.test_acc === 0.8587 && TASK23.filter((r) => String(r.Cell).match(/LSTM|GRU/)).every((r) => (r.val_acc as number) <= 0.8662),
      },
    ],
    takeaways: [
      ["The hidden state is the memory that is passed on.", "ಗುಪ್ತ ಸ್ಥಿತಿ ಮುಂದೆ ರವಾನೆಯಾಗುವ ಸ್ಮರಣೆ.", "Paslėpta būsena – tai perduodama atmintis."],
      ["Gates are sigmoids between 0 and 1.", "ಗೇಟ್‌ಗಳು 0 ಮತ್ತು 1 ನಡುವಿನ ಸಿಗ್ಮಾಯ್ಡ್‌ಗಳು.", "Vartai – sigmoidės tarp 0 ir 1."],
      ["GRU has no separate cell state and fewer parameters.", "GRU ಗೆ ಪ್ರತ್ಯೇಕ ಕೋಶ ಸ್ಥಿತಿ ಇಲ್ಲ ಮತ್ತು ಕಡಿಮೆ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು.", "GRU neturi atskiros ląstelės būsenos ir turi mažiau parametrų."],
    ],
    mistakes: [
      ["Reading the toy weights as the trained weights of the lab.", "ಆಟಿಕೆ ತೂಕಗಳನ್ನು ಲ್ಯಾಬ್‌ನ ತರಬೇತಿ ಪಡೆದ ತೂಕಗಳೆಂದು ಭಾವಿಸುವುದು.", "Žaislo svorius laikyti laboratorijos išmokytais svoriais."],
    ],
  },

  results: {
    goal: [
      "Read the recorded results of the Keras run and say which model was best and why.",
      "Keras ಪ್ರಯೋಗದ ದಾಖಲಾದ ಫಲಿತಾಂಶಗಳನ್ನು ಓದಿ ಯಾವ ಮಾದರಿ ಅತ್ಯುತ್ತಮ ಮತ್ತು ಏಕೆ ಎಂದು ಹೇಳಿ.",
      "Perskaitykite įrašytus Keras paleidimo rezultatus ir pasakykite, koks modelis geriausias ir kodėl.",
    ],
    fit: [
      "The results are the evidence for your report. Every number here comes from the run recorded by the lab script, not from a new training in your browser.",
      "ಫಲಿತಾಂಶಗಳು ನಿಮ್ಮ ವರದಿಯ ಸಾಕ್ಷ್ಯ. ಇಲ್ಲಿರುವ ಪ್ರತಿ ಸಂಖ್ಯೆ ಲ್ಯಾಬ್ ಸ್ಕ್ರಿಪ್ಟ್ ದಾಖಲಿಸಿದ ರನ್‌ನಿಂದ ಬಂದಿದೆ; ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಹೊಸ ತರಬೇತಿಯಿಂದಲ್ಲ.",
      "Rezultatai – tai jūsų ataskaitos įrodymai. Visi čia esantys skaičiai gauti iš laboratorijos skripto įrašyto paleidimo, o ne iš naujo mokymo jūsų naršyklėje.",
    ],
    keywords: [
      [["Validation accuracy", "ಮೌಲ್ಯೀಕರಣ ನಿಖರತೆ", "Validavimo tikslumas"], ["Used to pick the best run, so the test set stays honest.", "ಉತ್ತಮ ರನ್ ಆಯ್ಕೆಗೆ ಬಳಸಲಾಗುತ್ತದೆ; ಆದ್ದರಿಂದ ಪರೀಕ್ಷಾ ಸೆಟ್ ಪ್ರಾಮಾಣಿಕವಾಗಿರುತ್ತದೆ.", "Naudojamas geriausiam paleidimui parinkti, todėl testavimo rinkinys lieka nešališkas."]],
      [["Test accuracy", "ಪರೀಕ್ಷಾ ನಿಖರತೆ", "Testavimo tikslumas"], ["The final number, measured once on data the model has not seen.", "ಅಂತಿಮ ಸಂಖ್ಯೆ; ಮಾದರಿ ನೋಡದ ಡೇಟಾದ ಮೇಲೆ ಒಮ್ಮೆ ಅಳೆಯಲಾಗುತ್ತದೆ.", "Galutinis skaičius, išmatuotas kartą ant duomenų, kurių modelis nematė."]],
      [["Recorded run", "ದಾಖಲಾದ ರನ್", "Įrašytas paleidimas"], ["Numbers saved by the lab script on a CPU.", "CPU ನಲ್ಲಿ ಲ್ಯಾಬ್ ಸ್ಕ್ರಿಪ್ಟ್ ಉಳಿಸಿದ ಸಂಖ್ಯೆಗಳು.", "Laboratorijos skripto CPU įrašyti skaičiai."]],
      [["Overfitting", "ಓವರ್‌ಫಿಟ್ಟಿಂಗ್", "Persimokymas"], ["Training accuracy much higher than test accuracy.", "ತರಬೇತಿ ನಿಖರತೆ ಪರೀಕ್ಷಾ ನಿಖರತೆಗಿಂತ ಬಹಳ ಹೆಚ್ಚು.", "Mokymo tikslumas gerokai didesnis nei testavimo."]],
    ],
    tasks: [
      ["Find the best CNN run and its test accuracy (99.09 %).", "ಅತ್ಯುತ್ತಮ CNN ರನ್ ಮತ್ತು ಅದರ ಪರೀಕ್ಷಾ ನಿಖರತೆ (99.09 %) ಹುಡುಕಿ.", "Raskite geriausią CNN paleidimą ir jo testavimo tikslumą (99,09 %)."],
      ["Compare the CNN with the Lab 1 network (98.16 %).", "CNN ಅನ್ನು ಲ್ಯಾಬ್ 1 ನೆಟ್‌ವರ್ಕ್ (98.16 %) ಜೊತೆ ಹೋಲಿಸಿ.", "Palyginkite CNN su 1 laboratorijos tinklu (98,16 %)."],
      ["Find the best recurrent model (GRU 32, 85.87 %) and the best text model (one-hot Dense, 88.3 %).", "ಅತ್ಯುತ್ತಮ ಮರುಕಳಿಸುವ ಮಾದರಿ (GRU 32, 85.87 %) ಮತ್ತು ಅತ್ಯುತ್ತಮ ಪಠ್ಯ ಮಾದರಿ (one-hot Dense, 88.3 %) ಹುಡುಕಿ.", "Raskite geriausią pasikartojantį modelį (GRU 32, 85,87 %) ir geriausią teksto modelį (vienas karštas Dense, 88,3 %)."],
      ["Name the runs that failed (ReLU stays at 50 %).", "ವಿಫಲವಾದ ರನ್‌ಗಳನ್ನು ಹೆಸರಿಸಿ (ReLU 50 % ನಲ್ಲಿಯೇ ಉಳಿಯುತ್ತದೆ).", "Įvardykite nepavykusius paleidimus (ReLU lieka ties 50 %)."],
    ],
    questions: [
      {
        q: ["Which CNN run did the lab choose as best, and what is its test accuracy?", "ಲ್ಯಾಬ್ ಅತ್ಯುತ್ತಮವಾಗಿ ಯಾವ CNN ರನ್ ಆಯ್ಕೆ ಮಾಡಿದೆ, ಮತ್ತು ಅದರ ಪರೀಕ್ಷಾ ನಿಖರತೆ ಎಷ್ಟು?", "Kurį CNN paleidimą laboratorija pasirinko geriausiu ir koks jo testavimo tikslumas?"],
        options: [["Run 4 (32-64-128 filters), 99.09 % test", "ರನ್ 4 (32-64-128 ಫಿಲ್ಟರ್), ಪರೀಕ್ಷೆ 99.09 %", "4 paleidimas (32-64-128 filtrai), testas 99,09 %"], ["Run 10, 99.13 % test", "ರನ್ 10, ಪರೀಕ್ಷೆ 99.13 %", "10 paleidimas, testas 99,13 %"], ["Run 6, 99.18 % test", "ರನ್ 6, ಪರೀಕ್ಷೆ 99.18 %", "6 paleidimas, testas 99,18 %"]],
        correct: 0,
        why: ["The choice is made on validation accuracy (99.17 %, the highest). Run 10 has a slightly higher test score but was not selected.", "ಆಯ್ಕೆ ಮೌಲ್ಯೀಕರಣ ನಿಖರತೆಯ ಮೇಲೆ (99.17 %, ಅತ್ಯಧಿಕ). ರನ್ 10 ರ ಪರೀಕ್ಷಾ ಅಂಕ ಸ್ವಲ್ಪ ಹೆಚ್ಚು, ಆದರೆ ಅದು ಆಯ್ಕೆಯಾಗಲಿಲ್ಲ.", "Pasirinkimas daromas pagal validavimo tikslumą (99,17 %, aukščiausias). 10 paleidimas testavime šiek tiek geresnis, bet nebuvo pasirinktas."],
        verify: () => SUMMARY.task11.best_run === 4 && TASK11[3].test_acc === 0.9909 && TASK11[9].test_acc === 0.9913 && TASK11[3].val_acc === 0.9917,
      },
      {
        q: ["The CNN has 241 546 parameters and the Lab 1 network 575 050. Which is more accurate on the test set?", "CNN ನಲ್ಲಿ 241 546 ಮತ್ತು ಲ್ಯಾಬ್ 1 ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ 575 050 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ. ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಯಾವುದು ಹೆಚ್ಚು ನಿಖರ?", "CNN turi 241 546, o 1 laboratorijos tinklas – 575 050 parametrų. Kuris testavimo rinkinyje tikslesnis?"],
        options: [["The CNN: 99.09 % against 98.16 %", "CNN: 98.16 % ವಿರುದ್ಧ 99.09 %", "CNN: 99,09 % prieš 98,16 %"], ["The Lab 1 network", "ಲ್ಯಾಬ್ 1 ನೆಟ್‌ವರ್ಕ್", "1 laboratorijos tinklas"], ["They are equal", "ಅವು ಸಮ", "Jie lygūs"]],
        correct: 0,
        why: ["Fewer parameters and better accuracy: the convolution reuses its weights across the picture.", "ಕಡಿಮೆ ಪ್ಯಾರಾಮೀಟರ್ ಮತ್ತು ಉತ್ತಮ ನಿಖರತೆ: ಕನ್ವಲ್ಯೂಷನ್ ತೂಕಗಳನ್ನು ಚಿತ್ರದಾದ್ಯಂತ ಮರುಬಳಕೆ ಮಾಡುತ್ತದೆ.", "Mažiau parametrų ir geresnis tikslumas: konvoliucija perpanaudoja savo svorius per visą vaizdą."],
        verify: () => SUMMARY.task11.test_acc > SUMMARY.task11.fc_test_acc && SUMMARY.task11.cnn_params < SUMMARY.task11.fc_params,
      },
      {
        q: ["What does 'recorded, not re-run' mean on this page?", "ಈ ಪುಟದಲ್ಲಿ 'ದಾಖಲಿಸಲಾಗಿದೆ, ಮರುಚಾಲನೆ ಮಾಡಿಲ್ಲ' ಎಂದರೆ ಏನು?", "Ką reiškia šiame puslapyje „įrašyta, neperleista“?"],
        options: [["The numbers were produced by the lab script on CPU and copied here; the browser does not retrain", "ಸಂಖ್ಯೆಗಳನ್ನು CPU ನಲ್ಲಿ ಲ್ಯಾಬ್ ಸ್ಕ್ರಿಪ್ಟ್ ಉತ್ಪಾದಿಸಿ ಇಲ್ಲಿ ನಕಲಿಸಲಾಗಿದೆ; ಬ್ರೌಸರ್ ಮರುತರಬೇತಿ ಮಾಡುವುದಿಲ್ಲ", "Skaičiai sugeneruoti laboratorijos skripto CPU ir čia nukopijuoti; naršyklė nepermoko"], ["The numbers are random", "ಸಂಖ್ಯೆಗಳು ಯಾದೃಚ್ಛಿಕ", "Skaičiai atsitiktiniai"], ["The model was trained on a GPU", "ಮಾದರಿಯನ್ನು GPU ನಲ್ಲಿ ತರಬೇತಿ ಮಾಡಲಾಗಿದೆ", "Modelis mokytas GPU"]],
        correct: 0,
        why: ["The summary says CPU only. Say so in the report, and do not claim a number this page did not measure.", "ಸಾರಾಂಶ CPU ಮಾತ್ರ ಎಂದು ಹೇಳುತ್ತದೆ. ವರದಿಯಲ್ಲಿ ಹಾಗೆಯೇ ಹೇಳಿ; ಈ ಪುಟ ಅಳೆಯದ ಸಂಖ್ಯೆಯನ್ನು ಹೇಳಬೇಡಿ.", "Santraukoje nurodyta, kad tik CPU. Ataskaitoje taip ir nurodykite; nepateikite skaičiaus, kurio šis puslapis neišmatavo."],
      },
    ],
    takeaways: [
      ["Choose by validation, report the test number once.", "ಮೌಲ್ಯೀಕರಣದ ಮೇಲೆ ಆಯ್ಕೆ ಮಾಡಿ, ಪರೀಕ್ಷಾ ಸಂಖ್ಯೆ ಒಮ್ಮೆ ವರದಿ ಮಾಡಿ.", "Rinkitės pagal validavimą, testo skaičių pateikite vieną kartą."],
      ["The CNN beats the Lab 1 network with fewer parameters.", "CNN ಕಡಿಮೆ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳೊಂದಿಗೆ ಲ್ಯಾಬ್ 1 ನೆಟ್‌ವರ್ಕ್‌ಗಿಂತ ಮೇಲುಗೈ ಸಾಧಿಸುತ್ತದೆ.", "CNN įveikia 1 laboratorijos tinklą su mažiau parametrų."],
      ["Text tasks are harder: the best reaches about 88 %.", "ಪಠ್ಯ ಕಾರ್ಯಗಳು ಕಠಿಣ: ಅತ್ಯುತ್ತಮ ಸುಮಾರು 88 % ತಲುಪುತ್ತದೆ.", "Teksto užduotys sunkesnės: geriausias pasiekia apie 88 %."],
    ],
    mistakes: [
      ["Quoting the highest test number in the table instead of the one chosen by validation.", "ಮೌಲ್ಯೀಕರಣದಿಂದ ಆಯ್ಕೆಯಾದ ಸಂಖ್ಯೆಯ ಬದಲು ಕೋಷ್ಟಕದ ಅತಿ ಹೆಚ್ಚು ಪರೀಕ್ಷಾ ಸಂಖ್ಯೆಯನ್ನು ಉಲ್ಲೇಖಿಸುವುದು.", "Cituoti didžiausią testo skaičių lentelėje vietoj to, kurį pasirinko validavimas."],
    ],
  },

  code: {
    goal: [
      "Read the real code of lab2.py step by step and connect each cell with a demo above.",
      "lab2.py ನ ನಿಜವಾದ ಕೋಡ್ ಅನ್ನು ಹಂತ ಹಂತವಾಗಿ ಓದಿ ಪ್ರತಿ ಸೆಲ್ ಅನ್ನು ಮೇಲಿನ ಡೆಮೊಗೆ ಸಂಪರ್ಕಿಸಿ.",
      "Skaitykite tikrą lab2.py kodą žingsnis po žingsnio ir kiekvieną langelį susiekite su aukščiau esančia demonstracija.",
    ],
    fit: [
      "Knowing what each cell does lets you explain the code at the defense. The numbers in this lab come from these cells.",
      "ಪ್ರತಿ ಸೆಲ್ ಏನು ಮಾಡುತ್ತದೆ ಎಂದು ತಿಳಿದಿದ್ದರೆ ಡಿಫೆನ್ಸ್‌ನಲ್ಲಿ ಕೋಡ್ ವಿವರಿಸಬಹುದು. ಈ ಲ್ಯಾಬ್‌ನ ಸಂಖ್ಯೆಗಳು ಈ ಸೆಲ್‌ಗಳಿಂದ ಬಂದಿವೆ.",
      "Žinodami, ką daro kiekvienas langelis, galėsite paaiškinti kodą gynimo metu. Šios laboratorijos skaičiai gauti būtent iš šių langelių.",
    ],
    keywords: [
      [["Cell (# %%)", "ಸೆಲ್ (# %%)", "Langelis (# %%)"], ["A block of the script that runs as one unit in the notebook.", "ಸ್ಕ್ರಿಪ್ಟ್‌ನ ಒಂದು ಭಾಗ; ನೋಟ್‌ಬುಕ್‌ನಲ್ಲಿ ಒಂದು ಘಟಕವಾಗಿ ಚಲಿಸುತ್ತದೆ.", "Scenarijaus dalis, kuri užrašų knygelėje vykdoma kaip vienas vienetas."]],
      [["build_cnn", "build_cnn", "build_cnn"], ["Builds Conv2D, pooling, Flatten, Dense and softmax.", "Conv2D, ಪೂಲಿಂಗ್, Flatten, Dense ಮತ್ತು softmax ಅನ್ನು ನಿರ್ಮಿಸುತ್ತದೆ.", "Sukuria Conv2D, sujungimą, Flatten, Dense ir softmax."]],
      [["pick_best", "pick_best", "pick_best"], ["Chooses a run by validation accuracy.", "ಮೌಲ್ಯೀಕರಣ ನಿಖರತೆಯ ಆಧಾರದಲ್ಲಿ ರನ್ ಆಯ್ಕೆ ಮಾಡುತ್ತದೆ.", "Pasirenka paleidimą pagal validavimo tikslumą."]],
      [["Seed", "ಸೀಡ್", "Sėkla (seed)"], ["Makes every run start from the same weights.", "ಪ್ರತಿ ರನ್ ಒಂದೇ ತೂಕಗಳಿಂದ ಪ್ರಾರಂಭವಾಗುವಂತೆ ಮಾಡುತ್ತದೆ.", "Kiekvienas paleidimas prasideda nuo tų pačių svorių."]],
    ],
    tasks: [
      ["Open step 3 and find the Flatten layer.", "ಹಂತ 3 ತೆರೆದು Flatten ಪದರ ಹುಡುಕಿ.", "Atidarykite 3 žingsnį ir raskite Flatten sluoksnį."],
      ["Open step 4 and find the five architectures.", "ಹಂತ 4 ತೆರೆದು ಐದು ವಾಸ್ತುಶಿಲ್ಪಗಳನ್ನು ಹುಡುಕಿ.", "Atidarykite 4 žingsnį ir raskite penkias architektūras."],
      ["Open step 12 and find the embedding size of the Dense models.", "ಹಂತ 12 ತೆರೆದು Dense ಮಾದರಿಗಳ ಎಂಬೆಡ್ಡಿಂಗ್ ಗಾತ್ರ ಹುಡುಕಿ.", "Atidarykite 12 žingsnį ir raskite Dense modelių įterpimo dydį."],
      ["Open step 14 and read the list of variants.", "ಹಂತ 14 ತೆರೆದು ರೂಪಾಂತರಗಳ ಪಟ್ಟಿ ಓದಿ.", "Atidarykite 14 žingsnį ir perskaitykite variantų sąrašą."],
    ],
    questions: [
      {
        q: ["Which code step picks the best model by validation accuracy?", "ಯಾವ ಕೋಡ್ ಹಂತ ಮೌಲ್ಯೀಕರಣ ನಿಖರತೆಯಿಂದ ಅತ್ಯುತ್ತಮ ಮಾದರಿ ಆಯ್ಕೆ ಮಾಡುತ್ತದೆ?", "Kuris kodo žingsnis pasirenka geriausią modelį pagal validavimo tikslumą?"],
        options: [["pick_best", "pick_best", "pick_best"], ["build_cnn", "build_cnn", "build_cnn"], ["imdb.load_data", "imdb.load_data", "imdb.load_data"]],
        correct: 0,
        why: ["pick_best chooses by validation accuracy so that the test set is used only for the final numbers.", "pick_best ಮೌಲ್ಯೀಕರಣದ ಆಧಾರದಲ್ಲಿ ಆಯ್ಕೆ ಮಾಡುತ್ತದೆ; ಪರೀಕ್ಷಾ ಸೆಟ್ ಅಂತಿಮ ಸಂಖ್ಯೆಗಳಿಗೆ ಮಾತ್ರ ಬಳಕೆಯಾಗುತ್ತದೆ.", "pick_best renkasi pagal validavimo tikslumą, todėl testavimo rinkinys naudojamas tik galutiniams skaičiams."],
      },
      {
        q: ["What does the seed in step 0 do?", "ಹಂತ 0 ರಲ್ಲಿನ ಸೀಡ್ ಏನು ಮಾಡುತ್ತದೆ?", "Ką daro sėkla 0 žingsnyje?"],
        options: [["Every run starts from the same random weights, so runs are comparable", "ಪ್ರತಿ ರನ್ ಒಂದೇ ಯಾದೃಚ್ಛಿಕ ತೂಕಗಳಿಂದ ಪ್ರಾರಂಭವಾಗುತ್ತದೆ; ಆದ್ದರಿಂದ ರನ್‌ಗಳನ್ನು ಹೋಲಿಸಬಹುದು", "Kiekvienas paleidimas prasideda nuo tų pačių atsitiktinių svorių, todėl paleidimus galima lyginti"], ["It changes the test set", "ಇದು ಪರೀಕ್ಷಾ ಸೆಟ್ ಬದಲಿಸುತ್ತದೆ", "Ji keičia testavimo rinkinį"], ["It sets the number of epochs", "ಇದು ಎಪೋಕ್ ಸಂಖ್ಯೆ ನಿಗದಿಪಡಿಸುತ್ತದೆ", "Ji nustato epochų skaičių"]],
        correct: 0,
        why: ["A fixed seed removes one source of difference, so the changes you see come from the change you made.", "ಸ್ಥಿರ ಸೀಡ್ ಒಂದು ಭಿನ್ನತೆಯ ಮೂಲವನ್ನು ತೆಗೆಯುತ್ತದೆ; ಆದ್ದರಿಂದ ನೀವು ನೋಡುವ ಬದಲಾವಣೆ ನೀವು ಮಾಡಿದ ಬದಲಾವಣೆಯಿಂದ.", "Fiksuota sėkla pašalina vieną skirtumų šaltinį, todėl matomi pokyčiai kyla iš jūsų atlikto pakeitimo."],
      },
      {
        q: ["In step 12, what is the embedding size of the Dense models?", "ಹಂತ 12 ರಲ್ಲಿ Dense ಮಾದರಿಗಳ ಎಂಬೆಡ್ಡಿಂಗ್ ಗಾತ್ರ ಎಷ್ಟು?", "12 žingsnyje, koks Dense modelių įterpimo dydis?"],
        options: [["16", "16", "16"], ["32", "32", "32"], ["128", "128", "128"]],
        correct: 0,
        why: ["The code says layers.Embedding(VOCAB, 16). The Conv1D models of step 13 use 32.", "ಕೋಡ್ layers.Embedding(VOCAB, 16) ಎಂದು ಹೇಳುತ್ತದೆ. ಹಂತ 13ರ Conv1D ಮಾದರಿಗಳು 32 ಬಳಸುತ್ತವೆ.", "Kode parašyta layers.Embedding(VOCAB, 16). 13 žingsnio Conv1D modeliai naudoja 32."],
        verify: () => CODE_STEPS[12].title.startsWith("Step 12") && CODE_STEPS[12].code.includes("layers.Embedding(VOCAB, 16)"),
      },
    ],
    takeaways: [
      ["The code is the source of every number in the lab.", "ಕೋಡ್ ಲ್ಯಾಬ್‌ನ ಪ್ರತಿ ಸಂಖ್ಯೆಯ ಮೂಲ.", "Kodas – tai kiekvieno laboratorijos skaičiaus šaltinis."],
      ["Each cell has one job.", "ಪ್ರತಿ ಸೆಲ್‌ಗೆ ಒಂದೇ ಕೆಲಸ.", "Kiekvienas langelis turi vieną paskirtį."],
      ["You should explain any line you can point to.", "ನೀವು ತೋರಿಸಬಹುದಾದ ಪ್ರತಿ ಸಾಲನ್ನು ವಿವರಿಸಬೇಕು.", "Turėtumėte paaiškinti kiekvieną eilutę, į kurią galite parodyti."],
    ],
    mistakes: [
      ["Changing a setting in one cell and forgetting that the later cells read it.", "ಒಂದು ಸೆಲ್‌ನಲ್ಲಿ ಸೆಟ್ಟಿಂಗ್ ಬದಲಿಸಿ ನಂತರದ ಸೆಲ್‌ಗಳು ಅದನ್ನು ಓದುತ್ತವೆ ಎಂದು ಮರೆಯುವುದು.", "Pakeisti nustatymą viename langelyje ir pamiršti, kad vėlesni langeliai jį skaito."],
    ],
  },

  checklist: {
    goal: [
      "Tick off the concepts you must be able to explain at the defense.",
      "ಡಿಫೆನ್ಸ್‌ನಲ್ಲಿ ನೀವು ವಿವರಿಸಬೇಕಾದ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಗುರುತಿಸಿ.",
      "Pažymėkite sąvokas, kurias turite mokėti paaiškinti gynimo metu.",
    ],
    fit: [
      "The defense checks understanding, not memory. The checklist lists the ideas the lab is built on.",
      "ಡಿಫೆನ್ಸ್ ಅರ್ಥಮಾಡಿಕೊಳ್ಳುವಿಕೆಯನ್ನು ಪರಿಶೀಲಿಸುತ್ತದೆ, ನೆನಪನ್ನಲ್ಲ. ಪಟ್ಟಿ ಲ್ಯಾಬ್ ಆಧರಿಸಿರುವ ವಿಚಾರಗಳನ್ನು ಹೆಸರಿಸುತ್ತದೆ.",
      "Gynimas tikrina supratimą, o ne atmintį. Sąraše – idėjos, ant kurių remiasi laboratorija.",
    ],
    keywords: [
      [["Convolution", "ಕನ್ವಲ್ಯೂಷನ್", "Konvoliucija"], ["A kernel slides over the picture and sums products.", "ಕರ್ನಲ್ ಚಿತ್ರದ ಮೇಲೆ ಜಾರಿ ಗುಣಫಲಗಳನ್ನು ಸೇರಿಸುತ್ತದೆ.", "Branduolys slenka per vaizdą ir sudeda sandaugas."]],
      [["Pooling", "ಪೂಲಿಂಗ್", "Sujungimas"], ["Shrinks feature maps.", "ಫೀಚರ್ ನಕ್ಷೆಗಳನ್ನು ಕುಗ್ಗಿಸುತ್ತದೆ.", "Sumažina požymių žemėlapius."]],
      [["Embedding", "ಎಂಬೆಡ್ಡಿಂಗ್", "Įterpimas"], ["A learned vector per word.", "ಪ್ರತಿ ಪದಕ್ಕೆ ಕಲಿತ ವೆಕ್ಟರ್.", "Išmoktas vektorius kiekvienam žodžiui."]],
      [["Recurrent state", "ಪುನರಾವರ್ತಿತ ಸ್ಥಿತಿ", "Pasikartojanti būsena"], ["Memory updated word by word.", "ಪದ ಪದವಾಗಿ ನವೀಕರಿಸಲಾಗುವ ಸ್ಮರಣೆ.", "Atmintis, atnaujinama žodis po žodžio."]],
    ],
    tasks: [
      ["Tick the concepts you can explain without looking.", "ನೋಡದೆ ವಿವರಿಸಬಲ್ಲ ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಗುರುತಿಸಿ.", "Pažymėkite sąvokas, kurias galite paaiškinti nežiūrėdami."],
      ["Explain one concept to a friend in two sentences.", "ಒಂದು ಪರಿಕಲ್ಪನೆಯನ್ನು ಸ್ನೇಹಿತನಿಗೆ ಎರಡು ವಾಕ್ಯಗಳಲ್ಲಿ ವಿವರಿಸಿ.", "Vienos sąvokos paaiškinimas draugui dviem sakiniais."],
      ["Note the concept you find hardest and return to it.", "ನಿಮಗೆ ಅತಿ ಕಠಿಣವೆನಿಸುವ ಪರಿಕಲ್ಪನೆಯನ್ನು ಗುರುತಿಸಿ ಮತ್ತೆ ಓದಿ.", "Pažymėkite sunkiausią sąvoką ir grįžkite prie jos."],
      ["Tick at least half of the list before the defense.", "ಡಿಫೆನ್ಸ್‌ಗೆ ಮೊದಲು ಪಟ್ಟಿಯ ಕನಿಷ್ಠ ಅರ್ಧವನ್ನು ಗುರುತಿಸಿ.", "Prieš gynimą pažymėkite bent pusę sąrašo."],
    ],
    questions: [
      {
        q: ["Which statement about a Conv2D layer is correct?", "Conv2D ಪದರದ ಬಗ್ಗೆ ಯಾವ ಹೇಳಿಕೆ ಸರಿ?", "Kuris teiginys apie Conv2D sluoksnį teisingas?"],
        options: [["It reuses one set of kernel weights at every position", "ಪ್ರತಿ ಸ್ಥಾನದಲ್ಲೂ ಒಂದೇ ಕರ್ನಲ್ ತೂಕಗಳನ್ನು ಮರುಬಳಕೆ ಮಾಡುತ್ತದೆ", "Kiekvienoje padėtyje perpanaudoja tą patį branduolio svorių rinkinį"], ["It has a separate weight for each pixel and output", "ಪ್ರತಿ ಪಿಕ್ಸೆಲ್ ಮತ್ತು ಔಟ್‌ಪುಟ್‌ಗೆ ಪ್ರತ್ಯೇಕ ತೂಕ", "Kiekvienam taškui ir išvesčiai turi atskirą svorį"], ["It cannot use padding", "ಪ್ಯಾಡಿಂಗ್ ಬಳಸಲಾಗದು", "Negali naudoti užpildymo"]],
        correct: 0,
        why: ["Weight sharing is the reason the layer is small. The same kernel is applied everywhere.", "ತೂಕ ಹಂಚಿಕೆಯೇ ಪದರ ಚಿಕ್ಕದಾಗಿರಲು ಕಾರಣ. ಅದೇ ಕರ್ನಲ್ ಎಲ್ಲೆಡೆ ಅನ್ವಯವಾಗುತ್ತದೆ.", "Svorių dalijimasis – priežastis, kodėl sluoksnis mažas. Tas pats branduolys taikomas visur."],
      },
      {
        q: ["What is the main reason to use an embedding instead of one-hot?", "one-hot ಬದಲಿಗೆ ಎಂಬೆಡ್ಡಿಂಗ್ ಬಳಸಲು ಮುಖ್ಯ ಕಾರಣ ಯಾವುದು?", "Kokia pagrindinė priežastis naudoti įterpimą vietoj vieno karšto?"],
        options: [["A short learned vector per word, which keeps the order", "ಪ್ರತಿ ಪದಕ್ಕೆ ಚಿಕ್ಕ ಕಲಿತ ವೆಕ್ಟರ್; ಇದು ಕ್ರಮವನ್ನು ಉಳಿಸುತ್ತದೆ", "Trumpas išmoktas vektorius kiekvienam žodžiui, išlaikantis tvarką"], ["It needs no training", "ಇದಕ್ಕೆ ತರಬೇತಿ ಬೇಕಿಲ್ಲ", "Jam nereikia mokymo"], ["It makes the vocabulary smaller than 10 000 in all cases", "ಎಲ್ಲಾ ಸಂದರ್ಭಗಳಲ್ಲೂ ಶಬ್ದಕೋಶವನ್ನು 10 000 ಕ್ಕಿಂತ ಚಿಕ್ಕದಾಗಿಸುತ್ತದೆ", "Visais atvejais žodynas tampa mažesnis nei 10 000"]],
        correct: 0,
        why: ["The embedding is learned and keeps the sequence. The vocabulary size is not changed by it.", "ಎಂಬೆಡ್ಡಿಂಗ್ ಕಲಿಯಲಾಗುತ್ತದೆ ಮತ್ತು ಕ್ರಮ ಉಳಿಸುತ್ತದೆ. ಶಬ್ದಕೋಶದ ಗಾತ್ರವನ್ನು ಅದು ಬದಲಿಸುವುದಿಲ್ಲ.", "Įterpimas išmokstamas ir išlaiko seką. Žodyno dydžio ji nekeičia."],
      },
      {
        q: ["Which of these is a gate of a GRU?", "ಇವುಗಳಲ್ಲಿ ಯಾವುದು GRU ನ ಗೇಟ್?", "Kuris iš šių yra GRU vartai?"],
        options: [["The update gate z", "ಅಪ್‌ಡೇಟ್ ಗೇಟ್ z", "Atnaujinimo vartai z"], ["The cell gate c", "ಕೋಶ ಗೇಟ್ c", "Ląstelės vartai c"], ["The pooling gate", "ಪೂಲಿಂಗ್ ಗೇಟ್", "Sujungimo vartai"]],
        correct: 0,
        why: ["The GRU has an update gate z and a reset gate r. There is no cell state c and no pooling gate.", "GRU ಗೆ ಅಪ್‌ಡೇಟ್ ಗೇಟ್ z ಮತ್ತು ರೀಸೆಟ್ ಗೇಟ್ r ಇದೆ. ಕೋಶ ಸ್ಥಿತಿ c ಮತ್ತು ಪೂಲಿಂಗ್ ಗೇಟ್ ಇಲ್ಲ.", "GRU turi atnaujinimo vartus z ir atstatymo vartus r. Ląstelės būsenos c ir sujungimo vartų nėra."],
      },
    ],
    takeaways: [
      ["Concepts first, numbers second.", "ಮೊದಲು ಪರಿಕಲ್ಪನೆಗಳು, ನಂತರ ಸಂಖ್ಯೆಗಳು.", "Pirmiausia sąvokos, paskui skaičiai."],
      ["You can point to the cell that implements each idea.", "ಪ್ರತಿ ಕಲ್ಪನೆಯನ್ನು ಅನುಷ್ಠಾನಗೊಳಿಸುವ ಸೆಲ್ ಅನ್ನು ತೋರಿಸಬಲ್ಲಿರಿ.", "Galite parodyti langelį, kuris įgyvendina kiekvieną idėją."],
      ["Be honest about what was not checked.", "ಪರಿಶೀಲಿಸದೇ ಇರುವುದರ ಬಗ್ಗೆ ಪ್ರಾಮಾಣಿಕರಾಗಿರಿ.", "Būkite sąžiningi, ko nepatikrinote."],
    ],
    mistakes: [
      ["Learning the words without the picture behind them.", "ಚಿತ್ರವಿಲ್ಲದೆ ಪದಗಳನ್ನು ಕಲಿಯುವುದು.", "Mokytis žodžių be vaizdo už jų."],
    ],
  },

  defense: {
    goal: [
      "Answer the likely questions in short sentences, with the numbers from the recorded run.",
      "ಸಂಭಾವ್ಯ ಪ್ರಶ್ನೆಗಳಿಗೆ ಚಿಕ್ಕ ವಾಕ್ಯಗಳಲ್ಲಿ, ದಾಖಲಾದ ರನ್‌ನ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ಉತ್ತರಿಸಿ.",
      "Trumpais sakiniais atsakykite į tikėtinus klausimus, naudodami įrašyto paleidimo skaičius.",
    ],
    fit: [
      "The defense asks why a choice was made and what the numbers mean. Short, numerical answers show that you understand the lab.",
      "ಡಿಫೆನ್ಸ್ ಒಂದು ಆಯ್ಕೆ ಏಕೆ ಮಾಡಲಾಯಿತು ಮತ್ತು ಸಂಖ್ಯೆಗಳ ಅರ್ಥವೇನು ಎಂದು ಕೇಳುತ್ತದೆ. ಚಿಕ್ಕ, ಸಂಖ್ಯಾತ್ಮಕ ಉತ್ತರಗಳು ನೀವು ಲ್ಯಾಬ್ ಅರ್ಥಮಾಡಿಕೊಂಡಿದ್ದೀರಿ ಎಂದು ತೋರಿಸುತ್ತವೆ.",
      "Gynimas klausia, kodėl pasirinktas tam tikras sprendimas ir ką reiškia skaičiai. Trumpi skaitiniai atsakymai parodo, kad suprantate laboratoriją.",
    ],
    keywords: [
      [["Validation", "ಮೌಲ್ಯೀಕರಣ", "Validavimas"], ["Data used to choose, not to test.", "ಆಯ್ಕೆಗೆ ಬಳಸುವ ಡೇಟಾ, ಪರೀಕ್ಷೆಗಲ್ಲ.", "Duomenys, naudojami pasirinkti, o ne testuoti."]],
      [["Test set", "ಪರೀಕ್ಷಾ ಸೆಟ್", "Testavimo rinkinys"], ["Used once, for the final number.", "ಒಮ್ಮೆ ಮಾತ್ರ, ಅಂತಿಮ ಸಂಖ್ಯೆಗಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ.", "Naudojamas kartą galutiniam skaičiui."]],
      [["Recorded run", "ದಾಖಲಾದ ರನ್", "Įrašytas paleidimas"], ["Numbers produced by the lab script.", "ಲ್ಯಾಬ್ ಸ್ಕ್ರಿಪ್ಟ್ ಉತ್ಪಾದಿಸಿದ ಸಂಖ್ಯೆಗಳು.", "Laboratorijos skripto sugeneruoti skaičiai."]],
      [["Overfitting", "ಓವರ್‌ಫಿಟ್ಟಿಂಗ್", "Persimokymas"], ["Training accuracy far above test accuracy.", "ತರಬೇತಿ ನಿಖರತೆ ಪರೀಕ್ಷಾ ನಿಖರತೆಗಿಂತ ಬಹಳ ಮೇಲೆ.", "Mokymo tikslumas gerokai viršija testavimo tikslumą."]],
    ],
    tasks: [
      ["Read every question and answer it aloud in two sentences.", "ಪ್ರತಿ ಪ್ರಶ್ನೆ ಓದಿ ಎರಡು ವಾಕ್ಯಗಳಲ್ಲಿ ಗಟ್ಟಿಯಾಗಿ ಉತ್ತರಿಸಿ.", "Perskaitykite kiekvieną klausimą ir atsakykite garsiai dviem sakiniais."],
      ["Quote the best CNN (99.09 %) and the Lab 1 number (98.16 %).", "ಅತ್ಯುತ್ತಮ CNN (99.09 %) ಮತ್ತು ಲ್ಯಾಬ್ 1 ಸಂಖ್ಯೆ (98.16 %) ಉಲ್ಲೇಖಿಸಿ.", "Pacituokite geriausią CNN (99,09 %) ir 1 laboratorijos skaičių (98,16 %)."],
      ["Explain why the test set was not used to pick the run.", "ಪರೀಕ್ಷಾ ಸೆಟ್ ಅನ್ನು ರನ್ ಆಯ್ಕೆಗೆ ಏಕೆ ಬಳಸಲಿಲ್ಲ ಎಂದು ವಿವರಿಸಿ.", "Paaiškinkite, kodėl paleidimui parinkti nenaudotas testavimo rinkinys."],
      ["Quote the best recurrent model and the best overall text model, and their numbers.", "ಅತ್ಯುತ್ತಮ ಮರುಕಳಿಸುವ ಮಾದರಿ ಮತ್ತು ಒಟ್ಟಾರೆ ಅತ್ಯುತ್ತಮ ಪಠ್ಯ ಮಾದರಿ, ಮತ್ತು ಅವುಗಳ ಸಂಖ್ಯೆಗಳನ್ನು ಉಲ್ಲೇಖಿಸಿ.", "Pacituokite geriausią pasikartojantį modelį ir geriausią bendrą teksto modelį bei jų skaičius."],
    ],
    questions: [
      {
        q: ["Why is the test accuracy not used to choose the best run?", "ಅತ್ಯುತ್ತಮ ರನ್ ಆಯ್ಕೆಗೆ ಪರೀಕ್ಷಾ ನಿಖರತೆಯನ್ನು ಏಕೆ ಬಳಸುವುದಿಲ್ಲ?", "Kodėl geriausiam paleidimui parinkti nenaudojamas testavimo tikslumas?"],
        options: [["Choosing by the test set would let it influence the choice, so its number would look too optimistic", "ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಿಂದ ಆಯ್ಕೆ ಮಾಡಿದರೆ ಅದು ಆಯ್ಕೆಯ ಮೇಲೆ ಪ್ರಭಾವ ಬೀರುತ್ತದೆ; ಆಗ ಅದರ ಸಂಖ್ಯೆ ಅತಿ ಆಶಾವಾದಿಯಂತೆ ಕಾಣುತ್ತದೆ", "Pasirinkus pagal testo rinkinį, jis paveiktų pasirinkimą ir skaičius atrodytų per optimistiškas"], ["The test set is smaller", "ಪರೀಕ್ಷಾ ಸೆಟ್ ಚಿಕ್ಕದು", "Testavimo rinkinys mažesnis"], ["Test accuracy is always lower", "ಪರೀಕ್ಷಾ ನಿಖರತೆ ಯಾವಾಗಲೂ ಕಡಿಮೆ", "Testavimo tikslumas visada mažesnis"]],
        correct: 0,
        why: ["The test set must stay unseen until the end, so that its number is an honest estimate.", "ಪರೀಕ್ಷಾ ಸೆಟ್ ಕೊನೆಯವರೆಗೂ ಕಾಣದೇ ಉಳಿಯಬೇಕು; ಆಗ ಅದರ ಸಂಖ್ಯೆ ಪ್ರಾಮಾಣಿಕ ಅಂದಾಜು.", "Testavimo rinkinys iki pabaigos turi likti nematytas, kad jo skaičius būtų sąžiningas įvertinimas."],
      },
      {
        q: ["Which text model was best, by validation and by test?", "ಮೌಲ್ಯೀಕರಣ ಮತ್ತು ಪರೀಕ್ಷೆ ಎರಡರಲ್ಲೂ ಯಾವ ಪಠ್ಯ ಮಾದರಿ ಅತ್ಯುತ್ತಮವಾಗಿತ್ತು?", "Kuris teksto modelis buvo geriausias ir pagal validavimą, ir pagal testą?"],
        options: [["One-hot Dense with 16 units (88.3 % test)", "16 ಘಟಕಗಳ one-hot Dense (ಪರೀಕ್ಷೆ 88.3 %)", "Vienas karštas Dense su 16 vienetų (testas 88,3 %)"], ["GRU with 32 neurons", "32 ನ್ಯೂರಾನ್‌ಗಳ GRU", "GRU su 32 neuronais"], ["Conv1D with 64 filters", "64 ಫಿಲ್ಟರ್‌ಗಳ Conv1D", "Conv1D su 64 filtrais"]],
        correct: 0,
        why: ["Task 2.1 run 1 has the highest validation accuracy of all text runs (0.8896) and test 0.883.", "ಕಾರ್ಯ 2.1 ರನ್ 1 ಎಲ್ಲಾ ಪಠ್ಯ ರನ್‌ಗಳಲ್ಲಿ ಅತ್ಯಧಿಕ ಮೌಲ್ಯೀಕರಣ ನಿಖರತೆ (0.8896) ಮತ್ತು ಪರೀಕ್ಷೆ 0.883 ಹೊಂದಿದೆ.", "2.1 užduoties 1 paleidimas turi didžiausią visų teksto paleidimų validavimo tikslumą (0,8896), o testo – 0,883."],
        verify: () => TASK21[0].val_acc === 0.8896 && TASK21[0].test_acc === 0.883 && TASK21.every((r) => (r.val_acc as number) <= 0.8896) && TASK23.every((r) => (r.val_acc as number) < 0.8896),
      },
      {
        q: ["How many parameters does the one-hot Dense model with 16 units have?", "16 ಘಟಕಗಳ one-hot Dense ಮಾದರಿಯಲ್ಲಿ ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ?", "Kiek parametrų turi vieno karšto Dense modelis su 16 vienetų?"],
        options: [["160 033", "160 033", "160 033"], ["10 016", "10 016", "10 016"], ["211 233", "211 233", "211 233"]],
        correct: 0,
        why: ["10 000 × 16 + 16 for the first layer, plus 16 × 1 + 1 for the output: 160 033.", "ಮೊದಲ ಪದರ 10 000 × 16 + 16, ಔಟ್‌ಪುಟ್ 16 × 1 + 1: 160 033.", "Pirmas sluoksnis 10 000 × 16 + 16, išvestis 16 × 1 + 1: 160 033."],
        verify: () => TASK21[0].params === 10000 * 16 + 16 + 16 + 1,
      },
    ],
    takeaways: [
      ["Choose by validation, test once, and say which is which.", "ಮೌಲ್ಯೀಕರಣದಿಂದ ಆಯ್ಕೆ ಮಾಡಿ, ಪರೀಕ್ಷೆ ಒಮ್ಮೆ, ಯಾವುದು ಯಾವುದು ಎಂದು ಹೇಳಿ.", "Rinkitės pagal validavimą, testuokite vieną kartą ir pasakykite, kas kas yra."],
      ["Numbers come with a source: the recorded run on CPU.", "ಸಂಖ್ಯೆಗಳಿಗೆ ಮೂಲವಿದೆ: CPU ನಲ್ಲಿ ದಾಖಲಾದ ರನ್.", "Skaičiai turi šaltinį: CPU įrašytą paleidimą."],
      ["A short, exact answer beats a long vague one.", "ಚಿಕ್ಕ, ನಿಖರ ಉತ್ತರ ಉದ್ದ, ಅಸ್ಪಷ್ಟ ಉತ್ತರಕ್ಕಿಂತ ಉತ್ತಮ.", "Trumpas, tikslus atsakymas geresnis už ilgą, neaiškų."],
    ],
    mistakes: [
      ["Quoting a test number as if it had been used to choose.", "ಪರೀಕ್ಷಾ ಸಂಖ್ಯೆಯನ್ನು ಆಯ್ಕೆಗೆ ಬಳಸಿದಂತೆ ಉಲ್ಲೇಖಿಸುವುದು.", "Cituoti testo skaičių taip, lyg jis būtų naudotas pasirinkimui."],
    ],
  },
};
