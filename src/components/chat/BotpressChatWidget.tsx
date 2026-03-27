import { useEffect, useMemo, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "react-router-dom";

const CHAT_PAGES = new Set(["/budget", "/forecast"]);

type FinanceAIContext = {
  source?: "budget" | "forecast" | "dashboard";
  summary?: string;
  metrics?: Record<string, string | number>;
  highlights?: string[];
};

export const BotpressChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [suggestedPrompt, setSuggestedPrompt] = useState<string>("");
  const [contextData, setContextData] = useState<FinanceAIContext | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  const chatUrl = useMemo(
    () =>
      import.meta.env.VITE_BOTPRESS_SHAREABLE_URL ||
      "https://cdn.botpress.cloud/webchat/v3.6/shareable.html?configUrl=https://files.bpcontent.cloud/2026/03/27/03/20260327034729-FKEBPQOA.json",
    []
  );

  const shouldRender = CHAT_PAGES.has(location.pathname);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth < 1024);
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onOpenRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ prompt?: string; context?: FinanceAIContext }>;
      if (customEvent.detail?.prompt) {
        setSuggestedPrompt(customEvent.detail.prompt);
      }
      if (customEvent.detail?.context) {
        setContextData(customEvent.detail.context);
      }
      setIsOpen(true);
    };

    window.addEventListener("finance-ai:open", onOpenRequest as EventListener);
    return () => {
      window.removeEventListener("finance-ai:open", onOpenRequest as EventListener);
    };
  }, []);

  useEffect(() => {
    if (!shouldRender && isOpen) {
      setIsOpen(false);
      setSuggestedPrompt("");
    }
  }, [isOpen, shouldRender]);

  useEffect(() => {
    window.dispatchEvent(
      new CustomEvent("finance-ai:state", {
        detail: {
          open: shouldRender && isOpen,
          path: location.pathname,
        },
      })
    );
  }, [isOpen, location.pathname, shouldRender]);

  if (!shouldRender) {
    return null;
  }

  const fullPrompt = [
    suggestedPrompt,
    contextData?.summary ? `Context summary: ${contextData.summary}` : "",
    contextData?.metrics && Object.keys(contextData.metrics).length
      ? `Dashboard metrics: ${Object.entries(contextData.metrics)
          .map(([key, value]) => `${key}=${value}`)
          .join(", ")}`
      : "",
    contextData?.highlights?.length ? `Highlights: ${contextData.highlights.join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const copyPrompt = async () => {
    if (!fullPrompt) return;
    await navigator.clipboard.writeText(fullPrompt);
  };

  return (
    <>
      {isOpen && (
        <div
          className={`fixed z-50 overflow-hidden rounded-2xl border bg-card shadow-2xl transition-all duration-300 ${
            isMobile
              ? "inset-x-3 bottom-24 top-20"
              : "bottom-6 right-4 h-[calc(100vh-7rem)] w-[380px] max-h-[760px]"
          }`}
        >
          <div className="flex items-center justify-between border-b bg-primary/5 px-3 py-2">
            <div>
              <p className="text-sm font-semibold">Finance AI Assistant</p>
              <p className="text-[11px] text-muted-foreground">Budget and forecast helper</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              aria-label="Close chat"
              className="h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          {suggestedPrompt && (
            <div className="border-b bg-muted/50 px-3 py-2">
              <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Suggested question</p>
              <p className="mt-1 text-xs text-foreground">{suggestedPrompt}</p>
              {(contextData?.summary || contextData?.metrics || contextData?.highlights?.length) && (
                <div className="mt-2 rounded-md border bg-background p-2">
                  <p className="text-[11px] font-medium text-muted-foreground">Live dashboard context attached</p>
                  {contextData?.summary && <p className="mt-1 text-[11px]">{contextData.summary}</p>}
                  <Button type="button" size="sm" variant="outline" className="mt-2 h-7 w-full text-xs" onClick={copyPrompt}>
                    Copy Full AI Prompt
                  </Button>
                </div>
              )}
            </div>
          )}
          <iframe
            title="Botpress Assistant"
            src={chatUrl}
            className={`w-full border-0 ${suggestedPrompt ? "h-[calc(100%-95px)]" : "h-[calc(100%-56px)]"}`}
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <Button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed bottom-6 right-4 z-50 h-12 rounded-full px-4 shadow-lg"
        aria-label={isOpen ? "Hide chatbot" : "Open chatbot"}
      >
        <MessageCircle className="h-5 w-5" />
        <span className="ml-2 text-sm">AI Assistant</span>
      </Button>
    </>
  );
};
