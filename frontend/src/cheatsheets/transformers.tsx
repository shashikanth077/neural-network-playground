import { AttentionCostCalculator, LatencyCalculator, McNemarCalculator, ParamCalculator } from "./Calculators";
import { attention, linearWarmupLR, mcnemarExact, megabytes32, sentencesPerSecond, sinusoidalPE, stepsPerEpoch, transformerParams } from "./calc";
import { LEARNING_CURVE, MEASURED } from "./measured";
import type { Cheatsheet } from "./types";
import { Code, Note, Sub, T, TB, Table } from "./ui";

const nf = (n: number) => n.toLocaleString("en");
const fmtP = (p: number) => (p >= 0.001 ? p.toFixed(3) : p === 0 ? "0" : p.toExponential(1));
const fmtTime = (s: number) => (s <= 0 ? "–" : s < 60 ? `${s.toFixed(1)} s` : s < 3600 ? `${(s / 60).toFixed(0)} min` : `${(s / 3600).toFixed(1)} h`);
const sty = (o: Record<string, string>) => o;

/** The three encoders of the project, with their real hyper-parameters. */
const MODELS = [
  { name: "BERT-tiny", d: 128, L: 2, h: 2, ff: 512, typeVocab: 2, lr: "2·10⁻⁴", epochs: 3, id: "google/bert_uncased_L-2_H-128_A-2" },
  { name: "BERT-small", d: 512, L: 4, h: 8, ff: 2048, typeVocab: 2, lr: "1·10⁻⁴", epochs: 3, id: "google/bert_uncased_L-4_H-512_A-8" },
  { name: "DistilBERT", d: 768, L: 6, h: 12, ff: 3072, typeVocab: 0, lr: "5·10⁻⁵", epochs: 2, id: "distilbert-base-uncased" },
];

/** Block diagram of the encoder, drawn bottom-up like the paper's figure. Colours come from the theme variables. */
function ArchitectureDiagram() {
  const ink = sty({ fill: "rgb(var(--ink))" });
  const muted = sty({ fill: "rgb(var(--muted))" });
  const box = (stroke: string) => sty({ fill: "rgb(var(--raised))", stroke: `rgb(var(--${stroke}))`, strokeWidth: "1.5" });
  const arrow = sty({ stroke: "rgb(var(--muted))", strokeWidth: "1.5", fill: "none" });
  const resid = sty({ stroke: "rgb(var(--muted))", strokeWidth: "1.3", fill: "none", strokeDasharray: "4 3" });
  const line = (x: number, y1: number, y2: number) => <path d={`M${x} ${y1} V${y2}`} style={arrow} markerEnd="url(#arr)" />;
  return (
    <svg viewBox="0 0 360 524" role="img" aria-labelledby="arch-t arch-d" className="mx-auto block h-auto w-full max-w-[420px]" fontFamily="Inter, ui-sans-serif, system-ui, sans-serif" fontSize="12.5">
      <title id="arch-t">Transformer encoder for classification</title>
      <desc id="arch-d">From bottom to top: input sentence, sub-word tokens, token plus position embeddings, N identical layers each with multi-head self-attention, add and norm, feed-forward network, add and norm, the CLS vector, a linear softmax classification head and the class probabilities.</desc>
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
          <path d="M0 0 L10 5 L0 10 z" style={sty({ fill: "rgb(var(--muted))" })} />
        </marker>
      </defs>
      {/* output side */}
      <rect x="70" y="6" width="220" height="30" rx="8" style={box("ok")} />
      <text x="180" y="25" textAnchor="middle" style={ink}>P(y | x): class probabilities</text>
      {line(180, 56, 38)}
      <rect x="70" y="56" width="220" height="30" rx="8" style={box("brand")} />
      <text x="180" y="75" textAnchor="middle" style={ink}>Linear + softmax (new head)</text>
      {line(180, 104, 88)}
      <rect x="70" y="104" width="220" height="30" rx="8" style={box("brand")} />
      <text x="180" y="123" textAnchor="middle" style={ink}>h_CLS (first vector, d numbers)</text>
      {line(180, 188, 136)}
      {/* encoder stack */}
      <rect x="22" y="150" width="316" height="204" rx="12" style={sty({ fill: "none", stroke: "rgb(var(--brand))", strokeWidth: "1.5", strokeDasharray: "6 4" })} />
      <text x="328" y="168" textAnchor="end" style={sty({ fill: "rgb(var(--brand))", fontWeight: "700" })}>× N identical layers</text>
      <rect x="78" y="188" width="224" height="28" rx="7" style={box("line")} />
      <text x="190" y="206" textAnchor="middle" style={ink}>Add &amp; Norm</text>
      {line(190, 228, 218)}
      <rect x="78" y="228" width="224" height="28" rx="7" style={box("c-amber")} />
      <text x="190" y="246" textAnchor="middle" style={ink}>Feed-forward (GELU)</text>
      {line(190, 268, 258)}
      <rect x="78" y="268" width="224" height="28" rx="7" style={box("line")} />
      <text x="190" y="286" textAnchor="middle" style={ink}>Add &amp; Norm</text>
      {line(190, 308, 298)}
      <rect x="78" y="308" width="224" height="30" rx="7" style={box("c-teal")} />
      <text x="190" y="327" textAnchor="middle" style={ink}>Multi-head self-attention</text>
      {/* residual connections */}
      <path d="M190 360 H50 V282 H76" style={resid} markerEnd="url(#arr)" />
      <path d="M190 262 H50 V202 H76" style={resid} markerEnd="url(#arr)" />
      <text x="46" y="330" textAnchor="middle" transform="rotate(-90 46 330)" style={muted} fontSize="10.5">residual</text>
      {/* input side */}
      {line(190, 376, 340)}
      <rect x="50" y="376" width="260" height="40" rx="8" style={box("c-purple")} />
      <text x="180" y="393" textAnchor="middle" style={ink}>Embedding: E(w) + P(t)</text>
      <text x="180" y="409" textAnchor="middle" style={muted} fontSize="11">h⁽⁰⁾, shape n × d</text>
      {line(180, 434, 418)}
      <rect x="50" y="434" width="260" height="42" rx="8" style={box("c-purple")} />
      <text x="180" y="451" textAnchor="middle" style={ink}>Sub-word tokens → ids</text>
      <text x="180" y="468" textAnchor="middle" style={muted} fontSize="11">[CLS] the plot was not good [SEP]</text>
      {line(180, 496, 478)}
      <rect x="50" y="496" width="260" height="26" rx="8" style={box("line")} />
      <text x="180" y="513" textAnchor="middle" style={ink}>Input sentence (text)</text>
    </svg>
  );
}

const Q = [[1, 0], [0, 1], [1, 1]];
const V = [[1, 0], [0, 2], [1, 1]];
const att = attention(Q, Q, V);
const fx = (x: number) => x.toFixed(3);
const mat = (m: number[][]) => m.map((r) => r.map(fx).join("  ")).join("\n");

export const transformersSheet: Cheatsheet = {
  id: "transformers",
  domain: "nlp",
  title: "Transformers cheatsheet",
  subtitle: "The Transformer end to end: tokens, attention, the encoder block, parameter counts, pre-training, fine-tuning, cost and evaluation.",
  status: "live",
  sections: [
    {
      id: "big-picture", title: "1 · The Transformer in one picture",
      keywords: "architecture diagram encoder decoder block overview vaswani 2017 attention is all you need layers stack cls head bert gpt t5 encoder-only decoder-only seq2seq flow shapes",
      render: () => (
        <>
          <p className="text-sm">A Transformer drops recurrence: every token looks directly at every other token (self-attention) and all positions are processed in parallel. This sheet follows the <b>encoder</b> used by BERT, DistilBERT and RoBERTa, as in the project: a stack of <i>L</i> identical layers, each with a multi-head self-attention sub-layer and a position-wise feed-forward sub-layer, both wrapped in a residual connection and layer normalisation.</p>
          <div className="mt-3 grid grid-cols-[minmax(0,1fr)] items-start gap-5 md:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <ArchitectureDiagram />
            <div className="min-w-0">
              <Table head={["Stage", "Shape (one sentence)", "What happens"]} rows={[
                ["Text", "string", "“the plot was not good”"],
                ["Tokens", <T key="a">{String.raw`(n,)`}</T>, "WordPiece / BPE pieces + [CLS] … [SEP] → integer ids"],
                ["Embedding", <T key="b">{String.raw`(n,d)`}</T>, <>Look up <T>{String.raw`E(w_t)`}</T> and add the position <T>{String.raw`P(t)`}</T></>],
                ["Each layer", <T key="c">{String.raw`(n,d)\to(n,d)`}</T>, "Attention mixes tokens; the feed-forward net transforms each token on its own"],
                ["[CLS]", <T key="d">{String.raw`(d,)`}</T>, <>First vector <T>{String.raw`h_{CLS}`}</T> summarises the sentence</>],
                ["Head", <T key="e">{String.raw`(2,)`}</T>, <><T>{String.raw`\mathrm{softmax}(Wh_{CLS}+b)`}</T>, a new layer trained during fine-tuning</>],
              ]} />
              <Sub>Three flavours</Sub>
              <Table head={["Type", "Sees", "Examples", "Typical use"]} rows={[
                ["Encoder-only", "Both sides of every token", "BERT, RoBERTa, DistilBERT, XLM-R", "Classification, tagging, QA, embeddings"],
                ["Decoder-only", "Only tokens to the left (causal mask)", "GPT, GPT-3", "Text generation, prompting"],
                ["Encoder–decoder", "Encoder: all; decoder: left + encoder", "Original Transformer, T5, BART", "Translation, summarisation"],
              ]} />
            </div>
          </div>
          <Note>Why it won (project conclusion 2): self-attention connects every pair of words directly, the whole sequence is processed in parallel, and large-scale self-supervised pre-training is followed by cheap fine-tuning. Limits: attention cost grows with the square of the length and the models have many parameters.</Note>
        </>
      ),
    },
    {
      id: "tokens", title: "2 · Tokens and embeddings",
      keywords: "tokenizer wordpiece bpe byte pair encoding sentencepiece subword vocabulary oov out of vocabulary cls sep pad unk mask embedding matrix lookup token ids attention mask padding truncation max length token type segment",
      render: () => (
        <>
          <p className="text-sm">Text is split into sub-word units: frequent words stay whole, rare words are split (<code>unwatchable</code> → <code>un</code> <code>##watch</code> <code>##able</code>), so the vocabulary is limited (about 30,000 for BERT; the uncased BERT vocabulary has 30,522 entries) and nothing is ever out of vocabulary. BERT models use <b>WordPiece</b>, RoBERTa uses byte-pair encoding (<b>BPE</b>). Each token id selects one row of the embedding matrix <T>{String.raw`E\in\mathbb{R}^{V\times d}`}</T> (d = 128 for BERT-tiny, 512 for BERT-small, 768 for DistilBERT).</p>
          <Table head={["Item", "Meaning", "Detail"]} rows={[
            ["[CLS]", "Added at the start of every input", "Its final vector represents the whole sentence for classification"],
            ["[SEP]", "Added at the end (and between two segments)", "Separator; also a frequent “attention sink” in the project's attention picture"],
            ["[PAD], attention_mask", "Pad a batch to the same length", "mask = 1 for real tokens, 0 for padding; padding positions are ignored by attention"],
            ["[UNK], [MASK]", "Unknown piece; hidden token in masked-LM pre-training", "WordPiece rarely needs [UNK]"],
            ["Token-type (segment) ids", "BERT marks sentence A / B", "A 2 × d table in BERT; DistilBERT has none (this is why its parameter count differs)"],
            ["max_length", "Truncate long inputs", "The project used 64: it covers 99.99 % of the training sentences and all test sentences (longest test sentence: 55 sub-word tokens)"],
          ]} />
          <Note>Always load the tokenizer that belongs to the checkpoint (<code>AutoTokenizer.from_pretrained(same_name)</code>): a different vocabulary silently feeds the model wrong ids. “Uncased” checkpoints lower-case the text.</Note>
        </>
      ),
    },
    {
      id: "positions", title: "3 · Positional encoding",
      keywords: "position embedding sinusoidal sin cos order permutation invariant learned position 512 rope relative positions word order",
      render: () => (
        <>
          <p className="text-sm">Self-attention alone is permutation-invariant: it treats a sentence as a bag of tokens. Order is therefore added to the embeddings. The original Transformer used fixed sinusoidal encodings (pos = token position, i = dimension index):</p>
          <TB>{String.raw`PE_{(pos,2i)}=\sin\left(\frac{pos}{10000^{2i/d}}\right),\quad PE_{(pos,2i+1)}=\cos\left(\frac{pos}{10000^{2i/d}}\right)`}</TB>
          <p className="text-sm">BERT-type models instead <b>learn</b> one position vector per position, up to 512. The first layer receives the sum of the two:</p>
          <TB>{String.raw`h^{(0)}_t=E(w_t)+P(t)`}</TB>
          <Sub>Computed example, d = 4 (even columns sin, odd columns cos)</Sub>
          <Table head={["pos", "dim 0 (sin, i=0)", "dim 1 (cos, i=0)", "dim 2 (sin, i=1)", "dim 3 (cos, i=1)"]} rows={[0, 1, 2, 3].map((pos) => [String(pos), ...[0, 1, 2, 3].map((k) => sinusoidalPE(pos, k, 4).toFixed(3))])} />
          <Note>Low dimensions oscillate fast (period 2π positions), high dimensions slowly (the wavelength grows to 10000·2π), so every position gets a distinct pattern. Learned tables cannot go beyond their length (512 for BERT); this is one reason long documents need other models.</Note>
        </>
      ),
    },
    {
      id: "attention", title: "4 · Scaled dot-product attention",
      keywords: "self-attention softmax query key value qkv scaled dot product sqrt dk weights mask causal padding worked example numpy attention weights",
      render: () => (
        <>
          <p className="text-sm">Each token representation is projected into a query <i>q</i>, a key <i>k</i> and a value <i>v</i>. For n tokens, stack them into <T>{String.raw`Q,K,V\in\mathbb{R}^{n\times d_k}`}</T>:</p>
          <TB>{String.raw`Q=HW_Q,\quad K=HW_K,\quad V=HW_V`}</TB>
          <TB>{String.raw`\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\left(\frac{QK^{T}}{\sqrt{d_k}}\right)V`}</TB>
          <TB>{String.raw`\mathrm{softmax}(z)_j=\frac{e^{z_j}}{\sum_k e^{z_k}}`}</TB>
          <p className="text-sm"><T>{String.raw`QK^T`}</T> is an n × n matrix of similarity scores between every pair of tokens; softmax is applied to each row, so the weights are positive and sum to 1; the output of a token is a weighted average of all value vectors, so it can gather information from any other word regardless of distance. Dividing by <T>{String.raw`\sqrt{d_k}`}</T> keeps the dot products from growing with the dimension, which would push softmax into regions with tiny gradients.</p>
          <Sub>Worked example (3 tokens, d_k = 2, Q = K; computed in this page and checked with NumPy)</Sub>
          <div className="grid grid-cols-[minmax(0,1fr)] gap-3 md:grid-cols-2">
            <Code label="Inputs">{`Q = K = [[1, 0],     V = [[1, 0],
         [0, 1],          [0, 2],
         [1, 1]]          [1, 1]]
Q·Kᵀ =\n${mat(att.scores)}`}</Code>
            <Code label="Result">{`scores / √2 =\n${mat(att.scaled)}
softmax per row (weights) =\n${mat(att.weights)}
weights · V (output) =\n${mat(att.out)}`}</Code>
          </div>
          <p className="mt-2 text-sm">Token 3 (query [1, 1]) matches all keys, but most strongly itself ([1, 1]·[1, 1] = 2), so it gives weight 0.503 to itself and 0.248 to each of the others. Its output [0.752, 1.000] is the weighted mix of the three value vectors.</p>
          <Table head={["Mask", "Used in", "How"]} rows={[
            ["Padding mask", "All models, batches with padding", "Add −∞ to the scores of padding keys before softmax → weight 0"],
            ["Causal mask", "Decoders (GPT): predict the next word", "Add −∞ above the diagonal so token t only sees tokens ≤ t"],
          ]} />
          <Note>In the project's task the representation of “good” in “not good” can attend strongly to “not”, which lets the model represent the negated meaning. Attention maps illustrate the information flow but are not a complete explanation of a prediction (Jain &amp; Wallace, 2019); in the last layer many words attend to the comma and [SEP] (“attention sinks”, also seen by Clark et al., 2019).</Note>
        </>
      ),
    },
    {
      id: "multihead", title: "5 · Multi-head attention",
      keywords: "heads multi-head dk d/h concat wo projection head specialisation bertviz parallel attention heads 12 heads 8 heads",
      render: () => (
        <>
          <p className="text-sm">Instead of one attention function the Transformer runs h heads in parallel, each with its own projections of dimension <T>{String.raw`d_k=d/h`}</T>, then concatenates and mixes them with <T>{String.raw`W_O`}</T>:</p>
          <TB>{String.raw`\mathrm{head}_i=\mathrm{Attention}(HW_Q^i,HW_K^i,HW_V^i),\quad \mathrm{MultiHead}(H)=\mathrm{Concat}(\mathrm{head}_1,\ldots,\mathrm{head}_h)W_O`}</TB>
          <Table head={["Model", "d", "Heads h", "d_k = d / h", "Per-layer attention weights"]} rows={MODELS.map((m) => [m.name, String(m.d), String(m.h), String(m.d / m.h), <T key={m.name}>{String.raw`4(d^2+d)=${nf(4 * (m.d * m.d + m.d))}`}</T>])} />
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>The head count does <b>not</b> change the number of parameters: <i>h</i> heads of width d/h cost the same as one head of width d (3d² for Q, K, V plus d² for W_O, plus biases).</li>
            <li>Different heads can specialise (one links adjectives with nouns, another negation words with their scope; Clark et al., 2019), but do not over-interpret single heads.</li>
            <li>Shapes: <T>{String.raw`H:(n,d)\to`}</T> per head <T>{String.raw`Q,K,V:(n,d_k)`}</T>, weights <T>{String.raw`(n,n)`}</T>, head output <T>{String.raw`(n,d_k)`}</T>, concatenation <T>{String.raw`(n,d)`}</T>.</li>
          </ul>
        </>
      ),
    },
    {
      id: "block", title: "6 · The encoder block",
      keywords: "feed-forward ffn gelu relu layer norm layernorm residual connection add norm post-ln pre-ln inner dimension 4d cross entropy classification head cls softmax loss",
      render: () => (
        <>
          <p className="text-sm">After attention, every position goes through the same two-layer feed-forward network independently; both sub-layers are wrapped by a residual connection and layer normalisation:</p>
          <TB>{String.raw`\mathrm{FFN}(x)=\mathrm{GELU}(xW_1+b_1)W_2+b_2`}</TB>
          <TB>{String.raw`H'=\mathrm{LayerNorm}(H+\mathrm{MultiHead}(H)),\quad H''=\mathrm{LayerNorm}(H'+\mathrm{FFN}(H'))`}</TB>
          <TB>{String.raw`\mathrm{LayerNorm}(x)=\gamma\odot\frac{x-\mu}{\sqrt{\sigma^2+\epsilon}}+\beta`}</TB>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li><T>{String.raw`W_1:d\times d_{ff},\ W_2:d_{ff}\times d`}</T>; the inner size is usually 4d (128 → 512, 512 → 2048, 768 → 3072 in the project's models). GELU (Gaussian error linear unit) is BERT's activation; the original Transformer used ReLU.</li>
            <li>μ and σ² are the mean and variance of the vector x (over its d features, per token); γ and β are learned.</li>
            <li>Residual connections let gradients flow through deep stacks; normalisation stabilises training.</li>
            <li>The formulas above put the norm <i>after</i> the sum (post-LN, as in the original and in BERT). Many later models normalise <i>before</i> each sub-layer (pre-LN).</li>
          </ul>
          <Sub>Classification head and loss (fine-tuning)</Sub>
          <TB>{String.raw`P(y\mid x)=\mathrm{softmax}(Wh_{CLS}+b),\ W\in\mathbb{R}^{2\times d}\qquad L_{CE}=-\frac{1}{N}\sum_{i=1}^{N}\log P(y_i\mid x_i)`}</TB>
          <p className="text-sm">All parameters (the pre-trained encoder and the new layer) are trained together. In Hugging Face the cross-entropy loss is computed inside the model when <code>labels</code> are passed.</p>
        </>
      ),
    },
    {
      id: "params", title: "7 · Shapes and parameter counts",
      keywords: "parameters count calculator size million bert-tiny bert-small distilbert bert-base memory megabytes embedding matrix vocabulary hidden size layers ff intermediate 4386178 28764674 66955010 numel",
      render: () => {
        const rows = MODELS.map((m) => ({ m, p: transformerParams({ vocab: 30522, d: m.d, layers: m.L, ff: m.ff, typeVocab: m.typeVocab }) }));
        const base = transformerParams({ vocab: 30522, d: 768, layers: 12, ff: 3072, classes: 0 });
        return (
          <>
            <p className="text-sm">Counting parameters is bookkeeping. With vocabulary V, hidden size d, L layers, FFN size <i>f</i>, P = 512 positions, T token types and C classes:</p>
            <TB>{String.raw`\underbrace{(V+P+T)\,d+2d}_{\text{embeddings}}+L\Big[\underbrace{4(d^2+d)}_{\text{attention}}+\underbrace{2df+f+d}_{\text{FFN}}+\underbrace{4d}_{\text{2 layer norms}}\Big]+\underbrace{(d^2+d)}_{\text{pooler / pre-classifier}}+\underbrace{dC+C}_{\text{classifier}}`}</TB>
            <Table wide head={["Model", "d / L / h / f", "Embeddings", "Layers", "Head", "Total", "MB (32 bit)"]} rows={rows.map(({ m, p }) => [
              m.name, `${m.d} / ${m.L} / ${m.h} / ${m.ff}`, nf(p.embeddings), nf(p.layersTotal), nf(p.head), <b key={m.name}>{nf(p.total)}</b>, megabytes32(p.total).toFixed(1),
            ])} />
            <p className="mt-2 text-sm">These three totals are the real sizes of the project's fine-tuned models (<b>4,386,178</b>, <b>28,764,674</b>, <b>66,955,010</b>; V = 30,522, 2-class head; DistilBERT has no token-type table), and the calculator reproduces them exactly (unit-tested). The same formula gives <b>{nf(base.total)}</b> for the BERT-base encoder with its pooler (the published 110 M). In BERT-tiny the embedding matrix alone is {Math.round((100 * rows[0].p.embeddings) / rows[0].p.total)} % of all parameters.</p>
            <div className="mt-4"><ParamCalculator /></div>
            <Note>Memory of the weights = 4 bytes × parameters at 32 bit (4.4 M → 17.5 MB, 124.6 M → 498.6 MB). Training needs several times more (gradients and two AdamW moment vectors per parameter, plus activations). The TF-IDF “parameters” in the project are n-gram weights (73,556 for logistic regression), not a neural network.</Note>
          </>
        );
      },
    },
    {
      id: "complexity", title: "8 · Complexity",
      keywords: "complexity quadratic n squared o(n^2) sequential steps parallel rnn long sequences efficient transformers longformer max length 64 512 memory attention matrix",
      render: () => (
        <>
          <Table head={["Layer type", "Operations per layer", "Sequential steps", "Longest path between two tokens"]} rows={[
            ["Self-attention", <T key="a">{String.raw`O(n^2\cdot d)`}</T>, <T key="b">{String.raw`O(1)`}</T>, <T key="c">{String.raw`O(1)`}</T>],
            ["Recurrent (RNN, LSTM, GRU)", <T key="d">{String.raw`O(n\cdot d^2)`}</T>, <T key="e">{String.raw`O(n)`}</T>, <T key="f">{String.raw`O(n)`}</T>],
          ]} />
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>The ratio of the two operation counts is n / d. For sentences (n &lt; d) self-attention is both cheaper and better at long-range dependencies, and all n positions run in parallel while a recurrent network needs n sequential steps.</li>
            <li>For long documents the n × n attention matrix (per head!) dominates time and memory. “Efficient Transformers” (Tay et al., 2022) reduce it; BERT-type models stop at 512 positions.</li>
            <li>The project used maximum length 64 (batches are padded dynamically to the longest sentence in the batch), so attention was never the bottleneck: the feed-forward layers and projections (about 12·n·d² per layer for f = 4d) were.</li>
          </ul>
          <div className="mt-4"><AttentionCostCalculator /></div>
        </>
      ),
    },
    {
      id: "objectives", title: "9 · Pre-training objectives",
      keywords: "masked language model mlm 15% 80/10/10 replaced token detection electra causal language model gpt next token prediction text-to-text t5 bart denoising distillation knowledge distillation teacher student self-supervised nsp next sentence prediction",
      render: () => (
        <>
          <TB>{String.raw`L_{MLM}=-\sum_{t\in M}\log P(w_t\mid x_{\setminus M})`}</TB>
          <p className="text-sm"><b>Masked language modelling (BERT).</b> A random 15 % of the input tokens are selected (the set M); the model predicts the original tokens from the context on <i>both</i> sides, giving deep bidirectional representations. In the BERT paper (Devlin et al., 2019) a selected token is replaced by [MASK] 80 % of the time, by a random token 10 % and left unchanged 10 % (the 80/10/10 rule; the project paper only says “most are replaced by [MASK]”).</p>
          <Table head={["Objective", "Idea", "Used by"]} rows={[
            ["Masked LM", "Predict hidden tokens from both sides", "BERT, RoBERTa, DistilBERT (RoBERTa drops next-sentence prediction)"],
            ["Replaced-token detection", "A small generator replaces tokens; the model labels every token original / replaced (more sample-efficient)", "ELECTRA"],
            ["Causal LM", <><T>{String.raw`-\sum_t\log P(w_t\mid w_{<t})`}</T>: predict the next token from the left context</>, "GPT, GPT-3"],
            ["Text-to-text / denoising", "Every task becomes “text in, text out”; corrupt text and reconstruct it", "T5, BART"],
            ["Knowledge distillation", "A small student is trained to imitate the output distribution of a large teacher (BERT-base)", "DistilBERT"],
          ]} />
          <Note>Pre-training is extremely expensive (days on many GPUs or TPUs), so the project only downloaded released weights and fine-tuned them. GPT-3 (175 billion parameters) can perform new tasks from instructions and a few examples in the prompt (in-context learning) without any fine-tuning.</Note>
        </>
      ),
    },
    {
      id: "families", title: "10 · Model families",
      keywords: "bert roberta albert electra deberta xlm-roberta distilbert gpt gpt-3 t5 bart tiny small base large 110m 340m 175b 97% compact models turc superglue glue models comparison",
      render: () => (
        <>
          <Table wide head={["Model", "Type", "Key idea", "Size / claim (as stated in the project paper)"]} rows={[
            ["BERT", "Encoder", "Masked LM pre-training, fine-tune per task", "Base 110 M, large 340 M parameters; SST-2 test 93.5 % (base) / 94.9 % (large)"],
            ["RoBERTa", "Encoder", "BERT was under-trained: longer, more data, larger batches, no next-sentence task", "SST-2 96.4 % (RoBERTa-large, GLUE test)"],
            ["ALBERT", "Encoder", "Factorised embeddings and cross-layer parameter sharing", "Far fewer parameters than BERT"],
            ["ELECTRA", "Encoder", "Replaced-token detection instead of masked LM", "More sample-efficient"],
            ["DeBERTa", "Encoder", "Separates content and position information in attention", "First to exceed the human baseline on SuperGLUE"],
            ["XLM-RoBERTa", "Encoder", "RoBERTa approach on 100 languages", "Includes Lithuanian"],
            ["DistilBERT", "Encoder", "6-layer student distilled from 12-layer BERT", "40 % smaller, 60 % faster, about 97 % of BERT's language understanding"],
            ["BERT compact models", "Encoder", "24 models from BERT-tiny (2 layers, d = 128) to BERT-base (Turc et al., 2019)", "Pre-training compact models directly matters"],
            ["GPT, GPT-3", "Decoder", "Left-to-right language model; prompting", "GPT-3: 175 billion parameters, in-context learning"],
            ["T5", "Encoder–decoder", "Every task as text-to-text", "Largest T5: 97.5 % SST-2 (GLUE test)"],
            ["BART", "Encoder–decoder", "Denoising autoencoder", "Strong for summarisation and translation"],
          ]} />
          <Sub>Where SST-2 accuracy sits (literature quoted in the project paper)</Sub>
          <Table head={["Approach", "SST-2 accuracy"]} rows={[
            ["Bag-of-words / TF-IDF + linear classifier", "about 79–83 %"],
            ["Recurrent and convolutional networks", "84–88 %"],
            ["Fine-tuned Transformers", "above 90 % (BERT-base 93.5 %, RoBERTa-large 96.4 %, largest T5 97.5 %, GLUE test set)"],
          ]} />
        </>
      ),
    },
    {
      id: "finetune", title: "11 · Fine-tuning recipe",
      keywords: "fine-tuning finetune hyperparameters learning rate batch size epochs warm-up weight decay dev set best epoch dynamic padding seed 42 table 5 recipe steps per epoch bert-tiny bert-small distilbert 8000 sentences",
      render: () => (
        <>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            <li>Load the pre-trained encoder and its tokenizer by name; add a fresh 2-class head (<code>num_labels=2</code>).</li>
            <li>Tokenise with <code>truncation</code> to max length 64 and pad each batch dynamically to its longest sentence.</li>
            <li>Train <b>all</b> parameters with AdamW, 10 % linear warm-up then linear decay to 0, weight decay 0.01, gradient clipping 1.0.</li>
            <li>After every epoch measure accuracy on the dev set; keep the best epoch&apos;s weights.</li>
            <li>Touch the test set exactly once at the end. Fix the seed (42 in the project).</li>
          </ol>
          <Sub>Hyper-parameters used in the project (Table 5 of the paper)</Sub>
          <Table wide head={["Hyper-parameter", "BERT-tiny", "BERT-small", "DistilBERT"]} rows={[
            ["Layers / hidden size / heads", "2 / 128 / 2", "4 / 512 / 8", "6 / 768 / 12"],
            ["Training examples", "8,000", "8,000", "8,000"],
            ["Epochs (best epoch kept by dev accuracy)", "3", "3", "2"],
            ["Peak learning rate", "2·10⁻⁴", "1·10⁻⁴", "5·10⁻⁵"],
            ["Batch size / maximum length", "32 / 64", "32 / 64", "32 / 64"],
            ["Warm-up / schedule", "10 % / linear", "10 % / linear", "10 % / linear"],
            ["Weight decay / gradient clipping", "0.01 / 1.0", "0.01 / 1.0", "0.01 / 1.0"],
            ["Steps per epoch (8,000 / 32)", String(stepsPerEpoch(8000, 32)), String(stepsPerEpoch(8000, 32)), String(stepsPerEpoch(8000, 32))],
            ["Total steps / warm-up steps", ...MODELS.map((m) => `${m.epochs * 250} / ${Math.ceil(0.1 * m.epochs * 250)}`)],
            ["Checkpoint", ...MODELS.map((m) => m.id)],
          ]} />
          <p className="mt-2 text-sm">The hyper-parameters follow Devlin et al. (2019) and Sun et al. (2019), with a higher learning rate for the smallest models, which is usual for compact BERT variants. They were fixed in advance and <b>not</b> tuned on the test set. Sun et al. (2019): learning rate, layer-wise learning rates and further in-domain pre-training strongly influence the result.</p>
          <Note>Small data needs few epochs: the larger the model and the smaller the data, the faster it overfits. Selecting the epoch on a separate dev set (2,000 sentences in the project, stratified) is what protects the test result.</Note>
        </>
      ),
    },
    {
      id: "optimizer", title: "12 · AdamW, warm-up and clipping",
      keywords: "adamw adam optimizer decoupled weight decay learning rate schedule warm-up linear decay gradient clipping clip norm beta epsilon moment bias correction scheduler get_linear_schedule_with_warmup",
      render: () => {
        const total = 750, peak = 1e-4;
        const steps = [0, 25, 50, 75, 150, 375, 600, 750];
        return (
          <>
            <TB>{String.raw`m_t=\beta_1m_{t-1}+(1-\beta_1)g_t,\quad v_t=\beta_2v_{t-1}+(1-\beta_2)g_t^2`}</TB>
            <TB>{String.raw`\theta_t=\theta_{t-1}-\eta_t\left(\frac{\hat m_t}{\sqrt{\hat v_t}+\epsilon}+\lambda\theta_{t-1}\right)`}</TB>
            <p className="text-sm"><T>{String.raw`\hat m_t,\hat v_t`}</T> are bias-corrected moments (<T>{String.raw`\hat m_t=m_t/(1-\beta_1^t)`}</T>), λ = 0.01 is the weight decay (applied directly to the weights, <i>decoupled</i> from the gradient: that is what makes it AdamW), <T>{String.raw`\eta_t`}</T> the learning rate. PyTorch defaults: β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸.</p>
            <TB>{String.raw`\eta_t=\begin{cases}\eta_{\max}\,t/t_w & t<t_w\\[2pt] \eta_{\max}\,(T-t)/(T-t_w) & t\ge t_w\end{cases}\qquad t_w=\lceil 0.1\,T\rceil`}</TB>
            <p className="text-sm">Warm-up prevents large, destructive updates of the pre-trained weights at the start. <b>Gradient clipping</b> rescales the whole gradient when its norm exceeds 1.0: <T>{String.raw`g\leftarrow g\cdot\min(1,\,1/\lVert g\rVert)`}</T>.</p>
            <Sub>Computed schedule: BERT-small, 3 epochs × 250 steps = {total} steps, peak 1·10⁻⁴, warm-up {Math.ceil(0.1 * total)} steps</Sub>
            <Table head={["Step t", "Phase", "Learning rate η_t"]} rows={steps.map((s) => [String(s), s < 75 ? "warm-up" : s === total ? "end" : "decay", linearWarmupLR(s, total, peak).toExponential(2)])} />
          </>
        );
      },
    },
    {
      id: "cost", title: "13 · Cost on a CPU (measured)",
      keywords: "cost training time latency inference speed model size megabytes cpu laptop gpu throughput sentences per second ms per sentence parameters tf-idf bilstm distilbert measured summary table energy",
      render: () => (
        <>
          <p className="text-sm">Measured in the project (SST-2, CPU laptop: Intel Core i5-8365U, 4 cores, 16 GB, no GPU; latency = test-set prediction time / 872 sentences, batches of 32). The longest training runs shared the laptop with other work, so read training times as upper bounds.</p>
          <Table wide head={["Model", "Parameters", "MB (32 bit)", "Train time", "Latency ms / sentence", "Sentences / s", "Accuracy %"]} rows={[...MEASURED].sort((a, b) => a.latMs - b.latMs).map((m) => [
            m.name,
            nf(m.params),
            m.family === "classical" ? "n-gram weights" : megabytes32(m.params).toFixed(1),
            m.trainS > 0 ? fmtTime(m.trainS) : m.family === "ready-made" || m.family === "zero-shot" ? "none (ready-made)" : "–",
            m.latMs.toFixed(m.latMs < 1 ? 3 : 1),
            nf(Math.round(sentencesPerSecond(m.latMs))),
            m.acc.toFixed(1),
          ])} />
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
            <li>TF-IDF models: about 0.05 ms per sentence and 2–4 s to train on all 65 thousand sentences. BiLSTM: 0.45 ms and 6 minutes.</li>
            <li>Fine-tuned Transformers: BERT-tiny 1.2 ms (2 min training), BERT-small 14 ms (26 min), DistilBERT 39 ms (about 2.6 h; 8,000 sentences, 2–3 epochs). Ready-made larger models 45–107 ms. DistilBERT handles about 25 sentences per second: enough for interactive use, not for very high-volume streams.</li>
            <li>The zero-shot NLI model is the slowest because it processes every sentence once per candidate label.</li>
            <li>Transformers were 20–2,000 times slower at inference and 60–1,700 times larger than the TF-IDF models. On a GPU, training would be one to two orders of magnitude shorter, while the classical models would gain little.</li>
          </ul>
          <div className="mt-4"><LatencyCalculator /></div>
        </>
      ),
    },
    {
      id: "evaluation", title: "14 · Evaluating honestly",
      keywords: "evaluation bootstrap confidence interval 2000 resamples mcnemar exact binomial significance p value paired test 872 sentences one point nine sentences negation contrast subsets learning curve data efficiency error analysis seeds threats to validity",
      render: () => (
        <>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            <li><b>Test set size matters.</b> 872 sentences: one percentage point ≈ 9 sentences. 95 % bootstrap intervals are about ± 2.5 points wide.</li>
            <li><b>Bootstrap CI:</b> resample the test set with replacement 2,000 times, compute accuracy for each resample, take the 2.5th and 97.5th percentiles.</li>
            <li><b>McNemar (exact):</b> b = sentences only model A classifies correctly, c = only model B. Under the null of equal accuracy b ~ Binomial(b + c, 0.5); two-sided, significance level 0.05.</li>
            <li>Each configuration was trained once with one seed, so differences below about one point may be random variation; repeat with several seeds for firm claims.</li>
          </ul>
          <Sub>Measured in the project (SST-2, 872 test sentences): intervals and McNemar against the best model (DistilBERT-SST2)</Sub>
          <Table wide head={["Model", "Accuracy %", "95 % CI", "b (only best)", "c (only model)", "p, recomputed"]} rows={[...MEASURED].reverse().map((m) => [
            m.name, m.acc.toFixed(1), `${m.ciLow.toFixed(1)} – ${m.ciHigh.toFixed(1)}`, String(m.bBest), String(m.cModel), m.bBest + m.cModel === 0 ? "(the best model)" : fmtP(mcnemarExact(m.bBest, m.cModel)),
          ])} />
          <p className="mt-2 text-sm">Fine-tuned DistilBERT (trained on 8 times less data) is still significantly worse than the best model (p = 0.029) but significantly better than the best classical model, TF-IDF + linear SVM: it is right on 104 sentences where the SVM is wrong and wrong on 53 where the SVM is right (p &lt; 0.001). BERT-small vs the SVM (71 vs 64, p = 0.61), the BiLSTM vs the SVM (p = 1.0) and zero-shot vs logistic regression (p = 1.0) are <b>not</b> significant.</p>
          <Sub>Data efficiency (same random subsets, accuracy %)</Sub>
          <Table head={["Labelled sentences", "BERT-small fine-tuned", "TF-IDF + logistic regression", "Gap (points)"]} rows={LEARNING_CURVE.map((r) => [nf(r.n), r.bert.toFixed(1), r.tfidf.toFixed(1), (r.bert - r.tfidf).toFixed(1)])} />
          <p className="mt-2 text-sm">BERT-small on 4,000 sentences (82.7 %) already matches the best classical model trained on all 65,349 (82.9 %): the same quality with about 16 times less labelled data.</p>
          <Sub>Hard sentences: negation (184 test sentences) and contrast (130)</Sub>
          <Table wide head={["Model", "All %", "Negation %", "Contrast %", "Drop on negation (points)"]} rows={[...MEASURED].reverse().map((m) => [m.name, m.acc.toFixed(1), m.neg.toFixed(1), m.con.toFixed(1), (m.acc - m.neg).toFixed(1)])} />
          <p className="mt-2 text-sm">Bag-of-words models lose 8–9 points on negation (“not good” contains “good”); large Transformers lose 2–4; compact ones (BERT-small, BERT-tiny) behave like the classical models. The subsets are defined by keyword rules (negation words and contrast markers such as <i>but, although, though, yet, however</i>), which catch most but not all such constructions.</p>
          <div className="mt-4"><McNemarCalculator /></div>
        </>
      ),
    },
    {
      id: "hf-code", title: "15 · Hugging Face quick reference",
      keywords: "hugging face transformers pipeline autotokenizer automodelforsequenceclassification trainer training arguments dataloader zero-shot classification hypothesis template output_attentions torch no_grad cpu threads save_pretrained code snippet python from_pretrained num_labels",
      render: () => (
        <>
          <Sub>Ready-made model in three lines</Sub>
          <Code>{`from transformers import pipeline
clf = pipeline("sentiment-analysis",
               model="distilbert-base-uncased-finetuned-sst-2-english", device=-1)  # -1 = CPU
clf(["a gorgeous, witty film", "not good at all"], batch_size=32, truncation=True)
# [{'label': 'POSITIVE', 'score': ...}, {'label': 'NEGATIVE', 'score': ...}]`}</Code>
          <Sub>Tokenizer + model by hand</Sub>
          <Code>{`import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification
name = "distilbert-base-uncased"
tok = AutoTokenizer.from_pretrained(name)
model = AutoModelForSequenceClassification.from_pretrained(name, num_labels=2)  # new random head
enc = tok(["the plot was not good, but the acting was brilliant"],
          truncation=True, max_length=64, padding=True, return_tensors="pt")
print(tok.convert_ids_to_tokens(enc["input_ids"][0]))     # [CLS] ... [SEP]
model.eval()
with torch.no_grad():
    logits = model(**enc).logits                            # shape (batch, 2)
probs = logits.softmax(-1)
print(sum(p.numel() for p in model.parameters()))           # 66,955,010`}</Code>
          <Sub>Manual fine-tuning loop (the project&apos;s recipe)</Sub>
          <Code>{`import math, torch
from torch.utils.data import DataLoader
from transformers import get_linear_schedule_with_warmup
# pairs = list of (sentence, label); collate pads each batch to its longest sentence
def collate(batch):
    enc = tok([b[0] for b in batch], truncation=True, max_length=64, padding=True, return_tensors="pt")
    enc["labels"] = torch.tensor([b[1] for b in batch])
    return enc
dl = DataLoader(pairs, batch_size=32, shuffle=True, collate_fn=collate)
epochs = 2
steps = epochs * len(dl)
opt = torch.optim.AdamW(model.parameters(), lr=5e-5, weight_decay=0.01)
sched = get_linear_schedule_with_warmup(opt, num_warmup_steps=math.ceil(0.1 * steps), num_training_steps=steps)
model.train()
for epoch in range(epochs):
    for batch in dl:
        loss = model(**batch).loss          # cross-entropy is computed inside the model
        loss.backward()
        torch.nn.utils.clip_grad_norm_(model.parameters(), 1.0)
        opt.step(); sched.step(); opt.zero_grad()
    # evaluate on the dev set here; keep the state_dict of the best epoch`}</Code>
          <Sub>Trainer instead of a manual loop</Sub>
          <Code>{`from transformers import Trainer, TrainingArguments, DataCollatorWithPadding
args = TrainingArguments(output_dir="out", num_train_epochs=2, learning_rate=5e-5,
                         per_device_train_batch_size=32, weight_decay=0.01,
                         warmup_ratio=0.1, lr_scheduler_type="linear", max_grad_norm=1.0,
                         eval_strategy="epoch", save_strategy="epoch",
                         load_best_model_at_end=True, seed=42)
# eval_strategy was called evaluation_strategy in older versions
trainer = Trainer(model=model, args=args, train_dataset=train_ds, eval_dataset=dev_ds,
                  data_collator=DataCollatorWithPadding(tok))  # train_ds already tokenised
trainer.train()`}</Code>
          <Sub>Zero-shot classification with the project&apos;s hypothesis template</Sub>
          <Code>{`zs = pipeline("zero-shot-classification", model="cross-encoder/nli-distilroberta-base", device=-1)
out = zs(texts, candidate_labels=["positive", "negative"],
         hypothesis_template="The sentiment of this movie review is {}.", batch_size=32)
pred = [int(o["labels"][0] == "positive") for o in out]   # labels sorted by entailment score`}</Code>
          <Sub>Attention weights and saving</Sub>
          <Code>{`out = model(**enc, output_attentions=True)
att = out.attentions            # tuple of L tensors, each (batch, heads, n, n)
model.save_pretrained("my-model"); tok.save_pretrained("my-model")`}</Code>
          <Note>CPU-only advice: a distilled model (DistilBERT) is the practical ceiling for fine-tuning on a laptop (about 2.6 h for 8,000 sentences, 2 epochs); use max length 64, batch size 32, dynamic padding, <code>torch.no_grad()</code> and <code>model.eval()</code> at inference, run models one after another when you time them, and make sure the tokenizer matches the checkpoint. Project requirements: torch ≥ 2.2, transformers ≥ 4.40, datasets ≥ 2.18, scikit-learn ≥ 1.4 (SST-2 loads as <code>nyu-mll/glue</code>, config <code>sst2</code>).</Note>
        </>
      ),
    },
    {
      id: "pitfalls", title: "16 · Pitfalls and quick diagnosis",
      keywords: "pitfalls debugging diagnosis loss not decreasing accuracy 50% chance overfitting tokenizer mismatch label mapping eval mode seed variance test set leakage truncation padding learning rate too high warm-up out of memory slow cpu off-the-shelf neutral label",
      render: () => (
        <Table wide head={["Symptom", "Likely cause", "What to try"]} rows={[
          ["Loss does not decrease / accuracy stuck near 50 %", "Learning rate too high for a pre-trained model, no warm-up, wrong labels, wrong num_labels", "Use 1e-5 … 2e-4 depending on size, 10 % warm-up, check a batch by hand (tokens and label), call model.train()"],
          ["Good dev accuracy, much worse test accuracy", "Distribution shift (the project: training phrases 9.4 words on average, test sentences 19.5) or tuning on the test set", "Check length and style of both splits; choose epochs and settings on dev only; touch the test set once"],
          ["Random-looking predictions from a loaded checkpoint", "Tokenizer does not belong to the model, or the classification head is new and untrained", "Load tokenizer and model from the same name; a fresh head needs fine-tuning"],
          ["Results change between runs", "One seed, small test set (1 point ≈ 9 sentences)", "Fix seeds, repeat with several seeds, report bootstrap CI and McNemar instead of single points"],
          ["Tiny model barely beats (or loses to) TF-IDF", "Capacity: BERT-tiny 76.6 %, BERT-small 83.7 % vs SVM 82.9 % in the project", "Use a distilled or larger model; a Transformer is not automatically better"],
          ["Overfits after the first epoch", "Small data, large model, long schedule", "Fewer epochs, keep the best epoch by dev accuracy, lower learning rate"],
          ["Off-the-shelf model predicts a label you did not expect", "Different label set or domain (Twitter-RoBERTa has a neutral class; the project compared positive vs negative scores only)", "Read the model card, map labels explicitly, test on a few of your own sentences"],
          ["Long inputs cut or crash", "max_length 64 / 512 limit", "Check the length distribution (the project: 99.99 % of sentences ≤ 64 tokens); chunk long documents"],
          ["Training far too slow", "CPU-only, big model, no dynamic padding", "Distilled model, shorter max length, dynamic padding; expect hours, not minutes, for DistilBERT"],
          ["Timings that do not add up", "Other programs running during the measurement", "Run models one after another on an idle machine; treat busy-machine times as upper bounds"],
          ["Impressive attention picture used as proof", "Attention is not an explanation", "Use it to illustrate information flow only (Jain & Wallace, 2019)"],
        ]} />
      ),
    },
    {
      id: "glossary", title: "17 · Glossary",
      keywords: "glossary acronyms abbreviations adamw bert bilstm ci cls cpu gpu gpt llm mlm nb nli nlp rnn sst-2 svm tf-idf ffn gelu logit softmax token embedding head fine-tuning zero-shot distillation definitions",
      render: () => (
        <Table head={["Term", "Meaning"]} rows={[
          ["AdamW", "Adam optimiser with decoupled weight decay"],
          ["BERT", "Bidirectional Encoder Representations from Transformers"],
          ["BiLSTM", "Bidirectional long short-term memory network (one LSTM left-to-right, one right-to-left)"],
          ["CI", "Confidence interval (here: 95 % bootstrap interval of accuracy)"],
          ["CLS", "Special classification token of BERT-type models; its final vector represents the sentence"],
          ["CPU / GPU", "Central / graphics processing unit"],
          ["GPT", "Generative Pre-trained Transformer (decoder-only, left-to-right language model)"],
          ["LLM", "Large language model"],
          ["MLM", "Masked language modelling (pre-training objective of BERT)"],
          ["NB", "Naive Bayes"],
          ["NLI", "Natural language inference: does the premise entail, contradict or stay neutral to the hypothesis?"],
          ["NLP", "Natural language processing"],
          ["RNN", "Recurrent neural network"],
          ["SST-2", "Stanford Sentiment Treebank, binary version (movie-review sentences, part of GLUE)"],
          ["SVM", "Support vector machine"],
          ["TF-IDF", "Term frequency – inverse document frequency"],
          ["d, d_k, h, L, n", "Hidden size, per-head size (d / h), number of heads, number of layers, sequence length"],
          ["Logit", "Raw, unnormalised score of a class before softmax"],
          ["Fine-tuning", "Continuing the training of a pre-trained model on the labelled task data"],
          ["Zero-shot", "Classifying without any task-specific labelled example (here through NLI)"],
          ["Distillation", "Training a small student to imitate a large teacher"],
          ["Sub-word", "Piece of a word produced by WordPiece / BPE"],
        ]} />
      ),
    },
  ],
};
