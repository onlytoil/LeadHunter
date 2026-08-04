"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

type LeadStatus = "NEW" | "REVIEWED" | "CONTACTED" | "DISMISSED";
type LeadFilter = LeadStatus | "ALL";
type LeadSearchFilters = {
  chat: string;
  keyword: string;
  dateFrom: string;
  dateTo: string;
};

type Chat = {
  id: string;
  identifier: string;
  title: string | null;
  active: boolean;
};

type KeywordRule = {
  id: string;
  phrase: string;
  type: "INCLUDE" | "EXCLUDE";
  active: boolean;
};

type Settings = {
  chats: Chat[];
  keywordRules: KeywordRule[];
};

type Lead = {
  id: string;
  matchedKeywords: string[];
  status: LeadStatus;
  createdAt: string;
  message: {
    text: string;
    link: string | null;
    senderUsername: string | null;
    senderId: string | null;
    publishedAt: string;
    channel: {
      title: string;
      username: string | null;
      telegramId: string;
    };
  };
};

type LeadsResponse = {
  leads: Lead[];
  counts: Record<LeadStatus, number>;
};

const initialSettings: Settings = { chats: [], keywordRules: [] };

const emptyCounts: Record<LeadStatus, number> = {
  NEW: 0,
  REVIEWED: 0,
  CONTACTED: 0,
  DISMISSED: 0,
};

const emptyLeadSearchFilters: LeadSearchFilters = {
  chat: "",
  keyword: "",
  dateFrom: "",
  dateTo: "",
};

const statusLabels: Record<LeadStatus, string> = {
  NEW: "Новые",
  REVIEWED: "Просмотрены",
  CONTACTED: "Связались",
  DISMISSED: "Неактуальные",
};

const statusClasses: Record<LeadStatus, string> = {
  NEW: "bg-cyan-400/15 text-cyan-300",
  REVIEWED: "bg-violet-400/15 text-violet-300",
  CONTACTED: "bg-emerald-400/15 text-emerald-300",
  DISMISSED: "bg-slate-700 text-slate-300",
};

function getErrorMessage(data: unknown) {
  if (typeof data === "object" && data !== null && "message" in data) {
    const message = (data as { message: unknown }).message;

    return Array.isArray(message) ? message.join(", ") : String(message);
  }

  return "Не удалось выполнить запрос. Проверь, что API запущен.";
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<Record<LeadStatus, number>>(emptyCounts);
  const [leadFilter, setLeadFilter] = useState<LeadFilter>("ALL");
  const [leadSearch, setLeadSearch] = useState<LeadSearchFilters>(
    emptyLeadSearchFilters,
  );

  const [chatIdentifier, setChatIdentifier] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [phrase, setPhrase] = useState("");
  const [ruleType, setRuleType] = useState<"INCLUDE" | "EXCLUDE">("INCLUDE");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(
    async <T,>(url: string, options?: RequestInit): Promise<T> => {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...options?.headers,
        },
      });

      if (!response.ok) {
        let data: unknown;

        try {
          data = await response.json();
        } catch {
          data = null;
        }

        throw new Error(getErrorMessage(data));
      }

      if (response.status === 204) {
        return null as T;
      }

      return response.json() as Promise<T>;
    },
    [],
  );

  const loadSettings = useCallback(async () => {
    const data = await request<Settings>("/api/monitoring-settings");
    setSettings(data);
  }, [request]);

  const loadLeads = useCallback(
    async (status: LeadFilter, filters: LeadSearchFilters) => {
      const params = new URLSearchParams();

      if (status !== "ALL") {
        params.set("status", status);
      }

      if (filters.chat.trim()) {
        params.set("chat", filters.chat.trim());
      }

      if (filters.keyword.trim()) {
        params.set("keyword", filters.keyword.trim());
      }

      if (filters.dateFrom) {
        params.set("dateFrom", filters.dateFrom);
      }

      if (filters.dateTo) {
        params.set("dateTo", filters.dateTo);
      }

      const query = params.toString();
      const data = await request<LeadsResponse>(
        `/api/leads${query ? `?${query}` : ""}`,
      );

      setLeads(data.leads);
      setCounts(data.counts);
    },
    [request],
  );

  const loadDashboard = useCallback(
    async (status: LeadFilter, filters: LeadSearchFilters) => {
      try {
        setLoading(true);
        setError("");

        await Promise.all([loadSettings(), loadLeads(status, filters)]);
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Не удалось загрузить данные dashboard.",
        );
      } finally {
        setLoading(false);
      }
    },
    [loadLeads, loadSettings],
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadDashboard("ALL", emptyLeadSearchFilters);
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadDashboard]);

  async function changeLeadFilter(status: LeadFilter) {
    try {
      setSaving(true);
      setError("");
      setLeadFilter(status);
      await loadLeads(status, leadSearch);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось загрузить лиды.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function updateLeadStatus(id: string, status: LeadStatus) {
    try {
      setSaving(true);
      setError("");

      await request<Lead>(`/api/leads/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });

      await loadLeads(leadFilter, leadSearch);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось обновить статус лида.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function mutateSettings(path: string, options: RequestInit) {
    try {
      setSaving(true);
      setError("");

      await request(`/api/monitoring-settings${path}`, options);
      await loadSettings();

      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось сохранить изменения.",
      );

      return false;
    } finally {
      setSaving(false);
    }
  }

  async function addChat(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!chatIdentifier.trim()) {
      setError("Укажи username или ID Telegram-чата.");
      return;
    }

    const created = await mutateSettings("/chats", {
      method: "POST",
      body: JSON.stringify({
        identifier: chatIdentifier.trim(),
        title: chatTitle.trim() || undefined,
      }),
    });

    if (created) {
      setChatIdentifier("");
      setChatTitle("");
    }
  }

  async function addRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phrase.trim()) {
      setError("Укажи ключевую фразу.");
      return;
    }

    const created = await mutateSettings("/keyword-rules", {
      method: "POST",
      body: JSON.stringify({
        phrase: phrase.trim(),
        type: ruleType,
      }),
    });

    if (created) {
      setPhrase("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-cyan-400">LEADHUNTER</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Лиды и мониторинг
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Находи потенциальных клиентов в Telegram-чатах и управляй
            результатами в одном месте.
          </p>
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <span>{error}</span>
            <button
              className="font-medium text-red-100 underline"
              onClick={() => void loadDashboard(leadFilter, leadSearch)}
              type="button"
            >
              Повторить
            </button>
          </div>
        )}

        <section className="mb-8 rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
          <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <p className="text-sm font-medium text-cyan-400">DASHBOARD</p>
              <h2 className="mt-1 text-2xl font-semibold">Найденные лиды</h2>
              <p className="mt-1 text-sm text-slate-400">
                Меняй статус, чтобы не потерять интересные заявки.
              </p>
            </div>

            <button
              className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-cyan-400 hover:text-cyan-300 disabled:opacity-50"
              disabled={saving}
              onClick={() => void loadDashboard(leadFilter, leadSearch)}
              type="button"
            >
              Обновить
            </button>
          </div>

          <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {(Object.keys(statusLabels) as LeadStatus[]).map((status) => (
              <button
                className={`rounded-xl border p-4 text-left transition ${
                  leadFilter === status
                    ? "border-cyan-400 bg-cyan-400/10"
                    : "border-slate-800 bg-slate-950 hover:border-slate-600"
                }`}
                key={status}
                onClick={() => void changeLeadFilter(status)}
                type="button"
              >
                <p className={`text-sm font-medium ${statusClasses[status]}`}>
                  {statusLabels[status]}
                </p>
                <p className="mt-2 text-3xl font-bold">{counts[status]}</p>
              </button>
            ))}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            <button
              className={`rounded-lg px-3 py-2 text-sm font-semibold ${
                leadFilter === "ALL"
                  ? "bg-cyan-400 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
              onClick={() => void changeLeadFilter("ALL")}
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
                onClick={() => void changeLeadFilter(status)}
                type="button"
              >
                {statusLabels[status]}
              </button>
            ))}
          </div>
          <form
            className="mb-5 grid gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4 sm:grid-cols-2 lg:grid-cols-5"
            onSubmit={(event) => {
              event.preventDefault();
              void loadLeads(leadFilter, leadSearch);
            }}
          >
            <input
              className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
              placeholder="Чат или @username"
              value={leadSearch.chat}
              onChange={(event) =>
                setLeadSearch((current) => ({ ...current, chat: event.target.value }))
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
                onClick={() => {
                  setLeadSearch(emptyLeadSearchFilters);
                  void loadLeads(leadFilter, emptyLeadSearchFilters);
                }}
                type="button"
              >
                Сбросить
              </button>
            </div>
          </form>
          <div className="space-y-4">
            {loading ? (
              <p className="text-sm text-slate-400">Загружаем лиды…</p>
            ) : leads.length === 0 ? (
              <p className="rounded-xl border border-dashed border-slate-700 p-5 text-sm text-slate-400">
                Лидов с таким статусом пока нет. Когда мониторинг найдёт
                подходящее сообщение, оно появится здесь.
              </p>
            ) : (
              leads.map((lead) => (
                <article
                  className="rounded-xl border border-slate-800 bg-slate-950 p-4 sm:p-5"
                  key={lead.id}
                >
                  <div className="flex flex-col justify-between gap-3 sm:flex-row">
                    <div className="min-w-0">
                      <div className="mb-3 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded px-2 py-1 text-xs font-bold ${statusClasses[lead.status]}`}
                        >
                          {statusLabels[lead.status]}
                        </span>
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

                      <select
                        className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-cyan-400"
                        disabled={saving}
                        onChange={(event) =>
                          void updateLeadStatus(
                            lead.id,
                            event.target.value as LeadStatus,
                          )
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
              ))
            )}
          </div>
        </section>

        <h2 className="mb-4 text-2xl font-semibold">Настройки мониторинга</h2>

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Отслеживаемые чаты</h3>
              <p className="mt-1 text-sm text-slate-400">
                Укажи username, ссылку или ID чата.
              </p>
            </div>

            <form className="mb-6 grid gap-3" onSubmit={addChat}>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="@frontend_chat"
                value={chatIdentifier}
                onChange={(event) => setChatIdentifier(event.target.value)}
              />
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Название для удобства (необязательно)"
                value={chatTitle}
                onChange={(event) => setChatTitle(event.target.value)}
              />
              <button
                className="rounded-lg bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                type="submit"
              >
                Добавить чат
              </button>
            </form>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-400">Загружаем чаты…</p>
              ) : settings.chats.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  Чатов пока нет. Добавь первый чат выше.
                </p>
              ) : (
                settings.chats.map((chat) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                    key={chat.id}
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {chat.title || chat.identifier}
                      </p>
                      {chat.title && (
                        <p className="truncate text-sm text-slate-400">
                          {chat.identifier}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          chat.active
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                        disabled={saving}
                        onClick={() =>
                          void mutateSettings(`/chats/${chat.id}/active`, {
                            method: "PATCH",
                            body: JSON.stringify({ active: !chat.active }),
                          })
                        }
                        type="button"
                      >
                        {chat.active ? "Включён" : "Выключен"}
                      </button>
                      <button
                        className="rounded-md px-2 py-1.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={saving}
                        onClick={() =>
                          void mutateSettings(`/chats/${chat.id}`, {
                            method: "DELETE",
                          })
                        }
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
            <div className="mb-6">
              <h3 className="text-xl font-semibold">Ключевые слова</h3>
              <p className="mt-1 text-sm text-slate-400">
                Include ищет лиды, Exclude отсекает нерелевантные сообщения.
              </p>
            </div>

            <form className="mb-6 grid gap-3" onSubmit={addRule}>
              <input
                className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 outline-none placeholder:text-slate-500 focus:border-cyan-400"
                placeholder="Например: нужен разработчик"
                value={phrase}
                onChange={(event) => setPhrase(event.target.value)}
              />
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    ruleType === "INCLUDE"
                      ? "bg-cyan-400 text-slate-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                  onClick={() => setRuleType("INCLUDE")}
                  type="button"
                >
                  Include
                </button>
                <button
                  className={`rounded-lg px-3 py-2.5 text-sm font-semibold ${
                    ruleType === "EXCLUDE"
                      ? "bg-red-400 text-slate-950"
                      : "bg-slate-800 text-slate-300"
                  }`}
                  onClick={() => setRuleType("EXCLUDE")}
                  type="button"
                >
                  Exclude
                </button>
              </div>
              <button
                className="rounded-lg bg-cyan-400 px-4 py-2.5 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-50"
                disabled={saving}
                type="submit"
              >
                Добавить правило
              </button>
            </form>

            <div className="space-y-3">
              {loading ? (
                <p className="text-sm text-slate-400">Загружаем правила…</p>
              ) : settings.keywordRules.length === 0 ? (
                <p className="rounded-lg border border-dashed border-slate-700 p-4 text-sm text-slate-400">
                  Правил пока нет. Добавь фразу выше.
                </p>
              ) : (
                settings.keywordRules.map((rule) => (
                  <div
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950 p-4"
                    key={rule.id}
                  >
                    <div className="min-w-0">
                      <span
                        className={`mr-2 inline-flex rounded px-2 py-1 text-xs font-bold ${
                          rule.type === "INCLUDE"
                            ? "bg-cyan-400/15 text-cyan-300"
                            : "bg-red-400/15 text-red-300"
                        }`}
                      >
                        {rule.type}
                      </span>
                      <span className="break-words font-medium">
                        {rule.phrase}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <button
                        className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                          rule.active
                            ? "bg-emerald-400/15 text-emerald-300"
                            : "bg-slate-800 text-slate-400"
                        }`}
                        disabled={saving}
                        onClick={() =>
                          void mutateSettings(
                            `/keyword-rules/${rule.id}/active`,
                            {
                              method: "PATCH",
                              body: JSON.stringify({ active: !rule.active }),
                            },
                          )
                        }
                        type="button"
                      >
                        {rule.active ? "Включено" : "Выключено"}
                      </button>
                      <button
                        className="rounded-md px-2 py-1.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={saving}
                        onClick={() =>
                          void mutateSettings(`/keyword-rules/${rule.id}`, {
                            method: "DELETE",
                          })
                        }
                        type="button"
                      >
                        Удалить
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
