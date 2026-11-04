import React, { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../context/GameStore';
import { useGame } from '../../hooks/useGame';
import type { ChatMessage } from '../../types/game';

interface ChatBoxProps {
  onSend: (text: string) => void;
}

const MessageBubble: React.FC<{ msg: ChatMessage; isOwn: boolean }> = ({ msg, isOwn }) => {
  const time = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const shortId = msg.senderId.slice(0, 6) + '…';

  return (
    <div className={`chat__bubble-wrapper ${isOwn ? 'chat__bubble-wrapper--own' : ''}`}>
      {!isOwn && <span className="chat__sender">{shortId}</span>}
      <div className={`chat__bubble ${isOwn ? 'chat__bubble--own' : 'chat__bubble--other'}`}>
        <span className="chat__text">{msg.text}</span>
      </div>
      <span className="chat__time">{time}</span>
    </div>
  );
};

export const ChatBox: React.FC<ChatBoxProps> = ({ onSend }) => {
  const [input, setInput] = useState('');
  const { playerId, isSpectator } = useGame();
  const playerChat = useGameStore((s) => s.playerChat);
  const spectatorChat = useGameStore((s) => s.spectatorChat);
  const messages: ChatMessage[] = isSpectator ? spectatorChat : playerChat;
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    onSend(text);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="chat">
      <div className="chat__header">
        {isSpectator ? '👥 Spectator Chat' : '💬 Player Chat'}
      </div>
      <div className="chat__messages">
        {messages.length === 0 ? (
          <div className="chat__empty">No messages yet. Say hello!</div>
        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={i}
              msg={msg}
              isOwn={msg.senderId === playerId}
            />
          ))
        )}
        <div ref={bottomRef} />
      </div>
      <div className="chat__input-row">
        <input
          className="chat__input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          maxLength={200}
        />
        <button className="chat__send-btn" onClick={handleSend} disabled={!input.trim()}>
          ➤
        </button>
      </div>
    </div>
  );
};
