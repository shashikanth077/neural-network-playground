/* Recorded numbers from the team repository: code/results/summary_table.csv, study_guide/data.json (tokenisation) and study_guide/overview/data.json (distilgpt2 next-word probabilities). */
export const RECORDED = {
 "tokenisation": [
  {
   "word": "unwatchable",
   "pieces": [
    "un",
    "##watch",
    "##able"
   ]
  },
  {
   "word": "heavy-handed",
   "pieces": [
    "heavy",
    "-",
    "handed"
   ]
  },
  {
   "word": "perilously",
   "pieces": [
    "per",
    "##ilo",
    "##usly"
   ]
  },
  {
   "word": "unflinchingly",
   "pieces": [
    "un",
    "##fl",
    "##in",
    "##ching",
    "##ly"
   ]
  },
  {
   "word": "entertaining",
   "pieces": [
    "entertaining"
   ]
  },
  {
   "word": "Transformers",
   "pieces": [
    "transformers"
   ]
  },
  {
   "word": "Vilnius",
   "pieces": [
    "vilnius"
   ]
  },
  {
   "word": "ChatGPT",
   "pieces": [
    "chat",
    "##gp",
    "##t"
   ]
  }
 ],
 "lm": [
  {
   "prompt": "In India, people drink a cup of hot",
   "top": [
    [
     " water",
     0.48148
    ],
    [
     " tea",
     0.17747
    ],
    [
     " coffee",
     0.06302
    ],
    [
     " milk",
     0.04451
    ],
    [
     " chocolate",
     0.04075
    ]
   ]
  },
  {
   "prompt": "Thank you very much for your",
   "top": [
    [
     " support",
     0.40274
    ],
    [
     " help",
     0.06388
    ],
    [
     " continued",
     0.03252
    ],
    [
     " time",
     0.02621
    ],
    [
     " feedback",
     0.0141
    ]
   ]
  },
  {
   "prompt": "The monsoon arrives in Kerala in the month of",
   "top": [
    [
     " May",
     0.10398
    ],
    [
     " December",
     0.09622
    ],
    [
     " August",
     0.08306
    ],
    [
     " June",
     0.0733
    ],
    [
     " July",
     0.07268
    ]
   ]
  }
 ],
 "lmModel": {
  "name": "distilgpt2",
  "params": 81912576
 },
 "models": [
  {
   "name": "BERT-tiny fine-tuned (8k)",
   "family": "transformer-finetuned",
   "trainSize": 8000,
   "params": 4386178,
   "acc": 76.6
  },
  {
   "name": "Zero-shot NLI DistilRoBERTa",
   "family": "transformer-zero-shot",
   "trainSize": 0,
   "params": 82120707,
   "acc": 81.8
  },
  {
   "name": "TF-IDF + Logistic Regr.",
   "family": "classical",
   "trainSize": 65349,
   "params": 73556,
   "acc": 81.9
  },
  {
   "name": "TF-IDF + Naive Bayes",
   "family": "classical",
   "trainSize": 65349,
   "params": 147112,
   "acc": 82.2
  },
  {
   "name": "BiLSTM (from scratch)",
   "family": "recurrent",
   "trainSize": 65349,
   "params": 1974786,
   "acc": 82.8
  },
  {
   "name": "TF-IDF + Linear SVM",
   "family": "classical",
   "trainSize": 65349,
   "params": 73556,
   "acc": 82.9
  },
  {
   "name": "BERT-small fine-tuned (8k)",
   "family": "transformer-finetuned",
   "trainSize": 8000,
   "params": 28764674,
   "acc": 83.7
  },
  {
   "name": "Twitter-RoBERTa (off-the-shelf)",
   "family": "transformer-pretrained",
   "trainSize": 0,
   "params": 124647939,
   "acc": 85.8
  },
  {
   "name": "DistilBERT fine-tuned (8k)",
   "family": "transformer-finetuned",
   "trainSize": 8000,
   "params": 66955010,
   "acc": 88.8
  },
  {
   "name": "DistilBERT-SST2 (off-the-shelf)",
   "family": "transformer-pretrained",
   "trainSize": 0,
   "params": 66955010,
   "acc": 91.1
  }
 ]
} as const;
