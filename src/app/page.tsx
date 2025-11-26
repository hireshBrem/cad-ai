'use client';

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isDataUIPart, isToolUIPart } from "ai";
import { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ObjViewer from "@/components/ObjViewer";
import ToolCard from "@/components/ToolCard";
import { useTabs } from "@/hooks/tab";
import { XIcon, PackageIcon, ArrowUpRightIcon, PlusIcon, Loader2Icon, InfoIcon, DownloadIcon } from "lucide-react";

const CAD_JOB_ID_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/;
const TERMINAL_CAD_STATUSES = new Set([
  "completed",
  "failed",
  "rejected",
  "cancelled",
  "canceled",
]);

const isTerminalCadStatus = (status?: string) => {
  if (!status) return false;
  return TERMINAL_CAD_STATUSES.has(status.trim().toLowerCase());
};

export default function Home() {
    const [input, setInput] = useState('');
    const {
        tabs,
        activeTab,
        activeTabId,
        setActiveTabId,
        createNewTab,
        deleteTab,
        refreshTabs,
        isAtMaxTabs,
    } = useTabs();
    const [cadJob, setCadJob] = useState<unknown | null>(null);
    const [cadJobError, setCadJobError] = useState<string | null>(null);
    const [cadJobLoading, setCadJobLoading] = useState(false);
    const [infoOpen, setInfoOpen] = useState(false);
    const infoMenuRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
        api: "/api/agents/cad-agent/generate",
        }),
    });

    const isLoading = status === 'submitted' || status === 'streaming';

    const hasAssistantContent = messages.some(
        (message) => message.role !== 'user' && message.parts.length > 0
    );
    const showThinkingIndicator = status === 'submitted' || (status === 'streaming' && !hasAssistantContent);

    type CadToolOutput = {
        success?: boolean;
        data?: {
            id?: string;
        };
    };

    type MastraData = {
        id?: string;
        status?: string;
        text?: string;
        type?: string;
    };

    const submitMessage = async () => {
        if (!input.trim() || isLoading) return;

        const messageText = input;
        setInput('');
        await sendMessage({ text: messageText });
    };
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitMessage();
    };

    useEffect(() => {
        const jobId = activeTab?.jobId;
        if (jobId && CAD_JOB_ID_REGEX.test(jobId)) {
            handleCADfile(jobId);
        }
    }, [activeTab?.jobId, activeTab?.cadJob?.status]);

    useEffect(() => {
        const jobId = activeTab?.jobId;
        if (!jobId || !CAD_JOB_ID_REGEX.test(jobId)) {
            return;
        }

        if (isTerminalCadStatus(activeTab?.cadJob?.status)) {
            refreshTabs();
            return;
        }

        refreshTabs();
        const intervalId = setInterval(() => {
            refreshTabs();
        }, 3000);

        return () => clearInterval(intervalId);
    }, [activeTab?.jobId, activeTab?.cadJob?.status, refreshTabs]);

    useEffect(() => {
        if (!infoOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (infoMenuRef.current && !infoMenuRef.current.contains(event.target as Node)) {
                setInfoOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [infoOpen]);

    useEffect(() => {
        setInfoOpen(false);
    }, [activeTabId]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    const infoFields = activeTab
        ? [
            { label: 'Name', value: activeTab.name },
            { label: 'Job ID', value: activeTab.jobId }
        ].filter((field) => field.value)
        : [];

    const cadJobContent = cadJobLoading
        ? 'Fetching CAD job...'
        : cadJob
        ? typeof cadJob === 'string'
            ? cadJob
            : JSON.stringify(cadJob, null, 2)
        : 'No CAD job available.';

    const handleCADfile = async (tabId: string) => {
        const fallbackId = tabId ?? 'bc84c12a-64fb-4331-bac8-b0b83053d96d';
        setCadJobLoading(true);
        setCadJobError(null);
        setCadJob(null);

        try {
        const response = await fetch(`/api/cad-proxy?cadId=${encodeURIComponent(fallbackId)}`);
        const clonedResponse = response.clone();
        let payload: unknown;

        try {
            payload = await response.json();
        } catch {
            payload = await clonedResponse.text();
        }

        if (!response.ok) {
            const errorMessage = typeof payload === "string" ? payload : JSON.stringify(payload);
            throw new Error(`CAD proxy failed: ${errorMessage}`);
        }

        setCadJob(payload);
        } catch (error) {
        console.error("Failed to fetch CAD job", error);
        if (error instanceof Error) {
            setCadJobError(error.message);
        } else {
            setCadJobError("Unknown error fetching CAD job.");
        }
        } finally {
        setCadJobLoading(false);
        }
    };

    const handleDownloadSTEP = () => {
        const base64Data = activeTab?.cadJob?.outputs?.['source.step'];
        if (!base64Data) {
            console.error('No STEP file available');
        return;
        }

        try {
            // Decode base64 to binary
            const binaryString = atob(base64Data);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Create blob and download
            const blob = new Blob([bytes], { type: 'application/step' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `design_${activeTab?.jobId || 'export'}.step`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Failed to download STEP file:', error);
        }
    };

    // Watch for new text-to-cad tool results and refresh jobs
    useEffect(() => {
        for (const message of messages) {
            for (const part of message.parts) {
                if (isToolUIPart(part)) {
                    const toolOutput = part.output as CadToolOutput | undefined;
                    if (toolOutput?.success && toolOutput.data?.id) {
                        console.log('tool-text-to-cad part', part);
                        console.log('tool-text-to-cad output', toolOutput);
                        refreshTabs();

                        return;
                    }
                }
            }
        }
    }, [messages, refreshTabs]);

return (
    <div className="flex h-screen w-full bg-gray-100 font-sans items-stretch gap-4 p-2">
    {/* CAD Viewer - 70% */}
    <div className="w-[70%] flex flex-col h-full">
        {/* Tab Header */}
        <div className="tabs-scrollbar bg-white border-t border-l border-r border-gray-200 rounded-t-2xl flex items-center px-2 py-1 gap-1 overflow-x-auto">
        {tabs.map((tab) => (
            <div
            key={tab.tabId}
            onClick={() => setActiveTabId(tab.tabId)}
            className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl cursor-pointer transition-colors flex-shrink-0 ${
                activeTabId === tab.tabId
                ? 'bg-gray-800 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            >
            <PackageIcon className="w-4 h-4 flex-shrink-0" />
            <span className="text-base font-medium whitespace-nowrap">{tab.name}</span>
            {tabs.length > 1 && (
                <button
                onClick={(e) => {
                    e.stopPropagation();
                    void deleteTab(tab.tabId);
                }}
                className={`p-0.5 cursor-pointer hover:bg-gray-400 rounded transition-colors`}
                >
                <XIcon className="w-3 h-3" />
                </button>
            )}
            </div>
        ))}
        <button
            onClick={() => void createNewTab()}
            disabled={isAtMaxTabs}
            className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${
            isAtMaxTabs
                ? 'text-gray-300 cursor-not-allowed'
                : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'
            }`}
        >
            <PlusIcon className="w-4 h-4" />
        </button>
        </div>

        {/* CAD Viewer Content */}
        <div className="flex-1 flex items-stretch justify-center h-full rounded-b-2xl border border-gray-200">
        {activeTab?.cadJob ? (
            <div className="w-full relative flex flex-col h-full">
            <button
                type="button"
                onClick={() => setInfoOpen(!infoOpen)}
                className="absolute cursor-pointer top-3 right-3 z-10 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                aria-label="Toggle CAD info panel"
            >
                <InfoIcon className="h-4 w-4" />
            </button>
            {infoOpen && (
                <div
                ref={infoMenuRef}
                className="absolute top-14 right-0 z-20 w-96 rounded-2xl border border-gray-200 bg-white shadow-xl backdrop-blur-sm"
                >
                {/* Header */}
                <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
                    <h3 className="text-lg font-semibold text-gray-900">Design Details</h3>
                    <button
                    type="button"
                    onClick={() => setInfoOpen(false)}
                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                    aria-label="Close CAD info panel"
                    >
                    <XIcon className="h-5 w-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="space-y-6 px-6 py-4">
                    {/* Name Field */}
                    {infoFields.map((field) => {
                        if (field.label === "Name") {
                            return (
                                <div key={field.label} className="space-y-2">
                                    <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500">
                                        {field.label}
                                    </label>
                                    <p className="rounded-lg bg-gray-50 px-3 py-2.5 font-medium text-gray-900 break-all">
                                        {field.value}
                                    </p>
                                </div>
                            );
                        }
                    })}

                    {/* Download Button */}
                    {activeTab.cadJob?.outputs?.['source.step'] && (
                        <button
                            onClick={handleDownloadSTEP}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-gray-800 text-white font-medium rounded-2xl transition-colors duration-200"
                        >
                            <DownloadIcon className="w-4 h-4" />
                            <span>Export as STEP</span>
                        </button>
                    )}

                    {/* Error Message */}
                    {cadJobError && (
                        <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2.5">
                            <p className="text-sm text-red-700">{cadJobError}</p>
                        </div>
                    )}
                </div>
                </div>
            )}
            <div className="rounded-b-2xl bg-white/80 p-3 w-full h-full overflow-hidden">
                <div className="relative w-full h-full">
                {activeTab.cadJob?.status === 'completed' ? (
                    <ObjViewer base64ObjData={activeTab.cadJob?.outputs?.['source.obj'] ?? ''} />
                ) : activeTab.cadJob?.status === 'failed' || activeTab.cadJob?.status === 'rejected' ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                    <XIcon className="h-12 w-12 text-red-400 mb-3" />
                    <p className="text-lg font-medium text-red-600">CAD Generation Failed</p>
                    <p className="text-sm text-gray-500 mt-1 max-w-md">
                        {activeTab.cadJob?.prompt || 'An error occurred while generating the CAD model.'}
                    </p>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                    <Loader2Icon className="h-12 w-12 text-gray-400 mb-3 animate-spin" />
                    <p className="text-lg font-medium text-gray-600">Generating CAD Model</p>
                    <p className="text-sm text-gray-500 mt-1">
                        Status: {activeTab.cadJob?.status || 'pending'}
                    </p>
                    </div>
                )}
                </div>
            </div>
            </div>
        ) : (
            <div className=" text-center text-gray-400 flex flex-col items-center justify-center h-full w-full bg-white rounded-b-2xl">
            <PackageIcon className="mx-auto mb-3 h-12 w-12 text-gray-300" />
            <p className="text-sm text-gray-500">Start a new CAD job to get started.</p>
            </div>
        )}
        </div>
    </div>

    {/* Chat Panel - 30% */}
    <div className="w-[30%] rounded-2xl border border-gray-200 flex flex-col bg-white h-full overflow-hidden shadow-sm">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 info-scrollbar">
        {messages.length === 0 ? (
            <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-2xl text-gray-500">
            What do you want to design?
            </div>
        ) : (
            <div className="space-y-4 transition-all duration-200 ease-out">
            {messages.map((message) => (
                <div
                key={message.id}
                className={`flex ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
                >
                <div
                    className={`max-w-[80%] rounded-2xl ${
                    message.role === 'user'
                        ? 'bg-gray-800 text-white px-4 py-2'
                        : 'bg-transparent'
                    }`}
                >
                    {message.role === 'user' ? (
                    <p className="text-base whitespace-pre-wrap">
                        {message.parts
                        .map((part) => {
                            if (part.type === 'text' || part.type === 'reasoning') {
                            return part.text;
                            }
                            return '';
                        })
                        .join('')}
                    </p>
                    ) : (
                    <div className="space-y-2">
                        {message.parts.map((part, i) => {
                        // Handle text and reasoning parts
                        if (part.type === 'text' || part.type === 'reasoning') {
                            return (
                            <div key={`${message.id}-${i}`} className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-2">
                                <div className="text-base whitespace-pre-wrap break-words">
                                <ReactMarkdown  remarkPlugins={[remarkGfm]}>
                                    {part.text}
                                </ReactMarkdown>
                                </div>
                            </div>
                            );
                        }

                        // Handle tool parts (AI SDK v5 format: tool-<name>)
                        if (isToolUIPart(part)) {
                            const toolName = part.type.replace('tool-', '');

                            if (part.input !== undefined) {
                                return (
                                    <ToolCard
                                        key={`${message.id}-${i}`}
                                        toolName={toolName}
                                        variant="call"
                                        payload={part.input}
                                        label={part.toolCallId}
                                    />
                                );
                            }

                            if (part.output !== undefined) {
                                return (
                                    <ToolCard
                                        key={`${message.id}-${i}`}
                                        toolName={toolName}
                                        variant="result"
                                        payload={part.output}
                                        label={part.toolCallId}
                                    />
                                );
                            }
                        }

                        // Handle custom data parts from Mastra (data-*)
                        if (isDataUIPart(part)) {
                            const dataPart = part;
                            const mastraData = dataPart.data as MastraData;

                            // Agent data
                            if (mastraData?.id) {
                            return (
                                <div key={`${message.id}-${i}`} className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className={`w-2 h-2 rounded-full ${
                                    mastraData?.status === 'finished' ? 'bg-blue-500' : 'bg-blue-400 animate-pulse'
                                    }`}></div>
                                    <p className="text-xs font-semibold text-blue-700">Agent: {mastraData?.id || 'Unknown'}</p>
                                </div>
                                <p className="text-base text-gray-700">{mastraData?.text}</p>
                                </div>
                            );
                            }

                            // Workflow data
                            if (mastraData?.type === 'workflow') {
                            return (
                                <div key={`${message.id}-${i}`} className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                    <p className="text-xs font-semibold text-indigo-700">Workflow</p>
                                </div>
                                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(mastraData, null, 2)}
                                </pre>
                                </div>
                            );
                            }

                            // Network data
                            if (mastraData?.type === 'network') {
                            return (
                                <div key={`${message.id}-${i}`} className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3">
                                <div className="flex items-center gap-2 mb-2">
                                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                    <p className="text-xs font-semibold text-orange-700">Network</p>
                                </div>
                                <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                    {JSON.stringify(mastraData, null, 2)}
                                </pre>
                                </div>
                            );
                            }
                        }

                        return null;
                        })}
                    </div>)}
                </div>
                </div>
            ))}
            </div>
        )}
        {showThinkingIndicator && (
            <div className="flex justify-start">
            <div className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-2 flex items-center gap-2 transition-opacity duration-200 ease-out">
                <Loader2Icon className="w-4 h-4 animate-spin" />
                Thinking...
            </div>
            </div>
        )}
        <div ref={messagesEndRef} />
        </div>
        {/* Input Area */}
        <div className="p-4">
        <form onSubmit={handleSubmit} className="flex w-full flex-col gap-1 border border-gray-200 rounded-2xl p-2">
            <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                void submitMessage();
                }
            }}
            placeholder="Create a 3D model of a chair..."
            disabled={isLoading}
            rows={3}
            className="chat-textarea w-full min-h-[90px] p-1 text-base text-black resize-none focus:outline-none "
            />
            <div className="flex justify-end">
            <button
                type="submit"
                disabled={isLoading || !input?.trim()}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-900 text-white shadow-md hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <ArrowUpRightIcon className="w-4 h-4" />
            </button>
            </div>
        </form>
        </div>
    </div>
    </div>
);
}
