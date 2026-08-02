import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface LeadMatch {
  isLead: boolean;
  matchedKeywords: string[];
  matchedStopWords: string[];
}

@Injectable()
export class ParserService {
  private readonly keywords: string[];
  private readonly stopWords: string[];

  constructor(configService: ConfigService) {
    this.keywords = this.parseList(
      configService.get<string>('TELEGRAM_INCLUDE_KEYWORDS', ''),
    );
    this.stopWords = this.parseList(
      configService.get<string>('TELEGRAM_EXCLUDE_KEYWORDS', ''),
    );
  }

  analyze(text: string): LeadMatch {
    const normalizedText = this.normalize(text);
    const matchedKeywords = this.findMatches(normalizedText, this.keywords);
    const matchedStopWords = this.findMatches(normalizedText, this.stopWords);

    return {
      isLead: matchedKeywords.length > 0 && matchedStopWords.length === 0,
      matchedKeywords,
      matchedStopWords,
    };
  }

  private parseList(value: string): string[] {
    return [
      ...new Set(
        value
          .split(',')
          .map((item) => this.normalize(item))
          .filter(Boolean),
      ),
    ];
  }

  private findMatches(text: string, phrases: string[]): string[] {
    return phrases.filter((phrase) => text.includes(phrase));
  }

  private normalize(value: string): string {
    return value
      .normalize('NFKC')
      .toLocaleLowerCase('ru-RU')
      .replace(/\s+/g, ' ')
      .trim();
  }
}
