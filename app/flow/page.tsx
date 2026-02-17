import type { Metadata } from "next";
import Link from "next/link";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "The factory flow",
  description:
    "Most factories follow the same path: receiving, incoming quality, warehouse, kitting, production, packing, shipping. See every step from goods in to goods out — and what we ask about each.",
  openGraph: {
    title: "The factory flow | Factory Truth",
    description:
      "From receiving to shipping: the steps every factory follows, and what we ask so you can compare.",
    url: "/flow",
  },
};

const FLOW_STEPS = [
  {
    letter: "A",
    title: "Receiving",
    desc: "Goods arrive at the dock. How they’re unloaded, how long they sit, and how temperature and humidity are controlled set the stage for everything that follows.",
  },
  {
    letter: "B",
    title: "Incoming quality (IQC)",
    desc: "Before anything goes into storage, materials are checked. Quality management systems, defect rates, and certifications (e.g. ISO 9001) show how seriously a factory takes incoming quality.",
  },
  {
    letter: "C",
    title: "Incoming warehouse",
    desc: "Approved materials are stored — often with strict control of high-value or sensitive parts. How items are tracked, picked, and put back (e.g. PLM, FIFO) matters for traceability and mix-ups.",
  },
  {
    letter: "D",
    title: "Kitting",
    desc: "Parts are gathered and prepared for the line: the right components, labels, and transport bins so each station has what it needs. Lean and labelling discipline show up here.",
  },
  {
    letter: "E",
    title: "Fabrication",
    desc: "Subassemblies and parts are made in-house — machining, forming, or other processes. Why certain things are made (and how) reflects engineering and capacity choices.",
  },
  {
    letter: "F",
    title: "Production",
    desc: "The main assembly: injection molding, stamping, PCB assembly, final assembly. SOPs, training, in-line and end-of-line testing, and how changes (ECRs) are handled define how consistent the output is.",
  },
  {
    letter: "G",
    title: "In-process inventory",
    desc: "Between stations, work-in-progress is buffered. How much sits where and how it’s controlled affects lead time, defects, and traceability.",
  },
  {
    letter: "H",
    title: "Packing",
    desc: "Finished units are packed — by hand or automation — with whatever humidity and environmental controls the product needs before storage or shipment.",
  },
  {
    letter: "I",
    title: "Finished goods inventory",
    desc: "Boxed products wait for shipment. Temperature and humidity control, location, and how long they sit influence quality and delivery reliability.",
  },
  {
    letter: "J",
    title: "Shipping",
    desc: "Out the door: how orders are picked, documented, and shipped, and what controls exist so the right product reaches the right place on time.",
  },
];

const ALONG_THE_WAY = [
  { title: "Quality assurance (QA)", short: "How defects are found, handled, and prevented; OQC, test equipment, calibration." },
  { title: "Rework", short: "When something doesn’t pass, how it’s fixed, documented, and controlled." },
  { title: "Quarantine", short: "How non-conforming or suspect material is isolated and managed so it doesn’t mix with good product." },
  { title: "Sourcing & sub-suppliers", short: "Who supplies the factory, how they get on the approved list, and how quality is assured when buying from the market." },
  { title: "Project management & NPI", short: "How new products are introduced, with stage-gates, R&D, and quality planning (e.g. APQP)." },
  { title: "SOPs & training", short: "How work is documented, trained, and kept up to date so the line runs the same way every day." },
  { title: "Sustainability", short: "Waste, energy, environmental and social certifications (e.g. ISO 14000, 45001), and how the factory improves over time." },
];

export default function FlowPage() {
  return (
    <main className={styles.flowPage}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand}>
          Factory Truth
        </Link>
        <nav className={styles.nav}>
          <Link href="/flow" className={styles.navCurrent}>The factory flow</Link>
          <Link href="/factories" className={`${styles.navLink} zh`}>工厂入口</Link>
          <Link href="/entrepreneurs" className={styles.navLink}>For entrepreneurs</Link>
        </nav>
      </header>

      <article className={styles.article}>
        <h1 className={styles.title}>The factory flow</h1>
        <p className={styles.lead}>
          Most factories follow a similar path: goods come in, get checked, stored, turned into product, and go back out. The details at each step — how long things sit, how quality is checked, how the line is run — are what separate a reliable partner from the rest.
        </p>
        <p className={styles.intro}>
          Below is that path from incoming goods to outgoing goods, plus the main steps in between. On Factory Truth, we ask factories the same questions about each step so you can compare what actually happens, not just what’s on paper.
        </p>

        <ol className={styles.stepsList}>
          {FLOW_STEPS.map((step) => (
            <li key={step.letter} className={styles.step}>
              <span className={styles.stepLetter}>{step.letter}</span>
              <div>
                <h2 className={styles.stepTitle}>{step.title}</h2>
                <p className={styles.stepDesc}>{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>

        <section className={styles.extra}>
          <h2 className={styles.extraTitle}>Along the way</h2>
          <p className={styles.extraIntro}>
            Quality, rework, quarantine, sourcing, and how new products are launched don’t sit in one box — they cut across the flow. Factories that do these well tend to be easier to work with and more predictable.
          </p>
          <ul className={styles.extraList}>
            {ALONG_THE_WAY.map((item) => (
              <li key={item.title} className={styles.extraItem}>
                <strong>{item.title}</strong> — {item.short}
              </li>
            ))}
          </ul>
        </section>

        <p className={styles.cta}>
          <Link href="/entrepreneurs" className={styles.ctaLink}>
            Browse factories and see how they answer for each step →
          </Link>
        </p>
      </article>

      <footer className={styles.footer}>
        <Link href="/">← Home</Link>
        <span>Factory Truth</span>
      </footer>
    </main>
  );
}
