import { Injectable } from '@nestjs/common';
import { LeadService } from '../lead/lead.service';
import { Api, TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';
import prompts, { Answers } from 'prompts';
import { ScannedLead } from '../lead/interfaces/scanned-lead.interface';
import { getUserIdFromMessage } from './helpers';

@Injectable()
export class TelegramService {
  private client: TelegramClient;

  constructor(private readonly leadService: LeadService) {}

  async onModuleInit() {
    const apiId = Number(process.env.API_ID);
    const apiHash = String(process.env.API_HASH);

    const session = new StringSession(process.env.SESSION_STRING || '');
    this.client = new TelegramClient(session, apiId, apiHash, {
      connectionRetries: 5,
    });

    if (process.env.SESSION_STRING) {
      await this.client.connect(); // подключаемся без интерактива
      return;
    }

    // авторизация вручную
    const phone = await prompts({
      type: 'text',
      name: 'value',
      message: '📱 Введите номер телефона:',
    });

    await this.client.start({
      phoneNumber: () => Promise.resolve(phone.value),
      phoneCode: async () => {
        const code = await prompts({
          type: 'text',
          name: 'value',
          message: '📩 Введите код из Telegram:',
          validate: (val: string) =>
            val.trim() ? true : 'Код не может быть пустым',
        });
        return code.value;
      },
      password: async () => {
        const password = await prompts({
          type: 'text',
          name: 'value',
          message: '🔐 Введите 2FA пароль (если включён):',
          initial: '',
        });
        return password.value;
      },
      onError: (err) => console.error('❌ Ошибка входа:', err),
    });

    console.log('\n✅ SESSION_STRING:\n' + this.client.session.save());
    process.exit(0);
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
    // await this.leadService.saveManyLeads(leads);
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
