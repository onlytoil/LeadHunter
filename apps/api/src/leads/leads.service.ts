import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { GetLeadsQueryDto } from './dto/get-leads-query.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';
import { UpdateLeadNoteDto } from './dto/update-lead-note.dto';
import { UpdateLeadFollowUpDto } from './dto/update-lead-follow-up.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: GetLeadsQueryDto) {
    const filters = this.buildFilters(query);
    const where = query.status ? { ...filters, status: query.status } : filters;

    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [leads, total, groupedCounts] = await Promise.all([
      this.prisma.lead.findMany({
        where,
        include: {
          message: {
            include: {
              channel: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.lead.count({ where }),
      this.prisma.lead.groupBy({
        by: ['status'],
        where: filters,
        _count: {
          _all: true,
        },
      }),
    ]);

    const counts: Record<LeadStatus, number> = {
      NEW: 0,
      REVIEWED: 0,
      CONTACTED: 0,
      DISMISSED: 0,
    };

    for (const item of groupedCounts) {
      counts[item.status] = item._count._all;
    }

    return {
      leads: leads.map((lead) => this.serializeLead(lead)),
      counts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async export(query: GetLeadsQueryDto) {
    const filters = this.buildFilters(query);
    const where = query.status ? { ...filters, status: query.status } : filters;

    const leads = await this.prisma.lead.findMany({
      where,
      include: {
        message: {
          include: {
            channel: true,
          },
        },
      },
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    const rows = [
      [
        'Дата сообщения',
        'Статус',
        'Чат',
        'Автор',
        'Ключевые слова',
        'Сообщение',
        'Заметка',
        'Следующее действие',
        'Ссылка',
      ],
      ...leads.map((lead) => [
        lead.message.publishedAt.toISOString(),
        lead.status,
        lead.message.channel.title,
        lead.message.senderUsername ?? lead.message.senderId?.toString() ?? '',
        lead.matchedKeywords.join(', '),
        lead.message.text,
        lead.note ?? '',
        lead.followUpAt?.toISOString() ?? '',
        lead.message.link ?? '',
      ]),
    ];

    return `\uFEFF${rows
      .map((row) => row.map((value) => this.escapeCsv(value)).join(';'))
      .join('\r\n')}`;
  }

  async updateStatus(id: string, dto: UpdateLeadStatusDto) {
    try {
      const lead = await this.prisma.lead.update({
        where: { id },
        data: { status: dto.status },
        include: {
          message: {
            include: {
              channel: true,
            },
          },
        },
      });
      return this.serializeLead(lead);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Lead not found');
      }

      throw error;
    }
  }

  async updateNote(id: string, dto: UpdateLeadNoteDto) {
    try {
      const lead = await this.prisma.lead.update({
        where: { id },
        data: { note: dto.note.trim() || null },
        include: {
          message: {
            include: {
              channel: true,
            },
          },
        },
      });

      return this.serializeLead(lead);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Lead not found');
      }

      throw error;
    }
  }

  async updateFollowUp(id: string, dto: UpdateLeadFollowUpDto) {
    try {
      const lead = await this.prisma.lead.update({
        where: { id },
        data: {
          followUpAt: dto.followUpAt ? new Date(dto.followUpAt) : null,
        },
        include: {
          message: {
            include: {
              channel: true,
            },
          },
        },
      });

      return this.serializeLead(lead);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Lead not found');
      }

      throw error;
    }
  }

  private buildFilters(query: GetLeadsQueryDto): Prisma.LeadWhereInput {
    const where: Prisma.LeadWhereInput = {};
    const messageWhere: Prisma.MessageWhereInput = {};

    const chat = query.chat?.trim();

    if (chat) {
      messageWhere.channel = {
        is: {
          OR: [
            {
              title: {
                contains: chat,
                mode: 'insensitive',
              },
            },
            {
              username: {
                contains: chat.replace(/^@/, ''),
                mode: 'insensitive',
              },
            },
          ],
        },
      };
    }

    const dateFrom = query.dateFrom ? new Date(query.dateFrom) : undefined;
    const dateTo = query.dateTo ? this.getDateTo(query.dateTo) : undefined;

    if (dateFrom || dateTo) {
      messageWhere.publishedAt = {
        ...(dateFrom ? { gte: dateFrom } : {}),
        ...(dateTo ? { lte: dateTo } : {}),
      };
    }

    if (Object.keys(messageWhere).length > 0) {
      where.message = { is: messageWhere };
    }

    const keyword = query.keyword?.trim().toLocaleLowerCase('ru-RU');

    if (keyword) {
      where.matchedKeywords = { has: keyword };
    }

    return where;
  }

  private getDateTo(value: string): Date {
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return new Date(`${value}T23:59:59.999Z`);
    }

    return new Date(value);
  }

  private escapeCsv(value: string) {
    return `"${value.replace(/"/g, '""')}"`;
  }

  private serializeLead(lead: {
    message: {
      senderId: bigint | null;
      channel: {
        telegramId: bigint;
      };
    };
  }) {
    return {
      ...lead,
      message: {
        ...lead.message,
        senderId: lead.message.senderId?.toString() ?? null,
        channel: {
          ...lead.message.channel,
          telegramId: lead.message.channel.telegramId.toString(),
        },
      },
    };
  }
}
