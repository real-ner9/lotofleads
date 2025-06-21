import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';

@Module({
  imports: [
    TelegrafModule.forRoot({
      token: process.env.BOT_TOKEN as string, // используем переменную окружения
    }),
  ],
  providers: [BotUpdate],
})
export class AppModule {}
