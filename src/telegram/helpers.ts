import { Api } from 'telegram';

export function getUserIdFromMessage(msg: Api.Message): string | null {
  const sender = msg.senderId;

  if (sender && 'userId' in sender) {
    const userId = sender.userId;

    if (typeof userId === 'bigint' || typeof userId === 'number') {
      return userId.toString();
    }
  }

  return null;
}