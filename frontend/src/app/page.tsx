"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

/* ─── Animated Headline Component ─── */
const HEADLINE_PHRASES = [
  "Clear your queries",
  "Understand the document",
  "Get instant answers",
];

function AnimatedHeadline() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"enter" | "exit">("enter");

  useEffect(() => {
    const DISPLAY_MS = 2600;
    const EXIT_MS = 400;

    const timer = setInterval(() => {
      setPhase("exit");
      setTimeout(() => {
        setIndex((prev) => (prev + 1) % HEADLINE_PHRASES.length);
        setPhase("enter");
      }, EXIT_MS);
    }, DISPLAY_MS + EXIT_MS);

    return () => clearInterval(timer);
  }, []);

  return (
    <span
      className={`inline-block ${phase === "enter" ? "headline-enter" : "headline-exit"}`}
      key={`${index}-${phase}`}
      style={{ color: "var(--accent-color)" }}
    >
      {HEADLINE_PHRASES[index]}
    </span>
  );
}

/* ─── Landing Page ─── */
export default function Home() {
  return (
    <>
      {/* ===== Hero Section ===== */}
      <section className="relative flex min-h-[calc(100vh-56px)] items-center overflow-hidden">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-16 px-6 pb-20 pt-24 lg:grid-cols-[1fr_0.72fr] lg:pb-0 lg:pt-0">
          {/* Left — Text */}
          <div>
            <p className="label animate-fade-up">AI Document Intelligence</p>

            <h1
              className="mt-6 animate-fade-up delay-100 text-foreground"
              style={{
                fontSize: "clamp(3rem, 7vw, 5.5rem)",
                fontWeight: 600,
                lineHeight: 1.08,
              }}
            >
              Your documents,
              <br />
              <AnimatedHeadline />
            </h1>

            <p className="mt-8 max-w-[520px] animate-fade-up text-muted-foreground delay-200 text-lg leading-relaxed">
              Upload a PDF, Word document, or text file. Ask anything. An
              autonomous AI agent searches, reasons, and synthesizes answers from
              your document — not just keyword matching, real understanding.
            </p>

            <div className="mt-10 flex items-center gap-4 animate-fade-up delay-300">
              <Link
                id="cta-upload"
                href="/guid"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] px-7 py-3 rounded-md transition-colors"
                style={{
                  background: "var(--accent-color)",
                  color: "#ffffff",
                }}
              >
                Upload Document
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>

              <a
                href="#how-it-works"
                className="font-mono text-xs uppercase tracking-[0.1em] px-5 py-3 rounded-md border transition-colors text-muted-foreground border-border hover:border-foreground/30 hover:text-foreground"
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Right — Code Preview */}
          <div className="animate-fade-up delay-400">
            <div className="rounded-lg overflow-hidden bg-card border border-border">
              {/* Terminal Header */}
              <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <div className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" />
                <span className="ml-3 font-mono text-xs text-muted-foreground">
                  askify-agent
                </span>
              </div>

              {/* Terminal Body */}
              <div className="p-5 font-mono text-[0.8rem] leading-relaxed space-y-3">
                <div>
                  <span className="text-muted-foreground">
                    {"// "}user query
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--accent-color)" }}>ask</span>
                  <span className="text-muted-foreground">(</span>
                  <span className="text-foreground">
                    &quot;What are the key findings in section 3?&quot;
                  </span>
                  <span className="text-muted-foreground">)</span>
                </div>

                <div className="pt-2">
                  <span className="text-muted-foreground">
                    {"// "}agent reasoning
                  </span>
                </div>
                <div className="text-muted-foreground">
                  <span style={{ color: "var(--accent-color)" }}>agent</span>
                  .search(
                  <span className="text-foreground">&quot;section 3&quot;</span>
                  , chunks: 5)
                </div>
                <div className="text-muted-foreground">
                  <span style={{ color: "var(--accent-color)" }}>agent</span>
                  .search(
                  <span className="text-foreground">
                    &quot;key findings results&quot;
                  </span>
                  , chunks: 3)
                </div>
                <div className="text-muted-foreground">
                  <span style={{ color: "var(--accent-color)" }}>agent</span>
                  .synthesize(sources: 8)
                </div>

                <div className="pt-2">
                  <span className="text-muted-foreground">
                    {"// "}response ready
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--accent-color)" }}>return</span>
                  <span className="text-muted-foreground">
                    {" "}
                    structured_answer
                  </span>
                  <span
                    className="inline-block w-1.5 h-4 ml-1 animate-pulse"
                    style={{ background: "var(--accent-color)" }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section id="features" className="py-32 lg:py-40">
        <div className="mx-auto max-w-[1200px] px-6">
          <p className="label">Capabilities</p>
          <h2
            className="mt-4 text-foreground font-semibold"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.15,
            }}
          >
            Not a chatbot.
            <br />
            An agent.
          </h2>
          <p className="mt-4 max-w-[480px] text-muted-foreground leading-relaxed">
            Askify doesn&apos;t just match keywords. It autonomously decides
            what to search, how many times to search, and how to compose an
            answer.
          </p>

          <div className="grid grid-cols-1 gap-4 mt-16 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                ),
                label: "Multi-pass Retrieval",
                title: "Autonomous search",
                description: "The agent decides how many times to search your document and which sections to pull, adapting its strategy per question.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                ),
                label: "Format Agnostic",
                title: "PDF, DOCX, TXT",
                description: "Upload any common document format. The system parses, chunks, and indexes it for semantic search automatically.",
              },
              {
                icon: (
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                ),
                label: "Reasoning Engine",
                title: "Synthesize, don't regurgitate",
                description: "Answers are composed from multiple document sections with reasoning — not just pasted text blocks.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-xl p-6 transition-all duration-200 bg-card border border-border hover:border-foreground/20 hover:-translate-y-0.5"
              >
                <div className="text-muted-foreground">{feature.icon}</div>
                <p className="label mt-5">{feature.label}</p>
                <h3 className="mt-3 text-lg font-medium text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section id="how-it-works" className="py-32 lg:py-40">
        <div className="mx-auto max-w-[1200px] px-6">
          <p className="label">Process</p>
          <h2
            className="mt-4 text-foreground font-semibold"
            style={{
              fontSize: "clamp(2rem, 4vw, 3rem)",
              lineHeight: 1.15,
            }}
          >
            Three steps.
            <br />
            Zero complexity.
          </h2>

          <div className="grid grid-cols-1 gap-px mt-16 rounded-xl overflow-hidden md:grid-cols-3 border border-border">
            {[
              {
                step: "01",
                title: "Upload",
                description: "Drop your PDF, DOCX, or TXT file. It gets parsed, chunked, and vectorized in seconds.",
              },
              {
                step: "02",
                title: "Ask",
                description: "Type your question in natural language. The agent begins reasoning about which sections to search.",
              },
              {
                step: "03",
                title: "Receive",
                description: "Get a synthesized answer with references to exact document sections. Follow up as needed.",
              },
            ].map((step, i) => (
              <div key={i} className="p-8 bg-card">
                <span
                  className="font-mono text-2xl"
                  style={{ color: "var(--accent-color)" }}
                >
                  {step.step}
                </span>
                <h3 className="mt-4 text-lg font-medium text-foreground">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section id="get-started" className="py-32 lg:py-40">
        <div className="mx-auto max-w-[1200px] px-6 text-left">
          <p className="label">Ready</p>
          <h2
            className="mt-4 text-foreground font-semibold"
            style={{
              fontSize: "clamp(2rem, 5vw, 3.5rem)",
              lineHeight: 1.08,
            }}
          >
            Start a conversation
            <br />
            with your document.
          </h2>
          <p className="mt-6 max-w-[480px] text-muted-foreground leading-relaxed text-base">
            No sign-up required. Upload a file, ask your question, and
            experience intelligent document understanding.
          </p>
          <div className="mt-10">
            <Link
              id="cta-bottom"
              href="/guid"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] px-7 py-3 rounded-md transition-colors"
              style={{
                background: "var(--accent-color)",
                color: "#ffffff",
              }}
            >
              Launch Askify
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="py-8 border-t border-border">
        <div className="mx-auto max-w-[1200px] px-6 flex items-center justify-between">
          <span className="font-mono text-xs tracking-[0.1em] uppercase text-muted-foreground">
            Askify
          </span>
          <span className="font-mono text-xs text-muted-foreground">
            Built with intelligence
          </span>
        </div>
      </footer>
    </>
  );
}
