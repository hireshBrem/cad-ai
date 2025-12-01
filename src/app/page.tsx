'use client';

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isDataUIPart, isToolUIPart } from "ai";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import ObjViewer from "@/components/ObjViewer";
import ToolCard from "@/components/ToolCard";
import CADInfoPanel from "@/components/CADInfoPanel";
import SettingsModal from "@/components/SettingsModal";
import { Toaster } from "@/components/ui/sonner";
import { useTabs } from "@/hooks/useTabs";
import { useApiKeys } from "@/hooks/useApiKeys";
import { useCADJob } from "@/hooks/useCADJob";
import { CadToolOutput, MastraData } from "@/types/app";
import { XIcon, PackageIcon, ArrowUpRightIcon, PlusIcon, Loader2Icon, InfoIcon, Settings2Icon } from "lucide-react";
import { toast } from "sonner";

export default function Home() {
    const [input, setInput] = useState('');
    const [infoOpen, setInfoOpen] = useState(false);
    const [settingsOpen, setSettingsOpen] = useState(false);
    const {
        openAIKey,
        kittyCADKey,
        setOpenAIKey,
        setKittyCADKey,
        showOpenAIKey,
        showKittyCADKey,
        setShowOpenAIKey,
        setShowKittyCADKey
    } = useApiKeys();
    const {
        tabs,
        activeTab,
        activeTabId,
        setActiveTabId,
        createNewTab,
        deleteTab,
        refreshTabs,
        isAtMaxTabs,
    } = useTabs( { kittyCADKey } );
    const { cadJobError, setCadJobError } = useCADJob({
        jobId: activeTab?.jobId,
        cadJobStatus: activeTab?.cadJob?.status,
        kittyCADKey,
        refreshTabs,
    });
    const infoMenuRef = useRef<HTMLDivElement | null>(null);
    const settingsMenuRef = useRef<HTMLDivElement | null>(null);
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({
            api: "/api/agents/cad-agent/generate",
            body: { openAIKey },
        }),
    });

    const isLoading = status === 'submitted' || status === 'streaming';

    const hasAssistantContent = messages.some(
        (message) => message.role !== 'user' && message.parts.length > 0
    );
    
    const showThinkingIndicator = status === 'submitted' || (status === 'streaming' && !hasAssistantContent);

    const submitMessage = async () => {
        if (!input.trim() || isLoading) return;

        if (!openAIKey.trim() && !process.env.NEXT_PUBLIC_OPENAI_API_KEY?.trim()) {
            toast.error('OpenAI API key is required. Please set it in settings.');
            return;
        }

        if (!kittyCADKey.trim() && !process.env.NEXT_PUBLIC_KITTYCAD_API_KEY){
            toast.error('KittyCAD API key is required. Please set it in settings.');
            return;
        }

        const messageText = input;
        setInput('');
        await sendMessage({ text: messageText });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        await submitMessage();
    };

    useEffect(() => {
        console.log('tabs', tabs);
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
        if (!settingsOpen) return;
        const handleClick = (event: MouseEvent) => {
            if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target as Node)) {
                setSettingsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => {
            document.removeEventListener('mousedown', handleClick);
        };
    }, [settingsOpen]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({
            behavior: isLoading ? 'auto' : 'smooth'
        });
    }, [messages, isLoading]);

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
        <Toaster />
        {/* CAD Viewer - 70% */}
        <div className="w-[70%] flex flex-col h-full">
            {/* Tab Header */}
            <div className="tabs-scrollbar bg-white border-t border-l border-r border-gray-200 rounded-t-2xl flex items-center px-2 py-1 gap-1 overflow-x-auto">
            {tabs.map((tab) => (
                <div
                key={tab.tabId}
                onClick={() => {
                    if (activeTabId !== tab.tabId) {
                        setInfoOpen(false);
                    }
                    setActiveTabId(tab.tabId);
                }}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded-2xl cursor-pointer transition-colors shrink-0 ${
                    activeTabId === tab.tabId
                    ? 'bg-gray-800 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                >
                <PackageIcon className="w-4 h-4 shrink-0" />
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
                className={`p-1.5 rounded-md transition-colors shrink-0 ${
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
            {/* Display  if only openai and kittycad keys are set */}
            
            { kittyCADKey && activeTab?.cadJob ? (
                <div className="w-full relative flex flex-col h-full">
                <button
                    type="button"
                    onClick={(e) => {
                        e.stopPropagation();
                        setInfoOpen(!infoOpen);
                    }}
                    className="absolute cursor-pointer top-3 right-3 z-10 inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    aria-label="Toggle CAD info panel"
                >
                    <InfoIcon className="h-4 w-4" />
                </button>
                <CADInfoPanel
                    activeTab={activeTab}
                    cadJobError={cadJobError}
                    isOpen={infoOpen}
                    onClose={() => setInfoOpen(false)}
                    menuRef={infoMenuRef}
                />
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
            {/* Chat Header */}
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 shrink-0">
                <h2 className="text-lg font-semibold text-gray-900"></h2>
                <button
                    type="button"
                    onClick={() => setSettingsOpen(!settingsOpen)}
                    className="inline-flex items-center justify-center rounded-full border border-gray-200 bg-white p-2 text-gray-600 shadow-sm transition hover:bg-gray-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-gray-500"
                    aria-label="Open settings"
                >
                    <Settings2Icon className="h-4 w-4" />
                </button>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 info-scrollbar">
            {messages.length === 0 ? (
                <div className="flex h-full min-h-[200px] flex-col items-center justify-center text-2xl text-gray-500">
                What do you want to design?
                </div>
            ) : (
                <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                {messages.map((message) => (
                    <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
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
                                <motion.div
                                    key={`${message.id}-${i}`}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2, ease: "easeOut" }}
                                    className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-2"
                                >
                                    <div className="text-base whitespace-pre-wrap wrap-break-word">
                                    <ReactMarkdown  remarkPlugins={[remarkGfm]}>
                                        {part.text}
                                    </ReactMarkdown>
                                    </div>
                                </motion.div>
                                );
                            }

                            // Handle tool parts (AI SDK v5 format: tool-<name>)
                            if (isToolUIPart(part)) {
                                const toolName = part.type.replace('tool-', '');

                                if (part.input !== undefined) {
                                    return (
                                        <motion.div
                                            key={`${message.id}-${i}`}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                        >
                                            <ToolCard
                                                toolName={toolName}
                                                variant="call"
                                                payload={part.input}
                                                label={part.toolCallId}
                                            />
                                        </motion.div>
                                    );
                                }

                                if (part.output !== undefined) {
                                    return (
                                        <motion.div
                                            key={`${message.id}-${i}`}
                                            initial={{ opacity: 0, scale: 0.98 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            transition={{ duration: 0.2, ease: "easeOut" }}
                                        >
                                            <ToolCard
                                                toolName={toolName}
                                                variant="result"
                                                payload={part.output}
                                                label={part.toolCallId}
                                            />
                                        </motion.div>
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
                                    <motion.div
                                        key={`${message.id}-${i}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className={`w-2 h-2 rounded-full ${
                                            mastraData?.status === 'finished' ? 'bg-blue-500' : 'bg-blue-400 animate-pulse'
                                            }`}></div>
                                            <p className="text-xs font-semibold text-blue-700">Agent: {mastraData?.id || 'Unknown'}</p>
                                        </div>
                                        <p className="text-base text-gray-700">{mastraData?.text}</p>
                                    </motion.div>
                                );
                                }

                                // Workflow data
                                if (mastraData?.type === 'workflow') {
                                return (
                                    <motion.div
                                        key={`${message.id}-${i}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-indigo-500 rounded-full"></div>
                                            <p className="text-xs font-semibold text-indigo-700">Workflow</p>
                                        </div>
                                        <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(mastraData, null, 2)}
                                        </pre>
                                    </motion.div>
                                );
                                }

                                // Network data
                                if (mastraData?.type === 'network') {
                                return (
                                    <motion.div
                                        key={`${message.id}-${i}`}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.2, ease: "easeOut" }}
                                        className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-3"
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                            <p className="text-xs font-semibold text-orange-700">Network</p>
                                        </div>
                                        <pre className="text-xs text-gray-600 overflow-x-auto whitespace-pre-wrap">
                                            {JSON.stringify(mastraData, null, 2)}
                                        </pre>
                                    </motion.div>
                                );
                                }
                            }

                            return null;
                            })}
                        </div>
                        )}
                    </div>
                    </motion.div>
                ))}
                </AnimatePresence>
                </div>
            )}
            <AnimatePresence>
                {showThinkingIndicator && (
                    <motion.div
                        key="thinking-indicator"
                        className="flex justify-start"
                    >
                        <motion.div
                            className="bg-gray-100 text-gray-900 rounded-2xl px-4 py-2 flex items-center gap-2"          >
                            <motion.div
                                transition={{
                                    duration: 1,
                                    repeat: Infinity,
                                    ease: "linear"
                                }}
                            >
                                <Loader2Icon className="w-4 h-4" />
                            </motion.div>
                            <motion.span
                                transition={{
                                    duration: 1.5,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                Thinking...
                            </motion.span>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
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

        <SettingsModal
            isOpen={settingsOpen}
            onClose={() => setSettingsOpen(false)}
            openAIKey={openAIKey}
            setOpenAIKey={setOpenAIKey}
            showOpenAIKey={showOpenAIKey}
            setShowOpenAIKey={setShowOpenAIKey}
            kittyCADKey={kittyCADKey}
            setKittyCADKey={setKittyCADKey}
            showKittyCADKey={showKittyCADKey}
            setShowKittyCADKey={setShowKittyCADKey}
            menuRef={settingsMenuRef}
        />
    </div>
)}