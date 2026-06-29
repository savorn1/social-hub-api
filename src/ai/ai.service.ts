import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GenerateReplyDto, ChatCompletionDto } from './dto/generate.dto';
import { ConversationsService } from '../conversations/conversations.service';
import { KnowledgeService } from '../knowledge/knowledge.service';
import { PromptsService } from '../prompts/prompts.service';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly apiKey: string;
  private readonly baseModel: string;

  constructor(
    configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly conversationsService: ConversationsService,
    private readonly knowledgeService: KnowledgeService,
    private readonly promptsService: PromptsService,
  ) {
    this.apiKey = configService.get<string>('integrations.openai.apiKey') ?? '';
    this.baseModel =
      configService.get<string>('integrations.openai.model') ?? 'gpt-4o';
  }

  async chatCompletion(dto: ChatCompletionDto): Promise<string> {
    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://api.openai.com/v1/chat/completions',
          {
            model: dto.model ?? this.baseModel,
            messages: dto.messages,
            temperature: dto.temperature ?? 0.7,
          },
          { headers: { Authorization: `Bearer ${this.apiKey}` } },
        ),
      );
      return response.data.choices[0]?.message?.content ?? '';
    } catch (error) {
      this.logger.error('OpenAI API error', error);
      throw error;
    }
  }

  async generateReply(dto: GenerateReplyDto): Promise<string> {
    const messagesResult = await this.conversationsService.getMessages(
      dto.conversationId,
      1,
      20,
    );
    const recentMessages = messagesResult.data.reverse(); // oldest first

    let systemContent =
      'You are a helpful customer support agent. Respond professionally and concisely.';

    if (dto.promptId) {
      try {
        const prompt = await this.promptsService.findOne(dto.promptId);
        if (prompt.isActive) systemContent = prompt.content;
      } catch {
        // keep default prompt
      }
    }

    if (dto.knowledgeBaseId && recentMessages.length > 0) {
      const lastUserMsg = [...recentMessages]
        .reverse()
        .find((m) => m.isFromContact);
      if (lastUserMsg?.content) {
        try {
          const items = await this.knowledgeService.searchItems(
            lastUserMsg.content,
            dto.knowledgeBaseId,
          );
          if (items.length > 0) {
            const context = items
              .map((i) => `Q: ${i.question}\nA: ${i.answer}`)
              .join('\n\n');
            systemContent += `\n\nRelevant knowledge base:\n${context}`;
          }
        } catch {
          // ignore knowledge base errors
        }
      }
    }

    const messages: ChatCompletionDto['messages'] = [
      { role: 'system', content: systemContent },
      ...recentMessages
        .filter((m) => m.content)
        .map((m) => ({
          role: m.isFromContact ? ('user' as const) : ('assistant' as const),
          content: m.content!,
        })),
    ];

    return this.chatCompletion({ messages, temperature: dto.temperature });
  }

  async summarizeConversation(messages: string[]): Promise<string> {
    return this.chatCompletion({
      messages: [
        {
          role: 'system',
          content: 'Summarize this customer conversation concisely.',
        },
        { role: 'user', content: messages.join('\n') },
      ],
    });
  }
}
