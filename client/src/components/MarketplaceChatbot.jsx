import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useChatbot } from "../hooks/useChatbot.js";

const URL_RE = /(https?:\/\/[^\s]+)/g;

function renderTextWithLinks(text) {
  const lines = String(text ?? "").split("\n");
  return lines.map((line, lineIdx) => (
    <span key={lineIdx}>
      {lineIdx > 0 ? <br /> : null}
      {line.split(URL_RE).map((part, i) => {
        if (part?.match?.(/^https?:\/\//)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-purple-600 underline underline-offset-2 hover:text-purple-800"
            >
              {part}
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </span>
  ));
}

const SUGGESTED = [
  "🔥 What's trending right now?",
  "⭐ Best rated products?",
  "🏢 Tell me about the companies",
  "💡 Recommend something for me",
];

export default function MarketplaceChatbot() {
  const { messages, isLoading, sendMessage, clearChat } = useChatbot();
  const [chatOpen, setChatOpen] = useState(false);
  const [panelMounted, setPanelMounted] = useState(false);
  const [panelEnter, setPanelEnter] = useState(false);
  const closeTimerRef = useRef(null);
  const [input, setInput] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef(null);
  const prevLoadingRef = useRef(false);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (prevLoadingRef.current && !isLoading && !chatOpen) {
      const last = messages[messages.length - 1];
      if (last?.role === "assistant") {
        setUnread((n) => n + 1);
      }
    }
    prevLoadingRef.current = isLoading;
  }, [isLoading, messages, chatOpen]);

  const openPanel = useCallback(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    setChatOpen(true);
    setPanelMounted(true);
    setPanelEnter(false);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelEnter(true));
    });
    setUnread(0);
  }, []);

  const closePanel = useCallback(() => {
    setPanelEnter(false);
    closeTimerRef.current = window.setTimeout(() => {
      setChatOpen(false);
      setPanelMounted(false);
      closeTimerRef.current = null;
    }, 300);
  }, []);

  const toggleChat = useCallback(() => {
    if (chatOpen) closePanel();
    else openPanel();
  }, [chatOpen, closePanel, openPanel]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  const onSubmit = useCallback(() => {
    const t = input.trim();
    if (!t || isLoading) return;
    sendMessage(t);
    setInput("");
  }, [input, isLoading, sendMessage]);

  const onKeyDown = useCallback(
    (e) => {
      if (e.key !== "Enter" || e.shiftKey) return;
      e.preventDefault();
      onSubmit();
    },
    [onSubmit],
  );

  const onSuggested = useCallback(
    (q) => {
      setInput(q);
      sendMessage(q);
      setInput("");
    },
    [sendMessage],
  );

  const handleClear = useCallback(() => {
    clearChat();
    setUnread(0);
  }, [clearChat]);

  const chatClosed = !chatOpen;

  /** Portal to document.body so position:fixed stays tied to the viewport while scrolling (avoids transformed/clipping ancestors). */
  if (typeof document === "undefined") return null;

  return createPortal(
    <>
      <button
        type="button"
        onClick={toggleChat}
        aria-expanded={chatOpen}
        aria-label={chatOpen ? "Close ShopVerse AI chat" : "Open ShopVerse AI chat"}
        className="fixed bottom-6 right-4 z-[10050] flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-blue-500 text-white shadow-lg shadow-purple-500/30 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2 sm:right-6"
      >
        {chatClosed ? (
          <span className="pointer-events-none absolute inset-0 z-0 animate-ping rounded-full bg-purple-400 opacity-30" />
        ) : null}
        <span
          className={`relative z-10 inline-flex transition-all duration-200 ${
            chatOpen ? "rotate-90" : "rotate-0"
          }`}
        >
          {chatOpen ? (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" aria-hidden>
              <path
                d="M18 6L6 18M6 6l12 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            <svg className="h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M4 5h16v10H8l-4 4V5zm2 2v8h10V7H6z" />
            </svg>
          )}
        </span>
        {chatClosed && unread > 0 ? (
          <span className="absolute -right-1 -top-1 z-20 flex h-5 w-5 animate-bounce items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        ) : null}
      </button>

      {panelMounted ? (
        <div
          className={`fixed bottom-20 right-3 z-[10050] flex h-[520px] w-[calc(100vw-24px)] flex-col overflow-hidden rounded-2xl border border-purple-100 bg-white text-gray-900 shadow-2xl shadow-purple-500/20 transition-all duration-300 ease-out sm:bottom-24 sm:right-6 sm:w-96 ${
            panelEnter ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <header className="flex h-16 shrink-0 items-center justify-between rounded-t-2xl bg-gradient-to-r from-purple-600 to-blue-500 px-4">
            <div className="flex min-w-0 items-center gap-3">
              <span className="relative h-[10px] w-[10px] shrink-0 rounded-full bg-green-400 animate-pulse" />
              <div className="min-w-0">
                <div className="truncate font-bold text-white">ShopVerse AI</div>
                <div className="truncate text-xs text-white/80">Ask me anything about our marketplace</div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <button
                type="button"
                onClick={handleClear}
                className="rounded-lg p-2 text-white transition hover:bg-white/10"
                aria-label="Clear chat"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path
                    d="M3 6h18M8 6V4h8v2m1 0v14a2 2 0 01-2 2H9a2 2 0 01-2-2V6h10z"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={closePanel}
                className="rounded-lg p-2 text-white transition hover:bg-white/10"
                aria-label="Minimize chat"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
                  <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </header>

          <div
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div
              className="min-h-0 flex-1 overflow-y-auto p-4 [scrollbar-width:thin] [scrollbar-color:rgb(233_213_255)_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-purple-200"
            >
              {messages.length === 0 ? (
                <div className="flex flex-col items-center px-2 pt-4">
                  <span className="text-4xl" aria-hidden>
                    🤖✨
                  </span>
                  <p className="mt-4 text-center font-semibold text-gray-800">
                    Hi! I&apos;m your marketplace assistant 👋
                  </p>
                  <p className="mt-2 text-center text-sm text-gray-500">
                    Ask me anything about products, companies, or reviews
                  </p>
                  <div className="mt-6 grid w-full max-w-sm grid-cols-1 gap-2 sm:grid-cols-2">
                    {SUGGESTED.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => onSuggested(q)}
                        className="cursor-pointer rounded-full border border-purple-200 bg-purple-50 px-4 py-2 text-left text-sm text-purple-700 transition duration-200 hover:bg-purple-100"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {messages.map((m) => (
                    <li key={m.id} className={`flex flex-col ${m.role === "user" ? "items-end" : "items-start"}`}>
                      <div
                        className={
                          m.role === "user"
                            ? "ml-auto max-w-[80%] rounded-2xl rounded-br-sm bg-gradient-to-r from-purple-600 to-blue-500 px-4 py-2.5 text-sm font-normal text-white"
                            : "mr-auto max-w-[80%] rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-2.5 text-sm text-gray-800"
                        }
                      >
                        {m.role === "user" ? (
                          <span className="whitespace-pre-wrap">{m.content}</span>
                        ) : (
                          <span className="whitespace-pre-wrap">{renderTextWithLinks(m.content)}</span>
                        )}
                      </div>
                      <span className="mt-1 text-xs text-gray-400">{m.time}</span>
                    </li>
                  ))}
                  {isLoading ? (
                    <li className="flex flex-col items-start">
                      <div className="mr-auto flex max-w-[80%] items-center gap-1 rounded-2xl rounded-bl-sm bg-gray-100 px-4 py-3">
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "0ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "75ms" }}
                        />
                        <span
                          className="h-1.5 w-1.5 animate-bounce rounded-full bg-gray-400"
                          style={{ animationDelay: "150ms" }}
                        />
                      </div>
                    </li>
                  ) : null}
                </ul>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="shrink-0 rounded-b-2xl border-t border-gray-100 bg-white p-3">
              <div className="flex items-end gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onKeyDown}
                  placeholder="Ask about products, companies…"
                  disabled={isLoading}
                  className="min-w-0 flex-1 rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-900 caret-gray-900 outline-none transition duration-200 placeholder:text-gray-400 focus:border-purple-400 focus:ring-2 focus:ring-purple-100 disabled:opacity-60"
                />
                <button
                  type="button"
                  onClick={onSubmit}
                  disabled={!input.trim() || isLoading}
                  className="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full bg-gradient-to-r from-purple-600 to-blue-500 text-white shadow-sm transition duration-200 hover:brightness-110 disabled:opacity-50"
                  aria-label="Send message"
                >
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                    <path d="M12 5l8 9H4l8-9z" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </>,
    document.body,
  );
}
