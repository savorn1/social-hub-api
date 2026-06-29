import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chatbot, FlowStep, TriggerType } from './entities/chatbot.entity';
import { CreateChatbotDto } from './dto/create-chatbot.dto';
import { ResourceNotFoundException } from '../common/exceptions/business.exception';
import { AiService } from '../ai/ai.service';

@Injectable()
export class ChatbotService {
  constructor(
    @InjectRepository(Chatbot)
    private readonly chatbotRepo: Repository<Chatbot>,
    private readonly aiService: AiService,
  ) {}

  async create(dto: CreateChatbotDto): Promise<Chatbot> {
    return this.chatbotRepo.save(this.chatbotRepo.create(dto));
  }

  async findAll(): Promise<Chatbot[]> {
    return this.chatbotRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Chatbot> {
    const chatbot = await this.chatbotRepo.findOne({ where: { id } });
    if (!chatbot) throw new ResourceNotFoundException('Chatbot');
    return chatbot;
  }

  async update(id: string, dto: Partial<CreateChatbotDto>): Promise<Chatbot> {
    const chatbot = await this.findOne(id);
    Object.assign(chatbot, dto);
    return this.chatbotRepo.save(chatbot);
  }

  async remove(id: string): Promise<void> {
    const chatbot = await this.findOne(id);
    await this.chatbotRepo.remove(chatbot);
  }

  async findActiveForPlatform(): Promise<Chatbot[]> {
    return this.chatbotRepo.find({ where: { isActive: true } });
  }

  async processMessage(
    conversationId: string,
    messageText: string,
  ): Promise<string | null> {
    const bots = await this.findActiveForPlatform();
    if (!bots.length) return null;

    const bot = bots[0]; // use first active bot
    const text = messageText.toLowerCase().trim();
    let fallbackStep: FlowStep | null = null;

    for (const step of bot.flows) {
      if (step.trigger === TriggerType.KEYWORD) {
        const matched = (step.keywords ?? []).some((kw) =>
          text.includes(kw.toLowerCase()),
        );
        if (matched) return this.resolveStep(step, bot, conversationId);
      } else if (step.trigger === TriggerType.GREETING) {
        if (/^(hi|hello|hey|good\s+morning|good\s+afternoon|good\s+evening)/i.test(text)) {
          return this.resolveStep(step, bot, conversationId);
        }
      } else if (step.trigger === TriggerType.FALLBACK) {
        fallbackStep = step; // save for end
      }
    }

    if (fallbackStep) return this.resolveStep(fallbackStep, bot, conversationId);

    return null;
  }

  private async resolveStep(
    step: FlowStep,
    bot: Chatbot,
    conversationId: string,
  ): Promise<string | null> {
    if (step.useAI) {
      return this.aiService.generateReply({
        conversationId,
        promptId: bot.promptId,
        knowledgeBaseId: bot.knowledgeBaseId,
      });
    }
    return step.response ?? null;
  }
}
