"use client";

import { DashboardHeader } from "../components/DashboardHeader";
import { LeadFilters } from "../components/LeadFilters";
import { LeadList } from "../components/LeadList";
import { MonitoringSettings } from "../components/MonitoringSettings";
import { useLeadDashboard } from "../hooks/useLeadDashboard";

export default function Home() {
  const dashboard = useLeadDashboard();

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <DashboardHeader telegramStatus={dashboard.telegramStatus} />

        {dashboard.error && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
            <p>{dashboard.error}</p>

            <button
              className="rounded-lg bg-red-400/15 px-3 py-2 font-semibold text-red-200 transition hover:bg-red-400/25"
              onClick={() => {
                void dashboard.loadDashboard(
                  dashboard.leadFilter,
                  dashboard.leadSearch,
                );
              }}
              type="button"
            >
              Повторить
            </button>
          </div>
        )}

        <section className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-bold">Лиды</h2>
              <p className="mt-1 text-sm text-slate-400">
                Поиск, обработка и напоминания по потенциальным клиентам.
              </p>
            </div>

            <button
              className="rounded-lg border border-cyan-400/40 px-3 py-2 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/10"
              onClick={dashboard.exportLeads}
              type="button"
            >
              Скачать CSV
            </button>

            <button
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:cursor-not-allowed disabled:opacity-40"
              disabled={dashboard.loading || dashboard.saving}
              onClick={() => {
                void dashboard.loadDashboard(
                  dashboard.leadFilter,
                  dashboard.leadSearch,
                );
              }}
              type="button"
            >
              Обновить
            </button>
          </div>

          <LeadFilters
            counts={dashboard.counts}
            followUpCounts={dashboard.followUpCounts}
            leadFilter={dashboard.leadFilter}
            leadSearch={dashboard.leadSearch}
            onFilterChange={dashboard.changeLeadFilter}
            onSearch={() => {
              void dashboard.loadLeads(
                dashboard.leadFilter,
                dashboard.leadSearch,
                1,
              );
            }}
            saving={dashboard.saving}
            setLeadSearch={dashboard.setLeadSearch}
          />

          <LeadList
            leads={dashboard.leads}
            loading={dashboard.loading}
            onComplete={dashboard.completeLead}
            onDraftChange={dashboard.updateLeadDraft}
            onPageChange={(page) => {
              void dashboard.loadLeads(
                dashboard.leadFilter,
                dashboard.leadSearch,
                page,
              );
            }}
            onSaveFollowUp={dashboard.updateLeadFollowUp}
            onSaveNote={dashboard.updateLeadNote}
            onStatusChange={dashboard.updateLeadStatus}
            pagination={dashboard.pagination}
            savingLeadIds={dashboard.savingLeadIds}
          />
        </section>

        <MonitoringSettings
          chatIdentifier={dashboard.chatIdentifier}
          chatTitle={dashboard.chatTitle}
          onAddChat={dashboard.addChat}
          onAddRule={dashboard.addRule}
          onMutateSettings={dashboard.mutateSettings}
          phrase={dashboard.phrase}
          ruleType={dashboard.ruleType}
          saving={dashboard.saving}
          setChatIdentifier={dashboard.setChatIdentifier}
          setChatTitle={dashboard.setChatTitle}
          setPhrase={dashboard.setPhrase}
          setRuleType={dashboard.setRuleType}
          settings={dashboard.settings}
        />
      </div>
    </main>
  );
}