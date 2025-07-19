import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { IdeasController } from './ideas.controller';
import { IdeasService } from './ideas.service';
import { Idea, IdeaSchema } from './ideas.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Idea.name, schema: IdeaSchema }]),
  ],
  controllers: [IdeasController],
  providers: [IdeasService],
})
export class IdeasModule {}
