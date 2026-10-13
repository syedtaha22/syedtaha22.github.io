export type TimelineEntry = {
  period: string;
  title: string;
  org: string;
  place: string;
  summary: string;
  current?: boolean;
};

/** Newest first. The full detail is in the downloadable CV. */
export const TIMELINE: TimelineEntry[] = [
  {
    period: "Expected May 2027",
    title: "BS in Computer Science",
    org: "Institute of Business Administration (IBA)",
    place: "Karachi, Pakistan",
    summary: "GPA 3.53 / 4.0.",
    current: true,
  },
  {
    period: "Aug 2026 - Sep 2026",
    title: "Data Science Intern",
    org: "Foretheta, LLC",
    place: "Seattle, WA (Remote)",
    summary:
      "Fixed data-deduplication bugs in a search reranking pipeline, built a statistical " +
      "evaluation framework for comparing ranking variants with paired bootstrap confidence " +
      "intervals, and compared alternative machine learning models for a retrieval task.",
  },
  {
    period: "Jul 2026 - Present",
    title: "Founding Member and Researcher",
    org: "Systems Research @ IBA",
    place: "Karachi, Pakistan",
    summary:
      "Research on systems for ML inference, including PiSSM, a distributed state space " +
      "model inference system on a Raspberry Pi 5 cluster, and an AlphaZero-style Othello " +
      "engine. Created the group's website and GitHub organization.",
    current: true,
  },
  {
    period: "Aug 2024 - Present",
    title: "Teaching Assistant",
    org: "Institute of Business Administration",
    place: "Karachi, Pakistan",
    summary:
      "Weekly C++ labs for 100+ students across Introduction to Programming and OOP, " +
      "Computer Architecture and Operating Systems. Supervised student projects from " +
      "RISC-V assembly to extensions of the xv6 LLM runtime, and graded assessments.",
    current: true,
  },
  {
    period: "Jul 2024 - Sep 2024",
    title: "Software Engineering Fellow",
    org: "Headstarter AI",
    place: "Long Island City, NY (Remote)",
    summary:
      "Delivered 5 AI-powered web apps in 5 weeks with React and Next.js under weekly " +
      "agile sprints, including a customer-support agent with a custom OpenAI and " +
      "Pinecone RAG pipeline and an IBA teacher-review portal.",
  },
];
