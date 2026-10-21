import type { GuideDef } from "../../content/types";
import {
  attention, attentionOps, attentionParams, BERT_SMALL, BERT_TINY, crossEntropy, layerNorm, lrAt, maskTokens, paramTotal, recurrentOps, saturation, totalSteps,
} from "../../transformerMath";

/** Guides of attention, heads, encoder, complexity and training. */
export const guides2: Record<string, GuideDef> = {
  attention: {
    goal: [
      "Compute scaled dot-product attention for a few tokens by hand, and say why the scores are divided by √d_k.",
      "ಕೆಲವು ಟೋಕನ್‌ಗಳಿಗೆ ಸ್ಕೇಲ್ ಮಾಡಿದ ಡಾಟ್-ಪ್ರಾಡಕ್ಟ್ ಅಟೆನ್ಷನ್ ಅನ್ನು ಕೈಯಿಂದ ಲೆಕ್ಕಹಾಕಿ, ಮತ್ತು ಅಂಕಗಳನ್ನು √d_k ಯಿಂದ ಏಕೆ ಭಾಗಿಸಲಾಗುತ್ತದೆ ಎಂದು ಹೇಳಿ.",
      "Ranka apskaičiuoti mastelizuotą skaliarinės sandaugos dėmesį kelioms leksemoms ir paaiškinti, kodėl įverčiai dalijami iš √d_k.",
    ],
    fit: [
      "Attention is how “good” can see “not” in “not good”: the mechanism behind the negation results of the experiment.",
      "“not good” ನಲ್ಲಿ “good” ಗೆ “not” ಕಾಣುವುದು ಅಟೆನ್ಷನ್ ಮೂಲಕ: ಪ್ರಯೋಗದ ನಿರಾಕರಣೆ ಫಲಿತಾಂಶಗಳ ಹಿಂದಿನ ವಿಧಾನ.",
      "Dėmesys leidžia „good“ matyti „not“ sakinyje „not good“: tai mechanizmas, slypintis už eksperimento neigimo rezultatų.",
    ],
    keywords: [
      [["Query, key, value", "ಕ್ವೆರಿ, ಕೀ, ವ್ಯಾಲ್ಯೂ", "Užklausa, raktas, reikšmė"], ["Three projections of each token: what it seeks, offers and passes on.", "ಪ್ರತಿ ಟೋಕನ್‌ನ ಮೂರು ಪ್ರೊಜೆಕ್ಷನ್‌ಗಳು: ಅದು ಹುಡುಕುವುದು, ನೀಡುವುದು ಮತ್ತು ಮುಂದಕ್ಕೆ ಕಳುಹಿಸುವುದು.", "Trys kiekvienos leksemos projekcijos: ko ji ieško, ką siūlo ir ką perduoda."]],
      [["Softmax", "ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್", "Softmax"], ["Turns each row of scores into positive weights summing to 1.", "ಅಂಕಗಳ ಪ್ರತಿ ಸಾಲನ್ನು ಮೊತ್ತ 1 ಇರುವ ಧನಾತ್ಮಕ ತೂಕಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ.", "Kiekvieną įverčių eilutę paverčia teigiamais svoriais, kurių suma 1."]],
      [["Attention sink", "ಅಟೆನ್ಷನ್ ಸಿಂಕ್", "Dėmesio kaupiklis"], ["A token such as [SEP] or a comma that receives much of the attention.", "[SEP] ಅಥವಾ ಅಲ್ಪವಿರಾಮದಂತಹ ಟೋಕನ್ ಹೆಚ್ಚಿನ ಗಮನ ಪಡೆಯುವುದು.", "Leksema, tokia kaip [SEP] ar kablelis, gaunanti daug dėmesio."]],
    ],
    tasks: [
      ["Change one number in Q and watch which weight row changes.", "Q ನಲ್ಲಿ ಒಂದು ಸಂಖ್ಯೆ ಬದಲಿಸಿ ಮತ್ತು ಯಾವ ತೂಕ ಸಾಲು ಬದಲಾಗುತ್ತದೆ ಎಂದು ನೋಡಿ.", "Pakeiskite vieną Q skaičių ir stebėkite, kuri svorių eilutė pasikeičia."],
      ["Switch scaling off and compare the weights with scaling on.", "ಸ್ಕೇಲಿಂಗ್ ಆಫ್ ಮಾಡಿ ಮತ್ತು ಆನ್ ಇರುವಾಗಿನ ತೂಕಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ.", "Išjunkite mastelizavimą ir palyginkite svorius su įjungtu."],
      ["Move d_k to 512 and read the largest weight with and without scaling.", "d_k ಅನ್ನು 512 ಕ್ಕೆ ಸರಿಸಿ ಮತ್ತು ಸ್ಕೇಲಿಂಗ್ ಜೊತೆ ಮತ್ತು ಇಲ್ಲದೆ ಅತಿ ದೊಡ್ಡ ತೂಕ ಓದಿ.", "Nustatykite d_k = 512 ir perskaitykite didžiausią svorį su mastelizavimu ir be jo."],
      ["Open the paper sentence, layer 6, mean of heads, and find the token that receives most attention.", "ಪ್ರಬಂಧದ ವಾಕ್ಯ, ಪದರ 6, ಹೆಡ್‌ಗಳ ಸರಾಸರಿ ತೆರೆಯಿರಿ ಮತ್ತು ಅತಿ ಹೆಚ್ಚು ಗಮನ ಪಡೆಯುವ ಟೋಕನ್ ಕಂಡುಹಿಡಿಯಿರಿ.", "Atidarykite straipsnio sakinį, 6 sluoksnį, galvų vidurkį ir raskite leksemą, gaunančią daugiausia dėmesio."],
    ],
    questions: [
      {
        q: ["In the default toy (Q, K, V of the page, scaled), which token does t1 attend to most?", "ಪೂರ್ವನಿಯೋಜಿತ ಆಟಿಕೆಯಲ್ಲಿ (ಪುಟದ Q, K, V, ಸ್ಕೇಲ್ ಮಾಡಿದ), t1 ಯಾವ ಟೋಕನ್ ಕಡೆಗೆ ಹೆಚ್ಚು ನೋಡುತ್ತದೆ?", "Numatytajame žaislo pavyzdyje (puslapio Q, K, V, mastelizuota) į kurią leksemą t1 žiūri labiausiai?"],
        options: [["t1 (itself), about 58 %", "t1 (ತಾನೇ), ಸುಮಾರು 58 %", "t1 (pati), apie 58 %"], ["t2, about 58 %", "t2, ಸುಮಾರು 58 %", "t2, apie 58 %"], ["t3, about 58 %", "t3, ಸುಮಾರು 58 %", "t3, apie 58 %"]],
        correct: 0,
        why: ["q1·k1 = 1 is the largest score, and after dividing by √2 and the softmax it gets 57.6 %.", "q1·k1 = 1 ಅತಿ ದೊಡ್ಡ ಅಂಕ, √2 ಯಿಂದ ಭಾಗಿಸಿ ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ನಂತರ ಅದಕ್ಕೆ 57.6 % ಸಿಗುತ್ತದೆ.", "q1·k1 = 1 yra didžiausias įvertis, o padalijus iš √2 ir pritaikius softmax jis gauna 57,6 %."],
        verify: () => { const w = attention([[1, 0], [0.5, 1], [-1, 0.5]], [[1, 1], [0, 2], [-1, 0]], [[1, 0], [0, 1], [3, -1]]).weights[0]; return w.indexOf(Math.max(...w)) === 0 && Math.abs(w[0] - 0.576) < 0.001; },
      },
      {
        q: ["Why are the scores divided by √d_k?", "ಅಂಕಗಳನ್ನು √d_k ಯಿಂದ ಏಕೆ ಭಾಗಿಸಲಾಗುತ್ತದೆ?", "Kodėl įverčiai dalijami iš √d_k?"],
        options: [["To make the weights sum to one", "ತೂಕಗಳ ಮೊತ್ತ ಒಂದಾಗಲು", "Kad svorių suma būtų vienas"], ["To stop large dot products pushing the softmax into near-zero gradients", "ದೊಡ್ಡ ಡಾಟ್ ಗುಣಲಬ್ಧಗಳು ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಅನ್ನು ಬಹುತೇಕ ಶೂನ್ಯ ಗ್ರೇಡಿಯಂಟ್‌ಗೆ ತಳ್ಳುವುದನ್ನು ತಡೆಯಲು", "Kad dideli skaliarinės sandaugos įverčiai nepastumtų softmax į beveik nulinius gradientus"], ["To save memory", "ಮೆಮೊರಿ ಉಳಿಸಲು", "Kad būtų sutaupyta atminties"]],
        correct: 1,
        why: ["Dot products grow with d_k; without scaling the softmax saturates (a weight near 100 %), as the demo showed.", "ಡಾಟ್ ಗುಣಲಬ್ಧಗಳು d_k ಜೊತೆ ಬೆಳೆಯುತ್ತವೆ; ಸ್ಕೇಲಿಂಗ್ ಇಲ್ಲದೆ ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಸ್ಯಾಚುರೇಟ್ ಆಗುತ್ತದೆ (ಒಂದು ತೂಕ 100 % ಹತ್ತಿರ), ಡೆಮೊ ತೋರಿಸಿದಂತೆ.", "Skaliarinės sandaugos auga kartu su d_k; be mastelizavimo softmax prisotinamas (vienas svoris arti 100 %), kaip parodė demonstracija."],
        verify: () => { const s = saturation(256, 8, 3); return s.unscaled > 0.9 && s.scaled < 0.6; },
      },
      {
        q: ["What is the sum of every row of attention weights?", "ಅಟೆನ್ಷನ್ ತೂಕಗಳ ಪ್ರತಿ ಸಾಲಿನ ಮೊತ್ತ ಎಷ್ಟು?", "Kokia kiekvienos dėmesio svorių eilutės suma?"],
        options: [["0", "0", "0"], ["1", "1", "1"], ["The number of tokens n", "ಟೋಕನ್‌ಗಳ ಸಂಖ್ಯೆ n", "Leksemų skaičius n"]],
        correct: 1,
        why: ["Softmax makes each row positive and sum to exactly 1, so the output is a weighted average of the values.", "ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಪ್ರತಿ ಸಾಲನ್ನು ಧನಾತ್ಮಕ ಮತ್ತು ನಿಖರವಾಗಿ 1 ಮೊತ್ತವಾಗಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಔಟ್‌ಪುಟ್ ವ್ಯಾಲ್ಯೂಗಳ ತೂಕದ ಸರಾಸರಿ.", "Softmax padaro kiekvieną eilutę teigiamą ir tiksliai 1 sumos, todėl išvestis yra reikšmių svertinis vidurkis."],
        verify: () => attention([[1, 0], [0, 1]], [[1, 1], [0, 2]], [[1, 0], [0, 1]]).weights.every((r) => Math.abs(r.reduce((a, b) => a + b) - 1) < 1e-12),
      },
    ],
    takeaways: [
      ["Each token builds a query, key and value; Q·Kᵀ scores every pair and softmax turns each row into weights.", "ಪ್ರತಿ ಟೋಕನ್ ಕ್ವೆರಿ, ಕೀ ಮತ್ತು ವ್ಯಾಲ್ಯೂ ರೂಪಿಸುತ್ತದೆ; Q·Kᵀ ಪ್ರತಿ ಜೋಡಿಗೆ ಅಂಕ ನೀಡುತ್ತದೆ ಮತ್ತು ಸಾಫ್ಟ್‌ಮ್ಯಾಕ್ಸ್ ಪ್ರತಿ ಸಾಲನ್ನು ತೂಕಗಳಾಗಿಸುತ್ತದೆ.", "Kiekviena leksema sukuria užklausą, raktą ir reikšmę; Q·Kᵀ įvertina kiekvieną porą, o softmax eilutes paverčia svoriais."],
      ["The output is a weighted average of the values, so any word can read any other word directly.", "ಔಟ್‌ಪುಟ್ ವ್ಯಾಲ್ಯೂಗಳ ತೂಕದ ಸರಾಸರಿ, ಆದ್ದರಿಂದ ಯಾವುದೇ ಪದ ಇನ್ನೊಂದು ಪದವನ್ನು ನೇರವಾಗಿ ಓದಬಹುದು.", "Išvestis yra reikšmių svertinis vidurkis, todėl bet kuris žodis gali tiesiogiai skaityti bet kurį kitą."],
      ["Real attention maps show information flow but are not a complete explanation (Jain and Wallace, 2019).", "ನಿಜವಾದ ಅಟೆನ್ಷನ್ ಮ್ಯಾಪ್‌ಗಳು ಮಾಹಿತಿ ಹರಿವನ್ನು ತೋರಿಸುತ್ತವೆ ಆದರೆ ಸಂಪೂರ್ಣ ವಿವರಣೆಯಲ್ಲ (Jain ಮತ್ತು Wallace, 2019).", "Tikri dėmesio žemėlapiai rodo informacijos srautą, bet nėra pilnas paaiškinimas (Jain ir Wallace, 2019)."],
    ],
    mistakes: [
      ["Reading a bright attention cell as “the model decided because of this word”: attention is not an explanation.", "ಪ್ರಕಾಶಮಾನ ಅಟೆನ್ಷನ್ ಕೋಶವನ್ನು “ಮಾದರಿ ಈ ಪದದ ಕಾರಣ ನಿರ್ಧರಿಸಿತು” ಎಂದು ಓದುವುದು: ಅಟೆನ್ಷನ್ ವಿವರಣೆಯಲ್ಲ.", "Šviesų dėmesio langelį suprasti kaip „modelis nusprendė dėl šio žodžio“: dėmesys nėra paaiškinimas."],
      ["Mixing up the axes: rows are the words that look, columns the words looked at.", "ಅಕ್ಷಗಳನ್ನು ಗೊಂದಲಗೊಳಿಸುವುದು: ಸಾಲುಗಳು ನೋಡುವ ಪದಗಳು, ಕಂಬಸಾಲುಗಳು ನೋಡಲ್ಪಡುವ ಪದಗಳು.", "Supainioti ašis: eilutės – žodžiai, kurie žiūri, stulpeliai – žodžiai, į kuriuos žiūrima."],
    ],
  },

  heads: {
    goal: [
      "Explain how d splits into h heads of d_k = d / h, what the concatenation and W_O do, and why heads can specialise.",
      "d ಹೇಗೆ d_k = d / h ಇರುವ h ಹೆಡ್‌ಗಳಾಗಿ ವಿಭಜನೆಯಾಗುತ್ತದೆ, ಜೋಡಣೆ ಮತ್ತು W_O ಏನು ಮಾಡುತ್ತವೆ, ಮತ್ತು ಹೆಡ್‌ಗಳು ಏಕೆ ವಿಶೇಷತೆ ಪಡೆಯಬಹುದು ಎಂದು ವಿವರಿಸಿ.",
      "Paaiškinti, kaip d skaidomas į h galvų po d_k = d / h, ką daro sujungimas ir W_O ir kodėl galvos gali specializuotis.",
    ],
    fit: [
      "The three fine-tuned encoders have 2, 8 and 12 heads, always of 64 numbers; this is where that choice is explained.",
      "ಮೂರು ಫೈನ್-ಟ್ಯೂನ್ ಎನ್‌ಕೋಡರ್‌ಗಳಿಗೆ 2, 8 ಮತ್ತು 12 ಹೆಡ್‌ಗಳಿವೆ, ಯಾವಾಗಲೂ 64 ಸಂಖ್ಯೆಗಳದ್ದು; ಈ ಆಯ್ಕೆಯನ್ನು ಇಲ್ಲಿ ವಿವರಿಸಲಾಗಿದೆ.",
      "Trys suderinti kodavimo modeliai turi 2, 8 ir 12 galvų, visada po 64 skaičius; čia paaiškinamas šis pasirinkimas.",
    ],
    keywords: [
      [["Head", "ಹೆಡ್", "Galva"], ["One attention function with its own projections of size d_k.", "ತನ್ನದೇ d_k ಗಾತ್ರದ ಪ್ರೊಜೆಕ್ಷನ್‌ಗಳಿರುವ ಒಂದು ಅಟೆನ್ಷನ್ ಕಾರ್ಯ.", "Viena dėmesio funkcija su savo d_k dydžio projekcijomis."]],
      [["Concatenation", "ಜೋಡಣೆ", "Sujungimas"], ["The heads' outputs written side by side: h · d_k = d numbers.", "ಹೆಡ್‌ಗಳ ಔಟ್‌ಪುಟ್‌ಗಳನ್ನು ಅಕ್ಕಪಕ್ಕದಲ್ಲಿ ಬರೆಯುವುದು: h · d_k = d ಸಂಖ್ಯೆಗಳು.", "Galvų išvestys, surašytos viena šalia kitos: h · d_k = d skaičių."]],
      [["Output matrix W_O", "ಔಟ್‌ಪುಟ್ ಮ್ಯಾಟ್ರಿಕ್ಸ್ W_O", "Išvesties matrica W_O"], ["A d × d projection that mixes the concatenated heads.", "ಜೋಡಿಸಿದ ಹೆಡ್‌ಗಳನ್ನು ಬೆರೆಸುವ d × d ಪ್ರೊಜೆಕ್ಷನ್.", "d × d projekcija, maišanti sujungtas galvas."]],
    ],
    tasks: [
      ["Choose h = 1, 2, 4 and 8 and write d_k each time.", "h = 1, 2, 4 ಮತ್ತು 8 ಆರಿಸಿ ಮತ್ತು ಪ್ರತಿ ಬಾರಿ d_k ಬರೆಯಿರಿ.", "Pasirinkite h = 1, 2, 4 ir 8 ir kiekvieną kartą užsirašykite d_k."],
      ["Compare the weight maps of two toy heads and say whether they look alike.", "ಎರಡು ಆಟಿಕೆ ಹೆಡ್‌ಗಳ ತೂಕ ಮ್ಯಾಪ್‌ಗಳನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಅವು ಒಂದೇ ರೀತಿ ಕಾಣುತ್ತವೆಯೇ ಎಂದು ಹೇಳಿ.", "Palyginkite dviejų žaislinių galvų svorių žemėlapius ir pasakykite, ar jie panašūs."],
      ["In the real layer grid, find a head that mostly looks at [SEP] or punctuation.", "ನಿಜವಾದ ಪದರ ಗ್ರಿಡ್‌ನಲ್ಲಿ ಹೆಚ್ಚಾಗಿ [SEP] ಅಥವಾ ವಿರಾಮ ಚಿಹ್ನೆ ನೋಡುವ ಹೆಡ್ ಕಂಡುಹಿಡಿಯಿರಿ.", "Tikro sluoksnio tinklelyje raskite galvą, kuri daugiausia žiūri į [SEP] ar skyrybos ženklus."],
    ],
    questions: [
      {
        q: ["DistilBERT has d = 768 and 12 heads. How large is d_k?", "DistilBERT ಗೆ d = 768 ಮತ್ತು 12 ಹೆಡ್‌ಗಳಿವೆ. d_k ಎಷ್ಟು?", "DistilBERT turi d = 768 ir 12 galvų. Kokio dydžio d_k?"],
        options: [["12", "12", "12"], ["64", "64", "64"], ["768", "768", "768"]],
        correct: 1,
        why: ["d_k = d / h = 768 / 12 = 64, and the same 64 holds for BERT-tiny (128 / 2) and BERT-small (512 / 8).", "d_k = d / h = 768 / 12 = 64, ಅದೇ 64 BERT-tiny (128 / 2) ಮತ್ತು BERT-small (512 / 8) ಗೂ ಅನ್ವಯಿಸುತ್ತದೆ.", "d_k = d / h = 768 / 12 = 64, ir tas pats 64 tinka BERT-tiny (128 / 2) ir BERT-small (512 / 8)."],
        verify: () => 768 / 12 === 64 && 128 / 2 === 64 && 512 / 8 === 64,
      },
      {
        q: ["How does halving the number of heads (8 → 4) change BERT-small's parameter count?", "ಹೆಡ್‌ಗಳ ಸಂಖ್ಯೆಯನ್ನು ಅರ್ಧಗೊಳಿಸುವುದು (8 → 4) BERT-small ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆಯನ್ನು ಹೇಗೆ ಬದಲಿಸುತ್ತದೆ?", "Kaip galvų skaičiaus perpus sumažinimas (8 → 4) pakeičia BERT-small parametrų skaičių?"],
        options: [["It halves", "ಅರ್ಧವಾಗುತ್ತದೆ", "Sumažėja perpus"], ["It does not change", "ಬದಲಾಗುವುದಿಲ್ಲ", "Nesikeičia"], ["It doubles", "ದುಪ್ಪಟ್ಟಾಗುತ್ತದೆ", "Padvigubėja"]],
        correct: 1,
        why: ["The projections stay d × d in total; only the way the d numbers are split changes.", "ಪ್ರೊಜೆಕ್ಷನ್‌ಗಳು ಒಟ್ಟಾರೆ d × d ಆಗಿಯೇ ಇರುತ್ತವೆ; d ಸಂಖ್ಯೆಗಳನ್ನು ವಿಭಜಿಸುವ ವಿಧಾನ ಮಾತ್ರ ಬದಲಾಗುತ್ತದೆ.", "Projekcijos iš viso lieka d × d; keičiasi tik tai, kaip padalijami d skaičių."],
        verify: () => paramTotal(BERT_SMALL) === paramTotal({ ...BERT_SMALL, heads: 4 }),
      },
      {
        q: ["How wide is the concatenation of h heads of size d_k?", "d_k ಗಾತ್ರದ h ಹೆಡ್‌ಗಳ ಜೋಡಣೆ ಎಷ್ಟು ಅಗಲ?", "Kokio pločio yra h galvų po d_k sujungimas?"],
        options: [["d_k", "d_k", "d_k"], ["h + d_k", "h + d_k", "h + d_k"], ["h · d_k = d", "h · d_k = d", "h · d_k = d"]],
        correct: 2,
        why: ["The width returns to d, so the output can be added back to the input in the residual connection.", "ಅಗಲ ಮತ್ತೆ d ಗೆ ಮರಳುತ್ತದೆ, ಆದ್ದರಿಂದ ಔಟ್‌ಪುಟ್ ಅನ್ನು ರೆಸಿಡ್ಯುವಲ್ ಸಂಪರ್ಕದಲ್ಲಿ ಇನ್‌ಪುಟ್‌ಗೆ ಮರಳಿ ಸೇರಿಸಬಹುದು.", "Plotis grįžta į d, todėl išvestį galima pridėti prie įvesties likutinėje jungtyje."],
        verify: () => 12 * 64 === 768,
      },
    ],
    takeaways: [
      ["h heads run in parallel, each with d_k = d / h numbers, and their outputs are concatenated back to d.", "h ಹೆಡ್‌ಗಳು ಸಮಾನಾಂತರವಾಗಿ ನಡೆಯುತ್ತವೆ, ಪ್ರತಿಯೊಂದಕ್ಕೂ d_k = d / h ಸಂಖ್ಯೆಗಳು, ಮತ್ತು ಔಟ್‌ಪುಟ್‌ಗಳನ್ನು ಮತ್ತೆ d ಗೆ ಜೋಡಿಸಲಾಗುತ್ತದೆ.", "h galvų veikia lygiagrečiai, kiekviena su d_k = d / h skaičių, o jų išvestys sujungiamos atgal į d."],
      ["The number of heads changes how the work is split, not the parameter count.", "ಹೆಡ್‌ಗಳ ಸಂಖ್ಯೆ ಕೆಲಸ ಹೇಗೆ ಹಂಚಲಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ಬದಲಿಸುತ್ತದೆ, ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆಯನ್ನಲ್ಲ.", "Galvų skaičius keičia, kaip dalijamas darbas, o ne parametrų skaičių."],
      ["Trained heads can specialise (Clark et al., 2019), but a head's pattern is not proof of what it does.", "ತರಬೇತಿ ಪಡೆದ ಹೆಡ್‌ಗಳು ವಿಶೇಷತೆ ಪಡೆಯಬಹುದು (Clark et al., 2019), ಆದರೆ ಹೆಡ್‌ನ ಮಾದರಿ ಅದು ಏನು ಮಾಡುತ್ತದೆ ಎಂಬುದಕ್ಕೆ ಪುರಾವೆಯಲ್ಲ.", "Išmokytos galvos gali specializuotis (Clark ir kt., 2019), bet galvos raštas nėra įrodymas, ką ji daro."],
    ],
    mistakes: [
      ["Thinking more heads means more parameters or a bigger vector: d stays the same.", "ಹೆಚ್ಚು ಹೆಡ್‌ಗಳು ಎಂದರೆ ಹೆಚ್ಚು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಅಥವಾ ದೊಡ್ಡ ವೆಕ್ಟರ್ ಎಂದು ಭಾವಿಸುವುದು: d ಅದೇ ಆಗಿರುತ್ತದೆ.", "Manyti, kad daugiau galvų reiškia daugiau parametrų ar didesnį vektorių: d lieka toks pat."],
    ],
  },

  encoder: {
    goal: [
      "Follow one vector through feed-forward, residual and layer norm, and count the parameters of a BERT-style encoder.",
      "ಒಂದು ವೆಕ್ಟರ್ ಅನ್ನು ಫೀಡ್-ಫಾರ್ವರ್ಡ್, ರೆಸಿಡ್ಯುವಲ್ ಮತ್ತು ಲೇಯರ್ ನಾರ್ಮ್ ಮೂಲಕ ಅನುಸರಿಸಿ ಮತ್ತು BERT-ಶೈಲಿಯ ಎನ್‌ಕೋಡರ್‌ನ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳನ್ನು ಎಣಿಸಿ.",
      "Sekti vieną vektorių per tiesioginį sklidimą, likutinę jungtį ir sluoksnio normalizavimą bei suskaičiuoti BERT tipo kodavimo modelio parametrus.",
    ],
    fit: [
      "The counter reproduces the real sizes 4 386 178, 28 764 674 and 66 955 010 of the three fine-tuned models, so you can trust it.",
      "ಕೌಂಟರ್ ಮೂರು ಫೈನ್-ಟ್ಯೂನ್ ಮಾದರಿಗಳ ನಿಜವಾದ ಗಾತ್ರಗಳಾದ 4 386 178, 28 764 674 ಮತ್ತು 66 955 010 ಅನ್ನು ಪುನರುತ್ಪಾದಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ನೀವು ಅದನ್ನು ನಂಬಬಹುದು.",
      "Skaičiuoklė atkuria tikrus trijų suderintų modelių dydžius 4 386 178, 28 764 674 ir 66 955 010, todėl ja galima pasitikėti.",
    ],
    keywords: [
      [["Residual connection", "ರೆಸಿಡ್ಯುವಲ್ ಸಂಪರ್ಕ", "Likutinė jungtis"], ["Adds the sub-layer's input back to its output.", "ಉಪ-ಪದರದ ಇನ್‌ಪುಟ್ ಅನ್ನು ಅದರ ಔಟ್‌ಪುಟ್‌ಗೆ ಮರಳಿ ಸೇರಿಸುತ್ತದೆ.", "Prideda posluoksnio įvestį atgal prie jo išvesties."]],
      [["Layer normalisation", "ಲೇಯರ್ ನಾರ್ಮಲೈಸೇಶನ್", "Sluoksnio normalizavimas"], ["Rescales each token vector to mean 0 and variance 1, then γ and β.", "ಪ್ರತಿ ಟೋಕನ್ ವೆಕ್ಟರ್ ಅನ್ನು ಸರಾಸರಿ 0 ಮತ್ತು ವ್ಯತ್ಯಾಸ 1 ಗೆ ಮರುಮಾಪನ ಮಾಡಿ, ನಂತರ γ ಮತ್ತು β.", "Perskalėja kiekvienos leksemos vektorių iki vidurkio 0 ir dispersijos 1, tada γ ir β."]],
      [["GELU", "GELU", "GELU"], ["Smooth activation x·Φ(x) used in BERT instead of ReLU.", "ReLU ಬದಲು BERT ನಲ್ಲಿ ಬಳಸುವ ನಯವಾದ ಆಕ್ಟಿವೇಶನ್ x·Φ(x).", "Glotni aktyvacija x·Φ(x), naudojama BERT vietoj ReLU."]],
    ],
    tasks: [
      ["Switch the residual connection off in the walk-through and see how the numbers change.", "ವಾಕ್-ಥ್ರೂನಲ್ಲಿ ರೆಸಿಡ್ಯುವಲ್ ಸಂಪರ್ಕವನ್ನು ಆಫ್ ಮಾಡಿ ಮತ್ತು ಸಂಖ್ಯೆಗಳು ಹೇಗೆ ಬದಲಾಗುತ್ತವೆ ಎಂದು ನೋಡಿ.", "Žingsnis po žingsnio pavyzdyje išjunkite likutinę jungtį ir stebėkite, kaip keičiasi skaičiai."],
      ["Find where GELU and its tanh approximation differ most.", "GELU ಮತ್ತು ಅದರ tanh ಅಂದಾಜು ಹೆಚ್ಚು ಭಿನ್ನವಾಗುವ ಸ್ಥಳ ಕಂಡುಹಿಡಿಯಿರಿ.", "Raskite, kur GELU ir jo tanh aproksimacija skiriasi labiausiai."],
      ["Select BERT-tiny, BERT-small and DistilBERT and check the three totals.", "BERT-tiny, BERT-small ಮತ್ತು DistilBERT ಆರಿಸಿ ಮತ್ತು ಮೂರು ಒಟ್ಟು ಮೊತ್ತಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.", "Pasirinkite BERT-tiny, BERT-small ir DistilBERT ir patikrinkite tris sumas."],
      ["Untick the token-type embedding for BERT-small and say how many parameters disappear.", "BERT-small ಗೆ ಟೋಕನ್-ಪ್ರಕಾರ ಎಂಬೆಡ್ಡಿಂಗ್ ಟಿಕ್ ತೆಗೆಯಿರಿ ಮತ್ತು ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು ಮಾಯವಾಗುತ್ತವೆ ಎಂದು ಹೇಳಿ.", "Nuimkite leksemos tipo įterpinio varnelę BERT-small ir pasakykite, kiek parametrų išnyksta."],
    ],
    questions: [
      {
        q: ["What is the total parameter count of BERT-tiny with a 2-class head (V = 30 522, d = 128, L = 2, ff = 512)?", "2-ವರ್ಗ ಹೆಡ್ ಇರುವ BERT-tiny ಯ (V = 30 522, d = 128, L = 2, ff = 512) ಒಟ್ಟು ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆ ಎಷ್ಟು?", "Kiek iš viso parametrų turi BERT-tiny su 2 klasių galva (V = 30 522, d = 128, L = 2, ff = 512)?"],
        options: [["4 386 178", "4 386 178", "4 386 178"], ["3 906 816", "3 906 816", "3 906 816"], ["4 000 000", "4 000 000", "4 000 000"]],
        correct: 0,
        why: ["Embeddings 3 972 864 + two layers 396 544 + pooler 16 512 + classifier 258 = 4 386 178, the number in the repository's table.", "ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳು 3 972 864 + ಎರಡು ಪದರಗಳು 396 544 + ಪೂಲರ್ 16 512 + ವರ್ಗೀಕಾರಕ 258 = 4 386 178, ರೆಪೊಸಿಟರಿಯ ಕೋಷ್ಟಕದ ಸಂಖ್ಯೆ.", "Įterpiniai 3 972 864 + du sluoksniai 396 544 + „pooler“ 16 512 + klasifikatorius 258 = 4 386 178, skaičius iš saugyklos lentelės."],
        verify: () => paramTotal(BERT_TINY) === 4386178,
      },
      {
        q: ["How many parameters do the four attention projections (with biases) of one layer have for d = 512?", "d = 512 ಗೆ ಒಂದು ಪದರದ ನಾಲ್ಕು ಅಟೆನ್ಷನ್ ಪ್ರೊಜೆಕ್ಷನ್‌ಗಳಿಗೆ (ಬಯಾಸ್ ಸಹಿತ) ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ?", "Kiek parametrų turi vieno sluoksnio keturios dėmesio projekcijos (su poslinkiais), kai d = 512?"],
        options: [["262 144", "262 144", "262 144"], ["1 048 576", "1 048 576", "1 048 576"], ["1 050 624", "1 050 624", "1 050 624"]],
        correct: 2,
        why: ["4 × (512 × 512 + 512) = 1 050 624: four weight matrices and four biases.", "4 × (512 × 512 + 512) = 1 050 624: ನಾಲ್ಕು ತೂಕ ಮ್ಯಾಟ್ರಿಕ್ಸ್‌ಗಳು ಮತ್ತು ನಾಲ್ಕು ಬಯಾಸ್‌ಗಳು.", "4 × (512 × 512 + 512) = 1 050 624: keturios svorių matricos ir keturi poslinkiai."],
        verify: () => attentionParams(512) === 1050624,
      },
      {
        q: ["What do the numbers of a vector have after layer norm with γ = 1 and β = 0?", "γ = 1 ಮತ್ತು β = 0 ಯೊಂದಿಗೆ ಲೇಯರ್ ನಾರ್ಮ್ ನಂತರ ವೆಕ್ಟರ್‌ನ ಸಂಖ್ಯೆಗಳಿಗೆ ಏನಿರುತ್ತದೆ?", "Ką turi vektoriaus skaičiai po sluoksnio normalizavimo su γ = 1 ir β = 0?"],
        options: [["Mean 0 and variance about 1", "ಸರಾಸರಿ 0 ಮತ್ತು ವ್ಯತ್ಯಾಸ ಸುಮಾರು 1", "Vidurkį 0 ir dispersiją apie 1"], ["Sum 1", "ಮೊತ್ತ 1", "Sumą 1"], ["All values positive", "ಎಲ್ಲ ಮೌಲ್ಯಗಳು ಧನಾತ್ಮಕ", "Visas teigiamas reikšmes"]],
        correct: 0,
        why: ["Layer norm subtracts the mean and divides by the standard deviation of the vector.", "ಲೇಯರ್ ನಾರ್ಮ್ ಸರಾಸರಿಯನ್ನು ಕಳೆದು ವೆಕ್ಟರ್‌ನ ಪ್ರಮಾಣಿತ ವಿಚಲನೆಯಿಂದ ಭಾಗಿಸುತ್ತದೆ.", "Sluoksnio normalizavimas atima vidurkį ir dalija iš vektoriaus standartinio nuokrypio."],
        verify: () => { const y = layerNorm([3, -1, 7, 2, 9]); const m = y.reduce((a, b) => a + b) / 5; const v = y.reduce((a, b) => a + (b - m) ** 2, 0) / 5; return Math.abs(m) < 1e-9 && Math.abs(v - 1) < 1e-3; },
      },
    ],
    takeaways: [
      ["An encoder layer is attention, then feed-forward, each wrapped in a residual connection and layer norm.", "ಎನ್‌ಕೋಡರ್ ಪದರ ಎಂದರೆ ಅಟೆನ್ಷನ್, ನಂತರ ಫೀಡ್-ಫಾರ್ವರ್ಡ್, ಪ್ರತಿಯೊಂದೂ ರೆಸಿಡ್ಯುವಲ್ ಸಂಪರ್ಕ ಮತ್ತು ಲೇಯರ್ ನಾರ್ಮ್‌ನಲ್ಲಿ ಸುತ್ತಿದ್ದು.", "Kodavimo sluoksnis – tai dėmesys, tada tiesioginis sklidimas, kiekvienas apgaubtas likutine junge ir sluoksnio normalizavimu."],
      ["Parameters: embeddings V·d + P·d, then per layer 4(d²+d) + 2·d·ff + ff + d + 4d, then the head.", "ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು: ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳು V·d + P·d, ನಂತರ ಪ್ರತಿ ಪದರಕ್ಕೆ 4(d²+d) + 2·d·ff + ff + d + 4d, ನಂತರ ಹೆಡ್.", "Parametrai: įterpiniai V·d + P·d, tada kiekvienam sluoksniui 4(d²+d) + 2·d·ff + ff + d + 4d, tada galva."],
      ["GELU and its tanh approximation differ by less than 0.001 everywhere.", "GELU ಮತ್ತು ಅದರ tanh ಅಂದಾಜು ಎಲ್ಲೆಡೆ 0.001 ಕ್ಕಿಂತ ಕಡಿಮೆ ಭಿನ್ನ.", "GELU ir jo tanh aproksimacija visur skiriasi mažiau nei 0,001."],
    ],
    mistakes: [
      ["Forgetting the biases and layer norms: they are small, but without them the totals do not match the real models.", "ಬಯಾಸ್ ಮತ್ತು ಲೇಯರ್ ನಾರ್ಮ್‌ಗಳನ್ನು ಮರೆಯುವುದು: ಅವು ಚಿಕ್ಕವು, ಆದರೆ ಅವಿಲ್ಲದೆ ಒಟ್ಟು ಮೊತ್ತಗಳು ನಿಜವಾದ ಮಾದರಿಗಳಿಗೆ ಹೊಂದುವುದಿಲ್ಲ.", "Pamiršti poslinkius ir sluoksnio normalizavimus: jie maži, bet be jų sumos neatitinka tikrų modelių."],
      ["Counting DistilBERT with a token-type embedding: it has none.", "DistilBERT ಅನ್ನು ಟೋಕನ್-ಪ್ರಕಾರ ಎಂಬೆಡ್ಡಿಂಗ್‌ನೊಂದಿಗೆ ಎಣಿಸುವುದು: ಅದಕ್ಕೆ ಅದು ಇಲ್ಲ.", "Skaičiuoti DistilBERT su leksemos tipo įterpiniu: jo nėra."],
    ],
  },

  complexity: {
    goal: [
      "Compare O(n²·d) with O(n·d²), find the crossover n = d and say what sequential steps mean.",
      "O(n²·d) ಅನ್ನು O(n·d²) ಯೊಂದಿಗೆ ಹೋಲಿಸಿ, ಛೇದನ n = d ಕಂಡುಹಿಡಿಯಿರಿ ಮತ್ತು ಅನುಕ್ರಮ ಹಂತಗಳ ಅರ್ಥ ಹೇಳಿ.",
      "Palyginti O(n²·d) su O(n·d²), rasti susikirtimą n = d ir paaiškinti, ką reiškia nuoseklūs žingsniai.",
    ],
    fit: [
      "Sentences are short (the paper caps them at 64 tokens), which is the regime where attention is cheap.",
      "ವಾಕ್ಯಗಳು ಚಿಕ್ಕವು (ಪ್ರಬಂಧ ಅವನ್ನು 64 ಟೋಕನ್‌ಗಳಿಗೆ ಸೀಮಿತಗೊಳಿಸುತ್ತದೆ), ಇಲ್ಲಿ ಅಟೆನ್ಷನ್ ಅಗ್ಗ.",
      "Sakiniai trumpi (straipsnis riboja juos iki 64 leksemų), o tokiu režimu dėmesys pigus.",
    ],
    keywords: [
      [["O(n²·d)", "O(n²·d)", "O(n²·d)"], ["Cost of one self-attention layer: every pair of tokens, d numbers each.", "ಒಂದು ಸ್ವ-ಅಟೆನ್ಷನ್ ಪದರದ ವೆಚ್ಚ: ಪ್ರತಿ ಟೋಕನ್ ಜೋಡಿ, ತಲಾ d ಸಂಖ್ಯೆಗಳು.", "Vieno savęs stebinčio dėmesio sluoksnio kaina: kiekviena leksemų pora, po d skaičių."]],
      [["O(n·d²)", "O(n·d²)", "O(n·d²)"], ["Cost of one recurrent layer: n steps, a d × d matrix each.", "ಒಂದು ರಿಕರೆಂಟ್ ಪದರದ ವೆಚ್ಚ: n ಹಂತಗಳು, ತಲಾ d × d ಮ್ಯಾಟ್ರಿಕ್ಸ್.", "Vieno rekurentinio sluoksnio kaina: n žingsnių, kiekvienas su d × d matrica."]],
      [["Sequential steps", "ಅನುಕ್ರಮ ಹಂತಗಳು", "Nuoseklūs žingsniai"], ["Steps that must wait for each other: 1 for attention, n for recurrence.", "ಒಂದಕ್ಕೊಂದು ಕಾಯಬೇಕಾದ ಹಂತಗಳು: ಅಟೆನ್ಷನ್‌ಗೆ 1, ರಿಕರೆನ್ಸ್‌ಗೆ n.", "Žingsniai, kurie turi laukti vienas kito: dėmesiui 1, rekurencijai n."]],
    ],
    tasks: [
      ["Set d = 768 and n = 64 and read how many times fewer operations attention needs.", "d = 768 ಮತ್ತು n = 64 ಹೊಂದಿಸಿ ಮತ್ತು ಅಟೆನ್ಷನ್‌ಗೆ ಎಷ್ಟು ಪಟ್ಟು ಕಡಿಮೆ ಕಾರ್ಯಾಚರಣೆಗಳು ಬೇಕು ಎಂದು ಓದಿ.", "Nustatykite d = 768 ir n = 64 ir perskaitykite, kiek kartų mažiau operacijų reikia dėmesiui."],
      ["Move n past d and watch which curve becomes cheaper.", "n ಅನ್ನು d ಗಿಂತ ಮುಂದೆ ಸರಿಸಿ ಮತ್ತು ಯಾವ ವಕ್ರರೇಖೆ ಅಗ್ಗವಾಗುತ್ತದೆ ಎಂದು ನೋಡಿ.", "Perkelkite n už d ir stebėkite, kuri kreivė tampa pigesnė."],
      ["Drag the time-step slider and count the steps the recurrent network needs.", "ಸಮಯ-ಹಂತ ಸ್ಲೈಡರ್ ಎಳೆಯಿರಿ ಮತ್ತು ರಿಕರೆಂಟ್ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಬೇಕಾದ ಹಂತಗಳನ್ನು ಎಣಿಸಿ.", "Patraukite laiko žingsnio slankiklį ir suskaičiuokite žingsnius, kurių reikia rekurentiniam tinklui."],
    ],
    questions: [
      {
        q: ["For n = 64 and d = 768, how many times more operations does a recurrent layer need than attention?", "n = 64 ಮತ್ತು d = 768 ಗೆ ರಿಕರೆಂಟ್ ಪದರಕ್ಕೆ ಅಟೆನ್ಷನ್‌ಗಿಂತ ಎಷ್ಟು ಪಟ್ಟು ಹೆಚ್ಚು ಕಾರ್ಯಾಚರಣೆಗಳು ಬೇಕು?", "Kai n = 64 ir d = 768, kiek kartų daugiau operacijų reikia rekurentiniam sluoksniui nei dėmesiui?"],
        options: [["12", "12", "12"], ["64", "64", "64"], ["768", "768", "768"]],
        correct: 0,
        why: ["The ratio of n·d² to n²·d is d / n = 768 / 64 = 12.", "n·d² ಮತ್ತು n²·d ಅನುಪಾತ d / n = 768 / 64 = 12.", "n·d² ir n²·d santykis yra d / n = 768 / 64 = 12."],
        verify: () => recurrentOps(64, 768) / attentionOps(64, 768) === 12,
      },
      {
        q: ["At which sequence length do the two costs become equal?", "ಯಾವ ಅನುಕ್ರಮ ಉದ್ದದಲ್ಲಿ ಎರಡು ವೆಚ್ಚಗಳು ಸಮವಾಗುತ್ತವೆ?", "Kokiame sekos ilgyje abi kainos susilygina?"],
        options: [["n = 1", "n = 1", "n = 1"], ["n = d", "n = d", "n = d"], ["n = d²", "n = d²", "n = d²"]],
        correct: 1,
        why: ["n²·d = n·d² exactly when n = d.", "n²·d = n·d² ನಿಖರವಾಗಿ n = d ಆದಾಗ.", "n²·d = n·d² tiksliai tada, kai n = d."],
        verify: () => [64, 128, 768].every((d) => attentionOps(d, d) === recurrentOps(d, d)),
      },
      {
        q: ["How many sequential steps does self-attention need for a sentence of n tokens?", "n ಟೋಕನ್‌ಗಳ ವಾಕ್ಯಕ್ಕೆ ಸ್ವ-ಅಟೆನ್ಷನ್‌ಗೆ ಎಷ್ಟು ಅನುಕ್ರಮ ಹಂತಗಳು ಬೇಕು?", "Kiek nuoseklių žingsnių reikia savęs stebinčiam dėmesiui n leksemų sakiniui?"],
        options: [["n", "n", "n"], ["1", "1", "1"], ["n²", "n²", "n²"]],
        correct: 1,
        why: ["All positions are computed in parallel, so the sequential depth is 1, against n for a recurrent layer.", "ಎಲ್ಲ ಸ್ಥಾನಗಳು ಸಮಾನಾಂತರವಾಗಿ ಲೆಕ್ಕಹಾಕಲ್ಪಡುತ್ತವೆ, ಆದ್ದರಿಂದ ಅನುಕ್ರಮ ಆಳ 1, ರಿಕರೆಂಟ್ ಪದರಕ್ಕೆ n.", "Visos pozicijos skaičiuojamos lygiagrečiai, todėl nuoseklus gylis yra 1, o rekurentiniam sluoksniui – n."],
      },
    ],
    takeaways: [
      ["Attention costs n²·d, recurrence n·d²: attention is cheaper whenever n < d, which holds for sentences.", "ಅಟೆನ್ಷನ್‌ಗೆ n²·d, ರಿಕರೆನ್ಸ್‌ಗೆ n·d²: n < d ಆದಾಗೆಲ್ಲ ಅಟೆನ್ಷನ್ ಅಗ್ಗ, ಇದು ವಾಕ್ಯಗಳಿಗೆ ಸತ್ಯ.", "Dėmesys kainuoja n²·d, rekurencija – n·d²: dėmesys pigesnis, kai n < d, o sakiniams taip ir yra."],
      ["Attention needs 1 sequential step, recurrence n: that is what makes Transformers parallel.", "ಅಟೆನ್ಷನ್‌ಗೆ 1 ಅನುಕ್ರಮ ಹಂತ, ರಿಕರೆನ್ಸ್‌ಗೆ n: ಇದೇ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳನ್ನು ಸಮಾನಾಂತರವಾಗಿಸುತ್ತದೆ.", "Dėmesiui reikia 1 nuoseklaus žingsnio, rekurencijai – n: tai daro transformerius lygiagrečius."],
      ["Big-O is not latency: the measured CPU times depend mostly on model size.", "big-O ವಿಳಂಬವಲ್ಲ: ಅಳೆದ CPU ಸಮಯಗಳು ಮುಖ್ಯವಾಗಿ ಮಾದರಿ ಗಾತ್ರದ ಮೇಲೆ ಅವಲಂಬಿತ.", "Didysis O nėra vėlinimas: išmatuoti CPU laikai daugiausia priklauso nuo modelio dydžio."],
    ],
    mistakes: [
      ["Concluding that Transformers are always faster than recurrent networks: for very long inputs the n² term dominates.", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಯಾವಾಗಲೂ ರಿಕರೆಂಟ್ ನೆಟ್‌ವರ್ಕ್‌ಗಳಿಗಿಂತ ವೇಗ ಎಂದು ತೀರ್ಮಾನಿಸುವುದು: ಬಹಳ ಉದ್ದದ ಇನ್‌ಪುಟ್‌ಗಳಿಗೆ n² ಪದ ಪ್ರಾಬಲ್ಯ ಪಡೆಯುತ್ತದೆ.", "Daryti išvadą, kad transformeriai visada greitesni už rekurentinius tinklus: labai ilgoms įvestims dominuoja n² narys."],
    ],
  },

  training: {
    goal: [
      "Describe masked language modelling, the [CLS] head with cross-entropy, AdamW and the warm-up and decay schedule with the paper's numbers.",
      "ಮಾಸ್ಕ್ಡ್ ಭಾಷಾ ಮಾದರಿ, ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿಯೊಂದಿಗೆ [CLS] ಹೆಡ್, AdamW ಮತ್ತು ವಾರ್ಮ್-ಅಪ್ ಹಾಗೂ ಕ್ಷಯ ವೇಳಾಪಟ್ಟಿಯನ್ನು ಪ್ರಬಂಧದ ಸಂಖ್ಯೆಗಳೊಂದಿಗೆ ವಿವರಿಸಿ.",
      "Aprašyti maskuotą kalbos modeliavimą, [CLS] galvą su kryžmine entropija, AdamW ir apšilimo bei mažinimo tvarkaraštį su straipsnio skaičiais.",
    ],
    fit: [
      "The experiment fine-tunes three encoders with exactly this recipe, so these are the settings behind every Transformer result.",
      "ಪ್ರಯೋಗ ಮೂರು ಎನ್‌ಕೋಡರ್‌ಗಳನ್ನು ಇದೇ ವಿಧಾನದಲ್ಲಿ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡುತ್ತದೆ, ಆದ್ದರಿಂದ ಪ್ರತಿ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಫಲಿತಾಂಶದ ಹಿಂದೆ ಇರುವುದು ಈ ಸೆಟ್ಟಿಂಗ್‌ಗಳು.",
      "Eksperimentas derina tris kodavimo modelius būtent pagal šį receptą, todėl tai – nustatymai, slypintys už kiekvieno transformerio rezultato.",
    ],
    keywords: [
      [["Masked LM", "ಮಾಸ್ಕ್ಡ್ LM", "Maskuotas KM"], ["Hide 15 % of the tokens and predict them from both sides.", "15 % ಟೋಕನ್‌ಗಳನ್ನು ಮರೆಮಾಡಿ ಎರಡೂ ಬದಿಗಳಿಂದ ಊಹಿಸಿ.", "Paslėpti 15 % leksemų ir nuspėti jas iš abiejų pusių."]],
      [["AdamW", "AdamW", "AdamW"], ["Adam with decoupled weight decay λ = 0.01.", "ಬೇರ್ಪಡಿಸಿದ ತೂಕ ಕ್ಷಯ λ = 0.01 ಇರುವ Adam.", "Adam su atsietu svorių mažinimu λ = 0,01."]],
      [["Warm-up", "ವಾರ್ಮ್-ಅಪ್", "Apšilimas"], ["Learning rate rises from 0 to the peak over the first 10 % of the steps.", "ಕಲಿಕಾ ದರ ಮೊದಲ 10 % ಹಂತಗಳಲ್ಲಿ 0 ಯಿಂದ ಗರಿಷ್ಠಕ್ಕೆ ಏರುತ್ತದೆ.", "Mokymosi greitis per pirmuosius 10 % žingsnių kyla nuo 0 iki viršūnės."]],
    ],
    tasks: [
      ["Draw new masks with the selection rate at 15 % and count the masked, random and kept tokens.", "ಆಯ್ಕೆ ದರ 15 % ನೊಂದಿಗೆ ಹೊಸ ಮಾಸ್ಕ್‌ಗಳನ್ನು ಎಳೆಯಿರಿ ಮತ್ತು ಮಾಸ್ಕ್, ಯಾದೃಚ್ಛಿಕ ಮತ್ತು ಉಳಿಸಿದ ಟೋಕನ್‌ಗಳನ್ನು ಎಣಿಸಿ.", "Ištraukite naujas kaukes su 15 % parinkimu ir suskaičiuokite užmaskuotas, atsitiktines ir paliktas leksemas."],
      ["Make the classifier confidently wrong and read the loss.", "ವರ್ಗೀಕಾರಕವನ್ನು ವಿಶ್ವಾಸದಿಂದ ತಪ್ಪಾಗುವಂತೆ ಮಾಡಿ ಮತ್ತು ನಷ್ಟ ಓದಿ.", "Priverskite klasifikatorių užtikrintai klysti ir perskaitykite nuostolį."],
      ["Change the gradients in the AdamW table and see how θ moves.", "AdamW ಕೋಷ್ಟಕದಲ್ಲಿ ಗ್ರೇಡಿಯಂಟ್‌ಗಳನ್ನು ಬದಲಿಸಿ ಮತ್ತು θ ಹೇಗೆ ಚಲಿಸುತ್ತದೆ ಎಂದು ನೋಡಿ.", "Pakeiskite gradientus AdamW lentelėje ir stebėkite, kaip juda θ."],
      ["Select DistilBERT in the schedule and find the step where the learning rate peaks.", "ವೇಳಾಪಟ್ಟಿಯಲ್ಲಿ DistilBERT ಆರಿಸಿ ಮತ್ತು ಕಲಿಕಾ ದರ ಗರಿಷ್ಠವಾಗುವ ಹಂತ ಕಂಡುಹಿಡಿಯಿರಿ.", "Tvarkaraštyje pasirinkite DistilBERT ir raskite žingsnį, kuriame mokymosi greitis pasiekia viršūnę."],
    ],
    questions: [
      {
        q: ["DistilBERT is fine-tuned on 8 000 examples, batch 32, 2 epochs, warm-up 10 %. At which step does the learning rate peak?", "DistilBERT 8 000 ಉದಾಹರಣೆಗಳ ಮೇಲೆ, ಬ್ಯಾಚ್ 32, 2 ಎಪೋಕ್, ವಾರ್ಮ್-ಅಪ್ 10 % ನಲ್ಲಿ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಲಾಗಿದೆ. ಕಲಿಕಾ ದರ ಯಾವ ಹಂತದಲ್ಲಿ ಗರಿಷ್ಠವಾಗುತ್ತದೆ?", "DistilBERT derinamas su 8 000 pavyzdžių, paketas 32, 2 epochos, apšilimas 10 %. Kuriame žingsnyje mokymosi greitis pasiekia viršūnę?"],
        options: [["Step 25", "ಹಂತ 25", "25 žingsnyje"], ["Step 50", "ಹಂತ 50", "50 žingsnyje"], ["Step 250", "ಹಂತ 250", "250 žingsnyje"]],
        correct: 1,
        why: ["8 000 / 32 = 250 steps per epoch, 500 in total; 10 % of 500 is 50.", "8 000 / 32 = ಪ್ರತಿ ಎಪೋಕ್‌ಗೆ 250 ಹಂತಗಳು, ಒಟ್ಟು 500; 500 ರ 10 % 50.", "8 000 / 32 = 250 žingsnių per epochą, iš viso 500; 10 % nuo 500 yra 50."],
        verify: () => { const t = totalSteps(8000, 32, 2); const sched = Array.from({ length: t + 1 }, (_, i) => lrAt(i, t, 5e-5)); return t === 500 && sched.indexOf(Math.max(...sched)) === 50; },
      },
      {
        q: ["If the model gives the true class probability 0.5, what is the cross-entropy loss?", "ಮಾದರಿ ನಿಜ ವರ್ಗಕ್ಕೆ ಸಂಭವನೀಯತೆ 0.5 ನೀಡಿದರೆ ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ ನಷ್ಟ ಎಷ್ಟು?", "Jei modelis tikrajai klasei duoda tikimybę 0,5, koks kryžminės entropijos nuostolis?"],
        options: [["0.5", "0.5", "0,5"], ["0.693", "0.693", "0,693"], ["1.0", "1.0", "1,0"]],
        correct: 1,
        why: ["−ln 0.5 = ln 2 ≈ 0.693, the loss of random guessing between two classes.", "−ln 0.5 = ln 2 ≈ 0.693, ಎರಡು ವರ್ಗಗಳ ನಡುವೆ ಯಾದೃಚ್ಛಿಕ ಊಹೆಯ ನಷ್ಟ.", "−ln 0,5 = ln 2 ≈ 0,693, atsitiktinio spėjimo tarp dviejų klasių nuostolis."],
        verify: () => Math.abs(crossEntropy([0.5, 0.5], 0) - Math.LN2) < 1e-12,
      },
      {
        q: ["Out of 2 000 ordinary tokens, about how many does masking select at a rate of 15 %?", "2 000 ಸಾಮಾನ್ಯ ಟೋಕನ್‌ಗಳಲ್ಲಿ 15 % ದರದಲ್ಲಿ ಮಾಸ್ಕಿಂಗ್ ಸುಮಾರು ಎಷ್ಟನ್ನು ಆರಿಸುತ್ತದೆ?", "Iš 2 000 paprastų leksemų, maždaug kiek parenka maskavimas esant 15 % daliai?"],
        options: [["About 30", "ಸುಮಾರು 30", "Apie 30"], ["About 300", "ಸುಮಾರು 300", "Apie 300"], ["About 1 500", "ಸುಮಾರು 1 500", "Apie 1 500"]],
        correct: 1,
        why: ["15 % of 2 000 is 300, and 80 % of those (about 240) become [MASK].", "2 000 ರ 15 % = 300, ಮತ್ತು ಅವುಗಳಲ್ಲಿ 80 % (ಸುಮಾರು 240) [MASK] ಆಗುತ್ತವೆ.", "15 % nuo 2 000 yra 300, o 80 % jų (apie 240) tampa [MASK]."],
        verify: () => { const toks = ["[CLS]", ...Array.from({ length: 2000 }, (_, i) => `w${i}`), "[SEP]"]; const k = maskTokens(toks, ["x"], 9).selected.length; return k > 260 && k < 340; },
      },
    ],
    takeaways: [
      ["Pre-training (masked language modelling) is done by others; the project only fine-tunes with a [CLS] head and cross-entropy.", "ಪೂರ್ವ-ತರಬೇತಿಯನ್ನು (ಮಾಸ್ಕ್ಡ್ ಭಾಷಾ ಮಾದರಿ) ಇತರರು ಮಾಡಿದ್ದಾರೆ; ಯೋಜನೆ [CLS] ಹೆಡ್ ಮತ್ತು ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿಯೊಂದಿಗೆ ಫೈನ್-ಟ್ಯೂನ್ ಮಾತ್ರ ಮಾಡುತ್ತದೆ.", "Išankstinį mokymą (maskuotą kalbos modeliavimą) atliko kiti; projektas tik derina su [CLS] galva ir kryžmine entropija."],
      ["AdamW with weight decay 0.01, gradient clipping at 1.0 and a 10 % linear warm-up then linear decay.", "ತೂಕ ಕ್ಷಯ 0.01, 1.0 ಗೆ ಗ್ರೇಡಿಯಂಟ್ ಕ್ಲಿಪ್ಪಿಂಗ್ ಮತ್ತು 10 % ರೇಖೀಯ ವಾರ್ಮ್-ಅಪ್, ನಂತರ ರೇಖೀಯ ಕ್ಷಯದೊಂದಿಗೆ AdamW.", "AdamW su svorių mažinimu 0,01, gradiento apkarpymu iki 1,0 ir 10 % tiesiniu apšilimu, o po to tiesiniu mažinimu."],
      ["Peak learning rates: 2·10⁻⁴ (tiny), 1·10⁻⁴ (small), 5·10⁻⁵ (DistilBERT); batch 32, maximum length 64.", "ಗರಿಷ್ಠ ಕಲಿಕಾ ದರಗಳು: 2·10⁻⁴ (tiny), 1·10⁻⁴ (small), 5·10⁻⁵ (DistilBERT); ಬ್ಯಾಚ್ 32, ಗರಿಷ್ಠ ಉದ್ದ 64.", "Didžiausi mokymosi greičiai: 2·10⁻⁴ (tiny), 1·10⁻⁴ (small), 5·10⁻⁵ (DistilBERT); paketas 32, didžiausias ilgis 64."],
    ],
    mistakes: [
      ["Assuming the 80 / 10 / 10 masking split comes from the project paper: it is from the BERT paper.", "80 / 10 / 10 ಮಾಸ್ಕಿಂಗ್ ವಿಭಜನೆ ಯೋಜನೆಯ ಪ್ರಬಂಧದಿಂದ ಬಂದಿದೆ ಎಂದು ಭಾವಿಸುವುದು: ಅದು BERT ಪ್ರಬಂಧದ್ದು.", "Manyti, kad 80 / 10 / 10 maskavimo pasiskirstymas yra iš projekto straipsnio: jis iš BERT straipsnio."],
      ["Starting at the peak learning rate: without warm-up the first updates can damage the pre-trained weights.", "ಗರಿಷ್ಠ ಕಲಿಕಾ ದರದಲ್ಲೇ ಪ್ರಾರಂಭಿಸುವುದು: ವಾರ್ಮ್-ಅಪ್ ಇಲ್ಲದೆ ಮೊದಲ ನವೀಕರಣಗಳು ಪೂರ್ವ-ತರಬೇತಿ ತೂಕಗಳನ್ನು ಹಾಳುಮಾಡಬಹುದು.", "Pradėti nuo didžiausio mokymosi greičio: be apšilimo pirmieji atnaujinimai gali pakenkti iš anksto išmokytiems svoriams."],
    ],
  },
};

