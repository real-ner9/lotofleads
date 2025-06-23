import { Module } from '@nestjs/common';
import { TelegramService } from './telegram.service';
import { LeadService } from '../lead/lead.service';
import { LeadModule } from '../lead/lead.module';

@Module({
  providers: [TelegramService],
  imports: [LeadModule],
  exports: [TelegramService],
})
export class TelegramModule {}
