import { Link } from "react-router-dom";
import { Callout, col, Concept, Demo, Grid } from "../../ui";

export default function Network() {
  const mut = { fill: col("muted") };
  const stroke = (c: string) => ({ stroke: col(c), fill: col("raised") });
  return (
    <div className="space-y-4">
      <Concept term="neuron &amp; network">
        a neuron multiplies each input by a <b>weight</b>, adds a <b>bias</b>, and squashes the sum with an <b>activation</b>. A network is neurons wired in layers. Our network is 2 → 2 → 1.
      </Concept>
      <Demo title="The 2-2-1 network used in Task 5">
        <svg viewBox="0 0 760 300" className="w-full" role="img" aria-label="Network with 2 inputs, 2 hidden sigmoid neurons and 1 output">
          <g strokeWidth="1.6" fill="none" style={{ stroke: col("muted") }}>
            <line x1="150" y1="90" x2="380" y2="90" /><line x1="150" y1="90" x2="380" y2="210" />
            <line x1="150" y1="210" x2="380" y2="90" /><line x1="150" y1="210" x2="380" y2="210" />
            <line x1="380" y1="90" x2="600" y2="150" /><line x1="380" y1="210" x2="600" y2="150" />
            <line x1="150" y1="270" x2="380" y2="90" strokeDasharray="4 4" /><line x1="150" y1="270" x2="380" y2="210" strokeDasharray="4 4" />
            <line x1="380" y1="270" x2="600" y2="150" strokeDasharray="4 4" />
          </g>
          <g strokeWidth="2">
            <circle cx="150" cy="90" r="30" style={stroke("c-teal")} /><circle cx="150" cy="210" r="30" style={stroke("c-teal")} />
            <circle cx="150" cy="270" r="18" style={stroke("c-amber")} /><circle cx="380" cy="270" r="18" style={stroke("c-amber")} />
            <circle cx="380" cy="90" r="34" style={stroke("brand")} /><circle cx="380" cy="210" r="34" style={stroke("brand")} />
            <circle cx="600" cy="150" r="38" style={{ fill: col("brand"), stroke: col("brand") }} />
          </g>
          <g textAnchor="middle" fontSize="14" style={{ fill: col("ink") }}>
            <text x="150" y="86" fontWeight="700">height</text><text x="150" y="104" fontSize="12" style={mut}>scaled 0-1</text>
            <text x="150" y="206" fontWeight="700">weight</text><text x="150" y="224" fontSize="12" style={mut}>scaled 0-1</text>
            <text x="150" y="275" fontSize="13">1</text><text x="380" y="275" fontSize="13">1</text>
            <text x="380" y="88" fontWeight="700">h1</text><text x="380" y="106" fontSize="12" style={mut}>sigmoid</text>
            <text x="380" y="208" fontWeight="700">h2</text><text x="380" y="226" fontSize="12" style={mut}>sigmoid</text>
            <text x="600" y="146" fontWeight="700" fill="#fff">out</text><text x="600" y="164" fontSize="12" fill="#fff">sigmoid</text>
            <text x="150" y="30" style={mut}>INPUTS</text><text x="380" y="30" style={mut}>HIDDEN LAYER</text><text x="600" y="30" style={mut}>OUTPUT</text>
            <text x="265" y="140" fontSize="12" style={mut}>w (random start)</text><text x="500" y="244" fontSize="12" style={mut}>bias input = 1 (dashed)</text>
          </g>
          <text x="660" y="104" fontSize="13" style={mut}>near 0 → female</text>
          <text x="660" y="204" fontSize="13" style={mut}>near 1 → male</text>
        </svg>
        <p className="text-sm text-muted">
          Total parameters to learn: 4 + 2 (hidden bias) + 2 + 1 (output bias) = <b className="text-ink">9 numbers</b>. MNIST's big model later has 575 050, but the idea is identical.
        </p>
      </Demo>
      <Grid>
        <Demo title="Forward pass (making a guess)">
          <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-[13px] leading-relaxed">{`h1 = sigmoid(w1·height + w2·weight + b1·1)
h2 = sigmoid(w3·height + w4·weight + b2·1)
out = sigmoid(w5·h1 + w6·h2 + b3·1)`}</pre>
          <p className="mt-2 text-sm text-muted">Sigmoid squeezes any number into 0…1, so the output can be read as “probability of male”.</p>
        </Demo>
        <Demo title="Backward pass (learning from the error)">
          <pre className="overflow-x-auto rounded-xl border border-line bg-raised p-3 font-mono text-[13px] leading-relaxed">{`error  = out − truth
d_out  = error · out·(1−out)
d_hid  = d_out · w_out · h·(1−h)
weight −= lr · d · (its input)`}</pre>
          <p className="mt-2 text-sm text-muted">Backpropagation = the chain rule of calculus, passing the blame backwards so each weight knows which way to move.</p>
        </Demo>
      </Grid>
      <Callout title="Go further">
        Want to see a network like this learn on a 2-D problem with a live decision boundary? Open the{" "}
        <Link className="font-semibold text-brand underline" to="/playground">Neural Network Playground</Link>. It uses the same forward and backward passes, vectorised in NumPy and trained on the server.
      </Callout>
    </div>
  );
}
