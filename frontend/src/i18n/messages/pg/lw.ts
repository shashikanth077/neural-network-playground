import type { Rows } from "./types";

/** Interactive widgets inside the Learning Center. */
export const lw: Rows = [
  // ---- activation explorer
  ["pg.lw.act.group", "Activation function", "ಆಕ್ಟಿವೇಶನ್ ಕಾರ್ಯ", "Aktyvacijos funkcija"],
  ["pg.lw.act.plot", "Plot of {name} and its derivative", "{name} ಮತ್ತು ಅದರ ಅವಕಲನದ ಗ್ರಾಫ್", "{name} ir jos išvestinės grafikas"],
  ["pg.lw.act.input", "Input x =", "ಇನ್‌ಪುಟ್ x =", "Įvestis x ="],

  // ---- gradient descent toy
  ["pg.lw.gd.intro.a", "Toy problem: minimise", "ಆಟಿಕೆ ಸಮಸ್ಯೆ: ಕನಿಷ್ಠಗೊಳಿಸಿ", "Žaislinis uždavinys: minimizuokite"],
  ["pg.lw.gd.intro.b", "starting at w = −2. This 1-D illustration shows the update rule, not your network.", "w = −2 ರಿಂದ ಆರಂಭಿಸಿ. ಈ 1-D ಚಿತ್ರಣ ಅಪ್‌ಡೇಟ್ ನಿಯಮವನ್ನು ತೋರಿಸುತ್ತದೆ, ನಿಮ್ಮ ನೆಟ್‌ವರ್ಕ್ ಅನ್ನು ಅಲ್ಲ.", "pradedant nuo w = −2. Ši 1D iliustracija rodo atnaujinimo taisyklę, o ne jūsų tinklą."],
  ["pg.lw.gd.aria", "Gradient descent steps on a parabola", "ಪ್ಯಾರಾಬೋಲಾ ಮೇಲೆ ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಹೆಜ್ಜೆಗಳು", "Gradientinio nusileidimo žingsniai ant parabolės"],
  ["pg.lw.gd.lr", "Learning rate η =", "ಕಲಿಕಾ ದರ η =", "Mokymosi greitis η ="],
  ["pg.lw.gd.steps", "Steps =", "ಹೆಜ್ಜೆಗಳು =", "Žingsnių ="],
  ["pg.lw.gd.result", "w after {steps} steps = {w} (optimum 3) · {verdict}", "{steps} ಹೆಜ್ಜೆಗಳ ನಂತರ w = {w} (ಅತ್ಯುತ್ತಮ 3) · {verdict}", "w po {steps} žingsnių = {w} (optimumas 3) · {verdict}"],
  ["pg.lw.gd.diverged", "diverged", "ಅಪಸರಣಗೊಂಡಿದೆ", "išsiskyrė"],
  ["pg.lw.gd.overshooting", "overshooting", "ಗುರಿಯನ್ನು ಮೀರುತ್ತಿದೆ", "peršokama"],
  ["pg.lw.gd.crawling", "crawling", "ತೆವಳುತ್ತಿದೆ", "šliaužia"],
  ["pg.lw.gd.converging", "converging", "ಒಮ್ಮುಖವಾಗುತ್ತಿದೆ", "konverguoja"],

  // ---- iteration walkthrough
  ["pg.lw.it.intro", "Runs a real dry-run on your current model (epoch {epoch}) with one training sample. Nothing is modified.", "ನಿಮ್ಮ ಪ್ರಸ್ತುತ ಮಾದರಿಯ (ಎಪೋಕ್ {epoch}) ಮೇಲೆ ಒಂದು ತರಬೇತಿ ಮಾದರಿಯೊಂದಿಗೆ ನೈಜ ಪ್ರಾಯೋಗಿಕ ಓಟ ನಡೆಸುತ್ತದೆ. ಯಾವುದೂ ಬದಲಾಗುವುದಿಲ್ಲ.", "Su vienu mokymo pavyzdžiu atlieka tikrą bandomąjį žingsnį su dabartiniu modeliu ({epoch}-oji epocha). Niekas nekeičiama."],
  ["pg.lw.it.sample", "Training sample index (0–{max})", "ತರಬೇತಿ ಮಾದರಿ ಸೂಚ್ಯಂಕ (0–{max})", "Mokymo pavyzdžio indeksas (0–{max})"],
  ["pg.lw.it.run", "Trace one iteration", "ಒಂದು ಪುನರಾವರ್ತನೆಯನ್ನು ಅನುಸರಿಸಿ", "Atsekti vieną iteraciją"],
  ["pg.lw.it.needModel", "Create a valid model first.", "ಮೊದಲು ಮಾನ್ಯ ಮಾದರಿಯನ್ನು ರಚಿಸಿ.", "Pirmiausia sukurkite tinkamą modelį."],
  ["pg.lw.it.s1", "**1 · Pick data.** Sample #{i}: x = {x}, true label y = {y}.", "**1 · ಡೇಟಾ ಆರಿಸಿ.** ಮಾದರಿ #{i}: x = {x}, ನಿಜವಾದ ಲೇಬಲ್ y = {y}.", "**1 · Parinkite duomenis.** Pavyzdys #{i}: x = {x}, tikroji žymė y = {y}."],
  ["pg.lw.it.s2", "2 · Forward pass.", "2 · ಮುಂದಿನ ಪಾಸ್.", "2 · Tiesioginis perdavimas."],
  ["pg.lw.it.layer", "layer {l}", "ಪದರ {l}", "{l} sluoksnis"],
  ["pg.lw.it.s3", "3 · Loss.", "3 · ನಷ್ಟ.", "3 · Nuostolis."],
  ["pg.lw.it.s3b", "Output p = {p}, so", "ಔಟ್‌ಪುಟ್ p = {p}, ಆದ್ದರಿಂದ", "Išvestis p = {p}, taigi"],
  ["pg.lw.it.s4", "4 · Backward pass.", "4 · ಹಿಂದಿನ ಪಾಸ್.", "4 · Atgalinis perdavimas."],
  ["pg.lw.it.s4b", "The output error is", "ಔಟ್‌ಪುಟ್ ದೋಷ", "Išvesties klaida yra"],
  ["pg.lw.it.s4c", "the chain rule sends it back layer by layer. Gradient sizes:", "ಚೈನ್ ನಿಯಮ ಅದನ್ನು ಪದರದಿಂದ ಪದರಕ್ಕೆ ಹಿಂದಕ್ಕೆ ಕಳುಹಿಸುತ್ತದೆ. ಗ್ರೇಡಿಯಂಟ್ ಗಾತ್ರಗಳು:", "grandinės taisyklė perduoda ją atgal sluoksnis po sluoksnio. Gradientų dydžiai:"],
  ["pg.lw.it.s5", "5 · Update.", "5 · ಅಪ್‌ಡೇಟ್.", "5 · Atnaujinimas."],
  ["pg.lw.it.s5b", "Example weight {name}:", "ಉದಾಹರಣೆ ತೂಕ {name}:", "Pavyzdinis svoris {name}:"],
  ["pg.lw.it.adam", "your optimizer is Adam, which rescales this step per weight", "ನಿಮ್ಮ ಆಪ್ಟಿಮೈಸರ್ Adam, ಇದು ಈ ಹೆಜ್ಜೆಯನ್ನು ಪ್ರತಿ ತೂಕಕ್ಕೆ ಮರುಸ್ಕೇಲ್ ಮಾಡುತ್ತದೆ", "jūsų optimizatorius yra Adam, kuris šį žingsnį permastelėja kiekvienam svoriui"],
  ["pg.lw.it.sgd", "plain SGD", "ಸಾಮಾನ್ಯ SGD", "paprastas SGD"],
  ["pg.lw.it.s6", "6 · Repeat", "6 · ಪುನರಾವರ್ತಿಸಿ", "6 · Kartokite"],
  ["pg.lw.it.s6b", "for every mini-batch; one pass over all batches is one epoch.", "ಪ್ರತಿ ಮಿನಿ-ಬ್ಯಾಚ್‌ಗೆ; ಎಲ್ಲ ಬ್ಯಾಚ್‌ಗಳ ಮೇಲೆ ಒಂದು ಪಾಸ್ ಎಂದರೆ ಒಂದು ಎಪೋಕ್.", "kiekvienam mažam paketui; vienas ciklas per visus paketus yra viena epocha."],

  // ---- loss comparison
  ["pg.lw.loss.bce", "Cross-entropy", "ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ", "Kryžminė entropija"],
  ["pg.lw.loss.mse", "Squared error", "ವರ್ಗ ದೋಷ", "Kvadratinė klaida"],
  ["pg.lw.loss.hinge", "Hinge", "ಹಿಂಜ್", "Hinge"],
  ["pg.lw.loss.trueClass", "True class", "ನಿಜವಾದ ವರ್ಗ", "Tikroji klasė"],
  ["pg.lw.loss.class1", "True class 1", "ನಿಜವಾದ ವರ್ಗ 1", "Tikroji klasė 1"],
  ["pg.lw.loss.class0", "True class 0", "ನಿಜವಾದ ವರ್ಗ 0", "Tikroji klasė 0"],
  ["pg.lw.loss.logit", "Model's raw score (logit z)", "ಮಾದರಿಯ ಕಚ್ಚಾ ಅಂಕ (ಲಾಜಿಟ್ z)", "Modelio neapdorotas įvertis (logitas z)"],
  ["pg.lw.loss.aria", "Loss versus logit for three loss functions", "ಮೂರು ನಷ್ಟ ಕಾರ್ಯಗಳಿಗೆ ನಷ್ಟ ಮತ್ತು ಲಾಜಿಟ್", "Trijų nuostolio funkcijų nuostolis pagal logitą"],
  ["pg.lw.loss.left", "z = −6 (confident “0”)", "z = −6 (ವಿಶ್ವಾಸದ “0”)", "z = −6 (užtikrintas „0“)"],
  ["pg.lw.loss.right", "z = +6 (confident “1”)", "z = +6 (ವಿಶ್ವಾಸದ “1”)", "z = +6 (užtikrintas „1“)"],
  ["pg.lw.loss.colLoss", "Loss", "ನಷ್ಟ", "Nuostolis"],
  ["pg.lw.loss.colValue", "value", "ಮೌಲ್ಯ", "reikšmė"],
  ["pg.lw.loss.colGrad", "gradient ∂L/∂z (the learning signal)", "ಗ್ರೇಡಿಯಂಟ್ ∂L/∂z (ಕಲಿಕಾ ಸಂಕೇತ)", "gradientas ∂L/∂z (mokymosi signalas)"],
  ["pg.lw.loss.wrong", "Confidently wrong: cross-entropy keeps a strong gradient, squared error's gradient has almost vanished, so it learns from this mistake very slowly.", "ವಿಶ್ವಾಸದಿಂದ ತಪ್ಪು: ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ ಬಲವಾದ ಗ್ರೇಡಿಯಂಟ್ ಉಳಿಸಿಕೊಳ್ಳುತ್ತದೆ, ವರ್ಗ ದೋಷದ ಗ್ರೇಡಿಯಂಟ್ ಬಹುತೇಕ ಮಾಯವಾಗಿದೆ, ಆದ್ದರಿಂದ ಈ ತಪ್ಪಿನಿಂದ ಅದು ತುಂಬಾ ನಿಧಾನವಾಗಿ ಕಲಿಯುತ್ತದೆ.", "Užtikrintai klysta: kryžminė entropija išlaiko stiprų gradientą, o kvadratinės klaidos gradientas beveik išnyko, todėl iš šios klaidos ji mokosi labai lėtai."],

  // ---- optimizer race
  ["pg.lw.race.intro", "A toy loss valley (steep in y, flat in x). All start at the black dot; the cross is the minimum. This is an illustration with its own learning rates, not your network.", "ಆಟಿಕೆ ನಷ್ಟ ಕಣಿವೆ (y ನಲ್ಲಿ ಕಡಿದಾದ, x ನಲ್ಲಿ ಸಮತಟ್ಟು). ಎಲ್ಲವೂ ಕಪ್ಪು ಚುಕ್ಕೆಯಿಂದ ಆರಂಭ; ಅಡ್ಡ ಗುರುತು ಕನಿಷ್ಠ ಬಿಂದು. ಇದು ತನ್ನದೇ ಕಲಿಕಾ ದರಗಳ ಚಿತ್ರಣ, ನಿಮ್ಮ ನೆಟ್‌ವರ್ಕ್ ಅಲ್ಲ.", "Žaislinis nuostolio slėnis (status pagal y, plokščias pagal x). Visi pradeda nuo juodo taško; kryželis – minimumas. Tai iliustracija su savais mokymosi greičiais, o ne jūsų tinklas."],
  ["pg.lw.race.steps", "Steps", "ಹೆಜ್ಜೆಗಳು", "Žingsniai"],
  ["pg.lw.race.same", "Same learning rate for all", "ಎಲ್ಲರಿಗೂ ಒಂದೇ ಕಲಿಕಾ ದರ", "Tas pats mokymosi greitis visiems"],
  ["pg.lw.race.shared", "Shared learning rate", "ಹಂಚಿದ ಕಲಿಕಾ ದರ", "Bendras mokymosi greitis"],
  ["pg.lw.race.aria", "Optimizer paths on a loss valley", "ನಷ್ಟ ಕಣಿವೆಯ ಮೇಲೆ ಆಪ್ಟಿಮೈಸರ್ ಹಾದಿಗಳು", "Optimizatorių keliai nuostolio slėnyje"],
  ["pg.lw.race.show", "Optimizers to show", "ತೋರಿಸಬೇಕಾದ ಆಪ್ಟಿಮೈಸರ್‌ಗಳು", "Rodomi optimizatoriai"],
  ["pg.lw.race.loss", "loss {v}", "ನಷ್ಟ {v}", "nuostolis {v}"],
  ["pg.lw.race.note", "Each optimizer uses a rate measured to work on this valley. Adadelta needs the most steps because its running average of past updates starts at zero.", "ಪ್ರತಿ ಆಪ್ಟಿಮೈಸರ್ ಈ ಕಣಿವೆಯಲ್ಲಿ ಕೆಲಸ ಮಾಡುತ್ತದೆಂದು ಅಳೆಯಲಾದ ದರವನ್ನು ಬಳಸುತ್ತದೆ. Adadelta ಗೆ ಹೆಚ್ಚು ಹೆಜ್ಜೆಗಳು ಬೇಕು, ಏಕೆಂದರೆ ಹಿಂದಿನ ಅಪ್‌ಡೇಟ್‌ಗಳ ಚಲಿಸುವ ಸರಾಸರಿ ಸೊನ್ನೆಯಿಂದ ಆರಂಭವಾಗುತ್ತದೆ.", "Kiekvienas optimizatorius naudoja greitį, kuris išmatuotas kaip veikiantis šiame slėnyje. Adadelta reikia daugiausia žingsnių, nes jos slenkantis ankstesnių atnaujinimų vidurkis prasideda nuo nulio."],

  // ---- weight histogram
  ["pg.lw.wh.none", "Create a model to see its weights.", "ತೂಕಗಳನ್ನು ನೋಡಲು ಮಾದರಿಯನ್ನು ರಚಿಸಿ.", "Sukurkite modelį, kad pamatytumėte jo svorius."],
  ["pg.lw.wh.intro", "Histogram of every weight in your network right now (epoch {epoch}). L2 squeezes the spread; L1 piles weights up at zero.", "ನಿಮ್ಮ ನೆಟ್‌ವರ್ಕ್‌ನ ಪ್ರತಿ ತೂಕದ ಹಿಸ್ಟೋಗ್ರಾಮ್ (ಎಪೋಕ್ {epoch}). L2 ಹರಡುವಿಕೆಯನ್ನು ಕುಗ್ಗಿಸುತ್ತದೆ; L1 ತೂಕಗಳನ್ನು ಸೊನ್ನೆಯಲ್ಲಿ ರಾಶಿ ಹಾಕುತ್ತದೆ.", "Visų jūsų tinklo svorių histograma dabar ({epoch}-oji epocha). L2 sutraukia sklaidą; L1 sukrauna svorius ties nuliu."],
  ["pg.lw.wh.aria", "Histogram of the network's weights", "ನೆಟ್‌ವರ್ಕ್‌ನ ತೂಕಗಳ ಹಿಸ್ಟೋಗ್ರಾಮ್", "Tinklo svorių histograma"],
  ["pg.lw.wh.stats", "{n} weights · Σ|w| = **{l1n}** · Σw² = **{l2n}** · {small}% have |w| < 0.05", "{n} ತೂಕಗಳು · Σ|w| = **{l1n}** · Σw² = **{l2n}** · {small}% ರಲ್ಲಿ |w| < 0.05", "{n} svorių · Σ|w| = **{l1n}** · Σw² = **{l2n}** · {small}% turi |w| < 0,05"],
  ["pg.lw.wh.penalty", "Penalty with your settings: {l1}·Σ|w| + {l2}·Σw² = **{p}**", "ನಿಮ್ಮ ಸೆಟ್ಟಿಂಗ್‌ಗಳೊಂದಿಗೆ ದಂಡ: {l1}·Σ|w| + {l2}·Σw² = **{p}**", "Bauda su jūsų nustatymais: {l1}·Σ|w| + {l2}·Σw² = **{p}**"],

  // ---- dropout demo
  ["pg.lw.do.rate", "Dropout rate p", "ಡ್ರಾಪ್‌ಔಟ್ ದರ p", "Dropout dažnis p"],
  ["pg.lw.do.mask", "Sample a new mask", "ಹೊಸ ಮಾಸ್ಕ್ ಆರಿಸಿ", "Sugeneruoti naują kaukę"],
  ["pg.lw.do.aria", "Twelve neurons, dropped ones crossed out", "ಹನ್ನೆರಡು ನ್ಯೂರಾನ್‌ಗಳು, ಕೈಬಿಟ್ಟವನ್ನು ಅಡ್ಡಗೆರೆಯಿಂದ ಗುರುತಿಸಲಾಗಿದೆ", "Dvylika neuronų, išjungtieji perbraukti"],
  ["pg.lw.do.off", "off", "ಆಫ್", "išj."],
  ["pg.lw.do.sum", "Full sum S = **{S}** · kept neurons only S_q = **{Sq}** · after scaling by 1/(1−p) = {k}: **{scaled}**", "ಪೂರ್ಣ ಮೊತ್ತ S = **{S}** · ಉಳಿದ ನ್ಯೂರಾನ್‌ಗಳು ಮಾತ್ರ S_q = **{Sq}** · 1/(1−p) = {k} ರಿಂದ ಸ್ಕೇಲ್ ಮಾಡಿದ ನಂತರ: **{scaled}**", "Pilna suma S = **{S}** · tik likę neuronai S_q = **{Sq}** · po padauginimo iš 1/(1−p) = {k}: **{scaled}**"],
  ["pg.lw.do.avg", "Average of the scaled sum over 3000 random masks: **{avg}** ≈ S. Scaling keeps the expected signal unchanged, so nothing needs rescaling at prediction time.", "3000 ಯಾದೃಚ್ಛಿಕ ಮಾಸ್ಕ್‌ಗಳ ಮೇಲೆ ಸ್ಕೇಲ್ ಮಾಡಿದ ಮೊತ್ತದ ಸರಾಸರಿ: **{avg}** ≈ S. ಸ್ಕೇಲಿಂಗ್ ನಿರೀಕ್ಷಿತ ಸಂಕೇತವನ್ನು ಬದಲಾಗದಂತೆ ಇಡುತ್ತದೆ, ಆದ್ದರಿಂದ ಭವಿಷ್ಯವಾಣಿ ಸಮಯದಲ್ಲಿ ಮರುಸ್ಕೇಲ್ ಬೇಕಿಲ್ಲ.", "Padauginto sumos vidurkis iš 3000 atsitiktinių kaukių: **{avg}** ≈ S. Padauginimas išlaiko laukiamą signalą nepakitusį, todėl prognozuojant nieko perskaičiuoti nereikia."],

  // ---- batch-norm demo
  ["pg.lw.bn.intro", "One feature over a mini-batch of 8 samples (values from a seeded random generator).", "8 ಮಾದರಿಗಳ ಮಿನಿ-ಬ್ಯಾಚ್‌ನಲ್ಲಿ ಒಂದು ಲಕ್ಷಣ (ಸೀಡ್ ಮಾಡಿದ ಯಾದೃಚ್ಛಿಕ ಜನರೇಟರ್‌ನ ಮೌಲ್ಯಗಳು).", "Vienas požymis 8 pavyzdžių mažame pakete (reikšmės iš fiksuoto atsitiktinių skaičių generatoriaus)."],
  ["pg.lw.bn.gamma", "γ (scale, learned)", "γ (ಸ್ಕೇಲ್, ಕಲಿತದ್ದು)", "γ (mastelis, išmoktas)"],
  ["pg.lw.bn.beta", "β (shift, learned)", "β (ಶಿಫ್ಟ್, ಕಲಿತದ್ದು)", "β (postūmis, išmoktas)"],
  ["pg.lw.bn.out", "Batch mean μ = **{mu}**, variance σ² = **{var}** → normalised x̂ has mean **{xm}** and variance **1.000**; the output y has mean **{ym}** (= β) because γ and β let the network undo the normalisation if that helps.", "ಬ್ಯಾಚ್ ಸರಾಸರಿ μ = **{mu}**, ವ್ಯತ್ಯಾಸ σ² = **{var}** → ಸಾಮಾನ್ಯೀಕೃತ x̂ ಸರಾಸರಿ **{xm}** ಮತ್ತು ವ್ಯತ್ಯಾಸ **1.000**; ಔಟ್‌ಪುಟ್ y ಸರಾಸರಿ **{ym}** (= β), ಏಕೆಂದರೆ ಸಹಾಯವಾದರೆ γ ಮತ್ತು β ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಸಾಮಾನ್ಯೀಕರಣವನ್ನು ರದ್ದುಗೊಳಿಸಲು ಅವಕಾಶ ನೀಡುತ್ತವೆ.", "Paketo vidurkis μ = **{mu}**, dispersija σ² = **{var}** → normalizuotas x̂ turi vidurkį **{xm}** ir dispersiją **1.000**; išvesties y vidurkis **{ym}** (= β), nes γ ir β leidžia tinklui atšaukti normalizavimą, jei tai padeda."],
];
