import { PrismaService } from '../prisma/prisma.service';
import { ParserService } from './parser.service';

describe('ParserService', () => {
  const prisma = {
    keywordRule: {
      findMany: jest.fn(),
    },
  };

  const parser = new ParserService(prisma as unknown as PrismaService);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('matches Russian phrases without regard to case or repeated spaces', async () => {
    prisma.keywordRule.findMany.mockResolvedValue([
      { phrase: 'ищу разработчика', type: 'INCLUDE' },
      { phrase: 'нужен сайт', type: 'INCLUDE' },
    ]);

    await expect(
      parser.analyze('ИЩУ   РАЗРАБОТЧИКА для нового проекта'),
    ).resolves.toEqual({
      isLead: true,
      matchedKeywords: ['ищу разработчика'],
      matchedStopWords: [],
    });
  });

  it('matches English phrases', async () => {
    prisma.keywordRule.findMany.mockResolvedValue([
      { phrase: 'looking for a developer', type: 'INCLUDE' },
      { phrase: 'need a website', type: 'INCLUDE' },
    ]);

    await expect(
      parser.analyze('We are looking for a developer this week'),
    ).resolves.toMatchObject({
      isLead: true,
    });
  });

  it('rejects a candidate when an exclude phrase is present', async () => {
    prisma.keywordRule.findMany.mockResolvedValue([
      { phrase: 'нужен сайт', type: 'INCLUDE' },
      { phrase: 'бесплатно', type: 'EXCLUDE' },
    ]);

    await expect(
      parser.analyze('Нужен сайт, но только бесплатно'),
    ).resolves.toEqual({
      isLead: false,
      matchedKeywords: ['нужен сайт'],
      matchedStopWords: ['бесплатно'],
    });
  });

  it('does not create a lead without an include match', async () => {
    prisma.keywordRule.findMany.mockResolvedValue([
      { phrase: 'need a website', type: 'INCLUDE' },
    ]);

    await expect(
      parser.analyze('Just sharing a useful link'),
    ).resolves.toMatchObject({
      isLead: false,
    });
  });

  it('loads only active keyword rules', async () => {
    prisma.keywordRule.findMany.mockResolvedValue([]);

    await parser.analyze('Need a website');

    expect(prisma.keywordRule.findMany).toHaveBeenCalledWith({
      where: { active: true },
      select: {
        phrase: true,
        type: true,
      },
    });
  });
});