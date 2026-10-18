import numpy as np
import pytest

from app.datasets import generate_dataset


@pytest.mark.parametrize("name", ["xor", "moons", "circles", "linear"])
def test_shapes_labels_and_reproducibility(name):
    x, y = generate_dataset(name, 100, 0.1, 5)
    assert x.shape == (100, 2) and y.shape == (100,)
    assert set(np.unique(y)) == {0, 1}
    x2, y2 = generate_dataset(name, 100, 0.1, 5)
    assert np.array_equal(x, x2) and np.array_equal(y, y2)
    x3, _ = generate_dataset(name, 100, 0.1, 6)
    assert not np.array_equal(x, x3)
    assert np.abs(x).max() < 3.0


def test_unknown_dataset():
    with pytest.raises(ValueError):
        generate_dataset("nope", 10, 0.1, 0)
