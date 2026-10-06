import { useState, useRef, useEffect } from "react";
import api from "../services/api";
import Layout from "../components/Layout";
import { Send, Bot, User, Sparkles, FileText } from "lucide-react";

const suggestedQuestions = [
  "What are the main safety procedures?",
  "Summarize recent incident reports",
  "Find documents about signal failures",
];

export default function AskAI() {
  const [messages, setMessages] = useState([]);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleAsk = async (e) => {
    e.preventDefault();
    if (!question.trim() || loading) return;

    const userMessage = { role: "user", text: question };
    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");
    setLoading(true);

    try {
      const res = await api.post("/ai/ask", null, { params: { question: userMessage.text } });
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: res.data.answer, sources: res.data.sources },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "ai", text: "Sorry, something went wrong answering that." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>Ask AI</h1>
          <p>Get answers grounded in the knowledge you’ve added to your workspace.</p>
        </div>
      </div>

      <div className="chat-container">
        <div className="chat-messages">
          {messages.length === 0 && (
            <div className="ai-welcome">
              <div className="ai-orbit">
                <div className="ai-orbit-ring ai-orbit-ring-outer" />
                <div className="ai-orbit-ring ai-orbit-ring-inner" />
                <div className="ai-orbit-document"><FileText size={20} /></div>
                <div className="ai-orbit-sparkle"><Sparkles size={16} /></div>
                <div className="ai-orbit-core"><Bot size={26} /></div>
              </div>
              <div className="ai-welcome-kicker">Your document copilot</div>
              <h2>What would you like to know?</h2>
              <p>Ask a question and I’ll look across your uploaded documents to find a useful answer.</p>
              <div className="ai-suggestions">
                {suggestedQuestions.map((suggestion) => (
                  <button type="button" key={suggestion} onClick={() => setQuestion(suggestion)}>
                    <Sparkles size={13} /> {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`chat-message ${msg.role}`}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4, fontSize: 12, opacity: 0.8 }}>
                {msg.role === "user" ? <User size={12} /> : <Bot size={12} />}
                {msg.role === "user" ? "You" : "AI"}
              </div>
              {msg.text}
              {msg.sources?.length > 0 && (
                <div className="chat-sources">Sources: {msg.sources.length} document(s)</div>
              )}
            </div>
          ))}
          {loading && (
            <div className="chat-message ai loading-dots">
              <span></span><span></span><span></span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleAsk} className="chat-input-row">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask something about your documents..."
            disabled={loading}
          />
          <button type="submit" className="btn-primary" disabled={loading}>
            <Send size={16} />
          </button>
        </form>
      </div>
    </Layout>
  );
}
