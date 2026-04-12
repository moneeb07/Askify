"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import {
  Loader2,
  AlertCircle,
  ChevronDown,
  Send,
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import { qnqApi } from "@/services/qnqApi";
import type {
  AskRequestBody,
  ChatHistoryItem,
  DocumentMetadataResponse,
  DocumentProcessingStatus,
  SourceChunk,
  SseEventPayload,
} from "@/services/qnqApi";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ─── local uuid helper ─── */
const uuid = (): string =>
  typeof crypto?.randomUUID === "function"
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

/* ─── types ─── */
type StoredTurn = {
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  sources?: SourceChunk[];
};

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: number;
  sources?: SourceChunk[];
};

/* ─── constants ─── */
const POLL_INTERVAL_MS = 2500;

const statusBadgeVariant: Record<
  DocumentProcessingStatus,
  "info" | "warning" | "success" | "destructive"
> = {
  pending: "info",
  processing: "warning",
  ready: "success",
  failed: "destructive",
};

const statusTextMap: Record<DocumentProcessingStatus, string> = {
  pending: "Pending",
  processing: "Processing",
  ready: "Ready",
  failed: "Failed",
};

/* ─── SSE helpers ─── */
const extractString = (value: unknown): string =>
  typeof value === "string" ? value : "";

const extractTokenFromEvent = (payload: SseEventPayload): string => {
  const { event, data } = payload;

  if (typeof data === "string") {
    if (
      event === "thinking" ||
      event === "sources" ||
      event === "done" ||
      event === "error"
    )
      return "";
    return data;
  }

  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;
  const recordType = extractString(record.type).toLowerCase();
  const eventType = event.toLowerCase();
  const isAnswerEvent =
    eventType === "answer" ||
    eventType === "message" ||
    eventType === "token" ||
    eventType === "content" ||
    recordType === "answer" ||
    recordType === "token" ||
    recordType === "content";

  if (!isAnswerEvent) return "";

  const candidates = [
    record.token,
    record.delta,
    record.content,
    record.answer,
    record.text,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.length > 0) {
      return candidate;
    }
  }

  return "";
};

const extractThinkingFromEvent = (payload: SseEventPayload): string => {
  const { event, data } = payload;
  if (event.toLowerCase() === "thinking" && typeof data === "string")
    return data;
  if (!data || typeof data !== "object") return "";

  const record = data as Record<string, unknown>;
  const recordType = extractString(record.type).toLowerCase();
  if (event.toLowerCase() !== "thinking" && recordType !== "thinking")
    return "";

  const candidates = [
    record.content,
    record.message,
    record.text,
    record.tool,
    record.step,
  ];
  for (const candidate of candidates) {
    if (typeof candidate === "string" && candidate.trim().length > 0) {
      return candidate;
    }
  }

  return "";
};

const extractSourcesFromEvent = (payload: SseEventPayload): SourceChunk[] => {
  const { event, data } = payload;
  const eventLower = event.toLowerCase();

  const parseChunks = (chunks: unknown): SourceChunk[] => {
    if (!Array.isArray(chunks)) return [];
    const mapped = chunks.map((item) => {
      if (!item || typeof item !== "object") return null;
      const record = item as Record<string, unknown>;
      const text = typeof record.text === "string" ? record.text : "";
      if (!text) return null;
      return {
        text,
        score: typeof record.score === "number" ? record.score : undefined,
        index: typeof record.index === "number" ? record.index : undefined,
      } as SourceChunk;
    });
    return mapped.filter((item): item is SourceChunk => item !== null);
  };

  if (Array.isArray(data) && eventLower === "sources") {
    return parseChunks(data);
  }

  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    if (Array.isArray(record.sources)) return parseChunks(record.sources);
    if (Array.isArray(record.references)) // api uses refrences instead of sources
      return parseChunks(record.references);
    if (eventLower === "sources" && Array.isArray(record.chunks))
      return parseChunks(record.chunks);
  }

  return [];
};

/* ─── MessageBubble ─── */
const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
  const isUser = message.role === "user";
  const [showSources, setShowSources] = useState(false);

  return (
    <div
      className={cn("flex w-full flex-col gap-2", isUser ? "items-end" : "items-start")}
    >
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap break-words",
          isUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-muted text-foreground rounded-bl-md border border-border [&_p:not(:last-child)]:mb-3 [&_ul]:list-disc [&_ul]:ml-5 [&_ul]:my-2 [&_li]:mb-1 [&_ol]:list-decimal [&_ol]:ml-5 [&_ol]:my-2 [&_strong]:font-semibold [&_a]:underline [&_a]:text-blue-500 [&_h3]:font-semibold [&_h3]:text-base [&_h3]:mb-2 [&_h3]:mt-3"
        )}
      >
        {isUser ? (
          message.content
        ) : (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.content}
          </ReactMarkdown>
        )}
      </div>

      {!isUser && message.sources && message.sources.length > 0 && (
        <div className="max-w-[80%] w-full flex flex-col gap-2 pt-1 pl-1">
          <button
            onClick={() => setShowSources(!showSources)}
            className="text-xs text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors w-fit"
          >
            <ChevronDown
              className={cn("h-3 w-3 transition-transform", showSources && "rotate-180")}
            />
            {message.sources.length} Sources
          </button>

          {showSources && (
            <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-3 shadow-sm">
              {message.sources.map((source, idx) => (
                <div key={idx} className="text-xs space-y-1.5 pb-3 border-b border-border last:pb-0 last:border-0 border-dashed">
                  <div className="flex items-center justify-between font-medium text-muted-foreground">
                    <span>Source {idx + 1}</span>
                    {typeof source.score === "number" && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">
                        {Math.round(source.score * 100)}% Match
                      </span>
                    )}
                  </div>
                  <div className="text-muted-foreground leading-relaxed line-clamp-4 hover:line-clamp-none transition-all">
                    {source.text}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ─── MessageList ─── */
const MessageList: React.FC<{ messages: ChatMessage[] }> = ({ messages }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center space-y-3">
          <Sparkles className="mx-auto h-10 w-10 text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">
            Start a conversation about your document
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3 overflow-y-auto px-4 py-4">
      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}
      <div ref={bottomRef} />
    </div>
  );
};

/* ─── ThinkingPanel ─── */
const ThinkingPanel: React.FC<{ steps: string[] }> = ({ steps }) => {
  const [open, setOpen] = useState(true);
  if (steps.length === 0) return null;

  return (
    <div className="shrink-0 rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <span className="flex items-center gap-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" style={{ color: "var(--accent-color)" }} />
          Agent is thinking…
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="flex flex-col gap-1.5 px-4 pb-3">
          {steps.map((step, index) => (
            <span
              key={`${index}-${step.slice(0, 20)}`}
              className="text-xs text-muted-foreground leading-relaxed"
            >
              {index + 1}. {step}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   Main Inner Component
   ═══════════════════════════════════════════ */
const ConversationInner: React.FC<{ documentId: string }> = ({
  documentId,
}) => {
  const [documentStatus, setDocumentStatus] =
    useState<DocumentProcessingStatus | null>(null);
  const [metadata, setMetadata] = useState<DocumentMetadataResponse | null>(
    null
  );
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [historyTurns, setHistoryTurns] = useState<StoredTurn[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [deepAnalysis, setDeepAnalysis] = useState(false);
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState("");
  const initialPromptConsumedRef = useRef(false);
  const suggestionsLoadedRef = useRef(false);
  const storageKey = useMemo(
    () => `qnq_history_${documentId}`,
    [documentId]
  );

  const isDocumentReady = documentStatus === "ready";

  /* restore from localStorage */
  useEffect(() => {
    suggestionsLoadedRef.current = false;
    initialPromptConsumedRef.current = false;
    setSuggestions([]);
    setThinkingSteps([]);
    setErrorMessage("");

    let storedTurns: StoredTurn[] = [];
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw) as StoredTurn[];
        if (Array.isArray(parsed)) {
          storedTurns = parsed.filter(
            (turn) =>
              turn &&
              (turn.role === "user" || turn.role === "assistant") &&
              typeof turn.content === "string" &&
              typeof turn.createdAt === "number"
          );
        }
      }
    } catch (error) {
      console.error("[Conversation] Failed to parse local history:", error);
    }

    setHistoryTurns(storedTurns);
    setMessages(
      storedTurns.map((turn, index) => ({
        id: `stored-${turn.role}-${turn.createdAt}-${index}`,
        role: turn.role,
        content: turn.content,
        createdAt: turn.createdAt,
        sources: turn.sources,
      }))
    );
  }, [documentId, storageKey]);

  /* poll document status */
  useEffect(() => {
    let cancelled = false;

    const updateDocumentState = async () => {
      try {
        const [statusResponse, metadataResponse] = await Promise.all([
          qnqApi.getDocumentStatus(documentId),
          qnqApi.getDocument(documentId),
        ]);
        if (cancelled) return;
        setDocumentStatus(statusResponse.status);
        setMetadata(metadataResponse);
      } catch (error) {
        if (cancelled) return;
        console.error("[Conversation] Failed to query document status:", error);
        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Failed to fetch document status"
        );
      }
    };

    void updateDocumentState();

    const timer = window.setInterval(() => {
      void qnqApi
        .getDocumentStatus(documentId)
        .then((statusResponse) => {
          if (cancelled) return;
          setDocumentStatus(statusResponse.status);
          if (statusResponse.status === "ready") {
            void qnqApi.getDocument(documentId).then((meta) => {
              if (!cancelled) setMetadata(meta);
            });
          }
        })
        .catch((error) => {
          if (cancelled) return;
          console.error("[Conversation] Poll status failed:", error);
          setErrorMessage(
            error instanceof Error ? error.message : "Failed to poll status"
          );
        });
    }, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [documentId]);

  /* load suggestions */
  useEffect(() => {
    if (!isDocumentReady || suggestionsLoadedRef.current) return;
    suggestionsLoadedRef.current = true;
    void qnqApi
      .getSuggestions(documentId)
      .then((response) => {
        setSuggestions(response.suggestions || []);
      })
      .catch((error) => {
        console.error("[Conversation] Failed to load suggestions:", error);
      });
  }, [documentId, isDocumentReady]);

  /* persistence */
  const persistHistory = useCallback(
    (nextTurns: StoredTurn[]) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(nextTurns));
      } catch (error) {
        console.error("[Conversation] Failed to persist history:", error);
      }
    },
    [storageKey]
  );

  /* send message */
  const executeSend = useCallback(
    async (rawQuestion: string) => {
      const question = rawQuestion.trim();
      if (!question || sending || !isDocumentReady) return;

      const userMsgId = uuid();
      const assistantMsgId = uuid();
      const requestHistory: ChatHistoryItem[] = historyTurns.map((turn) => ({
        role: turn.role,
        content: turn.content,
      }));

      const userTurn: StoredTurn = {
        role: "user",
        content: question,
        createdAt: Date.now(),
      };

      setMessages((prev) => [
        ...prev,
        {
          id: userMsgId,
          role: "user",
          content: question,
          createdAt: userTurn.createdAt,
        },
      ]);

      setInput("");
      setSending(true);
      setErrorMessage("");
      setThinkingSteps([]);

      let assistantContent = "";
      let sources: SourceChunk[] = [];

      const onSseEvent = (payload: SseEventPayload) => {
        const thinking = extractThinkingFromEvent(payload);
        if (thinking) {
          setThinkingSteps((prev) => [...prev, thinking]);
        }

        const nextSources = extractSourcesFromEvent(payload);
        if (nextSources.length > 0) {
          sources = nextSources;
        }

        const token = extractTokenFromEvent(payload);
        if (!token) return;

        assistantContent += token;

        setMessages((prev) => {
          const existing = prev.find((m) => m.id === assistantMsgId);
          if (existing) {
            return prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, content: assistantContent }
                : m
            );
          }
          return [
            ...prev,
            {
              id: assistantMsgId,
              role: "assistant" as const,
              content: assistantContent,
              createdAt: Date.now(),
            },
          ];
        });
      };

      try {
        const payload: AskRequestBody = {
          document_id: documentId,
          question,
          history: requestHistory,
        };

        if (deepAnalysis) {
          await qnqApi.streamAgentRun(payload, onSseEvent);
        } else {
          await qnqApi.streamAsk(payload, onSseEvent);
        }

        if (!assistantContent.trim()) {
          const fallback = "No response from model.";
          assistantContent = fallback;
          setMessages((prev) => {
            const existing = prev.find((m) => m.id === assistantMsgId);
            if (existing) {
              return prev.map((m) =>
                m.id === assistantMsgId ? { ...m, content: fallback } : m
              );
            }
            return [
              ...prev,
              {
                id: assistantMsgId,
                role: "assistant" as const,
                content: fallback,
                createdAt: Date.now(),
              },
            ];
          });
        }

        if (sources.length > 0) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantMsgId
                ? { ...m, sources }
                : m
            )
          );
        }

        const finalAssistant =
          assistantContent.trim() || "No response from model.";
        const assistantTurn: StoredTurn = {
          role: "assistant",
          content: finalAssistant,
          createdAt: Date.now(),
          sources: sources.length > 0 ? sources : undefined,
        };
        const nextHistory = [...historyTurns, userTurn, assistantTurn];
        setHistoryTurns(nextHistory);
        persistHistory(nextHistory);
      } catch (error) {
        console.error("[Conversation] Send failed:", error);
        const reason =
          error instanceof Error ? error.message : "Failed to send message";
        setErrorMessage(reason);
      } finally {
        setSending(false);
      }
    },
    [
      deepAnalysis,
      documentId,
      historyTurns,
      isDocumentReady,
      persistHistory,
      sending,
    ]
  );

  /* auto-fire initial prompt */
  useEffect(() => {
    if (!isDocumentReady || initialPromptConsumedRef.current) return;
    const key = `qnq_initial_question_${documentId}`;
    const initialPrompt = sessionStorage.getItem(key);
    if (!initialPrompt) return;

    sessionStorage.removeItem(key);
    initialPromptConsumedRef.current = true;
    void executeSend(initialPrompt);
  }, [documentId, executeSend, isDocumentReady]);

  const handleSendClick = () => void executeSend(input);
  const handleSuggestionClick = (s: string) => void executeSend(s);

  const handleClearConversation = () => {
    setHistoryTurns([]);
    persistHistory([]);
    setMessages([]);
    setThinkingSteps([]);
  };

  /* ═══ Render ═══ */
  return (
    <div className="flex flex-col h-[calc(100vh-56px)] overflow-hidden bg-background">
      {/* ── Top Bar ── */}
      <div className="shrink-0 border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-[1000px] items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Document:</span>
            <span className="text-sm font-medium text-foreground">
              {metadata?.name || documentId}
            </span>
            {documentStatus && (
              <Badge variant={statusBadgeVariant[documentStatus]} dot>
                {statusTextMap[documentStatus]}
              </Badge>
            )}
            {!isDocumentReady && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <span className="text-xs text-muted-foreground">
                Deep Analysis
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={deepAnalysis}
                onClick={() => setDeepAnalysis((prev) => !prev)}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  deepAnalysis ? "bg-[var(--accent-color)]" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200",
                    deepAnalysis ? "translate-x-4" : "translate-x-0"
                  )}
                />
              </button>
            </label>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full"
              onClick={handleClearConversation}
            >
              Clear Chat
            </Button>
          </div>
        </div>
      </div>

      {/* ── Alerts (shrink-0, above messages) ── */}
      <div className="shrink-0 mx-auto w-full max-w-[1000px] px-4 space-y-2 mt-2">
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}

        {!isDocumentReady && (
          <Alert>
            <Loader2 className="h-4 w-4 animate-spin" />
            <AlertTitle>Processing</AlertTitle>
            <AlertDescription>
              Document is still processing. Chat will be enabled when status is
              Ready.
            </AlertDescription>
          </Alert>
        )}

        <ThinkingPanel steps={thinkingSteps} />
      </div>

      {/* ── Messages (flex-1, scrollable) ── */}
      <div className="flex-1 min-h-0 overflow-hidden mx-auto w-full max-w-[1000px]">
        <MessageList messages={messages} />
      </div>

      {/* ── Suggestions (above input, shrink-0) ── */}
      {suggestions.length > 0 && isDocumentReady && (
        <div className="shrink-0 border-t border-border bg-card px-4 py-2">
          <div className="mx-auto max-w-[1000px] flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <Button
                key={suggestion}
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* ── Input Area (fixed footer, never scrolls) ── */}
      <div className="shrink-0 border-t border-border bg-card px-4 py-3">
        <div className="mx-auto max-w-[1000px] space-y-2">
          <div className="rounded-xl border border-border px-3 py-2.5 bg-background focus-within:border-ring/60 focus-within:ring-1 focus-within:ring-ring/30 transition-all">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              rows={2}
              className="min-h-[48px] max-h-[160px] w-full resize-none bg-transparent border-none p-0 text-sm leading-relaxed placeholder:text-muted-foreground/60 focus-visible:ring-0 focus-visible:outline-none shadow-none"
              placeholder="Ask a question about your document"
              disabled={!isDocumentReady || sending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSendClick();
                }
              }}
            />
          </div>
          <div className="flex justify-end">
            <Button
              variant="default"
              className="rounded-full gap-2"
              disabled={!isDocumentReady || !input.trim() || sending}
              onClick={handleSendClick}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   Page Component (Next.js App Router)
   ═══════════════════════════════════════════ */
export default function ConversationPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <div className="flex flex-1 items-center justify-center p-6">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Missing document id in route.</AlertDescription>
        </Alert>
      </div>
    );
  }

  return <ConversationInner documentId={id} />;
}
