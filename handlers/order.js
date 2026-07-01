const { Keyboard } = require("@maxhub/max-bot-api");
const { formatPhone, isValidPhone } = require("../services/phone");
const { saveLead } = require("../services/leads");
const { sendManagerEmail } = require("../services/email");
const { trackEvent } = require("../services/analytics");

// ========== ШАГИ ЗАКАЗА ==========
const ORDER_STEPS = {
  BUSINESS_TYPE: "business_type",
  BUSINESS_SIZE: "business_size",
  FEATURES: "features",
  CLIENTS_COUNT: "clients_count",
  NAME: "name",
  CONTACT: "contact",
  CALL_TIME: "call_time",
  DONE: "done",
};

// ========== СТАРТ ЗАКАЗА ==========
async function handleOrderStart(ctx, userId, userStates) {
  userStates.set(userId, {
    mode: "order",
    step: ORDER_STEPS.BUSINESS_TYPE,
    data: {},
  });

  await ctx.reply(
    `💼 *Заказать бота*\n\nОтлично! Давайте подберём идеальное решение для вашего бизнеса. 🎯\n\nСначала расскажите о вашем бизнесе:`,
    {
      attachments: [
        Keyboard.inlineKeyboard([
          [
            Keyboard.button.callback(
              "💇 Красота (салоны, барбершопы)",
              "order_beauty",
            ),
          ],
          [Keyboard.button.callback("🍕 Доставка / Рестораны", "order_food")],
          [Keyboard.button.callback("🏥 Медицина / Стоматология", "order_med")],
          [Keyboard.button.callback("🏗️ Услуги / Сервис", "order_service")],
          [Keyboard.button.callback("🛍️ Торговля", "order_retail")],
          [Keyboard.button.callback("🤔 Другое / Не знаю", "order_other")],
        ]),
      ],
    },
  );

  trackEvent("order_start", userId);
}

// ========== ОБРАБОТКА ШАГОВ ЗАКАЗА ==========
async function handleOrderStep(ctx, userId, data, userStates) {
  console.log(`\n📝 HANDLE_ORDER_STEP | userId: ${userId} | data: "${data}"`);

  const state = userStates.get(userId);
  console.log(
    `📊 Current state:`,
    state ? `mode=${state.mode}, step=${state.step}` : "NO STATE",
  );

  if (!state || state.mode !== "order") {
    console.log(`❌ State not found or mode !== 'order', returning`);
    return;
  }

  console.log(`✅ Processing step: ${state.step}`);

  switch (state.step) {
    case ORDER_STEPS.BUSINESS_TYPE:
      state.data.business_type = data;
      state.step = ORDER_STEPS.BUSINESS_SIZE;
      await ctx.reply(`Какой у вас масштаб?`, {
        attachments: [
          Keyboard.inlineKeyboard([
            [Keyboard.button.callback("1 точка", "size_1")],
            [Keyboard.button.callback("2-5 точек", "size_2_5")],
            [Keyboard.button.callback("Больше 5", "size_5+")],
            [Keyboard.button.callback("Пока нет, только запускаюсь", "size_0")],
          ]),
        ],
      });
      break;

    case ORDER_STEPS.BUSINESS_SIZE:
      state.data.business_size = data;
      state.step = ORDER_STEPS.FEATURES;
      await ctx.reply(`Что должен делать бот?`, {
        attachments: [
          Keyboard.inlineKeyboard([
            [
              Keyboard.button.callback(
                "📅 Запись / Бронирование",
                "feat_booking",
              ),
            ],
            [Keyboard.button.callback("🛒 Приём заказов", "feat_orders")],
            [Keyboard.button.callback("❓ Ответы на вопросы", "feat_faq")],
            [
              Keyboard.button.callback(
                "📢 Рассылки клиентам",
                "feat_broadcast",
              ),
            ],
            [Keyboard.button.callback("✨ Несколько задач", "feat_all")],
          ]),
        ],
      });
      break;

    case ORDER_STEPS.FEATURES:
      state.data.features = data;
      state.step = ORDER_STEPS.CLIENTS_COUNT;
      await ctx.reply(`Примерное количество клиентов в месяц?`, {
        attachments: [
          Keyboard.inlineKeyboard([
            [Keyboard.button.callback("До 50", "clients_50")],
            [Keyboard.button.callback("50-200", "clients_200")],
            [Keyboard.button.callback("200-500", "clients_500")],
            [Keyboard.button.callback("Больше 500", "clients_500+")],
            [Keyboard.button.callback("Не знаю", "clients_unknown")],
          ]),
        ],
      });
      break;

    case ORDER_STEPS.CLIENTS_COUNT:
      state.data.clients_count = data;
      state.step = ORDER_STEPS.CONTACT;

      await ctx.reply(
        `📱 *Оставьте телефон для связи*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Нажмите кнопку ниже, чтобы отправить свой контакт:`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [Keyboard.button.requestContact("📱 Отправить контакт")],
              [Keyboard.button.callback("⬅️ Назад", "order_back")],
            ]),
          ],
        },
      );
      break;

    case ORDER_STEPS.NAME:
      state.data.name = data;
      state.step = ORDER_STEPS.CONTACT;
      await ctx.reply(
        `📱 *Оставьте телефон для связи*\n\n` +
          `━━━━━━━━━━━━━━━━━━━━━━\n\n` +
          `Нажмите кнопку ниже, чтобы отправить свой контакт:`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [Keyboard.button.requestContact("📱 Отправить контакт")],
              [Keyboard.button.callback("⬅️ Назад", "order_back")],
            ]),
          ],
        },
      );
      break;

    case ORDER_STEPS.CONTACT:
      const digits = data.replace(/\D/g, "");

      // Если ввод состоит ТОЛЬКО из цифр — это попытка ввести телефон
      if (/^\d+$/.test(data.trim())) {
        // Валидируем формат телефона
        if (!isValidPhone(data)) {
          await ctx.reply(
            `❌ Неверный формат телефона.\n\n` +
              `Введите номер в формате:\n` +
              `• +7 909 000 40 77\n` +
              `• 8 909 000 40 77\n` +
              `• 909 000 40 77\n\n` +
              `Мобильные номера в России начинаются с +7 9XX.\n\n` +
              `Сейчас вы ввели: ${data}`,
            {
              attachments: [
                Keyboard.inlineKeyboard([
                  [
                    Keyboard.button.callback(
                      "🔄 Ввести заново",
                      "retry_contact",
                    ),
                  ],
                ]),
              ],
            },
          );
          userStates.set(userId, state);
          return;
        }
        // Телефон валиден — форматируем
        state.data.contact = formatPhone(data);
      } else {
        // Есть буквы или спецсимволы — это @username или email
        state.data.contact = data;
      }

      state.step = ORDER_STEPS.CALL_TIME;

      // Формируем текст с учётом типа контакта
      let contactQuestion;
      if (state.data.contact.startsWith("+")) {
        contactQuestion = `Когда вам удобно принять звонок на номер ${state.data.contact}?`;
      } else {
        contactQuestion = `Когда вам удобно, чтобы мы связались с вами (${state.data.contact})?`;
      }

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
      break;

    case ORDER_STEPS.CALL_TIME:
      state.data.call_time = data;

      await saveLead(userId, state.data);
      await sendManagerEmail(state.data);
      await showThankYou(ctx, state.data);

      trackEvent("order_complete", userId, state.data);
      userStates.delete(userId);
      return;
  }

  console.log(`💾 Saving state | new step: ${state.step}`);
  userStates.set(userId, state);
}

// ========== ФИНАЛЬНЫЙ ЭКРАН ==========
async function showThankYou(ctx, data) {
  await ctx.reply(
    `✅ *Заявка принята!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Что дальше:*\n
    1. Менеджер свяжется с вами в ближайшее время\n
    2. Обсудит детали и покажет расчёт\n
    3. Предложит готовое решение или разработает с нуля\n\n
    🎁 *Бонус*: при заказе до конца недели — настройка YandexGPT в подарок!\n\n
    Спасибо, ${data.name}! 💚`,
    {
      attachments: [
        Keyboard.inlineKeyboard([
          [Keyboard.button.callback("🏠 Главное меню", "start")],
        ]),
      ],
    },
  );
}

// ========== ОБРАБОТКА КНОПКИ "ВВЕСТИ ЗАНОВО" ==========
async function handleRetryContact(ctx, userId, userStates) {
  const state = userStates.get(userId);
  if (state && state.mode === "order") {
    state.step = ORDER_STEPS.CONTACT;
    userStates.set(userId, state);
    await ctx.reply(`📱 Введите телефон или @username:`);
  }
}

module.exports = {
  handleOrderStart,
  handleOrderStep,
  handleRetryContact,
  ORDER_STEPS,
};
