"use client";

import { useEffect, useState } from "react";

export default function Home() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* ===== Navigation ===== */}
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled ? "nav-scrolled" : ""
        }`}
      >
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <span
            className="font-mono text-sm tracking-[0.15em] uppercase"
            style={{ color: "var(--text-primary)" }}
          >
            Askify
          </span>

          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm transition-colors duration-200"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm transition-colors duration-200"
              style={{
                color: "var(--text-secondary)",
                fontFamily: "var(--font-body)",
              }}
              onMouseEnter={(e) =>
                (e.currentTarget.style.color = "var(--text-primary)")
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.color = "var(--text-secondary)")
              }
            >
              How It Works
            </a>
          </div>

          <a
            href="#get-started"
            className="text-xs font-mono uppercase tracking-[0.1em] px-5 py-2.5 rounded-md border transition-all duration-200"
            style={{
              color: "var(--text-secondary)",
              borderColor: "var(--border-default)",
              background: "transparent",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = "var(--border-hover)";
              e.currentTarget.style.color = "var(--text-primary)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--border-default)";
              e.currentTarget.style.color = "var(--text-secondary)";
            }}
          >
            Get Started
          </a>
        </div>
      </nav>

      {/* ===== Hero Section ===== */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        {/* Subtle hero radial light */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(79,156,249,0.04) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-[1200px] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-[1fr_0.72fr] gap-16 items-center pt-32 pb-20 lg:pt-0 lg:pb-0">
          {/* Left — Text */}
          <div>
            <p className="label animate-fade-up">AI Document Intelligence</p>

            <h1
              className="font-display mt-6 animate-fade-up delay-100"
              style={{
                fontSize: "clamp(3rem, 7vw, 6rem)",
                fontWeight: 400,
                lineHeight: 1.05,
                color: "var(--text-primary)",
              }}
            >
              Your documents,
              <br />
              <span style={{ color: "var(--accent)" }}>answered.</span>
            </h1>

            <p
              className="mt-8 animate-fade-up delay-200"
              style={{
                fontSize: "1.125rem",
                color: "var(--text-secondary)",
                maxWidth: "520px",
                lineHeight: 1.7,
                fontFamily: "var(--font-body)",
              }}
            >
              Upload a PDF, Word document, or text file. Ask anything. An
              autonomous AI agent searches, reasons, and synthesizes answers from
              your document — not just keyword matching, real understanding.
            </p>

            <div className="mt-10 flex items-center gap-4 animate-fade-up delay-300">
              <a
                id="cta-upload"
                href="#get-started"
                className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] px-7 py-3 rounded-md transition-all duration-200"
                style={{
                  background: "var(--accent)",
                  color: "var(--bg-base)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-hover)";
                  e.currentTarget.style.transform = "translateY(-1px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--accent)";
                  e.currentTarget.style.transform = "translateY(0)";
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
              </a>

              <a
                href="#how-it-works"
                className="font-mono text-xs uppercase tracking-[0.1em] px-5 py-3 rounded-md border transition-all duration-200"
                style={{
                  color: "var(--text-secondary)",
                  borderColor: "var(--border-default)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.color = "var(--text-secondary)";
                }}
              >
                See How It Works
              </a>
            </div>
          </div>

          {/* Right — Code Preview */}
          <div className="animate-fade-up delay-400">
            <div
              className="rounded-lg overflow-hidden"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-default)",
              }}
            >
              {/* Terminal Header */}
              <div
                className="flex items-center gap-2 px-4 py-3"
                style={{ borderBottom: "1px solid var(--border-default)" }}
              >
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#3d3d45" }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#3d3d45" }}
                />
                <div
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: "#3d3d45" }}
                />
                <span
                  className="ml-3 font-mono text-xs"
                  style={{ color: "var(--text-tertiary)" }}
                >
                  askify-agent
                </span>
              </div>

              {/* Terminal Body */}
              <div className="p-5 font-mono text-[0.8rem] leading-relaxed space-y-3">
                <div>
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {"//"} user query
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--accent)" }}>ask</span>
                  <span style={{ color: "var(--text-secondary)" }}>(</span>
                  <span style={{ color: "var(--text-primary)" }}>
                    &quot;What are the key findings in section 3?&quot;
                  </span>
                  <span style={{ color: "var(--text-secondary)" }}>)</span>
                </div>

                <div className="pt-2">
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {"//"} agent reasoning
                  </span>
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent)" }}>agent</span>
                  .search(
                  <span style={{ color: "var(--text-primary)" }}>
                    &quot;section 3&quot;
                  </span>
                  , chunks: 5)
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent)" }}>agent</span>
                  .search(
                  <span style={{ color: "var(--text-primary)" }}>
                    &quot;key findings results&quot;
                  </span>
                  , chunks: 3)
                </div>
                <div style={{ color: "var(--text-secondary)" }}>
                  <span style={{ color: "var(--accent)" }}>agent</span>
                  .synthesize(sources: 8)
                </div>

                <div className="pt-2">
                  <span style={{ color: "var(--text-tertiary)" }}>
                    {"//"} response ready
                  </span>
                </div>
                <div>
                  <span style={{ color: "var(--accent)" }}>return</span>
                  <span style={{ color: "var(--text-secondary)" }}>
                    {" "}
                    structured_answer
                  </span>
                  <span className="inline-block w-1.5 h-4 ml-1 animate-pulse" style={{ background: "var(--accent)" }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== Features Section ===== */}
      <section id="features" className="py-32 lg:py-40">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="label">Capabilities</p>
          <h2
            className="font-display mt-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            Not a chatbot.
            <br />
            An agent.
          </h2>
          <p
            className="mt-4"
            style={{
              color: "var(--text-secondary)",
              maxWidth: "480px",
              lineHeight: 1.7,
              fontSize: "1rem",
            }}
          >
            Askify doesn&apos;t just match keywords. It autonomously decides
            what to search, how many times to search, and how to compose an
            answer.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-16">
            {[
              {
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                ),
                label: "Multi-pass Retrieval",
                title: "Autonomous search",
                description:
                  "The agent decides how many times to search your document and which sections to pull, adapting its strategy per question.",
              },
              {
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                    <polyline points="14,2 14,8 20,8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                    <line x1="10" y1="9" x2="8" y2="9" />
                  </svg>
                ),
                label: "Format Agnostic",
                title: "PDF, DOCX, TXT",
                description:
                  "Upload any common document format. The system parses, chunks, and indexes it for semantic search automatically.",
              },
              {
                icon: (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                ),
                label: "Reasoning Engine",
                title: "Synthesize, don't regurgitate",
                description:
                  "Answers are composed from multiple document sections with reasoning — not just pasted text blocks.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="group rounded-xl p-6 transition-all duration-200"
                style={{
                  background: "var(--bg-surface)",
                  border: "1px solid var(--border-default)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-hover)";
                  e.currentTarget.style.transform = "translateY(-2px)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--border-default)";
                  e.currentTarget.style.transform = "translateY(0)";
                }}
              >
                <div style={{ color: "var(--text-secondary)" }}>
                  {feature.icon}
                </div>
                <p className="label mt-5">{feature.label}</p>
                <h3
                  className="mt-3 text-lg"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  {feature.title}
                </h3>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== How It Works Section ===== */}
      <section id="how-it-works" className="py-32 lg:py-40">
        <div className="max-w-[1200px] mx-auto px-6">
          <p className="label">Process</p>
          <h2
            className="font-display mt-4"
            style={{
              fontSize: "clamp(2rem, 4vw, 3.5rem)",
              fontWeight: 400,
              lineHeight: 1.1,
              color: "var(--text-primary)",
            }}
          >
            Three steps.
            <br />
            Zero complexity.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px mt-16 rounded-xl overflow-hidden" style={{ background: "var(--border-default)" }}>
            {[
              {
                step: "01",
                title: "Upload",
                description:
                  "Drop your PDF, DOCX, or TXT file. It gets parsed, chunked, and vectorized in seconds.",
              },
              {
                step: "02",
                title: "Ask",
                description:
                  "Type your question in natural language. The agent begins reasoning about which sections to search.",
              },
              {
                step: "03",
                title: "Receive",
                description:
                  "Get a synthesized answer with references to exact document sections. Follow up as needed.",
              },
            ].map((step, i) => (
              <div
                key={i}
                className="p-8"
                style={{ background: "var(--bg-surface)" }}
              >
                <span
                  className="font-mono text-2xl"
                  style={{ color: "var(--accent)" }}
                >
                  {step.step}
                </span>
                <h3
                  className="mt-4 text-lg"
                  style={{
                    color: "var(--text-primary)",
                    fontFamily: "var(--font-body)",
                    fontWeight: 500,
                  }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-3 text-sm leading-relaxed"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA Section ===== */}
      <section id="get-started" className="py-32 lg:py-40">
        <div className="max-w-[1200px] mx-auto px-6 text-left">
          <p className="label">Ready</p>
          <h2
            className="font-display mt-4"
            style={{
              fontSize: "clamp(2rem, 5vw, 4rem)",
              fontWeight: 400,
              lineHeight: 1.05,
              color: "var(--text-primary)",
            }}
          >
            Start a conversation
            <br />
            with your document.
          </h2>
          <p
            className="mt-6"
            style={{
              color: "var(--text-secondary)",
              maxWidth: "480px",
              lineHeight: 1.7,
              fontSize: "1.05rem",
            }}
          >
            No sign-up required. Upload a file, ask your question, and
            experience intelligent document understanding.
          </p>
          <div className="mt-10">
            <a
              id="cta-bottom"
              href="/chat"
              className="inline-flex items-center gap-2 font-mono text-xs uppercase tracking-[0.1em] px-7 py-3 rounded-md transition-all duration-200"
              style={{
                background: "var(--accent)",
                color: "var(--bg-base)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "var(--accent-hover)";
                e.currentTarget.style.transform = "translateY(-1px)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--accent)";
                e.currentTarget.style.transform = "translateY(0)";
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
            </a>
          </div>
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer
        className="py-8"
        style={{ borderTop: "1px solid var(--border-default)" }}
      >
        <div className="max-w-[1200px] mx-auto px-6 flex items-center justify-between">
          <span
            className="font-mono text-xs tracking-[0.1em] uppercase"
            style={{ color: "var(--text-tertiary)" }}
          >
            Askify
          </span>
          <span
            className="font-mono text-xs"
            style={{ color: "var(--text-tertiary)" }}
          >
            Built with intelligence
          </span>
        </div>
      </footer>
    </>
  );
}
