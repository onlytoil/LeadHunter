type Environment = Record<string, unknown>;

const requiredWhenTelegramEnabled = [
  'TELEGRAM_API_ID',
  'TELEGRAM_API_HASH',
  'TELEGRAM_SESSION',
  'TELEGRAM_CHATS',
  'TELEGRAM_INCLUDE_KEYWORDS',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_NOTIFICATION_CHAT_ID',
] as const;

export function validateEnvironment(source: Environment): Environment {
  const config = { ...source };

  config.PORT = parsePositiveInteger(source.PORT, 3001, 'PORT');
  config.DATABASE_URL =
    readString(source.DATABASE_URL) ??
    'postgresql://postgres:postgres@localhost:5432/leadhunter?schema=public';
  config.TELEGRAM_ENABLED = parseBoolean(source.TELEGRAM_ENABLED, false);

  if (config.TELEGRAM_ENABLED) {
    const missing = requiredWhenTelegramEnabled.filter(
      (key) => !readString(source[key]),
    );

    if (missing.length > 0) {
      throw new Error(
        `Telegram is enabled, but these environment variables are missing: ${missing.join(', ')}`,
      );
    }

    config.TELEGRAM_API_ID = parsePositiveInteger(
      source.TELEGRAM_API_ID,
      undefined,
      'TELEGRAM_API_ID',
    );
  }

  return config;
}

function parseBoolean(value: unknown, fallback: boolean): boolean {
  const normalized = readString(value)?.toLowerCase();

  if (!normalized) {
    return fallback;
  }

  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(`Expected a boolean value, received: ${normalized}`);
}

function parsePositiveInteger(
  value: unknown,
  fallback: number | undefined,
  name: string,
): number {
  const raw = readString(value);

  if (!raw && fallback !== undefined) {
    return fallback;
  }

  const parsed = Number(raw);
  if (!Number.isSafeInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return parsed;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}
