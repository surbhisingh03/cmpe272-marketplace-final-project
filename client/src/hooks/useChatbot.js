import { useCallback, useEffect, useRef, useState } from "react";

const STORAGE_KEY = "shopverse_chat_mock_v1";
const MAX_MESSAGES = 50;
const DAY_MS = 86400000;

const SYSTEM_PROMPT = `You are ShopVerse AI, a helpful assistant for the 
ShopVerse marketplace. The marketplace has 4 member companies:

1. Nexus Academy (by Geeshitha) - online courses and education
   URL: https://geeshitha.com/nexus-academy/
   
2. Travel Agency (by Surbhi) - travel packages and experiences  
   URL: https://surbhisingh.com/travel-agency/index.php
   
3. Kavya's Company (by Kavya) - products and services
   URL: https://srikavyagelli.com/index.php
   
4. Krativerse (by Krati) - creative products and services
   URL: https://krativerse.com/

Your role:
- Help users discover products and services across all 4 companies
- Answer questions about the marketplace features (reviews, ratings, 
  visit tracking, leaderboards, user accounts)
- Recommend products based on what the user is looking for
- Give honest, helpful responses about any company or product
- If asked about pricing or specific availability, 
  direct users to visit the company site
- Keep responses concise (2-4 sentences max) unless user asks for detail
- Use a friendly, enthusiastic tone with occasional emojis
- When recommending a company, always include their URL as a clickable link

Never make up specific product names, prices, or details you don't know.
If unsure, say "I'd recommend visiting [company URL] directly for the latest info."`;

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
  const abortRef = useRef(null);

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
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }
    };
  }, []);

  const sendMessage = useCallback(async (userText) => {
    const trimmed = userText.trim();
    if (!trimmed || isLoading) return;

    const userMsg = {
      role: "user",
      content: trimmed,
      id: Date.now(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const conversationHistory = [...messages, userMsg].map((m) => ({
      role: m.role,
      content: m.content,
    }));

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    const apiKey = import.meta.env.VITE_GROQ_API_KEY;
    if (!apiKey) {
      const aiMsg = {
        role: "assistant",
        content:
          "I can't see a Groq API key in the client app. Add VITE_GROQ_API_KEY=your_key to client/.env (not server/.env), save, then stop and restart npm run dev in the client folder. Vite only reads variables that start with VITE_.",
        id: Date.now() + 1,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsLoading(false);
      return;
    }

    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [{ role: "system", content: SYSTEM_PROMPT }, ...conversationHistory],
          temperature: 0.7,
          max_tokens: 500,
        }),
        signal: controller.signal,
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const errText =
          data?.error?.message || data?.message || `Request failed (${response.status}). Please try again.`;
        throw new Error(errText);
      }

      const aiText =
        data?.choices?.[0]?.message?.content ||
        "Sorry, I couldn't get a response. Please try again!";

      const aiMsg = {
        role: "assistant",
        content: aiText,
        id: Date.now() + 1,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      if (err?.name === "AbortError") return;
      const errMsg = {
        role: "assistant",
        content: "Oops! Something went wrong. Please try again in a moment 🙏",
        id: Date.now() + 1,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setIsLoading(false);
    }
  }, [messages, isLoading]);

  const clearChat = useCallback(() => {
    if (abortRef.current) {
      abortRef.current.abort();
      abortRef.current = null;
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
