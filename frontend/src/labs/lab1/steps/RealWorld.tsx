import { Callout, Demo } from "../../ui";

const SCENES = [
  { icon: "🏥", title: "Scene 1: Hospital intake system", tag: "Tasks 1 & 5", tagColor: "c-teal",
    body: <>A nurse forgets to type one patient's height. The system must not crash and must not put 0 cm (that would ruin averages and dose calculations). It <b>imputes</b> a sensible value from similar patients, same gender here, and flags it as “estimated”. Later, a model uses height and weight to predict something (here: gender; in real life: risk scores, dosage ranges).</>,
    callout: { tone: "warn" as const, title: "Why gender matters in Task 1", text: <>Women average ~166 cm, men ~183 cm in this data. Using the overall mean (~175 cm) would make the missing woman 9 cm too tall. Good imputation uses the <i>group</i> the person belongs to.</> } },
  { icon: "🏅", title: "Scene 2: Sports registration", tag: "Tasks 2-4", tagColor: "bad",
    body: <>Schools send lists of children for a competition. One list says a participant is 88. A person checks 30 values easily; a ministry checking 3 million records cannot. So software flags values that are statistically “too far away”. Three different rules exist because each is blind in a different way (see the live lab).</>,
    callout: { tone: "info" as const, title: "Same idea everywhere", text: <>Credit-card fraud (a 9 000 € purchase from a card that spends 40 € a day), broken sensors in a factory (temperature 900 °C), server attacks (10 000 logins in a minute).</> } },
  { icon: "✉️", title: "Scene 3: Reading digits at the post office / bank", tag: "Task 6", tagColor: "c-purple",
    body: <>Postal codes on envelopes and amounts on cheques were among the first big neural-network successes. A camera takes a picture, the picture is cut into digits, each digit becomes a 28×28 grid of numbers, and the network answers “this is a 7 with 98% confidence”. If confidence is low, a human checks the item.</>,
    callout: { tone: "good" as const, title: "MNIST is the “hello world”", text: <>If you understand how 784 numbers become one of 10 answers, you understand the skeleton of image classifiers, speech recognizers and text classifiers.</> } },
];

const PIPE = [
  ["Raw record", "height = ?, weight 54", "Task 1"], ["Clean", "impute · drop 88", "Tasks 1-4"], ["Scale", "0 … 1", "Task 5 (min-max)"],
  ["Model", "weights learned", "Tasks 5-6"], ["Prediction", "0.002 → female", "Task 6 test digit"], ["Decision", "use / review", ""],
];

export default function RealWorld() {
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted">The lab uses tiny examples, but each task is a miniature of something companies do every day.</p>
      {SCENES.map((s) => (
        <div key={s.title} className="card flex gap-4 p-4 sm:p-5">
          <div className="text-3xl" aria-hidden>{s.icon}</div>
          <div className="min-w-0">
            <h3 className="text-base font-semibold">
              {s.title}
              <span className="chip ml-2 align-middle" style={{ color: `rgb(var(--${s.tagColor}))` }}>{s.tag}</span>
            </h3>
            <p className="mt-1.5 text-sm leading-relaxed">{s.body}</p>
            <Callout tone={s.callout.tone} title={s.callout.title}>{s.callout.text}</Callout>
          </div>
        </div>
      ))}
      <Demo title="Life of one data point, end to end">
        <ol className="flex flex-col gap-2 md:flex-row md:items-stretch" aria-label="Pipeline">
          {PIPE.map(([t, s, task], i) => (
            <li key={t} className="flex flex-1 items-center gap-2 md:flex-col md:text-center">
              <div className={`w-full rounded-xl border p-3 ${t === "Model" ? "border-brand bg-brand text-white dark:text-bg" : "border-line bg-raised/60"}`}>
                <p className="text-sm font-semibold">{t}</p>
                <p className={`text-xs ${t === "Model" ? "opacity-85" : "text-muted"}`}>{s}</p>
                {task && <p className={`mt-1 text-[11px] ${t === "Model" ? "opacity-80" : "text-muted"}`}>{task}</p>}
              </div>
              {i < PIPE.length - 1 && <span aria-hidden className="text-muted md:hidden">↓</span>}
            </li>
          ))}
        </ol>
      </Demo>
    </div>
  );
}
