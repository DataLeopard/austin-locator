import { useState, useRef, useEffect } from 'react';

export default function Chat({ agent, onResults, onHighlight }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (agent) {
      const welcome = agent.getWelcome();
      setMessages([{ role: 'bot', ...welcome }]);
    }
  }, [agent]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = (text) => {
    if (!text.trim() || !agent) return;

    const userMsg = { role: 'user', text };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const response = agent.processMessage(text);
      const botMsg = { role: 'bot', ...response };
      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);

      if (response.results) {
        onResults(response.results);
      }
      if (response.highlightNeighborhoods) {
        onHighlight(response.highlightNeighborhoods);
      }
    }, 400 + Math.random() * 400);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleQuickReply = (reply) => {
    sendMessage(reply);
  };

  const formatText = (text) => {
    // Simple markdown-like formatting
    let html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');
    return { __html: html };
  };

  return (
    <div className="chat-panel">
      <div className="chat-header">
        <h2>Chat</h2>
        <button
          className="btn-reset"
          onClick={() => sendMessage('start over')}
          title="Start over"
        >
          Reset
        </button>
      </div>

      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-msg chat-msg-${msg.role}`}>
            {msg.role === 'bot' && <div className="chat-avatar">AI</div>}
            <div className="chat-bubble">
              <div dangerouslySetInnerHTML={formatText(msg.text)} />
              {msg.role === 'bot' && msg.quickReplies && msg.quickReplies.length > 0 && (
                <div className="quick-replies">
                  {msg.quickReplies.map((reply, j) => (
                    <button
                      key={j}
                      className="quick-reply-btn"
                      onClick={() => handleQuickReply(reply)}
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="chat-msg chat-msg-bot">
            <div className="chat-avatar">AI</div>
            <div className="chat-bubble typing">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form className="chat-input-form" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about Austin neighborhoods..."
          className="chat-input"
        />
        <button type="submit" className="chat-send-btn" disabled={!input.trim()}>
          Send
        </button>
      </form>
    </div>
  );
}
