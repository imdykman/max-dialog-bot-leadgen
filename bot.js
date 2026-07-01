// ========== ПОДКЛЮЧЕНИЕ БИБЛИОТЕК ==========
const { Bot, Keyboard } = require("@maxhub/max-bot-api");
require("dotenv").config();

// ========== ИМПОРТ МОДУЛЕЙ ==========
const { getUserId } = require("./utils/getUserId");
const { userStates } = require("./services/states");
const { sendWelcome, handlePricing } = require("./handlers/welcome");
const { handleDemoAction, handleDemoTextInput } = require("./handlers/demo");
const {
  handleOrderStart,
  handleOrderStep,
  handleRetryContact,
} = require("./handlers/order");
const {
  handleSupport,
  handleSupportAction,
  handleSupportTextInput,
} = require("./handlers/support");

// ========== СОЗДАНИЕ БОТА ==========
const BOT_TOKEN = process.env.MAX_BOT_API_TOKEN;
const bot = new Bot(BOT_TOKEN, {
  apiBaseUrl: process.env.MAX_API_BASE_URL || "https://platform-api2.max.ru",
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

// ========== ЕДИНСТВЕННЫЙ ОБРАБОТЧИК СООБЩЕНИЙ ==========
bot.on("message_created", async (ctx) => {
  const text = ctx.message?.body?.text || "";
  const userId = getUserId(ctx);

  console.log(`\n📩 MESSAGE_CREATED | text: "${text}" | userId: ${userId}`);

  if (!userId) return;
  if (text.startsWith("/")) return;

  // ========== ОБРАБОТКА КОНТАКТА ==========
  if (ctx.message?.body?.attachments?.[0]?.type === "contact") {
    console.log(`📱 Получен контакт`);

    const payload = ctx.message.body.attachments[0].payload;
    const vcfInfo = payload.vcf_info || "";
    const maxInfo = payload.max_info || {};

    // Извлекаем телефон из vCard
    const phoneMatch = vcfInfo.match(/TEL[^:]*:(\+?\d+)/);
    const phone = phoneMatch ? phoneMatch[1] : null;

    // Извлекаем имя из max_info
    const name = maxInfo.name || maxInfo.first_name || null;

    console.log(`📱 Телефон: ${phone}, Имя: ${name}`);

    if (phone) {
      const state = userStates.get(userId);

      // Если мы в режиме заказа и на шаге контакта
      if (state && state.mode === "order" && state.step === "contact") {
        // Сохраняем телефон
        state.data.contact = phone.startsWith("+") ? phone : `+${phone}`;

        // Сохраняем имя, если есть
        if (name) {
          state.data.name = name;
        }

        state.step = "call_time";
        userStates.set(userId, state);

        // Задаём вопрос о времени звонка
        const contactQuestion = `Когда вам удобно принять звонок на номер ${state.data.contact}?`;
        await ctx.reply(contactQuestion, {
          attachments: [
            Keyboard.inlineKeyboard([
              [Keyboard.button.callback("Утром (9-12)", "time_morning")],
              [Keyboard.button.callback("Днём (12-17)", "time_day")],
              [Keyboard.button.callback("Вечером (17-20)", "time_evening")],
              [Keyboard.button.callback("📞 Позвоните сейчас", "time_now")],
            ]),
          ],
        });

        console.log(`✅ Контакт обработан, переход к шагу call_time`);
        return;
      }
    }
  }

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

  // 2. Обработка текстовых ответов для ЗАКАЗА
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