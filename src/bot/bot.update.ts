import { Update, Command, Ctx, Hears } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { BotService } from './bot.service';

@Update()
export class BotUpdate {
  constructor(private readonly botService: BotService) {}

  @Command('scan')
  async onScan(@Ctx() ctx: Context) {
    await this.botService.handleScanCommand(ctx);
  }

  @Hears(/.*/)
  async onMessage(@Ctx() ctx: Context) {
    await this.botService.handleMessage(ctx);
  }
}