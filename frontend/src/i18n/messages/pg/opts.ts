import type { Rows } from "./types";

/** Labels and one-line notes for the dropdown options (English source text lives in lib/options.ts). */
export const opts: Rows = [
  // ---- activations (names stay in Latin script; only the notes are translated)
  ["pg.opt.act.relu.note", "max(0, x). Fast, no saturation for x > 0; neurons can “die” at x < 0.", "max(0, x). ವೇಗ, x > 0 ಗೆ ಸ್ಯಾಚುರೇಶನ್ ಇಲ್ಲ; x < 0 ನಲ್ಲಿ ನ್ಯೂರಾನ್‌ಗಳು “ಸಾಯಬಹುದು”.", "max(0, x). Greita, esant x > 0 nesisotina; kai x < 0, neuronai gali „mirti“."],
  ["pg.opt.act.leaky_relu.note", "Like ReLU but keeps a small slope (0.01) for x < 0, so neurons do not die.", "ReLU ಹಾಗೆಯೇ ಆದರೆ x < 0 ಗೆ ಸಣ್ಣ ಇಳಿಜಾರು (0.01) ಉಳಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ನ್ಯೂರಾನ್‌ಗಳು ಸಾಯುವುದಿಲ್ಲ.", "Kaip ReLU, bet esant x < 0 palieka nedidelį nuolydį (0,01), todėl neuronai nemiršta."],
  ["pg.opt.act.elu.note", "Smooth negative side (e^x − 1); outputs centred nearer zero than ReLU.", "ನಯವಾದ ಋಣಾತ್ಮಕ ಭಾಗ (e^x − 1); ಔಟ್‌ಪುಟ್‌ಗಳು ReLU ಗಿಂತ ಸೊನ್ನೆಗೆ ಹತ್ತಿರ ಕೇಂದ್ರೀಕೃತ.", "Glodi neigiama pusė (e^x − 1); išvestys centruotos arčiau nulio nei ReLU."],
  ["pg.opt.act.selu.note", "Scaled ELU (λ ≈ 1.0507, α ≈ 1.6733) that tends to keep activations normalised.", "ಸ್ಕೇಲ್ ಮಾಡಿದ ELU (λ ≈ 1.0507, α ≈ 1.6733); ಆಕ್ಟಿವೇಶನ್‌ಗಳನ್ನು ಸಾಮಾನ್ಯೀಕೃತವಾಗಿಡುವ ಪ್ರವೃತ್ತಿ.", "Mastelio ELU (λ ≈ 1,0507, α ≈ 1,6733), linkusi išlaikyti normalizuotas aktyvacijas."],
  ["pg.opt.act.sigmoid.note", "Squashes to 0…1; gradient ≤ 0.25 so deep stacks suffer vanishing gradients.", "0…1 ಗೆ ಸಂಕುಚಿತಗೊಳಿಸುತ್ತದೆ; ಗ್ರೇಡಿಯಂಟ್ ≤ 0.25, ಆದ್ದರಿಂದ ಆಳವಾದ ಪದರಗಳಲ್ಲಿ ಗ್ರೇಡಿಯಂಟ್ ಮಾಯವಾಗುತ್ತದೆ.", "Suspaudžia į 0…1; gradientas ≤ 0,25, todėl giliuose tinkluose gradientai išnyksta."],
  ["pg.opt.act.tanh.note", "Squashes to −1…1, zero-centred, gradient up to 1; still saturates.", "−1…1 ಗೆ ಸಂಕುಚಿತಗೊಳಿಸುತ್ತದೆ, ಸೊನ್ನೆ-ಕೇಂದ್ರಿತ, ಗ್ರೇಡಿಯಂಟ್ 1 ರವರೆಗೆ; ಆದರೂ ಸ್ಯಾಚುರೇಟ್ ಆಗುತ್ತದೆ.", "Suspaudžia į −1…1, centruota ties nuliu, gradientas iki 1; vis tiek prisotinama."],
  ["pg.opt.act.softplus.note", "ln(1 + eˣ): a smooth version of ReLU.", "ln(1 + eˣ): ReLU ನ ನಯವಾದ ರೂಪ.", "ln(1 + eˣ): glodi ReLU versija."],
  ["pg.opt.act.silu.note", "x · sigmoid(x): smooth, slightly non-monotonic, popular in modern nets.", "x · sigmoid(x): ನಯವಾದ, ಸ್ವಲ್ಪ ಏಕತಾನವಲ್ಲದ, ಆಧುನಿಕ ನೆಟ್‌ವರ್ಕ್‌ಗಳಲ್ಲಿ ಜನಪ್ರಿಯ.", "x · sigmoid(x): glodi, šiek tiek nemonotoniška, populiari šiuolaikiniuose tinkluose."],

  // ---- optimizers
  ["pg.opt.optim.momentum.label", "SGD + momentum (γ = 0.9)", "SGD + ಮೊಮೆಂಟಮ್ (γ = 0.9)", "SGD + impulsas (γ = 0.9)"],
  ["pg.opt.optim.nesterov.label", "Nesterov momentum (γ = 0.9)", "ನೆಸ್ಟೆರೋವ್ ಮೊಮೆಂಟಮ್ (γ = 0.9)", "Nesterovo impulsas (γ = 0.9)"],
  ["pg.opt.optim.sgd.note", "θ ← θ − η·g. Simple; needs a well-tuned learning rate.", "θ ← θ − η·g. ಸರಳ; ಚೆನ್ನಾಗಿ ಹೊಂದಿಸಿದ ಕಲಿಕಾ ದರ ಬೇಕು.", "θ ← θ − η·g. Paprasta; reikia gerai parinkto mokymosi greičio."],
  ["pg.opt.optim.momentum.note", "Keeps a velocity of past gradients to smooth the path and speed up along flat directions.", "ಹಿಂದಿನ ಗ್ರೇಡಿಯಂಟ್‌ಗಳ ವೇಗವನ್ನು ಉಳಿಸಿಕೊಂಡು ಹಾದಿಯನ್ನು ನಯಗೊಳಿಸುತ್ತದೆ ಮತ್ತು ಸಮತಟ್ಟಾದ ದಿಕ್ಕುಗಳಲ್ಲಿ ವೇಗ ಹೆಚ್ಚಿಸುತ್ತದೆ.", "Išlaiko ankstesnių gradientų greitį, kad kelias būtų sklandesnis, o lygiose kryptyse judėjimas greitesnis."],
  ["pg.opt.optim.nesterov.note", "Momentum with a look-ahead gradient; often a little more stable.", "ಮುಂದೆ ನೋಡುವ ಗ್ರೇಡಿಯಂಟ್‌ನೊಂದಿಗೆ ಮೊಮೆಂಟಮ್; ಸಾಮಾನ್ಯವಾಗಿ ಸ್ವಲ್ಪ ಹೆಚ್ಚು ಸ್ಥಿರ.", "Impulsas su gradientu žvelgiant į priekį; dažnai kiek stabilesnis."],
  ["pg.opt.optim.adagrad.note", "Per-parameter rate that shrinks as squared gradients accumulate; good for sparse features, can stall later.", "ವರ್ಗ ಗ್ರೇಡಿಯಂಟ್‌ಗಳು ಸಂಗ್ರಹವಾದಂತೆ ಕುಗ್ಗುವ ಪ್ಯಾರಾಮೀಟರ್‌ವಾರು ದರ; ವಿರಳ ಲಕ್ಷಣಗಳಿಗೆ ಒಳ್ಳೆಯದು, ನಂತರ ನಿಂತುಹೋಗಬಹುದು.", "Kiekvieno parametro greitis mažėja kaupiantis gradientų kvadratams; tinka retiems požymiams, vėliau gali sustoti."],
  ["pg.opt.optim.rmsprop.note", "Divides by a decaying average of squared gradients, fixing Adagrad's ever-shrinking step.", "ವರ್ಗ ಗ್ರೇಡಿಯಂಟ್‌ಗಳ ಕ್ಷೀಣಿಸುವ ಸರಾಸರಿಯಿಂದ ಭಾಗಿಸುತ್ತದೆ; Adagrad ನ ಸದಾ ಕುಗ್ಗುವ ಹೆಜ್ಜೆಯನ್ನು ಸರಿಪಡಿಸುತ್ತದೆ.", "Dalija iš nykstančio gradientų kvadratų vidurkio ir ištaiso Adagrad nuolat mažėjantį žingsnį."],
  ["pg.opt.optim.adadelta.note", "Uses the ratio of past update size to gradient size; designed for a learning rate of about 1.", "ಹಿಂದಿನ ಅಪ್‌ಡೇಟ್ ಗಾತ್ರ ಮತ್ತು ಗ್ರೇಡಿಯಂಟ್ ಗಾತ್ರದ ಅನುಪಾತವನ್ನು ಬಳಸುತ್ತದೆ; ಸುಮಾರು 1 ಕಲಿಕಾ ದರಕ್ಕೆ ವಿನ್ಯಾಸಗೊಂಡಿದೆ.", "Naudoja ankstesnio atnaujinimo ir gradiento dydžių santykį; sukurtas maždaug 1 mokymosi greičiui."],
  ["pg.opt.optim.adam.note", "Momentum + RMSprop scaling with bias correction. A strong default.", "ಮೊಮೆಂಟಮ್ + RMSprop ಸ್ಕೇಲಿಂಗ್, ಬಯಾಸ್ ತಿದ್ದುಪಡಿಯೊಂದಿಗೆ. ಉತ್ತಮ ಪೂರ್ವನಿಯೋಜಿತ ಆಯ್ಕೆ.", "Impulsas + RMSprop mastelis su poslinkio korekcija. Tvirtas numatytasis pasirinkimas."],
  ["pg.opt.optim.nadam.note", "Adam with Nesterov's look-ahead.", "Nesterov ನ ಮುಂದೆ ನೋಡುವ ವಿಧಾನದೊಂದಿಗೆ Adam.", "Adam su Nesterovo žvilgsniu į priekį."],

  // ---- losses
  ["pg.opt.loss.bce.label", "Binary cross-entropy", "ಬೈನರಿ ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ", "Dvejetainė kryžminė entropija"],
  ["pg.opt.loss.mse.label", "Mean squared error (on p)", "ಸರಾಸರಿ ವರ್ಗ ದೋಷ (p ಮೇಲೆ)", "Vidutinė kvadratinė klaida (pagal p)"],
  ["pg.opt.loss.hinge.label", "Hinge (margin on the logit)", "ಹಿಂಜ್ (ಲಾಜಿಟ್ ಮೇಲಿನ ಅಂಚು)", "Hinge (paraštė logitui)"],
  ["pg.opt.loss.bce.note", "−[y ln p + (1−y) ln(1−p)]. The standard loss for a sigmoid output; punishes confident mistakes hard.", "−[y ln p + (1−y) ln(1−p)]. ಸಿಗ್ಮಾಯ್ಡ್ ಔಟ್‌ಪುಟ್‌ಗೆ ಪ್ರಮಾಣಿತ ನಷ್ಟ; ವಿಶ್ವಾಸದಿಂದ ಮಾಡಿದ ತಪ್ಪುಗಳಿಗೆ ಕಠಿಣ ಶಿಕ್ಷೆ.", "−[y ln p + (1−y) ln(1−p)]. Standartinis sigmoidinės išvesties nuostolis; griežtai baudžia už užtikrintas klaidas."],
  ["pg.opt.loss.mse.note", "(p − y)². Works, but gradients vanish when a confident prediction is wrong.", "(p − y)². ಕೆಲಸ ಮಾಡುತ್ತದೆ, ಆದರೆ ವಿಶ್ವಾಸದ ಭವಿಷ್ಯವಾಣಿ ತಪ್ಪಾದಾಗ ಗ್ರೇಡಿಯಂಟ್‌ಗಳು ಮಾಯವಾಗುತ್ತವೆ.", "(p − y)². Veikia, bet gradientai išnyksta, kai užtikrinta prognozė klaidinga."],
  ["pg.opt.loss.hinge.note", "max(0, 1 − s·z) with s = ±1. Cares about the margin, not about probabilities.", "max(0, 1 − s·z), s = ±1. ಅಂಚಿನ ಬಗ್ಗೆ ಕಾಳಜಿ ವಹಿಸುತ್ತದೆ, ಸಂಭವನೀಯತೆಗಳ ಬಗ್ಗೆ ಅಲ್ಲ.", "max(0, 1 − s·z), kai s = ±1. Rūpinasi paraštė, o ne tikimybėmis."],

  // ---- validation methods
  ["pg.opt.val.holdout.label", "Hold-out", "ಹೋಲ್ಡ್-ಔಟ್", "Atidėjimas (hold-out)"],
  ["pg.opt.val.kfold.label", "K-fold", "K-ಫೋಲ್ಡ್", "K dalių (K-fold)"],
  ["pg.opt.val.stratified_kfold.label", "Stratified K-fold", "ಸ್ಟ್ರಾಟಿಫೈಡ್ K-ಫೋಲ್ಡ್", "Stratifikuotas K dalių"],
  ["pg.opt.val.shuffle_split.label", "Shuffle split", "ಷಫಲ್ ಸ್ಪ್ಲಿಟ್", "Maišytas padalijimas"],
  ["pg.opt.val.time_series.label", "Time-series split", "ಕಾಲ-ಶ್ರೇಣಿ ವಿಭಜನೆ", "Laiko eilučių padalijimas"],
  ["pg.opt.val.leave_one_out.label", "Leave-one-out", "ಲೀವ್-ಒನ್-ಔಟ್", "Vienas paliekamas (leave-one-out)"],
  ["pg.opt.val.holdout.note", "One split into training and validation. Cheap; the estimate depends on that single split.", "ತರಬೇತಿ ಮತ್ತು ಮೌಲ್ಯೀಕರಣಕ್ಕೆ ಒಂದೇ ವಿಭಜನೆ. ಅಗ್ಗ; ಅಂದಾಜು ಆ ಒಂದೇ ವಿಭಜನೆಯನ್ನು ಅವಲಂಬಿಸಿದೆ.", "Vienas padalijimas į mokymo ir validacijos dalis. Pigu; įvertis priklauso nuo to vienintelio padalijimo."],
  ["pg.opt.val.kfold.note", "K parts; each is the validation set once. Fair estimate on small data, but trains K models.", "K ಭಾಗಗಳು; ಪ್ರತಿಯೊಂದೂ ಒಮ್ಮೆ ಮೌಲ್ಯೀಕರಣ ಸೆಟ್ ಆಗುತ್ತದೆ. ಸಣ್ಣ ಡೇಟಾದಲ್ಲಿ ನ್ಯಾಯಯುತ ಅಂದಾಜು, ಆದರೆ K ಮಾದರಿಗಳಿಗೆ ತರಬೇತಿ ನೀಡಬೇಕು.", "K dalių; kiekviena vieną kartą tampa validacijos rinkiniu. Teisingas įvertis mažiems duomenims, bet reikia apmokyti K modelių."],
  ["pg.opt.val.stratified_kfold.note", "K-fold that keeps the class ratio in every fold. Use it for imbalanced classes.", "ಪ್ರತಿ ಫೋಲ್ಡ್‌ನಲ್ಲಿ ವರ್ಗ ಅನುಪಾತವನ್ನು ಕಾಪಾಡುವ K-ಫೋಲ್ಡ್. ಅಸಮತೋಲಿತ ವರ್ಗಗಳಿಗೆ ಬಳಸಿ.", "K dalių metodas, išlaikantis klasių santykį kiekvienoje dalyje. Naudokite nesubalansuotoms klasėms."],
  ["pg.opt.val.shuffle_split.note", "Several independent random splits; some samples may repeat or be missed.", "ಹಲವಾರು ಸ್ವತಂತ್ರ ಯಾದೃಚ್ಛಿಕ ವಿಭಜನೆಗಳು; ಕೆಲವು ಮಾದರಿಗಳು ಪುನರಾವರ್ತನೆ ಆಗಬಹುದು ಅಥವಾ ತಪ್ಪಿಹೋಗಬಹುದು.", "Keli nepriklausomi atsitiktiniai padalijimai; kai kurie pavyzdžiai gali pasikartoti arba likti nepanaudoti."],
  ["pg.opt.val.time_series.note", "Growing training window, validation always in the future. Points are not shuffled.", "ಬೆಳೆಯುವ ತರಬೇತಿ ಕಿಟಕಿ, ಮೌಲ್ಯೀಕರಣ ಯಾವಾಗಲೂ ಭವಿಷ್ಯದಲ್ಲಿ. ಬಿಂದುಗಳನ್ನು ಕಲಸುವುದಿಲ್ಲ.", "Auganti mokymo dalis, validacija visada ateityje. Taškai nemaišomi."],
  ["pg.opt.val.leave_one_out.note", "One model per sample. Very slow; only for tiny datasets (≤ 60 here).", "ಪ್ರತಿ ಮಾದರಿಗೆ ಒಂದು ಮಾದರಿ. ತುಂಬಾ ನಿಧಾನ; ಅತಿ ಸಣ್ಣ ಡೇಟಾಸೆಟ್‌ಗಳಿಗೆ ಮಾತ್ರ (ಇಲ್ಲಿ ≤ 60).", "Vienas modelis kiekvienam pavyzdžiui. Labai lėta; tik labai mažiems rinkiniams (čia ≤ 60)."],

  // ---- initializers
  ["pg.opt.init.xavier.label", "Xavier / Glorot (uniform)", "Xavier / Glorot (ಏಕರೂಪ)", "Xavier / Glorot (tolygusis)"],
  ["pg.opt.init.he.label", "He (normal)", "He (ಸಾಮಾನ್ಯ)", "He (normalusis)"],
  ["pg.opt.init.small_normal.label", "Small normal (σ = 0.1)", "ಸಣ್ಣ ಸಾಮಾನ್ಯ (σ = 0.1)", "Mažas normalusis (σ = 0.1)"],
  ["pg.opt.init.zeros.label", "Zeros (demo: symmetry problem)", "ಸೊನ್ನೆಗಳು (ಡೆಮೊ: ಸಮ್ಮಿತಿ ಸಮಸ್ಯೆ)", "Nuliai (demonstracija: simetrijos problema)"],
];
