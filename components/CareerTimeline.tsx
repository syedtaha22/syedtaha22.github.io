import { TIMELINE } from "@/lib/cv";

/**
 * A vertical timeline of education and experience, newest first. Entries
 * alternate sides of a line down the middle. Narrow screens show a single
 * column with the line at the left edge.
 */
export default function CareerTimeline() {
  return (
    <ol className="timeline">
      {TIMELINE.map((entry) => (
        <li key={`${entry.period}-${entry.title}`} className="timeline-item">
          <span
            className={entry.current ? "timeline-dot is-current" : "timeline-dot"}
            aria-hidden="true"
          />
          <p className="timeline-period">{entry.period}</p>
          <h3>{entry.title}</h3>
          <p className="timeline-org">
            {entry.org}
            <span>{entry.place}</span>
          </p>
          <p className="timeline-summary">{entry.summary}</p>
        </li>
      ))}
    </ol>
  );
}
