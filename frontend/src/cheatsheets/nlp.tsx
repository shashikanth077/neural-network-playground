import { Link } from "react-router-dom";
import { McNemarCalculator, PRFCalculator } from "./Calculators";
import { gruParams, lstmParams, rnnParams } from "./calc";
import { LEARNING_CURVE, MEASURED, type Measured } from "./measured";
import type { Cheatsheet } from "./types";
import { Code, Note, Sub, T, TB, Table } from "./ui";

const nf = (n: number) => n.toLocaleString("en");
const get = (prefix: string): Measured => MEASURED.find((m) => m.name.startsWith(prefix))!;
const idf = (N: number, df: number) => Math.log((1 + N) / (1 + df)) + 1;

export const nlpSheet: Cheatsheet = {
  id: "nlp",
  domain: "nlp",
  title: "NLP cheatsheet",
  subtitle: "Tokens, representations, embeddings, language models, sequence models, attention, pre-trained models, metrics and code: natural language processing on one page.",
  status: "live",
  sections: [
    {
      id: "tasks", title: "1 · NLP task map",
      keywords: "tasks classification sentiment analysis ner named entity recognition token classification question answering qa summarisation summarization translation generation nli natural language inference retrieval semantic search topic spam metric model which task",
      render: () => (
        <>
          <p className="text-sm">Natural language processing (NLP) lets computers analyse, understand and generate human language. Most tasks reduce to a few shapes: one label per text, one label per token, text in → text out, or ranking texts.</p>
          <Table wide head={["Task", "Input → output", "Typical models", "Typical metric"]} rows={[
            ["Text classification (sentiment, topic, spam)", "Text → one label", "TF-IDF + linear model; fine-tuned BERT-type encoder; zero-shot NLI", "Accuracy, macro-F1"],
            ["Named entity recognition (token classification)", "Tokens → one tag per token (PER, ORG, LOC …)", "BiLSTM(-CRF); BERT-type encoder with a token head", "Entity-level F1"],
            ["Extractive question answering", "Question + passage → answer span (start, end)", "BERT-type encoder (SQuAD style)", "Exact match, token F1"],
            ["Summarisation", "Long text → short text", "Encoder–decoder (BART, T5), LLMs", "ROUGE + human reading"],
            ["Machine translation", "Source text → target text", "Encoder–decoder Transformer (T5, …)", "BLEU, chrF"],
            ["Text generation / language modelling", "Prompt → continuation", "Decoder-only (GPT family), n-gram LMs", "Perplexity, human evaluation"],
            ["Natural language inference (NLI)", "Premise + hypothesis → entails / neutral / contradicts", "Cross-encoders on top of BERT-type models", "Accuracy"],
            ["Retrieval / semantic search", "Query → ranked documents", "TF-IDF / BM25; sentence-embedding (dual-encoder) models", "Recall@k, MRR, nDCG"],
          ]} />
          <Note>NLI is also a trick: “text = premise, ‘The sentiment of this movie review is positive.’ = hypothesis” turns a classifier into a zero-shot classifier for arbitrary labels (Yin et al., 2019). The project’s own task is binary sentiment classification on SST-2.</Note>
        </>
      ),
    },
    {
      id: "preprocessing", title: "2 · Text preprocessing",
      keywords: "preprocessing tokenization tokenisation normalization normalisation lowercase unicode stop words stopwords stemming lemmatization lemmatisation subword wordpiece bpe byte pair encoding sentencepiece padding truncation vocabulary oov diacritics regex",
      render: () => (
        <>
          <Table wide head={["Step", "What it does", "Watch out"]} rows={[
            ["Tokenisation: whitespace / rule-based", "Split on spaces and punctuation rules (“don’t” → do, n’t)", "Languages without spaces; URLs, emoji, hashtags"],
            ["Tokenisation: word-level vocabulary", "One id per word; rare words → [UNK]", "Out-of-vocabulary words; huge vocabularies for inflected languages"],
            ["Tokenisation: character-level", "One id per character", "Very long sequences"],
            ["Tokenisation: sub-word", "Frequent words whole, rare words in pieces (next table)", "Always use the tokenizer that belongs to the model"],
            ["Normalisation", "Lower-case, Unicode normalisation (NFC / NFKC), collapse whitespace, optional punctuation and number handling", "Do not strip diacritics blindly: in Lithuanian ą č ę ė į š ų ū ž are different letters"],
            ["Stop-word removal", "Drop very frequent function words (the, of, and)", "Helps bag-of-words search; hurts sentiment when “not” or “no” is removed; pointless for Transformers"],
            ["Padding / truncation", "Make a batch rectangular (pad) and cap the length (truncate); an attention mask marks real tokens", "The project: max length 64 tokens, batches padded dynamically to their longest sentence"],
          ]} />
          <Sub>Stemming vs lemmatisation</Sub>
          <Table head={["", "Stemming", "Lemmatisation"]} rows={[
            ["Method", "Chop suffixes with rules (Porter, Snowball)", "Dictionary / morphology: return the base form (lemma)"],
            ["Example", "studies → studi, running → run", "studies → study, better → good, was → be"],
            ["Result is a real word?", "Not always", "Yes"],
            ["Cost", "Very cheap", "Needs a language-specific analyser"],
            ["Use", "Classical search and bag-of-words models, mainly in languages with rich inflection", "Same, when quality matters"],
          ]} />
          <Sub>Sub-word algorithms</Sub>
          <Table wide head={["Algorithm", "Idea", "Used by"]} rows={[
            ["WordPiece", "Start from characters, merge pieces to fit a fixed vocabulary; continuation pieces are marked ## (“unwatchable” → un, ##watch, ##able)", "BERT, DistilBERT (about 30,000 pieces)"],
            ["BPE (byte-pair encoding)", "Repeatedly merge the most frequent adjacent pair of symbols", "GPT family; RoBERTa (byte-level)"],
            ["SentencePiece", "Works on raw text without a pre-tokeniser, whitespace is a symbol (▁); BPE or unigram language model", "T5, XLM-RoBERTa, many multilingual models"],
          ]} />
          <Note>With a pre-trained Transformer feed raw text to its own tokenizer: do not stem, lemmatise or remove stop words. Classical TF-IDF models are the ones that profit from cleaning.</Note>
        </>
      ),
    },
    {
      id: "representations", title: "3 · Text representations",
      keywords: "bag of words bow count vectors one-hot n-grams unigram bigram tf-idf tfidf term frequency inverse document frequency sublinear min_df unit length l2 sparse naive bayes logistic regression svm linear sklearn pipeline tfidfvectorizer",
      render: () => {
        const N = 65349;
        return (
          <>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li><b>One-hot</b>: a vector of length |V| with a single 1. No notion of similarity.</li>
              <li><b>Bag of words (BoW)</b>: count (or 0/1) per vocabulary word; word order is lost.</li>
              <li><b>n-grams</b>: counts of word sequences; bigrams (“not good”) recover a little order and negation, at the price of a much larger vocabulary.</li>
              <li><b>TF-IDF</b>: weight a term by how often it occurs in the text and down-weight terms that occur in many texts.</li>
            </ul>
            <TB>{String.raw`\mathrm{tfidf}(t,d)=\bigl(1+\log \mathrm{tf}(t,d)\bigr)\cdot\Bigl(\log\frac{1+N}{1+\mathrm{df}(t)}+1\Bigr)`}</TB>
            <p className="text-sm">tf(t, d) = frequency of term t in sentence d (logarithmically damped), N = number of sentences, df(t) = number of sentences containing t. <b>The project’s settings</b> (scikit-learn <code>TfidfVectorizer</code>): unigrams <b>and</b> bigrams, terms that occur in fewer than 2 training sentences ignored (<code>min_df=2</code>), sub-linear tf, every vector normalised to unit length. It gave 73,556 features on the 65,349 training sentences. TF-IDF ignores word order beyond bigrams and cannot represent the meaning of an unseen word.</p>
            <p className="text-sm">Example with N = {nf(N)} (tf = 1): a term in 10 sentences gets idf = {idf(N, 10).toFixed(2)}, in 1,000 sentences {idf(N, 1000).toFixed(2)}, in 30,000 sentences {idf(N, 30000).toFixed(2)}: rare terms count several times more.</p>
            <Table wide head={["Classifier", "Model", "Project setting"]} rows={[
              ["Multinomial naive Bayes", <T key="a">{String.raw`P(y\mid x)\propto P(y)\prod_j P(t_j\mid y)^{x_j}`}</T>, "Laplace smoothing α = 0.5"],
              ["Logistic regression", <T key="b">{String.raw`P(y{=}1\mid x)=\sigma(w^Tx+b),\ \sigma(z)=\frac{1}{1+e^{-z}}`}</T>, "L2-regularised log-loss, inverse strength C = 4"],
              ["Linear SVM", <T key="c">{String.raw`\min_{w,b}\ \tfrac12\lVert w\rVert^2+C\sum_i\max\bigl(0,1-y_i(w^Tx_i+b)\bigr)`}</T>, "Hinge loss, labels ±1, C = 0.5"],
            ]} />
            <Code>{`from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC
pipe = Pipeline([("tfidf", TfidfVectorizer(ngram_range=(1, 2), min_df=2, sublinear_tf=True)),
                 ("clf", LinearSVC(C=0.5))])
pipe.fit(train_texts, train_labels)       # fit the vectoriser on TRAIN only
pred = pipe.predict(test_texts)`}</Code>
            <Note>Measured in the project (SST-2, CPU laptop): TF-IDF + linear SVM reaches 82.9 % accuracy, trains in 2.3 s and classifies a sentence in 0.055 ms.</Note>
          </>
        );
      },
    },
    {
      id: "embeddings", title: "4 · Word and sentence embeddings",
      keywords: "word2vec skip-gram cbow glove fasttext elmo bert contextual embeddings static vectors sentence embeddings sentence-bert sbert cosine similarity polysemy ambiguity bank dense vector dimension analogy oov character n-grams embedding layer",
      render: () => (
        <>
          <p className="text-sm">An embedding maps a token to a dense vector (typically 100–300 numbers for static vectors, 768 in BERT-base); similar meaning → nearby vectors. An embedding layer is just a table: <T>{String.raw`\text{vocab}\times\text{dim}`}</T> parameters.</p>
          <Table wide head={["Method", "Idea", "Contextual?", "Notes"]} rows={[
            ["word2vec (Mikolov et al., 2013)", "Predict a word from its neighbours (CBOW) or the neighbours from a word (skip-gram)", "No", "Famous for analogies such as king − man + woman ≈ queen"],
            ["GloVe", "Factorise global word co-occurrence counts", "No", "Pre-trained vectors widely available"],
            ["fastText", "A word is the sum of its character n-gram vectors", "No", "Handles rare and inflected words; used with a CNN on Lithuanian comments (Kapočiūtė-Dzikienė et al., 2019)"],
            ["ELMo (Peters et al., 2018)", "Vectors from a deep bidirectional LSTM language model", "Yes", "First widely used contextual vectors"],
            ["BERT-type encoders", "Final-layer vectors of a Transformer encoder", "Yes", "Different vector for every occurrence of a word"],
            ["Sentence embeddings", "One vector per sentence: mean-pool token vectors, take [CLS], or use a model trained for it (Sentence-BERT)", "Yes", "Compare with cosine similarity; used for semantic search and clustering"],
          ]} />
          <TB>{String.raw`\cos(u,v)=\frac{u^Tv}{\lVert u\rVert\,\lVert v\rVert}`}</TB>
          <Note>Why static vectors fail: one vector per word type cannot separate “river <i>bank</i>” from “<i>bank</i> account”, or “not good” from “good”. Contextual models compute the vector of a word from the whole sentence, so the two uses of “bank” get different vectors. This is what ELMo, ULMFiT and finally BERT added; the project paper describes these as the step that established “pre-train, then fine-tune”.</Note>
        </>
      ),
    },
    {
      id: "language-models", title: "5 · Language models",
      keywords: "language model n-gram bigram trigram chain rule smoothing laplace kneser-ney perplexity causal language model masked language model autoregressive next word prediction gpt bert pseudo-perplexity cross-entropy",
      render: () => (
        <>
          <p className="text-sm">A language model assigns a probability to text. By the chain rule:</p>
          <TB>{String.raw`P(w_1,\ldots,w_n)=\prod_{t=1}^{n}P(w_t\mid w_1,\ldots,w_{t-1})`}</TB>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li><b>n-gram model</b>: keep only the last n − 1 words; bigram estimate <T>{String.raw`P(w_t\mid w_{t-1})=\frac{\mathrm{count}(w_{t-1}w_t)}{\mathrm{count}(w_{t-1})}`}</T>. Unseen n-grams get probability 0, so smoothing is needed (add-one / Laplace, back-off, Kneser–Ney).</li>
            <li><b>Neural language models</b> (RNN, LSTM, Transformer) replace counting with learned representations and condition on a long context.</li>
          </ul>
          <TB>{String.raw`\mathrm{PPL}=\exp\Bigl(-\frac1N\sum_{t=1}^{N}\log P(w_t\mid w_{<t})\Bigr)`}</TB>
          <p className="text-sm"><b>Perplexity</b> = exponential of the average cross-entropy per token: the “effective number of equally likely choices”. Lower is better. A model that guesses uniformly over a vocabulary of 10,000 words has perplexity exactly {nf(10000)}. Only compare perplexities of models with the <i>same</i> tokenisation and test text (sub-word and word perplexities are not comparable).</p>
          <Table wide head={["", "Causal (autoregressive) LM", "Masked LM"]} rows={[
            ["Task", "Predict the next token from the left context", "Predict hidden tokens (15 % masked) from both sides"],
            ["Context", "Left only (causal mask)", "Left and right"],
            ["Examples", "n-grams, GPT, GPT-3", "BERT, RoBERTa, DistilBERT"],
            ["Strength", "Generates text; perplexity is well defined", "Deep bidirectional representations for understanding tasks"],
            ["Loss", <T key="a">{String.raw`-\sum_t\log P(w_t\mid w_{<t})`}</T>, <T key="b">{String.raw`L_{MLM}=-\sum_{t\in M}\log P(w_t\mid x_{\setminus M})`}</T>],
          ]} />
        </>
      ),
    },
    {
      id: "sequence-models", title: "6 · Sequence models (RNN, LSTM, GRU)",
      keywords: "rnn recurrent neural network lstm gru gates forget input output cell state hidden state bilstm bidirectional seq2seq encoder decoder bahdanau attention vanishing gradient backpropagation through time parameters count max-pooling",
      render: () => (
        <>
          <p className="text-sm">A recurrent network reads a sentence one token at a time and carries a hidden state: <T>{String.raw`h_t=\tanh(W_h h_{t-1}+W_x x_t+b)`}</T>. Gradients must travel back through every step, so they vanish (or explode) on long sentences, and the n steps cannot run in parallel.</p>
          <Sub>LSTM (Hochreiter &amp; Schmidhuber, 1997): gates decide what the memory cell keeps</Sub>
          <TB>{String.raw`f_t=\sigma(W_f[h_{t-1},x_t]+b_f),\quad i_t=\sigma(W_i[h_{t-1},x_t]+b_i),\quad o_t=\sigma(W_o[h_{t-1},x_t]+b_o)`}</TB>
          <TB>{String.raw`\tilde c_t=\tanh(W_c[h_{t-1},x_t]+b_c),\quad c_t=f_t\odot c_{t-1}+i_t\odot\tilde c_t,\quad h_t=o_t\odot\tanh(c_t)`}</TB>
          <Sub>GRU: two gates, no separate cell</Sub>
          <TB>{String.raw`z_t=\sigma(W_z[h_{t-1},x_t]),\quad r_t=\sigma(W_r[h_{t-1},x_t]),\quad \tilde h_t=\tanh(W[r_t\odot h_{t-1},x_t]),\quad h_t=(1-z_t)\odot h_{t-1}+z_t\odot\tilde h_t`}</TB>
          <Table wide head={["Cell", "Weight blocks", "Parameters (Keras), input 128, 64 units", "Parameters (formula)"]} rows={[
            ["SimpleRNN", "1", nf(rnnParams(128, 64)), <T key="a">{String.raw`h(d+h)+h`}</T>],
            ["LSTM", "4 (forget, input, candidate, output)", nf(lstmParams(128, 64)), <T key="b">{String.raw`4[h(d+h)+h]`}</T>],
            ["GRU", "3 (reset, update, candidate)", nf(gruParams(128, 64)), <T key="c">{String.raw`3[h(d+h)+2h]`}</T>],
          ]} />
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li><b>BiLSTM</b>: one LSTM left-to-right, one right-to-left, hidden states concatenated, so each position sees both sides. <b>The project’s recurrent baseline</b>: random 128-d embeddings, bidirectional LSTM (hidden 128), max-pooling over time, dropout 0.3, a linear output layer; 4 epochs, Adam (lr 0.001, batch 64), best epoch by dev accuracy; 1,974,786 parameters, no pre-training. Measured in the project: 82.8 % accuracy, 380 s training, 0.45 ms per sentence.</li>
            <li><b>seq2seq</b> (translation, summarisation): an encoder RNN compresses the source into a vector, a decoder RNN writes the target word by word. One fixed vector is a bottleneck for long sentences.</li>
            <li><b>Bahdanau attention (2015)</b>: at each output step the decoder scores all encoder states and takes a weighted average (next section), so it can focus on the relevant source words.</li>
          </ul>
        </>
      ),
    },
    {
      id: "attention-intro", title: "7 · Attention in one page",
      keywords: "attention bahdanau additive self-attention cross-attention query key value softmax weights scaled dot-product multi-head context vector alignment transformer parallel long-range dependencies",
      render: () => (
        <>
          <p className="text-sm">Attention answers “which other positions matter for this one?” It scores a <b>query</b> against many <b>keys</b>, turns the scores into weights with softmax, and returns the weighted average of the <b>values</b>.</p>
          <TB>{String.raw`e_{ti}=a(s_{t-1},h_i),\quad \alpha_{ti}=\frac{e^{e_{ti}}}{\sum_k e^{e_{tk}}},\quad c_t=\sum_i\alpha_{ti}h_i\qquad\text{(Bahdanau: additive score }a\text{)}`}</TB>
          <TB>{String.raw`\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\left(\frac{QK^{T}}{\sqrt{d_k}}\right)V\qquad\text{(Transformer: dot-product score)}`}</TB>
          <Table wide head={["Kind", "Queries from", "Keys and values from", "Where"]} rows={[
            ["Encoder–decoder (Bahdanau) attention", "Decoder state", "Encoder states", "RNN translation models"],
            ["Self-attention", "The same sequence", "The same sequence", "Every Transformer layer: each token looks at all tokens"],
            ["Cross-attention", "Decoder", "Encoder output", "Transformer decoders (T5, BART)"],
          ]} />
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>Every pair of tokens is connected directly: the path between two words has length 1, and all positions are computed in parallel.</li>
            <li>Multi-head attention runs h such functions with different projections, so different heads can track different relations.</li>
            <li>Cost: O(n²·d) per layer: fine for sentences, a limit for long documents.</li>
          </ul>
          <p className="mt-2 text-sm">Full derivation, a worked numeric example, masks and shapes: <Link className="text-brand hover:underline" to="/cheatsheets/transformers#attention">Transformers cheatsheet, section 4</Link>.</p>
        </>
      ),
    },
    {
      id: "pretrained", title: "8 · Pre-trained models",
      keywords: "pre-trained pretrained models families bert roberta distilbert albert electra deberta xlm-roberta multilingual litlat gpt gpt-3 llama t5 bart ulmfit elmo sentence-bert zero-shot in-context learning hugging face hub fine-tune transfer learning",
      render: () => (
        <>
          <p className="text-sm">The “pre-train, then fine-tune” paradigm: learn general language knowledge from unlabelled text once, then adapt to a task with little labelled data (ULMFiT, Howard &amp; Ruder, 2018, showed this for text classification; Transformers made it dominant).</p>
          <Table wide head={["Family", "Models", "Best for", "Note"]} rows={[
            ["Static embeddings", "word2vec, GloVe, fastText", "Features for small classical or neural models", "No context"],
            ["Contextual LSTM", "ELMo, ULMFiT", "Historical step", "Superseded by Transformers"],
            ["Encoder-only", "BERT (110 M / 340 M), RoBERTa, ALBERT, ELECTRA, DeBERTa", "Classification, tagging, QA, embeddings", "Fine-tune with a small head"],
            ["Compact encoders", "DistilBERT (40 % smaller, 60 % faster, about 97 % of BERT), compact BERTs (tiny … base)", "CPU, latency-sensitive use", "Pre-training compact models directly matters (Turc et al., 2019)"],
            ["Multilingual encoders", "XLM-RoBERTa (100 languages, incl. Lithuanian), mBERT, LitLat BERT (Lithuanian–Latvian–English)", "Small or non-English languages", "Models for a few languages often beat massively multilingual ones"],
            ["Decoder-only LLMs", "GPT, GPT-3 (175 B), Llama-2-based Lithuanian models (7 B, 13 B)", "Generation, prompting, few-shot", "In-context learning without fine-tuning"],
            ["Encoder–decoder", "T5 (text-to-text), BART", "Summarisation, translation", "Strong generators"],
            ["Ready-made task models", "DistilBERT fine-tuned on SST-2, Twitter-RoBERTa, NLI cross-encoders", "Use as a service, no training", "Check domain and labels"],
          ]} />
          <Note>Zhang et al. (2024): zero-shot LLMs such as ChatGPT are competitive on simple binary sentiment, but smaller fine-tuned models still win on tasks that need structured or fine-grained understanding. Domain matters too: Twitter-trained RoBERTa was 5.3 points below the in-domain DistilBERT on movie reviews in the project.</Note>
        </>
      ),
    },
    {
      id: "metrics", title: "9 · Evaluation metrics",
      keywords: "metrics accuracy precision recall f1 macro micro weighted confusion matrix roc auc pr curve bleu rouge chrf perplexity bootstrap confidence interval mcnemar exact match meteor significance paired test class imbalance tp fp fn tn",
      render: () => (
        <>
          <TB>{String.raw`\mathrm{Accuracy}=\frac{TP+TN}{TP+TN+FP+FN},\quad \mathrm{Precision}=\frac{TP}{TP+FP},\quad \mathrm{Recall}=\frac{TP}{TP+FN}`}</TB>
          <TB>{String.raw`F_1=\frac{2\cdot\mathrm{Precision}\cdot\mathrm{Recall}}{\mathrm{Precision}+\mathrm{Recall}}`}</TB>
          <p className="text-sm">Compute precision, recall and F1 <b>per class</b> and average. <b>Macro</b> = unweighted mean (every class counts equally; the project’s choice), <b>micro</b> = pool all decisions (equals accuracy for single-label problems), <b>weighted</b> = mean weighted by class size. The project’s test set is almost balanced, so accuracy and macro-F1 differed by less than 0.2 points.</p>
          <Table wide head={["Metric", "Measures", "Use when", "Caveat"]} rows={[
            ["Accuracy", "Share of correct predictions", "Balanced classes", "Misleading with imbalance (95 % majority class)"],
            ["Precision / recall", "Purity of positive predictions / coverage of true positives", "False alarms and misses cost differently", "Trade off through the decision threshold"],
            ["Macro-F1", "Mean of per-class F1", "Imbalanced or multi-class", "Hides which class is weak: read the confusion matrix"],
            ["Confusion matrix", "Counts of true vs predicted classes", "Always, for error analysis", "—"],
            ["ROC / AUC", "True-positive rate vs false-positive rate over all thresholds; AUC = probability a random positive is scored above a random negative", "Ranking quality, threshold not chosen yet", "Optimistic for very rare positives: look at the precision–recall curve"],
            ["Perplexity", "exp(average cross-entropy per token)", "Language models with the same tokenisation", "Not comparable across tokenisations"],
            ["BLEU", "Modified n-gram precision (1–4-grams) of a translation against references, multiplied by a brevity penalty, over the whole corpus", "Machine translation", "Surface overlap only; weak for morphologically rich languages"],
            ["ROUGE", "Overlap with reference summaries: ROUGE-1 / 2 (n-gram recall), ROUGE-L (longest common subsequence)", "Summarisation", "Rewards copying; read samples too"],
            ["chrF", "F-score on character n-grams", "Translation into morphologically rich languages (e.g. Lithuanian)", "Less sensitive to inflection than BLEU"],
            ["Exact match / token F1", "Answer string equals / overlaps the gold answer", "Extractive QA", "—"],
            ["Recall@k, MRR, nDCG", "Is the right document in the top k / how high is it ranked", "Retrieval", "—"],
            ["Bootstrap CI", "95 % interval from resampling the test set 2,000 times", "Any single reported number", "Shows that 872 sentences give about ± 2.5 points"],
            ["McNemar (exact)", "Do two models differ on the same sentences? Uses only the disagreements b and c", "Comparing two classifiers", "Needs paired predictions on one test set"],
          ]} />
          <div className="mt-4"><PRFCalculator /></div>
          <div className="mt-4"><McNemarCalculator /></div>
          <Note>Report a number, an interval and the test-set size. Details of the bootstrap and McNemar with the project’s results: <Link className="text-brand hover:underline" to="/cheatsheets/transformers#evaluation">Transformers cheatsheet, section 14</Link>.</Note>
        </>
      ),
    },
    {
      id: "hf-code", title: "10 · Hugging Face quick reference",
      keywords: "hugging face pipeline autotokenizer automodelforsequenceclassification trainer manual training loop zero-shot classification hypothesis template datasets load_dataset ner question answering summarization translation fill-mask cpu only code snippet from_pretrained",
      render: () => (
        <>
          <Sub>Pipelines: one line per task</Sub>
          <Code>{`from transformers import pipeline
clf = pipeline("sentiment-analysis", model="distilbert-base-uncased-finetuned-sst-2-english", device=-1)  # -1 = CPU
ner = pipeline("ner", aggregation_strategy="simple")                      # entities, pieces merged
qa = pipeline("question-answering")
qa(question="Who proposed the Transformer?", context="Vaswani et al. proposed the Transformer in 2017.")
summ = pipeline("summarization", model="facebook/bart-large-cnn")
mt = pipeline("translation", model="Helsinki-NLP/opus-mt-en-de")
fill = pipeline("fill-mask", model="bert-base-uncased")
fill("The plot was [MASK], but the acting was brilliant.")               # masked LM in action`}</Code>
          <Sub>Zero-shot with the project’s template (no training data)</Sub>
          <Code>{`zs = pipeline("zero-shot-classification", model="cross-encoder/nli-distilroberta-base", device=-1)
out = zs(texts, candidate_labels=["positive", "negative"],
         hypothesis_template="The sentiment of this movie review is {}.", batch_size=32)
pred = [int(o["labels"][0] == "positive") for o in out]`}</Code>
          <Sub>Data, tokenizer, model</Sub>
          <Code>{`from datasets import load_dataset
from transformers import AutoTokenizer, AutoModelForSequenceClassification
ds = load_dataset("nyu-mll/glue", "sst2")        # full repo name; splits: train, validation, test (test labels hidden)
tok = AutoTokenizer.from_pretrained("distilbert-base-uncased")
model = AutoModelForSequenceClassification.from_pretrained("distilbert-base-uncased", num_labels=2)
enc = tok("not good, but brilliant", truncation=True, max_length=64, return_tensors="pt")
logits = model(**enc).logits`}</Code>
          <Sub>Trainer vs a manual loop</Sub>
          <Table wide head={["", "Trainer", "Manual PyTorch loop"]} rows={[
            ["Code", "Short: TrainingArguments + Trainer.train()", "20–30 lines (AdamW, get_linear_schedule_with_warmup, clip_grad_norm_)"],
            ["Built in", "Evaluation each epoch, checkpoints, logging, best-model loading, mixed precision on GPU", "Nothing: you write it"],
            ["Control", "Callbacks and subclassing", "Complete: custom best-epoch rule, timing, custom batches"],
            ["Good for", "Standard fine-tuning", "Teaching, unusual losses, exact reproduction (the project used a manual loop)"],
          ]} />
          <p className="mt-2 text-sm">Complete loop and Trainer arguments with the project’s hyper-parameters: <Link className="text-brand hover:underline" to="/cheatsheets/transformers#hf-code">Transformers cheatsheet, section 15</Link>.</p>
          <Note>CPU-only advice (what worked in the project): use a distilled model (DistilBERT fine-tuned in about 2.6 h on 8,000 sentences), max length 64, batch size 32, <code>device=-1</code> for pipelines, <code>torch.no_grad()</code> for inference, and expect the zero-shot pipeline to be the slowest (one pass per candidate label).</Note>
        </>
      ),
    },
    {
      id: "data", title: "11 · Datasets and benchmarks",
      keywords: "datasets benchmarks sst-2 sst stanford sentiment treebank glue superglue squad conll imdb ag news mnli xnli wmt cnn dailymail rotten tomatoes splits train dev test validation 872 65349 2000",
      render: () => (
        <>
          <Sub>The project’s SST-2 splits</Sub>
          <Table wide head={["Split", "Source", "Size", "Positive share", "Mean length (words)"]} rows={[
            ["Train", "SST-2 train minus dev", "65,349", "55.8 %", "9.4"],
            ["Dev", "2,000 random sentences from SST-2 train (stratified by class)", "2,000", "55.8 %", "—"],
            ["Test", "SST-2 official validation set (GLUE test labels are hidden)", "872", "50.9 %", "19.5"],
          ]} />
          <p className="mt-2 text-sm">The Stanford Sentiment Treebank (Socher et al., 2013) has 11,855 movie-review sentences from Rotten Tomatoes, each parsed into a tree with every phrase labelled by three judges. The binary SST-2 in GLUE drops neutral sentences: 67,349 training phrases and sentences, 872 validation sentences. Note the mismatch: training is mostly short phrases, the test set whole sentences.</p>
          <Table wide head={["Benchmark", "Task", "What to know"]} rows={[
            ["GLUE (Wang et al.)", "Nine sentence-level understanding tasks: CoLA, SST-2, MRPC, QQP, STS-B, MNLI, QNLI, RTE, WNLI", "Standard comparison for BERT-type models; SST-2 is its sentiment task"],
            ["SuperGLUE", "Harder successor of GLUE", "DeBERTa was the first model to exceed the human baseline"],
            ["SQuAD", "Extractive question answering over Wikipedia passages", "Exact match and F1; v2.0 adds unanswerable questions"],
            ["MNLI / XNLI", "Natural language inference; XNLI across 15 languages", "Training data for zero-shot NLI classifiers"],
            ["CoNLL-2003", "Named entity recognition (English, German)", "Entity-level F1"],
            ["IMDb, AG News", "Review sentiment (50,000 reviews); news topic classification", "Common classification test beds"],
            ["CNN / DailyMail", "Summarisation", "ROUGE"],
            ["WMT", "Machine translation shared tasks", "BLEU, chrF"],
          ]} />
          <Code>{`from datasets import load_dataset
sst2 = load_dataset("nyu-mll/glue", "sst2")
print(sst2)                 # train 67,349 · validation 872 · test (labels hidden)`}</Code>
        </>
      ),
    },
    {
      id: "choose", title: "12 · Which approach to choose",
      keywords: "which approach choose decision recommendations practical recommendations ready-made fine-tune distilbert zero-shot tf-idf svm cost accuracy trade-off low resource labelled data learning curve data efficiency model selection",
      render: () => {
        const a = get("DistilBERT-SST2"), b = get("DistilBERT fine-tuned"), z = get("Zero-shot"), s = get("TF-IDF + Linear SVM"), tw = get("Twitter"), sm = get("BERT-small"), ti = get("BERT-tiny"), bl = get("BiLSTM");
        const lc = LEARNING_CURVE[0];
        const row = (m: Measured, extra: string) => `${m.acc.toFixed(1)} % · ${m.latMs.toFixed(m.latMs < 1 ? 3 : 1)} ms/sentence · ${extra}`;
        return (
          <>
            <p className="text-sm">The project’s four practical recommendations, in the order to try them. All numbers are <b>measured in the project (SST-2, 872 test sentences, CPU laptop)</b>; they are for English movie reviews, other domains and languages will differ.</p>
            <Table wide head={["Your situation", "Choose", "Measured evidence"]} rows={[
              ["1. A public model already fine-tuned for the same task and domain exists", "Use it as is: best quality, no training", `DistilBERT-SST2: ${row(a, "no training")}`],
              ["2. No such model, but a few thousand labelled examples", "Fine-tune a distilled Transformer (DistilBERT); feasible without a GPU", `DistilBERT on 8,000 sentences: ${row(b, "about 2.6 h training")}; CI ${b.ciLow}–${b.ciHigh}; significantly better than the best classical model trained on all 65,349 (p < 0.001)`],
              ["3. No labelled data at all", "Zero-shot NLI model as a baseline", `${row(z, "no training")}: the level of TF-IDF logistic regression trained on 65 thousand sentences`],
              ["4. Inference must be extremely cheap, or hardware is very limited", "TF-IDF + linear SVM (or naive Bayes / logistic regression)", `${row(s, "2.3 s training")}; ${nf(s.params)} n-gram weights; 20–2,000 times cheaper than the Transformers`],
            ]} />
            <Sub>What else the measurements say</Sub>
            <ul className="list-disc space-y-1 pl-5 text-sm">
              <li>Ready-made model from a <b>different domain</b> (Twitter-RoBERTa): {tw.acc.toFixed(1)} %, {(a.acc - tw.acc).toFixed(1)} points below the in-domain one, still above all classical models.</li>
              <li><b>Compact Transformers only match the classical models</b>: BERT-small {sm.acc.toFixed(1)} % (vs SVM {s.acc.toFixed(1)} %, not significant, p = 0.61); BERT-tiny was the weakest of all ({ti.acc.toFixed(1)} %). Capacity must suffice.</li>
              <li><b>BiLSTM from scratch</b>: {bl.acc.toFixed(1)} %, no gain over TF-IDF although training took 100–200 times longer.</li>
              <li><b>Few labels favour pre-training</b>: with {lc.n} labelled sentences BERT-small {lc.bert.toFixed(1)} % vs TF-IDF {lc.tfidf.toFixed(1)} % (+{(lc.bert - lc.tfidf).toFixed(1)} points); with 4,000 sentences BERT-small matches the classical model trained on 16 times more data.</li>
              <li><b>Difficult sentences</b> (negation, contrast): bag-of-words models lose 8–9 points on negation, large Transformers 2–4, zero-shot NLI almost nothing.</li>
            </ul>
            <Table wide head={["Model (all measured)", "Accuracy %", "ms / sentence", "Training"]} rows={[...MEASURED].reverse().map((m) => [m.name, m.acc.toFixed(1), m.latMs.toFixed(m.latMs < 1 ? 3 : 1), m.trainS > 0 ? `${nf(Math.round(m.trainS))} s` : "none"])} />
            <Note>For Lithuanian the project suggests the same procedure with LitLat BERT or XLM-RoBERTa, ideally repeated over several random seeds (the project used one) and with GPU timings.</Note>
          </>
        );
      },
    },
    {
      id: "lithuanian", title: "13 · Lithuanian and small languages",
      keywords: "lithuanian lietuvių small languages low-resource less-resourced baltic morphologically rich inflection litlat bert xlm-roberta kapočiūtė-dzikienė vileikytė nakvosas ulčar robnik-šikonja llama2 sentiment comments reviews fasttext diacritics",
      render: () => (
        <>
          <p className="text-sm">Lithuanian is morphologically rich (heavy inflection), has free word order and relatively few annotated resources: a hard case for NLP, and the reason the project’s data-efficiency question matters. Studies cited in the project paper:</p>
          <Table wide head={["Study", "What they did", "Finding"]} rows={[
            ["Kapočiūtė-Dzikienė et al. (2013)", "Machine learning vs lexicon-based sentiment classification of Lithuanian Internet comments", "Rich inflection and non-normative spelling strongly affect the choice of features"],
            ["Kapočiūtė-Dzikienė, Damaševičius & Woźniak (2019)", "Multinomial naive Bayes and SVM vs LSTM and CNN with word embeddings; comments, 3 classes (positive, negative, neutral)", "Best traditional method (naive Bayes, about 0.735 accuracy) beat the best deep model (CNN with fastText embeddings, about 0.706): without pre-training, neural networks do not automatically win on limited data"],
            ["Ulčar & Robnik-Šikonja (2021)", "LitLat BERT: trilingual Lithuanian–Latvian–English model based on the XLM-RoBERTa architecture", "Corpus size and vocabulary size strongly determine quality; models for a few languages beat massively multilingual models on most tasks"],
            ["Vileikytė, Lukoševičius & Stankevičius (2024), Kaunas University of Technology", "Fine-tuned multilingual BERT and T5 for sentiment of Lithuanian online reviews from several domains", "High accuracy on clearly polar reviews, lower on ambiguous middle ratings"],
            ["Nakvosas, Daniušis & Mulevičius (2024), Neurotechnology, Vilnius", "First open Llama-2-based large language models for Lithuanian (7 and 13 billion parameters), pre-trained on more than 14 billion Lithuanian tokens, with translated evaluation benchmarks", "Open Lithuanian LLMs now exist"],
            ["Conneau et al. (2020): XLM-RoBERTa", "RoBERTa-style pre-training on 100 languages", "Includes Lithuanian; a natural starting point for fine-tuning"],
          ]} />
          <Sub>Practical advice</Sub>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li>Start from a multilingual or Baltic pre-trained encoder (XLM-RoBERTa, LitLat BERT) and fine-tune on a few thousand labelled examples; the project’s learning curve shows pre-training is most valuable exactly when labels are scarce.</li>
            <li>Classical baselines are still worth a run: character n-grams, fastText or lemmatisation tame inflection; keep diacritics (ą č ę ė į š ų ū ž).</li>
            <li>Sub-word tokenisers keep every word in vocabulary; check how many pieces your words split into.</li>
            <li>Absolute numbers will differ from English; the paper expects the <i>relative</i> behaviour of the model families to be similar.</li>
          </ul>
          <Code>{`from transformers import AutoTokenizer, AutoModelForSequenceClassification
name = "xlm-roberta-base"                       # multilingual, includes Lithuanian
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForSequenceClassification.from_pretrained(name, num_labels=3)  # e.g. positive / negative / neutral
print(tok.tokenize("Šis filmas buvo nuostabus"))`}</Code>
          <Note>Not verified by the project: results for Lithuanian were not run, only reviewed from the literature above. The project paper’s own suggestion for future work is exactly this procedure with LitLat BERT or XLM-RoBERTa, repeated seeds and GPU timings.</Note>
        </>
      ),
    },
    {
      id: "pitfalls", title: "14 · Pitfalls and quick diagnosis",
      keywords: "pitfalls diagnosis leakage data leakage class imbalance train test length mismatch distribution shift tokenizer mismatch random seed seeds variance small test set confidence interval domain shift stop words negation overfitting dev set label noise duplicates",
      render: () => (
        <>
          <Table wide head={["Symptom", "Likely cause", "What to do"]} rows={[
            ["Suspiciously high score", "Leakage: duplicates across splits, TF-IDF / vocabulary / scaler fitted on all data, test set used to choose settings", "Split first, fit every transformation on train only, choose on dev, touch the test set once"],
            ["Accuracy looks fine, minority class is wrong", "Class imbalance (the project’s train set is 55.8 % positive; a 95 / 5 problem would be worse)", "Macro-F1, per-class recall, confusion matrix; class weights or resampling"],
            ["Dev score much higher than test score", "Train / test mismatch: in the project, training phrases average 9.4 words, test sentences 19.5; the BiLSTM scored 91.3 % on dev phrases but 82.8 % on test sentences", "Compare length and style of the splits; build dev from the test distribution when you can"],
            ["Pre-trained model gives garbage", "Tokenizer or label mapping does not match the checkpoint; fresh head not fine-tuned", "Same name for tokenizer and model; read the model card’s label ids"],
            ["“Not good” classified positive", "Bag-of-words ignores order and negation (−8 to −9 points on negation sentences); stop-word removal deleted “not”", "Bigrams, a contextual model, keep negation words"],
            ["Result changes from run to run", "One random seed; tiny test set", "Several seeds; report bootstrap CI and McNemar"],
            ["Model A beats B by 1 point", "872 test sentences: one point = about 9 sentences, a 95 % interval is ± 2.5 points", "Test significance (paired McNemar) before claiming a winner"],
            ["Works on movie reviews, fails on tweets / other language", "Domain shift (Twitter-RoBERTa lost 5.3 points against the in-domain model on film reviews)", "Evaluate on your own data; prefer a model trained on your domain"],
            ["Unfair comparison", "Different training sizes, hardware or timing conditions", "Same splits, same seed for subsets, run models one after another on an idle machine"],
            ["Out-of-vocabulary words hurt", "Word-level vocabulary", "Sub-word tokenisation, fastText"],
          ]} />
          <Note>Quick checklist: (1) is the test set untouched? (2) do train and test look alike? (3) does the metric fit the class balance? (4) is the difference larger than the confidence interval? (5) does the model handle negation and contrast sentences? (6) what does it cost in time, latency and memory?</Note>
        </>
      ),
    },
  ],
};
