import type { Metadata } from "next";
import Link from "next/link";
import { GitHubIcon, InstagramIcon, LinkedInIcon } from "@/components/icons";

const DESCRIPTION =
  "Computer Science student at IBA Karachi, working on systems programming, machine learning, and low-level optimization.";

export const metadata: Metadata = {
  title: { absolute: "Syed Taha" },
  description: `Syed Taha, ${DESCRIPTION}`,
  keywords:
    "Syed Taha, IBA Karachi, computer science, systems programming, RISC-V, machine learning, LLM inference",
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    title: "Syed Taha",
    description: DESCRIPTION,
    url: "/",
  },
};

export default function HomePage() {
  return (
    <main className="wrap">
      <section className="hero">
        <div>
          <p className="eyebrow">Computer Science · IBA Karachi</p>
          <h1>Syed Taha</h1>
          <p className="tagline">Systems programming &amp; machine learning, close to the hardware.</p>
          <p className="prose">
            I like working close to the hardware, where systems programming and machine learning
            meet the real constraints of the machine actually running them.
          </p>

          <p className="status-line">
            <span>Karachi, Pakistan</span>
            <span>TA @ IBA</span>
            <span>Open to research collaborations</span>
          </p>

          <div className="cta-row">
            <a href="#cv" className="btn btn-fill">
              View CV
            </a>
            <Link href="/projects/" className="btn btn-outline">
              See projects
            </Link>
          </div>

          <div className="social-row">
            <span className="label">Find me on</span>
            <a href="https://github.com/syedtaha22" aria-label="GitHub">
              <GitHubIcon />
            </a>
            <a href="https://www.linkedin.com/in/syetaha/" aria-label="LinkedIn">
              <LinkedInIcon />
            </a>
            <a href="https://www.instagram.com/syedtaha22/" aria-label="Instagram">
              <InstagramIcon />
            </a>
          </div>
        </div>

        <div className="portrait">
          <img src="/images/syedtaha.webp" alt="Portrait of Syed Taha" width={1007} height={1007} />
        </div>
      </section>

      <section className="block about-grid">
        <div>
          <p className="eyebrow">About</p>
          <div className="prose">
            <p>
              I&apos;m a CS student at IBA Karachi with a standing interest in systems programming,
              high-performance computing, and machine learning, particularly where they intersect
              at the hardware level. I&apos;m also a founding member of{" "}
              <a href="https://site-zeta-rust-98.vercel.app/">Systems Research @ IBA</a>, a student
              research group.
              For what I&apos;m working on right now, see the{" "}
              <Link href="/projects/">projects page</Link>.
            </p>
            <p>
              I currently TA at IBA. I previously worked as a data science intern at Foretheta and as
              a Software Engineering Fellow at{" "}
              <a href="https://www.headstarter.co/">Headstarter AI</a>. Outside of coursework I do
              photography, 3D work in Blender, and some informal tutoring. I write about the
              technical side of things on the <Link href="/blog/">blog</Link>.
            </p>
          </div>
        </div>
        <dl className="facts">
          <div>
            <dt>Affiliation</dt>
            <dd>IBA Karachi, Computer Science</dd>
          </div>
          <div>
            <dt>Interests</dt>
            <dd>Systems programming, ML, HPC, RISC-V</dd>
          </div>
          <div>
            <dt>Involvement</dt>
            <dd>
              TA @ IBA · Systems Research @ IBA
              <br />
              Formerly: Data Science Intern @ Foretheta · Software Engineering Fellow @ Headstarter
              AI
            </dd>
          </div>
          <div>
            <dt>Elsewhere</dt>
            <dd>
              <a href="https://www.instagram.com/syedtaha22/">Photography on Instagram</a>
            </dd>
          </div>
        </dl>
      </section>

      <section className="block" id="cv">
        <p className="eyebrow">Curriculum Vitae</p>
        <h2>CV</h2>
        <p className="prose" style={{ marginBottom: "1.6rem" }}>
          Education, projects, experience, and coursework, kept reasonably up to date.{" "}
          <a href="/cv.pdf" download>
            Download the PDF
          </a>{" "}
          if it doesn&apos;t render below.
        </p>
        <iframe src="/cv.pdf#pagemode=none&navpanes=0" className="cv-embed" title="Syed Taha, CV (PDF)" />
      </section>
    </main>
  );
}
