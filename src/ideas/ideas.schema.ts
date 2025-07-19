import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type IdeaDocument = Idea & Document;

@Schema({ timestamps: true })
export class Idea {
  @Prop({ required: true })
  prompt: string;

  @Prop({
    type: [Object],
    required: true,
  })
  sections: Array<{ type: string; [key: string]: any }>;

  @Prop()
  createdAt: Date;
}

export const IdeaSchema = SchemaFactory.createForClass(Idea);
