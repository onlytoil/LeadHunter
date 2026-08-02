import { ConfigService } from '@nestjs/config';
import { ParserService } from './parser.service';

describe('ParserService', () => {
  const createParser = (keywords: string, stopWords = '') =>
    new ParserService(
      new ConfigService({
        TELEGRAM_INCLUDE_KEYWORDS: keywords,
        TELEGRAM_EXCLUDE_KEYWORDS: stopWords,
      }),
    );

  it('matches Russian phrases without regard to case or repeated spaces', () => {
    const parser = createParser('ищу разработчика, нужен сайт');

    expect(parser.analyze('ИЩУ   РАЗРАБОТЧИКА для нового проекта')).toEqual({
      isLead: true,
      matchedKeywords: ['ищу разработчика'],
      matchedStopWords: [],
    });
  });

  it('matches English phrases', () => {
    const parser = createParser('looking for a developer,need a website');

    expect(
      parser.analyze('We are looking for a developer this week').isLead,
    ).toBe(true);
  });

  it('rejects a candidate when a stop phrase is present', () => {
    const parser = createParser('нужен сайт', 'вакансия,бесплатно');

    expect(parser.analyze('Нужен сайт, но только бесплатно')).toEqual({
      isLead: false,
      matchedKeywords: ['нужен сайт'],
      matchedStopWords: ['бесплатно'],
    });
  });

  it('does not create a lead without an include match', () => {
    const parser = createParser('need a website');

    expect(parser.analyze('Just sharing a useful link').isLead).toBe(false);
  });
});
