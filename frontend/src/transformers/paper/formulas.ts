/** Formulas (1)–(20) of the paper, numbered as in the paper. LaTeX from the team's repository (paper/build_docx.py). */
export interface Equation { n: number; key: string; tex: string }

const EQ: [string, string][] = [
  ["pe", String.raw`PE_{(pos,2i)}=\sin\left(\frac{pos}{10000^{2i/d}}\right),\quad PE_{(pos,2i+1)}=\cos\left(\frac{pos}{10000^{2i/d}}\right)`],
  ["qkv", String.raw`Q=HW_{Q},\quad K=HW_{K},\quad V=HW_{V}`],
  ["attn", String.raw`\mathrm{Attention}(Q,K,V)=\mathrm{softmax}\left(\frac{QK^{T}}{\sqrt{d_{k}}}\right)V`],
  ["softmax", String.raw`\mathrm{softmax}(z)_{j}=\frac{e^{z_{j}}}{\sum_{k}{e^{z_{k}}}}`],
  ["mha", String.raw`\mathrm{head}_{i}=\mathrm{Attention}(HW_{Q}^{i},HW_{K}^{i},HW_{V}^{i}),\quad \mathrm{MultiHead}(H)=\mathrm{Concat}(\mathrm{head}_{1},\ldots,\mathrm{head}_{h})W_{O}`],
  ["ffn", String.raw`\mathrm{FFN}(x)=\mathrm{GELU}(xW_{1}+b_{1})W_{2}+b_{2}`],
  ["res", String.raw`H'=\mathrm{LayerNorm}(H+\mathrm{MultiHead}(H)),\quad H''=\mathrm{LayerNorm}(H'+\mathrm{FFN}(H'))`],
  ["ln", String.raw`\mathrm{LayerNorm}(x)=\gamma\odot\frac{x-\mu}{\sqrt{\sigma^{2}+\epsilon}}+\beta`],
  ["mlm", String.raw`L_{MLM}=-\sum_{t\in M}{\log P(w_{t}\mid x_{\setminus M})}`],
  ["cls", String.raw`P(y\mid x)=\mathrm{softmax}(Wh_{CLS}+b)`],
  ["ce", String.raw`L_{CE}=-\frac{1}{N}\sum_{i=1}^{N}{\log P(y_{i}\mid x_{i})}`],
  ["adam1", String.raw`m_{t}=\beta_{1}m_{t-1}+(1-\beta_{1})g_{t},\quad v_{t}=\beta_{2}v_{t-1}+(1-\beta_{2})g_{t}^{2}`],
  ["adam2", String.raw`\theta_{t}=\theta_{t-1}-\eta_{t}\left(\frac{\hat{m}_{t}}{\sqrt{\hat{v}_{t}}+\epsilon}+\lambda\theta_{t-1}\right)`],
  ["tfidf", String.raw`\mathrm{tfidf}(t,d)=\left(1+\log\left(\mathrm{tf}(t,d)\right)\right)\cdot\left(\log\frac{1+N}{1+\mathrm{df}(t)}+1\right)`],
  ["svm", String.raw`\min_{w,b}\ \frac{1}{2}\|w\|^{2}+C\sum_{i}{\max\left(0,1-y_{i}(w^{T}x_{i}+b)\right)}`],
  ["lstm1", String.raw`f_{t}=\sigma(W_{f}[h_{t-1},x_{t}]+b_{f}),\quad i_{t}=\sigma(W_{i}[h_{t-1},x_{t}]+b_{i}),\quad o_{t}=\sigma(W_{o}[h_{t-1},x_{t}]+b_{o})`],
  ["lstm2", String.raw`\tilde{c}_{t}=\tanh(W_{c}[h_{t-1},x_{t}]+b_{c}),\quad c_{t}=f_{t}\odot c_{t-1}+i_{t}\odot\tilde{c}_{t},\quad h_{t}=o_{t}\odot\tanh(c_{t})`],
  ["nli", String.raw`\hat{y}=\underset{c\in\{pos,neg\}}{\mathrm{arg\,max}}\,P(\mathrm{entailment}\mid x,h(c))`],
  ["metrics", String.raw`\mathrm{Accuracy}=\frac{TP+TN}{TP+TN+FP+FN},\quad \mathrm{Precision}=\frac{TP}{TP+FP},\quad \mathrm{Recall}=\frac{TP}{TP+FN}`],
  ["f1", String.raw`F_{1}=\frac{2\cdot \mathrm{Precision}\cdot \mathrm{Recall}}{\mathrm{Precision}+\mathrm{Recall}}`],
];

export const EQUATIONS: Equation[] = EQ.map(([key, tex], i) => ({ n: i + 1, key, tex }));
export const eq = (n: number): Equation => EQUATIONS[n - 1];
