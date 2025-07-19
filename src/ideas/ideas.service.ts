import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Idea, IdeaDocument } from './ideas.schema';
import axios from 'axios';

export function normalizeSections(
  obj: any,
): Array<{ type: string; [key: string]: any }> {
  if (Array.isArray(obj))
    return obj as Array<{ type: string; [key: string]: any }>;
  if (obj && typeof obj === 'object' && !Array.isArray(obj)) {
    return Object.entries(obj as Record<string, unknown>).map(
      ([key, value]) => ({ type: key, ...(value as object) }),
    ) as Array<{ type: string; [key: string]: any }>;
  }
  return [];
}

function extractFirstJsonObject(text: string): string | null {
  const firstBrace = text.indexOf('{');
  const lastBrace = text.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    return text.substring(firstBrace, lastBrace + 1);
  }
  return null;
}

@Injectable()
export class IdeasService {
  constructor(@InjectModel(Idea.name) private ideaModel: Model<IdeaDocument>) {}

  private isValidSectionStructure(obj: unknown): obj is {
    hero: { title: string; subtitle: string; cta: string };
    about: { heading: string; text: string };
    contact: { heading: string; email: string; phone: string; address: string };
  } {
    if (!obj || typeof obj !== 'object') return false;
    const o = obj as Record<string, unknown>;
    const hero = o.hero as Record<string, unknown>;
    const about = o.about as Record<string, unknown>;
    const contact = o.contact as Record<string, unknown>;
    return (
      hero &&
      typeof hero.title === 'string' &&
      typeof hero.subtitle === 'string' &&
      typeof hero.cta === 'string' &&
      about &&
      typeof about.heading === 'string' &&
      typeof about.text === 'string' &&
      contact &&
      typeof contact.heading === 'string' &&
      typeof contact.email === 'string' &&
      typeof contact.phone === 'string' &&
      typeof contact.address === 'string'
    );
  }

  async create(
    prompt: string,
    model = 'mistralai/mistral-7b-instruct',
  ): Promise<IdeaDocument> {
    const openAiPrompt = `Analyze the following idea: "${prompt}".
First, determine what type of business or industry it refers to.
Then generate a JSON object with realistic content for a landing page for that industry.

{
  "hero": {
    "title": "Dynamic, industry-relevant headline",
    "subtitle": "Engaging line that fits the business type",
    "cta": "1-2 word Call-to-action based on the idea"
  },
  "about": {
    "heading": "About section heading",
    "paragraph": "Realistic paragraph explaining the business or product"
  },
  "contact": {
    "heading": "Contact heading",
    "email": "a realistic email",
    "phone": "a realistic phone number",
    "address" "a realistic address"
  }
}

The content must match the industry identified from the prompt.
Return ONLY valid raw JSON. Do NOT include any explanation, markdown, or code block formatting. The response MUST start with '{' and end with '}'.`;
    const messages = [
      {
        role: 'user',
        content: openAiPrompt,
      },
    ];
    console.log('Prompt sent to OpenRouter:', openAiPrompt);
    let raw;
    let parsed;
    let sections;
    try {
      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model,
          messages,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY || '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'}`,
            'HTTP-Referer': 'https://yourdomain.com',
            'Content-Type': 'application/json',
          },
        },
      );
      raw = response.data.choices?.[0]?.message?.content;
      console.log('Raw AI response:', raw);
      const jsonString = extractFirstJsonObject(raw ?? '');
      if (!jsonString) {
        throw new InternalServerErrorException(
          'No JSON object found in AI response',
        );
      }
      try {
        parsed = JSON.parse(jsonString);
      } catch {
        console.error('Failed to parse AI response:', jsonString);
        throw new InternalServerErrorException('Failed to parse AI response');
      }
      if (
        parsed &&
        typeof parsed === 'object' &&
        !Array.isArray(parsed) &&
        'hero' in parsed &&
        'about' in parsed &&
        'contact' in parsed
      ) {
        sections = Object.entries(parsed).map(([type, content]) => {
          if (
            content &&
            typeof content === 'object' &&
            !Array.isArray(content)
          ) {
            return { type, ...content };
          } else {
            return { type, value: content };
          }
        });
      } else if (Array.isArray(parsed)) {
        sections = parsed;
      } else {
        sections = [];
      }
      const required = ['hero', 'about', 'contact'];
      const types = sections.map((s) => s.type);
      const isValid = required.every((key) => types.includes(key));
      if (!isValid) {
        console.error('Missing required sections:', sections);
        throw new InternalServerErrorException(
          'AI response missing required sections',
        );
      }
    } catch (err) {
      const errorMsg = (err as Error).message || String(err);
      throw new InternalServerErrorException(
        'AI generation or parsing failed: ' + errorMsg,
      );
    }
    const createdIdea = new this.ideaModel({ prompt, sections });
    return createdIdea.save();
  }

  async findOne(id: string): Promise<IdeaDocument> {
    const idea = await this.ideaModel.findById(id).exec();
    if (!idea) throw new NotFoundException('Idea not found');
    if (!Array.isArray(idea.sections)) {
      console.warn('Normalizing legacy sections object for idea', idea.id);
      idea.sections = normalizeSections(idea.sections);
    }
    return idea;
  }
}
