export type Project = {
  title: string;
  meta: string;
  body: string;
  link?: { href: string; label: string };
};

export const PROJECTS: Project[] = [
  {
    title: "PiSSM",
    meta: "Python, PyTorch, gRPC, FastAPI, React",
    body: "A distributed inference system for state space models that pools six Raspberry Pi 5 boards (24 GB combined memory, $1,530) into one cluster. An orchestrator tracks live workers and splits a model's layers into shards; each worker loads only its slice and passes activations to the next over gRPC. It runs Mamba-based language models that no single 4 GB board can hold, on a two-node pipeline at 1.1 to 1.2x the generation latency of a single node.",
    link: { href: "https://github.com/syedtaha22/PiSSM", label: "View on GitHub →" },
  },
  {
    title: "Project GLIDE",
    meta: "Python, PyTorch",
    body: "Our final year project on guidance and localisation in denied environments. Can a drone carrying only a 3-axis magnetometer navigate by the Earth's magnetic field when GPS is unavailable? We are researching this in a physics-informed simulator, where a small S4D state space model pilots the drone in closed loop, and collecting our own ground surveys of the field.",
    link: { href: "https://github.com/Project-GLIDE", label: "View on GitHub →" },
  },
  {
    title: "LLM Inference in xv6",
    meta: "C, xv6 kernel",
    body: "Could a modern LLM inference engine run on a minimal educational OS? A POSIX-compliant shared-memory subsystem for the xv6 kernel caches model weights (~100MB) without redundant transfers; custom threading primitives, built from scratch, parallelize the inference engine itself. End result: 16.2 tokens/sec, up from ~7.",
    link: { href: "https://github.com/syedtaha22/xv6-llm-book", label: "Read the book →" },
  },
  {
    title: "Othello AI with MCTS and CNNs",
    meta: "Python, PyTorch",
    body: "An AlphaZero-style Othello engine: Monte Carlo Tree Search guided by a CNN trained through self-play, then distilled into a smaller model for deployment. The model went from 85MB to 42.66MB (50% smaller) and became 10× faster per move (1000ms → 100ms), with a win rate over 90% against the larger baseline. Playable in the browser.",
    link: { href: "https://site-zeta-rust-98.vercel.app/playground/othello", label: "Play it →" },
  },
  {
    title: "OctaC",
    meta: "C++, Python",
    body: "A compiler for OctaC, a statically typed, C-structured language for numerical and matrix computation, with built-in vector and matrix types and operators such as transpose and element-wise multiply. The DFA-driven lexer and the parser are done and covered by a pytest suite; semantic analysis and code generation come next.",
    link: { href: "https://github.com/Octa-C/compiler", label: "View on GitHub →" },
  },
  {
    title: "Pariah: GNN-Transformer Intrusion Detection",
    meta: "Python, PyTorch",
    body: "A systematization-of-knowledge study of GNN-Transformer hybrids for network intrusion detection under distribution shift: a taxonomy of graph-based detectors, a reproducible NetFlow benchmark with documented environment splits, and controlled tests of invariance objectives against tuned ERM and Group DRO. Research in progress.",
    link: { href: "https://github.com/syedtaha22/pariah", label: "View on GitHub →" },
  },
  {
    title: "Kaggle: Safe Driver Prediction, 1st Place",
    meta: "Python, XGBoost, LightGBM, CatBoost",
    body: "A stacking ensemble of XGBoost, LightGBM, and CatBoost with a logistic regression meta-learner, combined with preprocessing for extensive missing data and non-predictive features. Finished 1st on imbalanced tabular data (Private Leaderboard AUROC: 0.64671).",
    link: { href: "/blog/enhanched-safe-drive-prediction/", label: "Read the write-up →" },
  },
];
