"""Generate src/test/fixtures/rnn_torch.json: PyTorch RNN/LSTM outputs the TypeScript cells must reproduce.
Run with a torch-enabled python:  python scripts/make_rnn_fixtures.py"""
import json, pathlib, torch
torch.manual_seed(3)
I, U, T = 3, 4, 5
xs = torch.randn(1, T, I)
out = {"inputs": I, "units": U, "xs": xs[0].tolist()}

def split(w, n): return [w[k * U:(k + 1) * U].tolist() for k in range(n)]

rnn = torch.nn.RNN(I, U, batch_first=True)
h, _ = rnn(xs)
out["rnn"] = {"W": rnn.weight_ih_l0.tolist(), "U": rnn.weight_hh_l0.tolist(),
              "b": (rnn.bias_ih_l0 + rnn.bias_hh_l0).tolist(), "h": h[0].tolist()}

lstm = torch.nn.LSTM(I, U, batch_first=True)
h, _ = lstm(xs)
Wi, Ui = split(lstm.weight_ih_l0, 4), split(lstm.weight_hh_l0, 4)
b = lstm.bias_ih_l0 + lstm.bias_hh_l0
bs = [b[k * U:(k + 1) * U].tolist() for k in range(4)]
out["lstm"] = {"gates": {n: {"W": Wi[k], "U": Ui[k], "b": bs[k]} for k, n in enumerate("ifgo")}, "h": h[0].tolist()}
pathlib.Path(__file__).resolve().parents[1].joinpath("frontend/src/test/fixtures/rnn_torch.json").write_text(json.dumps(out))
print("ok")
