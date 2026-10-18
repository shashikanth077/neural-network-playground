import { Callout, Demo } from "../../ui";

const FLOW = [
  { tag: "Task 1", icon: "🧩", title: "Fill gaps", text: "Missing height → estimate from similar people" },
  { tag: "Tasks 2-4", icon: "🚨", title: "Find outliers", text: "Age 88 in a kids' list is a mistake, not data" },
  { tag: "Task 5", icon: "📏", title: "Scale", text: "Put height (cm) and weight (kg) on the same 0-1 ruler" },
  { tag: "Task 5", icon: "🧠", title: "Tiny network", text: "Guess gender from height + weight, by hand-written code" },
  { tag: "Task 6", icon: "🔢", title: "Big network", text: "70 000 handwritten digits → 10 classes" },
  { tag: "6.1-6.3", icon: "🎛️", title: "Tune", text: "Layers, activations, optimizers: change ONE thing at a time" },
];

export default function BigPicture() {
  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed text-muted">
        The lab is one story told in six tasks. Real machine-learning projects follow the same order: the model is only the last third of the work.
      </p>
      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLOW.map((s, i) => (
          <li key={s.title} className="card relative p-4">
            <span className="chip">{s.tag}</span>
            <div className="mt-2 text-2xl" aria-hidden>{s.icon}</div>
            <p className="mt-1 font-semibold">
              <span className="mr-1.5 font-mono text-xs text-muted">{i + 1}.</span>
              {s.title}
            </p>
            <p className="mt-0.5 text-sm text-muted">{s.text}</p>
          </li>
        ))}
      </ol>
      <Demo title="The rule that holds the whole lab together">
        <p className="text-sm leading-relaxed">
          “<b>Garbage in, garbage out.</b>” A neural network learns whatever you show it, including typos and wrong scales. Tasks 1-4 protect the model from bad data; Tasks 5-6 teach the model; the experiments in 6.1-6.3 prove which choices actually matter. Always measure on data the model has <b>never seen</b> (the test set).
        </p>
      </Demo>
      <Callout title="How to use this lab">
        Work through the steps in order. Every demo runs in your browser with real calculations, and the numbers quoted in the text are checked by automated tests. Tick <b>Mark step complete</b> as you go; progress is saved in this browser.
      </Callout>
    </div>
  );
}
