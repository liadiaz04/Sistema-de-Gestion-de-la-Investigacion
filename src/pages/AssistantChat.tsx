import React from "react"
import { Bot, Loader2, Send, User } from "lucide-react"
import { chatService } from "../services/chatService"
import "./AssistantChat.css"

type Message = {
  role: "user" | "assistant"
  content: string
}

export const AssistantChat: React.FC = () => {
  const [messages, setMessages] = React.useState<Message[]>([
    {
      role: "assistant",
      content: "Hola, soy tu asistente virtual. ¿En qué puedo ayudarte hoy?",
    },
  ])
  const [input, setInput] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const endRef = React.useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  React.useEffect(() => {
    scrollToBottom()
  }, [messages, loading])

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setError(null)

    const userMsg: Message = { role: "user", content: trimmed }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setLoading(true)

    try {
      const response = await chatService.sendMessage(trimmed)
      const assistantText =
        response?.answer?.trim() || "No se recibió contenido de respuesta."
      setMessages((prev) => [...prev, { role: "assistant", content: assistantText }])
    } catch (e) {
      setError("No se pudo enviar el mensaje. Inténtalo nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="assistant-chat-page">
      <div className="assistant-chat-card">
        <div className="assistant-chat-header">
          <h2>Asistente Virtual</h2>
          <p>Haz preguntas sobre los datos; el asistente consultará la base y te responderá.</p>
        </div>

        <div className="assistant-chat-body" role="log" aria-live="polite" aria-relevant="additions">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`chat-row ${m.role === "user" ? "chat-row--user" : "chat-row--assistant"}`}
            >
              <div className="chat-message-block">
                {m.role === "assistant" && (
                  <div className="chat-avatar chat-avatar--assistant" aria-hidden="true">
                    <Bot size={18} strokeWidth={2} />
                  </div>
                )}
                <div className="chat-message-content">
                  <span className="chat-role-label">
                    {m.role === "user" ? "Tú" : "Asistente"}
                  </span>
                  <div className={`chat-bubble chat-bubble--${m.role}`}>
                    <div className="chat-text">{m.content}</div>
                  </div>
                </div>
                {m.role === "user" && (
                  <div className="chat-avatar chat-avatar--user" aria-hidden="true">
                    <User size={18} strokeWidth={2} />
                  </div>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="chat-row chat-row--assistant">
              <div className="chat-message-block">
                <div className="chat-avatar chat-avatar--assistant" aria-hidden="true">
                  <Bot size={18} strokeWidth={2} />
                </div>
                <div className="chat-message-content">
                  <span className="chat-role-label">Asistente</span>
                  <div className="chat-bubble chat-bubble--assistant chat-bubble--typing" aria-busy="true">
                    <span className="dot" />
                    <span className="dot" />
                    <span className="dot" />
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {error && (
          <div className="assistant-chat-error" role="alert">
            {error}
          </div>
        )}

        <div className="assistant-chat-input">
          <label htmlFor="assistant-chat-message" className="visually-hidden">
            Escribe tu mensaje
          </label>
          <textarea
            id="assistant-chat-message"
            className="assistant-textarea"
            placeholder="Escribe tu pregunta… (Enter envía, Shift+Enter nueva línea)"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            disabled={loading}
            aria-label="Mensaje para el asistente"
          />
          <button
            type="button"
            className="assistant-send-icon"
            onClick={handleSend}
            disabled={loading}
            aria-label={loading ? "Enviando mensaje" : "Enviar mensaje"}
            title="Enviar"
          >
            {loading ? (
              <Loader2 className="assistant-send-icon-svg assistant-send-icon-svg--spin" size={22} aria-hidden="true" />
            ) : (
              <Send className="assistant-send-icon-svg" size={22} aria-hidden="true" />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
