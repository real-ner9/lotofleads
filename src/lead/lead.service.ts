import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Lead } from './lead.schema';
import { Model } from 'mongoose';
import { ScannedLead } from './interfaces/scanned-lead.interface';

@Injectable()
export class LeadService {
  constructor(@InjectModel(Lead.name) private leadModel: Model<Lead>) {}

  async saveLead(lead: Partial<Lead>) {
    return this.leadModel.updateOne(
      { telegramId: lead.telegramId, text: lead.text },
      { $setOnInsert: lead },
      { upsert: true },
    );
  }

  async saveManyLeads(leads: ScannedLead[]) {
    if (!leads.length) return;

    const ops = leads.map((lead) => ({
      updateOne: {
        filter: { telegramId: lead.telegramId, text: lead.text },
        update: { $setOnInsert: lead },
        upsert: true,
      },
    }));

    await this.leadModel.bulkWrite(ops);
  }

  async findFreshLeads() {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    return this.leadModel.find({ date: { $gte: since.toISOString() } });
  }
}
