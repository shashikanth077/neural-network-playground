import { build } from "./common";

const P = "cs.neural-network.";

export const cheatsheet = build([
  ["sheet.neural-network.subtitle",
    "Layers, activations, losses, optimizers, regularisation, validation, metrics, CNNs, RNNs and text: the formulas and rules of thumb from the lectures, in one page.",
    "ಪದರಗಳು, ಆಕ್ಟಿವೇಷನ್‌ಗಳು, ನಷ್ಟ ಕಾರ್ಯಗಳು, ಆಪ್ಟಿಮೈಜರ್‌ಗಳು, ರೆಗ್ಯುಲರೈಸೇಷನ್, ವ್ಯಾಲಿಡೇಷನ್, ಮೆಟ್ರಿಕ್‌ಗಳು, CNN, RNN ಮತ್ತು ಪಠ್ಯ: ಉಪನ್ಯಾಸಗಳ ಸೂತ್ರಗಳು ಮತ್ತು ಅಂದಾಜು ನಿಯಮಗಳು ಒಂದೇ ಪುಟದಲ್ಲಿ.",
    "Sluoksniai, aktyvacijos, nuostolių funkcijos, optimizatoriai, reguliarizacija, validavimas, metrikos, CNN, RNN ir tekstas: paskaitų formulės ir praktinės taisyklės viename puslapyje."],

  [P + "blocks.title", "1 · Building blocks", "1 · ಮೂಲ ಘಟಕಗಳು", "1 · Pagrindiniai blokai"],
  [P + "blocks.sum",
    "A neuron computes a weighted sum of its inputs plus a bias and passes it through an activation. Layers stack neurons; the shapes tell you how many parameters there are.",
    "ನ್ಯೂರಾನ್ ತನ್ನ ಇನ್‌ಪುಟ್‌ಗಳ ತೂಕದ ಮೊತ್ತಕ್ಕೆ ಬಯಾಸ್ ಸೇರಿಸಿ ಆಕ್ಟಿವೇಷನ್ ಮೂಲಕ ಹಾಯಿಸುತ್ತದೆ. ಪದರಗಳು ನ್ಯೂರಾನ್‌ಗಳನ್ನು ಜೋಡಿಸುತ್ತವೆ; ಆಕಾರಗಳು ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ ಎಂದು ತೋರಿಸುತ್ತವೆ.",
    "Neuronas apskaičiuoja svertinę įėjimų sumą, prideda poslinkį ir perleidžia per aktyvacijos funkciją. Sluoksniai sudeda neuronus; formos parodo, kiek yra parametrų."],

  [P + "activations.title", "2 · Activation functions", "2 · ಆಕ್ಟಿವೇಷನ್ ಕಾರ್ಯಗಳು", "2 · Aktyvacijos funkcijos"],
  [P + "activations.sum",
    "Sigmoid, tanh, ReLU and its variants: formulas, output ranges and known problems such as vanishing gradients and dead neurons.",
    "ಸಿಗ್ಮಾಯ್ಡ್, tanh, ReLU ಮತ್ತು ಅದರ ರೂಪಾಂತರಗಳು: ಸೂತ್ರಗಳು, ಔಟ್‌ಪುಟ್ ವ್ಯಾಪ್ತಿ ಮತ್ತು ಗ್ರೇಡಿಯಂಟ್ ಕಣ್ಮರೆ ಹಾಗೂ ನಿಷ್ಕ್ರಿಯ ನ್ಯೂರಾನ್‌ಗಳಂತಹ ತಿಳಿದ ಸಮಸ್ಯೆಗಳು.",
    "Sigmoidas, tanh, ReLU ir jo variantai: formulės, išėjimo intervalai ir žinomos problemos, pvz., nykstantys gradientai ir „negyvi“ neuronai."],

  [P + "output.title", "3 · Output layer & loss by task", "3 · ಔಟ್‌ಪುಟ್ ಪದರ ಮತ್ತು ಕಾರ್ಯಕ್ಕೆ ತಕ್ಕ ನಷ್ಟ", "3 · Išėjimo sluoksnis ir nuostolis pagal uždavinį"],
  [P + "output.sum",
    "Which last-layer activation and loss to pair for regression, binary, multi-class and multi-label problems.",
    "ರಿಗ್ರೆಷನ್, ದ್ವಿಮಾನ, ಬಹುವರ್ಗ ಮತ್ತು ಬಹು-ಲೇಬಲ್ ಸಮಸ್ಯೆಗಳಿಗೆ ಕೊನೆಯ ಪದರದ ಯಾವ ಆಕ್ಟಿವೇಷನ್ ಮತ್ತು ನಷ್ಟವನ್ನು ಜೋಡಿಸಬೇಕು.",
    "Kokią paskutinio sluoksnio aktyvaciją ir nuostolį derinti regresijai, dvejetainiam, daugiaklasiam ir daugiaženkliam klasifikavimui."],

  [P + "losses.title", "4 · Loss functions", "4 · ನಷ್ಟ ಕಾರ್ಯಗಳು", "4 · Nuostolių funkcijos"],
  [P + "losses.sum",
    "MAE, MSE, cross-entropy, hinge and others: formulas, when each is used, and how they react to outliers.",
    "MAE, MSE, ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ, ಹಿಂಜ್ ಮತ್ತು ಇತರೆ: ಸೂತ್ರಗಳು, ಪ್ರತಿಯೊಂದನ್ನು ಯಾವಾಗ ಬಳಸುವುದು ಮತ್ತು ಅವು ಅಸಂಗತ ಮೌಲ್ಯಗಳಿಗೆ ಹೇಗೆ ಪ್ರತಿಕ್ರಿಯಿಸುತ್ತವೆ.",
    "MAE, MSE, kryžminė entropija, vyrių (hinge) ir kitos: formulės, kada kurią naudoti ir kaip jos reaguoja į išskirtis."],

  [P + "optimizers.title", "5 · Gradient descent & optimizers", "5 · ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಮತ್ತು ಆಪ್ಟಿಮೈಜರ್‌ಗಳು", "5 · Gradientinis nusileidimas ir optimizatoriai"],
  [P + "optimizers.sum",
    "SGD, momentum, Nesterov, Adagrad, RMSprop, Adadelta, Adam and Nadam: update rules, defaults and how learning rate and batch size change training.",
    "SGD, ಮೊಮೆಂಟಮ್, Nesterov, Adagrad, RMSprop, Adadelta, Adam ಮತ್ತು Nadam: ಅಪ್‌ಡೇಟ್ ನಿಯಮಗಳು, ಡೀಫಾಲ್ಟ್‌ಗಳು ಮತ್ತು ಕಲಿಕಾ ದರ ಹಾಗೂ ಬ್ಯಾಚ್ ಗಾತ್ರ ತರಬೇತಿಯನ್ನು ಹೇಗೆ ಬದಲಿಸುತ್ತವೆ.",
    "SGD, momentas, Nesterov, Adagrad, RMSprop, Adadelta, Adam ir Nadam: atnaujinimo taisyklės, numatytosios reikšmės ir kaip mokymosi greitis bei paketo dydis keičia mokymą."],

  [P + "generalisation.title", "6 · Overfitting & regularisation", "6 · ಅತಿಹೊಂದಾಣಿಕೆ ಮತ್ತು ರೆಗ್ಯುಲರೈಸೇಷನ್", "6 · Persimokymas ir reguliarizacija"],
  [P + "generalisation.sum",
    "Recognise under- and over-fitting, and fix it with L1/L2, dropout, batch normalisation and early stopping.",
    "ಅಂಡರ್‌ಫಿಟ್ಟಿಂಗ್ ಮತ್ತು ಓವರ್‌ಫಿಟ್ಟಿಂಗ್ ಗುರುತಿಸಿ, L1/L2, ಡ್ರಾಪ್‌ಔಟ್, ಬ್ಯಾಚ್ ನಾರ್ಮಲೈಸೇಷನ್ ಮತ್ತು ಅರ್ಲಿ ಸ್ಟಾಪಿಂಗ್‌ನಿಂದ ಸರಿಪಡಿಸಿ.",
    "Atpažinkite nepakankamą ir pernelyg didelį pritaikymą ir taisykite jį L1/L2, dropout, paketų normalizavimu ir ankstyvu sustabdymu."],

  [P + "validation.title", "7 · Data splits & validation", "7 · ಡೇಟಾ ವಿಭಜನೆ ಮತ್ತು ವ್ಯಾಲಿಡೇಷನ್", "7 · Duomenų skaidymas ir validavimas"],
  [P + "validation.sum",
    "Train/validation/test sets, hold-out, k-fold, stratified, shuffle, time-series and leave-one-out, and how to avoid leakage.",
    "ಟ್ರೈನ್/ವ್ಯಾಲಿಡೇಷನ್/ಟೆಸ್ಟ್ ಸೆಟ್‌ಗಳು, ಹೋಲ್ಡ್-ಔಟ್, k-ಫೋಲ್ಡ್, ಸ್ತರೀಕೃತ, ಶಫಲ್, ಸಮಯ-ಶ್ರೇಣಿ ಮತ್ತು ಲೀವ್-ಒನ್-ಔಟ್, ಹಾಗೂ ಡೇಟಾ ಸೋರಿಕೆ ತಪ್ಪಿಸುವ ವಿಧಾನ.",
    "Mokymo/validavimo/testavimo aibės, hold-out, k-fold, stratifikuotas, maišymo, laiko eilučių ir leave-one-out metodai bei kaip išvengti nutekėjimo."],

  [P + "metrics.title", "8 · Classification metrics", "8 · ವರ್ಗೀಕರಣ ಮೆಟ್ರಿಕ್‌ಗಳು", "8 · Klasifikavimo metrikos"],
  [P + "metrics.sum",
    "Confusion matrix, accuracy, precision, recall, F1, ROC and AUC, and how the decision threshold trades one error for another.",
    "ಕನ್‌ಫ್ಯೂಷನ್ ಮ್ಯಾಟ್ರಿಕ್ಸ್, ನಿಖರತೆ, ಪ್ರೆಸಿಷನ್, ರಿಕಾಲ್, F1, ROC ಮತ್ತು AUC, ಹಾಗೂ ನಿರ್ಣಯ ಮಿತಿ ಒಂದು ದೋಷವನ್ನು ಇನ್ನೊಂದರೊಂದಿಗೆ ಹೇಗೆ ವಿನಿಮಯ ಮಾಡುತ್ತದೆ.",
    "Klaidų matrica, tikslumas, preciziškumas, atkūrimas, F1, ROC ir AUC bei kaip sprendimo slenkstis iškeičia vieną klaidą į kitą."],

  [P + "cnn.title", "9 · Convolutional networks (CNN)", "9 · ಕನ್ವಲ್ಯೂಷನಲ್ ನೆಟ್‌ವರ್ಕ್‌ಗಳು (CNN)", "9 · Konvoliciniai tinklai (CNN)"],
  [P + "cnn.sum",
    "Kernels, stride, padding, pooling, feature maps, output-size formula and the classic LeNet / MNIST architectures with parameter counts.",
    "ಕರ್ನಲ್‌ಗಳು, ಸ್ಟ್ರೈಡ್, ಪ್ಯಾಡಿಂಗ್, ಪೂಲಿಂಗ್, ಫೀಚರ್ ಮ್ಯಾಪ್‌ಗಳು, ಔಟ್‌ಪುಟ್ ಗಾತ್ರ ಸೂತ್ರ ಮತ್ತು ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆಯೊಂದಿಗೆ ಶಾಸ್ತ್ರೀಯ LeNet / MNIST ವಾಸ್ತುಶಿಲ್ಪಗಳು.",
    "Branduoliai, žingsnis, užpildymas, sutelkimas, požymių žemėlapiai, išėjimo dydžio formulė ir klasikinės LeNet / MNIST architektūros su parametrų skaičiumi."],

  [P + "rnn.title", "10 · Recurrent networks (RNN, LSTM, GRU)", "10 · ಪುನರಾವರ್ತಿತ ನೆಟ್‌ವರ್ಕ್‌ಗಳು (RNN, LSTM, GRU)", "10 · Rekurentiniai tinklai (RNN, LSTM, GRU)"],
  [P + "rnn.sum",
    "How a hidden state carries memory across steps; LSTM and GRU gates; vanishing gradients and parameter counts.",
    "ಗುಪ್ತ ಸ್ಥಿತಿ ಹಂತಗಳಾದ್ಯಂತ ನೆನಪನ್ನು ಹೇಗೆ ಒಯ್ಯುತ್ತದೆ; LSTM ಮತ್ತು GRU ಗೇಟ್‌ಗಳು; ಗ್ರೇಡಿಯಂಟ್ ಕಣ್ಮರೆ ಮತ್ತು ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆ.",
    "Kaip paslėpta būsena perneša atmintį per žingsnius; LSTM ir GRU vartai; nykstantys gradientai ir parametrų skaičius."],

  [P + "text.title", "11 · Text preprocessing", "11 · ಪಠ್ಯ ಪೂರ್ವಸಂಸ್ಕರಣೆ", "11 · Teksto apdorojimas"],
  [P + "text.sum",
    "Tokenising, padding, one-hot and embeddings: turning sentences into numbers a network can use.",
    "ಟೋಕನೈಸಿಂಗ್, ಪ್ಯಾಡಿಂಗ್, ಒನ್-ಹಾಟ್ ಮತ್ತು ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳು: ವಾಕ್ಯಗಳನ್ನು ನೆಟ್‌ವರ್ಕ್ ಬಳಸಬಹುದಾದ ಸಂಖ್ಯೆಗಳಾಗಿ ಪರಿವರ್ತಿಸುವುದು.",
    "Žetonizavimas, užpildymas, one-hot ir įterpiniai: sakinių pavertimas skaičiais, kuriuos gali naudoti tinklas."],

  [P + "keras.title", "12 · Keras quick reference", "12 · Keras ತ್ವರಿತ ಉಲ್ಲೇಖ", "12 · Keras trumpa nuoroda"],
  [P + "keras.sum",
    "Copy-ready snippets for building, compiling, fitting and evaluating models, with the default arguments.",
    "ಮಾದರಿಗಳನ್ನು ನಿರ್ಮಿಸಲು, ಕಂಪೈಲ್ ಮಾಡಲು, ಫಿಟ್ ಮಾಡಲು ಮತ್ತು ಮೌಲ್ಯಮಾಪನಕ್ಕೆ ನಕಲಿಸಲು ಸಿದ್ಧ ಕೋಡ್ ತುಣುಕುಗಳು, ಡೀಫಾಲ್ಟ್ ಆರ್ಗ್ಯುಮೆಂಟ್‌ಗಳೊಂದಿಗೆ.",
    "Paruošti kopijuoti kodo fragmentai modeliams kurti, kompiliuoti, mokyti ir vertinti, su numatytaisiais argumentais."],

  [P + "calc.title", "13 · Calculators", "13 · ಕ್ಯಾಲ್ಕುಲೇಟರ್‌ಗಳು", "13 · Skaičiuotuvai"],
  [P + "calc.sum",
    "Type your own sizes to get parameter counts, convolution output sizes and steps per epoch.",
    "ನಿಮ್ಮ ಸ್ವಂತ ಗಾತ್ರಗಳನ್ನು ನಮೂದಿಸಿ ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆ, ಕನ್ವಲ್ಯೂಷನ್ ಔಟ್‌ಪುಟ್ ಗಾತ್ರ ಮತ್ತು ಪ್ರತಿ ಎಪೋಕ್‌ನ ಹಂತಗಳನ್ನು ಪಡೆಯಿರಿ.",
    "Įveskite savo dydžius ir gaukite parametrų skaičių, konvoliucijos išėjimo dydžius ir žingsnių skaičių epochoje."],

  [P + "debug.title", "14 · Quick diagnosis", "14 · ತ್ವರಿತ ರೋಗನಿರ್ಣಯ", "14 · Greita diagnostika"],
  [P + "debug.sum",
    "Symptom → likely cause → what to try: loss not decreasing, NaN, chance-level accuracy, overfitting, divergence.",
    "ಲಕ್ಷಣ → ಸಂಭಾವ್ಯ ಕಾರಣ → ಏನು ಪ್ರಯತ್ನಿಸಬೇಕು: ನಷ್ಟ ಇಳಿಯದಿರುವುದು, NaN, ಯಾದೃಚ್ಛಿಕ ಮಟ್ಟದ ನಿಖರತೆ, ಅತಿಹೊಂದಾಣಿಕೆ, ಅಪಸರಣ.",
    "Simptomas → tikėtina priežastis → ką išbandyti: nuostolis nemažėja, NaN, atsitiktinio lygio tikslumas, persimokymas, divergencija."],
]);
