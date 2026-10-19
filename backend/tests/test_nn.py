import itertools

import numpy as np
import pytest

from app.datasets import generate_dataset
from app.nn import (
    ACTIVATIONS, Adadelta, Adagrad, Adam, LOSSES, Nadam, NeuralNetwork, RMSprop, SGD,
    batch_indices, bce_from_logits, binary_cross_entropy, loss_and_dlogits, make_optimizer, sigmoid, train_step,
)


# ----------------------------------------------------------------- basics
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
    assert np.isfinite(bce_from_logits(np.array([800.0, -800.0]), np.array([0, 1])))
    assert np.isfinite(binary_cross_entropy(np.array([0.0, 1.0]), np.array([1, 0])))


@pytest.mark.parametrize("act", sorted(ACTIVATIONS))
def test_activations_finite_at_extremes(act):
    f, _ = ACTIVATIONS[act]
    with np.errstate(over="raise", invalid="raise", divide="raise"):
        out = f(np.array([-1e4, -50.0, 0.0, 50.0, 1e4]))
    assert np.all(np.isfinite(out))


def test_known_activation_values():
    z = np.array([-2.0, 0.0, 3.0])
    assert np.allclose(ACTIVATIONS["relu"][0](z), [0, 0, 3])
    assert np.allclose(ACTIVATIONS["leaky_relu"][0](z), [-0.02, 0, 3])
    assert np.allclose(ACTIVATIONS["elu"][0](z), [np.exp(-2) - 1, 0, 3])
    assert np.allclose(ACTIVATIONS["softplus"][0](z), np.log1p(np.exp(z)))
    assert np.allclose(ACTIVATIONS["silu"][0](z), z / (1 + np.exp(-z)))
    # sigmoid derivative peaks at 0.25 (the vanishing-gradient fact from the lecture)
    assert ACTIVATIONS["sigmoid"][1](np.array([0.0]), np.array([0.5]))[0] == pytest.approx(0.25)
    # selu: scale * (alpha*(e^z - 1)) for z<0, scale*z otherwise
    assert ACTIVATIONS["selu"][0](np.array([1.0]))[0] == pytest.approx(1.0507009873554805)


@pytest.mark.parametrize("act", sorted(ACTIVATIONS))
def test_forward_matches_manual_computation(act):
    net = NeuralNetwork([3], activation=act, seed=1)
    X = np.random.default_rng(0).normal(size=(5, 2))
    f = ACTIVATIONS[act][0]
    h = f(X @ net.W[0] + net.b[0])
    expected = sigmoid(h @ net.W[1] + net.b[1]).reshape(-1)
    assert np.allclose(net.predict_proba(X), expected)


def test_prediction_shapes_and_range():
    net = NeuralNetwork([5, 4], seed=3)
    X = np.zeros((7, 2))
    p = net.predict_proba(X)
    assert p.shape == (7,) and np.all((p >= 0) & (p <= 1))
    assert net.predict(X).shape == (7,)
    assert {w.shape for w in net.W} == {(2, 5), (5, 4), (4, 1)}


def test_parameter_counts():
    assert NeuralNetwork([], seed=0).n_parameters() == 3
    assert NeuralNetwork([4, 3], seed=0).n_parameters() == (2 * 4 + 4) + (4 * 3 + 3) + (3 * 1 + 1)
    bn = NeuralNetwork([4, 3], batch_norm=True)
    assert bn.n_parameters() == (8 + 4) + (12 + 3) + (3 + 1) + 2 * 4 + 2 * 3  # layers + gamma/beta per hidden unit
    assert bn.n_non_trainable() == 2 * (4 + 3)  # running mean + variance (Keras counts these separately)


def test_lecture_mnist_dense_parameter_count():
    # 784 -> 100 -> 10 : 78,500 + 1,010 = 79,510 (lecture 5)
    net = NeuralNetwork([100], n_inputs=784)
    assert net.W[0].size + net.b[0].size == 78500
    assert net.n_parameters() - 78500 == 100 + 1  # our output layer is one neuron, not ten


def test_initializers_and_seed():
    he = NeuralNetwork([64], init="he", seed=0).W[0]
    assert he.std() == pytest.approx(1.0, rel=0.3)
    assert np.all(NeuralNetwork([4], init="zeros").W[0] == 0)
    a, b, c = (NeuralNetwork([4], seed=s).W[0] for s in (5, 5, 6))
    assert np.array_equal(a, b) and not np.array_equal(a, c)


def test_rejects_bad_settings():
    with pytest.raises(ValueError):
        NeuralNetwork([2], dropout=1.0)
    with pytest.raises(ValueError):
        NeuralNetwork([2], loss="nope")
    with pytest.raises(ValueError):
        NeuralNetwork([2], l2=-1)


# ------------------------------------------------- finite-difference gradient checks
def _fd_check(net: NeuralNetwork, X, y, training: bool, seed: int = 11, eps=1e-6, tol=2e-5):
    def total_loss():
        rng = np.random.default_rng(seed)  # identical dropout mask on every evaluation
        logits, _ = net.forward(X, training=training, rng=rng)
        return loss_and_dlogits(net.loss_name, logits, y)[0] + net.penalty()

    rng = np.random.default_rng(seed)
    saved = (list(net.run_mean), list(net.run_var))
    _, grads = net.gradients(X, y, training=training, rng=rng)
    net.run_mean, net.run_var = [a.copy() for a in saved[0]], [a.copy() for a in saved[1]]  # undo the running-stat update
    worst = 0.0
    for p, g in zip(net.params, grads):
        it = np.nditer(p, flags=["multi_index"])
        for _ in it:
            idx = it.multi_index
            old = p[idx]
            p[idx] = old + eps
            lp = total_loss()
            p[idx] = old - eps
            lm = total_loss()
            p[idx] = old
            num = (lp - lm) / (2 * eps)
            # absolute + relative tolerance: some true gradients are (almost) exactly zero
            worst = max(worst, abs(num - g[idx]) / (1e-7 + tol * (abs(num) + abs(g[idx]))))
    assert worst < 1.0, f"gradient mismatch (ratio to tolerance: {worst:.2f})"


def _data(seed=42, m=10):
    rng = np.random.default_rng(seed)
    return rng.normal(size=(m, 2)), rng.integers(0, 2, size=m)


@pytest.mark.parametrize("act", sorted(ACTIVATIONS))
@pytest.mark.parametrize("hidden", [[], [3], [4, 3]])
def test_gradient_check_every_activation_and_depth(act, hidden):
    X, y = _data()
    net = NeuralNetwork(hidden, activation=act, init="he", seed=7)
    for b in net.b:
        b += np.random.default_rng(0).normal(0, 0.1, b.shape)
    _fd_check(net, X, y, training=False)


@pytest.mark.parametrize("loss", LOSSES)
def test_gradient_check_every_loss(loss):
    X, y = _data()
    net = NeuralNetwork([4, 3], activation="tanh", init="he", seed=3, loss=loss)
    _fd_check(net, X, y, training=False)


@pytest.mark.parametrize("l1,l2", [(0.0, 0.05), (0.03, 0.0), (0.02, 0.04)])
def test_gradient_check_with_regularisation(l1, l2):
    X, y = _data()
    net = NeuralNetwork([4, 3], activation="tanh", init="he", seed=5, l1=l1, l2=l2)
    _fd_check(net, X, y, training=False)


def test_gradient_check_with_dropout_fixed_mask():
    X, y = _data(m=12)
    net = NeuralNetwork([6, 5], activation="elu", init="he", seed=2, dropout=0.3)
    _fd_check(net, X, y, training=True)


@pytest.mark.parametrize("act", ["relu", "tanh", "selu"])
def test_gradient_check_with_batch_norm_training_mode(act):
    X, y = _data(m=12)
    net = NeuralNetwork([5, 4], activation=act, init="he", seed=4, batch_norm=True)
    for g in net.gamma:
        g += np.random.default_rng(1).normal(0, 0.2, g.shape)
    for b in net.beta:
        b += np.random.default_rng(2).normal(0, 0.2, b.shape)
    _fd_check(net, X, y, training=True, tol=1e-4)


def test_bias_before_batch_norm_has_zero_gradient():
    # Batch norm subtracts the batch mean, which cancels any constant added by the Dense bias.
    X, y = _data(m=12)
    net = NeuralNetwork([5], activation="tanh", init="he", seed=4, batch_norm=True)
    _, grads = net.gradients(X, y, training=True)
    assert np.allclose(grads[net.param_index(0)["b"]], 0, atol=1e-12)
    assert np.abs(grads[net.param_index(0)["gamma"]]).max() > 1e-4


def test_gradient_check_batch_norm_inference_mode():
    X, y = _data()
    net = NeuralNetwork([5], activation="tanh", init="he", seed=4, batch_norm=True)
    net.run_mean = [np.full((1, 5), 0.1)]
    net.run_var = [np.full((1, 5), 1.7)]
    _fd_check(net, X, y, training=False)


def test_everything_together_gradient_check():
    X, y = _data(m=14)
    net = NeuralNetwork([5, 4], activation="silu", init="he", seed=9, loss="mse", l1=0.01, l2=0.02, dropout=0.25, batch_norm=True)
    _fd_check(net, X, y, training=True, tol=1e-4)


# ----------------------------------------------------------- regularisation / dropout / BN behaviour
def test_dropout_is_inverted_and_training_only():
    net = NeuralNetwork([200], dropout=0.4, activation="relu", init="he", seed=0)
    X = np.random.default_rng(0).normal(size=(500, 2))
    _, c_train = net.forward(X, training=True, rng=np.random.default_rng(1))
    mask = c_train["layers"][0]["mask"]
    assert 0.55 < (mask > 0).mean() < 0.65  # about 1 - rate of the units are kept
    assert np.isclose(mask.max(), 1 / 0.6)  # kept units scaled by 1/(1-p)
    assert mask.mean() == pytest.approx(1.0, abs=0.03)  # expected activation is preserved
    # inference is deterministic and unaffected by dropout
    assert np.array_equal(net.predict_proba(X), net.predict_proba(X))
    assert "mask" not in net.forward(X)[1]["layers"][0]


def test_l2_penalty_value_and_weight_decay_effect():
    net = NeuralNetwork([3], l2=0.1, l1=0.2, seed=0)
    expected = sum(0.2 * np.abs(w).sum() + 0.1 * (w * w).sum() for w in net.W)
    assert net.penalty() == pytest.approx(expected)
    X, y = generate_dataset("moons", 120, 0.2, 0)
    norms = {}
    for l2 in (0.0, 0.05):
        n = NeuralNetwork([16, 16], seed=0, l2=l2)
        o = Adam(0.05)
        rng = np.random.default_rng(0)
        for _ in range(150):
            for idx in batch_indices(len(y), 30, rng):
                train_step(n, o, X[idx], y[idx], rng)
        norms[l2] = sum(float(np.sum(w * w)) for w in n.W)
    assert norms[0.05] < norms[0.0]


def test_l1_drives_weights_towards_zero():
    X, y = generate_dataset("linear", 150, 0.1, 0)
    sparse = {}
    for l1 in (0.0, 0.05):
        n = NeuralNetwork([12], seed=1, l1=l1)
        o = Adam(0.02)
        rng = np.random.default_rng(0)
        for _ in range(200):
            for idx in batch_indices(len(y), 30, rng):
                train_step(n, o, X[idx], y[idx], rng)
        sparse[l1] = float(np.mean(np.abs(n.W[0]) < 0.05))
    assert sparse[0.05] > sparse[0.0]


def test_batch_norm_normalises_in_training_and_tracks_running_stats():
    net = NeuralNetwork([8], batch_norm=True, activation="relu", init="he", seed=0)
    X = np.random.default_rng(0).normal(3.0, 2.0, size=(256, 2))
    _, cache = net.forward(X, training=True)
    zhat = cache["layers"][0]["zhat"]
    assert np.allclose(zhat.mean(axis=0), 0, atol=1e-8) and np.allclose(zhat.std(axis=0), 1, atol=1e-3)
    assert not np.allclose(net.run_mean[0], 0)  # running statistics moved
    before = net.run_mean[0].copy()
    net.forward(X)  # inference must not change them
    assert np.array_equal(before, net.run_mean[0])


def test_state_roundtrip_restores_predictions():
    net = NeuralNetwork([4], batch_norm=True, seed=0)
    X, y = generate_dataset("xor", 80, 0.1, 0)
    state = net.get_state()
    p0 = net.predict_proba(X).copy()
    o, rng = Adam(0.05), np.random.default_rng(0)
    for _ in range(20):
        train_step(net, o, X, y, rng)
    assert not np.allclose(net.predict_proba(X), p0)
    net.set_state(state)
    assert np.allclose(net.predict_proba(X), p0)


def test_batch_indices_cover_every_sample_once_and_drop_singletons_for_bn():
    rng = np.random.default_rng(0)
    seen = np.concatenate(list(batch_indices(10, 4, rng)))
    assert sorted(seen) == list(range(10))
    batches = list(batch_indices(9, 4, np.random.default_rng(0), batch_norm=True))
    assert [len(b) for b in batches] == [4, 4]  # trailing batch of 1 dropped


# --------------------------------------------------------------- optimizers
def _quad_step(opt, steps=1, w0=2.0, grad=lambda w: 2 * w):
    p = [np.array([w0])]
    for _ in range(steps):
        opt.step(p, [grad(p[0])])
    return float(p[0][0])


def test_sgd_matches_formula():
    assert _quad_step(SGD(0.1)) == pytest.approx(2.0 - 0.1 * 4.0)


def test_momentum_matches_lecture_formula():
    # v1 = lr*g1 ; theta1 = theta0 - v1 ; v2 = gamma*v1 + lr*g2 ; theta2 = theta1 - v2
    lr, g = 0.1, 0.9
    w0 = 2.0
    g1 = 2 * w0
    v1 = lr * g1
    w1 = w0 - v1
    g2 = 2 * w1
    v2 = g * v1 + lr * g2
    assert _quad_step(SGD(lr, momentum=g), steps=2) == pytest.approx(w1 - v2)


def test_nesterov_matches_formula():
    lr, g = 0.1, 0.9
    w0 = 2.0
    g1 = 2 * w0
    v1 = lr * g1
    w1 = w0 - (g * v1 + lr * g1)
    g2 = 2 * w1
    v2 = g * v1 + lr * g2
    assert _quad_step(SGD(lr, momentum=g, nesterov=True), steps=2) == pytest.approx(w1 - (g * v2 + lr * g2))


def test_adagrad_first_step_is_about_lr_and_shrinks_afterwards():
    w1 = _quad_step(Adagrad(0.1), steps=1)
    assert 2.0 - w1 == pytest.approx(0.1, rel=1e-4)  # lr * g / sqrt(g^2) = lr
    p = [np.array([2.0])]
    o = Adagrad(0.1)
    sizes = []
    for _ in range(4):
        before = p[0].copy()
        o.step(p, [np.array([1.0])])  # constant gradient -> steps shrink as 1/sqrt(t)
        sizes.append(float((before - p[0])[0]))
    assert all(a > b for a, b in zip(sizes, sizes[1:]))
    assert sizes[3] == pytest.approx(0.1 / np.sqrt(4), rel=1e-4)


def test_rmsprop_matches_formula():
    lr, rho, eps = 0.01, 0.9, 1e-7
    g = 4.0
    v = (1 - rho) * g * g
    assert 2.0 - _quad_step(RMSprop(lr, rho, eps)) == pytest.approx(lr * g / (np.sqrt(v) + eps))


def test_adadelta_matches_formula():
    rho, eps = 0.95, 1e-6
    g = 4.0
    eg = (1 - rho) * g * g
    delta = -np.sqrt(0 + eps) / np.sqrt(eg + eps) * g
    assert _quad_step(Adadelta(1.0, rho, eps)) == pytest.approx(2.0 + delta)


def test_adam_and_nadam_first_steps():
    p = [np.array([1.0, -2.0])]
    Adam(0.01).step(p, [np.array([0.5, -0.25])])
    assert np.allclose(p[0], [1.0 - 0.01, -2.0 + 0.01], atol=1e-6)  # lr * sign(g) after bias correction
    q = [np.array([1.0])]
    Nadam(0.01).step(q, [np.array([0.5])])
    assert 1.0 - q[0][0] == pytest.approx(0.01 * (1 + 0.9), rel=1e-5)  # (beta1+1) * lr * sign(g)


def test_make_optimizer_covers_all_names():
    for name in ("sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adadelta", "adam", "nadam"):
        assert make_optimizer(name, 0.01) is not None
    with pytest.raises(ValueError):
        make_optimizer("nope", 0.1)


@pytest.mark.parametrize(
    "name,lr",
    [("sgd", 0.5), ("momentum", 0.05), ("nesterov", 0.05), ("adagrad", 0.3), ("rmsprop", 0.02), ("adadelta", 1.0), ("adam", 0.05), ("nadam", 0.05)],
)
def test_every_optimizer_reduces_loss(name, lr):
    X, y = generate_dataset("linear", 120, 0.1, 0)
    net = NeuralNetwork([4], seed=0)
    opt = make_optimizer(name, lr)
    start = net.loss(X, y)
    rng = np.random.default_rng(0)
    for _ in range(150):
        train_step(net, opt, X, y, rng)
    assert net.loss(X, y) < start * 0.6, name


@pytest.mark.parametrize("loss", LOSSES)
def test_every_loss_trains_a_separable_problem(loss):
    X, y = generate_dataset("linear", 120, 0.1, 0)
    net = NeuralNetwork([4], seed=0, loss=loss)
    opt = Adam(0.05)
    rng = np.random.default_rng(0)
    for _ in range(150):
        train_step(net, opt, X, y, rng)
    assert net.accuracy(X, y) > 0.95


def test_xor_needs_a_hidden_layer():
    X, y = generate_dataset("xor", 200, 0.1, 0)
    deep = NeuralNetwork([8], seed=0)
    flat = NeuralNetwork([], seed=0)
    for net in (deep, flat):
        o, rng = Adam(0.05), np.random.default_rng(0)
        for _ in range(500):
            train_step(net, o, X, y, rng)
    assert deep.accuracy(X, y) > 0.95 and flat.accuracy(X, y) < 0.8


def test_all_activation_and_optimizer_combinations_are_finite():
    X, y = generate_dataset("circles", 100, 0.1, 0)
    for act, opt in itertools.product(sorted(ACTIVATIONS), ["sgd", "adam"]):
        net = NeuralNetwork([6], activation=act, seed=0)
        o, rng = make_optimizer(opt, 0.01), np.random.default_rng(0)
        for _ in range(5):
            train_step(net, o, X, y, rng)
        assert np.all(np.isfinite(net.predict_proba(X))), (act, opt)
