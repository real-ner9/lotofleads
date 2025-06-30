export type SessionStep = 'idle' | 'awaiting_chats' | 'awaiting_keywords';

export interface SessionData {
  step: SessionStep;
  chats?: string[];
  keywords?: string[];
}

export const sessionStore = new Map<number, SessionData>();
