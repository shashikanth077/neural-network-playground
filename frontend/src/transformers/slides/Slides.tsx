import { useCallback, type CSSProperties, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useTx } from "../../labs/lab3/rich";
import { Tex } from "../../components/Tex";
import { MODELS } from "../../labs/lab3/data/expModels";
import { FAM_COLOR } from "../../labs/lab3/experiment/shared";
import { Badge, type IconName } from "./icons";
import {
  COST_ROWS, CURVE_LR, CURVE_SMALL, DATA_EFF, FT_TIMES, HEADLINE, RANKING, SLIDES, SLIDE_COUNT, SPLITS, SUBSET_ROWS, TITLE_TILE, TITLE_WORDS,
  FAMILY_ORDER, paperHref, p1, type SlideMeta,
} from "./model";

/** Numbers every slide text may use as {placeholders}. */
export const SLIDE_VARS = { gain: HEADLINE.gain, ft: HEADLINE.ft, svm: HEADLINE.svm, lstm: HEADLINE.lstm, zs: HEADLINE.zs, sst2: HEADLINE.sst2 };

/** Title of slide n in the current language. */
export function useSlideTitle() {
  const tx = useTx();
  return useCallback((n: number) => tx(`ts.s${n}.title`, SLIDE_VARS), [tx]);
}

export type SlideMode = "main" | "print" | "thumb";

const GREEN = "#1bAF7A";
const ORANGE = "#eb6834";
const BLUE = "#2f6fd6";

// ---------------------------------------------------------------------------------------------------- frame
function Footer({ meta, mode }: { meta: SlideMeta; mode: SlideMode }) {
  const tx = useTx();
  const text = tx("ts.ui.readFull");
  const to = paperHref(meta);
  return (
    <footer className="ts-foot">
      <span className="ts-foot-l">Transformers in NLP · VILNIUS TECH</span>
      {mode === "main" ? <Link to={to} className="ts-readfull" data-testid={`ts-link-${meta.n}`}>{text}</Link> : <span className="ts-readfull">{text}</span>}
      <span className="ts-foot-n" aria-hidden>{meta.n}</span>
    </footer>
  );
}

/** One slide: a 16:9 frame whose type scales with its width (container query units). */
export function Slide({ n, mode = "main" }: { n: number; mode?: SlideMode }) {
  const tx = useTx();
  const meta = SLIDES[n - 1];
  const title = tx(`ts.s${n}.title`, SLIDE_VARS);
  const dark = n === 1 || n === 11;
  const cls = `ts-slide ${dark ? "ts-dark" : ""} ts-s${n}`;
  const Body = SLIDE_BODIES[n - 1];
  const body = <Body />;
  if (mode === "thumb") return <div className={cls} aria-hidden data-thumb={n}>{body}<Footer meta={meta} mode={mode} /></div>;
  const label = tx("ts.ui.slideLabel", { n, total: SLIDE_COUNT, title });
  return (
    <section className={cls} data-slide={n} data-print={mode === "print" ? "" : undefined} aria-label={mode === "main" ? label : undefined}>
      {body}
      <Footer meta={meta} mode={mode} />
    </section>
  );
}

const Title = ({ children }: { children: ReactNode }) => <h2 className="ts-title">{children}</h2>;
const Card = ({ tone = "", className = "", children, style }: { tone?: "" | "ok" | "neg" | "pos" | "plain"; className?: string; children: ReactNode; style?: CSSProperties }) => (
  <div className={`ts-card ${tone ? `ts-card-${tone}` : ""} ${className}`} style={style}>{children}</div>
);

function Src({ k }: { k: string }) {
  const tx = useTx();
  return <p className="ts-src">{tx(k)}</p>;
}

// ---------------------------------------------------------------------------------------------------- 1 title
function S1() {
  const tx = useTx();
  return (
    <div className="ts-body ts-cover">
      <div className="ts-cover-l">
        <p className="ts-kicker">{tx("ts.s1.kicker")}</p>
        <h2 className="ts-cover-title">{tx("ts.s1.title")}</h2>
        <p className="ts-cover-sub">{tx("ts.s1.sub")}</p>
        <p className="ts-names">Shashikanth Hosur Ramegowda<br />Shaeed Khan</p>
      </div>
      <figure className="ts-cover-r" role="img" aria-label={tx("ts.s1.tileAlt")}>
        <div className="ts-tile">
          <span />
          {TITLE_WORDS.map((w) => <span key={w} className="ts-tile-w">{w}</span>)}
          {TITLE_TILE.map((row, i) => [
            <span key={`r${i}`} className="ts-tile-w ts-tile-rw">{TITLE_WORDS[i]}</span>,
            ...row.map((a, j) => <span key={`${i}-${j}`} className="ts-tile-c" style={{ background: `rgba(27,175,122,${a / 100})` }} />),
          ])}
        </div>
        <figcaption className="ts-tile-cap">{tx("ts.s1.axis")}</figcaption>
      </figure>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 2 recurrent vs transformer
function Bullets({ keys }: { keys: string[] }) {
  const tx = useTx();
  return <ul className="ts-ul">{keys.map((k) => <li key={k}>{tx(k)}</li>)}</ul>;
}

function S2() {
  const tx = useTx();
  return (
    <div className="ts-body">
      <Title>{tx("ts.s2.title")}</Title>
      <div className="ts-grid ts-cols2 ts-grow">
        <Card>
          <div className="ts-head"><Badge name="hourglass" color={ORANGE} /><h3>{tx("ts.s2.colA")}</h3></div>
          <Bullets keys={["ts.s2.a1", "ts.s2.a2", "ts.s2.a3", "ts.s2.a4"]} />
        </Card>
        <Card tone="ok">
          <div className="ts-head"><Badge name="bolt" color={GREEN} /><h3>{tx("ts.s2.colB")}</h3></div>
          <Bullets keys={["ts.s2.b1", "ts.s2.b2", "ts.s2.b3", "ts.s2.b4"]} />
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 3 self-attention
function Item({ icon, color, h, d }: { icon: IconName; color: string; h: string; d: string }) {
  return (
    <li className="ts-item">
      <Badge name={icon} color={color} />
      <div><b>{h}</b><span>{d}</span></div>
    </li>
  );
}

function S3() {
  const tx = useTx();
  return (
    <div className="ts-body">
      <Title>{tx("ts.s3.title")}</Title>
      <div className="ts-grid ts-split-img ts-grow">
        <figure className="ts-fig ts-fig-tall">
          <img src="/transformers/slides/encoder.png" alt={tx("ts.s3.imgAlt")} width={760} height={907} loading="eager" decoding="async" />
        </figure>
        <div className="ts-col">
          <Card tone="plain" className="ts-formula-card">
            <div className="ts-formula"><Tex>{"\\mathrm{Attention}(Q,K,V)=\\mathrm{softmax}\\!\\left(\\dfrac{QK^{\\top}}{\\sqrt{d_k}}\\right)V"}</Tex></div>
            <p className="ts-cap">{tx("ts.s3.formulaCap")}</p>
          </Card>
          <ul className="ts-items">
            <Item icon="type" color={BLUE} h={tx("ts.s3.h1")} d={tx("ts.s3.d1")} />
            <Item icon="heads" color={GREEN} h={tx("ts.s3.h2")} d={tx("ts.s3.d2")} />
            <Item icon="layers" color="#8647d4" h={tx("ts.s3.h3")} d={tx("ts.s3.d3")} />
            <Item icon="target" color={ORANGE} h={tx("ts.s3.h4")} d={tx("ts.s3.d4")} />
          </ul>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 4 literature
function S4() {
  const tx = useTx();
  const fams: [string, string, string, string, string][] = [
    ["ts.s4.f1", "BERT, RoBERTa, DistilBERT, DeBERTa", "ts.s4.f1u", "pos", BLUE],
    ["ts.s4.f2", "GPT-2/3/4, Llama", "ts.s4.f2u", "ok", GREEN],
    ["ts.s4.f3", "T5, BART", "ts.s4.f3u", "plain", "#8647d4"],
  ];
  return (
    <div className="ts-body">
      <Title>{tx("ts.s4.title")}</Title>
      <div className="ts-grid ts-cols3">
        {fams.map(([k, models, uk, tone, color]) => (
          <Card key={k} tone={tone as "pos"} className="ts-fam" style={{ borderTop: `calc(var(--u) * .35) solid ${color}` }}>
            <h3 style={{ color }}>{tx(k)}</h3>
            <b className="ts-models">{models}</b>
            <span className="ts-muted">{tx(uk)}</span>
          </Card>
        ))}
      </div>
      <div className="ts-grid ts-lit ts-grow">
        <div className="ts-lt">
          <div className="ts-head"><Badge name="pin" color={ORANGE} size={3.4} /><h3>{tx("ts.s4.lt")}</h3></div>
          <Bullets keys={["ts.s4.l1", "ts.s4.l2", "ts.s4.l3", "ts.s4.l4"]} />
        </div>
        <Card tone="neg">
          <div className="ts-head"><Badge name="search" color={ORANGE} size={3.4} /><h3>{tx("ts.s4.gap")}</h3></div>
          <p className="ts-p">{tx("ts.s4.gapText")}</p>
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 5 experiment
function S5() {
  const tx = useTx();
  const stats: [string, string][] = [["SST-2", tx("ts.s5.sstDesc")], [SPLITS, tx("ts.s5.splitsDesc")], ["i5-8365U", tx("ts.s5.cpuDesc")]];
  return (
    <div className="ts-body">
      <Title>{tx("ts.s5.title")}</Title>
      <div className="ts-grid ts-split-5 ts-grow">
        <div className="ts-col">
          {stats.map(([big, d]) => (
            <Card key={big} className="ts-stat">
              <b className="ts-statbig">{big}</b>
              <span className="ts-muted">{d}</span>
            </Card>
          ))}
        </div>
        <div className="ts-col">
          <ul className="ts-items">
            <Item icon="calc" color={BLUE} h={tx("ts.s5.g1")} d={tx("ts.s5.g1d")} />
            <Item icon="repeat" color={ORANGE} h={tx("ts.s5.g2")} d={tx("ts.s5.g2d")} />
            <Item icon="tools" color={GREEN} h={tx("ts.s5.g3")} d="BERT-tiny 4M · BERT-small 29M · DistilBERT 67M" />
            <Item icon="smile" color="#8647d4" h={tx("ts.s5.g4")} d="DistilBERT-SST2 · Twitter-RoBERTa · zero-shot NLI" />
          </ul>
          <p className="ts-criteria">{tx("ts.s5.criteria")}</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 6 pipeline
function S6() {
  const tx = useTx();
  return (
    <div className="ts-body">
      <Title>{tx("ts.s6.title")}</Title>
      <div className="ts-grid ts-split-6 ts-grow">
        <figure className="ts-fig">
          <img src="/transformers/slides/pipeline.png" alt={tx("ts.s6.imgAlt")} width={1200} height={726} loading="eager" decoding="async" />
        </figure>
        <Card>
          <p className="ts-stack">PyTorch · Hugging Face Transformers · scikit-learn</p>
          <Bullets keys={["ts.s6.b1", "ts.s6.b2", "ts.s6.b3", "ts.s6.b4"]} />
        </Card>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 7 headline result
function StatCard({ big, text, color, tone }: { big: string; text: string; color: string; tone: "ok" | "pos" | "" }) {
  return (
    <Card tone={tone} className="ts-stat ts-stat-r">
      <b className="ts-statbig ts-big" style={{ color }}>{big}</b>
      <span className="ts-muted">{text}</span>
    </Card>
  );
}

const TICKS = [60, 70, 80, 90, 100];

function S7() {
  const tx = useTx();
  return (
    <div className="ts-body">
      <Title>{tx("ts.s7.title", SLIDE_VARS)}</Title>
      <div className="ts-grid ts-split-7 ts-grow">
        <div className="ts-chart">
          <ul className="ts-bars" aria-label={tx("ts.s7.chartLabel")}>
            {RANKING.map((m) => (
              <li key={m.tag} className="ts-bar-row">
                <span className="ts-bar-l">{m.name}</span>
                <span className="ts-bar-track" aria-hidden>
                  <span className="ts-bar-fill" style={{ width: `${((m.accuracy * 100 - 60) / 40) * 100}%`, background: FAM_COLOR[m.family] }} />
                </span>
                <span className="ts-bar-v">{p1(m.accuracy)}</span>
              </li>
            ))}
          </ul>
          <div className="ts-bar-row ts-axis" aria-hidden>
            <span />
            <span className="ts-ticks">{TICKS.map((t) => <i key={t}>{t}</i>)}</span>
            <span />
          </div>
          <p className="ts-axis-t">{tx("ts.s7.axis")}</p>
          <Legend />
          <Src k="ts.ui.src.chart" />
        </div>
        <div className="ts-col">
          <StatCard big={`${HEADLINE.ft}%`} text={tx("ts.s7.c1")} color={GREEN} tone="ok" />
          <StatCard big={`${HEADLINE.svm}%`} text={tx("ts.s7.c2")} color={BLUE} tone="pos" />
          <StatCard big={`${HEADLINE.zs}%`} text={tx("ts.s7.c3")} color="rgb(var(--brand))" tone="" />
        </div>
      </div>
    </div>
  );
}

function Legend() {
  const tx = useTx();
  return (
    <ul className="ts-legend">
      {FAMILY_ORDER.map((f) => <li key={f}><i style={{ background: FAM_COLOR[f] }} />{tx(`ts.fam.${f}`)}</li>)}
    </ul>
  );
}

// ---------------------------------------------------------------------------------------------------- 8 cost
function S8() {
  const tx = useTx();
  return (
    <div className="ts-body">
      <Title>{tx("ts.s8.title")}</Title>
      <div className="ts-grid ts-split-8 ts-grow">
        <div className="ts-tablewrap">
          <table className="ts-table" aria-label={tx("ts.s8.table")}>
            <thead>
              <tr>
                <th scope="col">{tx("ts.s8.hModel")}</th>
                <th scope="col" className="r">{tx("ts.s8.hAcc")}</th>
                <th scope="col" className="r">{tx("ts.s8.hTrain")}</th>
                <th scope="col" className="r">{tx("ts.s8.hLat")}</th>
                <th scope="col" className="r">{tx("ts.s8.hParams")}</th>
              </tr>
            </thead>
            <tbody>
              {COST_ROWS.map((r) => (
                <tr key={r.tag}>
                  <th scope="row">{r.name}</th>
                  <td className="r">{r.acc}</td>
                  <td className="r">{r.train}</td>
                  <td className="r">{r.latency}</td>
                  <td className="r">{r.params}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Src k="ts.ui.src.chart" />
        </div>
        <div className="ts-col">
          <Card tone="neg" className="ts-stat ts-stat-r">
            <b className="ts-statbig ts-big" style={{ color: ORANGE }} data-testid="ts-ratio">×{HEADLINE.ratio}</b>
            <span className="ts-muted">{tx("ts.s8.ratio", { ms: HEADLINE.ftLatency })}</span>
          </Card>
          <Card tone="ok" className="ts-afford">
            <h3>{tx("ts.s8.afford")}</h3>
            <p className="ts-p">{tx("ts.s8.affordText", FT_TIMES)}</p>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 9 data efficiency
const W = 400, H = 262, X0 = 46, X1 = 388, Y0 = 14, Y1 = 206;
const yOf = (pct: number) => Y1 - ((pct - 60) / 30) * (Y1 - Y0);
const xOf = (i: number) => X0 + 14 + (i / (CURVE_SMALL.length - 1)) * (X1 - X0 - 28);

function LineChart() {
  const tx = useTx();
  const path = (rows: { accuracy: number }[]) => rows.map((r, i) => `${i ? "L" : "M"}${xOf(i).toFixed(1)} ${yOf(r.accuracy * 100).toFixed(1)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="ts-svg" role="img" aria-label={tx("ts.s9.chartLabel")}>
      {[60, 70, 80, 90].map((t) => (
        <g key={t}>
          <line x1={X0} x2={X1} y1={yOf(t)} y2={yOf(t)} stroke="rgb(var(--line))" strokeWidth="1" />
          <text x={X0 - 6} y={yOf(t) + 4} textAnchor="end" className="ts-svg-t">{t}</text>
        </g>
      ))}
      {CURVE_SMALL.map((r, i) => <text key={r.n} x={xOf(i)} y={Y1 + 18} textAnchor="middle" className="ts-svg-t">{r.n}</text>)}
      <text x={(X0 + X1) / 2} y={H - 8} textAnchor="middle" className="ts-svg-t ts-svg-ax">{tx("ts.s9.axisX")}</text>
      <text transform={`translate(12 ${(Y0 + Y1) / 2}) rotate(-90)`} textAnchor="middle" className="ts-svg-t ts-svg-ax">{tx("ts.s7.axis")}</text>
      <path d={path(CURVE_LR)} fill="none" stroke={BLUE} strokeWidth="2.5" />
      <path d={path(CURVE_SMALL)} fill="none" stroke={GREEN} strokeWidth="2.5" />
      {CURVE_LR.map((r, i) => (
        <g key={`l${i}`}>
          <rect x={xOf(i) - 4} y={yOf(r.accuracy * 100) - 4} width="8" height="8" fill={BLUE} />
          <text x={xOf(i)} y={yOf(r.accuracy * 100) + (i === 0 ? -10 : 18)} textAnchor="middle" className="ts-svg-v" fill={BLUE}>{p1(r.accuracy)}</text>
        </g>
      ))}
      {CURVE_SMALL.map((r, i) => (
        <g key={`s${i}`}>
          <circle cx={xOf(i)} cy={yOf(r.accuracy * 100)} r="4.5" fill={GREEN} />
          <text x={xOf(i)} y={yOf(r.accuracy * 100) - 9} textAnchor="middle" className="ts-svg-v" fill={GREEN}>{p1(r.accuracy)}</text>
        </g>
      ))}
    </svg>
  );
}

function S9() {
  const tx = useTx();
  const lr = MODELS.find((m) => m.tag === "tfidf_logreg")!;
  return (
    <div className="ts-body">
      <Title>{tx("ts.s9.title")}</Title>
      <div className="ts-grid ts-split-7 ts-grow">
        <div className="ts-chart">
          <LineChart />
          <ul className="ts-legend">
            <li><i style={{ background: GREEN, borderRadius: "50%" }} />{tx("ts.s9.lineA")}</li>
            <li><i style={{ background: BLUE }} />{lr.name}</li>
          </ul>
          <Src k="ts.ui.src.chart" />
        </div>
        <div className="ts-col">
          <StatCard big="4,000" text={tx("ts.s9.big1Text", { a: DATA_EFF.small4000, b: HEADLINE.svm })} color={GREEN} tone="ok" />
          <StatCard big={tx("ts.s9.big2", { gap: DATA_EFF.gap500 })} text={tx("ts.s9.big2Text")} color={BLUE} tone="pos" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 10 negation and contrast
function S10() {
  const tx = useTx();
  const series: { key: "all" | "negation" | "contrast"; label: string; color: string }[] = [
    { key: "all", label: tx("ts.s10.all"), color: "rgb(var(--muted) / .55)" },
    { key: "negation", label: tx("ts.s10.neg"), color: BLUE },
    { key: "contrast", label: tx("ts.s10.con"), color: ORANGE },
  ];
  return (
    <div className="ts-body">
      <Title>{tx("ts.s10.title")}</Title>
      <div className="ts-grid ts-split-10 ts-grow">
        <div className="ts-chart">
          <p className="ts-axis-t ts-axis-top">{tx("ts.s10.chartTitle")}</p>
          <div className="ts-cols-chart" role="img" aria-label={tx("ts.s10.chartLabel")}>
            {SUBSET_ROWS.map((r) => (
              <div key={r.tag} className="ts-grp">
                <div className="ts-grp-bars">
                  {series.map((s) => (
                    <span key={s.key} className="ts-colbar-wrap">
                      <em>{Math.round(r[s.key] * 100)}</em>
                      <span className="ts-colbar" style={{ height: `${((r[s.key] * 100 - 60) / 40) * 100}%`, background: s.color }} />
                    </span>
                  ))}
                </div>
                <span className="ts-grp-l">{r.name}</span>
              </div>
            ))}
          </div>
          <ul className="ts-legend">{series.map((s) => <li key={s.key}><i style={{ background: s.color }} />{s.label}</li>)}</ul>
          <Src k="ts.ui.src.chart" />
        </div>
        <figure className="ts-fig ts-fig-att">
          <img src="/transformers/slides/attention.png" alt={tx("ts.s10.imgAlt")} width={1000} height={857} loading="eager" decoding="async" />
          <figcaption className="ts-figcap">{tx("ts.s10.caption")}</figcaption>
          <Src k="ts.ui.src.fig" />
        </figure>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------------- 11 conclusions
function S11() {
  const tx = useTx();
  const rows: [IconName, string][] = [["trophy", "c1"], ["database", "c2"], ["timer", "c3"], ["repeat", "c4"], ["flag", "c5"]];
  return (
    <div className="ts-body">
      <Title>{tx("ts.s11.title")}</Title>
      <ul className="ts-concl ts-grow">
        {rows.map(([icon, k]) => (
          <li key={k}>
            <Badge name={icon} color={GREEN} size={4.4} />
            <span>{tx(`ts.s11.${k}`, SLIDE_VARS)}</span>
          </li>
        ))}
      </ul>
      <p className="ts-thanks">{tx("ts.s11.thanks")}</p>
    </div>
  );
}

const SLIDE_BODIES: (() => JSX.Element)[] = [S1, S2, S3, S4, S5, S6, S7, S8, S9, S10, S11];
