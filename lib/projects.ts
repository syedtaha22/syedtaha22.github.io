export type Project = {
  title: string;
  meta: string;
  body: string;
  link?: { href: string; label: string };
};

export const PROJECTS: Project[] = [
  {
    title: "PiSSM",
    meta: "Active development · Python, gRPC, FastAPI, React",
    body: "A distributed inference system for state space models (Mamba, S4) and small LLMs across a 6-node Raspberry Pi 5 cluster. Handles node discovery, model sharding, and pipeline-parallel execution transparently: each Pi runs a daemon that broadcasts presence, while an orchestrator maintains a live node registry and dispatches work over gRPC. Accessible through a Textual TUI and a React WebUI.",
    link: { href: "https://github.com/syedtaha22/PiSSM", label: "View on GitHub →" },
  },
  {
    title: "Othello AI with MCTS and CNNs",
    meta: "C++, PyTorch",
    body: "Monte Carlo Tree Search combined with a CNN for board evaluation and move prediction. Most of the effort went into trimming the model, from 85MB to 42.66MB (50% smaller), while making it 10× faster per move (1000ms → 100ms) and keeping a >90% win rate against the larger baseline.",
  },
  {
    title: "LLM Inference in xv6",
    meta: "C, xv6 kernel",
    body: "Could a modern LLM inference engine run on a minimal educational OS? A POSIX-compliant shared-memory subsystem for the xv6 kernel caches model weights (~100MB) without redundant transfers; custom threading primitives, built from scratch, parallelize the inference engine itself. End result: 16.2 tokens/sec, up from ~7.",
    link: { href: "https://github.com/syedtaha22/xv6-llm-book", label: "Read the book →" },
  },
  {
    title: "Kaggle: Safe Driver Prediction, 1st Place",
    meta: "Python, XGBoost, LightGBM, CatBoost",
    body: "A stacking ensemble of XGBoost, LightGBM, and CatBoost with a logistic regression meta-learner, combined with preprocessing for extensive missing data and non-predictive features. Finished 1st on imbalanced tabular data (Private Leaderboard AUROC: 0.64671).",
    link: { href: "/blog/enhanched-safe-drive-prediction/", label: "Read the write-up →" },
  },
  {
    title: "2D Physics & Orbital Mechanics Engine",
    meta: "C++, SFML",
    body: "A modular 2D physics engine from scratch in C++ (rigid body dynamics, velocity-based movement, AABB collision detection), extended into an orbital mechanics simulation for gravitational N-body interactions via numerical integration, with a real-time SFML visualization layer.",
    link: { href: "https://github.com/syedtaha22/Physics-Engine/", label: "View on GitHub →" },
  },
];
