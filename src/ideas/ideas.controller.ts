import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { IdeasService } from './ideas.service';
import { normalizeSections } from './ideas.service';

@Controller('ideas')
export class IdeasController {
  constructor(private readonly ideasService: IdeasService) {}

  @Post()
  async create(@Body('prompt') prompt: string, @Body('model') model?: string) {
    if (!prompt || typeof prompt !== 'string') {
      throw new HttpException('Prompt is required', HttpStatus.BAD_REQUEST);
    }
    try {
      const idea = await this.ideasService.create(prompt, model);
      return {
        id: idea.id,
        prompt: idea.prompt,
        sections: Array.isArray(idea.sections)
          ? idea.sections
          : normalizeSections(idea.sections),
        createdAt: idea.createdAt,
      };
    } catch (err) {
      throw new HttpException(
        (err as Error).message || 'Failed to create idea',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      const idea = await this.ideasService.findOne(id);
      return {
        id: idea.id,
        prompt: idea.prompt,
        sections: Array.isArray(idea.sections)
          ? idea.sections
          : normalizeSections(idea.sections),
        createdAt: idea.createdAt,
      };
    } catch {
      throw new HttpException('Idea not found', HttpStatus.NOT_FOUND);
    }
  }
}
