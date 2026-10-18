import numpy as np
import pytest

from app.datasets import generate_dataset
from app.nn import (
    Adam,
    NeuralNetwork,
    SGD,
    binary_cross_entropy,
    bce_from_logits,
    sigmoid,
    train_step,
)


def test_sigmoid_is_stable_for_extreme_inputs():
    z = np.array([-1000.0, -50.0, 0.0, 50.0, 1000.0])
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        out = sigmoid(z)
    assert np.all(np.isfinite(out))
    assert out[0] == pytest.approx(0.0) and out[-1] == pytest.approx(1.0)
    assert out[2] == pytest.approx(0.5)


def test_bce_stable_and_matches_probability_form():
    z = np.array([-3.0, -0.5, 0.2, 4.0])
    y = np.array([0, 1, 1, 1])
    assert bce_from_logits(z, y) == pytest.approx(binary_cross_entropy(sigmoid(z), y), rel=1e-5)
    # extreme logits must not give inf/nan
    assert np.isfinite(bce_from_logits(np.array([800.0, -800.0]), np.array([0, 1])))
    assert np.isfinite(binary_cross_entropy(np.array([0.0, 1.0]), np.array([1, 0])))


@pytest.mark.parametrize("act", ["relu", "sigmoid", "tanh"])
def test_forward_matches_manual_computation(act):
    net = NeuralNetwork([3], activation=act, seed=1)
    X = np.random.default_rng(0).normal(size=(5, 2))
    f = {"relu": lambda z: np.maximum(z, 0), "sigmoid": sigmoid, "tanh": np.tanh}[act]
    h = f(X @ net.W[0] + net.b[0])
    expected = sigmoid(h @ net.W[1] + net.b[1]).reshape(-1)
    assert np.allclose(net.predict_proba(X), expected)


def test_prediction_shapes_and_range():
    net = NeuralNetwork([5, 4], seed=3)
    X = np.zeros((7, 2))
    p = net.predict_proba(X)
    assert p.shape == (7,)
    assert np.all((p >= 0) & (p <= 1))
    assert net.predict(X).shape == (7,)
    assert {w.shape for w in net.W} == {(2, 5), (5, 4), (4, 1)}
    assert {b.shape for b in net.b} == {(1, 5), (1, 4), (1, 1)}


def test_parameter_count():
    assert NeuralNetwork([], seed=0).n_parameters() == 3  # 2 weights + 1 bias
    assert NeuralNetwork([4, 3], seed=0).n_parameters() == (2 * 4 + 4) + (4 * 3 + 3) + (3 * 1 + 1)


def test_initializers():
    he = NeuralNetwork([64], init="he", seed=0).W[0]
    assert he.std() == pytest.approx(np.sqrt(2 / 2), rel=0.3)
    assert np.all(NeuralNetwork([4], init="zeros").W[0] == 0)
    a = NeuralNetwork([4], seed=5).W[0]
    b = NeuralNetwork([4], seed=5).W[0]
    c = NeuralNetwork([4], seed=6).W[0]
    assert np.array_equal(a, b) and not np.array_equal(a, c)


@pytest.mark.parametrize("act", ["relu", "sigmoid", "tanh"])
@pytest.mark.parametrize("hidden", [[], [3], [4, 3]])
def test_gradient_check_finite_differences(act, hidden):
    rng = np.random.default_rng(42)
    net = NeuralNetwork(hidden, activation=act, init="he", seed=7)
    for b in net.b:  # non-zero biases so every parameter matters
        b += rng.normal(0, 0.1, b.shape)
    X = rng.normal(size=(8, 2))
    y = rng.integers(0, 2, size=8)
    _, dW, db = net.gradients(X, y)
    analytic = []
    for gw, gb in zip(dW, db):
        analytic.extend([gw, gb])
    eps = 1e-6
    worst = 0.0
    for p, g in zip(net.params, analytic):
        it = np.nditer(p, flags=["multi_index"])
        for _ in it:
            idx = it.multi_index
            old = p[idx]
            p[idx] = old + eps
            lp = net.loss(X, y)
            p[idx] = old - eps
            lm = net.loss(X, y)
            p[idx] = old
            num = (lp - lm) / (2 * eps)
            denom = max(1e-8, abs(num) + abs(g[idx]))
            worst = max(worst, abs(num - g[idx]) / denom)
    assert worst < 1e-5, f"relative gradient error {worst}"


def test_sgd_update_matches_formula():
    net = NeuralNetwork([3], seed=2)
    X = np.random.default_rng(1).normal(size=(6, 2))
    y = np.array([0, 1, 0, 1, 1, 0])
    _, dW, db = net.gradients(X, y)
    before = [w.copy() for w in net.W]
    train_step(net, SGD(0.1), X, y)
    for w0, w1, g in zip(before, net.W, dW):
        assert np.allclose(w1, w0 - 0.1 * g)


def test_adam_first_step_is_lr_times_sign():
    # With bias correction, the first Adam step is ~ lr * g / (|g| + eps).
    p = [np.array([1.0, -2.0])]
    g = [np.array([0.5, -0.25])]
    Adam(0.01).step(p, g)
    assert np.allclose(p[0], [1.0 - 0.01, -2.0 + 0.01], atol=1e-6)


@pytest.mark.parametrize("opt", [SGD(0.5), Adam(0.05)])
def test_loss_decreases_on_separable_data(opt):
    X, y = generate_dataset("linear", 120, 0.1, 0)
    net = NeuralNetwork([4], seed=0)
    start = net.loss(X, y)
    for _ in range(200):
        train_step(net, opt, X, y)
    assert net.loss(X, y) < start * 0.5
    assert net.accuracy(X, y) > 0.95


def test_xor_is_learnable_with_hidden_layer_and_not_without():
    X, y = generate_dataset("xor", 200, 0.1, 0)
    deep = NeuralNetwork([8], seed=0)
    opt = Adam(0.05)
    for _ in range(500):
        train_step(deep, opt, X, y)
    assert deep.accuracy(X, y) > 0.95
    flat = NeuralNetwork([], seed=0)
    opt = Adam(0.05)
    for _ in range(500):
        train_step(flat, opt, X, y)
    assert flat.accuracy(X, y) < 0.8  # a single linear boundary cannot solve XOR
