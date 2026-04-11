/**
 * QnQ MVP API client for FastAPI backend routes under /api.
 */

export type DocumentProcessingStatus = 'pending' | 'processing' | 'ready' | 'failed';

export type ChatHistoryItem = {
  role: 'user' | 'assistant';
  content: string;
};

export type SourceChunk = {
  text: string;
  score?: number;
  index?: number;
};

export type HealthResponse = {
  status: string;
  timestamp: string;
};

export type UploadDocumentResponse = {
  document_id: string;
  status: DocumentProcessingStatus;
};

export type DocumentStatusResponse = {
  document_id: string;
  status: DocumentProcessingStatus;
};

export type DocumentMetadataResponse = {
  id: string;
  name: string;
  size: number;
  chunk_count?: number;
  created_at: string;
  status: DocumentProcessingStatus;
};

export type ChatSuggestResponse = {
  suggestions: string[];
};

export type AskRequestBody = {
  document_id: string;
  question: string;
  history: ChatHistoryItem[];
};

export type AgentRunRequestBody = AskRequestBody;

export type SseEventPayload = {
  event: string;
  raw: string;
  data: unknown;
};

// Uses NEXT_PUBLIC_API_URL from .env (e.g. http://localhost:8000/api locally, https://your-backend.com/api in production)
const API_PREFIX = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

const parseJsonSafe = async <T>(response: Response): Promise<T> => {
  const text = await response.text();
  if (!text) {
    return {} as T;
  }
  return JSON.parse(text) as T;
};

const ensureOk = async (response: Response): Promise<Response> => {
  if (response.ok) return response;
  let reason = `HTTP ${response.status}`;
  try {
    const body = await parseJsonSafe<{ detail?: string; message?: string }>(response);
    reason = body.detail || body.message || reason;
  } catch {
    // no-op
  }
  throw new Error(reason);
};

const apiFetch = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_PREFIX}${path}`, {
    ...init,
    credentials: 'include',
  });
  await ensureOk(response);
  return parseJsonSafe<T>(response);
};

const parseSseChunk = (chunk: string): SseEventPayload | null => {
  const normalized = chunk.replace(/\r/g, '');
  const lines = normalized
    .split('\n')
    .map((line) => line.trimEnd())
    .filter(Boolean);
  if (lines.length === 0) return null;

  let event = 'message';
  const dataLines: string[] = [];

  for (const line of lines) {
    if (line.startsWith('event:')) {
      event = line.slice('event:'.length).trim() || 'message';
      continue;
    }
    if (line.startsWith('data:')) {
      dataLines.push(line.slice('data:'.length).trimStart());
    }
  }

  const raw = dataLines.join('\n');
  if (!raw) return null;

  if (raw === '[DONE]') {
    return { event: 'done', raw, data: raw };
  }

  try {
    return { event, raw, data: JSON.parse(raw) as unknown };
  } catch {
    return { event, raw, data: raw };
  }
};

const streamPostSse = async (
  path: string,
  body: unknown,
  onEvent: (payload: SseEventPayload) => void
): Promise<void> => {
  const response = await fetch(`${API_PREFIX}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  await ensureOk(response);

  if (!response.body) {
    throw new Error('No stream body returned by server');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let buffer = '';
  const findSeparatorIndex = (value: string): number => {
    const lf = value.indexOf('\n\n');
    const crlf = value.indexOf('\r\n\r\n');

    if (lf < 0) return crlf;
    if (crlf < 0) return lf;
    return Math.min(lf, crlf);
  };

  while (true) {
    const { done, value } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });

    let separatorIndex = findSeparatorIndex(buffer);
    while (separatorIndex >= 0) {
      const chunk = buffer.slice(0, separatorIndex);
      const separatorLength = buffer.startsWith('\r\n\r\n', separatorIndex) ? 4 : 2;
      buffer = buffer.slice(separatorIndex + separatorLength);
      const parsed = parseSseChunk(chunk);
      if (parsed) onEvent(parsed);
      separatorIndex = findSeparatorIndex(buffer);
    }

    if (done) break;
  }

  if (buffer.trim()) {
    const parsed = parseSseChunk(buffer);
    if (parsed) onEvent(parsed);
  }
};

export const qnqApi = {
  getHealth: () => apiFetch<HealthResponse>('/health'),

  uploadDocument: async (file: File): Promise<UploadDocumentResponse> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_PREFIX}/documents/upload`, {
      method: 'POST',
      credentials: 'include',
      body: formData,
    });
    await ensureOk(response);
    return parseJsonSafe<UploadDocumentResponse>(response);
  },

  getDocumentStatus: (documentId: string) =>
    apiFetch<DocumentStatusResponse>(`/documents/${encodeURIComponent(documentId)}/status`),

  getDocument: (documentId: string) => apiFetch<DocumentMetadataResponse>(`/documents/${encodeURIComponent(documentId)}`),

  deleteDocument: (documentId: string) =>
    apiFetch<{ deleted: boolean }>(`/documents/${encodeURIComponent(documentId)}`, { method: 'DELETE' }),

  getSuggestions: (documentId: string) =>
    apiFetch<ChatSuggestResponse>('/chat/suggest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_id: documentId }),
    }),

  streamAsk: (payload: AskRequestBody, onEvent: (event: SseEventPayload) => void) =>
    streamPostSse('/chat/ask', payload, onEvent),

  streamAgentRun: (payload: AgentRunRequestBody, onEvent: (event: SseEventPayload) => void) =>
    streamPostSse('/agent/run', payload, onEvent),
};
