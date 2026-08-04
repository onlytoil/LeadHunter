import { Injectable, NotFoundException } from '@nestjs/common';
import { LeadStatus, Prisma } from '../generated/prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { GetLeadsQueryDto } from './dto/get-leads-query.dto';
import { UpdateLeadStatusDto } from './dto/update-lead-status.dto';

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(query: GetLeadsQueryDto) {
    const [leads, groupedCounts] = await Promise.all([
      this.prisma.lead.findMany({
        where: query.status ? { status: query.status } : undefined,
        include: {
          message: {
            include: {
              channel: true,
            },
          },
        },
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      }),
      this.prisma.lead.groupBy({
        by: ['status'],
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
    };
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
