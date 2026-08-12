"use client";

import { formatDate, isOverdue } from "../lib/lead-utils";
import {
  statusClasses,
  statusLabels,
  type Lead,
  type LeadStatus,
} from "../lib/types";

type LeadCardProps = {
  lead: Lead;
  saving: boolean;
  onDraftChange: (
    id: string,
    changes: Partial<Pick<Lead, "note" | "followUpAt">>,
  ) => void;
  onSaveNote: (id: string, note: string) => void;
  onSaveFollowUp: (id: string, followUpAt: string | null) => void;
  onComplete: (id: string) => void;
  onStatusChange: (id: string, status: LeadStatus) => void;
};

export function LeadCard({
  lead,
  saving,
  onDraftChange,
  onSaveNote,
  onSaveFollowUp,
  onComplete,
  onStatusChange,
}: LeadCardProps) {
  return (
    <article className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5">
      <div className="flex flex-col justify-between gap-3 sm:flex-row">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span
              className={`rounded px-2 py-1 text-xs font-bold ${statusClasses[lead.status]}`}
            >
              {statusLabels[lead.status]}
            </span>

            {lead.followUpAt && (
              <span
                className={`rounded px-2 py-1 text-xs font-semibold ${
                  isOverdue(lead.followUpAt)
                    ? "bg-red-400/15 text-red-300"
                    : "bg-amber-400/15 text-amber-300"
                }`}
              >
                {isOverdue(lead.followUpAt)
                  ? `Просрочено: ${lead.followUpAt.slice(0, 10)}`
                  : `Вернуться: ${lead.followUpAt.slice(0, 10)}`}
              </span>
            )}

            <span className="text-xs text-slate-500">
              {formatDate(lead.message.publishedAt)}
            </span>
          </div>

          <p className="mb-2 text-sm font-medium text-cyan-300">
            {lead.message.channel.title}
            {lead.message.channel.username
              ? ` · @${lead.message.channel.username}`
              : ""}
          </p>

          <p className="whitespace-pre-wrap break-words text-slate-200">
            {lead.message.text}
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {lead.matchedKeywords.map((keyword) => (
              <span
                className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300"
                key={keyword}
              >
                {keyword}
              </span>
            ))}
          </div>

          <div className="mt-4">
            <label
              className="mb-1 block text-xs font-medium text-slate-400"
              htmlFor={`lead-note-${lead.id}`}
            >
              Заметка
            </label>

            <textarea
              className="min-h-20 w-full resize-y rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-cyan-400"
              id={`lead-note-${lead.id}`}
              maxLength={2000}
              onChange={(event) =>
                onDraftChange(lead.id, { note: event.target.value })
              }
              value={lead.note ?? ""}
            />
          </div>

          <div className="mt-4">
            <label
              className="mb-1 block text-xs font-medium text-slate-400"
              htmlFor={`lead-follow-up-${lead.id}`}
            >
              Напомнить связаться
            </label>

            <input
              className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400"
              id={`lead-follow-up-${lead.id}`}
              onChange={(event) =>
                onDraftChange(lead.id, {
                  followUpAt: event.target.value
                    ? new Date(
                        `${event.target.value}T12:00:00.000Z`,
                      ).toISOString()
                    : null,
                })
              }
              type="date"
              value={lead.followUpAt?.slice(0, 10) ?? ""}
            />
          </div>
        </div>

        <div className="flex shrink-0 flex-wrap content-start gap-2 sm:w-36">
          {lead.message.link && (
            <a
              className="w-full rounded-lg border border-cyan-400/40 px-3 py-2 text-center text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
              href={lead.message.link}
              rel="noreferrer"
              target="_blank"
            >
              Открыть чат
            </a>
          )}

          <button
            className="w-full rounded-lg border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={saving}
            onClick={() => onSaveNote(lead.id, lead.note ?? "")}
            type="button"
          >
            Сохранить заметку
          </button>

          <button
            className="w-full rounded-lg border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={saving}
            onClick={() => onSaveFollowUp(lead.id, lead.followUpAt)}
            type="button"
          >
            Сохранить напоминание
          </button>

          <button
            className="w-full rounded-lg border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={saving}
            onClick={() => onComplete(lead.id)}
            type="button"
          >
            Завершить
          </button>

          <select
            className="w-full rounded-lg border border-cyan-400/40 bg-slate-900 px-3 py-2 text-sm font-semibold text-cyan-300 outline-none focus:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={saving}
            onChange={(event) =>
              onStatusChange(lead.id, event.target.value as LeadStatus)
            }
            value={lead.status}
          >
            <option value="NEW">Новый</option>
            <option value="REVIEWED">Просмотрен</option>
            <option value="CONTACTED">Связались</option>
            <option value="DISMISSED">Неактуален</option>
          </select>
        </div>
      </div>
    </article>
  );
}