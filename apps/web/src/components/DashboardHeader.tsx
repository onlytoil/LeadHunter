import { formatDate } from "../lib/lead-utils";
import type { TelegramStatus } from "../lib/types";

type DashboardHeaderProps = {
  telegramStatus: TelegramStatus | null;
};

export function DashboardHeader({ telegramStatus }: DashboardHeaderProps) {
  const isConnected = telegramStatus?.connected && telegramStatus.listening;

  const statusClass = telegramStatus?.reconnecting
    ? "bg-amber-400/15 text-amber-300"
    : telegramStatus?.lastError
      ? "bg-red-400/15 text-red-300"
      : isConnected
        ? "bg-emerald-400/15 text-emerald-300"
        : "bg-slate-700 text-slate-300";

  const statusText = telegramStatus?.reconnecting
    ? `Telegram: переподключение${
        telegramStatus.reconnectAttempt
          ? ` (${telegramStatus.reconnectAttempt})`
          : ""
      }`
    : telegramStatus?.lastError
      ? "Telegram: ошибка"
      : isConnected
        ? "Telegram: подключён"
        : telegramStatus?.enabled === false
          ? "Telegram: выключен"
          : "Telegram: отключён";

  return (
    <header className="mb-8">
      <p className="mb-2 text-sm font-medium text-cyan-400">LEADHUNTER</p>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
        Лиды и мониторинг
      </h1>

      <p className="mt-3 max-w-2xl text-slate-400">
        Находи потенциальных клиентов в Telegram-чатах и управляй результатами в
        одном месте.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
        <span className={`rounded-full px-3 py-1 font-semibold ${statusClass}`}>
          {statusText}
        </span>

        {telegramStatus?.lastProcessedMessageAt && (
          <span className="text-slate-400">
            Последнее сообщение:{" "}
            {formatDate(telegramStatus.lastProcessedMessageAt)}
          </span>
        )}

        {telegramStatus?.lastError && (
          <span className="text-slate-400">
            {telegramStatus.lastErrorAt
              ? `${formatDate(telegramStatus.lastErrorAt)}: `
              : ""}
            {telegramStatus.lastError}
          </span>
        )}
      </div>
    </header>
  );
}
