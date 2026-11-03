import type { Row } from "../../labs/lab3/content/types";

/** Text on the eleven slides (same wording as the deck). Numbers that come from the data are `{placeholders}`. */
export const rowsDeck: Row[] = [
  // ---- 1 title
  ["ts.s1.kicker", "VILNIUS TECH · Group project", "VILNIUS TECH · ಗುಂಪು ಯೋಜನೆ", "VILNIUS TECH · Grupinis projektas"],
  ["ts.s1.title", "Transformers and their application in NLP tasks", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಮತ್ತು NLP ಕಾರ್ಯಗಳಲ್ಲಿ ಅವುಗಳ ಬಳಕೆ", "Transformeriai ir jų taikymas NLP užduotims"],
  ["ts.s1.sub", "Do Transformers pay off on a laptop CPU? A comparison of 10 sentiment classifiers on SST-2", "ಲ್ಯಾಪ್‌ಟಾಪ್ CPU ನಲ್ಲಿ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಲಾಭದಾಯಕವೇ? SST-2 ಮೇಲೆ 10 ಭಾವನೆ ವರ್ಗೀಕರಣ ಮಾದರಿಗಳ ಹೋಲಿಕೆ", "Ar transformeriai atsiperka nešiojamojo kompiuterio CPU? 10 nuotaikos klasifikatorių palyginimas su SST-2"],
  ["ts.s1.axis", "self-attention weights", "ಸ್ವ-ಅಟೆನ್ಷನ್ ತೂಕಗಳು", "savidėmesio svoriai"],
  ["ts.s1.tileAlt", "Decorative attention map for the words not, good, but, great", "not, good, but, great ಪದಗಳ ಅಲಂಕಾರಿಕ ಅಟೆನ್ಷನ್ ನಕ್ಷೆ", "Dekoratyvinis dėmesio žemėlapis žodžiams not, good, but, great"],

  // ---- 2 recurrent vs transformer
  ["ts.s2.title", "From reading word by word to reading all at once", "ಪದ ಪದವಾಗಿ ಓದುವುದರಿಂದ ಎಲ್ಲವನ್ನೂ ಒಮ್ಮೆಲೇ ಓದುವವರೆಗೆ", "Nuo skaitymo žodis po žodžio iki skaitymo viską iš karto"],
  ["ts.s2.colA", "Recurrent networks (LSTM)", "ಮರುಕಳಿಸುವ ನೆಟ್‌ವರ್ಕ್‌ಗಳು (LSTM)", "Rekurentiniai tinklai (LSTM)"],
  ["ts.s2.colB", "Transformer (2017)", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ (2017)", "Transformeris (2017)"],
  ["ts.s2.a1", "Process tokens one after another", "ಟೋಕನ್‌ಗಳನ್ನು ಒಂದರ ನಂತರ ಒಂದರಂತೆ ಸಂಸ್ಕರಿಸುತ್ತದೆ", "Apdoroja leksemas vieną po kitos"],
  ["ts.s2.a2", "n sequential steps – slow to train", "n ಅನುಕ್ರಮ ಹಂತಗಳು – ತರಬೇತಿ ನಿಧಾನ", "n nuoseklių žingsnių – lėtas mokymas"],
  ["ts.s2.a3", "Distant words interact only through a long chain of states", "ದೂರದ ಪದಗಳು ಸ್ಥಿತಿಗಳ ಉದ್ದ ಸರಪಳಿಯ ಮೂಲಕ ಮಾತ್ರ ಪರಸ್ಪರ ಪ್ರಭಾವಿಸುತ್ತವೆ", "Nutolę žodžiai sąveikauja tik per ilgą būsenų grandinę"],
  ["ts.s2.a4", "Trained from scratch for each task", "ಪ್ರತಿ ಕಾರ್ಯಕ್ಕೂ ಮೊದಲಿನಿಂದ ತರಬೇತಿ ನೀಡಲಾಗುತ್ತದೆ", "Kiekvienai užduočiai mokomas iš nulio"],
  ["ts.s2.b1", "Every token attends to every other token", "ಪ್ರತಿ ಟೋಕನ್ ಉಳಿದೆಲ್ಲ ಟೋಕನ್‌ಗಳತ್ತ ಗಮನ ಹರಿಸುತ್ತದೆ", "Kiekviena leksema atsižvelgia į visas kitas leksemas"],
  ["ts.s2.b2", "All positions computed in parallel on GPU/CPU", "ಎಲ್ಲ ಸ್ಥಾನಗಳನ್ನು GPU/CPU ನಲ್ಲಿ ಸಮಾನಾಂತರವಾಗಿ ಲೆಕ್ಕಿಸಲಾಗುತ್ತದೆ", "Visos pozicijos skaičiuojamos lygiagrečiai GPU/CPU"],
  ["ts.s2.b3", "Pre-train once on huge unlabelled text, then fine-tune", "ಲೇಬಲ್ ಇಲ್ಲದ ದೊಡ್ಡ ಪಠ್ಯದ ಮೇಲೆ ಒಮ್ಮೆ ಪೂರ್ವ-ತರಬೇತಿ, ನಂತರ ಫೈನ್-ಟ್ಯೂನಿಂಗ್", "Vieną kartą iš anksto išmokomas su didžiuliu nepažymėtu tekstu, paskui sutikslinamas"],
  ["ts.s2.b4", "Basis of BERT, GPT, T5, ChatGPT, LitLat BERT…", "BERT, GPT, T5, ChatGPT, LitLat BERT… ಗಳ ಆಧಾರ", "BERT, GPT, T5, ChatGPT, LitLat BERT… pagrindas"],

  // ---- 3 self-attention
  ["ts.s3.title", "Self-attention: each word looks at the whole sentence", "ಸ್ವ-ಅಟೆನ್ಷನ್: ಪ್ರತಿ ಪದವೂ ಇಡೀ ವಾಕ್ಯವನ್ನು ನೋಡುತ್ತದೆ", "Savidėmesys: kiekvienas žodis mato visą sakinį"],
  ["ts.s3.formulaCap", "queries · keys → weights → weighted mix of values", "ಕ್ವೆರಿಗಳು · ಕೀಗಳು → ತೂಕಗಳು → ಮೌಲ್ಯಗಳ ತೂಕದ ಮಿಶ್ರಣ", "užklausos · raktai → svoriai → reikšmių svorinis mišinys"],
  ["ts.s3.h1", "Sub-word tokens + position embeddings", "ಉಪ-ಪದ ಟೋಕನ್‌ಗಳು + ಸ್ಥಾನ ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳು", "Žodžio dalių leksemos + pozicijų įterpiniai"],
  ["ts.s3.d1", "WordPiece: “unwatchable” → un ##watch ##able", "WordPiece: “unwatchable” → un ##watch ##able", "WordPiece: “unwatchable” → un ##watch ##able"],
  ["ts.s3.h2", "Multi-head attention", "ಬಹು-ಹೆಡ್ ಅಟೆನ್ಷನ್", "Daugiagalvis dėmesys"],
  ["ts.s3.d2", "h heads learn different relations (negation scope, syntax)", "h ಹೆಡ್‌ಗಳು ಬೇರೆ ಬೇರೆ ಸಂಬಂಧಗಳನ್ನು ಕಲಿಯುತ್ತವೆ (ನಿರಾಕರಣೆಯ ವ್ಯಾಪ್ತಿ, ವಾಕ್ಯರಚನೆ)", "Kiekviena iš h galvų mokosi skirtingų ryšių (neigimo apimtis, sintaksė)"],
  ["ts.s3.h3", "Feed-forward + residual + LayerNorm", "ಫೀಡ್-ಫಾರ್ವರ್ಡ್ + ರೆಸಿಡ್ಯುವಲ್ + LayerNorm", "Tiesioginio sklidimo sluoksnis + likutinė jungtis + LayerNorm"],
  ["ts.s3.d3", "Stacked L times (2 / 4 / 6 layers in our models)", "L ಬಾರಿ ಒಂದರ ಮೇಲೊಂದು ಜೋಡಣೆ (ನಮ್ಮ ಮಾದರಿಗಳಲ್ಲಿ 2 / 4 / 6 ಪದರಗಳು)", "Sudėta L kartų (mūsų modeliuose 2 / 4 / 6 sluoksniai)"],
  ["ts.s3.h4", "[CLS] vector → softmax classifier", "[CLS] ವೆಕ್ಟರ್ → softmax ವರ್ಗೀಕರಣ ಮಾದರಿ", "[CLS] vektorius → softmax klasifikatorius"],
  ["ts.s3.d4", "Whole network fine-tuned with cross-entropy + AdamW", "ಇಡೀ ನೆಟ್‌ವರ್ಕ್ ಅನ್ನು ಕ್ರಾಸ್-ಎಂಟ್ರೋಪಿ + AdamW ಮೂಲಕ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಲಾಗುತ್ತದೆ", "Visas tinklas sutikslinamas su kryžmine entropija + AdamW"],
  ["ts.s3.imgAlt", "Diagram of a Transformer encoder for classification: input tokens, token and position embeddings, L stacked layers of multi-head self-attention and feed-forward, each followed by add and layer normalisation with a residual connection, contextual vectors, and a classification head that gives P(negative) and P(positive).", "ವರ್ಗೀಕರಣಕ್ಕಾಗಿ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್ ಎನ್‌ಕೋಡರ್‌ನ ರೇಖಾಚಿತ್ರ: ಇನ್‌ಪುಟ್ ಟೋಕನ್‌ಗಳು, ಟೋಕನ್ ಮತ್ತು ಸ್ಥಾನ ಎಂಬೆಡ್ಡಿಂಗ್‌ಗಳು, ಬಹು-ಹೆಡ್ ಸ್ವ-ಅಟೆನ್ಷನ್ ಮತ್ತು ಫೀಡ್-ಫಾರ್ವರ್ಡ್‌ನ L ಪದರಗಳು (ಪ್ರತಿಯೊಂದರ ನಂತರ ರೆಸಿಡ್ಯುವಲ್ ಸಂಪರ್ಕದೊಂದಿಗೆ ಸೇರಿಸುವಿಕೆ ಮತ್ತು ಲೇಯರ್ ನಾರ್ಮಲೈಸೇಶನ್), ಸಂದರ್ಭ ವೆಕ್ಟರ್‌ಗಳು, ಮತ್ತು P(negative), P(positive) ನೀಡುವ ವರ್ಗೀಕರಣ ಹೆಡ್.", "Transformerio enkoderio klasifikavimui schema: įvesties leksemos, leksemų ir pozicijų įterpiniai, L sudėtų daugiagalvio savidėmesio ir tiesioginio sklidimo sluoksnių, po kurių eina sudėtis ir sluoksnio normalizavimas su likutine jungtimi, kontekstiniai vektoriai ir klasifikavimo galva, duodanti P(negative) ir P(positive)."],

  // ---- 4 literature
  ["ts.s4.title", "Literature: Transformers lead, but gaps remain", "ಸಾಹಿತ್ಯ: ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಮುಂದಿವೆ, ಆದರೆ ಅಂತರಗಳು ಉಳಿದಿವೆ", "Literatūra: transformeriai pirmauja, bet spragų lieka"],
  ["ts.s4.f1", "Encoder-only", "ಎನ್‌ಕೋಡರ್ ಮಾತ್ರ", "Tik enkoderis"],
  ["ts.s4.f1u", "Understanding & classification", "ಅರ್ಥೈಸುವಿಕೆ ಮತ್ತು ವರ್ಗೀಕರಣ", "Supratimas ir klasifikavimas"],
  ["ts.s4.f2", "Decoder-only", "ಡಿಕೋಡರ್ ಮಾತ್ರ", "Tik dekoderis"],
  ["ts.s4.f2u", "Generation, in-context learning", "ಪಠ್ಯ ಸೃಷ್ಟಿ, ಸಂದರ್ಭದೊಳಗಿನ ಕಲಿಕೆ", "Generavimas, mokymasis iš konteksto"],
  ["ts.s4.f3", "Encoder–decoder", "ಎನ್‌ಕೋಡರ್–ಡಿಕೋಡರ್", "Enkoderis–dekoderis"],
  ["ts.s4.f3u", "Translation, summarisation", "ಅನುವಾದ, ಸಾರಾಂಶ", "Vertimas, santraukų rengimas"],
  ["ts.s4.lt", "In Lithuania", "ಲಿಥುವೇನಿಯಾದಲ್ಲಿ", "Lietuvoje"],
  ["ts.s4.l1", "Kapočiūtė-Dzikienė et al. (2019): NB 0.735 beat LSTM/CNN 0.706 – no pre-training", "Kapočiūtė-Dzikienė ಮತ್ತು ಇತರರು (2019): NB (0.735) ಮಾದರಿಯು LSTM/CNN (0.706) ಅನ್ನು ಮೀರಿಸಿತು – ಪೂರ್ವ-ತರಬೇತಿ ಇಲ್ಲದೆ", "Kapočiūtė-Dzikienė ir kt. (2019): NB 0.735 aplenkė LSTM/CNN 0.706 – be išankstinio mokymo"],
  ["ts.s4.l2", "Ulčar & Robnik-Šikonja (2021): LitLat BERT for LT/LV/EN", "Ulčar ಮತ್ತು Robnik-Šikonja (2021): LT/LV/EN ಗಾಗಿ LitLat BERT", "Ulčar ir Robnik-Šikonja (2021): LitLat BERT LT/LV/EN kalboms"],
  ["ts.s4.l3", "Vileikytė et al. (2024): BERT & T5 for Lithuanian reviews", "Vileikytė ಮತ್ತು ಇತರರು (2024): ಲಿಥುವೇನಿಯನ್ ವಿಮರ್ಶೆಗಳಿಗೆ BERT ಮತ್ತು T5", "Vileikytė ir kt. (2024): BERT ir T5 lietuviškiems atsiliepimams"],
  ["ts.s4.l4", "Nakvosas et al. (2024): first open Lithuanian Llama2 LLMs", "Nakvosas ಮತ್ತು ಇತರರು (2024): ಮೊದಲ ಮುಕ್ತ ಲಿಥುವೇನಿಯನ್ Llama2 LLM ಗಳು", "Nakvosas ir kt. (2024): pirmieji atviri lietuviški Llama2 LLM"],
  ["ts.s4.gap", "Gap we address", "ನಾವು ಪರಿಹರಿಸುವ ಅಂತರ", "Spraga, kurią sprendžiame"],
  ["ts.s4.gapText", "Results are reported on GPUs with full data. How large is the gain on a CPU with a few thousand labels – and is a ready-made model enough?", "ಫಲಿತಾಂಶಗಳನ್ನು GPU ಗಳಲ್ಲಿ, ಪೂರ್ಣ ಡೇಟಾದೊಂದಿಗೆ ವರದಿ ಮಾಡಲಾಗಿದೆ. CPU ನಲ್ಲಿ ಕೆಲವು ಸಾವಿರ ಲೇಬಲ್‌ಗಳೊಂದಿಗೆ ಲಾಭ ಎಷ್ಟು – ಮತ್ತು ಸಿದ್ಧ ಮಾದರಿ ಸಾಕೇ?", "Rezultatai pateikiami su GPU ir visais duomenimis. Kokia nauda naudojant CPU ir kelis tūkstančius pažymėtų pavyzdžių – ir ar pakanka paruošto modelio?"],

  // ---- 5 experiment
  ["ts.s5.title", "Experiment: 10 competitors, one dataset, one laptop CPU", "ಪ್ರಯೋಗ: 10 ಸ್ಪರ್ಧಿಗಳು, ಒಂದು ಡೇಟಾಸೆಟ್, ಒಂದು ಲ್ಯಾಪ್‌ಟಾಪ್ CPU", "Eksperimentas: 10 varžovų, vienas duomenų rinkinys, vienas nešiojamojo kompiuterio CPU"],
  ["ts.s5.sstDesc", "movie-review sentences, positive / negative", "ಚಲನಚಿತ್ರ ವಿಮರ್ಶೆಯ ವಾಕ್ಯಗಳು, ಧನಾತ್ಮಕ / ಋಣಾತ್ಮಕ", "filmų apžvalgų sakiniai, teigiami / neigiami"],
  ["ts.s5.splitsDesc", "train / dev / test sentences", "ತರಬೇತಿ / ಡೆವ್ / ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳು", "mokymo / dev / testo sakiniai"],
  ["ts.s5.cpuDesc", "4-core laptop CPU, 16 GB RAM, no GPU", "4-ಕೋರ್ ಲ್ಯಾಪ್‌ಟಾಪ್ CPU, 16 GB RAM, GPU ಇಲ್ಲ", "4 branduolių nešiojamojo kompiuterio CPU, 16 GB RAM, be GPU"],
  ["ts.s5.g1", "Classical", "ಕ್ಲಾಸಿಕಲ್", "Klasikiniai"],
  ["ts.s5.g1d", "TF-IDF + Naive Bayes · Logistic Regression · Linear SVM", "TF-IDF + ನೇವ್ ಬೇಯ್ಸ್ · ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್ · ಲೀನಿಯರ್ SVM", "TF-IDF + naivusis Bajesas · logistinė regresija · tiesinis SVM"],
  ["ts.s5.g2", "Recurrent", "ಮರುಕಳಿಸುವ", "Rekurentinis"],
  ["ts.s5.g2d", "BiLSTM trained from scratch", "ಮೊದಲಿನಿಂದ ತರಬೇತಿ ಪಡೆದ BiLSTM", "BiLSTM, išmokytas iš nulio"],
  ["ts.s5.g3", "Fine-tuned by us (8k labels)", "ನಾವು ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ್ದು (8k ಲೇಬಲ್‌ಗಳು)", "Mūsų sutikslinti (8k pavyzdžių)"],
  ["ts.s5.g4", "Ready-made, no training", "ಸಿದ್ಧ ಮಾದರಿಗಳು, ತರಬೇತಿ ಇಲ್ಲ", "Paruošti, be mokymo"],
  ["ts.s5.criteria", "Criteria: accuracy, macro-F1 · training time · latency per sentence · parameters · negation & contrast subsets · learning curve · bootstrap CI + McNemar test", "ಮಾನದಂಡಗಳು: ನಿಖರತೆ, ಮ್ಯಾಕ್ರೋ-F1 · ತರಬೇತಿ ಸಮಯ · ವಾಕ್ಯಕ್ಕೆ ವಿಳಂಬ · ಪ್ಯಾರಾಮೀಟರ್‌ಗಳು · ನಿರಾಕರಣೆ ಮತ್ತು ವೈರುದ್ಧ್ಯ ಉಪಗುಂಪುಗಳು · ಕಲಿಕೆ ರೇಖೆ · ಬೂಟ್‌ಸ್ಟ್ರಾಪ್ CI + ಮ್ಯಾಕ್‌ನೆಮಾರ್ ಪರೀಕ್ಷೆ", "Kriterijai: tikslumas, makro F1 · mokymo laikas · delsa vienam sakiniui · parametrai · neigimo ir kontrasto poaibiai · mokymosi kreivė · bootstrap PI + McNemar testas"],

  // ---- 6 pipeline
  ["ts.s6.title", "Implementation: a reproducible Python pipeline", "ಅನುಷ್ಠಾನ: ಪುನರುತ್ಪಾದಿಸಬಹುದಾದ Python ಪೈಪ್‌ಲೈನ್", "Įgyvendinimas: atkuriamas Python vamzdynas"],
  ["ts.s6.b1", "One generic fine-tuning script for any encoder", "ಯಾವುದೇ ಎನ್‌ಕೋಡರ್‌ಗೆ ಒಂದೇ ಸಾಮಾನ್ಯ ಫೈನ್-ಟ್ಯೂನಿಂಗ್ ಸ್ಕ್ರಿಪ್ಟ್", "Vienas bendras sutikslinimo skriptas bet kuriam enkoderiui"],
  ["ts.s6.b2", "AdamW, 10% warm-up, linear decay, best epoch by dev accuracy", "AdamW, 10% ವಾರ್ಮ್-ಅಪ್, ರೇಖೀಯ ಇಳಿಕೆ, ಡೆವ್ ನಿಖರತೆಯ ಆಧಾರದ ಅತ್ಯುತ್ತಮ ಎಪೋಕ್", "AdamW, 10% įšilimas, tiesinis mažinimas, geriausia epocha pagal dev tikslumą"],
  ["ts.s6.b3", "Every model saves metrics, timings and predictions as JSON", "ಪ್ರತಿ ಮಾದರಿಯೂ ಮೆಟ್ರಿಕ್‌ಗಳು, ಸಮಯಗಳು ಮತ್ತು ಭವಿಷ್ಯವಾಣಿಗಳನ್ನು JSON ಆಗಿ ಉಳಿಸುತ್ತದೆ", "Kiekvienas modelis išsaugo metrikas, laikus ir prognozes JSON formatu"],
  ["ts.s6.b4", "run_all.sh reproduces all results (~2.5 h)", "run_all.sh ಎಲ್ಲ ಫಲಿತಾಂಶಗಳನ್ನು ಮರುಸೃಷ್ಟಿಸುತ್ತದೆ (~2.5 h)", "run_all.sh atkuria visus rezultatus (~2.5 h)"],
  ["ts.s6.imgAlt", "Flow chart of the nine scripts: 01_prepare_data.py takes the SST-2 data set from the Hugging Face Hub and writes train, dev and test CSV files; 02 classical baselines, 03 BiLSTM, 04 fine-tuned Transformers, 05 ready-made and zero-shot Transformers and 06 learning curves each write results JSON files with metrics, times and predictions; 08_report.py turns them into tables, figures and statistics for the paper and presentation; 07_attention_visualisation.py draws attention heat-maps.", "ಒಂಬತ್ತು ಸ್ಕ್ರಿಪ್ಟ್‌ಗಳ ಹರಿವಿನ ಚಿತ್ರ: 01_prepare_data.py Hugging Face Hub ನಿಂದ SST-2 ಡೇಟಾಸೆಟ್ ತೆಗೆದುಕೊಂಡು ತರಬೇತಿ, ಡೆವ್ ಮತ್ತು ಪರೀಕ್ಷಾ CSV ಫೈಲ್‌ಗಳನ್ನು ಬರೆಯುತ್ತದೆ; 02 ಕ್ಲಾಸಿಕಲ್ ಮೂಲ ಮಾದರಿಗಳು, 03 BiLSTM, 04 ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು, 05 ಸಿದ್ಧ ಮತ್ತು ಜೀರೋ-ಶಾಟ್ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಹಾಗೂ 06 ಕಲಿಕೆ ರೇಖೆಗಳು ಪ್ರತಿಯೊಂದೂ ಮೆಟ್ರಿಕ್‌ಗಳು, ಸಮಯಗಳು ಮತ್ತು ಭವಿಷ್ಯವಾಣಿಗಳ ಫಲಿತಾಂಶ JSON ಫೈಲ್‌ಗಳನ್ನು ಬರೆಯುತ್ತವೆ; 08_report.py ಅವನ್ನು ಪ್ರಬಂಧ ಮತ್ತು ಪ್ರಸ್ತುತಿಗಾಗಿ ಕೋಷ್ಟಕಗಳು, ಚಿತ್ರಗಳು ಮತ್ತು ಅಂಕಿಅಂಶಗಳಾಗಿ ಪರಿವರ್ತಿಸುತ್ತದೆ; 07_attention_visualisation.py ಅಟೆನ್ಷನ್ ಹೀಟ್-ಮ್ಯಾಪ್‌ಗಳನ್ನು ಬರೆಯುತ್ತದೆ.", "Devynių skriptų schema: 01_prepare_data.py paima SST-2 duomenų rinkinį iš Hugging Face Hub ir sukuria mokymo, dev ir testo CSV failus; 02 klasikiniai modeliai, 03 BiLSTM, 04 sutikslinti transformeriai, 05 paruošti ir zero-shot transformeriai bei 06 mokymosi kreivės kiekvienas įrašo rezultatų JSON failus su metrikomis, laikais ir prognozėmis; 08_report.py iš jų sukuria lenteles, paveikslus ir statistiką straipsniui ir pranešimui; 07_attention_visualisation.py piešia dėmesio šilumos žemėlapius."],

  // ---- 7 headline result
  ["ts.s7.title", "Fine-tuned DistilBERT: +{gain} points over classical", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT: ಕ್ಲಾಸಿಕಲ್‌ಗಿಂತ +{gain} ಅಂಕ ಹೆಚ್ಚು", "Sutikslintas DistilBERT: +{gain} punkto daugiau nei klasikiniai"],
  ["ts.s7.c1", "DistilBERT fine-tuned (8k)", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ DistilBERT (8k)", "Sutikslintas DistilBERT (8k)"],
  ["ts.s7.c2", "best classical: TF-IDF + Linear SVM", "ಅತ್ಯುತ್ತಮ ಕ್ಲಾಸಿಕಲ್: TF-IDF + ಲೀನಿಯರ್ SVM", "geriausias klasikinis: TF-IDF + tiesinis SVM"],
  ["ts.s7.c3", "zero-shot – no labels at all", "ಜೀರೋ-ಶಾಟ್ – ಯಾವುದೇ ಲೇಬಲ್ ಇಲ್ಲ", "zero-shot – visai be pažymėtų pavyzdžių"],
  ["ts.s7.axis", "Test accuracy, %", "ಪರೀಕ್ಷಾ ನಿಖರತೆ, %", "Testo tikslumas, %"],
  ["ts.s7.chartLabel", "Test accuracy of the ten models, sorted from best to worst", "ಹತ್ತು ಮಾದರಿಗಳ ಪರೀಕ್ಷಾ ನಿಖರತೆ, ಉತ್ತಮದಿಂದ ಕೆಟ್ಟದಕ್ಕೆ ಜೋಡಿಸಲಾಗಿದೆ", "Dešimties modelių testo tikslumas, nuo geriausio iki blogiausio"],
  ["ts.fam.classical", "Classical", "ಕ್ಲಾಸಿಕಲ್", "Klasikiniai"],
  ["ts.fam.recurrent", "Recurrent", "ಮರುಕಳಿಸುವ", "Rekurentinis"],
  ["ts.fam.transformer", "Transformer", "ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್", "Transformeris"],

  // ---- 8 cost
  ["ts.s8.title", "The price: slower training and inference, bigger models", "ಬೆಲೆ: ನಿಧಾನ ತರಬೇತಿ ಮತ್ತು ಇನ್‌ಫರೆನ್ಸ್, ದೊಡ್ಡ ಮಾದರಿಗಳು", "Kaina: lėtesnis mokymas ir prognozavimas, didesni modeliai"],
  ["ts.s8.hModel", "Model", "ಮಾದರಿ", "Modelis"],
  ["ts.s8.hAcc", "Acc., %", "ನಿಖ., %", "Tiksl., %"],
  ["ts.s8.hTrain", "Train time", "ತರಬೇತಿ ಸಮಯ", "Mokymo laikas"],
  ["ts.s8.hLat", "Latency, ms", "ವಿಳಂಬ, ms", "Delsa, ms"],
  ["ts.s8.hParams", "Params", "ಪ್ಯಾರಾಮೀಟರ್", "Parametrai"],
  ["ts.s8.table", "Accuracy, training time, latency and size of seven models", "ಏಳು ಮಾದರಿಗಳ ನಿಖರತೆ, ತರಬೇತಿ ಸಮಯ, ವಿಳಂಬ ಮತ್ತು ಗಾತ್ರ", "Septynių modelių tikslumas, mokymo laikas, delsa ir dydis"],
  ["ts.s8.ratio", "slower inference of DistilBERT vs TF-IDF – still only {ms} ms per sentence", "TF-IDF ಗೆ ಹೋಲಿಸಿದರೆ DistilBERT ಇನ್‌ಫರೆನ್ಸ್ ಇಷ್ಟು ಪಟ್ಟು ನಿಧಾನ – ಆದರೂ ವಾಕ್ಯಕ್ಕೆ ಕೇವಲ {ms} ms", "kartų lėtesnis DistilBERT prognozavimas nei TF-IDF – vis tiek tik {ms} ms vienam sakiniui"],
  ["ts.s8.afford", "Fine-tuning is affordable", "ಫೈನ್-ಟ್ಯೂನಿಂಗ್ ಕೈಗೆಟುಕುವಂತಿದೆ", "Sutikslinimas yra įperkamas"],
  ["ts.s8.affordText", "Training on the laptop CPU took {lo} – {hi}; no GPU needed for a few thousand examples.", "ಲ್ಯಾಪ್‌ಟಾಪ್ CPU ನಲ್ಲಿ ತರಬೇತಿಗೆ {lo} – {hi} ಬೇಕಾಯಿತು; ಕೆಲವು ಸಾವಿರ ಉದಾಹರಣೆಗಳಿಗೆ GPU ಬೇಕಿಲ್ಲ.", "Mokymas nešiojamojo kompiuterio CPU truko {lo} – {hi}; kelių tūkstančių pavyzdžių atveju GPU nereikia."],

  // ---- 9 data efficiency
  ["ts.s9.title", "Pre-training is the key: fewer labels, higher accuracy", "ಪೂರ್ವ-ತರಬೇತಿಯೇ ಕೀಲಿ: ಕಡಿಮೆ ಲೇಬಲ್‌ಗಳು, ಹೆಚ್ಚಿನ ನಿಖರತೆ", "Išankstinis mokymas yra esmė: mažiau pavyzdžių, didesnis tikslumas"],
  ["ts.s9.axisX", "Labelled training sentences", "ಲೇಬಲ್ ಮಾಡಿದ ತರಬೇತಿ ವಾಕ್ಯಗಳು", "Pažymėti mokymo sakiniai"],
  ["ts.s9.lineA", "BERT-small fine-tuned", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ BERT-small", "Sutikslintas BERT-small"],
  ["ts.s9.chartLabel", "Learning curves: test accuracy of fine-tuned BERT-small and of TF-IDF logistic regression for 500 to 8,000 labelled sentences", "ಕಲಿಕೆ ರೇಖೆಗಳು: 500 ರಿಂದ 8,000 ಲೇಬಲ್ ವಾಕ್ಯಗಳಿಗೆ ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ BERT-small ಮತ್ತು TF-IDF ಲಾಜಿಸ್ಟಿಕ್ ರಿಗ್ರೆಷನ್‌ನ ಪರೀಕ್ಷಾ ನಿಖರತೆ", "Mokymosi kreivės: sutikslinto BERT-small ir TF-IDF logistinės regresijos testo tikslumas su 500–8 000 pažymėtų sakinių"],
  ["ts.s9.big1Text", "labels: BERT-small already matches the best classical model trained on all 65k ({a}% vs {b}%)", "ಲೇಬಲ್‌ಗಳು: BERT-small ಈಗಾಗಲೇ ಎಲ್ಲ 65k ಮೇಲೆ ತರಬೇತಿ ಪಡೆದ ಅತ್ಯುತ್ತಮ ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಗೆ ಸಮನಾಗಿದೆ ({a}% vs {b}%)", "pavyzdžių: BERT-small jau prilygsta geriausiam klasikiniam modeliui, mokytam su visais 65k ({a}% prieš {b}%)"],
  ["ts.s9.big2", "+{gap} p.p.", "+{gap} ಶೇ. ಅಂಕ", "+{gap} proc. p."],
  ["ts.s9.big2Text", "advantage with only 500 labels – the gap shrinks as data grows", "ಕೇವಲ 500 ಲೇಬಲ್‌ಗಳೊಂದಿಗೆ ಇರುವ ಮುನ್ನಡೆ – ಡೇಟಾ ಹೆಚ್ಚಾದಂತೆ ಅಂತರ ಕಡಿಮೆಯಾಗುತ್ತದೆ", "pranašumas turint tik 500 pavyzdžių – didėjant duomenims skirtumas mažėja"],

  // ---- 10 negation and contrast
  ["ts.s10.title", "Context matters: negation and contrast sentences", "ಸಂದರ್ಭ ಮುಖ್ಯ: ನಿರಾಕರಣೆ ಮತ್ತು ವೈರುದ್ಧ್ಯ ವಾಕ್ಯಗಳು", "Kontekstas svarbus: neigimo ir kontrasto sakiniai"],
  ["ts.s10.caption", "“the plot was not good, but the acting was brilliant” – DistilBERT attention, last layer", "“the plot was not good, but the acting was brilliant” – DistilBERT ಅಟೆನ್ಷನ್, ಕೊನೆಯ ಪದರ", "„the plot was not good, but the acting was brilliant“ – DistilBERT dėmesys, paskutinis sluoksnis"],
  ["ts.s10.all", "All", "ಎಲ್ಲಾ", "Visi"],
  ["ts.s10.neg", "Negation", "ನಿರಾಕರಣೆ", "Neigimas"],
  ["ts.s10.con", "Contrast", "ವೈರುದ್ಧ್ಯ", "Kontrastas"],
  ["ts.s10.chartTitle", "Accuracy by sentence type, %", "ವಾಕ್ಯ ಪ್ರಕಾರದ ಪ್ರಕಾರ ನಿಖರತೆ, %", "Tikslumas pagal sakinio tipą, %"],
  ["ts.s10.chartLabel", "Accuracy of four models on all test sentences, on negation sentences and on contrast sentences", "ನಾಲ್ಕು ಮಾದರಿಗಳ ನಿಖರತೆ: ಎಲ್ಲ ಪರೀಕ್ಷಾ ವಾಕ್ಯಗಳಲ್ಲಿ, ನಿರಾಕರಣೆ ವಾಕ್ಯಗಳಲ್ಲಿ ಮತ್ತು ವೈರುದ್ಧ್ಯ ವಾಕ್ಯಗಳಲ್ಲಿ", "Keturių modelių tikslumas su visais testo sakiniais, neigimo sakiniais ir kontrasto sakiniais"],
  ["ts.s10.imgAlt", "Heat-map of the last-layer attention of DistilBERT, averaged over 12 heads, for the sentence “the plot was not good, but the acting was brilliant”. Most of the attention goes to the comma.", "“the plot was not good, but the acting was brilliant” ವಾಕ್ಯಕ್ಕೆ 12 ಹೆಡ್‌ಗಳ ಸರಾಸರಿಯಲ್ಲಿ DistilBERT ನ ಕೊನೆಯ ಪದರದ ಅಟೆನ್ಷನ್ ಹೀಟ್-ಮ್ಯಾಪ್. ಹೆಚ್ಚಿನ ಅಟೆನ್ಷನ್ ಅಲ್ಪವಿರಾಮದ ಕಡೆಗೆ ಹೋಗುತ್ತದೆ.", "DistilBERT paskutinio sluoksnio dėmesio, suvidurkinto per 12 galvų, šilumos žemėlapis sakiniui „the plot was not good, but the acting was brilliant“. Daugiausia dėmesio tenka kableliui."],

  // ---- 11 conclusions
  ["ts.s11.title", "Conclusions & recommendations", "ತೀರ್ಮಾನಗಳು ಮತ್ತು ಶಿಫಾರಸುಗಳು", "Išvados ir rekomendacijos"],
  ["ts.s11.c1", "Fine-tuned Transformers are the most accurate: {ft}% vs {svm}% (classical) and {lstm}% (BiLSTM)", "ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿದ ಟ್ರಾನ್ಸ್‌ಫಾರ್ಮರ್‌ಗಳು ಅತ್ಯಂತ ನಿಖರ: {ft}% vs {svm}% (ಕ್ಲಾಸಿಕಲ್) ಮತ್ತು {lstm}% (BiLSTM)", "Sutikslinti transformeriai yra tiksliausi: {ft}% prieš {svm}% (klasikiniai) ir {lstm}% (BiLSTM)"],
  ["ts.s11.c2", "Pre-training gives data efficiency: BERT-small with 4,000 labels matches classical models trained on 65k; DistilBERT with 8,000 beats them", "ಪೂರ್ವ-ತರಬೇತಿ ಡೇಟಾ ದಕ್ಷತೆ ನೀಡುತ್ತದೆ: 4,000 ಲೇಬಲ್‌ಗಳ BERT-small 65k ಮೇಲೆ ತರಬೇತಿ ಪಡೆದ ಕ್ಲಾಸಿಕಲ್ ಮಾದರಿಗಳಿಗೆ ಸಮ; 8,000 ಲೇಬಲ್‌ಗಳ DistilBERT ಅವನ್ನು ಮೀರಿಸುತ್ತದೆ", "Išankstinis mokymas suteikia duomenų efektyvumą: BERT-small su 4 000 pavyzdžių prilygsta klasikiniams modeliams, mokytiems su 65k; DistilBERT su 8 000 juos lenkia"],
  ["ts.s11.c3", "Cost is real but manageable: minutes of CPU fine-tuning, milliseconds per sentence", "ವೆಚ್ಚ ನಿಜ, ಆದರೆ ನಿಭಾಯಿಸಬಹುದು: CPU ನಲ್ಲಿ ನಿಮಿಷಗಳ ಫೈನ್-ಟ್ಯೂನಿಂಗ್, ವಾಕ್ಯಕ್ಕೆ ಮಿಲಿಸೆಕೆಂಡುಗಳು", "Kaina reali, bet valdoma: kelios minutės sutikslinimo CPU, milisekundės vienam sakiniui"],
  ["ts.s11.c4", "Reuse first: an in-domain public model gives {sst2}% with zero training; zero-shot ({zs}%) and out-of-domain models are useful but weaker", "ಮೊದಲು ಮರುಬಳಕೆ: ಅದೇ ಕ್ಷೇತ್ರದ ಸಾರ್ವಜನಿಕ ಮಾದರಿ ಯಾವುದೇ ತರಬೇತಿ ಇಲ್ಲದೆ {sst2}% ನೀಡುತ್ತದೆ; ಜೀರೋ-ಶಾಟ್ ({zs}%) ಮತ್ತು ಬೇರೆ ಕ್ಷೇತ್ರದ ಮಾದರಿಗಳು ಉಪಯುಕ್ತ ಆದರೆ ದುರ್ಬಲ", "Pirmiausia naudokite paruoštą: tos pačios srities viešas modelis be jokio mokymo pasiekia {sst2}%; zero-shot ({zs}%) ir kitos srities modeliai naudingi, bet silpnesni"],
  ["ts.s11.c5", "For Lithuanian: fine-tune LitLat BERT / XLM-R on a small labelled set – the next step of this work", "ಲಿಥುವೇನಿಯನ್‌ಗಾಗಿ: ಸಣ್ಣ ಲೇಬಲ್ ಗುಂಪಿನ ಮೇಲೆ LitLat BERT / XLM-R ಫೈನ್-ಟ್ಯೂನ್ ಮಾಡಿ – ಈ ಕೆಲಸದ ಮುಂದಿನ ಹಂತ", "Lietuvių kalbai: sutikslinti LitLat BERT / XLM-R su nedideliu pažymėtu rinkiniu – kitas šio darbo žingsnis"],
  ["ts.s11.thanks", "Thank you! Questions?", "ಧನ್ಯವಾದಗಳು! ಪ್ರಶ್ನೆಗಳು?", "Ačiū! Klausimai?"],
];
