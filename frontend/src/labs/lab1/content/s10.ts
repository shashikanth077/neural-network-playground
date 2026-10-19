import type { Row } from "./types";

/** Step 10: 6.3 · Optimizers and learning rate. */
export const s10: Row[] = [
  ["step.lab1.optimizers.title", "6.3 · Optimizers and learning rate", "6.3 · ಆಪ್ಟಿಮೈಜರ್‌ಗಳು ಮತ್ತು ಕಲಿಕೆಯ ದರ", "6.3 · Optimizatoriai ir mokymosi greitis"],
  ["step.lab1.optimizers.summary", "SGD, RMSprop and Adam race down the same valley.", "SGD, RMSprop ಮತ್ತು Adam ಒಂದೇ ಕಣಿವೆಯಲ್ಲಿ ಓಟ ನಡೆಸುತ್ತವೆ.", "SGD, RMSprop ir Adam lenktyniauja tuo pačiu slėniu."],

  ["lab1.op.intro", "The optimizer decides how to use the gradient to move the weights. The toy valley below is steep in one direction and flat in the other (like real loss surfaces). All three start at the same point.", "ತೂಕಗಳನ್ನು ಚಲಿಸಲು ಗ್ರೇಡಿಯಂಟ್ ಅನ್ನು ಹೇಗೆ ಬಳಸಬೇಕೆಂದು ಆಪ್ಟಿಮೈಜರ್ ನಿರ್ಧರಿಸುತ್ತದೆ. ಕೆಳಗಿನ ಆಟಿಕೆ ಕಣಿವೆ ಒಂದು ದಿಕ್ಕಿನಲ್ಲಿ ಕಡಿದಾಗಿ ಮತ್ತು ಇನ್ನೊಂದರಲ್ಲಿ ಚಪ್ಪಟೆಯಾಗಿದೆ (ನಿಜವಾದ ನಷ್ಟ ಮೇಲ್ಮೈಗಳಂತೆ). ಮೂರೂ ಒಂದೇ ಬಿಂದುವಿನಿಂದ ಆರಂಭಿಸುತ್ತವೆ.", "Optimizatorius sprendžia, kaip naudoti gradientą svoriams judinti. Žemiau esantis žaislinis slėnis viena kryptimi status, kita – lėkštas (kaip tikri nuostolių paviršiai). Visi trys pradeda tame pačiame taške."],
  ["lab1.op.demo.title", "SGD vs RMSprop vs Adam on the same valley", "ಒಂದೇ ಕಣಿವೆಯಲ್ಲಿ SGD vs RMSprop vs Adam", "SGD, RMSprop ir Adam tame pačiame slėnyje"],
  ["lab1.op.lr", "Learning rate", "ಕಲಿಕೆಯ ದರ", "Mokymosi greitis"],
  ["lab1.op.steps", "Steps", "ಹೆಜ್ಜೆಗಳು", "Žingsniai"],
  ["lab1.op.animate", "▶ Animate", "▶ ಅನಿಮೇಟ್ ಮಾಡಿ", "▶ Animuoti"],
  ["lab1.op.aria", "Optimizer paths on a loss valley", "ನಷ್ಟ ಕಣಿವೆಯ ಮೇಲೆ ಆಪ್ಟಿಮೈಜರ್ ಮಾರ್ಗಗಳು", "Optimizatorių keliai nuostolių slėnyje"],
  ["lab1.op.leg", "● start · rings = loss levels · goal = centre", "● ಆರಂಭ · ಉಂಗುರಗಳು = ನಷ್ಟ ಮಟ್ಟಗಳು · ಗುರಿ = ಕೇಂದ್ರ", "● pradžia · žiedai = nuostolio lygiai · tikslas = centras"],
  ["lab1.op.loss", "loss = {v}", "ನಷ್ಟ = {v}", "nuostolis = {v}"],
  ["lab1.op.diverged", "diverged (exploded)", "ಅಪಸರಣ (ಸ್ಫೋಟ)", "diverguoja (sprogsta)"],
  ["lab1.op.sgd", "step = lr × gradient. Simple, but the step size must be tuned carefully. Too large → it zig-zags and explodes, too small → crawls.", "ಹೆಜ್ಜೆ = lr × ಗ್ರೇಡಿಯಂಟ್. ಸರಳ, ಆದರೆ ಹೆಜ್ಜೆಯ ಗಾತ್ರವನ್ನು ಜಾಗರೂಕತೆಯಿಂದ ಟ್ಯೂನ್ ಮಾಡಬೇಕು. ತುಂಬಾ ದೊಡ್ಡದು → ಅಂಕುಡೊಂಕಾಗಿ ಸ್ಫೋಟಿಸುತ್ತದೆ, ತುಂಬಾ ಚಿಕ್ಕದು → ತೆವಳುತ್ತದೆ.", "žingsnis = lr × gradientas. Paprasta, bet žingsnio dydį reikia atsargiai derinti. Per didelis → zigzagais sprogsta, per mažas → šliaužia."],
  ["lab1.op.rms", "Divides the step by a running average of recent gradient size, so steep directions get smaller steps.", "ಇತ್ತೀಚಿನ ಗ್ರೇಡಿಯಂಟ್ ಗಾತ್ರದ ಚಲಿಸುವ ಸರಾಸರಿಯಿಂದ ಹೆಜ್ಜೆಯನ್ನು ಭಾಗಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ ಕಡಿದಾದ ದಿಕ್ಕುಗಳಿಗೆ ಚಿಕ್ಕ ಹೆಜ್ಜೆಗಳು ಸಿಗುತ್ತವೆ.", "Žingsnį dalija iš neseniai buvusių gradientų dydžio slenkamojo vidurkio, todėl status kryptys gauna mažesnius žingsnius."],
  ["lab1.op.adam", "Momentum (average direction) + RMSprop scaling. Usually the safest default, lr 0.001 in Keras.", "ಆವೇಗ (ಸರಾಸರಿ ದಿಕ್ಕು) + RMSprop ಮಾಪನ. ಸಾಮಾನ್ಯವಾಗಿ ಅತ್ಯಂತ ಸುರಕ್ಷಿತ ಡೀಫಾಲ್ಟ್, Keras ನಲ್ಲಿ lr 0.001.", "Judesio kiekis (vidutinė kryptis) + RMSprop mastelis. Dažniausiai saugiausias numatytasis pasirinkimas, Keras – lr 0.001."],
  ["lab1.op.cmpTitle", "Compare with the notebook MNIST results", "ನೋಟ್‌ಬುಕ್‌ನ MNIST ಫಲಿತಾಂಶಗಳೊಂದಿಗೆ ಹೋಲಿಸಿ", "Palyginkite su užrašų knygelės MNIST rezultatais"],
  ["lab1.op.cmp", "SGD needed a large rate (0.1-0.5) while RMSprop/Adam liked small ones (0.0001-0.001) and collapsed to chance level at 0.1, the same behaviour you can reproduce above by pushing the slider right.", "SGD ಗೆ ದೊಡ್ಡ ದರ (0.1-0.5) ಬೇಕಾಯಿತು, RMSprop/Adam ಗೆ ಚಿಕ್ಕವು (0.0001-0.001) ಇಷ್ಟವಾದವು ಮತ್ತು 0.1 ನಲ್ಲಿ ಆಕಸ್ಮಿಕ ಮಟ್ಟಕ್ಕೆ ಕುಸಿದವು; ಸ್ಲೈಡರ್ ಅನ್ನು ಬಲಕ್ಕೆ ತಳ್ಳಿ ಮೇಲೆ ಇದೇ ವರ್ತನೆಯನ್ನು ಪುನರುತ್ಪಾದಿಸಬಹುದು.", "SGD reikėjo didelio greičio (0.1-0.5), o RMSprop/Adam patiko maži (0.0001-0.001) ir ties 0.1 jie nukrito iki atsitiktinio lygio – tą patį elgesį galite atkartoti aukščiau pastūmę slankiklį į dešinę."],

  ["lab1.op.ch.title", "Challenge: reach loss < 0.01 within 40 steps", "ಸವಾಲು: 40 ಹೆಜ್ಜೆಗಳಲ್ಲಿ ನಷ್ಟ < 0.01 ತಲುಪಿ", "Iššūkis: pasiekite nuostolį < 0.01 per 40 žingsnių"],
  ["lab1.op.ch.intro", "Pick an optimizer and a learning rate, then press Run. The result comes from the same real simulation as the valley above. Can you find the winners before you reveal the table?", "ಆಪ್ಟಿಮೈಜರ್ ಮತ್ತು ಕಲಿಕೆಯ ದರವನ್ನು ಆರಿಸಿ, ನಂತರ ರನ್ ಒತ್ತಿ. ಫಲಿತಾಂಶ ಮೇಲಿನ ಕಣಿವೆಯ ಅದೇ ನಿಜವಾದ ಸಿಮ್ಯುಲೇಶನ್‌ನಿಂದ ಬರುತ್ತದೆ. ಕೋಷ್ಟಕವನ್ನು ಬಹಿರಂಗಪಡಿಸುವ ಮೊದಲು ವಿಜೇತರನ್ನು ಕಂಡುಹಿಡಿಯಬಲ್ಲಿರಾ?", "Pasirinkite optimizatorių ir mokymosi greitį, tada spauskite Paleisti. Rezultatas gaunamas iš tos pačios tikros simuliacijos kaip ir slėnis aukščiau. Ar surasite nugalėtojus, prieš atskleisdami lentelę?"],
  ["lab1.op.ch.opt", "Optimizer", "ಆಪ್ಟಿಮೈಜರ್", "Optimizatorius"],
  ["lab1.op.ch.lr", "Learning rate", "ಕಲಿಕೆಯ ದರ", "Mokymosi greitis"],
  ["lab1.op.ch.run", "Run 40 steps", "40 ಹೆಜ್ಜೆಗಳನ್ನು ಚಲಾಯಿಸಿ", "Paleisti 40 žingsnių"],
  ["lab1.op.ch.ok", "Success: the loss fell below 0.01 at step {n} (final loss {l}).", "ಯಶಸ್ಸು: ನಷ್ಟ ಹೆಜ್ಜೆ {n} ರಲ್ಲಿ 0.01 ಕ್ಕಿಂತ ಕೆಳಗೆ ಇಳಿಯಿತು (ಅಂತಿಮ ನಷ್ಟ {l}).", "Pavyko: nuostolis nukrito žemiau 0.01 žingsnyje {n} (galutinis nuostolis {l})."],
  ["lab1.op.ch.fail", "Not enough: after 40 steps the loss is still {l}.", "ಸಾಲದು: 40 ಹೆಜ್ಜೆಗಳ ನಂತರವೂ ನಷ್ಟ {l}.", "Nepakako: po 40 žingsnių nuostolis vis dar {l}."],
  ["lab1.op.ch.boom", "Diverged (exploded) after {n} steps: this learning rate is far too large for {o}.", "{n} ಹೆಜ್ಜೆಗಳ ನಂತರ ಅಪಸರಣವಾಯಿತು (ಸ್ಫೋಟ): ಈ ಕಲಿಕೆಯ ದರ {o} ಗೆ ತುಂಬಾ ದೊಡ್ಡದು.", "Diverguota (sprogo) po {n} žingsnių: šis mokymosi greitis yra per didelis {o}."],
  ["lab1.op.ch.history", "Earlier attempts", "ಹಿಂದಿನ ಪ್ರಯತ್ನಗಳು", "Ankstesni bandymai"],
  ["lab1.op.ch.reveal", "Reveal the full table", "ಪೂರ್ಣ ಕೋಷ್ಟಕವನ್ನು ಬಹಿರಂಗಪಡಿಸಿ", "Atskleisti visą lentelę"],
  ["lab1.op.ch.hide", "Hide the table", "ಕೋಷ್ಟಕವನ್ನು ಮರೆಮಾಡಿ", "Slėpti lentelę"],
  ["lab1.op.ch.tableLabel", "Optimizer by learning rate: step at which the loss first falls below 0.01", "ಕಲಿಕೆಯ ದರದ ಪ್ರಕಾರ ಆಪ್ಟಿಮೈಜರ್: ನಷ್ಟ ಮೊದಲು 0.01 ಕ್ಕಿಂತ ಕೆಳಗೆ ಬೀಳುವ ಹೆಜ್ಜೆ", "Optimizatorius pagal mokymosi greitį: žingsnis, kuriame nuostolis pirmą kartą nukrenta žemiau 0.01"],
  ["lab1.op.ch.legend", "✓ n = reached at step n · ✗ = not reached in 40 steps · 💥 = diverged (exploded)", "✓ n = ಹೆಜ್ಜೆ n ರಲ್ಲಿ ತಲುಪಿತು · ✗ = 40 ಹೆಜ್ಜೆಗಳಲ್ಲಿ ತಲುಪಲಿಲ್ಲ · 💥 = ಅಪಸರಣ (ಸ್ಫೋಟ)", "✓ n = pasiekta žingsnyje n · ✗ = nepasiekta per 40 žingsnių · 💥 = diverguota (sprogo)"],
  ["lab1.op.ch.note", "On this toy valley and with 40 steps only 2 of the 12 combinations succeed: SGD with 0.1 and RMSprop with 0.3. That depends on the valley and on the step budget; it is not a general ranking of the optimizers.", "ಈ ಆಟಿಕೆ ಕಣಿವೆಯಲ್ಲಿ ಮತ್ತು 40 ಹೆಜ್ಜೆಗಳೊಂದಿಗೆ 12 ಸಂಯೋಜನೆಗಳಲ್ಲಿ ಕೇವಲ 2 ಯಶಸ್ವಿ: 0.1 ರೊಂದಿಗೆ SGD ಮತ್ತು 0.3 ರೊಂದಿಗೆ RMSprop. ಇದು ಕಣಿವೆ ಮತ್ತು ಹೆಜ್ಜೆ ಬಜೆಟ್ ಮೇಲೆ ಅವಲಂಬಿತ; ಇದು ಆಪ್ಟಿಮೈಜರ್‌ಗಳ ಸಾಮಾನ್ಯ ಶ್ರೇಯಾಂಕ ಅಲ್ಲ.", "Šiame žaisliniame slėnyje ir su 40 žingsnių pavyksta tik 2 iš 12 derinių: SGD su 0.1 ir RMSprop su 0.3. Tai priklauso nuo slėnio ir žingsnių biudžeto; tai nėra bendras optimizatorių reitingas."],
];
