import { Module } from '@nestjs/common';
import { TelegrafModule } from 'nestjs-telegraf';
import { BotUpdate } from './bot.update';
import { TelegramModule } from '../telegram/telegram.module';
import { LeadModule } from '../lead/lead.module';
import { BotService } from './bot.service';

@Module({
  imports: [
    TelegrafModule.forRoot({ token: process.env.BOT_TOKEN as string }),
    TelegramModule,
    LeadModule,
  ],
  providers: [BotUpdate, BotService],
})
export class BotModule {}
