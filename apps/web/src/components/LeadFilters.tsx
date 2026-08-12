"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import {
  emptyLeadSearchFilters,
  statusClasses,
  statusLabels,
  type LeadFilter,
  type LeadSearchFilters,
  type LeadStatus,
} from "../lib/types";

type LeadFiltersProps = {
  counts: Record<LeadStatus, number>;
  followUpCounts: { today: number; overdue: number };
  leadFilter: LeadFilter;
  leadSearch: LeadSearchFilters;
  saving: boolean;
  setLeadSearch: Dispatch<SetStateAction<LeadSearchFilters>>;
  onFilterChange: (filter: LeadFilter) => void;
  onSearch: () => void;
};

export function LeadFilters({
  counts,
  followUpCounts,
  leadFilter,
  leadSearch,
  saving,
  setLeadSearch,
  onFilterChange,
  onSearch,
}: LeadFiltersProps) {
  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    onSearch();
  }

  function resetSearch() {
    setLeadSearch(emptyLeadSearchFilters);
  }

  return (
    <>
      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
          <button
            className={`rounded-xl border p-4 text-left transition ${
              leadFilter === status
                ? "border-cyan-400 bg-cyan-400/10"
                : "border-slate-800 bg-slate-950 hover:border-slate-600"
            }`}
            key={status}
            onClick={() => onFilterChange(status)}
            type="button"
          >
            <p className={`text-sm font-medium ${statusClasses[status]}`}>
              {statusLabels[status]}
            </p>
            <p className="mt-2 text-3xl font-bold">{counts[status]}</p>
          </button>
        ))}

        <button
          className={`rounded-xl border p-4 text-left transition ${
            leadFilter === "TODAY"
              ? "border-amber-400 bg-amber-400/10"
              : "border-slate-800 bg-slate-950 hover:border-slate-600"
          }`}
          onClick={() => onFilterChange("TODAY")}
          type="button"
        >
          <p className="text-sm font-medium text-amber-300">Сегодня</p>
          <p className="mt-2 text-3xl font-bold">{followUpCounts.today}</p>
        </button>

        <button
          className={`rounded-xl border p-4 text-left transition ${
            leadFilter === "OVERDUE"
              ? "border-red-400 bg-red-400/10"
              : "border-slate-800 bg-slate-950 hover:border-slate-600"
          }`}
          onClick={() => onFilterChange("OVERDUE")}
          type="button"
        >
          <p className="text-sm font-medium text-red-300">Просрочено</p>
          <p className="mt-2 text-3xl font-bold">
            {followUpCounts.overdue}
          </p>
        </button>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        <button
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            leadFilter === "ALL"
              ? "bg-cyan-400 text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          onClick={() => onFilterChange("ALL")}
          type="button"
        >
          Все лиды
        </button>

        {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
          <button
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${
              leadFilter === status
                ? "bg-cyan-400 text-slate-950"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700"
            }`}
            key={status}
            onClick={() => onFilterChange(status)}
            type="button"
          >
            {statusLabels[status]}
          </button>
        ))}

        <button
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            leadFilter === "TODAY"
              ? "bg-amber-400 text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          onClick={() => onFilterChange("TODAY")}
          type="button"
        >
          Сегодня
        </button>

        <button
          className={`rounded-lg px-3 py-2 text-sm font-semibold ${
            leadFilter === "OVERDUE"
              ? "bg-red-400 text-slate-950"
              : "bg-slate-800 text-slate-300 hover:bg-slate-700"
          }`}
          onClick={() => onFilterChange("OVERDUE")}
          type="button"
        >
          Просрочено
        </button>
      </div>

      <form
        className="mb-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:grid-cols-2 lg:grid-cols-6"
        onSubmit={submitSearch}
      >
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400 sm:col-span-2"
          placeholder="Поиск: текст, @автор или чат"
          value={leadSearch.search}
          onChange={(event) =>
            setLeadSearch((current) => ({
              ...current,
              search: event.target.value,
            }))
          }
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
          placeholder="Чат или @username"
          value={leadSearch.chat}
          onChange={(event) =>
            setLeadSearch((current) => ({
              ...current,
              chat: event.target.value,
            }))
          }
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
          placeholder="Ключевое слово"
          value={leadSearch.keyword}
          onChange={(event) =>
            setLeadSearch((current) => ({
              ...current,
              keyword: event.target.value,
            }))
          }
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          type="date"
          value={leadSearch.dateFrom}
          onChange={(event) =>
            setLeadSearch((current) => ({
              ...current,
              dateFrom: event.target.value,
            }))
          }
        />
        <input
          className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
          type="date"
          value={leadSearch.dateTo}
          onChange={(event) =>
            setLeadSearch((current) => ({
              ...current,
              dateTo: event.target.value,
            }))
          }
        />
        <div className="flex gap-2">
          <button
            className="flex-1 rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950"
            disabled={saving}
            type="submit"
          >
            Найти
          </button>
          <button
            className="rounded-lg bg-slate-800 px-3 py-2 text-sm font-semibold text-slate-300"
            disabled={saving}
            onClick={resetSearch}
            type="button"
          >
            Сбросить
          </button>
        </div>
      </form>
    </>
  );
}