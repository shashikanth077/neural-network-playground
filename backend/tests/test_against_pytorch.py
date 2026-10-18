"""Cross-check the hand-written NumPy network against PyTorch autograd.

Skipped automatically when torch is not installed (it is an optional extra:
`pip install torch`). Same weights in both frameworks must give the same
loss, gradients and optimizer updates.
"""
import numpy as np
import pytest

torch = pytest.importorskip("torch")

from app.nn import Adam, NeuralNetwork, SGD, train_step  # noqa: E402

ACT = {"relu": torch.relu, "sigmoid": torch.sigmoid, "tanh": torch.tanh}


def to_torch_params(net: NeuralNetwork):
    # NumPy stores W as (n_in, n_out); torch Linear-style math below uses x @ W directly.
    return [torch.tensor(p, dtype=torch.float64, requires_grad=True) for p in net.params]


def torch_forward(params, X, activation):
    a = X
    n_layers = len(params) // 2
    for i in range(n_layers):
        z = a @ params[2 * i] + params[2 * i + 1]
        a = torch.sigmoid(z) if i == n_layers - 1 else ACT[activation](z)
    return a.reshape(-1)


def torch_bce(p, y):
    return torch.nn.functional.binary_cross_entropy(p.clamp(1e-12, 1 - 1e-12), y)


@pytest.mark.parametrize("activation", ["relu", "sigmoid", "tanh"])
@pytest.mark.parametrize("hidden", [[], [5], [6, 4]])
def test_loss_and_gradients_match_autograd(activation, hidden):
    rng = np.random.default_rng(0)
    net = NeuralNetwork(hidden, activation=activation, init="he", seed=3)
    for b in net.b:
        b += rng.normal(0, 0.1, b.shape)
    X = rng.normal(size=(16, 2))
    y = rng.integers(0, 2, size=16).astype(float)

    _, dW, db = net.gradients(X, y)
    ours = []
    for gw, gb in zip(dW, db):
        ours.extend([gw, gb.reshape(-1)])

    params = to_torch_params(net)
    loss = torch_bce(torch_forward(params, torch.tensor(X), activation), torch.tensor(y))
    loss.backward()

    assert net.loss(X, y.astype(int)) == pytest.approx(loss.item(), rel=1e-9)
    for p, g_ours in zip(params, ours):
        g_ref = p.grad.numpy().reshape(g_ours.shape)
        np.testing.assert_allclose(g_ours, g_ref, rtol=1e-7, atol=1e-10)


def test_sgd_training_trajectory_matches_pytorch():
    rng = np.random.default_rng(1)
    X = rng.normal(size=(40, 2))
    y = (X[:, 0] * X[:, 1] > 0).astype(float)
    net = NeuralNetwork([5], activation="tanh", init="xavier", seed=2)
    params = to_torch_params(net)
    opt_ref = torch.optim.SGD(params, lr=0.3)
    opt = SGD(0.3)
    Xt, yt = torch.tensor(X), torch.tensor(y)
    for _ in range(25):
        train_step(net, opt, X, y.astype(int))
        opt_ref.zero_grad()
        torch_bce(torch_forward(params, Xt, "tanh"), yt).backward()
        opt_ref.step()
    for p, ours in zip(params, net.params):
        np.testing.assert_allclose(ours, p.detach().numpy().reshape(ours.shape), rtol=1e-6, atol=1e-9)


def test_adam_trajectory_matches_pytorch():
    rng = np.random.default_rng(4)
    X = rng.normal(size=(40, 2))
    y = (X[:, 0] + X[:, 1] > 0).astype(float)
    net = NeuralNetwork([4, 3], activation="relu", init="he", seed=5)
    params = to_torch_params(net)
    opt_ref = torch.optim.Adam(params, lr=0.01, betas=(0.9, 0.999), eps=1e-8)
    opt = Adam(0.01)
    Xt, yt = torch.tensor(X), torch.tensor(y)
    for _ in range(30):
        train_step(net, opt, X, y.astype(int))
        opt_ref.zero_grad()
        torch_bce(torch_forward(params, Xt, "relu"), yt).backward()
        opt_ref.step()
    for p, ours in zip(params, net.params):
        np.testing.assert_allclose(ours, p.detach().numpy().reshape(ours.shape), rtol=1e-6, atol=1e-8)
