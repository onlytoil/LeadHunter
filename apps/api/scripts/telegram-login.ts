import "dotenv/config";

import input from "input";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";

async function main() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH!;

  const client = new TelegramClient(
    new StringSession(""),
    apiId,
    apiHash,
    {
      connectionRetries: 5,
    },
  );

  await client.start({
    phoneNumber: async () => await input.text("Телефон: "),
    password: async () => await input.text("Пароль (если есть): "),
    phoneCode: async () => await input.text("Код из Telegram: "),
    onError: (err) => console.log(err),
  });

  console.log("\n==============================");
  console.log("Авторизация успешна!");
  console.log("==============================\n");

  console.log(client.session.save());

  await client.disconnect();
}

main();