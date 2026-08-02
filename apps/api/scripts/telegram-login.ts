import { config } from 'dotenv';
import path from 'node:path';

import input from 'input';
import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions';

config({ path: path.resolve(process.cwd(), '../../.env') });

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH;

  if (!Number.isSafeInteger(apiId) || apiId <= 0 || !apiHash) {
    throw new Error(
      'Add TELEGRAM_API_ID and TELEGRAM_API_HASH to the root .env file first.',
    );
  }

  const client = new TelegramClient(new StringSession(''), apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    phoneNumber: async () => await input.text('Телефон: '),
    password: async () => await input.text('Пароль 2FA (если есть): '),
    phoneCode: async () => await input.text('Код из Telegram: '),
    onError: (error) => console.error(error),
  });

  console.log(
    '\nАвторизация успешна. Скопируйте значение ниже в TELEGRAM_SESSION',
  );
  console.log('и никому его не отправляйте:\n');
  console.log(client.session.save());

  await client.disconnect();
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
