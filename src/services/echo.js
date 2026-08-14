// Standalone offline mock for Echo to avoid opening unused WebSocket connections
const mockChannel = {
  listen: () => mockChannel,
  stopListening: () => mockChannel,
  notification: () => mockChannel,
  listenForWhisper: () => mockChannel,
  whisper: () => mockChannel,
};

const echo = {
  private: () => mockChannel,
  channel: () => mockChannel,
  join: () => mockChannel,
  leave: () => {},
  disconnect: () => {},
};

export default echo;
