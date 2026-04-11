"use client";

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Moon, Sun, Loader2, AlertCircle } from 'lucide-react';

// Adjusted imports: you will place these components in the correct directories later
import { useThemeContext } from '@/hooks/context/ThemeContext';
import { qnqApi } from '@/services/qnqApi';
import type { DocumentMetadataResponse, DocumentProcessingStatus } from '@/services/qnqApi';

// Replaced @arco-design components with generic shadcn/ui and Radix UI primitives
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/Textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/ui/use-toast';
import { FileUpload } from '@/components/ui/file-upload';

import styles from './index.module.css';

const POLL_INTERVAL_MS = 2500;

const statusColorMap: Record<DocumentProcessingStatus, "default" | "secondary" | "destructive" | "outline"> = {
    pending: 'default',
    processing: 'secondary',
    ready: 'default',
    failed: 'destructive',
};

const statusTextMap: Record<DocumentProcessingStatus, string> = {
    pending: 'Pending',
    processing: 'Processing',
    ready: 'Ready',
    failed: 'Failed',
};

const GuidPage: React.FC = () => {
    const { t } = useTranslation();
    const router = useRouter();
    const { theme, setTheme } = useThemeContext();
    const { toast } = useToast();

    const [question, setQuestion] = useState('');
    const [uploadList, setUploadList] = useState<any[]>([]);
    const [documentId, setDocumentId] = useState('');
    const [documentStatus, setDocumentStatus] = useState<DocumentProcessingStatus | null>(null);
    const [documentMeta, setDocumentMeta] = useState<DocumentMetadataResponse | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    const isDocumentReady = documentStatus === 'ready';
    const isProcessing = documentStatus === 'pending' || documentStatus === 'processing';

    const statusLabel = useMemo(() => {
        if (!documentStatus) return '';
        return statusTextMap[documentStatus];
    }, [documentStatus]);

    const handleThemeToggle = useCallback(() => {
        void setTheme(theme === 'dark' ? 'light' : 'dark');
    }, [setTheme, theme]);

    const resetDocumentState = useCallback(() => {
        setDocumentId('');
        setDocumentStatus(null);
        setDocumentMeta(null);
        setUploadList([]);
        setErrorMessage('');
    }, []);

    const handleClearDocument = useCallback(async () => {
        const targetId = documentId;
        resetDocumentState();
        setQuestion('');

        if (!targetId) {
            return;
        }

        try {
            await qnqApi.deleteDocument(targetId);
        } catch (error) {
            console.error('[GuidPage] Failed to delete document:', error);
        }
    }, [documentId, resetDocumentState]);

    const refreshMetadata = useCallback(async (nextDocumentId: string) => {
        try {
            const metadata = await qnqApi.getDocument(nextDocumentId);
            setDocumentMeta(metadata);
        } catch (error) {
            console.error('[GuidPage] Failed to fetch document metadata:', error);
        }
    }, []);

    const handleUploadRequest = useCallback(async (options: any) => {
        setErrorMessage('');
        setIsUploading(true);
        setDocumentStatus('pending');
        setDocumentMeta(null);

        try {
            const response = await qnqApi.uploadDocument(options.file);
            setDocumentId(response.document_id);
            setDocumentStatus(response.status);
            options.onSuccess?.({ document_id: response.document_id, status: response.status });
            toast({
                title: t('common.success', { defaultValue: 'Upload success' }),
                variant: 'default',
            });
        } catch (error) {
            console.error('[GuidPage] Document upload failed:', error);
            const reason = error instanceof Error ? error.message : t('common.failed', { defaultValue: 'Failed' });
            setDocumentStatus('failed');
            setErrorMessage(reason);
            options.onError?.({ message: reason });
        } finally {
            setIsUploading(false);
        }
    }, [t, toast]);

    const handleOpenChat = useCallback(() => {
        if (!documentId || !isDocumentReady) return;

        const trimmedQuestion = question.trim();
        if (trimmedQuestion) {
            sessionStorage.setItem(`qnq_initial_question_${documentId}`, trimmedQuestion);
        }
        router.push(`/conversation/${documentId}`);
    }, [documentId, isDocumentReady, router, question]); // Replaced 'navigate' with 'router' in deps array

    useEffect(() => {
        if (!documentId || !documentStatus) return;
        if (documentStatus === 'ready') {
            void refreshMetadata(documentId);
            return;
        }
        if (documentStatus === 'failed') return;

        const timer = window.setInterval(() => {
            void qnqApi
                .getDocumentStatus(documentId)
                .then((response: any) => {
                    setDocumentStatus(response.status);
                    if (response.status === 'ready') {
                        void refreshMetadata(documentId);
                    }
                    if (response.status === 'failed') {
                        setErrorMessage(t('common.failed', { defaultValue: 'Processing failed' }));
                    }
                })
                .catch((error: any) => {
                    console.error('[GuidPage] Failed to poll document status:', error);
                    setErrorMessage(error instanceof Error ? error.message : t('common.failed', { defaultValue: 'Failed' }));
                });
        }, POLL_INTERVAL_MS);

        return () => {
            window.clearInterval(timer);
        };
    }, [documentId, documentStatus, refreshMetadata, t]);

    return (
        <div className='h-full w-full overflow-auto'>
            <div className={styles.guidTopRightActions}>
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button
                                variant='outline'
                                size='icon'
                                className={styles.guidThemeToggle}
                                aria-label={theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                                onClick={handleThemeToggle}
                            >
                                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            {theme === 'dark' ? t('settings.lightMode') : t('settings.darkMode')}
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>

            <div className={styles.guidContainer}>
                <div className={styles.guidLayout}>
                    <div className={styles.heroHeader}>
                        <h3 className='text-2xl font-semibold !mb-0 text-center tracking-tight'>
                            QnQ Docs
                        </h3>
                    </div>

                    <p className={`${styles.heroSubtitle} ${styles.heroSubtitleExpanded} !mb-4`}>
                        <span className={`${styles.heroSubtitleText} ${styles.heroSubtitleTextExpanded}`}>
                            Upload one PDF or TXT file. Chat unlocks when indexing is ready.
                        </span>
                        {documentStatus ? (
                            <Badge variant={statusColorMap[documentStatus]}>{statusLabel}</Badge>
                        ) : (
                            <Badge variant="outline">Not uploaded</Badge>
                        )}
                        {isUploading || isProcessing ? <Loader2 className="h-4 w-4 animate-spin ml-2" /> : null}
                    </p>

                    {errorMessage ? (
                        <Alert variant="destructive" className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription className="flex items-center justify-between">
                                <span>{errorMessage}</span>
                                <Button variant='ghost' size='sm' onClick={() => void handleClearDocument()}>
                                    Reset
                                </Button>
                            </AlertDescription>
                        </Alert>
                    ) : null}

                    <div
                        className={`${styles.guidInputCard} guid-input-card-shell relative p-4 border-2 bg-card rounded-xl flex flex-col overflow-hidden transition-all duration-200 shadow-sm`}
                    >
                        <FileUpload
                            multiple={false}
                            accept='.pdf,.txt'
                            fileList={uploadList}
                            maxCount={1}
                            onChange={setUploadList}
                            customRequest={handleUploadRequest}
                            disabled={isUploading || isProcessing}
                            tip='Supported files: .pdf, .txt'
                        />

                        {isProcessing ? (
                            <Alert className="mt-4 bg-muted/50">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle>Processing</AlertTitle>
                                <AlertDescription>
                                    Processing your document... Chat will unlock when ready.
                                </AlertDescription>
                            </Alert>
                        ) : null}

                        {documentMeta ? (
                            <div className='bg-muted/30 p-3 rounded-lg border mt-4'>
                                <span className='block text-foreground'>
                                    <strong>Name:</strong> {documentMeta.name}
                                </span>
                                <span className='block text-muted-foreground text-sm mt-1'>
                                    <strong>Size:</strong> {documentMeta.size} bytes
                                </span>
                                <span className='block text-muted-foreground text-sm mt-1'>
                                    <strong>Chunks:</strong> {documentMeta.chunk_count ?? 0}
                                </span>
                            </div>
                        ) : null}

                        <Textarea
                            value={question}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                                setQuestion(e.target.value)
                            }
                            rows={3}
                            className='mt-4 text-base bg-transparent border-none resize-none p-0 focus-visible:ring-0 shadow-none'
                            placeholder='Optional: type your first question to auto-send in chat'
                            disabled={!isDocumentReady}
                        />

                        <div className={styles.actionRow}>
                            <div className={styles.actionTools}>
                                <Button variant='destructive' onClick={() => void handleClearDocument()}>
                                    Clear
                                </Button>
                            </div>
                            <div className={styles.actionSubmit}>
                                <Button
                                    variant={isDocumentReady ? 'default' : 'secondary'}
                                    className="rounded-full bg-black text-white hover:bg-black/90 disabled:bg-gray-300 disabled:text-gray-500"
                                    disabled={!isDocumentReady}
                                    onClick={handleOpenChat}
                                >
                                    {isDocumentReady ? 'Open Chat' : 'Wait For Ready'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidPage;
