import { Update, Command, Ctx } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { TelegramService } from '../telegram/telegram.service';
// import { LeadService } from '../lead/lead.service';

@Update()
export class BotUpdate {
  constructor(
    private readonly telegramService: TelegramService,
    // private readonly leadService: LeadService,
  ) {}

  @Command('scan')
  async onScan(@Ctx() ctx: Context) {
    await ctx.reply('🔍 Ищу лидов…');

    const leads = await this.telegramService.scanAndStoreFresh(
      ['страховка', 'медицинская'],
      ['chat_id_1'],
    );
    await ctx.reply(`👥 Найдено: ${leads.length} лидов`);

    for (const lead of leads) {
      await ctx.reply(`@${lead.username || 'unknown'}\n${lead.text}\n🕒 ${lead.date}`);
    }
  }
}
