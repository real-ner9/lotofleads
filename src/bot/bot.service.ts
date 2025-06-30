import { Injectable } from '@nestjs/common';
import { Context } from 'telegraf';
import { TelegramService } from '../telegram/telegram.service';
import { sessionStore } from './session.store';

@Injectable()
export class BotService {
  constructor(private readonly telegramService: TelegramService) {}

  async handleScanCommand(ctx: Context) {
    const userId = ctx.from?.id;
    if (!userId) return;

    sessionStore.set(userId, { step: 'awaiting_chats' });
    await ctx.reply('📥 Введите список чатов (через запятую):');
  }

  async handleMessage(ctx: Context) {
    if (!ctx.from || !ctx.message || !('text' in ctx.message)) return;

    const userId = ctx.from.id;
    const session = sessionStore.get(userId);
    if (!session) return;

    const text = ctx.message.text;

    if (session.step === 'awaiting_chats') {
      session.chats = text.split(',').map((s) => s.trim());
      session.step = 'awaiting_keywords';
      await ctx.reply('🧠 Теперь введите ключевые слова (через запятую):');
    } else if (session.step === 'awaiting_keywords') {
      session.keywords = text.split(',').map((s) => s.trim());
      session.step = 'idle';

      await ctx.reply('🔍 Ищу лидов…');

      console.log(session);

      const leads = await this.telegramService.scanAndStoreFresh(
        session.keywords,
        session.chats as string[],
      );

      await ctx.reply(`👥 Найдено: ${leads.length} лидов`);
      for (const lead of leads) {
        await ctx.reply(
          `@${lead.username || 'unknown'}\n${lead.text}\n🕒 ${lead.date}`,
        );
      }
    }
  }
}
