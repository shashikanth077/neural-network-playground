import { conv2d, cnnBreakdown, denseParams, emptyImg, gradientPath, KERNELS, LAB1_SIZES, pool2x2, SIZE } from "../math";
import type { GuideDef } from "./types";

/** Guides of the image part of the lab (steps 1–6). */
export const guides1: Record<string, GuideDef> = {
  pipeline: {
    goal: [
      "Know the ten stages of the lab and which code step each one is.",
      "ಲ್ಯಾಬ್‌ನ ಹತ್ತು ಹಂತಗಳನ್ನು ಮತ್ತು ಪ್ರತಿಯೊಂದು ಯಾವ ಕೋಡ್ ಹಂತಕ್ಕೆ ಸಂಬಂಧಿಸಿದೆ ಎಂದು ತಿಳಿಯಿರಿ.",
      "Žinoti dešimt laboratorijos etapų ir tai, kuriam kodo žingsniui atitinka kiekvienas.",
    ],
    fit: [
      "Every later step zooms into one stage of this pipeline, so when the code says 'step 9' you know where you are.",
      "ನಂತರದ ಪ್ರತಿ ಹಂತವೂ ಈ ಪೈಪ್‌ಲೈನ್‌ನ ಒಂದು ಹಂತವನ್ನು ಹತ್ತಿರದಿಂದ ತೋರಿಸುತ್ತದೆ; ಆದ್ದರಿಂದ ಕೋಡ್ ‘ಹಂತ 9’ ಎಂದು ಹೇಳಿದಾಗ ನೀವು ಎಲ್ಲಿದ್ದೀರಿ ಎಂದು ತಿಳಿಯುತ್ತದೆ.",
      "Kiekvienas vėlesnis žingsnis priartina vieną šio konvejerio etapą, todėl kai kode minimas „9 žingsnis“, žinosite, kur esate.",
    ],
    keywords: [
      [["MNIST", "MNIST", "MNIST"], ["70 000 handwritten digits, 28 × 28 grey pictures. Task 1 uses them.", "70 000 ಕೈಬರಹದ ಅಂಕಿಗಳು, 28 × 28 ಬೂದು ಚಿತ್ರಗಳು. ಕಾರ್ಯ 1 ಇವುಗಳನ್ನು ಬಳಸುತ್ತದೆ.", "70 000 ranka rašytų skaitmenų, 28 × 28 pilki vaizdai. 1 užduotis naudoja juos."]],
      [["IMDB", "IMDB", "IMDB"], ["25 000 training and 25 000 test movie reviews, labelled positive or negative. Task 2 uses them.", "25 000 ತರಬೇತಿ ಮತ್ತು 25 000 ಪರೀಕ್ಷಾ ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆಗಳು, ಧನಾತ್ಮಕ ಅಥವಾ ಋಣಾತ್ಮಕ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ. ಕಾರ್ಯ 2 ಇವುಗಳನ್ನು ಬಳಸುತ್ತದೆ.", "25 000 mokymo ir 25 000 testavimo filmų apžvalgų, pažymėtų teigiamomis arba neigiamomis. 2 užduotis naudoja jas."]],
      [["Pipeline", "ಪೈಪ್‌ಲೈನ್", "Konvejeris"], ["A chain of stages where each output is the next stage's input.", "ಪ್ರತಿ ಹಂತದ ಔಟ್‌ಪುಟ್ ಮುಂದಿನ ಹಂತದ ಇನ್‌ಪುಟ್ ಆಗುವ ಹಂತಗಳ ಸರಣಿ.", "Etapų grandinė, kurioje kiekvienas etapo rezultatas tampa kito etapo įvestimi."]],
    ],
    tasks: [
      ["Click all ten blocks and read one sentence for each.", "ಹತ್ತೂ ಬ್ಲಾಕ್‌ಗಳನ್ನು ಕ್ಲಿಕ್ ಮಾಡಿ ಮತ್ತು ಪ್ರತಿಯೊಂದರ ಒಂದು ವಾಕ್ಯವನ್ನು ಓದಿ.", "Spustelėkite visus dešimt blokų ir perskaitykite po sakinį kiekvienam."],
      ["Name which block is Task 1 and which is Task 2.", "ಯಾವ ಬ್ಲಾಕ್ ಕಾರ್ಯ 1 ಮತ್ತು ಯಾವುದು ಕಾರ್ಯ 2 ಎಂದು ಹೆಸರಿಸಿ.", "Nurodykite, kuris blokas yra 1 užduotis, o kuris – 2 užduotis."],
      ["Find the block where the best CNN is compared with the Lab 1 network.", "ಯಾವ ಬ್ಲಾಕ್‌ನಲ್ಲಿ ಅತ್ಯುತ್ತಮ CNN ಅನ್ನು ಲ್ಯಾಬ್ 1 ನೆಟ್‌ವರ್ಕ್‌ನೊಂದಿಗೆ ಹೋಲಿಸಲಾಗುತ್ತದೆ ಎಂಬುದನ್ನು ಕಂಡುಹಿಡಿಯಿರಿ.", "Raskite bloką, kuriame geriausias CNN lyginamas su 1 laboratorijos tinklu."],
    ],
    questions: [
      {
        q: ["Which stage compares the best CNN with the fully connected network of Lab 1?", "ಅತ್ಯುತ್ತಮ CNN ಅನ್ನು ಲ್ಯಾಬ್ 1ರ ಸಂಪೂರ್ಣ ಸಂಪರ್ಕಿತ ನೆಟ್‌ವರ್ಕ್‌ನೊಂದಿಗೆ ಯಾವ ಹಂತ ಹೋಲಿಸುತ್ತದೆ?", "Kuris etapas lygina geriausią CNN su pilnai sujungtu 1 laboratorijos tinklu?"],
        options: [["Load MNIST", "MNIST ಲೋಡ್ ಮಾಡಿ", "Įkelti MNIST"], ["Compare", "ಹೋಲಿಕೆ", "Palyginimas"], ["Conv1D 2.2", "Conv1D 2.2", "Conv1D 2.2"]],
        correct: 1,
        why: ["Step 7 (Compare) reads the Lab 1 results file and sets its accuracy and parameter count against the CNN.", "ಹಂತ 7 (ಹೋಲಿಕೆ) ಲ್ಯಾಬ್ 1ರ ಫಲಿತಾಂಶ ಫೈಲ್ ಓದಿ ಅದರ ನಿಖರತೆ ಮತ್ತು ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆಯನ್ನು CNN ಜೊತೆ ಹೋಲಿಸುತ್ತದೆ.", "7 žingsnis (Palyginimas) nuskaito 1 laboratorijos rezultatų failą ir palygina jo tikslumą bei parametrų skaičių su CNN."],
      },
      {
        q: ["How many images are in the training part of IMDB?", "IMDB ತರಬೇತಿ ಭಾಗದಲ್ಲಿ ಎಷ್ಟು ಚಿತ್ರಗಳಿವೆ?", "Kiek vaizdų yra IMDB mokymo dalyje?"],
        options: [["10 000", "10 000", "10 000"], ["25 000", "25 000", "25 000"], ["60 000", "60 000", "60 000"]],
        correct: 1,
        why: ["IMDB has 25 000 training reviews and 25 000 test reviews. 60 000 is the size of the MNIST training set.", "IMDB ನಲ್ಲಿ 25 000 ತರಬೇತಿ ಮತ್ತು 25 000 ಪರೀಕ್ಷಾ ವಿಮರ್ಶೆಗಳಿವೆ. 60 000 MNIST ತರಬೇತಿ ಗಾತ್ರ.", "IMDB turi 25 000 mokymo ir 25 000 testavimo apžvalgų. 60 000 – tai MNIST mokymo rinkinio dydis."],
      },
    ],
    takeaways: [
      ["The lab has two tasks: digits (Task 1) and reviews (Task 2).", "ಲ್ಯಾಬ್‌ನಲ್ಲಿ ಎರಡು ಕಾರ್ಯಗಳಿವೆ: ಅಂಕಿಗಳು (ಕಾರ್ಯ 1) ಮತ್ತು ವಿಮರ್ಶೆಗಳು (ಕಾರ್ಯ 2).", "Laboratorijoje yra dvi užduotys: skaitmenys (1 užduotis) ir apžvalgos (2 užduotis)."],
      ["Every stage has one input and one output.", "ಪ್ರತಿ ಹಂತಕ್ಕೂ ಒಂದು ಇನ್‌ಪುಟ್ ಮತ್ತು ಒಂದು ಔಟ್‌ಪುಟ್ ಇದೆ.", "Kiekvienas etapas turi vieną įvestį ir vieną išvestį."],
      ["The step numbers in the code match the step numbers here.", "ಕೋಡ್‌ನ ಹಂತ ಸಂಖ್ಯೆಗಳು ಇಲ್ಲಿನ ಹಂತ ಸಂಖ್ಯೆಗಳಿಗೆ ಹೊಂದುತ್ತವೆ.", "Kodo žingsnių numeriai atitinka čia nurodytus žingsnius."],
    ],
    mistakes: [
      ["Mixing the two data sets: MNIST is pictures of digits, IMDB is text.", "ಎರಡು ಡೇಟಾ ಸೆಟ್‌ಗಳನ್ನು ಗೊಂದಲಗೊಳಿಸುವುದು: MNIST ಅಂಕಿಗಳ ಚಿತ್ರಗಳು, IMDB ಪಠ್ಯ.", "Painiava tarp dviejų duomenų rinkinių: MNIST – skaitmenų vaizdai, IMDB – tekstas."],
    ],
  },

  digit: {
    goal: [
      "Turn a pen drawing into the same kind of picture the network was trained on.",
      "ಪೆನ್ ಚಿತ್ರವನ್ನು ನೆಟ್‌ವರ್ಕ್ ತರಬೇತಿ ಪಡೆದ ಅದೇ ರೀತಿಯ ಚಿತ್ರವನ್ನಾಗಿ ಪರಿವರ್ತಿಸಿ.",
      "Nupieštą skaitmenį paverskite tokiu pat vaizdu, kokiu tinklas buvo mokytas.",
    ],
    fit: [
      "Real handwriting differs in size, position, paper and pen thickness. Without the same preparation as MNIST, a wrong answer says little about the model.",
      "ಕೈಬರಹವು ಗಾತ್ರ, ಸ್ಥಾನ, ಕಾಗದ ಮತ್ತು ಪೆನ್ನಿನ ದಪ್ಪದಲ್ಲಿ ಭಿನ್ನವಾಗಿರುತ್ತದೆ. MNIST ಯಂತೆಯೇ ತಯಾರಿ ಇಲ್ಲದಿದ್ದರೆ, ತಪ್ಪು ಉತ್ತರ ಮಾದರಿಯ ಬಗ್ಗೆ ಹೆಚ್ಚು ಹೇಳುವುದಿಲ್ಲ.",
      "Rašysena skiriasi dydžiu, padėtimi, popieriumi ir rašiklio storiu. Be tokio paruošimo kaip MNIST, klaidingas atsakymas mažai ką pasako apie modelį.",
    ],
    keywords: [
      [["Ink", "ಶಾಯಿ", "Rašalas"], ["The part of the picture that is pen, after the paper colour is removed.", "ಕಾಗದದ ಬಣ್ಣ ತೆಗೆದ ನಂತರ ಚಿತ್ರದಲ್ಲಿರುವ ಪೆನ್ ಭಾಗ.", "Dalis vaizdo, kuri yra rašiklis, pašalinus popieriaus spalvą."]],
      [["Crop and scale", "ಕ್ರಾಪ್ ಮತ್ತು ಸ್ಕೇಲ್", "Apkarpymas ir mastelis"], ["Cut the ink to its box, then resize its longest side to 20 pixels.", "ಶಾಯಿಯನ್ನು ಅದರ ಚೌಕಟ್ಟಿಗೆ ಕತ್ತರಿಸಿ, ಉದ್ದದ ಬದಿಯನ್ನು 20 ಪಿಕ್ಸೆಲ್‌ಗೆ ಬದಲಿಸಿ.", "Iškirpkite rašalą pagal rėmelį, tada ilgiausią kraštinę pakeiskite į 20 taškų."]],
      [["Centre of mass", "ದ್ರವ್ಯರಾಶಿ ಕೇಂದ್ರ", "Masės centras"], ["The average position of the ink. Moving it to the middle centres the digit, as in MNIST.", "ಶಾಯಿಯ ಸರಾಸರಿ ಸ್ಥಾನ. ಅದನ್ನು ಮಧ್ಯಕ್ಕೆ ಸರಿಸಿದರೆ ಅಂಕಿ MNIST ಯಂತೆ ಕೇಂದ್ರೀಕೃತವಾಗುತ್ತದೆ.", "Vidutinė rašalo padėtis. Perkėlus į vidurį, skaitmuo centruojamas kaip MNIST."]],
    ],
    tasks: [
      ["Draw a digit and watch stage 1 turn into stage 4.", "ಒಂದು ಅಂಕಿ ಬರೆದು ಹಂತ 1 ಹಂತ 4 ಆಗುವುದನ್ನು ನೋಡಿ.", "Nupieškite skaitmenį ir stebėkite, kaip 1 etapas virsta 4 etapu."],
      ["Draw a small digit in a corner and read the centre-of-mass shift.", "ಮೂಲೆಯಲ್ಲಿ ಚಿಕ್ಕ ಅಂಕಿ ಬರೆದು ದ್ರವ್ಯರಾಶಿ ಕೇಂದ್ರದ ಸ್ಥಳಾಂತರವನ್ನು ಓದಿ.", "Nupieškite mažą skaitmenį kampe ir perskaitykite masės centro poslinkį."],
      ["Press “Draw a sample 9” and read the shift it needs.", "“Nupiešti pavyzdinį 9” ಒತ್ತಿ ಅದಕ್ಕೆ ಬೇಕಾದ ಸ್ಥಳಾಂತರವನ್ನು ಓದಿ.", "Paspauskite „Nupiešti 9 pavyzdį“ ir perskaitykite reikalingą poslinkį."],
      ["Send the digit to the convolution step with the button.", "ಬಟನ್ ಮೂಲಕ ಅಂಕಿಯನ್ನು ಕನ್ವಲ್ಯೂಷನ್ ಹಂತಕ್ಕೆ ಕಳುಹಿಸಿ.", "Mygtuku išsiųskite skaitmenį į konvoliucijos žingsnį."],
    ],
    questions: [
      {
        q: ["Why is the ink scaled by its longest side and not stretched to a square?", "ಶಾಯಿಯನ್ನು ಚೌಕಕ್ಕೆ ಎಳೆಯದೆ ಉದ್ದದ ಬದಿಯಿಂದ ಏಕೆ ಸ್ಕೇಲ್ ಮಾಡಲಾಗುತ್ತದೆ?", "Kodėl rašalas mastelis keičiamas pagal ilgiausią kraštinę, o ne tempiamas iki kvadrato?"],
        options: [["To keep the proportions of the digit", "ಅಂಕಿಯ ಅನುಪಾತವನ್ನು ಉಳಿಸಲು", "Kad išliktų skaitmens proporcijos"], ["To make the image bigger than 28 × 28", "ಚಿತ್ರವನ್ನು 28 × 28ಕ್ಕಿಂತ ದೊಡ್ಡದಾಗಿಸಲು", "Kad vaizdas būtų didesnis nei 28 × 28"], ["Because Keras requires square crops", "ಏಕೆಂದರೆ Keras ಚೌಕದ ಕ್ರಾಪ್ ಬಯಸುತ್ತದೆ", "Nes Keras reikalauja kvadratinių iškirpimų"]],
        correct: 0,
        why: ["Stretching would distort the handwriting. Scaling the longest side keeps the shape and fits the 20 × 20 box that MNIST uses.", "ಎಳೆಯುವುದು ಕೈಬರಹವನ್ನು ವಿರೂಪಗೊಳಿಸುತ್ತದೆ. ಉದ್ದದ ಬದಿಯಿಂದ ಸ್ಕೇಲ್ ಮಾಡುವುದು ಆಕಾರ ಉಳಿಸಿ MNIST ಬಳಸುವ 20 × 20 ಚೌಕಟ್ಟಿಗೆ ಹೊಂದುತ್ತದೆ.", "Tempiant iškraipytume rašyseną. Ilgiausios kraštinės mastelis išsaugo formą ir telpa į 20 × 20 rėmelį, kurį naudoja MNIST."],
      },
      {
        q: ["A 40 × 80 pixel stroke is cropped and scaled so its longest side is 20. What size is the result?", "40 × 80 ಪಿಕ್ಸೆಲ್‌ನ ಒಂದು ಗೆರೆಯನ್ನು ಕತ್ತರಿಸಿ, ಅದರ ಉದ್ದದ ಬದಿ 20 ಆಗುವಂತೆ ಗಾತ್ರ ಬದಲಿಸಲಾಗುತ್ತದೆ. ಫಲಿತಾಂಶದ ಗಾತ್ರ ಎಷ್ಟು?", "40 × 80 pikselių brūkšnys apkarpomas ir keičiamas, kad ilgiausia kraštinė būtų 20. Koks gautas dydis?"],
        options: [["20 × 40", "20 × 40", "20 × 40"], ["10 × 20", "10 × 20", "10 × 20"], ["20 × 20", "20 × 20", "20 × 20"]],
        correct: 1,
        why: ["The scale is 20 ÷ 80 = 0.25, so 40 × 0.25 = 10 wide and 80 × 0.25 = 20 high.", "ಮಾಪಕ 20 ÷ 80 = 0.25; ಆದ್ದರಿಂದ 40 × 0.25 = 10 ಅಗಲ ಮತ್ತು 80 × 0.25 = 20 ಎತ್ತರ.", "Mastelis 20 ÷ 80 = 0,25, todėl 40 × 0,25 = 10 pločio ir 80 × 0,25 = 20 aukščio."],
        verify: () => Math.round(40 * (20 / 80)) === 10 && Math.round(80 * (20 / 80)) === 20,
      },
      {
        q: ["What is the centre of mass used for?", "ದ್ರವ್ಯರಾಶಿ ಕೇಂದ್ರವನ್ನು ಯಾವುದಕ್ಕಾಗಿ ಬಳಸಲಾಗುತ್ತದೆ?", "Masės centras kam naudojamas?"],
        options: [["To move the digit so its weight is in the middle of the 28 × 28 frame", "ಅಂಕಿಯ ತೂಕ 28 × 28 ಚೌಕಟ್ಟಿನ ಮಧ್ಯದಲ್ಲಿರುವಂತೆ ಸರಿಸಲು", "Kad skaitmuo būtų perkeliamas taip, kad jo svoris būtų 28 × 28 rėmelio viduryje"], ["To count the pixels", "ಪಿಕ್ಸೆಲ್‌ಗಳನ್ನು ಎಣಿಸಲು", "Kad būtų suskaičiuoti taškai"], ["To choose the best kernel", "ಅತ್ಯುತ್ತಮ ಕರ್ನಲ್ ಆಯ್ಕೆ ಮಾಡಲು", "Kad būtų pasirinktas geriausias branduolys"]],
        correct: 0,
        why: ["The centre of mass is the average position of the ink; the digit is shifted so that this average is at (13.5, 13.5).", "ದ್ರವ್ಯರಾಶಿ ಕೇಂದ್ರ ಶಾಯಿಯ ಸರಾಸರಿ ಸ್ಥಾನ; ಈ ಸರಾಸರಿ (13.5, 13.5) ಬಿಂದುವಿಗೆ ಬರುವಂತೆ ಅಂಕಿ ಸರಿಸಲಾಗುತ್ತದೆ.", "Masės centras – tai vidutinė rašalo padėtis; skaitmuo perkeliamas taip, kad ši padėtis būtų taške (13,5; 13,5)."],
      },
    ],
    takeaways: [
      ["MNIST digits are white on black, centred in 28 × 28.", "MNIST ಅಂಕಿಗಳು ಕಪ್ಪು ಹಿನ್ನೆಲೆಯಲ್ಲಿ ಬಿಳಿ, 28 × 28ರಲ್ಲಿ ಕೇಂದ್ರೀಕೃತ.", "MNIST skaitmenys – balti ant juodo fono, centruoti 28 × 28 rėmelyje."],
      ["Preparation is part of the model: the same steps must be used for a photo.", "ತಯಾರಿ ಮಾದರಿಯ ಭಾಗ: ಫೋಟೋಗೂ ಅದೇ ಹಂತಗಳನ್ನು ಬಳಸಬೇಕು.", "Paruošimas – modelio dalis: nuotraukai reikia tų pačių žingsnių."],
      ["Stage 4 is the picture that goes into the network.", "ನಾಲ್ಕನೇ ಹಂತದ ಚಿತ್ರ ನೆಟ್‌ವರ್ಕ್‌ಗೆ ಹೋಗುತ್ತದೆ.", "4 etapo vaizdas patenka į tinklą."],
    ],
    mistakes: [
      ["Judging the model on a picture that was not prepared like MNIST.", "MNIST ನಂತೆ ತಯಾರಿಸದ ಚಿತ್ರದ ಆಧಾರದಲ್ಲಿ ಮಾದರಿಯನ್ನು ನಿರ್ಣಯಿಸುವುದು.", "Modelio vertinimas pagal vaizdą, nepaverstą kaip MNIST."],
    ],
  },

  conv: {
    goal: [
      "See how one 3 × 3 kernel turns a picture into a feature map, one multiplication at a time.",
      "ಒಂದು 3 × 3 ಕರ್ನಲ್ ಚಿತ್ರವನ್ನು ಫೀಚರ್ ಮ್ಯಾಪ್ ಆಗಿ ಹೇಗೆ ಬದಲಿಸುತ್ತದೆ ಎಂಬುದನ್ನು ಒಂದೊಂದು ಗುಣಾಕಾರದಲ್ಲಿ ನೋಡಿ.",
      "Pamatykite, kaip vienas 3 × 3 branduolys paverčia vaizdą požymių žemėlapiu, po vieną daugybą.",
    ],
    fit: [
      "Every Conv2D layer of the lab is many such kernels. Learning the nine numbers of each kernel is what the network does.",
      "ಲ್ಯಾಬ್‌ನ ಪ್ರತಿಯೊಂದು Conv2D ಪದರವು ಇಂತಹ ಅನೇಕ ಕರ್ನಲ್‌ಗಳು. ಪ್ರತಿ ಕರ್ನಲ್‌ನ ಒಂಬತ್ತು ಸಂಖ್ಯೆಗಳನ್ನು ಕಲಿಯುವುದೇ ನೆಟ್‌ವರ್ಕ್ ಮಾಡುವ ಕೆಲಸ.",
      "Kiekvienas laboratorijos Conv2D sluoksnis – tai daugybė tokių branduolių. Kiekvieno branduolio devynių skaičių išmokimas ir yra tai, ką daro tinklas.",
    ],
    keywords: [
      [["Kernel", "ಕರ್ನಲ್", "Branduolys"], ["A small grid of weights (3 × 3 here) that slides over the picture.", "ತೂಕಗಳ ಸಣ್ಣ ಗ್ರಿಡ್ (ಇಲ್ಲಿ 3 × 3), ಚಿತ್ರದ ಮೇಲೆ ಜಾರುತ್ತದೆ.", "Mažas svorių tinklelis (čia 3 × 3), slenkantis per vaizdą."]],
      [["Feature map", "ಫೀಚರ್ ಮ್ಯಾಪ್", "Požymių žemėlapis"], ["The output: one number per position, large where the pattern matches the kernel.", "ಔಟ್‌ಪುಟ್: ಪ್ರತಿ ಸ್ಥಾನಕ್ಕೆ ಒಂದು ಸಂಖ್ಯೆ, ಮಾದರಿ ಕರ್ನಲ್‌ಗೆ ಹೊಂದುವ ಕಡೆ ದೊಡ್ಡದು.", "Išvestis: vienas skaičius kiekvienai padėčiai, didelis ten, kur raštas sutampa su branduoliu."]],
      [["Padding", "ಪ್ಯಾಡಿಂಗ್", "Užpildymas"], ["Zeros added around the picture. 'same' keeps 28 × 28; 'valid' shrinks it to 26 × 26.", "ಚಿತ್ರದ ಸುತ್ತ ಶೂನ್ಯಗಳನ್ನು ಸೇರಿಸಲಾಗುತ್ತದೆ. 'same' 28 × 28 ಉಳಿಸುತ್ತದೆ; 'valid' 26 × 26ಕ್ಕೆ ಕುಗ್ಗಿಸುತ್ತದೆ.", "Aplink vaizdą pridedami nuliai. „same“ palieka 28 × 28; „valid“ sumažina iki 26 × 26."]],
      [["ReLU", "ReLU", "ReLU"], ["max(0, x): negative responses become 0.", "max(0, x): ಋಣ ಪ್ರತಿಕ್ರಿಯೆಗಳು 0 ಆಗುತ್ತವೆ.", "max(0, x): neigiami atsakymai tampa 0."]],
    ],
    tasks: [
      ["Choose 'Vertical edge' and hover a pixel on the left side of the ring.", "‘Vertical edge’ ಆಯ್ಕೆ ಮಾಡಿ ಮತ್ತು ಉಂಗುರದ ಎಡಭಾಗದ ಪಿಕ್ಸೆಲ್ ಮೇಲೆ ಹೋಗಿ.", "Pasirinkite „Vertikalus kraštas“ ir užveskite pelę ant taško žiedo kairėje."],
      ["Switch padding to 'valid' and check that the feature map is 26 × 26.", "ಪ್ಯಾಡಿಂಗ್ ಅನ್ನು 'valid' ಗೆ ಬದಲಿಸಿ ಮತ್ತು ಫೀಚರ್ ಮ್ಯಾಪ್ 26 × 26 ಎಂದು ಪರಿಶೀಲಿಸಿ.", "Pakeiskite užpildymą į „valid“ ir patikrinkite, ar požymių žemėlapis yra 26 × 26."],
      ["Turn ReLU off and find a negative value in the hover calculation.", "ReLU ಅನ್ನು ಆಫ್ ಮಾಡಿ ಮತ್ತು ಹೋವರ್ ಲೆಕ್ಕಾಚಾರದಲ್ಲಿ ಋಣ ಮೌಲ್ಯವನ್ನು ಹುಡುಕಿ.", "ReLU išjunkite ir užvedimo skaičiavime raskite neigiamą reikšmę."],
      ["Type your own nine kernel numbers and watch the map change.", "ನಿಮ್ಮ ಸ್ವಂತ ಒಂಬತ್ತು ಕರ್ನಲ್ ಸಂಖ್ಯೆಗಳನ್ನು ಟೈಪ್ ಮಾಡಿ ನಕ್ಷೆ ಬದಲಾಗುವುದನ್ನು ನೋಡಿ.", "Įveskite savo devynis branduolio skaičius ir stebėkite, kaip keičiasi žemėlapis."],
    ],
    questions: [
      {
        q: ["A one-pixel vertical line of ones sits in column 10. With the vertical-edge kernel and 'same' padding, what is the feature-map value at column 9, row 9?", "10ನೇ ಕಾಲಂನಲ್ಲಿ ಒಂದು ಪಿಕ್ಸೆಲ್ ದಪ್ಪದ ಲಂಬ ರೇಖೆ (ಎಲ್ಲಾ 1). Vertical-edge ಕರ್ನಲ್ ಮತ್ತು 'same' ಪ್ಯಾಡಿಂಗ್‌ನಲ್ಲಿ, 9ನೇ ಕಾಲಂ, 9ನೇ ಸಾಲಿನ ಫೀಚರ್ ಮ್ಯಾಪ್ ಮೌಲ್ಯ ಎಷ್ಟು?", "Vertikali linija, kurios taškai yra 1, stovi 10-me stulpelyje. Su „vertical edge“ branduoliu ir „same“ užpildymu, kokia požymių žemėlapio reikšmė 9-me stulpelyje, 9-oje eilutėje?"],
        options: [["4", "4", "4"], ["0", "0", "0"], ["−4", "−4", "−4"]],
        correct: 0,
        why: ["The pixel is left of the line, so the kernel's right column (weights 1, 2, 1) meets the line: 1 + 2 + 1 = 4.", "ಪಿಕ್ಸೆಲ್ ರೇಖೆಯ ಎಡಭಾಗದಲ್ಲಿದೆ; ಕರ್ನಲ್‌ನ ಬಲ ಕಾಲಂ (1, 2, 1) ರೇಖೆಯನ್ನು ಸೇರುತ್ತದೆ: 1 + 2 + 1 = 4.", "Taškas yra kairėje nuo linijos, todėl branduolio dešinysis stulpelis (1, 2, 1) susitinka su linija: 1 + 2 + 1 = 4."],
        verify: () => {
          const img = emptyImg();
          for (let y = 5; y <= 20; y++) img[y * SIZE + 10] = 1;
          return Math.abs(conv2d(img, KERNELS[0].w, "same", false).out[9 * SIZE + 9] - 4) < 1e-6;
        },
      },
      {
        q: ["Why does one kernel use the same nine weights at every position?", "ಒಂದು ಕರ್ನಲ್ ಪ್ರತಿ ಸ್ಥಾನದಲ್ಲೂ ಅದೇ ಒಂಬತ್ತು ತೂಕಗಳನ್ನು ಏಕೆ ಬಳಸುತ್ತದೆ?", "Kodėl vienas branduolys kiekvienoje padėtyje naudoja tuos pačius devynis svorius?"],
        options: [["Weight sharing: one pattern detector is searched over the whole picture, so far fewer weights are needed", "ತೂಕ ಹಂಚಿಕೆ: ಒಂದೇ ಮಾದರಿ ಶೋಧಕ ಇಡೀ ಚಿತ್ರದಲ್ಲಿ ಹುಡುಕುತ್ತದೆ, ಆದ್ದರಿಂದ ಕಡಿಮೆ ತೂಕಗಳು ಬೇಕು", "Svorių dalijimasis: vienas raštų detektorius ieškomas per visą vaizdą, todėl reikia daug mažiau svorių"], ["To make the output bigger", "ಔಟ್‌ಪುಟ್ ದೊಡ್ಡದಾಗಿಸಲು", "Kad išvestis būtų didesnė"], ["Because Dense layers cannot read pictures", "ಏಕೆಂದರೆ Dense ಪದರಗಳು ಚಿತ್ರ ಓದಲಾರವು", "Nes Dense sluoksniai negali skaityti vaizdų"]],
        correct: 0,
        why: ["Sharing the nine weights everywhere is why a Conv2D layer needs far fewer parameters than a Dense layer (step 5).", "ಒಂಬತ್ತು ತೂಕಗಳನ್ನು ಎಲ್ಲೆಡೆ ಹಂಚುವುದರಿಂದಲೇ Conv2D ಪದರಕ್ಕೆ Dense ಪದರಕ್ಕಿಂತ ಕಡಿಮೆ ಪ್ಯಾರಾಮೀಟರ್ ಸಾಕು (ಹಂತ 5).", "Devynių svorių dalijimasis visur – todėl Conv2D sluoksniui reikia gerokai mažiau parametrų nei Dense sluoksniui (5 žingsnis)."],
      },
      {
        q: ["What does 'same' padding keep?", "'same' ಪ್ಯಾಡಿಂಗ್ ಏನನ್ನು ಉಳಿಸುತ್ತದೆ?", "Ką išlaiko „same“ užpildymas?"],
        options: [["The sign of negative numbers", "ಋಣ ಸಂಖ್ಯೆಗಳ ಚಿಹ್ನೆ", "Neigiamų skaičių ženklą"], ["The number of kernels", "ಕರ್ನಲ್‌ಗಳ ಸಂಖ್ಯೆ", "Branduolių skaičių"], ["The size of the picture (28 × 28)", "ಚಿತ್ರದ ಗಾತ್ರ (28 × 28)", "Vaizdo dydį (28 × 28)"]],
        correct: 2,
        why: ["Zeros around the border let the 3 × 3 window be centred on every pixel, so the output keeps the input size.", "ಗಡಿಯ ಸುತ್ತ ಶೂನ್ಯಗಳಿರುವುದರಿಂದ 3 × 3 ಕಿಟಕಿ ಪ್ರತಿ ಪಿಕ್ಸೆಲ್ ಮೇಲೆ ಕೇಂದ್ರೀಕೃತವಾಗುತ್ತದೆ; ಔಟ್‌ಪುಟ್ ಗಾತ್ರ ಉಳಿಯುತ್ತದೆ.", "Nuliai aplink kraštą leidžia 3 × 3 langui būti centruotam kiekviename taške, todėl išvestis išlaiko įvesties dydį."],
      },
    ],
    takeaways: [
      ["A kernel is a small set of weights that is multiplied and summed at every position.", "ಕರ್ನಲ್ ಪ್ರತಿ ಸ್ಥಾನದಲ್ಲಿ ಗುಣಿಸಿ ಸೇರಿಸುವ ತೂಕಗಳ ಸಣ್ಣ ಗುಂಪು.", "Branduolys – tai mažas svorių rinkinys, kuris kiekvienoje padėtyje dauginamas ir sudedamas."],
      ["Padding decides the output size.", "ಪ್ಯಾಡಿಂಗ್ ಔಟ್‌ಪುಟ್ ಗಾತ್ರ ನಿರ್ಧರಿಸುತ್ತದೆ.", "Užpildymas nusako išvesties dydį."],
      ["ReLU keeps only the positive responses.", "ReLU ಧನಾತ್ಮಕ ಪ್ರತಿಕ್ರಿಯೆಗಳನ್ನು ಮಾತ್ರ ಉಳಿಸುತ್ತದೆ.", "ReLU palieka tik teigiamus atsakus."],
    ],
    mistakes: [
      ["Forgetting that the kernel is the same at every position.", "ಕರ್ನಲ್ ಪ್ರತಿ ಸ್ಥಾನದಲ್ಲೂ ಒಂದೇ ಎಂಬುದನ್ನು ಮರೆಯುವುದು.", "Pamiršti, kad branduolys visose padėtyse tas pats."],
    ],
  },

  pool: {
    goal: [
      "Understand how pooling halves a feature map and what max and average pooling keep.",
      "ಪೂಲಿಂಗ್ ಫೀಚರ್ ಮ್ಯಾಪ್ ಅನ್ನು ಹೇಗೆ ಅರ್ಧ ಮಾಡುತ್ತದೆ ಮತ್ತು ಮ್ಯಾಕ್ಸ್ ಹಾಗೂ ಸರಾಸರಿ ಪೂಲಿಂಗ್ ಏನನ್ನು ಉಳಿಸುತ್ತವೆ ಎಂದು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.",
      "Suprasti, kaip sujungimas (pooling) perpus sumažina požymių žemėlapį ir ką išlaiko didžiausias bei vidurkio sujungimas.",
    ],
    fit: [
      "Each conv block of the lab ends with 2 × 2 pooling. It shrinks the map, makes the network less sensitive to a shift of one pixel and reduces the next layers' parameters.",
      "ಲ್ಯಾಬ್‌ನ ಪ್ರತಿ ಕನ್ವ್ ಬ್ಲಾಕ್ 2 × 2 ಪೂಲಿಂಗ್‌ನೊಂದಿಗೆ ಮುಗಿಯುತ್ತದೆ. ಇದು ನಕ್ಷೆಯನ್ನು ಕುಗ್ಗಿಸುತ್ತದೆ, ಒಂದು ಪಿಕ್ಸೆಲ್ ಸ್ಥಳಾಂತರಕ್ಕೆ ನೆಟ್‌ವರ್ಕ್ ಸೂಕ್ಷ್ಮತೆ ಕಡಿಮೆ ಮಾಡುತ್ತದೆ ಮತ್ತು ಮುಂದಿನ ಪದರಗಳ ಪ್ಯಾರಾಮೀಟರ್ ಕಡಿಮೆ ಮಾಡುತ್ತದೆ.",
      "Kiekvienas laboratorijos konvoliucijos blokas baigiasi 2 × 2 sujungimu. Jis sumažina žemėlapį, tinklas mažiau jautrus vieno taško poslinkiui ir sumažėja kitų sluoksnių parametrų.",
    ],
    keywords: [
      [["Pooling", "ಪೂಲಿಂಗ್", "Sujungimas"], ["Summarise each 2 × 2 block by one number.", "ಪ್ರತಿ 2 × 2 ಬ್ಲಾಕ್ ಅನ್ನು ಒಂದು ಸಂಖ್ಯೆಯಲ್ಲಿ ಸಂಕ್ಷೇಪಿಸಿ.", "Kiekvieną 2 × 2 bloką apibendrinkite vienu skaičiumi."]],
      [["Max pooling", "ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್", "Didžiausio sujungimas"], ["Keep the largest value: strong features survive small shifts.", "ದೊಡ್ಡ ಮೌಲ್ಯ ಉಳಿಸಿ: ಬಲವಾದ ಲಕ್ಷಣಗಳು ಸಣ್ಣ ಸ್ಥಳಾಂತರದಲ್ಲೂ ಉಳಿಯುತ್ತವೆ.", "Išlaikykite didžiausią reikšmę: stiprūs požymiai išlieka net ir nedaug pasislinkę."]],
      [["Average pooling", "ಸರಾಸರಿ ಪೂಲಿಂಗ್", "Vidurkio sujungimas"], ["Keep the mean: smoother, but one strong pixel is diluted.", "ಸರಾಸರಿ ಉಳಿಸಿ: ಮೃದು, ಆದರೆ ಒಂದು ಬಲವಾದ ಪಿಕ್ಸೆಲ್ ದುರ್ಬಲಗೊಳ್ಳುತ್ತದೆ.", "Išlaikykite vidurkį: sklandžiau, bet vienas stiprus taškas nusilpsta."]],
      [["Stride 2", "ಸ್ಟ್ರೈಡ್ 2", "Žingsnis 2"], ["The window moves two pixels at a time, so the map halves.", "ಕಿಟಕಿ ಒಂದು ಬಾರಿ ಎರಡು ಪಿಕ್ಸೆಲ್ ಚಲಿಸುತ್ತದೆ; ಆದ್ದರಿಂದ ನಕ್ಷೆ ಅರ್ಧವಾಗುತ್ತದೆ.", "Langas juda po du taškus, todėl žemėlapis perpus mažėja."]],
    ],
    tasks: [
      ["Click a cell and watch the 2 × 2 result change.", "ಒಂದು ಕೋಶ ಕ್ಲಿಕ್ ಮಾಡಿ 2 × 2 ಫಲಿತಾಂಶ ಬದಲಾಗುವುದನ್ನು ನೋಡಿ.", "Spustelėkite langelį ir stebėkite, kaip keičiasi 2 × 2 rezultatas."],
      ["Press Max and then Average on the same grid.", "ಅದೇ ಗ್ರಿಡ್‌ನಲ್ಲಿ Max ಮತ್ತು ನಂತರ Average ಒತ್ತಿ.", "Tame pačiame tinklelyje paspauskite „Didžiausias“, tada „Vidurkis“."],
      ["Randomise the grid and check the max of the first block by eye.", "ಗ್ರಿಡ್ ಅನ್ನು ಯಾದೃಚ್ಛಿಕಗೊಳಿಸಿ ಮೊದಲ ಬ್ಲಾಕ್‌ನ ಗರಿಷ್ಠ ಮೌಲ್ಯವನ್ನು ನೋಡಿ.", "Tinklelį atsitiktinai sumaišykite ir akimi patikrinkite pirmo bloko didžiausią reikšmę."],
      ["Find a grid where max and average differ most.", "ಮ್ಯಾಕ್ಸ್ ಮತ್ತು ಸರಾಸರಿ ಅತಿ ಹೆಚ್ಚು ಭಿನ್ನವಾಗುವ ಗ್ರಿಡ್ ಹುಡುಕಿ.", "Raskite tinklelį, kuriame didžiausias ir vidurkis skiriasi labiausiai."],
    ],
    questions: [
      {
        q: ["A 2 × 2 block holds 1, 3, 2 and 8. What does max pooling output?", "2 × 2 ಬ್ಲಾಕ್‌ನಲ್ಲಿ 1, 3, 2, 8 ಇವೆ. ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ಏನು ಔಟ್‌ಪುಟ್ ಮಾಡುತ್ತದೆ?", "2 × 2 bloke yra 1, 3, 2 ir 8. Ką išveda didžiausio sujungimas?"],
        options: [["8", "8", "8"], ["3.5", "3.5", "3,5"], ["14", "14", "14"]],
        correct: 0,
        why: ["Max pooling keeps the largest value, 8. The average would be (1 + 3 + 2 + 8) ÷ 4 = 3.5.", "ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ದೊಡ್ಡ ಮೌಲ್ಯ 8 ಉಳಿಸುತ್ತದೆ. ಸರಾಸರಿ (1 + 3 + 2 + 8) ÷ 4 = 3.5 ಆಗುತ್ತಿತ್ತು.", "Didžiausio sujungimas palieka didžiausią reikšmę 8. Vidurkis būtų (1 + 3 + 2 + 8) ÷ 4 = 3,5."],
        // the block 1 3 / 2 8 sits at grid indices 0, 1, 4, 5
        verify: () => {
          const g = [1, 3, 0, 0, 2, 8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
          return pool2x2(g, "max")[0] === 8 && pool2x2(g, "avg")[0] === 3.5;
        },
      },
      {
        q: ["What does 2 × 2 pooling with stride 2 do to a 28 × 28 map?", "ಸ್ಟ್ರೈಡ್ 2 ಇರುವ 2 × 2 ಪೂಲಿಂಗ್ 28 × 28 ನಕ್ಷೆಯನ್ನು ಏನು ಮಾಡುತ್ತದೆ?", "Ką 2 × 2 sujungimas su žingsniu 2 daro 28 × 28 žemėlapiui?"],
        options: [["Makes it 14 × 14", "14 × 14 ಮಾಡುತ್ತದೆ", "Padaro 14 × 14"], ["Makes it 56 × 56", "56 × 56 ಮಾಡುತ್ತದೆ", "Padaro 56 × 56"], ["Keeps it 28 × 28", "28 × 28 ಉಳಿಸುತ್ತದೆ", "Palieka 28 × 28"]],
        correct: 0,
        why: ["Each side is cut in half: 28 ÷ 2 = 14. This is why the lab's CNN has size 14, then 7, then 3.", "ಪ್ರತಿ ಬದಿ ಅರ್ಧವಾಗುತ್ತದೆ: 28 ÷ 2 = 14. ಆದ್ದರಿಂದಲೇ ಲ್ಯಾಬ್ CNN ಗಾತ್ರ 14, ನಂತರ 7, ನಂತರ 3.", "Kiekviena kraštinė perpus mažėja: 28 ÷ 2 = 14. Todėl laboratorijos CNN dydžiai yra 14, tada 7, tada 3."],
        verify: () => Math.floor(28 / 2) === 14 && Math.floor(14 / 2) === 7 && Math.floor(7 / 2) === 3,
      },
      {
        q: ["Why is max pooling usually preferred for detecting a pattern?", "ರಚನೆಯನ್ನು ಪತ್ತೆಹಚ್ಚಲು ಸಾಮಾನ್ಯವಾಗಿ ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ಏಕೆ ಆದ್ಯತೆ?", "Kodėl raštui aptikti dažniausiai renkamasi didžiausio sujungimas?"],
        options: [["It keeps the strongest response, so the pattern survives if it moves by a pixel", "ಬಲವಾದ ಪ್ರತಿಕ್ರಿಯೆ ಉಳಿಸುತ್ತದೆ; ಒಂದು ಪಿಕ್ಸೆಲ್ ಸರಿದರೂ ರಚನೆ ಉಳಿಯುತ್ತದೆ", "Išlaiko stipriausią atsaką, todėl raštas išlieka net pasislinkus per tašką"], ["It is faster than average", "ಸರಾಸರಿಗಿಂತ ವೇಗ", "Jis greitesnis už vidurkį"], ["It removes all negative numbers", "ಎಲ್ಲಾ ಋಣ ಸಂಖ್ಯೆಗಳನ್ನು ತೆಗೆದುಹಾಕುತ್ತದೆ", "Pašalina visus neigiamus skaičius"]],
        correct: 0,
        why: ["Max pooling is robust to small shifts because a strong response stays in its block.", "ಬಲವಾದ ಪ್ರತಿಕ್ರಿಯೆ ತನ್ನ ಬ್ಲಾಕ್‌ನಲ್ಲಿಯೇ ಉಳಿಯುವುದರಿಂದ ಮ್ಯಾಕ್ಸ್ ಪೂಲಿಂಗ್ ಸಣ್ಣ ಸ್ಥಳಾಂತರಕ್ಕೆ ದೃಢವಾಗಿದೆ.", "Didžiausio sujungimas atsparus nedideliems poslinkiams, nes stiprus atsakas lieka savo bloke."],
      },
    ],
    takeaways: [
      ["Pooling keeps one number per 2 × 2 block.", "ಪೂಲಿಂಗ್ ಪ್ರತಿ 2 × 2 ಬ್ಲಾಕ್‌ಗೆ ಒಂದು ಸಂಖ್ಯೆ ಉಳಿಸುತ್ತದೆ.", "Sujungimas palieka po vieną skaičių kiekviename 2 × 2 bloke."],
      ["Max keeps peaks; average keeps the mean.", "ಮ್ಯಾಕ್ಸ್ ಶಿಖರಗಳನ್ನು, ಸರಾಸರಿ ಸರಾಸರಿಯನ್ನು ಉಳಿಸುತ್ತದೆ.", "Didžiausias palieka viršūnes, vidurkis – vidurkį."],
      ["Pooling has no weights to learn.", "ಪೂಲಿಂಗ್‌ನಲ್ಲಿ ಕಲಿಯಬೇಕಾದ ತೂಕಗಳಿಲ್ಲ.", "Sujungime nėra svorių, kuriuos reikėtų mokytis."],
    ],
    mistakes: [
      ["Expecting pooling to change the number of channels: it works on each map separately.", "ಪೂಲಿಂಗ್ ಚಾನೆಲ್ ಸಂಖ್ಯೆ ಬದಲಿಸುತ್ತದೆ ಎಂದು ನಿರೀಕ್ಷಿಸುವುದು: ಅದು ಪ್ರತಿ ನಕ್ಷೆಯ ಮೇಲೆ ಪ್ರತ್ಯೇಕವಾಗಿ ಕೆಲಸ ಮಾಡುತ್ತದೆ.", "Tikėtis, kad sujungimas keičia kanalų skaičių: jis dirba su kiekvienu žemėlapiu atskirai."],
    ],
  },

  params: {
    goal: [
      "Count the parameters of the lab's CNN and see why a Conv2D layer is cheaper than a Dense layer on images.",
      "ಲ್ಯಾಬ್‌ನ CNN ನ ಪ್ಯಾರಾಮೀಟರ್‌ಗಳನ್ನು ಎಣಿಸಿ, ಚಿತ್ರಗಳ ಮೇಲೆ Conv2D ಪದರ Dense ಪದರಕ್ಕಿಂತ ಏಕೆ ಅಗ್ಗ ಎಂದು ನೋಡಿ.",
      "Suskaičiuokite laboratorijos CNN parametrus ir pamatykite, kodėl Conv2D sluoksnis vaizduose pigesnis nei Dense sluoksnis.",
    ],
    fit: [
      "Task 1 asks you to compare the CNN with the fully connected network of Lab 1. The parameter count is how many numbers the network learns, which explains its speed and memory.",
      "ಕಾರ್ಯ 1 CNN ಅನ್ನು ಲ್ಯಾಬ್ 1ರ ಸಂಪೂರ್ಣ ಸಂಪರ್ಕಿತ ನೆಟ್‌ವರ್ಕ್ ಜೊತೆ ಹೋಲಿಸಲು ಕೇಳುತ್ತದೆ. ಪ್ಯಾರಾಮೀಟರ್ ಸಂಖ್ಯೆ ನೆಟ್‌ವರ್ಕ್ ಕಲಿಯುವ ಸಂಖ್ಯೆಗಳ ಸಂಖ್ಯೆ; ಇದು ವೇಗ ಮತ್ತು ಸ್ಮರಣೆಯನ್ನು ವಿವರಿಸುತ್ತದೆ.",
      "1 užduotis prašo palyginti CNN su 1 laboratorijos pilnai sujungtu tinklu. Parametrų skaičius – tai, kiek skaičių tinklas išmoksta; tai paaiškina greitį ir atmintį.",
    ],
    keywords: [
      [["Parameter", "ಪ್ಯಾರಾಮೀಟರ್", "Parametras"], ["A number the network learns: a weight or a bias.", "ನೆಟ್‌ವರ್ಕ್ ಕಲಿಯುವ ಸಂಖ್ಯೆ: ತೂಕ ಅಥವಾ ಬಯಾಸ್.", "Skaičius, kurį tinklas išmoksta: svoris arba poslinkis (bias)."]],
      [["Filters", "ಫಿಲ್ಟರ್‌ಗಳು", "Filtrai"], ["How many different kernels a Conv2D layer has.", "ಒಂದು Conv2D ಪದರದಲ್ಲಿ ಎಷ್ಟು ವಿಭಿನ್ನ ಕರ್ನಲ್‌ಗಳಿವೆ.", "Kiek skirtingų branduolių turi Conv2D sluoksnis."]],
      [["Flatten", "ಫ್ಲ್ಯಾಟನ್", "Suplokštinimas"], ["Turns the last feature maps into one long vector for the Dense layers.", "ಕೊನೆಯ ಫೀಚರ್ ನಕ್ಷೆಗಳನ್ನು Dense ಪದರಗಳಿಗಾಗಿ ಒಂದು ಉದ್ದ ವೆಕ್ಟರ್ ಆಗಿ ಬದಲಿಸುತ್ತದೆ.", "Paskutinius požymių žemėlapius paverčia vienu ilgu vektoriumi Dense sluoksniams."]],
      [["Weight sharing", "ತೂಕ ಹಂಚಿಕೆ", "Svorių dalijimasis"], ["The same kernel is reused at every position.", "ಅದೇ ಕರ್ನಲ್ ಪ್ರತಿ ಸ್ಥಾನದಲ್ಲೂ ಮರುಬಳಕೆಯಾಗುತ್ತದೆ.", "Tas pats branduolys naudojamas kiekvienoje padėtyje."]],
    ],
    tasks: [
      ["Set 3 blocks, 32 filters and kernel 3, then read the total.", "3 ಬ್ಲಾಕ್, 32 ಫಿಲ್ಟರ್ ಮತ್ತು ಕರ್ನಲ್ 3 ಹೊಂದಿಸಿ, ನಂತರ ಒಟ್ಟು ಓದಿ.", "Nustatykite 3 blokus, 32 filtrus ir branduolį 3, tada perskaitykite sumą."],
      ["Check that the total equals the recorded run 4 (241 546).", "ಒಟ್ಟು ದಾಖಲಾದ ರನ್ 4 (241 546) ಗೆ ಸಮವಾಗಿದೆಯೇ ಪರಿಶೀಲಿಸಿ.", "Patikrinkite, ar suma lygi įrašytam 4 paleidimui (241 546)."],
      ["Change the kernel to 5 and see the CNN grow.", "ಕರ್ನಲ್ ಅನ್ನು 5 ಗೆ ಬದಲಿಸಿ CNN ಬೆಳೆಯುವುದನ್ನು ನೋಡಿ.", "Branduolį pakeiskite į 5 ir stebėkite, kaip auga CNN."],
      ["Compare with the Lab 1 network (575 050).", "ಲ್ಯಾಬ್ 1 ನೆಟ್‌ವರ್ಕ್ (575 050) ಜೊತೆ ಹೋಲಿಸಿ.", "Palyginkite su 1 laboratorijos tinklu (575 050)."],
    ],
    questions: [
      {
        q: ["How many parameters does the first Conv2D layer have with 32 filters of size 3 × 3 on a grey picture?", "ಬೂದು ಚಿತ್ರದ ಮೇಲೆ 3 × 3 ಗಾತ್ರದ 32 ಫಿಲ್ಟರ್‌ಗಳಿರುವ ಮೊದಲ Conv2D ಪದರಕ್ಕೆ ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು?", "Kiek parametrų turi pirmasis Conv2D sluoksnis su 32 filtrais 3 × 3 dydžio pilkame vaizde?"],
        options: [["320", "320", "320"], ["288", "288", "288"], ["9 216", "9 216", "9 216"]],
        correct: 0,
        why: ["(3 × 3 × 1 input + 1 bias) × 32 filters = 10 × 32 = 320.", "(3 × 3 × 1 ಇನ್‌ಪುಟ್ + 1 ಬಯಾಸ್) × 32 ಫಿಲ್ಟರ್ = 10 × 32 = 320.", "(3 × 3 × 1 įvestis + 1 poslinkis) × 32 filtrai = 10 × 32 = 320."],
        verify: () => cnnBreakdown({ blocks: 1, firstFilters: 32, kernel: 3 }).conv[0].params === 320,
      },
      {
        q: ["The lab's 3-block CNN has 241 546 parameters. Which part is the largest?", "ಲ್ಯಾಬ್‌ನ 3-ಬ್ಲಾಕ್ CNN 241 546 ಪ್ಯಾರಾಮೀಟರ್ ಹೊಂದಿದೆ. ಯಾವ ಭಾಗ ಅತಿ ದೊಡ್ಡದು?", "Laboratorijos 3 blokų CNN turi 241 546 parametrus. Kuri dalis didžiausia?"],
        options: [["The Dense 128 layer after Flatten", "Flatten ನಂತರದ Dense 128 ಪದರ", "Dense 128 sluoksnis po suplokštinimo"], ["The first Conv2D", "ಮೊದಲ Conv2D", "Pirmasis Conv2D"], ["The output Dense 10", "ಔಟ್‌ಪುಟ್ Dense 10", "Išvesties Dense 10"]],
        correct: 0,
        why: ["After three pools the map is 3 × 3 × 128 = 1 152 values, so Dense 128 has 147 584 weights and biases.", "ಮೂರು ಪೂಲ್‌ಗಳ ನಂತರ ನಕ್ಷೆ 3 × 3 × 128 = 1 152 ಮೌಲ್ಯಗಳು; Dense 128ರಲ್ಲಿ 147 584 ತೂಕ ಮತ್ತು ಬಯಾಸ್.", "Po trijų sujungimų žemėlapis yra 3 × 3 × 128 = 1 152 reikšmės, todėl Dense 128 turi 147 584 svorius ir poslinkius."],
        verify: () => { const b = cnnBreakdown({ blocks: 3, firstFilters: 32, kernel: 3 }); return b.dense1 === 147584 && b.dense1 > Math.max(...b.conv.map((c) => c.params)); },
      },
      {
        q: ["The fully connected 512-256-128-64 net of Lab 1 has how many parameters?", "ಲ್ಯಾಬ್ 1ರ ಸಂಪೂರ್ಣ ಸಂಪರ್ಕಿತ 512-256-128-64 ನೆಟ್‌ವರ್ಕ್‌ನಲ್ಲಿ ಎಷ್ಟು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳಿವೆ?", "Kiek parametrų turi 1 laboratorijos pilnai sujungtas 512-256-128-64 tinklas?"],
        options: [["241 546", "241 546", "241 546"], ["804 554", "804 554", "804 554"], ["575 050", "575 050", "575 050"]],
        correct: 2,
        why: ["Layer by layer: 784 × 512 + 512, 512 × 256 + 256, 256 × 128 + 128, 128 × 64 + 64, 64 × 10 + 10, which sum to 575 050.", "ಪದರ ಪದರವಾಗಿ: 784 × 512 + 512, 512 × 256 + 256, 256 × 128 + 128, 128 × 64 + 64, 64 × 10 + 10; ಒಟ್ಟು 575 050.", "Sluoksnis po sluoksnio: 784 × 512 + 512, 512 × 256 + 256, 256 × 128 + 128, 128 × 64 + 64, 64 × 10 + 10 – iš viso 575 050."],
        verify: () => denseParams(LAB1_SIZES) === 575050,
      },
    ],
    takeaways: [
      ["Conv2D weights are reused at every position, so there are few of them.", "Conv2D ತೂಕಗಳು ಪ್ರತಿ ಸ್ಥಾನದಲ್ಲೂ ಮರುಬಳಕೆಯಾಗುತ್ತವೆ; ಆದ್ದರಿಂದ ಅವು ಕಡಿಮೆ.", "Conv2D svoriai naudojami kiekvienoje padėtyje, todėl jų nedaug."],
      ["Most parameters of this CNN sit in the Dense layer after Flatten.", "ಈ CNN ನ ಬಹುಪಾಲು ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು Flatten ನಂತರದ Dense ಪದರದಲ್ಲಿವೆ.", "Didžioji dalis šio CNN parametrų yra Dense sluoksnyje po suplokštinimo."],
      ["Counting by hand is a good check of the code.", "ಕೈಯಿಂದ ಎಣಿಸುವುದು ಕೋಡ್‌ಗೆ ಉತ್ತಮ ಪರಿಶೀಲನೆ.", "Skaičiavimas ranka – geras kodo patikrinimas."],
    ],
    mistakes: [
      ["Forgetting the bias: every filter and every Dense neuron has one extra parameter.", "ಬಯಾಸ್ ಮರೆಯುವುದು: ಪ್ರತಿ ಫಿಲ್ಟರ್ ಮತ್ತು ಪ್ರತಿ Dense ನ್ಯೂರಾನ್‌ಗೆ ಒಂದು ಹೆಚ್ಚುವರಿ ಪ್ಯಾರಾಮೀಟರ್ ಇದೆ.", "Pamiršti poslinkį: kiekvienas filtras ir kiekvienas Dense neuronas turi dar vieną parametrą."],
    ],
  },

  learning: {
    goal: [
      "Feel how the learning rate and the number of epochs change gradient descent.",
      "ಕಲಿಕೆ ದರ ಮತ್ತು ಎಪೋಕ್‌ಗಳ ಸಂಖ್ಯೆ ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್ ಅನ್ನು ಹೇಗೆ ಬದಲಿಸುತ್ತವೆ ಎಂಬುದನ್ನು ಅನುಭವಿಸಿ.",
      "Pajuskite, kaip mokymosi greitis ir epochų skaičius keičia gradientinį nusileidimą.",
    ],
    fit: [
      "The Task 1 objective asks you to study the influence of the learning rate and the epochs. This toy problem makes the effect visible in one picture.",
      "ಕಾರ್ಯ 1ರ ಉದ್ದೇಶ ಕಲಿಕೆ ದರ ಮತ್ತು ಎಪೋಕ್‌ಗಳ ಪರಿಣಾಮವನ್ನು ಅಧ್ಯಯನ ಮಾಡಲು ಕೇಳುತ್ತದೆ. ಈ ಸರಳ ಸಮಸ್ಯೆ ಪರಿಣಾಮವನ್ನು ಒಂದೇ ಚಿತ್ರದಲ್ಲಿ ತೋರಿಸುತ್ತದೆ.",
      "1 užduoties tikslas – ištirti mokymosi greičio ir epochų įtaką. Šis paprastas uždavinys parodo poveikį viename paveikslėlyje.",
    ],
    keywords: [
      [["Gradient descent", "ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್", "Gradientinis nusileidimas"], ["Move the weight against the slope of the loss.", "ತೂಕವನ್ನು ನಷ್ಟದ ಇಳಿಜಾರಿನ ವಿರುದ್ಧ ದಿಕ್ಕಿನಲ್ಲಿ ಸರಿಸಿ.", "Perkelkite svorį prieš nuostolio nuolydį."]],
      [["Learning rate", "ಕಲಿಕೆ ದರ", "Mokymosi greitis"], ["How big each step is.", "ಪ್ರತಿ ಹೆಜ್ಜೆ ಎಷ್ಟು ದೊಡ್ಡದು.", "Koks didelis kiekvienas žingsnis."]],
      [["Epoch", "ಎಪೋಕ್", "Epocha"], ["One pass of updates. Here one update per epoch.", "ನವೀಕರಣಗಳ ಒಂದು ಸುತ್ತು. ಇಲ್ಲಿ ಪ್ರತಿ ಎಪೋಕ್‌ಗೆ ಒಂದು ನವೀಕರಣ.", "Vienas atnaujinimų ratas. Čia – po vieną atnaujinimą kiekvienai epochai."]],
      [["Divergence", "ವಿಭಿನ್ನತೆ (ಡೈವರ್ಜೆನ್ಸ್)", "Divergavimas"], ["Steps so big that the loss grows.", "ಹೆಜ್ಜೆಗಳು ಎಷ್ಟು ದೊಡ್ಡವೆಂದರೆ ನಷ್ಟ ಹೆಚ್ಚುತ್ತದೆ.", "Žingsniai tokie dideli, kad nuostolis auga."]],
    ],
    tasks: [
      ["Keep the rate at 0.3 and 10 epochs, then read the final w.", "ದರ 0.3 ಮತ್ತು 10 ಎಪೋಕ್ ಇಟ್ಟು ಅಂತಿಮ w ಓದಿ.", "Greitį 0,3 ir 10 epochų palikite, tada perskaitykite galutinį w."],
      ["Set the rate to 1.1 and watch the value jump across zero.", "ದರ 1.1 ಗೆ ಹೊಂದಿಸಿ ಮೌಲ್ಯ ಶೂನ್ಯವನ್ನು ದಾಟಿ ಜಿಗಿಯುವುದನ್ನು ನೋಡಿ.", "Greitį nustatykite 1,1 ir stebėkite, kaip reikšmė peršoka per nulį."],
      ["Set the rate to 0.02 and raise the epochs until the loss is almost zero.", "ದರ 0.02 ಗೆ ಹೊಂದಿಸಿ, ನಷ್ಟ ಬಹುತೇಕ ಶೂನ್ಯವಾಗುವವರೆಗೆ ಎಪೋಕ್ ಹೆಚ್ಚಿಸಿ.", "Greitį nustatykite 0,02 ir didinkite epochas, kol nuostolis beveik nulis."],
      ["Find the rate that is most reasonable for a few epochs.", "ಕೆಲವು ಎಪೋಕ್‌ಗಳಿಗೆ ಅತ್ಯಂತ ಸೂಕ್ತ ದರ ಕಂಡುಹಿಡಿಯಿರಿ.", "Kelioms epochoms tinkamiausią greitį raskite."],
    ],
    questions: [
      {
        q: ["With rate 0.3 each epoch multiplies w by 1 − 2 × 0.3 = 0.4. Starting at w = 4, what is w after 10 epochs?", "ದರ 0.3 ನಲ್ಲಿ ಪ್ರತಿ ಎಪೋಕ್ w ಅನ್ನು 1 − 2 × 0.3 = 0.4 ರಿಂದ ಗುಣಿಸುತ್ತದೆ. w = 4 ರಿಂದ ಪ್ರಾರಂಭಿಸಿದರೆ 10 ಎಪೋಕ್ ನಂತರ w ಎಷ್ಟು?", "Su 0,3 greičiu kiekviena epocha w padauginama iš 1 − 2 × 0,3 = 0,4. Pradėję nuo w = 4, kokia bus w po 10 epochų?"],
        options: [["about 0.0004", "ಸುಮಾರು 0.0004", "apie 0,0004"], ["about 0.4", "ಸುಮಾರು 0.4", "apie 0,4"], ["exactly 0", "ನಿಖರವಾಗಿ 0", "tiksliai 0"]],
        correct: 0,
        why: ["4 × 0.4¹⁰ = 4 × 0.0001048576 ≈ 0.00042, so the loss w² is almost zero.", "4 × 0.4¹⁰ = 4 × 0.0001048576 ≈ 0.00042; ಆದ್ದರಿಂದ ನಷ್ಟ w² ಬಹುತೇಕ ಶೂನ್ಯ.", "4 × 0,4¹⁰ = 4 × 0,0001048576 ≈ 0,00042, todėl nuostolis w² beveik nulis."],
        verify: () => Math.abs(gradientPath(0.3, 10).at(-1)!.w - 0.0004194304) < 1e-9,
      },
      {
        q: ["What happens with rate 1.1?", "ದರ 1.1 ನೊಂದಿಗೆ ಏನಾಗುತ್ತದೆ?", "Kas nutinka, kai greitis 1,1?"],
        options: [["The value swings from side to side with growing size, and the loss grows", "ಮೌಲ್ಯ ಬದಿಯಿಂದ ಬದಿಗೆ ಹೆಚ್ಚುತ್ತಾ ಅಲೆಯುತ್ತದೆ ಮತ್ತು ನಷ್ಟ ಹೆಚ್ಚುತ್ತದೆ", "Reikšmė svyruoja iš vienos pusės į kitą vis didėdama, o nuostolis auga"], ["The loss falls faster than with 0.3", "ನಷ್ಟ 0.3 ಗಿಂತ ವೇಗವಾಗಿ ಇಳಿಯುತ್ತದೆ", "Nuostolis krenta greičiau nei su 0,3"], ["Nothing changes", "ಏನೂ ಬದಲಾಗುವುದಿಲ್ಲ", "Nieko nesikeičia"]],
        correct: 0,
        why: ["Each step overshoots the minimum by more than the last: w ← −1.2·w, so the loss grows.", "ಪ್ರತಿ ಹೆಜ್ಜೆ ಕನಿಷ್ಠವನ್ನು ಹಿಂದಿನದಕ್ಕಿಂತ ಹೆಚ್ಚು ದಾಟುತ್ತದೆ: w ← −1.2·w; ಆದ್ದರಿಂದ ನಷ್ಟ ಹೆಚ್ಚುತ್ತದೆ.", "Kiekvienas žingsnis peršoka minimumą vis toliau: w ← −1,2·w, todėl nuostolis auga."],
        verify: () => gradientPath(1.1, 3).at(-1)!.loss > 16,
      },
      {
        q: ["Why does adding epochs not fix a rate that is too large?", "ತುಂಬಾ ದೊಡ್ಡ ದರವನ್ನು ಎಪೋಕ್ ಸೇರಿಸುವುದರಿಂದ ಏಕೆ ಸರಿಪಡಿಸಲಾಗುವುದಿಲ್ಲ?", "Kodėl pridėjus epochų per didelis greitis neištaisomas?"],
        options: [["Divergence grows with every update, so more epochs make it worse", "ಪ್ರತಿ ನವೀಕರಣದಲ್ಲೂ ವಿಭಿನ್ನತೆ ಹೆಚ್ಚುತ್ತದೆ; ಹೆಚ್ಚು ಎಪೋಕ್ ಅದನ್ನು ಇನ್ನಷ್ಟು ಹದಗೆಡಿಸುತ್ತದೆ", "Divergavimas auga su kiekvienu atnaujinimu, todėl daugiau epochų tik pablogina"], ["Epochs reset the weights", "ಎಪೋಕ್‌ಗಳು ತೂಕಗಳನ್ನು ಮರುಹೊಂದಿಸುತ್ತವೆ", "Epochos iš naujo nustato svorius"], ["Epochs only affect the test set", "ಎಪೋಕ್‌ಗಳು ಪರೀಕ್ಷಾ ಸೆಟ್ ಮೇಲೆ ಮಾತ್ರ ಪರಿಣಾಮ ಬೀರುತ್ತವೆ", "Epochos veikia tik testavimo rinkinį"]],
        correct: 0,
        why: ["The update is the same every epoch, so a factor larger than 1 in size repeats and grows.", "ಪ್ರತಿ ಎಪೋಕ್‌ನಲ್ಲಿ ನವೀಕರಣ ಒಂದೇ; 1ಕ್ಕಿಂತ ದೊಡ್ಡ ಗುಣಕ ಪುನರಾವರ್ತನೆಯಾಗಿ ಬೆಳೆಯುತ್ತದೆ.", "Kiekvienos epochos atnaujinimas tas pats; didesnis nei 1 daugiklis kartojasi ir auga."],
      },
    ],
    takeaways: [
      ["The learning rate scales every step of gradient descent.", "ಕಲಿಕೆ ದರ ಗ್ರೇಡಿಯಂಟ್ ಡಿಸೆಂಟ್‌ನ ಪ್ರತಿ ಹೆಜ್ಜೆಯನ್ನು ನಿಯಂತ್ರಿಸುತ್ತದೆ.", "Mokymosi greitis nusako kiekvieną gradientinio nusileidimo žingsnį."],
      ["Too small is slow; too large diverges.", "ತುಂಬಾ ಚಿಕ್ಕದು ನಿಧಾನ; ತುಂಬಾ ದೊಡ್ಡದು ವಿಭಿನ್ನವಾಗುತ್ತದೆ.", "Per mažas – lėtas; per didelis – divergavimas."],
      ["Epochs help only until the loss is already near zero.", "ನಷ್ಟ ಈಗಾಗಲೇ ಶೂನ್ಯಕ್ಕೆ ಹತ್ತಿರವಾಗುವವರೆಗೆ ಮಾತ್ರ ಎಪೋಕ್‌ಗಳು ಸಹಾಯ ಮಾಡುತ್ತವೆ.", "Epochos padeda tik tol, kol nuostolis dar nėra beveik nulis."],
    ],
    mistakes: [
      ["Reading the number of epochs as the cause of a good result; the rate matters more here.", "ಒಳ್ಳೆಯ ಫಲಿತಾಂಶಕ್ಕೆ ಎಪೋಕ್ ಸಂಖ್ಯೆ ಕಾರಣ ಎಂದು ಭಾವಿಸುವುದು; ಇಲ್ಲಿ ದರ ಹೆಚ್ಚು ಮುಖ್ಯ.", "Manyti, kad gero rezultato priežastis – epochų skaičius; čia svarbesnis greitis."],
    ],
  },
};
