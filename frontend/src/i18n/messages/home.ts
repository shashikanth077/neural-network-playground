import { build } from "./common";

/** Home page v2. Keys are prefixed `homev2.`. Kannada and Lithuanian are first drafts: have a native speaker review them. */
export const home = build([
  // ---- hero
  ["homev2.hero.eyebrow", "AI Lab · an open bench for AI ideas", "AI Lab · AI ಕಲ್ಪನೆಗಳಿಗೆ ಮುಕ್ತ ಪ್ರಯೋಗ ಮೇಜು", "AI Lab · atvira dirbtinio intelekto idėjų dirbtuvė"],
  ["homev2.hero.title.a", "See how AI works by", "AI ಹೇಗೆ ಕೆಲಸ ಮಾಡುತ್ತದೆ ಎಂದು ನೋಡಿ,", "Pamatykite, kaip veikia DI,"],
  ["homev2.hero.title.b", "running it yourself.", "ನೀವೇ ಅದನ್ನು ಚಲಾಯಿಸುವ ಮೂಲಕ.", "pats jį paleisdami."],
  ["homev2.hero.intro", "A growing map of AI concepts, each with a live example you can operate, plus guided labs, tools and cheatsheets. Start anywhere.", "AI ಪರಿಕಲ್ಪನೆಗಳ ಬೆಳೆಯುತ್ತಿರುವ ನಕ್ಷೆ: ಪ್ರತಿಯೊಂದಕ್ಕೂ ನೀವೇ ನಡೆಸಬಹುದಾದ ಲೈವ್ ಉದಾಹರಣೆ, ಜೊತೆಗೆ ಮಾರ್ಗದರ್ಶಿತ ಲ್ಯಾಬ್‌ಗಳು, ಸಾಧನಗಳು ಮತ್ತು ಚೀಟ್‌ಶೀಟ್‌ಗಳು. ಎಲ್ಲಿಂದಲಾದರೂ ಆರಂಭಿಸಿ.", "Augantis dirbtinio intelekto sąvokų žemėlapis: prie kiekvienos – gyvas pavyzdys, kurį galite išbandyti, taip pat vedamos laboratorijos, įrankiai ir atmintinės. Pradėkite bet kur."],
  ["homev2.hero.cta.concepts", "Explore the concepts →", "ಪರಿಕಲ್ಪನೆಗಳನ್ನು ಅನ್ವೇಷಿಸಿ →", "Naršyti sąvokas →"],
  ["homev2.hero.cta.labs", "Open the labs", "ಲ್ಯಾಬ್‌ಗಳನ್ನು ತೆರೆಯಿರಿ", "Atidaryti laboratorijas"],
  ["homev2.stat.concepts", "concepts", "ಪರಿಕಲ್ಪನೆಗಳು", "sąvokos"],
  ["homev2.stat.areas", "areas", "ವಿಭಾಗಗಳು", "sritys"],
  ["homev2.stat.live", "live examples", "ಲೈವ್ ಉದಾಹರಣೆಗಳು", "gyvi pavyzdžiai"],
  ["homev2.stat.labs", "labs", "ಲ್ಯಾಬ್‌ಗಳು", "laboratorijos"],
  ["homev2.stat.tools", "tools", "ಸಾಧನಗಳು", "įrankiai"],

  // ---- concept map
  ["homev2.map.title", "The AI concept map", "AI ಪರಿಕಲ್ಪನೆಗಳ ನಕ್ಷೆ", "DI sąvokų žemėlapis"],
  ["homev2.map.sub", "Every dot is a concept. Lines lead from what you need first to what builds on it. Open any dot to learn it.", "ಪ್ರತಿ ಚುಕ್ಕೆಯೂ ಒಂದು ಪರಿಕಲ್ಪನೆ. ಗೆರೆಗಳು ಮೊದಲು ತಿಳಿಯಬೇಕಾದುದರಿಂದ ಅದರ ಮೇಲೆ ಕಟ್ಟಿದುದರತ್ತ ಸಾಗುತ್ತವೆ. ಕಲಿಯಲು ಯಾವುದೇ ಚುಕ್ಕೆಯನ್ನು ತೆರೆಯಿರಿ.", "Kiekvienas taškas – sąvoka. Linijos veda nuo to, ką reikia suprasti pirmiausia, prie to, kas ant to remiasi. Atidarykite bet kurį tašką ir mokykitės."],
  ["homev2.map.alt", "Concept map: {n} concepts in {a} areas, linked by prerequisites", "ಪರಿಕಲ್ಪನೆ ನಕ್ಷೆ: {a} ವಿಭಾಗಗಳಲ್ಲಿ {n} ಪರಿಕಲ್ಪನೆಗಳು, ಪೂರ್ವಾಪೇಕ್ಷಿತಗಳಿಂದ ಜೋಡಿಸಲಾಗಿದೆ", "Sąvokų žemėlapis: {n} sąvokų {a} srityse, sujungtų pagal būtinas žinias"],
  ["homev2.map.skip", "Skip the concept map", "ಪರಿಕಲ್ಪನೆ ನಕ್ಷೆಯನ್ನು ಬಿಟ್ಟುಬಿಡಿ", "Praleisti sąvokų žemėlapį"],
  ["homev2.map.legend", "Legend", "ಸೂಚಿ", "Legenda"],
  ["homev2.map.legend.areas", "Areas (select one to highlight it)", "ವಿಭಾಗಗಳು (ಹೈಲೈಟ್ ಮಾಡಲು ಒಂದನ್ನು ಆರಿಸಿ)", "Sritys (pasirinkite, kad paryškintumėte)"],
  ["homev2.map.legend.status", "Status", "ಸ್ಥಿತಿ", "Būsena"],
  ["homev2.map.needs", "Needs {n}", "{n} ಪೂರ್ವಾಪೇಕ್ಷಿತ", "Reikia: {n}"],
  ["homev2.map.mobile", "Tap a concept to open it. Dashed means planned.", "ತೆರೆಯಲು ಪರಿಕಲ್ಪನೆಯನ್ನು ಒತ್ತಿ. ಚುಕ್ಕಿ ಗೆರೆ ಎಂದರೆ ಯೋಜಿತ.", "Palieskite sąvoką, kad ją atidarytumėte. Brūkšninė reiškia planuojamą."],
  ["homev2.map.count", "{n} concepts", "{n} ಪರಿಕಲ್ಪನೆಗಳು", "Sąvokų: {n}"],

  // ---- five layers
  ["homev2.layers.title", "One lab, five ways in", "ಒಂದು ಲ್ಯಾಬ್, ಐದು ದಾರಿಗಳು", "Viena laboratorija, penki keliai"],
  ["homev2.layers.sub", "Learn the idea, practise it, build with it, look it up and keep track of your runs.", "ಕಲ್ಪನೆಯನ್ನು ಕಲಿಯಿರಿ, ಅಭ್ಯಾಸ ಮಾಡಿ, ಅದರೊಂದಿಗೆ ನಿರ್ಮಿಸಿ, ಹುಡುಕಿ ನೋಡಿ ಮತ್ತು ನಿಮ್ಮ ರನ್‌ಗಳನ್ನು ಗಮನಿಸಿ.", "Išmokite idėją, pasipraktikuokite, kurkite su ja, pasitikrinkite ir sekite savo bandymus."],
  ["homev2.layer.learn", "Learn", "ಕಲಿಯಿರಿ", "Mokykitės"],
  ["homev2.layer.practise", "Practise", "ಅಭ್ಯಾಸ", "Praktika"],
  ["homev2.layer.build", "Build", "ನಿರ್ಮಿಸಿ", "Kūryba"],
  ["homev2.layer.reference", "Reference", "ಉಲ್ಲೇಖ", "Žinynas"],
  ["homev2.layer.track", "Track", "ಗಮನಿಸಿ", "Sekimas"],
  ["homev2.layer.concepts.desc", "{n} concepts in {a} areas. Each says what it is, why it matters and what to try.", "{a} ವಿಭಾಗಗಳಲ್ಲಿ {n} ಪರಿಕಲ್ಪನೆಗಳು. ಪ್ರತಿಯೊಂದೂ ಅದು ಏನು, ಏಕೆ ಮುಖ್ಯ ಮತ್ತು ಏನು ಪ್ರಯತ್ನಿಸಬೇಕು ಎಂದು ಹೇಳುತ್ತದೆ.", "{n} sąvokų {a} srityse. Kiekviena paaiškina, kas tai, kodėl svarbu ir ką išbandyti."],
  ["homev2.layer.labs.desc", "{n} guided labs available, {p} planned. Step by step, with your progress saved.", "{n} ಮಾರ್ಗದರ್ಶಿತ ಲ್ಯಾಬ್‌ಗಳು ಲಭ್ಯ, {p} ಯೋಜಿತ. ಹಂತ ಹಂತವಾಗಿ, ನಿಮ್ಮ ಪ್ರಗತಿ ಉಳಿಯುತ್ತದೆ.", "Prieinamos vedamos laboratorijos: {n}, planuojamos: {p}. Žingsnis po žingsnio, pažanga išsaugoma."],
  ["homev2.layer.tools.desc", "{n} interactive tools. Open-ended sandboxes for your own experiments.", "{n} ಸಂವಾದಾತ್ಮಕ ಸಾಧನಗಳು. ನಿಮ್ಮದೇ ಪ್ರಯೋಗಗಳಿಗೆ ಮುಕ್ತ ಸ್ಥಳಗಳು.", "Interaktyvūs įrankiai: {n}. Atviros smėlio dėžės jūsų pačių eksperimentams."],
  ["homev2.layer.sheets.desc", "{n} cheatsheets available, {p} planned. Formulas and diagrams at a glance.", "{n} ಚೀಟ್‌ಶೀಟ್‌ಗಳು ಲಭ್ಯ, {p} ಯೋಜಿತ. ಸೂತ್ರಗಳು ಮತ್ತು ರೇಖಾಚಿತ್ರಗಳು ಒಂದು ನೋಟದಲ್ಲಿ.", "Prieinamos atmintinės: {n}, planuojamos: {p}. Formulės ir schemos iš karto."],
  ["homev2.layer.runs.title", "My runs", "ನನ್ನ ರನ್‌ಗಳು", "Mano bandymai"],
  ["homev2.layer.runs.desc", "Your training runs are saved automatically, so you can find and compare them later.", "ನಿಮ್ಮ ತರಬೇತಿ ರನ್‌ಗಳು ತಾನಾಗಿಯೇ ಉಳಿಯುತ್ತವೆ; ನಂತರ ಹುಡುಕಿ ಹೋಲಿಸಬಹುದು.", "Jūsų mokymo bandymai išsaugomi automatiškai, todėl vėliau galėsite juos rasti ir palyginti."],
  ["homev2.layer.runs.link", "Open my runs →", "ನನ್ನ ರನ್‌ಗಳನ್ನು ತೆರೆಯಿರಿ →", "Atidaryti mano bandymus →"],
  ["homev2.layer.open", "Open →", "ತೆರೆಯಿರಿ →", "Atidaryti →"],

  // ---- continue / start
  ["homev2.continue.title", "Continue where you left off", "ನಿಲ್ಲಿಸಿದ ಜಾಗದಿಂದ ಮುಂದುವರಿಸಿ", "Tęskite ten, kur sustojote"],
  ["homev2.continue.last", "Last step: {step}", "ಕೊನೆಯ ಹಂತ: {step}", "Paskutinis žingsnis: {step}"],
  ["homev2.continue.progress", "{done} of {total} steps done", "{total} ರಲ್ಲಿ {done} ಹಂತಗಳು ಪೂರ್ಣ", "Atlikta žingsnių: {done} iš {total}"],
  ["homev2.continue.button", "Continue →", "ಮುಂದುವರಿಸಿ →", "Tęsti →"],
  ["homev2.start.title", "Start here", "ಇಲ್ಲಿಂದ ಆರಂಭಿಸಿ", "Pradėkite čia"],
  ["homev2.start.text", "New to AI Lab? Begin with the first guided lab, or follow the neural network basics path below.", "AI Lab ನಿಮಗೆ ಹೊಸದೇ? ಮೊದಲ ಮಾರ್ಗದರ್ಶಿತ ಲ್ಯಾಬ್‌ನಿಂದ ಆರಂಭಿಸಿ, ಅಥವಾ ಕೆಳಗಿನ ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್ ಮೂಲಭೂತ ದಾರಿಯನ್ನು ಅನುಸರಿಸಿ.", "Pirmą kartą AI Lab? Pradėkite nuo pirmosios vedamos laboratorijos arba sekite žemiau pateiktą neuroninių tinklų pagrindų kelią."],
  ["homev2.start.button", "Start the first lab →", "ಮೊದಲ ಲ್ಯಾಬ್ ಆರಂಭಿಸಿ →", "Pradėti pirmąją laboratoriją →"],

  // ---- learning paths
  ["homev2.paths.title", "Learning paths", "ಕಲಿಕಾ ದಾರಿಗಳು", "Mokymosi keliai"],
  ["homev2.paths.sub", "Short, ordered routes through the map. Each concept builds on the one before.", "ನಕ್ಷೆಯ ಮೂಲಕ ಚಿಕ್ಕ, ಕ್ರಮಬದ್ಧ ದಾರಿಗಳು. ಪ್ರತಿ ಪರಿಕಲ್ಪನೆಯೂ ಹಿಂದಿನದರ ಮೇಲೆ ನಿಂತಿದೆ.", "Trumpi, nuoseklūs keliai per žemėlapį. Kiekviena sąvoka remiasi ankstesne."],
  ["homev2.path.nn-basics.title", "Neural network basics", "ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್ ಮೂಲಭೂತ ಅಂಶಗಳು", "Neuroninių tinklų pagrindai"],
  ["homev2.path.nn-basics.blurb", "From a single neuron to backpropagation: how a network computes and how it learns.", "ಒಂದು ನ್ಯೂರಾನ್‌ನಿಂದ ಬ್ಯಾಕ್‌ಪ್ರೊಪಗೇಷನ್‌ವರೆಗೆ: ನೆಟ್‌ವರ್ಕ್ ಹೇಗೆ ಲೆಕ್ಕಿಸುತ್ತದೆ ಮತ್ತು ಹೇಗೆ ಕಲಿಯುತ್ತದೆ.", "Nuo vieno neurono iki grįžtamojo sklidimo: kaip tinklas skaičiuoja ir kaip mokosi."],
  ["homev2.path.training.title", "Training and generalisation", "ತರಬೇತಿ ಮತ್ತು ಸಾಮಾನ್ಯೀಕರಣ", "Mokymas ir apibendrinimas"],
  ["homev2.path.training.blurb", "Tune the learning, then stop the network from memorising: optimizers, regularisation and early stopping.", "ಕಲಿಕೆಯನ್ನು ಹೊಂದಿಸಿ, ನಂತರ ನೆಟ್‌ವರ್ಕ್ ಉರು ಹೊಡೆಯುವುದನ್ನು ತಡೆಯಿರಿ: ಆಪ್ಟಿಮೈಜರ್‌ಗಳು, ನಿಯಮಿತಗೊಳಿಸುವಿಕೆ ಮತ್ತು ಬೇಗ ನಿಲ್ಲಿಸುವಿಕೆ.", "Sureguliuokite mokymąsi, tada neleiskite tinklui įsiminti mokymo duomenų: optimizatoriai, reguliarizacija ir ankstyvas sustabdymas."],
  ["homev2.path.vision-sequences.title", "Vision and sequences", "ದೃಷ್ಟಿ ಮತ್ತು ಅನುಕ್ರಮಗಳು", "Vaizdai ir sekos"],
  ["homev2.path.vision-sequences.blurb", "How convolutions read images, then how text becomes numbers and flows through recurrent cells.", "ಕನ್ವಲ್ಯೂಷನ್‌ಗಳು ಚಿತ್ರಗಳನ್ನು ಹೇಗೆ ಓದುತ್ತವೆ, ನಂತರ ಪಠ್ಯ ಹೇಗೆ ಸಂಖ್ಯೆಗಳಾಗಿ ಪುನರಾವರ್ತಿತ ಕೋಶಗಳ ಮೂಲಕ ಹರಿಯುತ್ತದೆ.", "Kaip konvoliucijos skaito vaizdus, o tada kaip tekstas tampa skaičiais ir teka per rekurentines ląsteles."],
  ["homev2.paths.count", "{n} concepts", "{n} ಪರಿಕಲ್ಪನೆಗಳು", "Sąvokų: {n}"],
  ["homev2.paths.levels", "{from} to {to}", "{from} ರಿಂದ {to}", "Nuo „{from}“ iki „{to}“"],
  ["homev2.paths.live", "{n} of {total} with a live example", "{total} ರಲ್ಲಿ {n} ಕ್ಕೆ ಲೈವ್ ಉದಾಹರಣೆ ಇದೆ", "{n} iš {total} turi gyvą pavyzdį"],
  ["homev2.paths.start", "Start with {title} →", "{title} ನಿಂದ ಆರಂಭಿಸಿ →", "Pradėti nuo: {title} →"],

  // ---- coverage
  ["homev2.coverage.title", "What the lab covers today", "ಲ್ಯಾಬ್ ಇಂದು ಏನನ್ನು ಒಳಗೊಂಡಿದೆ", "Ką laboratorija apima šiandien"],
  ["homev2.coverage.sub", "Live numbers from the concept registry. Nothing here is hand-typed.", "ಪರಿಕಲ್ಪನೆ ದಾಖಲೆಯಿಂದ ನೇರ ಸಂಖ್ಯೆಗಳು. ಇಲ್ಲಿ ಯಾವುದನ್ನೂ ಕೈಯಿಂದ ಬರೆದಿಲ್ಲ.", "Gyvi skaičiai iš sąvokų registro. Nieko čia nerašyta ranka."],
  ["homev2.coverage.live", "live examples", "ಲೈವ್ ಉದಾಹರಣೆಗಳು", "gyvi pavyzdžiai"],
  ["homev2.coverage.reference", "reference only", "ಉಲ್ಲೇಖ ಮಾತ್ರ", "tik nuoroda"],
  ["homev2.coverage.planned", "planned", "ಯೋಜಿತ", "planuojama"],
  ["homev2.coverage.bar", "{live} live, {ref} reference only, {planned} planned, out of {total} concepts", "{total} ಪರಿಕಲ್ಪನೆಗಳಲ್ಲಿ {live} ಲೈವ್, {ref} ಉಲ್ಲೇಖ ಮಾತ್ರ, {planned} ಯೋಜಿತ", "Iš {total} sąvokų: {live} gyvi, {ref} tik nuoroda, {planned} planuojama"],
  ["homev2.coverage.link", "Open the full coverage report →", "ಪೂರ್ಣ ವ್ಯಾಪ್ತಿ ವರದಿಯನ್ನು ತೆರೆಯಿರಿ →", "Atidaryti visą aprėpties ataskaitą →"],
  ["homev2.next.title", "Planned next", "ಮುಂದೆ ಯೋಜಿತ", "Planuojama toliau"],
  ["homev2.next.sub", "These concepts are on the plan. Each will get an interactive example.", "ಈ ಪರಿಕಲ್ಪನೆಗಳು ಯೋಜನೆಯಲ್ಲಿವೆ. ಪ್ರತಿಯೊಂದಕ್ಕೂ ಸಂವಾದಾತ್ಮಕ ಉದಾಹರಣೆ ಸಿಗಲಿದೆ.", "Šios sąvokos yra plane. Kiekviena gaus interaktyvų pavyzdį."],
  ["homev2.next.none", "Everything in the registry has a live example or a reference entry.", "ದಾಖಲೆಯಲ್ಲಿರುವ ಎಲ್ಲದಕ್ಕೂ ಲೈವ್ ಉದಾಹರಣೆ ಅಥವಾ ಉಲ್ಲೇಖ ಇದೆ.", "Viskas registre turi gyvą pavyzdį arba nuorodą."],

  // ---- labs and tools
  ["homev2.work.title", "Labs and tools", "ಲ್ಯಾಬ್‌ಗಳು ಮತ್ತು ಸಾಧನಗಳು", "Laboratorijos ir įrankiai"],
  ["homev2.work.sub", "Guided labs walk you through a topic; tools are open sandboxes. The domain tag is just a label.", "ಮಾರ್ಗದರ್ಶಿತ ಲ್ಯಾಬ್‌ಗಳು ವಿಷಯದ ಮೂಲಕ ನಡೆಸುತ್ತವೆ; ಸಾಧನಗಳು ಮುಕ್ತ ಪ್ರಯೋಗ ಸ್ಥಳಗಳು. ವಿಭಾಗದ ಟ್ಯಾಗ್ ಕೇವಲ ಲೇಬಲ್.", "Vedamos laboratorijos veda per temą, įrankiai – atviros smėlio dėžės. Srities žyma tėra etiketė."],
  ["homev2.work.filter", "Filter labs by domain:", "ಲ್ಯಾಬ್‌ಗಳನ್ನು ವಿಭಾಗದ ಪ್ರಕಾರ ಸೋಸಿ:", "Filtruoti laboratorijas pagal sritį:"],
  ["homev2.work.planned", "Planned labs", "ಯೋಜಿತ ಲ್ಯಾಬ್‌ಗಳು", "Planuojamos laboratorijos"],
  ["homev2.work.allLabs", "All labs →", "ಎಲ್ಲಾ ಲ್ಯಾಬ್‌ಗಳು →", "Visos laboratorijos →"],
]);
