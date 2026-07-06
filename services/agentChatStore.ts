import { useState, useEffect } from 'react';
import type { ChatMsg } from '../types';

// Module-level state — survives React component unmounts (navigation away and back)
// Cleared only on full page refresh.
let _messages: ChatMsg[] = [];
const _listeners = new Set<() => void>();

function notify() {
  _listeners.forEach((fn) => fn());
}

export const agentStore = {
  getMessages: () => _messages,

  setMessages(updater: ChatMsg[] | ((prev: ChatMsg[]) => ChatMsg[])) {
    _messages = typeof updater === 'function' ? updater(_messages) : updater;
    notify();
  },

  isInitialized: () => _messages.length > 0,
};

/** React hook — returns [messages, setMessages] synced to the shared store. */
export function useAgentMessages(): [ChatMsg[], typeof agentStore.setMessages] {
  const [, forceRender] = useState(0);

  useEffect(() => {
    const handler = () => forceRender((n) => n + 1);
    _listeners.add(handler);
    return () => {
      _listeners.delete(handler);
    };
  }, []);

  return [_messages, agentStore.setMessages];
}
