import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

export interface LeadMatch {
  isLead: boolean;
  matchedKeywords: string[];
  matchedStopWords: string[];
}

@Injectable()
export class ParserService {
  constructor(private readonly prisma: PrismaService) {}

  async analyze(text: string): Promise<LeadMatch> {
    const rules = await this.prisma.keywordRule.findMany({
      where: { active: true },
      select: {
        phrase: true,
        type: true,
      },
    });

    const keywords = this.normalizePhrases(
      rules
        .filter((rule) => rule.type === 'INCLUDE')
        .map((rule) => rule.phrase),
    );
    const stopWords = this.normalizePhrases(
      rules
        .filter((rule) => rule.type === 'EXCLUDE')
        .map((rule) => rule.phrase),
    );

    const normalizedText = this.normalize(text);
    const matchedKeywords = this.findMatches(normalizedText, keywords);
    const matchedStopWords = this.findMatches(normalizedText, stopWords);

    return {
      isLead: matchedKeywords.length > 0 && matchedStopWords.length === 0,
      matchedKeywords,
      matchedStopWords,
    };
  }

  private normalizePhrases(phrases: string[]): string[] {
    return [
      ...new Set(
        phrases.map((phrase) => this.normalize(phrase)).filter(Boolean),
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