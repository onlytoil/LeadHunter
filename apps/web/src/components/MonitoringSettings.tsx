"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import type { KeywordRule, Settings } from "../lib/types";

type MonitoringSettingsProps = {
  settings: Settings;
  saving: boolean;

  chatIdentifier: string;
  chatTitle: string;
  phrase: string;
  ruleType: KeywordRule["type"];

  setChatIdentifier: Dispatch<SetStateAction<string>>;
  setChatTitle: Dispatch<SetStateAction<string>>;
  setPhrase: Dispatch<SetStateAction<string>>;
  setRuleType: Dispatch<SetStateAction<KeywordRule["type"]>>;

  onAddChat: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onAddRule: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  onMutateSettings: (
    path: string,
    options: RequestInit,
  ) => Promise<boolean>;
};

export function MonitoringSettings({
  settings,
  saving,
  chatIdentifier,
  chatTitle,
  phrase,
  ruleType,
  setChatIdentifier,
  setChatTitle,
  setPhrase,
  setRuleType,
  onAddChat,
  onAddRule,
  onMutateSettings,
}: MonitoringSettingsProps) {
  return (
    <section className="grid gap-6 lg:grid-cols-2">
      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Отслеживаемые чаты</h2>
          <p className="mt-1 text-sm text-slate-400">
            Добавь username или Telegram ID чата, где нужно искать лиды.
          </p>
        </div>

        <form className="grid gap-3" onSubmit={onAddChat}>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
            onChange={(event) => setChatIdentifier(event.target.value)}
            placeholder="@username или ID чата"
            value={chatIdentifier}
          />

          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
            onChange={(event) => setChatTitle(event.target.value)}
            placeholder="Название для удобства (необязательно)"
            value={chatTitle}
          />

          <button
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={saving}
            type="submit"
          >
            Добавить чат
          </button>
        </form>

        <div className="mt-5 space-y-2">
          {settings.chats.length ? (
            settings.chats.map((chat) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3"
                key={chat.id}
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-slate-200">
                    {chat.title || chat.identifier}
                  </p>
                  {chat.title && (
                    <p className="truncate text-sm text-slate-500">
                      {chat.identifier}
                    </p>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                      chat.active
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                    disabled={saving}
                    onClick={() =>
                      void onMutateSettings(`/chats/${chat.id}/active`, {
                        method: "PATCH",
                        body: JSON.stringify({ active: !chat.active }),
                      })
                    }
                    type="button"
                  >
                    {chat.active ? "Включён" : "Выключен"}
                  </button>

                  <button
                    className="rounded-lg bg-red-400/15 px-3 py-2 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={saving}
                    onClick={() =>
                      void onMutateSettings(`/chats/${chat.id}`, {
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
          ) : (
            <p className="text-sm text-slate-500">Чаты ещё не добавлены.</p>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-950 p-5">
        <div className="mb-5">
          <h2 className="text-xl font-bold">Ключевые фразы</h2>
          <p className="mt-1 text-sm text-slate-400">
            Включающие фразы ищут лиды, исключающие — отсеивают нерелевантные
            сообщения.
          </p>
        </div>

        <form className="grid gap-3 sm:grid-cols-[1fr_auto_auto]" onSubmit={onAddRule}>
          <input
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none placeholder:text-slate-500 focus:border-cyan-400"
            onChange={(event) => setPhrase(event.target.value)}
            placeholder="Например: нужен разработчик"
            value={phrase}
          />

          <select
            className="rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            onChange={(event) =>
              setRuleType(event.target.value as KeywordRule["type"])
            }
            value={ruleType}
          >
            <option value="INCLUDE">Включать</option>
            <option value="EXCLUDE">Исключать</option>
          </select>

          <button
            className="rounded-lg bg-cyan-400 px-3 py-2 text-sm font-semibold text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
            disabled={saving}
            type="submit"
          >
            Добавить
          </button>
        </form>

        <div className="mt-5 space-y-2">
          {settings.keywordRules.length ? (
            settings.keywordRules.map((rule) => (
              <div
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 bg-slate-900 p-3"
                key={rule.id}
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    className={`rounded px-2 py-1 text-xs font-bold ${
                      rule.type === "INCLUDE"
                        ? "bg-cyan-400/15 text-cyan-300"
                        : "bg-amber-400/15 text-amber-300"
                    }`}
                  >
                    {rule.type === "INCLUDE" ? "ВКЛ" : "ИСКЛ"}
                  </span>
                  <p className="break-words text-sm text-slate-200">
                    {rule.phrase}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    className={`rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-40 ${
                      rule.active
                        ? "bg-emerald-400/15 text-emerald-300"
                        : "bg-slate-800 text-slate-300"
                    }`}
                    disabled={saving}
                    onClick={() =>
                      void onMutateSettings(`/keyword-rules/${rule.id}/active`, {
                        method: "PATCH",
                        body: JSON.stringify({ active: !rule.active }),
                      })
                    }
                    type="button"
                  >
                    {rule.active ? "Включено" : "Выключено"}
                  </button>

                  <button
                    className="rounded-lg bg-red-400/15 px-3 py-2 text-sm font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                    disabled={saving}
                    onClick={() =>
                      void onMutateSettings(`/keyword-rules/${rule.id}`, {
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
          ) : (
            <p className="text-sm text-slate-500">
              Ключевые фразы ещё не добавлены.
            </p>
          )}
        </div>
      </div>
    </section>
  );
}