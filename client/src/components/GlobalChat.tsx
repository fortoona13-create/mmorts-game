import React, { useState, useEffect } from 'react';
import { chatAPI } from '../../services/api';
import { ChatMessage } from '../../types';

interface GlobalChatProps {
  username: string | undefined;
}

const GlobalChat: React.FC<GlobalChatProps> = ({ username }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadMessages();
    const interval = setInterval(loadMessages, 3000);
    return () => clearInterval(interval);
  }, []);

  const loadMessages = async () => {
    try {
      const response = await chatAPI.getGlobalChat(30);
      setMessages(response.data.messages);
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsLoading(true);
    try {
      await chatAPI.sendMessage(newMessage, 'global');
      setNewMessage('');
      await loadMessages();
    } catch (error) {
      console.error('Failed to send message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-gray-800 border-2 border-green-500 rounded-lg p-4 h-96 flex flex-col">
      <h2 className="text-lg font-bold text-white mb-2">💬 Global Chat</h2>
      
      <div className="flex-1 overflow-y-auto mb-3 space-y-2 bg-gray-900 p-2 rounded">
        {messages.length === 0 ? (
          <div className="text-gray-400 text-sm text-center py-8">No messages yet...</div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className="text-sm">
              <span className="text-cyan-400 font-bold">{msg.username}:</span>
              <span className="text-gray-300 ml-2">{msg.message}</span>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type message..."
          className="flex-1 bg-gray-700 text-white px-3 py-2 rounded text-sm focus:outline-none focus:border-green-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm font-bold"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default GlobalChat;
