# Lab 2 · Keras homework script

`lab2.py` is the Lab 2 homework code (CNN on MNIST and text models on IMDB), extracted from the
uploaded `Lab2_Visual_Guide.html`. Each `# %%` cell is one step of the guide's code walkthrough.

## Run it

```bash
python3.12 -m venv .venv-lab2 && . .venv-lab2/bin/activate
pip install tensorflow-cpu pandas matplotlib pillow     # CPU build; 3.13 wheels were not available here
mkdir -p handwritten && cp /path/to/your/photos/digit7.png handwritten/   # file name digitN.png, N = true digit
cd scripts/lab2 && python lab2.py
```

Outputs go to `results/` (plots and `summary.json`). The script downloads MNIST and IMDB on first run.

## Notes

* Expect a long CPU run (the full set of CNN and text experiments takes tens of minutes).
* The `handwritten/` folder is not in the repo: put your own digit photos there.
* The numbers in the browser's Lab 2 pages are the recorded results of the homework run; this script
  reproduces them on your machine (values can differ slightly between hardware).
