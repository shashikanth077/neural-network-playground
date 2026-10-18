"""A small feed-forward neural network for classification, in pure NumPy.

Conventions
-----------
* Samples are rows: ``X`` has shape ``(m, n_in)``.
* Layer ``l`` stores ``W[l]`` with shape ``(n_in_l, n_out_l)`` and ``b[l]`` with
  shape ``(1, n_out_l)``, so the linear step is ``z = a_prev @ W + b``.
* A hidden layer is ``Dense -> [BatchNorm] -> activation -> [Dropout]``.
  The output layer is a single neuron whose logit becomes a probability via the sigmoid.
* ``params`` / gradients are flat lists in the order
  ``W0, b0, [gamma0, beta0,] W1, b1, [gamma1, beta1,] ... W_out, b_out``.
* Dropout and batch-norm batch statistics are used only when ``training=True``.
  Dropout is "inverted": kept activations are scaled by 1/(1-rate) so no rescaling is needed at inference.
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Sequence

import numpy as np

# ---------------------------------------------------------------- activations
SELU_ALPHA = 1.6732632423543772
SELU_SCALE = 1.0507009873554805
LEAKY_ALPHA = 0.01
ELU_ALPHA = 1.0


def sigmoid(z: np.ndarray) -> np.ndarray:
    """Overflow-free logistic function."""
    e = np.exp(-np.abs(z))
    return np.where(z >= 0, 1.0 / (1.0 + e), e / (1.0 + e))


def tanh(z):
    return np.tanh(z)


def relu(z):
    return np.maximum(z, 0.0)


def leaky_relu(z):
    return np.where(z > 0, z, LEAKY_ALPHA * z)


def elu(z):
    return np.where(z > 0, z, ELU_ALPHA * (np.exp(np.minimum(z, 0.0)) - 1.0))


def selu(z):
    return SELU_SCALE * np.where(z > 0, z, SELU_ALPHA * (np.exp(np.minimum(z, 0.0)) - 1.0))


def softplus(z):
    return np.log1p(np.exp(-np.abs(z))) + np.maximum(z, 0.0)


def silu(z):
    return z * sigmoid(z)


# derivative expressed with the pre-activation z and the activation a
def _d_sigmoid(z, a):
    return a * (1.0 - a)


def _d_tanh(z, a):
    return 1.0 - a * a


def _d_relu(z, a):
    return (z > 0.0).astype(z.dtype)


def _d_leaky(z, a):
    return np.where(z > 0, 1.0, LEAKY_ALPHA)


def _d_elu(z, a):
    return np.where(z > 0, 1.0, a + ELU_ALPHA)


def _d_selu(z, a):
    return np.where(z > 0, SELU_SCALE, a + SELU_SCALE * SELU_ALPHA)


def _d_softplus(z, a):
    return sigmoid(z)


def _d_silu(z, a):
    s = sigmoid(z)
    return s * (1.0 + z * (1.0 - s))


ACTIVATIONS = {
    "relu": (relu, _d_relu),
    "leaky_relu": (leaky_relu, _d_leaky),
    "elu": (elu, _d_elu),
    "selu": (selu, _d_selu),
    "sigmoid": (sigmoid, _d_sigmoid),
    "tanh": (tanh, _d_tanh),
    "softplus": (softplus, _d_softplus),
    "silu": (silu, _d_silu),
}
INITIALIZERS = ("xavier", "he", "small_normal", "zeros")
LOSSES = ("bce", "mse", "hinge")
BN_EPS = 1e-5
BN_MOMENTUM = 0.9


# ---------------------------------------------------------------------- losses
def bce_from_logits(logits: np.ndarray, y: np.ndarray) -> float:
    """Mean binary cross-entropy from logits z: max(z,0) - z*y + log(1+exp(-|z|))."""
    z = logits.reshape(-1)
    t = y.reshape(-1).astype(float)
    return float(np.mean(np.maximum(z, 0.0) - z * t + np.log1p(np.exp(-np.abs(z)))))


def binary_cross_entropy(probs: np.ndarray, y: np.ndarray, eps: float = 1e-7) -> float:
    """Mean BCE from probabilities, clipped away from 0 and 1."""
    p = np.clip(probs.reshape(-1), eps, 1.0 - eps)
    t = y.reshape(-1).astype(float)
    return float(-np.mean(t * np.log(p) + (1.0 - t) * np.log(1.0 - p)))


def loss_and_dlogits(kind: str, logits: np.ndarray, y: np.ndarray) -> tuple[float, np.ndarray]:
    """Mean data loss and its gradient wrt the logits (already divided by the batch size)."""
    z = logits.reshape(-1, 1)
    t = y.reshape(-1, 1).astype(float)
    m = z.shape[0]
    if kind == "bce":
        return bce_from_logits(z, t), (sigmoid(z) - t) / m
    if kind == "mse":  # squared error on the predicted probability (Brier score)
        p = sigmoid(z)
        return float(np.mean((p - t) ** 2)), 2.0 * (p - t) * p * (1.0 - p) / m
    if kind == "hinge":  # labels mapped to -1/+1, margin on the raw logit
        s = 2.0 * t - 1.0
        margin = 1.0 - s * z
        return float(np.mean(np.maximum(margin, 0.0))), -s * (margin > 0.0) / m
    raise ValueError(f"Unknown loss '{kind}'.")


# ------------------------------------------------------------------ the model
class NeuralNetwork:
    def __init__(
        self,
        hidden_layers: Sequence[int] = (4,),
        activation: str = "tanh",
        init: str = "xavier",
        seed: int = 0,
        n_inputs: int = 2,
        loss: str = "bce",
        l1: float = 0.0,
        l2: float = 0.0,
        dropout: float = 0.0,
        batch_norm: bool = False,
    ):
        if activation not in ACTIVATIONS:
            raise ValueError(f"Unknown activation '{activation}'.")
        if init not in INITIALIZERS:
            raise ValueError(f"Unknown initializer '{init}'.")
        if loss not in LOSSES:
            raise ValueError(f"Unknown loss '{loss}'.")
        if not 0.0 <= dropout < 1.0:
            raise ValueError("dropout must be in [0, 1).")
        if l1 < 0 or l2 < 0:
            raise ValueError("l1 and l2 must be non-negative.")
        self.layer_sizes = [n_inputs, *[int(h) for h in hidden_layers], 1]
        self.activation_name = activation
        self.init_name = init
        self.loss_name = loss
        self.seed = seed
        self.l1, self.l2 = float(l1), float(l2)
        self.dropout = float(dropout)
        self.batch_norm = bool(batch_norm)
        self._act, self._dact = ACTIVATIONS[activation]
        self.W: list[np.ndarray] = []
        self.b: list[np.ndarray] = []
        self.gamma: list[np.ndarray] = []  # only for hidden layers when batch_norm
        self.beta: list[np.ndarray] = []
        self.run_mean: list[np.ndarray] = []
        self.run_var: list[np.ndarray] = []
        self.initialize()

    # -- parameters ---------------------------------------------------------
    def initialize(self) -> None:
        rng = np.random.default_rng(self.seed)
        self.W, self.b, self.gamma, self.beta, self.run_mean, self.run_var = [], [], [], [], [], []
        n_layers = len(self.layer_sizes) - 1
        for l, (n_in, n_out) in enumerate(zip(self.layer_sizes[:-1], self.layer_sizes[1:])):
            if self.init_name == "xavier":
                limit = np.sqrt(6.0 / (n_in + n_out))
                w = rng.uniform(-limit, limit, size=(n_in, n_out))
            elif self.init_name == "he":
                w = rng.normal(0.0, np.sqrt(2.0 / n_in), size=(n_in, n_out))
            elif self.init_name == "small_normal":
                w = rng.normal(0.0, 0.1, size=(n_in, n_out))
            else:
                w = np.zeros((n_in, n_out))
            self.W.append(w)
            self.b.append(np.zeros((1, n_out)))
            if self.batch_norm and l < n_layers - 1:
                self.gamma.append(np.ones((1, n_out)))
                self.beta.append(np.zeros((1, n_out)))
                self.run_mean.append(np.zeros((1, n_out)))
                self.run_var.append(np.ones((1, n_out)))

    def _has_bn(self, l: int) -> bool:
        return self.batch_norm and l < len(self.W) - 1

    @property
    def params(self) -> list[np.ndarray]:
        """Flat list of the live trainable arrays (not copies); see the module docstring for the order."""
        out: list[np.ndarray] = []
        for l in range(len(self.W)):
            out.extend([self.W[l], self.b[l]])
            if self._has_bn(l):
                out.extend([self.gamma[l], self.beta[l]])
        return out

    def param_index(self, l: int) -> dict[str, int]:
        """Positions of layer ``l``'s arrays inside ``params`` / the gradient list."""
        i = 0
        for k in range(l):
            i += 4 if self._has_bn(k) else 2
        idx = {"W": i, "b": i + 1}
        if self._has_bn(l):
            idx.update({"gamma": i + 2, "beta": i + 3})
        return idx

    def n_parameters(self) -> int:
        """Trainable parameters (weights, biases and, with batch norm, gamma/beta)."""
        return int(sum(p.size for p in self.params))

    def n_non_trainable(self) -> int:
        return int(sum(a.size for a in self.run_mean + self.run_var))

    def param_norm(self) -> float:
        return float(np.sqrt(sum(float(np.sum(p * p)) for p in self.params)))

    def get_state(self) -> dict:
        return {
            "params": [p.copy() for p in self.params],
            "run_mean": [a.copy() for a in self.run_mean],
            "run_var": [a.copy() for a in self.run_var],
        }

    def set_state(self, state: dict) -> None:
        for p, s in zip(self.params, state["params"]):
            p[...] = s
        for a, s in zip(self.run_mean, state["run_mean"]):
            a[...] = s
        for a, s in zip(self.run_var, state["run_var"]):
            a[...] = s

    # -- forward ------------------------------------------------------------
    def forward(self, X: np.ndarray, training: bool = False, rng: np.random.Generator | None = None):
        """Return ``(logits, cache)``.

        ``training=True`` enables dropout (needs ``rng``) and batch statistics for batch norm
        (updating the running statistics); ``training=False`` is deterministic inference.
        """
        if training and self.dropout > 0 and rng is None:
            raise ValueError("training-mode forward with dropout needs an rng.")
        a = np.asarray(X, dtype=float)
        layers = []
        activations = [a]
        n_layers = len(self.W)
        for l in range(n_layers):
            z = a @ self.W[l] + self.b[l]
            info: dict = {"a_prev": a, "z": z}
            if l == n_layers - 1:
                layers.append(info)
                activations.append(z)
                logits = z
                break
            u = z
            if self._has_bn(l):
                if training:
                    mu = z.mean(axis=0, keepdims=True)
                    var = z.var(axis=0, keepdims=True)
                    self.run_mean[l] = BN_MOMENTUM * self.run_mean[l] + (1 - BN_MOMENTUM) * mu
                    self.run_var[l] = BN_MOMENTUM * self.run_var[l] + (1 - BN_MOMENTUM) * var
                else:
                    mu, var = self.run_mean[l], self.run_var[l]
                inv = 1.0 / np.sqrt(var + BN_EPS)
                zhat = (z - mu) * inv
                u = self.gamma[l] * zhat + self.beta[l]
                info.update(zhat=zhat, inv=inv, bn_train=training)
            info["u"] = u
            a = self._act(u)
            info["act"] = a
            if training and self.dropout > 0:
                mask = (rng.random(a.shape) >= self.dropout) / (1.0 - self.dropout)  # type: ignore[union-attr]
                a = a * mask
                info["mask"] = mask
            layers.append(info)
            activations.append(a)
        return logits, {"layers": layers, "a": activations, "z": [info["z"] for info in layers]}

    def predict_proba(self, X: np.ndarray) -> np.ndarray:
        logits, _ = self.forward(X)
        return sigmoid(logits).reshape(-1)

    def predict(self, X: np.ndarray, threshold: float = 0.5) -> np.ndarray:
        return (self.predict_proba(X) >= threshold).astype(int)

    # -- loss / metrics -----------------------------------------------------
    def penalty(self) -> float:
        """Regularisation term l1*sum|W| + l2*sum W^2 (weights only, not biases / gamma / beta)."""
        if not (self.l1 or self.l2):
            return 0.0
        return float(sum(self.l1 * np.sum(np.abs(w)) + self.l2 * np.sum(w * w) for w in self.W))

    def loss(self, X: np.ndarray, y: np.ndarray) -> float:
        """Data loss (no penalty) in inference mode, using the configured loss function."""
        logits, _ = self.forward(X)
        return loss_and_dlogits(self.loss_name, logits, y)[0]

    def accuracy(self, X: np.ndarray, y: np.ndarray) -> float:
        return float(np.mean(self.predict(X) == y.reshape(-1)))

    # -- backward -----------------------------------------------------------
    def backward(self, y: np.ndarray, logits: np.ndarray, cache) -> list[np.ndarray]:
        """Backpropagation. Returns gradients aligned with ``params`` for (data loss + penalty)."""
        layers = cache["layers"]
        n_layers = len(self.W)
        _, delta = loss_and_dlogits(self.loss_name, logits, y)
        grads: list[np.ndarray] = [None] * len(self.params)  # type: ignore[list-item]
        for l in range(n_layers - 1, -1, -1):
            idx = self.param_index(l)
            info = layers[l]
            gW = info["a_prev"].T @ delta
            if self.l1:
                gW = gW + self.l1 * np.sign(self.W[l])
            if self.l2:
                gW = gW + 2.0 * self.l2 * self.W[l]
            grads[idx["W"]] = gW
            grads[idx["b"]] = delta.sum(axis=0, keepdims=True)
            if l > 0:
                da = delta @ self.W[l].T
                prev = layers[l - 1]
                if "mask" in prev:
                    da = da * prev["mask"]
                du = da * self._dact(prev["u"], prev["act"])
                if self._has_bn(l - 1):
                    g = self.gamma[l - 1]
                    grads[self.param_index(l - 1)["gamma"]] = (du * prev["zhat"]).sum(axis=0, keepdims=True)
                    grads[self.param_index(l - 1)["beta"]] = du.sum(axis=0, keepdims=True)
                    dzhat = du * g
                    if prev["bn_train"]:
                        m = du.shape[0]
                        delta = (prev["inv"] / m) * (
                            m * dzhat - dzhat.sum(axis=0, keepdims=True)
                            - prev["zhat"] * (dzhat * prev["zhat"]).sum(axis=0, keepdims=True)
                        )
                    else:  # inference-mode batch norm is a fixed affine map
                        delta = dzhat * prev["inv"]
                else:
                    delta = du
        return grads

    def gradients(self, X: np.ndarray, y: np.ndarray, training: bool = False, rng: np.random.Generator | None = None):
        """Return ``(total_loss, grads)`` where total loss = data loss + penalty."""
        logits, cache = self.forward(X, training=training, rng=rng)
        data_loss = loss_and_dlogits(self.loss_name, logits, y)[0]
        return data_loss + self.penalty(), self.backward(y, logits, cache)


# ----------------------------------------------------------------- optimizers
class _Opt:
    def __init__(self, lr: float):
        self.lr = lr

    def step(self, params: list[np.ndarray], grads: list[np.ndarray]) -> None:  # pragma: no cover
        raise NotImplementedError


class SGD(_Opt):
    """Plain SGD, optionally with momentum / Nesterov (lr folded into the velocity, as in the lecture):
    ``v = gamma*v + lr*g``; momentum: ``theta -= v``; Nesterov: ``theta -= gamma*v + lr*g``."""

    def __init__(self, lr: float, momentum: float = 0.0, nesterov: bool = False):
        super().__init__(lr)
        self.momentum, self.nesterov = momentum, nesterov
        self.v: list[np.ndarray] | None = None

    def step(self, params, grads):
        if not self.momentum:
            for p, g in zip(params, grads):
                p -= self.lr * g
            return
        if self.v is None:
            self.v = [np.zeros_like(p) for p in params]
        for p, g, v in zip(params, grads, self.v):
            v *= self.momentum
            v += self.lr * g
            p -= (self.momentum * v + self.lr * g) if self.nesterov else v


class Adagrad(_Opt):
    """``G += g^2``; ``theta -= lr * g / (sqrt(G) + eps)``.

    The lecture writes ``sqrt(G + eps)``; PyTorch (and Adam) put eps outside the root, which we follow.
    The two only differ visibly when gradients are close to zero."""

    def __init__(self, lr: float, eps: float = 1e-7):
        super().__init__(lr)
        self.eps = eps
        self.G: list[np.ndarray] | None = None

    def step(self, params, grads):
        if self.G is None:
            self.G = [np.zeros_like(p) for p in params]
        for p, g, G in zip(params, grads, self.G):
            G += g * g
            p -= self.lr * g / (np.sqrt(G) + self.eps)


class RMSprop(_Opt):
    """``v = rho*v + (1-rho)*g^2``; ``theta -= lr * g / (sqrt(v) + eps)`` (eps outside the root, as in PyTorch)."""

    def __init__(self, lr: float, rho: float = 0.9, eps: float = 1e-7):
        super().__init__(lr)
        self.rho, self.eps = rho, eps
        self.v: list[np.ndarray] | None = None

    def step(self, params, grads):
        if self.v is None:
            self.v = [np.zeros_like(p) for p in params]
        for p, g, v in zip(params, grads, self.v):
            v *= self.rho
            v += (1.0 - self.rho) * g * g
            p -= self.lr * g / (np.sqrt(v) + self.eps)


class Adadelta(_Opt):
    """Ratio of RMS(previous updates) to RMS(gradients); ``lr`` only rescales the step (designed for 1.0)."""

    def __init__(self, lr: float, rho: float = 0.95, eps: float = 1e-6):
        super().__init__(lr)
        self.rho, self.eps = rho, eps
        self.eg: list[np.ndarray] | None = None
        self.ed: list[np.ndarray] | None = None

    def step(self, params, grads):
        if self.eg is None or self.ed is None:
            self.eg = [np.zeros_like(p) for p in params]
            self.ed = [np.zeros_like(p) for p in params]
        for p, g, eg, ed in zip(params, grads, self.eg, self.ed):
            eg *= self.rho
            eg += (1.0 - self.rho) * g * g
            delta = -np.sqrt(ed + self.eps) / np.sqrt(eg + self.eps) * g
            ed *= self.rho
            ed += (1.0 - self.rho) * delta * delta
            p += self.lr * delta


class Adam(_Opt):
    def __init__(self, lr: float, beta1: float = 0.9, beta2: float = 0.999, eps: float = 1e-8):
        super().__init__(lr)
        self.beta1, self.beta2, self.eps = beta1, beta2, eps
        self.t = 0
        self.m: list[np.ndarray] | None = None
        self.v: list[np.ndarray] | None = None

    def step(self, params, grads):
        if self.m is None or self.v is None:
            self.m = [np.zeros_like(p) for p in params]
            self.v = [np.zeros_like(p) for p in params]
        self.t += 1
        for p, g, m, v in zip(params, grads, self.m, self.v):
            m *= self.beta1
            m += (1.0 - self.beta1) * g
            v *= self.beta2
            v += (1.0 - self.beta2) * g * g
            m_hat = m / (1.0 - self.beta1**self.t)
            v_hat = v / (1.0 - self.beta2**self.t)
            p -= self.lr * m_hat / (np.sqrt(v_hat) + self.eps)


class Nadam(Adam):
    """Adam with a Nesterov look-ahead: ``theta -= lr/(sqrt(v_hat)+eps) * (beta1*m_hat + (1-beta1)/(1-beta1^t)*g)``."""

    def step(self, params, grads):
        if self.m is None or self.v is None:
            self.m = [np.zeros_like(p) for p in params]
            self.v = [np.zeros_like(p) for p in params]
        self.t += 1
        for p, g, m, v in zip(params, grads, self.m, self.v):
            m *= self.beta1
            m += (1.0 - self.beta1) * g
            v *= self.beta2
            v += (1.0 - self.beta2) * g * g
            m_hat = m / (1.0 - self.beta1**self.t)
            v_hat = v / (1.0 - self.beta2**self.t)
            look = self.beta1 * m_hat + (1.0 - self.beta1) / (1.0 - self.beta1**self.t) * g
            p -= self.lr * look / (np.sqrt(v_hat) + self.eps)


OPTIMIZERS = ("sgd", "momentum", "nesterov", "adagrad", "rmsprop", "adadelta", "adam", "nadam")


def make_optimizer(name: str, lr: float):
    if name == "sgd":
        return SGD(lr)
    if name == "momentum":
        return SGD(lr, momentum=0.9)
    if name == "nesterov":
        return SGD(lr, momentum=0.9, nesterov=True)
    if name == "adagrad":
        return Adagrad(lr)
    if name == "rmsprop":
        return RMSprop(lr)
    if name == "adadelta":
        return Adadelta(lr)
    if name == "adam":
        return Adam(lr)
    if name == "nadam":
        return Nadam(lr)
    raise ValueError(f"Unknown optimizer '{name}'.")


def flatten(arrays: Sequence[np.ndarray]) -> np.ndarray:
    return np.concatenate([a.reshape(-1) for a in arrays]) if arrays else np.zeros(0)


def batch_indices(n: int, batch_size: int, rng: np.random.Generator, batch_norm: bool = False):
    """Shuffled mini-batches covering one epoch. With batch norm a trailing batch of one sample is dropped."""
    order = rng.permutation(n)
    for start in range(0, n, batch_size):
        idx = order[start : start + batch_size]
        if batch_norm and len(idx) < 2:
            continue
        yield idx


@dataclass
class StepResult:
    loss: float
    grad_norm: float


def train_step(net: NeuralNetwork, opt, X: np.ndarray, y: np.ndarray, rng: np.random.Generator | None = None) -> StepResult:
    """One mini-batch iteration in training mode: forward, backward, optimizer update (in place)."""
    loss, grads = net.gradients(X, y, training=True, rng=rng)
    opt.step(net.params, grads)
    return StepResult(loss, float(np.sqrt(sum(float(np.sum(g * g)) for g in grads))))
