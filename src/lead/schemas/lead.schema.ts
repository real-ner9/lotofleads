import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Lead extends Document {
  @Prop()
  telegramId: string;

  @Prop()
  username: string;

  @Prop()
  text: string;

  @Prop()
  date: string;
}

export const LeadSchema = SchemaFactory.createForClass(Lead);
