import { useCallback, useEffect, useRef, useState } from "react";

/** Bumped so older sessions (with API-key error text) are not rehydrated after mock switch. */
const STORAGE_KEY = "shopverse_chat_mock_v1";
const MAX_MESSAGES = 50;
const DAY_MS = 86400000;
const MOCK_DELAY_MS = 1000;

function mockReply(userText) {
  const lower = String(userText || "").toLowerCase();
  if (lower.includes("trending")) {
    return "🔥 Trending right now: Nexus Academy courses and Travel Agency packages!";
  }
  if (lower.includes("companies")) {
    return "We have 4 companies: Nexus Academy, Travel Agency, Kavya's Company, and Krativerse.";
  }
  if (lower.includes("recommend")) {
    return "I'd recommend checking out Nexus Academy for learning or Travel Agency for experiences!";
  }
  return "That's interesting! You can explore products and companies in the marketplace to learn more 😊";
}

function loadStoredMessages() {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    const cutoff = Date.now() - DAY_MS;
    return arr
      .filter((m) => m && typeof m.id === "number" && m.id >= cutoff && m.role && m.content != null)
      .slice(-MAX_MESSAGES);
  } catch {
    return [];
  }
}

function persistMessages(messages) {
  if (typeof window === "undefined") return;
  try {
    const slice = messages.slice(-MAX_MESSAGES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slice));
  } catch {
    /* ignore */
  }
}

export function useChatbot() {
  const [messages, setMessages] = useState(loadStoredMessages);
  const [isLoading, setIsLoading] = useState(false);
  const mockTimerRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.removeItem("shopverse_chat");
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    persistMessages(messages);
  }, [messages]);

  useEffect(() => {
    return () => {
      if (mockTimerRef.current != null) {
        window.clearTimeout(mockTimerRef.current);
        mockTimerRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback((userText) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    if (mockTimerRef.current != null) {
      window.clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }

    const userMsg = {
      role: "user",
      content: trimmed,
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    mockTimerRef.current = window.setTimeout(() => {
      mockTimerRef.current = null;
      const content = mockReply(trimmed);
      const aiMsg = {
        role: "assistant",
        content,
        id: Date.now() + 1,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
    }, MOCK_DELAY_MS);
  }, [isLoading]);

  const clearChat = useCallback(() => {
    if (mockTimerRef.current != null) {
      window.clearTimeout(mockTimerRef.current);
      mockTimerRef.current = null;
    }
    setIsLoading(false);
    setMessages([]);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      /* ignore */
    }
  }, []);

  return { messages, isLoading, sendMessage, clearChat };
}
