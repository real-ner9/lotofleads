import { Injectable } from '@nestjs/common';
import { LeadService } from '../lead/lead.service';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import prompts from 'prompts';
import { ScannedLead } from '../lead/interfaces/scanned-lead.interface';
import { getUserIdFromMessage } from './helpers';

@Injectable()
export class TelegramService {
  private client: TelegramClient;

  constructor(private readonly leadService: LeadService) {}

  async onInit() {
    const session = new StringSession(process.env.SESSION_STRING || '');
    this.client = new TelegramClient(
      session,
      Number(process.env.API_ID),
      process.env.API_HASH as string,
      { connectionRetries: 5 },
    );

    const responses = await prompts([
      {
        type: 'text',
        name: 'phone',
        message: '📱 Phone:',
      },
      {
        type: 'text',
        name: 'password',
        message: '🔐 2FA Password:',
      },
      {
        type: 'text',
        name: 'code',
        message: '📩 Code from Telegram:',
      },
    ]);

    await this.client.start({
      phoneNumber: () => Promise.resolve(responses.phone),
      password: () => Promise.resolve(responses.password),
      phoneCode: () => Promise.resolve(responses.code),
      onError: (err: any) => console.log(err),
    });

    console.log('✅ Connected. SESSION_STRING:\n' + this.client.session.save());
  }

  async scanAndStoreFresh(
    keywords: string[],
    chats: string[],
    maxAgeMs = 86400000,
    limit = 100,
  ): Promise<ScannedLead[]> {
    const freshSince = Date.now() - maxAgeMs;
    const results = new Map<string, ScannedLead>();

    for (const chat of chats) {
      const messages = await this.getFreshMessages(
        chat,
        keywords,
        freshSince,
        limit,
      );

      for (const msg of messages) {
        const lead = await this.parseMessageToLead(msg, freshSince);
        if (!lead || results.has(lead.telegramId)) continue;

        results.set(lead.telegramId, lead);
      }
    }

    const leads = Array.from(results.values());
    await this.leadService.saveManyLeads(leads);
    return leads;
  }

  private async getFreshMessages(
    chat: string,
    keywords: string[],
    freshSince: number,
    limit: number,
  ) {
    const messages = await this.client.getMessages(chat, {
      limit,
      search: keywords.join(' | '),
    });

    return messages.filter((msg) => {
      const ts = msg.date * 1000;
      return msg.message && ts >= freshSince;
    });
  }

  private async parseMessageToLead(
    msg: Api.Message,
    freshSince: number,
  ): Promise<ScannedLead | null> {
    const msgDateMs = msg.date * 1000;
    if (msgDateMs < freshSince || !msg.message) return null;

    let userId = 'unknown';
    let username = '';

    if (msg.senderId && 'userId' in msg.senderId) {
      userId = getUserIdFromMessage(msg) ?? 'unknown';

      try {
        const entity = await this.client.getEntity(userId);
        if ('username' in entity) {
          username = entity.username || '';
        }
      } catch {
        username = '';
      }
    }

    return {
      telegramId: userId,
      username,
      text: msg.message,
      date: new Date(msgDateMs).toISOString(),
    };
  }
}
