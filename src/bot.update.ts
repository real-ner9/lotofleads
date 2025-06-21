import { Update, Start, Command, Ctx, Hears } from 'nestjs-telegraf';
import { Context } from 'telegraf';

@Update()
export class BotUpdate {
  @Start()
  onStart(@Ctx() ctx: Context) {
    return ctx.reply('Привет! Я бот на NestJS + Yarn');
  }

  @Command('help')
  onHelp(@Ctx() ctx: Context) {
    return ctx.reply('Доступные команды: /start, /help');
  }

  @Hears('Привет')
  onHi(@Ctx() ctx: Context) {
    return ctx.reply('Привет-привет!');
  }
}