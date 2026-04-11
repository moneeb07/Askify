"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, AlertCircle } from "lucide-react";

import { qnqApi } from "@/services/qnqApi";
import type {
  DocumentMetadataResponse,
  DocumentProcessingStatus,
} from "@/services/qnqApi";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/Textarea";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/ui/use-toast";
import { FileUpload } from "@/components/ui/file-upload";

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

const GuidPage: React.FC = () => {
  const router = useRouter();
  const { toast } = useToast();

  const [question, setQuestion] = useState("");
  const [uploadList, setUploadList] = useState<any[]>([]);
  const [documentId, setDocumentId] = useState("");
  const [documentStatus, setDocumentStatus] =
    useState<DocumentProcessingStatus | null>(null);
  const [documentMeta, setDocumentMeta] =
    useState<DocumentMetadataResponse | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const isDocumentReady = documentStatus === "ready";
  const isProcessing =
    documentStatus === "pending" || documentStatus === "processing";

  const statusLabel = useMemo(() => {
    if (!documentStatus) return "";
    return statusTextMap[documentStatus];
  }, [documentStatus]);

  const resetDocumentState = useCallback(() => {
    setDocumentId("");
    setDocumentStatus(null);
    setDocumentMeta(null);
    setUploadList([]);
    setErrorMessage("");
  }, []);

  const handleClearDocument = useCallback(async () => {
    const targetId = documentId;
    resetDocumentState();
    setQuestion("");

    if (!targetId) return;

    try {
      await qnqApi.deleteDocument(targetId);
    } catch (error) {
      console.error("[GuidPage] Failed to delete document:", error);
    }
  }, [documentId, resetDocumentState]);

  const refreshMetadata = useCallback(async (nextDocumentId: string) => {
    try {
      const metadata = await qnqApi.getDocument(nextDocumentId);
      setDocumentMeta(metadata);
    } catch (error) {
      console.error("[GuidPage] Failed to fetch document metadata:", error);
    }
  }, []);

  const handleUploadRequest = useCallback(
    async (options: any) => {
      setErrorMessage("");
      setIsUploading(true);
      setDocumentStatus("pending");
      setDocumentMeta(null);

      try {
        const response = await qnqApi.uploadDocument(options.file);
        setDocumentId(response.document_id);
        setDocumentStatus(response.status);
        options.onSuccess?.({
          document_id: response.document_id,
          status: response.status,
        });
        toast({ title: "Upload success", variant: "default" });
      } catch (error) {
        console.error("[GuidPage] Document upload failed:", error);
        const reason =
          error instanceof Error ? error.message : "Upload failed";
        setDocumentStatus("failed");
        setErrorMessage(reason);
        options.onError?.({ message: reason });
      } finally {
        setIsUploading(false);
      }
    },
    [toast]
  );

  const handleOpenChat = useCallback(() => {
    if (!documentId || !isDocumentReady) return;

    const trimmedQuestion = question.trim();
    if (trimmedQuestion) {
      sessionStorage.setItem(
        `qnq_initial_question_${documentId}`,
        trimmedQuestion
      );
    }
    router.push(`/conversation/${documentId}`);
  }, [documentId, isDocumentReady, router, question]);

  useEffect(() => {
    if (!documentId || !documentStatus) return;
    if (documentStatus === "ready") {
      void refreshMetadata(documentId);
      return;
    }
    if (documentStatus === "failed") return;

    const timer = window.setInterval(() => {
      void qnqApi
        .getDocumentStatus(documentId)
        .then((response: any) => {
          setDocumentStatus(response.status);
          if (response.status === "ready") {
            void refreshMetadata(documentId);
          }
          if (response.status === "failed") {
            setErrorMessage("Processing failed");
          }
        })
        .catch((error: any) => {
          console.error("[GuidPage] Failed to poll document status:", error);
          setErrorMessage(
            error instanceof Error ? error.message : "Status check failed"
          );
        });
    }, POLL_INTERVAL_MS);

    return () => void window.clearInterval(timer);
  }, [documentId, documentStatus, refreshMetadata]);

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-6">
      <div className="w-full max-w-[700px] space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Askify Docs
          </h1>
          <p className="text-sm text-muted-foreground flex items-center justify-center gap-2 flex-wrap">
            <span>
              Upload one PDF or TXT file. Chat unlocks when indexing is ready.
            </span>
            {documentStatus ? (
              <Badge variant={statusBadgeVariant[documentStatus]} dot>
                {statusLabel}
              </Badge>
            ) : (
              <Badge variant="outline">Not uploaded</Badge>
            )}
            {(isUploading || isProcessing) && (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
          </p>
        </div>

        {/* Error */}
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="flex items-center justify-between">
              <span>{errorMessage}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => void handleClearDocument()}
              >
                Reset
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Main Card */}
        <div className="relative rounded-xl border-2 border-border bg-card p-6 flex flex-col gap-4">
          <FileUpload
            multiple={false}
            accept=".pdf,.txt"
            fileList={uploadList}
            maxCount={1}
            onChange={setUploadList}
            customRequest={handleUploadRequest}
            disabled={isUploading || isProcessing}
            tip="Supported files: .pdf, .txt"
          />

          {isProcessing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertTitle>Processing</AlertTitle>
              <AlertDescription>
                Processing your document… Chat will unlock when ready.
              </AlertDescription>
            </Alert>
          )}

          {documentMeta && (
            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-1">
              <span className="block text-foreground text-sm">
                <strong>Name:</strong> {documentMeta.name}
              </span>
              <span className="block text-muted-foreground text-xs">
                <strong>Size:</strong> {documentMeta.size} bytes
              </span>
              <span className="block text-muted-foreground text-xs">
                <strong>Chunks:</strong> {documentMeta.chunk_count ?? 0}
              </span>
            </div>
          )}

          <Textarea
            value={question}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setQuestion(e.target.value)
            }
            rows={3}
            className="text-sm bg-transparent border-none resize-none p-0 focus-visible:ring-0 shadow-none"
            placeholder="Optional: type your first question to auto-send in chat"
            disabled={!isDocumentReady}
          />

          {/* Action Row */}
          <div className="flex items-center justify-between gap-4">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => void handleClearDocument()}
            >
              Clear
            </Button>
            <Button
              variant={isDocumentReady ? "default" : "secondary"}
              className="rounded-full"
              disabled={!isDocumentReady}
              onClick={handleOpenChat}
            >
              {isDocumentReady ? "Open Chat" : "Wait For Ready"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidPage;
