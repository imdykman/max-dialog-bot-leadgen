// ========== ПОДКЛЮЧЕНИЕ БИБЛИОТЕК ==========
const { Bot } = require("@maxhub/max-bot-api");
require("dotenv").config();

// ========== ИМПОРТ МОДУЛЕЙ ==========
const { getUserId } = require("./utils/getUserId");
const { userStates } = require("./services/states");
const { sendWelcome, handlePricing } = require("./handlers/welcome");
const { handleDemoAction, handleDemoTextInput } = require("./handlers/demo");
const { handleOrderStart, handleOrderStep, handleRetryContact } = require("./handlers/order");
const { handleSupport, handleSupportAction, handleSupportTextInput } = require("./handlers/support");

// ========== СОЗДАНИЕ БОТА ==========
const BOT_TOKEN = process.env.MAX_BOT_API_TOKEN;
const bot = new Bot(BOT_TOKEN, {
  apiBaseUrl: process.env.MAX_API_BASE_URL || 'https://platform-api2.max.ru'
});

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========

// Стартовое событие
bot.on("bot_started", async (ctx) => {
  const userId = getUserId(ctx);
  await sendWelcome(ctx, userId, userStates);
});

// Команда /start
bot.command("start", async (ctx) => {
  const userId = getUserId(ctx);
  await sendWelcome(ctx, userId, userStates);
});

// Callback-кнопки
bot.on("message_callback", async (ctx) => {
  const data = ctx.callback.payload;
  const userId = getUserId(ctx);

  console.log(`\n🔘 НАЖАТА КНОПКА: ${data} | userId: ${userId}`);

  if (!userId) return;

  // Навигация
  if (data === "start") {
    await sendWelcome(ctx, userId, userStates);
    return;
  }

  if (data === "pricing") {
    await handlePricing(ctx, userId);
    return;
  }

  if (data === "support" || data.startsWith("support_")) {
    await handleSupportAction(ctx, userId, data, userStates);
    return;
  }

  // Заказ
  if (data === "order_start") {
    await handleOrderStart(ctx, userId, userStates);
    return;
  }

  if (data === "retry_contact") {
    await handleRetryContact(ctx, userId, userStates);
    return;
  }

  // Демо
  if (data.startsWith("demo_")) {
    await handleDemoAction(ctx, userId, data, userStates);
    return;
  }

  // Шаги заказа
  if (
    data.startsWith("order_") ||
    data.startsWith("size_") ||
    data.startsWith("feat_") ||
    data.startsWith("clients_") ||
    data.startsWith("time_")
  ) {
    await handleOrderStep(ctx, userId, data, userStates);
    return;
  }
});

// Текстовые сообщения
bot.on("message_created", async (ctx) => {
  const text = ctx.message?.body?.text || "";
  const userId = getUserId(ctx);

  console.log(`\n📩 MESSAGE_CREATED | text: "${text}" | userId: ${userId}`);

  if (text.startsWith("/")) return;
  if (!userId) return;

  const state = userStates.get(userId);
  console.log(
    `📊 State found:`,
    state ? `mode=${state.mode}, step=${state.step}` : "NO STATE",
  );

  // 1. Обработка текстовых вопросов в ПОДДЕРЖКЕ (YandexGPT)
  const supportHandled = await handleSupportTextInput(
    ctx,
    userId,
    text,
    userStates,
  );
  if (supportHandled) {
    console.log(`✅ Support question handled by YandexGPT`);
    return;
  }

  // 2. Обработка текстовых ответов для ЗАКАЗА (имя, контакт)
  if (state && state.mode === "order") {
    console.log(
      `✅ Order mode detected, calling handleOrderStep with text: "${text}"`,
    );
    await handleOrderStep(ctx, userId, text, userStates);
    return;
  }

  // 3. Обработка адреса в ДОСТАВКЕ (демо-режим)
  const deliveryHandled = await handleDemoTextInput(
    ctx,
    userId,
    text,
    userStates,
  );
  if (deliveryHandled) {
    console.log(`✅ Delivery address mode detected`);
    return;
  }

  // 4. Если ничего не подошло — показываем приветствие
  console.log(`❌ No matching mode, showing welcome`);
  await sendWelcome(ctx, userId, userStates);
});

// ========== ЗАПУСК ==========
bot.start();
console.log("\n" + "=".repeat(50));
console.log("🤖 MAX-DIALOG Demo Bot запущен!");
console.log("📊 Аналитика пишется в файл: analytics.json");
console.log("=".repeat(50));
