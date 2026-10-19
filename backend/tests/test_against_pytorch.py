"""Cross-check the hand-written NumPy network against PyTorch autograd and torch.optim.

Skipped automatically when torch is not installed (it is an optional extra: `pip install torch`).
The same weights (and, for dropout, the same masks) go through both frameworks, which must agree
on the loss, every gradient and the optimizer updates.
"""
import numpy as np
import pytest

torch = pytest.importorskip("torch")

from app.nn import (  # noqa: E402
    ACTIVATIONS, Adadelta, Adagrad, Adam, LOSSES, NeuralNetwork, RMSprop, SGD, loss_and_dlogits, train_step,
)

F = torch.nn.functional
TORCH_ACT = {
    "relu": torch.relu,
    "leaky_relu": lambda z: F.leaky_relu(z, 0.01),
    "elu": F.elu,
    "selu": torch.selu,
    "sigmoid": torch.sigmoid,
    "tanh": torch.tanh,
    "softplus": F.softplus,
    "silu": F.silu,
}


def tparams(net):
    return [torch.tensor(p, dtype=torch.float64, requires_grad=True) for p in net.params]


def torch_logits(net, params, X, training, masks=None):
    a, i = X, 0
    n_layers = len(net.W)
    for l in range(n_layers):
        z = a @ params[i] + params[i + 1]
        i += 2
        if l == n_layers - 1:
            return z.reshape(-1)
        if net._has_bn(l):
            g, b = params[i], params[i + 1]
            i += 2
            if training:
                mu, var = z.mean(0, keepdim=True), z.var(0, unbiased=False, keepdim=True)
            else:
                mu, var = torch.tensor(net.run_mean[l]), torch.tensor(net.run_var[l])
            z = g * (z - mu) / torch.sqrt(var + 1e-5) + b
        a = TORCH_ACT[net.activation_name](z)
        if masks is not None and masks[l] is not None:
            a = a * torch.tensor(masks[l])


def torch_loss(net, params, X, y, training=False, masks=None):
    z = torch_logits(net, params, X, training, masks)
    t = y.double()
    if net.loss_name == "bce":
        data = F.binary_cross_entropy_with_logits(z, t)
    elif net.loss_name == "mse":
        data = ((torch.sigmoid(z) - t) ** 2).mean()
    else:
        data = F.relu(1 - (2 * t - 1) * z).mean()
    ws = [params[net.param_index(l)["W"]] for l in range(len(net.W))]
    pen = sum(net.l1 * w.abs().sum() + net.l2 * (w * w).sum() for w in ws)
    return data + pen


def _data(m=24, seed=0):
    rng = np.random.default_rng(seed)
    return rng.normal(size=(m, 2)), rng.integers(0, 2, size=m)


@pytest.mark.parametrize("activation", sorted(ACTIVATIONS))
@pytest.mark.parametrize("hidden", [[], [5], [6, 4]])
def test_loss_and_gradients_match_autograd_for_every_activation(activation, hidden):
    X, y = _data()
    net = NeuralNetwork(hidden, activation=activation, init="he", seed=3)
    for b in net.b:
        b += np.random.default_rng(1).normal(0, 0.1, b.shape)
    loss, grads = net.gradients(X, y)
    tp = tparams(net)
    ref = torch_loss(net, tp, torch.tensor(X), torch.tensor(y))
    ref.backward()
    assert loss == pytest.approx(ref.item(), rel=1e-9)
    for p, g in zip(tp, grads):
        np.testing.assert_allclose(g, p.grad.numpy().reshape(g.shape), rtol=1e-7, atol=1e-10)


@pytest.mark.parametrize("loss", LOSSES)
def test_every_loss_matches_autograd(loss):
    X, y = _data(seed=2)
    net = NeuralNetwork([5, 4], activation="tanh", init="he", seed=1, loss=loss)
    value, grads = net.gradients(X, y)
    tp = tparams(net)
    ref = torch_loss(net, tp, torch.tensor(X), torch.tensor(y))
    ref.backward()
    assert value == pytest.approx(ref.item(), rel=1e-9)
    for p, g in zip(tp, grads):
        np.testing.assert_allclose(g, p.grad.numpy().reshape(g.shape), rtol=1e-6, atol=1e-10)


@pytest.mark.parametrize("l1,l2", [(0.0, 0.03), (0.02, 0.0), (0.01, 0.02)])
def test_regularisation_matches_autograd(l1, l2):
    X, y = _data(seed=3)
    net = NeuralNetwork([6, 4], activation="relu", init="he", seed=2, l1=l1, l2=l2)
    value, grads = net.gradients(X, y)
    tp = tparams(net)
    ref = torch_loss(net, tp, torch.tensor(X), torch.tensor(y))
    ref.backward()
    assert value == pytest.approx(ref.item(), rel=1e-9)
    for p, g in zip(tp, grads):
        np.testing.assert_allclose(g, p.grad.numpy().reshape(g.shape), rtol=1e-6, atol=1e-10)


def test_dropout_matches_autograd_with_identical_masks():
    X, y = _data(m=30, seed=4)
    net = NeuralNetwork([8, 6], activation="elu", init="he", seed=2, dropout=0.3)
    rng = np.random.default_rng(7)
    value, grads = net.gradients(X, y, training=True, rng=rng)
    _, cache = net.forward(X, training=True, rng=np.random.default_rng(7))  # same seed -> same masks
    masks = [info.get("mask") for info in cache["layers"]]
    tp = tparams(net)
    ref = torch_loss(net, tp, torch.tensor(X), torch.tensor(y), training=True, masks=masks)
    ref.backward()
    assert value == pytest.approx(ref.item(), rel=1e-9)
    for p, g in zip(tp, grads):
        np.testing.assert_allclose(g, p.grad.numpy().reshape(g.shape), rtol=1e-6, atol=1e-10)


@pytest.mark.parametrize("activation", ["relu", "tanh", "selu"])
def test_batch_norm_training_mode_matches_autograd(activation):
    X, y = _data(m=32, seed=5)
    net = NeuralNetwork([6, 5], activation=activation, init="he", seed=2, batch_norm=True)
    for g in net.gamma:
        g += np.random.default_rng(1).normal(0, 0.2, g.shape)
    value, grads = net.gradients(X, y, training=True)
    tp = tparams(net)
    ref = torch_loss(net, tp, torch.tensor(X), torch.tensor(y), training=True)
    ref.backward()
    assert value == pytest.approx(ref.item(), rel=1e-9)
    for p, g in zip(tp, grads):
        np.testing.assert_allclose(g, p.grad.numpy().reshape(g.shape), rtol=1e-6, atol=1e-9)


def test_batch_norm_inference_uses_running_statistics_like_torch():
    X, y = _data(m=40, seed=6)
    net = NeuralNetwork([5], activation="tanh", init="he", seed=1, batch_norm=True)
    for _ in range(30):  # let the running statistics settle
        net.forward(X, training=True)
    tp = tparams(net)
    ours = net.predict_proba(X)
    ref = torch.sigmoid(torch_logits(net, tp, torch.tensor(X), training=False)).detach().numpy()
    np.testing.assert_allclose(ours, ref, rtol=1e-9)


def _compare_training(net_factory, opt_ours, make_torch_opt, steps=25, rtol=1e-6, atol=1e-9):
    X, y = _data(m=40, seed=8)
    net = net_factory()
    tp = tparams(net)
    opt_ref = make_torch_opt(tp)
    Xt, yt = torch.tensor(X), torch.tensor(y)
    for _ in range(steps):
        train_step(net, opt_ours, X, y)
        opt_ref.zero_grad()
        torch_loss(net, tp, Xt, yt).backward()
        opt_ref.step()
    for p, ours in zip(tp, net.params):
        np.testing.assert_allclose(ours, p.detach().numpy().reshape(ours.shape), rtol=rtol, atol=atol)


def _factory(**kw):
    return lambda: NeuralNetwork([5], activation="tanh", init="xavier", seed=2, **kw)


def test_sgd_trajectory_matches_torch():
    _compare_training(_factory(), SGD(0.3), lambda p: torch.optim.SGD(p, lr=0.3))


def test_momentum_trajectory_matches_torch():
    _compare_training(_factory(), SGD(0.05, momentum=0.9), lambda p: torch.optim.SGD(p, lr=0.05, momentum=0.9))


def test_nesterov_trajectory_matches_torch():
    _compare_training(_factory(), SGD(0.05, momentum=0.9, nesterov=True),
                      lambda p: torch.optim.SGD(p, lr=0.05, momentum=0.9, nesterov=True))


def test_adam_trajectory_matches_torch():
    _compare_training(_factory(), Adam(0.01), lambda p: torch.optim.Adam(p, lr=0.01, betas=(0.9, 0.999), eps=1e-8), steps=30)


def test_adadelta_trajectory_matches_torch():
    _compare_training(_factory(), Adadelta(1.0, 0.95, 1e-6), lambda p: torch.optim.Adadelta(p, lr=1.0, rho=0.95, eps=1e-6), steps=30)


def test_adagrad_trajectory_matches_torch():
    _compare_training(_factory(), Adagrad(0.1, 1e-7), lambda p: torch.optim.Adagrad(p, lr=0.1, eps=1e-7), steps=30)


def test_rmsprop_trajectory_matches_torch():
    _compare_training(_factory(), RMSprop(0.01, 0.9, 1e-7), lambda p: torch.optim.RMSprop(p, lr=0.01, alpha=0.9, eps=1e-7), steps=30)
