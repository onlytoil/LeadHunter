"use client";

import { LeadCard } from "./LeadCard";
import type { Lead, LeadStatus, Pagination } from "../lib/types";

type LeadListProps = {
  leads: Lead[];
  loading: boolean;
  savingLeadIds: string[];
  pagination: Pagination;
  onDraftChange: (
    id: string,
    changes: Partial<Pick<Lead, "note" | "followUpAt">>,
  ) => void;
  onSaveNote: (id: string, note: string) => void;
  onSaveFollowUp: (id: string, followUpAt: string | null) => void;
  onComplete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
  onPageChange: (page: number) => void;
};

export function LeadList({
  leads,
  loading,
  savingLeadIds,
  pagination,
  onDraftChange,
  onSaveNote,
  onSaveFollowUp,
  onComplete,
  onStatusChange,
  onPageChange,
}: LeadListProps) {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((item) => (
          <div
            className="h-64 animate-pulse rounded-xl border border-slate-800 bg-slate-950"
            key={item}
          />
        ))}
      </div>
    );
  }

  if (!leads.length) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-950 p-8 text-center">
        <h2 className="text-lg font-semibold">Лидов пока нет</h2>
        <p className="mt-2 text-sm text-slate-400">
          Измени фильтры или добавь Telegram-чаты и ключевые фразы в настройках.
        </p>
      </div>
    );
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-bold">Найденные лиды</h2>
        <p className="text-sm text-slate-400">Всего: {pagination.total}</p>
      </div>

      <div className="space-y-4">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onComplete={onComplete}
            onDraftChange={onDraftChange}
            onSaveFollowUp={onSaveFollowUp}
            onSaveNote={onSaveNote}
            onStatusChange={onStatusChange}
            saving={savingLeadIds.includes(lead.id)}
          />
        ))}
      </div>

      {pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between gap-3">
          <button
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pagination.page <= 1}
            onClick={() => onPageChange(pagination.page - 1)}
            type="button"
          >
            Назад
          </button>

          <span className="text-sm text-slate-400">
            Страница {pagination.page} из {pagination.totalPages}
          </span>

          <button
            className="rounded-lg bg-slate-800 px-4 py-2 text-sm font-semibold text-slate-200 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() => onPageChange(pagination.page + 1)}
            type="button"
          >
            Далее
          </button>
        </div>
      )}
    </section>
  );
}