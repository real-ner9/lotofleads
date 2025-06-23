import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { TelegramModule } from './telegram/telegram.module';
import { LeadModule } from './lead/lead.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    BotModule,
    TelegramModule,
    LeadModule,
    MongooseModule.forRoot(process.env.MONGO_URI as string),
  ],
})
export class AppModule {}
