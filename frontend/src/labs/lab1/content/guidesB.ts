import { ACTIVATIONS, chainGradient, gradients, netParamsOf, optimizerPaths, paramCount, scaleMinMax, sgdStep, SmallNet, softmax, stepsToLoss } from "../math";
import type { GuideDef } from "./types";

/** Step guides 6-10. English first, then Kannada, then Lithuanian. */
export const guidesB: Record<string, GuideDef> = {
  network: {
    goal: [
      "Follow every multiplication of one forward pass and one backward pass of the 2-2-1 network, with weights you can edit.",
      "ತಿದ್ದಬಹುದಾದ ತೂಕಗಳೊಂದಿಗೆ 2-2-1 ನೆಟ್‌ವರ್ಕ್‌ನ ಒಂದು ಮುಂದಿನ ಪಾಸ್ ಮತ್ತು ಒಂದು ಹಿಂದಿನ ಪಾಸ್‌ನ ಪ್ರತಿ ಗುಣಾಕಾರವನ್ನು ಅನುಸರಿಸಿ.",
      "Sekite kiekvieną 2-2-1 tinklo vieno tiesioginio ir vieno atgalinio sklidimo daugybą su svoriais, kuriuos galite keisti.",
    ],
    fit: [
      "Task 5. Before using a library you should see what a network really computes: the forward pass makes a guess, the backward pass tells each of the 9 numbers how to change. Training (next step) just repeats this thousands of times.",
      "ಕಾರ್ಯ 5. ಲೈಬ್ರರಿ ಬಳಸುವ ಮೊದಲು ನೆಟ್‌ವರ್ಕ್ ನಿಜವಾಗಿ ಏನನ್ನು ಲೆಕ್ಕ ಹಾಕುತ್ತದೆ ಎಂದು ನೀವು ನೋಡಬೇಕು: ಮುಂದಿನ ಪಾಸ್ ಊಹೆ ಮಾಡುತ್ತದೆ, ಹಿಂದಿನ ಪಾಸ್ 9 ಸಂಖ್ಯೆಗಳಲ್ಲಿ ಪ್ರತಿಯೊಂದಕ್ಕೂ ಹೇಗೆ ಬದಲಾಗಬೇಕು ಎಂದು ಹೇಳುತ್ತದೆ. ತರಬೇತಿ (ಮುಂದಿನ ಹಂತ) ಇದನ್ನೇ ಸಾವಿರಾರು ಬಾರಿ ಪುನರಾವರ್ತಿಸುತ್ತದೆ.",
      "5 užduotis. Prieš naudodami biblioteką turėtumėte pamatyti, ką tinklas iš tikrųjų skaičiuoja: tiesioginis sklidimas pateikia spėjimą, atgalinis – pasako, kaip turi keistis kiekvienas iš 9 skaičių. Mokymas (kitas žingsnis) tai tiesiog kartoja tūkstančius kartų.",
    ],
    keywords: [
      [["Weight", "ತೂಕ (weight)", "Svoris"], ["a number that multiplies an input; it is learned", "ಇನ್‌ಪುಟ್ ಅನ್ನು ಗುಣಿಸುವ ಸಂಖ್ಯೆ; ಇದನ್ನು ಕಲಿಯಲಾಗುತ್ತದೆ", "skaičius, dauginantis įėjimą; jis išmokstamas"]],
      [["Bias", "ಬಯಾಸ್ (bias)", "Poslinkis (bias)"], ["a weight on an input fixed to 1; shifts the threshold", "1 ಕ್ಕೆ ನಿಗದಿಯಾದ ಇನ್‌ಪುಟ್‌ನ ತೂಕ; ಮಿತಿಯನ್ನು ಸರಿಸುತ್ತದೆ", "svoris įėjimui, lygiam 1; pastumia slenkstį"]],
      [["Forward pass", "ಮುಂದಿನ ಪಾಸ್", "Tiesioginis sklidimas"], ["inputs → hidden → output: computing the guess", "ಇನ್‌ಪುಟ್‌ಗಳು → ಗುಪ್ತ → ಔಟ್‌ಪುಟ್: ಊಹೆ ಲೆಕ್ಕ ಹಾಕುವುದು", "įėjimai → paslėpti → išėjimas: spėjimo skaičiavimas"]],
      [["Backward pass", "ಹಿಂದಿನ ಪಾಸ್", "Atgalinis sklidimas"], ["the chain rule: pass the error back to get a gradient per weight", "ಸರಣಿ ನಿಯಮ: ಪ್ರತಿ ತೂಕಕ್ಕೆ ಗ್ರೇಡಿಯಂಟ್ ಪಡೆಯಲು ದೋಷವನ್ನು ಹಿಂದಕ್ಕೆ ರವಾನಿಸಿ", "grandinės taisyklė: klaida perduodama atgal, kad gautume gradientą kiekvienam svoriui"]],
    ],
    tasks: [
      ["Press “Next calculation” until the forward pass ends and write down the output (the guess).", "ಮುಂದಿನ ಪಾಸ್ ಮುಗಿಯುವವರೆಗೆ “ಮುಂದಿನ ಲೆಕ್ಕ” ಒತ್ತಿ ಮತ್ತು ಔಟ್‌ಪುಟ್ (ಊಹೆ) ಬರೆದಿಡಿ.", "Spauskite „Kitas skaičiavimas“, kol tiesioginis sklidimas baigsis, ir užsirašykite išvestį (spėjimą)."],
      ["Continue through the backward pass and find which gradient has the largest absolute value.", "ಹಿಂದಿನ ಪಾಸ್ ಮೂಲಕ ಮುಂದುವರಿಯಿರಿ ಮತ್ತು ಯಾವ ಗ್ರೇಡಿಯಂಟ್ ಅತಿ ದೊಡ್ಡ ಸಂಪೂರ್ಣ ಮೌಲ್ಯ ಹೊಂದಿದೆ ಎಂದು ಹುಡುಕಿ.", "Tęskite atgaliniu sklidimu ir raskite, kurio gradiento absoliutinė reikšmė didžiausia."],
      ["Press “Show all” and read the update lines: every new weight is old − lr · gradient.", "“ಎಲ್ಲವನ್ನೂ ತೋರಿಸಿ” ಒತ್ತಿ ಮತ್ತು ನವೀಕರಣ ಸಾಲುಗಳನ್ನು ಓದಿ: ಪ್ರತಿ ಹೊಸ ತೂಕ = ಹಳೆಯದು − lr · ಗ್ರೇಡಿಯಂಟ್.", "Spauskite „Rodyti viską“ ir perskaitykite atnaujinimo eilutes: kiekvienas naujas svoris = senas − lr · gradientas."],
      ["Press “Use the new weights and go again” three times and watch the loss for the patient change.", "“ಹೊಸ ತೂಕಗಳನ್ನು ಬಳಸಿ ಮತ್ತೆ ನಡೆಸಿ” ಅನ್ನು ಮೂರು ಬಾರಿ ಒತ್ತಿ ಮತ್ತು ರೋಗಿಯ ನಷ್ಟ ಬದಲಾಗುವುದನ್ನು ನೋಡಿ.", "Tris kartus paspauskite „Naudoti naujus svorius ir kartoti“ ir stebėkite paciento nuostolio pokytį."],
      ["Edit one weight, for example set the output neuron's w·h1 to 0, and see which later calculations change.", "ಒಂದು ತೂಕವನ್ನು ತಿದ್ದಿ, ಉದಾ. ಔಟ್‌ಪುಟ್ ನ್ಯೂರಾನ್‌ನ w·h1 ಅನ್ನು 0 ಮಾಡಿ, ಮತ್ತು ನಂತರದ ಯಾವ ಲೆಕ್ಕಗಳು ಬದಲಾಗುತ್ತವೆ ಎಂದು ನೋಡಿ.", "Pakeiskite vieną svorį, pvz., išėjimo neurono w·h1 nustatykite 0, ir pažiūrėkite, kurie vėlesni skaičiavimai pasikeičia."],
    ],
    questions: [
      {
        q: ["How many numbers (weights and biases) does the 2-2-1 network learn?", "2-2-1 ನೆಟ್‌ವರ್ಕ್ ಎಷ್ಟು ಸಂಖ್ಯೆಗಳನ್ನು (ತೂಕಗಳು ಮತ್ತು ಬಯಾಸ್‌ಗಳು) ಕಲಿಯುತ್ತದೆ?", "Kiek skaičių (svorių ir poslinkių) išmoksta 2-2-1 tinklas?"],
        options: [["5", "5", "5"], ["784", "784", "784"], ["9", "9", "9"]],
        correct: 2,
        why: ["4 hidden weights + 2 hidden biases + 2 output weights + 1 output bias = 9.", "4 ಗುಪ್ತ ತೂಕಗಳು + 2 ಗುಪ್ತ ಬಯಾಸ್‌ಗಳು + 2 ಔಟ್‌ಪುಟ್ ತೂಕಗಳು + 1 ಔಟ್‌ಪುಟ್ ಬಯಾಸ್ = 9.", "4 paslėpti svoriai + 2 paslėpti poslinkiai + 2 išėjimo svoriai + 1 išėjimo poslinkis = 9."],
        verify: () => paramCount([2, 2, 1]) === 9,
      },
      {
        q: ["In the backward pass, what does a bias gradient equal?", "ಹಿಂದಿನ ಪಾಸ್‌ನಲ್ಲಿ ಬಯಾಸ್ ಗ್ರೇಡಿಯಂಟ್ ಯಾವುದಕ್ಕೆ ಸಮ?", "Kam lygus poslinkio gradientas atgaliniame sklidime?"],
        options: [
          ["The error signal d of its neuron, because its input is always 1", "ಅದರ ನ್ಯೂರಾನ್‌ನ ದೋಷ ಸಂಕೇತ d, ಏಕೆಂದರೆ ಅದರ ಇನ್‌ಪುಟ್ ಯಾವಾಗಲೂ 1", "Savo neurono klaidos signalui d, nes jo įėjimas visada 1"],
          ["Always 0", "ಯಾವಾಗಲೂ 0", "Visada 0"],
          ["The neuron's output", "ನ್ಯೂರಾನ್‌ನ ಔಟ್‌ಪುಟ್", "Neurono išvesčiai"],
        ],
        correct: 0,
        why: ["A bias is a weight on an input fixed to 1, and a weight's gradient is d × its input, so the bias gradient is just d.", "ಬಯಾಸ್ ಎಂದರೆ 1 ಕ್ಕೆ ನಿಗದಿಯಾದ ಇನ್‌ಪುಟ್‌ನ ತೂಕ, ಮತ್ತು ತೂಕದ ಗ್ರೇಡಿಯಂಟ್ = d × ಅದರ ಇನ್‌ಪುಟ್, ಆದ್ದರಿಂದ ಬಯಾಸ್ ಗ್ರೇಡಿಯಂಟ್ ಕೇವಲ d.", "Poslinkis yra svoris įėjimui, lygiam 1, o svorio gradientas = d × jo įėjimas, todėl poslinkio gradientas tiesiog d."],
        verify: () => {
          const g = gradients(netParamsOf(new SmallNet(7)), [0.3, 0.6], 1);
          return g.gb2 === g.dOut && g.gb1[0] === g.dHid[0] && g.gb1[1] === g.dHid[1];
        },
      },
      {
        q: ["A weight has gradient +0.2 and the learning rate is 0.5. By how much does the update change it?", "ತೂಕದ ಗ್ರೇಡಿಯಂಟ್ +0.2 ಮತ್ತು ಕಲಿಕೆಯ ದರ 0.5. ನವೀಕರಣ ಅದನ್ನು ಎಷ್ಟು ಬದಲಿಸುತ್ತದೆ?", "Svorio gradientas +0.2, o mokymosi greitis 0.5. Kiek jį pakeičia atnaujinimas?"],
        options: [["+0.1", "+0.1", "+0.1"], ["−0.5", "−0.5", "−0.5"], ["−0.1", "−0.1", "−0.1"]],
        correct: 2,
        why: ["new = old − lr × gradient = old − 0.5 × 0.2 = old − 0.1. The weight moves against the gradient, because the gradient points uphill on the loss.", "ಹೊಸದು = ಹಳೆಯದು − lr × ಗ್ರೇಡಿಯಂಟ್ = ಹಳೆಯದು − 0.5 × 0.2 = ಹಳೆಯದು − 0.1. ಗ್ರೇಡಿಯಂಟ್ ನಷ್ಟದ ಮೇಲೆ ಮೇಲ್ಮುಖವಾಗಿ ತೋರಿಸುವುದರಿಂದ ತೂಕ ಗ್ರೇಡಿಯಂಟ್‌ಗೆ ವಿರುದ್ಧವಾಗಿ ಚಲಿಸುತ್ತದೆ.", "naujas = senas − lr × gradientas = senas − 0.5 × 0.2 = senas − 0.1. Svoris juda prieš gradientą, nes gradientas rodo aukštyn nuostolio paviršiumi."],
        verify: () => Math.abs(0 - 0.5 * 0.2 - -0.1) < 1e-12,
      },
    ],
    takeaways: [
      ["Forward pass: z = Σ input·weight + bias, then sigmoid; the output is read as the probability of male.", "ಮುಂದಿನ ಪಾಸ್: z = Σ ಇನ್‌ಪುಟ್·ತೂಕ + ಬಯಾಸ್, ನಂತರ ಸಿಗ್ಮಾಯ್ಡ್; ಔಟ್‌ಪುಟ್ ಅನ್ನು ಪುರುಷನ ಸಂಭವನೀಯತೆ ಎಂದು ಓದಲಾಗುತ್ತದೆ.", "Tiesioginis sklidimas: z = Σ įėjimas·svoris + poslinkis, tada sigmoidė; išvestis skaitoma kaip vyro tikimybė."],
      ["Backward pass: d_out = (out − y)·out·(1 − out) is passed back through the weights with the chain rule.", "ಹಿಂದಿನ ಪಾಸ್: d_out = (out − y)·out·(1 − out) ಅನ್ನು ಸರಣಿ ನಿಯಮದೊಂದಿಗೆ ತೂಕಗಳ ಮೂಲಕ ಹಿಂದಕ್ಕೆ ರವಾನಿಸಲಾಗುತ್ತದೆ.", "Atgalinis sklidimas: d_out = (out − y)·out·(1 − out) perduodamas atgal per svorius pagal grandinės taisyklę."],
      ["Update: new = old − learning rate × gradient. The 9 numbers are everything the network knows.", "ನವೀಕರಣ: ಹೊಸದು = ಹಳೆಯದು − ಕಲಿಕೆಯ ದರ × ಗ್ರೇಡಿಯಂಟ್. ಈ 9 ಸಂಖ್ಯೆಗಳೇ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ತಿಳಿದಿರುವ ಎಲ್ಲವೂ.", "Atnaujinimas: naujas = senas − mokymosi greitis × gradientas. Šie 9 skaičiai – viskas, ką žino tinklas."],
    ],
    mistakes: [
      ["Moving a weight in the same direction as its gradient; it must move the opposite way.", "ತೂಕವನ್ನು ಅದರ ಗ್ರೇಡಿಯಂಟ್‌ನ ಅದೇ ದಿಕ್ಕಿನಲ್ಲಿ ಚಲಿಸುವುದು; ಅದು ವಿರುದ್ಧ ದಿಕ್ಕಿನಲ್ಲಿ ಚಲಿಸಬೇಕು.", "Judinti svorį ta pačia kryptimi kaip jo gradientą; jis turi judėti priešinga kryptimi."],
      ["Forgetting the bias terms: the parameter count is 9, not 6.", "ಬಯಾಸ್ ಪದಗಳನ್ನು ಮರೆಯುವುದು: ಪ್ಯಾರಾಮೀಟರ್ ಎಣಿಕೆ 9, 6 ಅಲ್ಲ.", "Pamiršti poslinkius: parametrų skaičius yra 9, o ne 6."],
    ],
  },

  train: {
    goal: [
      "Train the network on 15 labelled patients, predict a new patient, and watch a single gradient update change the weights.",
      "15 ಲೇಬಲ್ ಮಾಡಿದ ರೋಗಿಗಳ ಮೇಲೆ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ತರಬೇತಿ ನೀಡಿ, ಹೊಸ ರೋಗಿಯನ್ನು ಊಹಿಸಿ, ಮತ್ತು ಒಂದೇ ಗ್ರೇಡಿಯಂಟ್ ನವೀಕರಣ ತೂಕಗಳನ್ನು ಬದಲಿಸುವುದನ್ನು ನೋಡಿ.",
      "Išmokykite tinklą su 15 pažymėtų pacientų, prognozuokite naują pacientą ir stebėkite, kaip vienas gradiento atnaujinimas keičia svorius.",
    ],
    fit: [
      "Training repeats the forward and backward pass for every patient, epoch after epoch. The learning rate sets the step size: too small learns slowly, too large overshoots (you meet this again in 6.3).",
      "ತರಬೇತಿ ಪ್ರತಿ ರೋಗಿಗೆ, ಎಪೋಕ್ ನಂತರ ಎಪೋಕ್, ಮುಂದಿನ ಮತ್ತು ಹಿಂದಿನ ಪಾಸ್ ಅನ್ನು ಪುನರಾವರ್ತಿಸುತ್ತದೆ. ಕಲಿಕೆಯ ದರ ಹೆಜ್ಜೆಯ ಗಾತ್ರವನ್ನು ನಿಗದಿಪಡಿಸುತ್ತದೆ: ತುಂಬಾ ಚಿಕ್ಕದು ನಿಧಾನವಾಗಿ ಕಲಿಯುತ್ತದೆ, ತುಂಬಾ ದೊಡ್ಡದು ಗುರಿ ಮೀರುತ್ತದೆ (6.3 ರಲ್ಲಿ ಇದನ್ನು ಮತ್ತೆ ಭೇಟಿಯಾಗುತ್ತೀರಿ).",
      "Mokymas kartoja tiesioginį ir atgalinį sklidimą kiekvienam pacientui, epocha po epochos. Mokymosi greitis nustato žingsnio dydį: per mažas mokosi lėtai, per didelis peršoka (su tuo vėl susitiksite 6.3).",
    ],
    keywords: [
      [["Epoch", "ಎಪೋಕ್", "Epocha"], ["one pass over all training patients", "ಎಲ್ಲಾ ತರಬೇತಿ ರೋಗಿಗಳ ಮೇಲೆ ಒಂದು ಪಾಸ್", "vienas praėjimas per visus mokymo pacientus"]],
      [["Learning rate", "ಕಲಿಕೆಯ ದರ", "Mokymosi greitis"], ["the size of each weight update", "ಪ್ರತಿ ತೂಕ ನವೀಕರಣದ ಗಾತ್ರ", "kiekvieno svorio atnaujinimo dydis"]],
      [["Loss", "ನಷ್ಟ (loss)", "Nuostolis"], ["a number saying how wrong the guesses are (here MSE)", "ಊಹೆಗಳು ಎಷ್ಟು ತಪ್ಪು ಎಂದು ಹೇಳುವ ಸಂಖ್ಯೆ (ಇಲ್ಲಿ MSE)", "skaičius, rodantis, kiek spėjimai klysta (čia MSE)"]],
      [["Decision map", "ನಿರ್ಧಾರ ನಕ್ಷೆ", "Sprendimų žemėlapis"], ["background colour: what the network says at every height and weight", "ಹಿನ್ನೆಲೆ ಬಣ್ಣ: ಪ್ರತಿ ಎತ್ತರ ಮತ್ತು ತೂಕದಲ್ಲಿ ನೆಟ್‌ವರ್ಕ್ ಏನು ಹೇಳುತ್ತದೆ", "fono spalva: ką tinklas sako kiekvienam ūgiui ir svoriui"]],
    ],
    tasks: [
      ["Press Train with the default sliders and check that training accuracy is 100% and Name 5 is female.", "ಡೀಫಾಲ್ಟ್ ಸ್ಲೈಡರ್‌ಗಳೊಂದಿಗೆ ತರಬೇತಿ ನೀಡಿ ಒತ್ತಿ ಮತ್ತು ತರಬೇತಿ ನಿಖರತೆ 100% ಮತ್ತು Name 5 ಮಹಿಳೆ ಎಂದು ಪರಿಶೀಲಿಸಿ.", "Paspauskite Mokyti su numatytaisiais slankikliais ir patikrinkite, kad mokymo tikslumas 100 %, o Name 5 yra moteris."],
      ["Set the learning rate near 0.01 and epochs near 100, train again, and see how little the loss falls.", "ಕಲಿಕೆಯ ದರವನ್ನು 0.01 ಹತ್ತಿರ ಮತ್ತು ಎಪೋಕ್‌ಗಳನ್ನು 100 ಹತ್ತಿರ ಹೊಂದಿಸಿ, ಮತ್ತೆ ತರಬೇತಿ ನೀಡಿ, ಮತ್ತು ನಷ್ಟ ಎಷ್ಟು ಕಡಿಮೆ ಇಳಿಯುತ್ತದೆ ಎಂದು ನೋಡಿ.", "Nustatykite mokymosi greitį apie 0.01, epochas apie 100, mokykite iš naujo ir pažiūrėkite, kaip menkai krenta nuostolis."],
      ["In “Predict a new patient” enter 160 cm and 56 kg after training and read P(male) and P(female).", "ತರಬೇತಿಯ ನಂತರ “ಹೊಸ ರೋಗಿಯನ್ನು ಊಹಿಸಿ” ನಲ್ಲಿ 160 cm ಮತ್ತು 56 kg ನಮೂದಿಸಿ ಮತ್ತು P(ಪುರುಷ) ಮತ್ತು P(ಮಹಿಳೆ) ಓದಿ.", "Po mokymo skiltyje „Prognozuokite naują pacientą“ įveskite 160 cm ir 56 kg ir perskaitykite P(vyras) ir P(moteris)."],
      ["Press “Do ONE update” for a patient and compare the Before and After columns and the loss line.", "ಒಬ್ಬ ರೋಗಿಗೆ “ಒಂದೇ ನವೀಕರಣ ಮಾಡಿ” ಒತ್ತಿ ಮತ್ತು ಮೊದಲು ಮತ್ತು ನಂತರದ ಕಾಲಮ್‌ಗಳನ್ನು ಹಾಗೂ ನಷ್ಟ ಸಾಲನ್ನು ಹೋಲಿಸಿ.", "Pacientui paspauskite „Atlikti VIENĄ atnaujinimą“ ir palyginkite stulpelius Prieš ir Po bei nuostolio eilutę."],
      ["Move the hill's learning rate to 0.5 and see that one step lands exactly on the minimum.", "ಬೆಟ್ಟದ ಕಲಿಕೆಯ ದರವನ್ನು 0.5 ಕ್ಕೆ ಚಲಿಸಿ ಮತ್ತು ಒಂದು ಹೆಜ್ಜೆ ನಿಖರವಾಗಿ ಕನಿಷ್ಠದ ಮೇಲೆ ಇಳಿಯುವುದನ್ನು ನೋಡಿ.", "Perkelkite kalvos mokymosi greitį į 0.5 ir pamatykite, kad vienas žingsnis nusileidžia tiksliai ant minimumo."],
    ],
    questions: [
      {
        q: ["On the hill loss w² starting at w = 4 with learning rate 0.5, where is w after one step?", "ಬೆಟ್ಟದ ನಷ್ಟ w² ನಲ್ಲಿ w = 4 ರಿಂದ ಆರಂಭಿಸಿ ಕಲಿಕೆಯ ದರ 0.5 ಇದ್ದರೆ, ಒಂದು ಹೆಜ್ಜೆಯ ನಂತರ w ಎಲ್ಲಿದೆ?", "Kalvos nuostolyje w², pradedant nuo w = 4 su mokymosi greičiu 0.5, kur yra w po vieno žingsnio?"],
        options: [["4", "4", "4"], ["−4", "−4", "−4"], ["0", "0", "0"]],
        correct: 2,
        why: ["The gradient of w² is 2w = 8, so w = 4 − 0.5 × 8 = 0: exactly the minimum.", "w² ನ ಗ್ರೇಡಿಯಂಟ್ 2w = 8, ಆದ್ದರಿಂದ w = 4 − 0.5 × 8 = 0: ನಿಖರವಾಗಿ ಕನಿಷ್ಠ.", "w² gradientas yra 2w = 8, todėl w = 4 − 0.5 × 8 = 0: tiksliai minimumas."],
        verify: () => 4 - 0.5 * 2 * 4 === 0,
      },
      {
        q: ["You press “Do ONE update” for one patient. What happens?", "ನೀವು ಒಬ್ಬ ರೋಗಿಗೆ “ಒಂದೇ ನವೀಕರಣ ಮಾಡಿ” ಒತ್ತುತ್ತೀರಿ. ಏನಾಗುತ್ತದೆ?", "Pacientui paspaudžiate „Atlikti VIENĄ atnaujinimą“. Kas nutinka?"],
        options: [
          ["Nothing changes until you press Train", "ನೀವು ತರಬೇತಿ ನೀಡಿ ಒತ್ತುವವರೆಗೆ ಏನೂ ಬದಲಾಗುವುದಿಲ್ಲ", "Niekas nesikeičia, kol nepaspausite Mokyti"],
          ["Each weight moves by −learning rate × its gradient for that patient", "ಪ್ರತಿ ತೂಕ ಆ ರೋಗಿಗೆ −ಕಲಿಕೆಯ ದರ × ಅದರ ಗ್ರೇಡಿಯಂಟ್ ನಷ್ಟು ಚಲಿಸುತ್ತದೆ", "Kiekvienas svoris pasislenka −mokymosi greitis × jo gradientas to paciento atžvilgiu"],
          ["Only the biases change", "ಬಯಾಸ್‌ಗಳು ಮಾತ್ರ ಬದಲಾಗುತ್ತವೆ", "Keičiasi tik poslinkiai"],
        ],
        correct: 1,
        why: ["That is exactly one gradient-descent step on that patient. A weight whose input is 0 (the lightest, shortest patient) has gradient 0 and does not move.", "ಅದು ಆ ರೋಗಿಯ ಮೇಲೆ ನಿಖರವಾಗಿ ಒಂದು ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಹೆಜ್ಜೆ. ಇನ್‌ಪುಟ್ 0 ಇರುವ ತೂಕ (ಅತಿ ಹಗುರ, ಅತಿ ಕುಳ್ಳ ರೋಗಿ) ಗ್ರೇಡಿಯಂಟ್ 0 ಹೊಂದಿ ಚಲಿಸುವುದಿಲ್ಲ.", "Tai lygiai vienas gradientinio nusileidimo žingsnis su tuo pacientu. Svoris, kurio įėjimas 0 (lengviausias, žemiausias pacientas), turi gradientą 0 ir nejuda."],
        verify: () => {
          const p = netParamsOf(new SmallNet(7));
          const x = [0.3, 0.6];
          const { params, grads } = sgdStep(p, x, 1, 0.5);
          return Math.abs(params.w2[0] - (p.w2[0] - 0.5 * grads.gw2[0])) < 1e-12 && Math.abs(params.w1[1][0] - (p.w1[1][0] - 0.5 * grads.gw1[1][0])) < 1e-12 && Math.abs(params.b2 - (p.b2 - 0.5 * grads.gb2)) < 1e-12;
        },
      },
      {
        q: ["A new patient is 200 cm tall. What should you remember?", "ಹೊಸ ರೋಗಿ 200 cm ಎತ್ತರ. ನೀವು ಏನನ್ನು ನೆನಪಿಡಬೇಕು?", "Naujas pacientas yra 200 cm ūgio. Ką turėtumėte prisiminti?"],
        options: [
          ["The scaled height is 1.167, outside 0 to 1, so the network is extrapolating", "ಮಾಪನ ಮಾಡಿದ ಎತ್ತರ 1.167, 0 ರಿಂದ 1 ರ ಹೊರಗೆ, ಆದ್ದರಿಂದ ನೆಟ್‌ವರ್ಕ್ ಹೊರಗಣ ಅಂದಾಜು ಮಾಡುತ್ತದೆ", "Normuotas ūgis yra 1.167, už 0–1 ribų, todėl tinklas ekstrapoliuoja"],
          ["The network is always right on new data", "ನೆಟ್‌ವರ್ಕ್ ಹೊಸ ಡೇಟಾದಲ್ಲಿ ಯಾವಾಗಲೂ ಸರಿ", "Tinklas visada teisus su naujais duomenimis"],
          ["Height can be ignored for tall patients", "ಎತ್ತರದ ರೋಗಿಗಳಿಗೆ ಎತ್ತರವನ್ನು ನಿರ್ಲಕ್ಷಿಸಬಹುದು", "Aukštų pacientų ūgį galima ignoruoti"],
        ],
        correct: 0,
        why: ["(200 − 158) / (194 − 158) = 1.167. Nobody in the training data was that tall, so the network has never seen such an input and its answer is less trustworthy.", "(200 − 158) / (194 − 158) = 1.167. ತರಬೇತಿ ಡೇಟಾದಲ್ಲಿ ಯಾರೂ ಅಷ್ಟು ಎತ್ತರ ಇರಲಿಲ್ಲ, ಆದ್ದರಿಂದ ನೆಟ್‌ವರ್ಕ್ ಇಂತಹ ಇನ್‌ಪುಟ್ ಅನ್ನು ಎಂದೂ ನೋಡಿಲ್ಲ ಮತ್ತು ಅದರ ಉತ್ತರ ಕಡಿಮೆ ನಂಬಲರ್ಹ.", "(200 − 158) / (194 − 158) = 1.167. Mokymo duomenyse niekas nebuvo tokio ūgio, todėl tinklas tokio įėjimo nematė ir jo atsakymu pasitikėti sunkiau."],
        verify: () => Math.abs(scaleMinMax(200, 158, 194) - 1.1667) < 0.0001,
      },
    ],
    takeaways: [
      ["Training = forward pass, backward pass, update, repeated for every patient and epoch; the loss falls as the colour boundary separates women and men.", "ತರಬೇತಿ = ಮುಂದಿನ ಪಾಸ್, ಹಿಂದಿನ ಪಾಸ್, ನವೀಕರಣ, ಪ್ರತಿ ರೋಗಿ ಮತ್ತು ಎಪೋಕ್‌ಗೆ ಪುನರಾವರ್ತನೆ; ಬಣ್ಣದ ಗಡಿ ಮಹಿಳೆಯರನ್ನು ಮತ್ತು ಪುರುಷರನ್ನು ಬೇರ್ಪಡಿಸುತ್ತಿದ್ದಂತೆ ನಷ್ಟ ಇಳಿಯುತ್ತದೆ.", "Mokymas = tiesioginis sklidimas, atgalinis sklidimas, atnaujinimas, kartojami kiekvienam pacientui ir epochai; nuostolis mažėja, kai spalvų riba atskiria moteris ir vyrus."],
      ["Learning rate 0.01 with 100 epochs barely learns; rate 0.5 with 1000 epochs reaches 100% accuracy and Name 5 is female (output below 0.5).", "ಕಲಿಕೆಯ ದರ 0.01 ಮತ್ತು 100 ಎಪೋಕ್‌ಗಳು ಬಹುತೇಕ ಕಲಿಯುವುದಿಲ್ಲ; ದರ 0.5 ಮತ್ತು 1000 ಎಪೋಕ್‌ಗಳು 100% ನಿಖರತೆ ತಲುಪುತ್ತವೆ ಮತ್ತು Name 5 ಮಹಿಳೆ (ಔಟ್‌ಪುಟ್ 0.5 ಕ್ಕಿಂತ ಕಡಿಮೆ).", "Mokymosi greitis 0.01 su 100 epochų vos mokosi; greitis 0.5 su 1000 epochų pasiekia 100 % tikslumą, o Name 5 yra moteris (išvestis žemiau 0.5)."],
      ["New data must be scaled with the training min and max, and may lie outside the range the network has seen.", "ಹೊಸ ಡೇಟಾವನ್ನು ತರಬೇತಿ min ಮತ್ತು max ನೊಂದಿಗೆ ಮಾಪನ ಮಾಡಬೇಕು, ಮತ್ತು ಅದು ನೆಟ್‌ವರ್ಕ್ ನೋಡಿದ ವ್ಯಾಪ್ತಿಯ ಹೊರಗಿರಬಹುದು.", "Naujus duomenis reikia normuoti mokymo min ir max, ir jie gali būti už ribų, kurias tinklas matė."],
    ],
    mistakes: [
      ["Judging the learning rate from one run: a different random start can change the picture.", "ಒಂದೇ ರನ್‌ನಿಂದ ಕಲಿಕೆಯ ದರವನ್ನು ನಿರ್ಣಯಿಸುವುದು: ಬೇರೆ ಯಾದೃಚ್ಛಿಕ ಆರಂಭ ಚಿತ್ರವನ್ನು ಬದಲಿಸಬಹುದು.", "Vertinti mokymosi greitį pagal vieną bandymą: kita atsitiktinė pradžia gali pakeisti vaizdą."],
      ["Reading a probability as certainty: 0.52 against 0.48 is almost a coin toss.", "ಸಂಭವನೀಯತೆಯನ್ನು ಖಚಿತತೆ ಎಂದು ಓದುವುದು: 0.52 ವಿರುದ್ಧ 0.48 ಬಹುತೇಕ ನಾಣ್ಯ ಚಿಮ್ಮುವಿಕೆ.", "Skaityti tikimybę kaip tikrumą: 0.52 ir 0.48 yra beveik monetos metimas."],
    ],
  },

  mnist: {
    goal: [
      "Follow one handwritten digit from 784 pixels to 10 probabilities, and count the parameters of the network.",
      "ಒಂದು ಕೈಬರಹದ ಅಂಕಿಯನ್ನು 784 ಪಿಕ್ಸೆಲ್‌ಗಳಿಂದ 10 ಸಂಭವನೀಯತೆಗಳವರೆಗೆ ಅನುಸರಿಸಿ, ಮತ್ತು ನೆಟ್‌ವರ್ಕ್‌ನ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳನ್ನು ಎಣಿಸಿ.",
      "Sekite vieną ranka rašytą skaitmenį nuo 784 pikselių iki 10 tikimybių ir suskaičiuokite tinklo parametrus.",
    ],
    fit: [
      "Task 6 uses the ideas of Task 5, only bigger: flatten the 28×28 image, pass it through dense relu layers, end with softmax and cross-entropy. Splitting the data lets you notice overfitting.",
      "ಕಾರ್ಯ 6 ಕಾರ್ಯ 5 ರ ಕಲ್ಪನೆಗಳನ್ನೇ ಬಳಸುತ್ತದೆ, ದೊಡ್ಡದಾಗಿ ಮಾತ್ರ: 28×28 ಚಿತ್ರವನ್ನು ಚಪ್ಪಟೆ ಮಾಡಿ, ದಟ್ಟ relu ಪದರಗಳ ಮೂಲಕ ಹಾಯಿಸಿ, softmax ಮತ್ತು ಕ್ರಾಸ್-ಎಂಟ್ರೊಪಿಯೊಂದಿಗೆ ಮುಗಿಸಿ. ಡೇಟಾ ವಿಭಜನೆ ಓವರ್‌ಫಿಟ್ಟಿಂಗ್ ಗಮನಿಸಲು ಅನುವು ಮಾಡುತ್ತದೆ.",
      "6 užduotis naudoja 5 užduoties idėjas, tik didesnes: išlyginkite 28×28 vaizdą, praleiskite per tankius relu sluoksnius, baikite softmax ir kryžmine entropija. Duomenų skaidymas leidžia pastebėti persimokymą.",
    ],
    keywords: [
      [["Pixel", "ಪಿಕ್ಸೆಲ್", "Pikselis"], ["one grey value from 0 to 255", "0 ರಿಂದ 255 ರವರೆಗಿನ ಒಂದು ಬೂದು ಮೌಲ್ಯ", "viena pilkumo reikšmė nuo 0 iki 255"]],
      [["Flatten", "ಚಪ್ಪಟೆ ಮಾಡುವುದು", "Išlyginimas"], ["28 rows glued into one list of 784 numbers", "28 ಸಾಲುಗಳನ್ನು 784 ಸಂಖ್ಯೆಗಳ ಒಂದು ಪಟ್ಟಿಯಾಗಿ ಅಂಟಿಸುವುದು", "28 eilučių sujungimas į vieną 784 skaičių sąrašą"]],
      [["Softmax", "Softmax", "Softmax"], ["turns ten scores into probabilities that sum to 1", "ಹತ್ತು ಅಂಕಗಳನ್ನು ಮೊತ್ತ 1 ಆಗುವ ಸಂಭವನೀಯತೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ", "dešimt įverčių paverčia tikimybėmis, kurių suma 1"]],
      [["Cross-entropy", "ಕ್ರಾಸ್-ಎಂಟ್ರೊಪಿ", "Kryžminė entropija"], ["loss = −ln(probability of the true class)", "ನಷ್ಟ = −ln(ನಿಜವಾದ ವರ್ಗದ ಸಂಭವನೀಯತೆ)", "nuostolis = −ln(tikrosios klasės tikimybė)"]],
      [["Overfitting", "ಓವರ್‌ಫಿಟ್ಟಿಂಗ್", "Persimokymas"], ["training loss keeps falling, validation loss stops improving", "ತರಬೇತಿ ನಷ್ಟ ಇಳಿಯುತ್ತಲೇ ಇರುತ್ತದೆ, ಮೌಲ್ಯಮಾಪನ ನಷ್ಟ ಸುಧಾರಿಸುವುದು ನಿಲ್ಲುತ್ತದೆ", "mokymo nuostolis toliau mažėja, validavimo nuostolis nustoja gerėti"]],
    ],
    tasks: [
      ["Hover over the digit (or focus it and use the arrow keys) and read the pixel value, the scaled value and its position in the 784-list.", "ಅಂಕಿಯ ಮೇಲೆ ಮೌಸ್ ಚಲಿಸಿ (ಅಥವಾ ಫೋಕಸ್ ಮಾಡಿ ಬಾಣದ ಕೀಲಿಗಳನ್ನು ಬಳಸಿ) ಮತ್ತು ಪಿಕ್ಸೆಲ್ ಮೌಲ್ಯ, ಮಾಪನ ಮಾಡಿದ ಮೌಲ್ಯ ಮತ್ತು 784-ಪಟ್ಟಿಯಲ್ಲಿ ಅದರ ಸ್ಥಾನವನ್ನು ಓದಿ.", "Užveskite pelę ant skaitmens (arba sufokusuokite jį ir naudokite rodykles) ir perskaitykite pikselio reikšmę, normuotą reikšmę ir vietą 784 sąraše."],
      ["Move the threshold slider to 127 and read how many pixels are brighter.", "ಮಿತಿ ಸ್ಲೈಡರ್ ಅನ್ನು 127 ಕ್ಕೆ ಚಲಿಸಿ ಮತ್ತು ಎಷ್ಟು ಪಿಕ್ಸೆಲ್‌ಗಳು ಪ್ರಕಾಶಮಾನ ಎಂದು ಓದಿ.", "Perkelkite slenksčio slankiklį į 127 ir perskaitykite, kiek pikselių ryškesni."],
      ["In “Build your own architecture” remove layers until you have 784-128-10 and check 101 770 parameters.", "“ನಿಮ್ಮದೇ ವಾಸ್ತುಶಿಲ್ಪವನ್ನು ನಿರ್ಮಿಸಿ” ನಲ್ಲಿ 784-128-10 ಆಗುವವರೆಗೆ ಪದರಗಳನ್ನು ತೆಗೆಯಿರಿ ಮತ್ತು 101 770 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.", "Skiltyje „Sukurkite savo architektūrą“ šalinkite sluoksnius, kol liks 784-128-10, ir patikrinkite 101 770 parametrų."],
      ["In the softmax calculator raise the logit of a wrong digit above the true one and watch the loss grow.", "softmax ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ನಲ್ಲಿ ತಪ್ಪು ಅಂಕಿಯ ಲಾಜಿಟ್ ಅನ್ನು ನಿಜವಾದುದಕ್ಕಿಂತ ಮೇಲೆ ಏರಿಸಿ ಮತ್ತು ನಷ್ಟ ಬೆಳೆಯುವುದನ್ನು ನೋಡಿ.", "Softmax skaičiuotuve pakelkite klaidingo skaitmens logitą virš tikrojo ir stebėkite, kaip auga nuostolis."],
      ["Draw a digit, read its ink pixel count and bounding box, then run the UNTRAINED network and note that its answer says nothing about your drawing.", "ಒಂದು ಅಂಕಿ ಬರೆಯಿರಿ, ಅದರ ಇಂಕ್ ಪಿಕ್ಸೆಲ್ ಎಣಿಕೆ ಮತ್ತು ಸುತ್ತುವರಿದ ಪೆಟ್ಟಿಗೆಯನ್ನು ಓದಿ, ನಂತರ ತರಬೇತಿ ಇಲ್ಲದ ನೆಟ್‌ವರ್ಕ್ ಅನ್ನು ಚಲಾಯಿಸಿ ಮತ್ತು ಅದರ ಉತ್ತರ ನಿಮ್ಮ ಚಿತ್ರದ ಬಗ್ಗೆ ಏನನ್ನೂ ಹೇಳುವುದಿಲ್ಲ ಎಂದು ಗಮನಿಸಿ.", "Nupieškite skaitmenį, perskaitykite rašalo pikselių skaičių ir apribojantį stačiakampį, tada paleiskite NEMOKYTĄ tinklą ir pastebėkite, kad jo atsakymas nieko nesako apie jūsų piešinį."],
    ],
    questions: [
      {
        q: ["How many parameters has a 784-128-10 network?", "784-128-10 ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ?", "Kiek parametrų turi 784-128-10 tinklas?"],
        options: [
          ["784 + 128 + 10 = 922", "784 + 128 + 10 = 922", "784 + 128 + 10 = 922"],
          ["784 × 128 + 128 + 128 × 10 + 10 = 101 770", "784 × 128 + 128 + 128 × 10 + 10 = 101 770", "784 × 128 + 128 + 128 × 10 + 10 = 101 770"],
          ["128 × 10 = 1 280", "128 × 10 = 1 280", "128 × 10 = 1 280"],
        ],
        correct: 1,
        why: ["Every layer has inputs × neurons weights plus one bias per neuron: 100 352 + 128 + 1 280 + 10 = 101 770. The lab's big model, 784-512-256-128-64-10, has 575 050.", "ಪ್ರತಿ ಪದರದಲ್ಲಿ ಇನ್‌ಪುಟ್‌ಗಳು × ನ್ಯೂರಾನ್‌ಗಳು ತೂಕಗಳು ಮತ್ತು ಪ್ರತಿ ನ್ಯೂರಾನ್‌ಗೆ ಒಂದು ಬಯಾಸ್: 100 352 + 128 + 1 280 + 10 = 101 770. ಲ್ಯಾಬ್‌ನ ದೊಡ್ಡ ಮಾಡೆಲ್ 784-512-256-128-64-10 ಗೆ 575 050 ಇವೆ.", "Kiekvienas sluoksnis turi įėjimai × neuronai svorių ir po poslinkį kiekvienam neuronui: 100 352 + 128 + 1 280 + 10 = 101 770. Didelis laboratorijos modelis 784-512-256-128-64-10 turi 575 050."],
        verify: () => paramCount([784, 128, 10]) === 101770 && 784 * 128 === 100352,
      },
      {
        q: ["A network gives the true digit a probability of 0.1 (a plain guess among 10). What is the cross-entropy loss?", "ನೆಟ್‌ವರ್ಕ್ ನಿಜವಾದ ಅಂಕಿಗೆ 0.1 ಸಂಭವನೀಯತೆ ನೀಡುತ್ತದೆ (10 ರಲ್ಲಿ ಸರಳ ಊಹೆ). ಕ್ರಾಸ್-ಎಂಟ್ರೊಪಿ ನಷ್ಟ ಎಷ್ಟು?", "Tinklas tikrajam skaitmeniui suteikia tikimybę 0.1 (paprastas spėjimas iš 10). Koks kryžminės entropijos nuostolis?"],
        options: [["0", "0", "0"], ["10", "10", "10"], ["2.30", "2.30", "2.30"]],
        correct: 2,
        why: ["loss = −ln(0.1) = 2.30. A perfect answer (probability 1) would give 0, and a confident wrong answer gives a much larger loss.", "ನಷ್ಟ = −ln(0.1) = 2.30. ಪರಿಪೂರ್ಣ ಉತ್ತರ (ಸಂಭವನೀಯತೆ 1) 0 ನೀಡುತ್ತದೆ, ಮತ್ತು ವಿಶ್ವಾಸದ ತಪ್ಪು ಉತ್ತರ ಇನ್ನೂ ದೊಡ್ಡ ನಷ್ಟ ನೀಡುತ್ತದೆ.", "nuostolis = −ln(0.1) = 2.30. Tobulas atsakymas (tikimybė 1) duotų 0, o užtikrintas klaidingas – daug didesnį nuostolį."],
        verify: () => Math.abs(-Math.log(0.1) - 2.3026) < 0.0001,
      },
      {
        q: ["The page runs your drawing through an UNTRAINED network. What does its answer mean?", "ಪುಟ ನಿಮ್ಮ ಚಿತ್ರವನ್ನು ತರಬೇತಿ ಇಲ್ಲದ ನೆಟ್‌ವರ್ಕ್ ಮೂಲಕ ಹಾಯಿಸುತ್ತದೆ. ಅದರ ಉತ್ತರದ ಅರ್ಥವೇನು?", "Puslapis paleidžia jūsų piešinį per NEMOKYTĄ tinklą. Ką reiškia jo atsakymas?"],
        options: [
          ["Nothing: the weights are random, so the output carries no information about the drawing", "ಏನೂ ಇಲ್ಲ: ತೂಕಗಳು ಯಾದೃಚ್ಛಿಕ, ಆದ್ದರಿಂದ ಔಟ್‌ಪುಟ್ ಚಿತ್ರದ ಬಗ್ಗೆ ಯಾವ ಮಾಹಿತಿಯನ್ನೂ ಹೊಂದಿಲ್ಲ", "Nieko: svoriai atsitiktiniai, todėl išvestis neneša informacijos apie piešinį"],
          ["It is the digit you drew", "ಇದು ನೀವು ಬರೆದ ಅಂಕಿ", "Tai skaitmuo, kurį nupiešėte"],
          ["It is a prediction with 98.16% accuracy", "ಇದು 98.16% ನಿಖರತೆಯ ಭವಿಷ್ಯ ನುಡಿ", "Tai 98.16 % tikslumo prognozė"],
        ],
        correct: 0,
        why: ["No MNIST classifier is trained in this page. The network shows the real forward pass with random weights; only training on 60 000 images turns it into a 98.16% classifier.", "ಈ ಪುಟದಲ್ಲಿ ಯಾವುದೇ MNIST ವರ್ಗೀಕರಣಕಾರಕ್ಕೆ ತರಬೇತಿ ನೀಡಿಲ್ಲ. ನೆಟ್‌ವರ್ಕ್ ಯಾದೃಚ್ಛಿಕ ತೂಕಗಳೊಂದಿಗೆ ನಿಜವಾದ ಫಾರ್ವರ್ಡ್ ಪಾಸ್ ತೋರಿಸುತ್ತದೆ; 60 000 ಚಿತ್ರಗಳ ತರಬೇತಿ ಮಾತ್ರ ಅದನ್ನು 98.16% ವರ್ಗೀಕರಣಕಾರನನ್ನಾಗಿ ಮಾಡುತ್ತದೆ.", "Šiame puslapyje joks MNIST klasifikatorius nėra mokomas. Tinklas rodo tikrą tiesioginį sklidimą su atsitiktiniais svoriais; tik mokymas su 60 000 vaizdų paverčia jį 98.16 % klasifikatoriumi."],
      },
    ],
    takeaways: [
      ["One picture = 28 × 28 = 784 numbers from 0 to 255; dividing by 255 scales them to 0-1.", "ಒಂದು ಚಿತ್ರ = 28 × 28 = 784 ಸಂಖ್ಯೆಗಳು 0 ರಿಂದ 255; 255 ರಿಂದ ಭಾಗಿಸಿದರೆ ಅವು 0-1 ಕ್ಕೆ ಮಾಪನವಾಗುತ್ತವೆ.", "Vienas paveikslas = 28 × 28 = 784 skaičiai nuo 0 iki 255; padalijus iš 255 jie normuojami į 0-1."],
      ["The best model 784-512-256-128-64-10 has 575 050 parameters; softmax outputs 10 probabilities that sum to 1.", "ಅತ್ಯುತ್ತಮ ಮಾಡೆಲ್ 784-512-256-128-64-10 ಗೆ 575 050 ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ; softmax ಮೊತ್ತ 1 ಆಗುವ 10 ಸಂಭವನೀಯತೆಗಳನ್ನು ನೀಡುತ್ತದೆ.", "Geriausias modelis 784-512-256-128-64-10 turi 575 050 parametrų; softmax išveda 10 tikimybių, kurių suma 1."],
      ["Only training turns random weights into a 98.16% classifier; validation loss reveals overfitting (best around epoch 4).", "ತರಬೇತಿ ಮಾತ್ರ ಯಾದೃಚ್ಛಿಕ ತೂಕಗಳನ್ನು 98.16% ವರ್ಗೀಕರಣಕಾರನನ್ನಾಗಿ ಮಾಡುತ್ತದೆ; ಮೌಲ್ಯಮಾಪನ ನಷ್ಟ ಓವರ್‌ಫಿಟ್ಟಿಂಗ್ ಬಹಿರಂಗಪಡಿಸುತ್ತದೆ (ಎಪೋಕ್ 4 ರ ಸುಮಾರಿಗೆ ಉತ್ತಮ).", "Tik mokymas paverčia atsitiktinius svorius 98.16 % klasifikatoriumi; validavimo nuostolis atskleidžia persimokymą (geriausia apie 4-ąją epochą)."],
    ],
    mistakes: [
      ["Thinking a network with random weights can recognise digits.", "ಯಾದೃಚ್ಛಿಕ ತೂಕಗಳ ನೆಟ್‌ವರ್ಕ್ ಅಂಕಿಗಳನ್ನು ಗುರುತಿಸಬಲ್ಲದು ಎಂದು ಭಾವಿಸುವುದು.", "Manyti, kad tinklas su atsitiktiniais svoriais gali atpažinti skaitmenis."],
      ["Choosing the model on the test set and then reporting that same score as if it were fresh.", "ಮಾಡೆಲ್ ಅನ್ನು ಪರೀಕ್ಷಾ ಸೆಟ್‌ನಲ್ಲಿ ಆರಿಸಿ ಅದೇ ಅಂಕವನ್ನು ಹೊಸದೆಂಬಂತೆ ವರದಿ ಮಾಡುವುದು.", "Pasirinkti modelį pagal testavimo rinkinį ir tą patį įvertį pateikti tarsi naują."],
    ],
  },

  activations: {
    goal: [
      "Understand what an activation function does, how its gradient behaves, and which one to choose in each layer.",
      "ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆ ಏನು ಮಾಡುತ್ತದೆ, ಅದರ ಗ್ರೇಡಿಯಂಟ್ ಹೇಗೆ ವರ್ತಿಸುತ್ತದೆ, ಮತ್ತು ಪ್ರತಿ ಪದರದಲ್ಲಿ ಯಾವುದನ್ನು ಆರಿಸಬೇಕು ಎಂದು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.",
      "Suprasti, ką daro aktyvacijos funkcija, kaip elgiasi jos gradientas ir kurią rinktis kiekvienam sluoksniui.",
    ],
    fit: [
      "Every neuron of Tasks 5-6 ends with an activation. Without it the network collapses into one linear formula, and with the wrong one gradients vanish. This step prepares the optimizer comparison.",
      "ಕಾರ್ಯಗಳು 5-6 ರ ಪ್ರತಿ ನ್ಯೂರಾನ್ ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆಯೊಂದಿಗೆ ಕೊನೆಗೊಳ್ಳುತ್ತದೆ. ಅದಿಲ್ಲದೆ ನೆಟ್‌ವರ್ಕ್ ಒಂದೇ ರೇಖೀಯ ಸೂತ್ರಕ್ಕೆ ಕುಸಿಯುತ್ತದೆ, ಮತ್ತು ತಪ್ಪಾದುದರಿಂದ ಗ್ರೇಡಿಯಂಟ್‌ಗಳು ಕಣ್ಮರೆಯಾಗುತ್ತವೆ. ಈ ಹಂತ ಆಪ್ಟಿಮೈಜರ್ ಹೋಲಿಕೆಗೆ ಸಿದ್ಧಗೊಳಿಸುತ್ತದೆ.",
      "Kiekvienas 5-6 užduočių neuronas baigiasi aktyvacija. Be jos tinklas subyra į vieną tiesinę formulę, o su netinkama nyksta gradientai. Šis žingsnis ruošia optimizatorių palyginimą.",
    ],
    keywords: [
      [["Activation", "ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆ", "Aktyvacija"], ["the bend applied after w·x + b", "w·x + b ನಂತರ ಅನ್ವಯಿಸುವ ಬಾಗು", "lenkimas, taikomas po w·x + b"]],
      [["Gradient (slope)", "ಗ್ರೇಡಿಯಂಟ್ (ಇಳಿಜಾರು)", "Gradientas (nuolydis)"], ["how fast f changes; the signal backpropagation passes on", "f ಎಷ್ಟು ವೇಗವಾಗಿ ಬದಲಾಗುತ್ತದೆ; ಬ್ಯಾಕ್‌ಪ್ರಾಪಗೇಷನ್ ರವಾನಿಸುವ ಸಂಕೇತ", "kaip greitai kinta f; signalas, kurį perduoda atgalinis sklidimas"]],
      [["Saturation", "ಸ್ಯಾಚುರೇಶನ್", "Įsisotinimas"], ["the flat ends of sigmoid/tanh where the slope is almost 0", "sigmoid/tanh ನ ಚಪ್ಪಟೆ ತುದಿಗಳು, ಅಲ್ಲಿ ಇಳಿಜಾರು ಬಹುತೇಕ 0", "sigmoid/tanh plokšti galai, kur nuolydis beveik 0"]],
      [["Vanishing gradient", "ಕಣ್ಮರೆಯಾಗುವ ಗ್ರೇಡಿಯಂಟ್", "Nykstantis gradientas"], ["gradients shrinking layer by layer in deep networks", "ಆಳವಾದ ನೆಟ್‌ವರ್ಕ್‌ಗಳಲ್ಲಿ ಗ್ರೇಡಿಯಂಟ್‌ಗಳು ಪದರದಿಂದ ಪದರಕ್ಕೆ ಕುಗ್ಗುವುದು", "gradientai mažėja sluoksnis po sluoksnio giliuose tinkluose"]],
    ],
    tasks: [
      ["Select sigmoid, slide x to 6 and read that the gradient is almost 0.", "sigmoid ಆರಿಸಿ, x ಅನ್ನು 6 ಕ್ಕೆ ಜಾರಿಸಿ ಮತ್ತು ಗ್ರೇಡಿಯಂಟ್ ಬಹುತೇಕ 0 ಎಂದು ಓದಿ.", "Pasirinkite sigmoid, nuslinkite x iki 6 ir perskaitykite, kad gradientas beveik 0."],
      ["Select relu and slide x to −2 and then to +2: compare the two gradients.", "relu ಆರಿಸಿ ಮತ್ತು x ಅನ್ನು −2 ಕ್ಕೆ, ನಂತರ +2 ಕ್ಕೆ ಜಾರಿಸಿ: ಎರಡು ಗ್ರೇಡಿಯಂಟ್‌ಗಳನ್ನು ಹೋಲಿಸಿ.", "Pasirinkite relu ir nuslinkite x į −2, o paskui į +2: palyginkite du gradientus."],
      ["In “One neuron” move b until the orange dot sits on the steep part of the curve.", "“ಒಂದು ನ್ಯೂರಾನ್” ನಲ್ಲಿ ಕಿತ್ತಳೆ ಚುಕ್ಕೆ ವಕ್ರರೇಖೆಯ ಕಡಿದಾದ ಭಾಗದಲ್ಲಿ ಕೂರುವವರೆಗೆ b ಅನ್ನು ಚಲಿಸಿ.", "Skiltyje „Vienas neuronas“ judinkite b, kol oranžinis taškas atsidurs staigioje kreivės dalyje."],
      ["In the vanishing-gradient demo set 10 layers and x = 1 and compare how much gradient each activation keeps.", "ಕಣ್ಮರೆಯಾಗುವ ಗ್ರೇಡಿಯಂಟ್ ಡೆಮೊದಲ್ಲಿ 10 ಪದರಗಳು ಮತ್ತು x = 1 ಹೊಂದಿಸಿ ಮತ್ತು ಪ್ರತಿ ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆ ಎಷ್ಟು ಗ್ರೇಡಿಯಂಟ್ ಉಳಿಸಿಕೊಳ್ಳುತ್ತದೆ ಎಂದು ಹೋಲಿಸಿ.", "Nykstančio gradiento demonstracijoje nustatykite 10 sluoksnių ir x = 1 ir palyginkite, kiek gradiento išlaiko kiekviena aktyvacija."],
      ["Finish the challenge “which activation would you pick?” and read every reason.", "“ನೀವು ಯಾವ ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆಯನ್ನು ಆರಿಸುತ್ತೀರಿ?” ಸವಾಲು ಮುಗಿಸಿ ಮತ್ತು ಪ್ರತಿ ಕಾರಣವನ್ನು ಓದಿ.", "Baikite iššūkį „kurią aktyvaciją rinktumėtės?“ ir perskaitykite kiekvieną priežastį."],
    ],
    questions: [
      {
        q: ["What is the largest slope the sigmoid function ever has?", "sigmoid ಕ್ರಿಯೆಗೆ ಇರುವ ಅತಿ ದೊಡ್ಡ ಇಳಿಜಾರು ಎಷ್ಟು?", "Koks didžiausias sigmoid funkcijos nuolydis?"],
        options: [["1", "1", "1"], ["0.5", "0.5", "0.5"], ["0.25", "0.25", "0.25"]],
        correct: 2,
        why: ["The slope sigmoid(x)(1 − sigmoid(x)) is largest at x = 0, where it is 0.5 × 0.5 = 0.25, and it falls towards 0 on both sides.", "ಇಳಿಜಾರು sigmoid(x)(1 − sigmoid(x)) x = 0 ರಲ್ಲಿ ಅತಿ ದೊಡ್ಡದು, ಅಲ್ಲಿ 0.5 × 0.5 = 0.25, ಮತ್ತು ಎರಡೂ ಬದಿಗಳಲ್ಲಿ 0 ಕಡೆಗೆ ಇಳಿಯುತ್ತದೆ.", "Nuolydis sigmoid(x)(1 − sigmoid(x)) didžiausias ties x = 0, kur jis 0.5 × 0.5 = 0.25, ir į abi puses krinta link 0."],
        verify: () => {
          let mx = 0;
          for (let x = -10; x <= 10; x += 0.01) mx = Math.max(mx, ACTIVATIONS.sigmoid.d(x));
          return Math.abs(ACTIVATIONS.sigmoid.d(0) - 0.25) < 1e-12 && mx <= 0.25 + 1e-12;
        },
      },
      {
        q: ["After 10 layers with x = 1 (weights taken as 1), which activation passes the gradient on most strongly?", "x = 1 ರೊಂದಿಗೆ 10 ಪದರಗಳ ನಂತರ (ತೂಕಗಳು 1 ಎಂದು ಪರಿಗಣಿಸಿ), ಯಾವ ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆ ಗ್ರೇಡಿಯಂಟ್ ಅನ್ನು ಅತಿ ಬಲವಾಗಿ ರವಾನಿಸುತ್ತದೆ?", "Po 10 sluoksnių su x = 1 (svoriai laikomi 1), kuri aktyvacija stipriausiai perduoda gradientą?"],
        options: [["sigmoid", "sigmoid", "sigmoid"], ["tanh", "tanh", "tanh"], ["relu", "relu", "relu"]],
        correct: 2,
        why: ["relu keeps exactly 1 (slope 1 for x > 0), tanh keeps 0.42¹⁰ ≈ 1.7×10⁻⁴ and sigmoid 0.197¹⁰ ≈ 8.6×10⁻⁸.", "relu ನಿಖರವಾಗಿ 1 ಉಳಿಸಿಕೊಳ್ಳುತ್ತದೆ (x > 0 ಗೆ ಇಳಿಜಾರು 1), tanh 0.42¹⁰ ≈ 1.7×10⁻⁴ ಮತ್ತು sigmoid 0.197¹⁰ ≈ 8.6×10⁻⁸.", "relu išlaiko lygiai 1 (nuolydis 1, kai x > 0), tanh – 0.42¹⁰ ≈ 1.7×10⁻⁴, o sigmoid – 0.197¹⁰ ≈ 8.6×10⁻⁸."],
        verify: () => {
          const c = (a: "sigmoid" | "tanh" | "relu") => chainGradient(a, 1, 10);
          return c("relu") === 1 && c("relu") > c("tanh") && c("tanh") > c("sigmoid") && Math.abs(c("tanh") - 1.7e-4) < 0.05e-4 && Math.abs(c("sigmoid") - 8.6e-8) < 0.1e-8;
        },
      },
      {
        q: ["Which function turns ten raw scores into probabilities that sum to 1?", "ಹತ್ತು ಕಚ್ಚಾ ಅಂಕಗಳನ್ನು ಮೊತ್ತ 1 ಆಗುವ ಸಂಭವನೀಯತೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುವ ಕ್ರಿಯೆ ಯಾವುದು?", "Kuri funkcija dešimt neapdorotų įverčių paverčia tikimybėmis, kurių suma 1?"],
        options: [["softmax", "softmax", "softmax"], ["relu", "relu", "relu"], ["tanh", "tanh", "tanh"]],
        correct: 0,
        why: ["softmax makes the outputs positive and divides by their total. relu and tanh act on each number alone, so their outputs do not add up to 1.", "softmax ಔಟ್‌ಪುಟ್‌ಗಳನ್ನು ಧನಾತ್ಮಕವಾಗಿಸಿ ಅವುಗಳ ಒಟ್ಟು ಮೊತ್ತದಿಂದ ಭಾಗಿಸುತ್ತದೆ. relu ಮತ್ತು tanh ಪ್ರತಿ ಸಂಖ್ಯೆಯ ಮೇಲೆ ಒಂಟಿಯಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತವೆ, ಆದ್ದರಿಂದ ಅವುಗಳ ಔಟ್‌ಪುಟ್‌ಗಳ ಮೊತ್ತ 1 ಆಗುವುದಿಲ್ಲ.", "softmax padaro išvestis teigiamas ir dalija iš jų sumos. relu ir tanh veikia kiekvieną skaičių atskirai, todėl jų išvesčių suma nėra 1."],
        verify: () => Math.abs(softmax([-1, -1, 0, -1, -2, -1, -2, 4, 0, 1]).reduce((a, b) => a + b, 0) - 1) < 1e-12,
      },
    ],
    takeaways: [
      ["Sigmoid squeezes to 0…1 (slope ≤ 0.25), tanh to −1…1 (slope ≤ 1), relu is max(0, x) (slope 1 for x > 0).", "ಸಿಗ್ಮಾಯ್ಡ್ 0…1 ಕ್ಕೆ ಅದುಮುತ್ತದೆ (ಇಳಿಜಾರು ≤ 0.25), tanh −1…1 ಕ್ಕೆ (ಇಳಿಜಾರು ≤ 1), relu max(0, x) (x > 0 ಗೆ ಇಳಿಜಾರು 1).", "Sigmoidė suspaudžia į 0…1 (nuolydis ≤ 0.25), tanh – į −1…1 (nuolydis ≤ 1), relu yra max(0, x) (nuolydis 1, kai x > 0)."],
      ["Sigmoid and tanh saturate: where the slope is near 0 the weights barely learn, and many layers multiply these small slopes.", "ಸಿಗ್ಮಾಯ್ಡ್ ಮತ್ತು tanh ಸ್ಯಾಚುರೇಟ್ ಆಗುತ್ತವೆ: ಇಳಿಜಾರು 0 ಹತ್ತಿರ ಇರುವಲ್ಲಿ ತೂಕಗಳು ಬಹುತೇಕ ಕಲಿಯುವುದಿಲ್ಲ, ಮತ್ತು ಹಲವು ಪದರಗಳು ಈ ಚಿಕ್ಕ ಇಳಿಜಾರುಗಳನ್ನು ಗುಣಿಸುತ್ತವೆ.", "Sigmoidė ir tanh įsisotina: kur nuolydis arti 0, svoriai vos mokosi, o daug sluoksnių sudaugina šiuos mažus nuolydžius."],
      ["Rule of thumb: relu in hidden layers, sigmoid for yes/no, softmax for several classes, no activation for a free real number.", "ಅಂಗೈ ನಿಯಮ: ಗುಪ್ತ ಪದರಗಳಲ್ಲಿ relu, ಹೌದು/ಇಲ್ಲಕ್ಕೆ sigmoid, ಹಲವು ವರ್ಗಗಳಿಗೆ softmax, ಮುಕ್ತ ವಾಸ್ತವ ಸಂಖ್ಯೆಗೆ ಸಕ್ರಿಯಗೊಳಿಸುವ ಕ್ರಿಯೆ ಇಲ್ಲ.", "Nykščio taisyklė: relu paslėptuose sluoksniuose, sigmoid taip/ne atvejui, softmax kelioms klasėms, jokios aktyvacijos laisvam realiam skaičiui."],
    ],
    mistakes: [
      ["Using sigmoid in every layer of a deep network.", "ಆಳವಾದ ನೆಟ್‌ವರ್ಕ್‌ನ ಪ್ರತಿ ಪದರದಲ್ಲಿ sigmoid ಬಳಸುವುದು.", "Naudoti sigmoid kiekviename gilaus tinklo sluoksnyje."],
      ["Forgetting that a relu neuron with z < 0 has gradient 0 and can “die”.", "z < 0 ಇರುವ relu ನ್ಯೂರಾನ್ ಗ್ರೇಡಿಯಂಟ್ 0 ಹೊಂದಿ “ಸಾಯಬಹುದು” ಎಂಬುದನ್ನು ಮರೆಯುವುದು.", "Pamiršti, kad relu neuronas, kai z < 0, turi gradientą 0 ir gali „numirti“."],
    ],
  },

  optimizers: {
    goal: [
      "Compare SGD, RMSprop and Adam on the same valley and learn why the learning rate matters more than the optimizer's name.",
      "ಒಂದೇ ಕಣಿವೆಯಲ್ಲಿ SGD, RMSprop ಮತ್ತು Adam ಅನ್ನು ಹೋಲಿಸಿ ಮತ್ತು ಆಪ್ಟಿಮೈಜರ್‌ನ ಹೆಸರಿಗಿಂತ ಕಲಿಕೆಯ ದರ ಏಕೆ ಹೆಚ್ಚು ಮುಖ್ಯ ಎಂದು ತಿಳಿಯಿರಿ.",
      "Palyginkite SGD, RMSprop ir Adam tame pačiame slėnyje ir sužinokite, kodėl mokymosi greitis svarbesnis už optimizatoriaus pavadinimą.",
    ],
    fit: [
      "In 6.3 the lab changes one thing, the optimizer and its rate, and measures MNIST accuracy. The toy valley shows the same behaviour in 2-D, so you can see why SGD needs large rates and Adam collapses at 0.1.",
      "6.3 ರಲ್ಲಿ ಲ್ಯಾಬ್ ಒಂದೇ ವಿಷಯವನ್ನು, ಆಪ್ಟಿಮೈಜರ್ ಮತ್ತು ಅದರ ದರವನ್ನು, ಬದಲಿಸಿ MNIST ನಿಖರತೆಯನ್ನು ಅಳೆಯುತ್ತದೆ. ಆಟಿಕೆ ಕಣಿವೆ ಅದೇ ವರ್ತನೆಯನ್ನು 2-D ಯಲ್ಲಿ ತೋರಿಸುತ್ತದೆ, ಆದ್ದರಿಂದ SGD ಗೆ ದೊಡ್ಡ ದರಗಳು ಏಕೆ ಬೇಕು ಮತ್ತು Adam 0.1 ನಲ್ಲಿ ಏಕೆ ಕುಸಿಯುತ್ತದೆ ಎಂದು ನೋಡಬಹುದು.",
      "6.3 laboratorija keičia vieną dalyką – optimizatorių ir jo greitį – ir matuoja MNIST tikslumą. Žaislinis slėnis rodo tą patį elgesį 2-D, todėl galite pamatyti, kodėl SGD reikia didelių greičių, o Adam žlunga ties 0.1.",
    ],
    keywords: [
      [["Optimizer", "ಆಪ್ಟಿಮೈಜರ್", "Optimizatorius"], ["the rule that turns a gradient into a weight update", "ಗ್ರೇಡಿಯಂಟ್ ಅನ್ನು ತೂಕ ನವೀಕರಣವಾಗಿ ಪರಿವರ್ತಿಸುವ ನಿಯಮ", "taisyklė, paverčianti gradientą svorio atnaujinimu"]],
      [["SGD", "SGD", "SGD"], ["step = learning rate × gradient", "ಹೆಜ್ಜೆ = ಕಲಿಕೆಯ ದರ × ಗ್ರೇಡಿಯಂಟ್", "žingsnis = mokymosi greitis × gradientas"]],
      [["RMSprop", "RMSprop", "RMSprop"], ["divides the step by a running average of gradient size", "ಗ್ರೇಡಿಯಂಟ್ ಗಾತ್ರದ ಚಲಿಸುವ ಸರಾಸರಿಯಿಂದ ಹೆಜ್ಜೆಯನ್ನು ಭಾಗಿಸುತ್ತದೆ", "žingsnį dalija iš slenkamojo gradiento dydžio vidurkio"]],
      [["Adam", "Adam", "Adam"], ["momentum plus RMSprop scaling; default rate 0.001", "ಆವೇಗ + RMSprop ಮಾಪನ; ಡೀಫಾಲ್ಟ್ ದರ 0.001", "judesio kiekis + RMSprop mastelis; numatytasis greitis 0.001"]],
      [["Divergence", "ಅಪಸರಣ", "Divergavimas"], ["the loss explodes because the step is too large", "ಹೆಜ್ಜೆ ತುಂಬಾ ದೊಡ್ಡದಾಗಿರುವುದರಿಂದ ನಷ್ಟ ಸ್ಫೋಟಿಸುತ್ತದೆ", "nuostolis sprogsta, nes žingsnis per didelis"]],
    ],
    tasks: [
      ["Press ▶ Animate with the default slider and watch which of the three paths reaches the centre first.", "ಡೀಫಾಲ್ಟ್ ಸ್ಲೈಡರ್‌ನೊಂದಿಗೆ ▶ ಅನಿಮೇಟ್ ಮಾಡಿ ಒತ್ತಿ ಮತ್ತು ಮೂರು ಮಾರ್ಗಗಳಲ್ಲಿ ಯಾವುದು ಮೊದಲು ಕೇಂದ್ರ ತಲುಪುತ್ತದೆ ಎಂದು ನೋಡಿ.", "Paspauskite ▶ Animuoti su numatytuoju slankikliu ir stebėkite, kuris iš trijų kelių pirmas pasiekia centrą."],
      ["Move the learning rate to the far right and note which optimizer diverges.", "ಕಲಿಕೆಯ ದರವನ್ನು ಬಲದ ತುದಿಗೆ ಚಲಿಸಿ ಮತ್ತು ಯಾವ ಆಪ್ಟಿಮೈಜರ್ ಅಪಸರಣವಾಗುತ್ತದೆ ಎಂದು ಗಮನಿಸಿ.", "Perkelkite mokymosi greitį į dešinį kraštą ir pastebėkite, kuris optimizatorius diverguoja."],
      ["In the challenge pick SGD with 0.1 and press Run: it reaches loss < 0.01 at step 33.", "ಸವಾಲಿನಲ್ಲಿ 0.1 ರೊಂದಿಗೆ SGD ಆರಿಸಿ ಮತ್ತು ರನ್ ಒತ್ತಿ: ಅದು ಹೆಜ್ಜೆ 33 ರಲ್ಲಿ ನಷ್ಟ < 0.01 ತಲುಪುತ್ತದೆ.", "Iššūkyje pasirinkite SGD su 0.1 ir spauskite Paleisti: nuostolis < 0.01 pasiekiamas žingsnyje 33."],
      ["Find the second winning combination (RMSprop with 0.3, step 16), then reveal the table to check.", "ಎರಡನೇ ಗೆಲ್ಲುವ ಸಂಯೋಜನೆಯನ್ನು ಹುಡುಕಿ (0.3 ರೊಂದಿಗೆ RMSprop, ಹೆಜ್ಜೆ 16), ನಂತರ ಪರಿಶೀಲಿಸಲು ಕೋಷ್ಟಕವನ್ನು ಬಹಿರಂಗಪಡಿಸಿ.", "Raskite antrą laimintį derinį (RMSprop su 0.3, žingsnis 16), tada atskleiskite lentelę patikrinti."],
    ],
    questions: [
      {
        q: ["In the challenge, which setting reaches loss < 0.01 within 40 steps?", "ಸವಾಲಿನಲ್ಲಿ ಯಾವ ಸೆಟ್ಟಿಂಗ್ 40 ಹೆಜ್ಜೆಗಳಲ್ಲಿ ನಷ್ಟ < 0.01 ತಲುಪುತ್ತದೆ?", "Kuris nustatymas iššūkyje pasiekia nuostolį < 0.01 per 40 žingsnių?"],
        options: [
          ["Adam with learning rate 0.01", "ಕಲಿಕೆಯ ದರ 0.01 ರೊಂದಿಗೆ Adam", "Adam su mokymosi greičiu 0.01"],
          ["SGD with learning rate 0.1", "ಕಲಿಕೆಯ ದರ 0.1 ರೊಂದಿಗೆ SGD", "SGD su mokymosi greičiu 0.1"],
          ["SGD with learning rate 0.3", "ಕಲಿಕೆಯ ದರ 0.3 ರೊಂದಿಗೆ SGD", "SGD su mokymosi greičiu 0.3"],
        ],
        correct: 1,
        why: ["SGD with 0.1 gets there at step 33. Adam with 0.01 is still at a loss above 13 after 40 steps, and SGD with 0.3 explodes.", "0.1 ರೊಂದಿಗೆ SGD ಹೆಜ್ಜೆ 33 ರಲ್ಲಿ ತಲುಪುತ್ತದೆ. 0.01 ರೊಂದಿಗೆ Adam 40 ಹೆಜ್ಜೆಗಳ ನಂತರವೂ 13 ಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ನಷ್ಟದಲ್ಲಿದೆ, ಮತ್ತು 0.3 ರೊಂದಿಗೆ SGD ಸ್ಫೋಟಿಸುತ್ತದೆ.", "SGD su 0.1 ten patenka žingsnyje 33. Adam su 0.01 po 40 žingsnių vis dar turi nuostolį virš 13, o SGD su 0.3 sprogsta."],
        verify: () => {
          const sgd = optimizerPaths(0.1, 40).sgd;
          const adam = optimizerPaths(0.01, 40).adam;
          return stepsToLoss(sgd, 0.01) === 33 && stepsToLoss(adam, 0.01) === -1 && adam.loss > 13 && !optimizerPaths(0.3, 40).sgd.ok;
        },
      },
      {
        q: ["What does SGD with learning rate 0.3 do on this valley?", "ಈ ಕಣಿವೆಯಲ್ಲಿ ಕಲಿಕೆಯ ದರ 0.3 ರೊಂದಿಗೆ SGD ಏನು ಮಾಡುತ್ತದೆ?", "Ką šiame slėnyje daro SGD su mokymosi greičiu 0.3?"],
        options: [
          ["It converges fastest", "ಅದು ಅತಿ ವೇಗವಾಗಿ ಒಮ್ಮುಖವಾಗುತ್ತದೆ", "Konverguoja greičiausiai"],
          ["It does not move", "ಅದು ಚಲಿಸುವುದಿಲ್ಲ", "Nejuda"],
          ["It diverges: the loss explodes", "ಅದು ಅಪಸರಣವಾಗುತ್ತದೆ: ನಷ್ಟ ಸ್ಫೋಟಿಸುತ್ತದೆ", "Diverguoja: nuostolis sprogsta"],
        ],
        correct: 2,
        why: ["The valley is steep in y (curvature 10), and plain gradient descent is stable only for a learning rate below 2 / 10 = 0.2. At 0.3 every step overshoots further than the last.", "ಕಣಿವೆ y ನಲ್ಲಿ ಕಡಿದಾಗಿದೆ (ವಕ್ರತೆ 10), ಮತ್ತು ಸರಳ ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ 2 / 10 = 0.2 ಕ್ಕಿಂತ ಕಡಿಮೆ ಕಲಿಕೆಯ ದರಕ್ಕೆ ಮಾತ್ರ ಸ್ಥಿರ. 0.3 ರಲ್ಲಿ ಪ್ರತಿ ಹೆಜ್ಜೆ ಹಿಂದಿನದಕ್ಕಿಂತ ಹೆಚ್ಚು ದೂರ ಮೀರುತ್ತದೆ.", "Slėnis status y kryptimi (kreivumas 10), o paprastas gradientinis nusileidimas stabilus tik kai mokymosi greitis mažesnis nei 2 / 10 = 0.2. Su 0.3 kiekvienas žingsnis peršoka toliau nei ankstesnis."],
        verify: () => !optimizerPaths(0.3, 40).sgd.ok && optimizerPaths(0.15, 60).sgd.ok && optimizerPaths(0.19, 200).sgd.ok,
      },
      {
        q: ["In the notebook, Adam and RMSprop with learning rate 0.1 on MNIST gave 11.35%. What does this mean?", "ನೋಟ್‌ಬುಕ್‌ನಲ್ಲಿ MNIST ಮೇಲೆ ಕಲಿಕೆಯ ದರ 0.1 ರೊಂದಿಗೆ Adam ಮತ್ತು RMSprop 11.35% ನೀಡಿದವು. ಇದರ ಅರ್ಥವೇನು?", "Užrašų knygelėje Adam ir RMSprop su mokymosi greičiu 0.1 MNIST davė 11.35 %. Ką tai reiškia?"],
        options: [
          ["The step was far too large, training failed and the result is about chance level (10 classes)", "ಹೆಜ್ಜೆ ತುಂಬಾ ದೊಡ್ಡದಾಗಿತ್ತು, ತರಬೇತಿ ವಿಫಲವಾಯಿತು ಮತ್ತು ಫಲಿತಾಂಶ ಆಕಸ್ಮಿಕ ಮಟ್ಟದ ಹತ್ತಿರ (10 ವರ್ಗಗಳು)", "Žingsnis buvo per didelis, mokymas nepavyko, o rezultatas apie atsitiktinį lygį (10 klasių)"],
          ["They were the best runs of the lab", "ಅವು ಲ್ಯಾಬ್‌ನ ಅತ್ಯುತ್ತಮ ರನ್‌ಗಳು", "Tai geriausi laboratorijos bandymai"],
          ["11.35% is an excellent result for 10 classes", "10 ವರ್ಗಗಳಿಗೆ 11.35% ಅತ್ಯುತ್ತಮ ಫಲಿತಾಂಶ", "11.35 % yra puikus rezultatas 10 klasių uždaviniui"],
        ],
        correct: 0,
        why: ["Random guessing among 10 digits gives about 10%, so 11.35% means nothing was learned: the weights jumped around instead of settling. The same optimizers with 0.001 reached 98.15-98.16%.", "10 ಅಂಕಿಗಳಲ್ಲಿ ಯಾದೃಚ್ಛಿಕ ಊಹೆ ಸುಮಾರು 10% ನೀಡುತ್ತದೆ, ಆದ್ದರಿಂದ 11.35% ಎಂದರೆ ಏನೂ ಕಲಿಯಲಿಲ್ಲ: ತೂಕಗಳು ನೆಲೆಗೊಳ್ಳುವ ಬದಲು ಜಿಗಿದಾಡಿದವು. ಅದೇ ಆಪ್ಟಿಮೈಜರ್‌ಗಳು 0.001 ರೊಂದಿಗೆ 98.15-98.16% ತಲುಪಿದವು.", "Atsitiktinis spėjimas tarp 10 skaitmenų duoda apie 10 %, todėl 11.35 % reiškia, kad nieko neišmokta: svoriai šokinėjo, o ne nusistovėjo. Tie patys optimizatoriai su 0.001 pasiekė 98.15-98.16 %."],
      },
    ],
    takeaways: [
      ["SGD uses raw steps (lr × gradient) and needs a well-chosen rate: 0.1 converges on the valley, 0.3 diverges.", "SGD ಕಚ್ಚಾ ಹೆಜ್ಜೆಗಳನ್ನು (lr × ಗ್ರೇಡಿಯಂಟ್) ಬಳಸುತ್ತದೆ ಮತ್ತು ಚೆನ್ನಾಗಿ ಆರಿಸಿದ ದರ ಬೇಕು: ಕಣಿವೆಯಲ್ಲಿ 0.1 ಒಮ್ಮುಖ, 0.3 ಅಪಸರಣ.", "SGD naudoja grynus žingsnius (lr × gradientas) ir reikalauja gerai parinkto greičio: 0.1 slėnyje konverguoja, 0.3 – diverguoja."],
      ["RMSprop and Adam rescale steps per direction, but a rate that is too large (0.1 on MNIST: 11.35%) still ruins training.", "RMSprop ಮತ್ತು Adam ದಿಕ್ಕಿನ ಪ್ರಕಾರ ಹೆಜ್ಜೆಗಳನ್ನು ಮರುಮಾಪನ ಮಾಡುತ್ತವೆ, ಆದರೆ ತುಂಬಾ ದೊಡ್ಡ ದರ (MNIST ಮೇಲೆ 0.1: 11.35%) ಇನ್ನೂ ತರಬೇತಿಯನ್ನು ಹಾಳುಮಾಡುತ್ತದೆ.", "RMSprop ir Adam perskaičiuoja žingsnius pagal kryptį, bet per didelis greitis (0.1 MNIST: 11.35 %) vis tiek sugadina mokymą."],
      ["The best MNIST result, 98.16%, came from Adam with 0.001: the learning rate mattered more than the optimizer.", "ಅತ್ಯುತ್ತಮ MNIST ಫಲಿತಾಂಶ, 98.16%, 0.001 ರೊಂದಿಗೆ Adam ನಿಂದ ಬಂತು: ಆಪ್ಟಿಮೈಜರ್‌ಗಿಂತ ಕಲಿಕೆಯ ದರ ಹೆಚ್ಚು ಮುಖ್ಯವಾಯಿತು.", "Geriausias MNIST rezultatas, 98.16 %, gautas su Adam ir 0.001: mokymosi greitis buvo svarbesnis už optimizatorių."],
    ],
    mistakes: [
      ["Copying a learning rate from one optimizer to another: SGD liked 0.1-0.5, Adam and RMSprop 0.0001-0.001.", "ಒಂದು ಆಪ್ಟಿಮೈಜರ್‌ನಿಂದ ಇನ್ನೊಂದಕ್ಕೆ ಕಲಿಕೆಯ ದರವನ್ನು ನಕಲಿಸುವುದು: SGD ಗೆ 0.1-0.5, Adam ಮತ್ತು RMSprop ಗೆ 0.0001-0.001 ಇಷ್ಟವಾದವು.", "Kopijuoti mokymosi greitį iš vieno optimizatoriaus į kitą: SGD patiko 0.1-0.5, Adam ir RMSprop – 0.0001-0.001."],
      ["Declaring one optimizer the winner from a single toy run; the challenge depends on the valley and on the 40-step budget.", "ಒಂದೇ ಆಟಿಕೆ ರನ್‌ನಿಂದ ಒಂದು ಆಪ್ಟಿಮೈಜರ್ ಅನ್ನು ವಿಜೇತ ಎಂದು ಘೋಷಿಸುವುದು; ಸವಾಲು ಕಣಿವೆ ಮತ್ತು 40-ಹೆಜ್ಜೆ ಬಜೆಟ್ ಮೇಲೆ ಅವಲಂಬಿತ.", "Skelbti vieną optimizatorių nugalėtoju pagal vieną žaislinį bandymą; iššūkis priklauso nuo slėnio ir 40 žingsnių biudžeto."],
    ],
  },
};
