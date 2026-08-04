"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";

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

const initialSettings: Settings = { chats: [], keywordRules: [] };

function getErrorMessage(data: unknown) {
  if (
    typeof data === "object" &&
    data !== null &&
    "message" in data
  ) {
    const message = (data as { message: unknown }).message;
    return Array.isArray(message) ? message.join(", ") : String(message);
  }

  return "Не удалось выполнить запрос. Проверь, что API запущен.";
}

export default function Home() {
  const [settings, setSettings] = useState<Settings>(initialSettings);
  const [chatIdentifier, setChatIdentifier] = useState("");
  const [chatTitle, setChatTitle] = useState("");
  const [phrase, setPhrase] = useState("");
  const [ruleType, setRuleType] = useState<"INCLUDE" | "EXCLUDE">("INCLUDE");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const request = useCallback(async (path = "", options?: RequestInit) => {
    const response = await fetch(`/api/monitoring-settings${path}`, {
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
      return null;
    }

    return response.json();
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);
      setError("");
      const data = (await request()) as Settings;
      setSettings(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось загрузить настройки.",
      );
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    void Promise.resolve().then(loadSettings);
  }, [loadSettings]);

  async function mutate(path: string, options: RequestInit) {
    try {
      setSaving(true);
      setError("");
      await request(path, options);
      await loadSettings();
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Не удалось сохранить изменения.",
      );
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

    await mutate("/chats", {
      method: "POST",
      body: JSON.stringify({
        identifier: chatIdentifier.trim(),
        title: chatTitle.trim() || undefined,
      }),
    });

    setChatIdentifier("");
    setChatTitle("");
  }

  async function addRule(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!phrase.trim()) {
      setError("Укажи ключевую фразу.");
      return;
    }

    await mutate("/keyword-rules", {
      method: "POST",
      body: JSON.stringify({
        phrase: phrase.trim(),
        type: ruleType,
      }),
    });

    setPhrase("");
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8">
          <p className="mb-2 text-sm font-medium text-cyan-400">LEADHUNTER</p>
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Настройки мониторинга
          </h1>
          <p className="mt-3 max-w-2xl text-slate-400">
            Добавь Telegram-чаты и правила, по которым LeadHunter будет искать
            потенциальных клиентов.
          </p>
        </header>

        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            <span>{error}</span>
            <button
              className="font-medium text-red-100 underline"
              onClick={() => void loadSettings()}
              type="button"
            >
              Повторить
            </button>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          <section className="rounded-2xl border border-slate-800 bg-slate-900 p-5 shadow-xl sm:p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold">Отслеживаемые чаты</h2>
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
                          void mutate(`/chats/${chat.id}/active`, {
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
                          void mutate(`/chats/${chat.id}`, {
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
              <h2 className="text-xl font-semibold">Ключевые слова</h2>
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
                      <span className="break-words font-medium">{rule.phrase}</span>
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
                          void mutate(`/keyword-rules/${rule.id}/active`, {
                            method: "PATCH",
                            body: JSON.stringify({ active: !rule.active }),
                          })
                        }
                        type="button"
                      >
                        {rule.active ? "Включено" : "Выключено"}
                      </button>
                      <button
                        className="rounded-md px-2 py-1.5 text-sm text-slate-400 hover:bg-red-500/10 hover:text-red-300"
                        disabled={saving}
                        onClick={() =>
                          void mutate(`/keyword-rules/${rule.id}`, {
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