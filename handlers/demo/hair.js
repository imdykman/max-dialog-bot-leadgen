const { Keyboard } = require("@maxhub/max-bot-api");
const { trackEvent } = require("../../services/analytics");

async function startDemoHair(ctx, userId, userStates) {
  userStates.set(userId, {
    mode: "demo",
    demo_type: "hair",
    step: "service_choice",
  });
  await ctx.reply(
    `💇 *Демо: Бот для парикмахерской*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЗдравствуйте! Я виртуальный администратор салона красоты "Стиль".\n\nПомогу записаться к мастеру онлайн — быстро и без звонков! 💚\n\nЧто вас интересует?`,
    {
      attachments: [
        Keyboard.inlineKeyboard([
          [Keyboard.button.callback("✂️ Стрижка", "demo_hair_haircut")],
          [Keyboard.button.callback("🎨 Окрашивание", "demo_hair_color")],
          [Keyboard.button.callback("💅 Маникюр", "demo_hair_nails")],
          [Keyboard.button.callback("💇‍♀️ Укладка", "demo_hair_styling")],
          [Keyboard.button.callback("⬅️ Назад к списку", "demo_menu")],
        ]),
      ],
    },
  );
  trackEvent("demo_hair_start", userId);
}

async function handleDemoHairStep(ctx, userId, action, userStates) {
  const state = userStates.get(userId);
  if (!state || state.mode !== "demo" || state.demo_type !== "hair") return;
  if (!state.data) state.data = {};

  switch (action) {
    case "demo_hair_haircut":
    case "demo_hair_color":
    case "demo_hair_nails":
    case "demo_hair_styling": {
      const services = {
        demo_hair_haircut: { name: "Стрижка", price: "от 1500 ₽", emoji: "✂️" },
        demo_hair_color: {
          name: "Окрашивание",
          price: "от 3500 ₽",
          emoji: "🎨",
        },
        demo_hair_nails: { name: "Маникюр", price: "от 1200 ₽", emoji: "💅" },
        demo_hair_styling: { name: "Укладка", price: "от 1000 ₽", emoji: "💇‍♀️" },
      };
      const s = services[action];
      state.data = { service: s.name, price: s.price };
      await ctx.reply(
        `${s.emoji} *${s.name}*\n\nОтличный выбор! Стоимость — ${s.price}.\n\nК какому мастеру хотите записаться?`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [
                Keyboard.button.callback(
                  "👩‍🦰 Анна (стаж 5 лет)",
                  "demo_hair_master_anna",
                ),
              ],
              [
                Keyboard.button.callback(
                  "👨‍🦱 Дмитрий (стаж 8 лет)",
                  "demo_hair_master_dima",
                ),
              ],
              [
                Keyboard.button.callback(
                  "👩 Елена (стаж 3 года)",
                  "demo_hair_master_elena",
                ),
              ],
              [
                Keyboard.button.link(
                  "📱 Записаться через приложение (с фото)",
                  "https://imdykman.github.io/max-dialog-bot-leadgen/",
                ),
              ],
              [Keyboard.button.callback("⬅️ Назад", "demo_hair")],
            ]),
          ],
        },
      );
      break;
    }
    case "demo_hair_master_anna":
    case "demo_hair_master_dima":
    case "demo_hair_master_elena": {
      const masters = {
        demo_hair_master_anna: "Анна",
        demo_hair_master_dima: "Дмитрий",
        demo_hair_master_elena: "Елена",
      };
      state.data.master = masters[action];
      await ctx.reply(
        `👤 *Мастер: ${state.data.master}*\n\nОтлично! Когда вам удобно прийти?`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [Keyboard.button.callback("📅 Сегодня", "demo_hair_today")],
              [Keyboard.button.callback("📅 Завтра", "demo_hair_tomorrow")],
              [
                Keyboard.button.callback(
                  "📅 Послезавтра",
                  "demo_hair_day_after",
                ),
              ],
              [Keyboard.button.callback("⬅️ Назад", "demo_hair")],
            ]),
          ],
        },
      );
      break;
    }
    case "demo_hair_today":
    case "demo_hair_tomorrow":
    case "demo_hair_day_after": {
      const dates = {
        demo_hair_today: "сегодня",
        demo_hair_tomorrow: "завтра",
        demo_hair_day_after: "послезавтра",
      };
      state.data.date = dates[action];
      await ctx.reply(
        `🕐 *${state.data.date.charAt(0).toUpperCase() + state.data.date.slice(1)}*\n\nСвободное время:`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [
                Keyboard.button.callback("10:00", "demo_hair_time_10"),
                Keyboard.button.callback("12:00", "demo_hair_time_12"),
              ],
              [
                Keyboard.button.callback("14:00", "demo_hair_time_14"),
                Keyboard.button.callback("16:00", "demo_hair_time_16"),
              ],
              [
                Keyboard.button.callback("18:00", "demo_hair_time_18"),
                Keyboard.button.callback("20:00", "demo_hair_time_20"),
              ],
              [Keyboard.button.callback("⬅️ Назад", "demo_hair")],
            ]),
          ],
        },
      );
      break;
    }
    case "demo_hair_time_10":
    case "demo_hair_time_12":
    case "demo_hair_time_14":
    case "demo_hair_time_16":
    case "demo_hair_time_18":
    case "demo_hair_time_20": {
      state.data.time = action.replace("demo_hair_time_", "") + ":00";
      await ctx.reply(
        `✅ *Подтверждение записи*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Детали:*\n• Услуга: ${state.data.service}\n• Мастер: ${state.data.master}\n• Дата: ${state.data.date}\n• Время: ${state.data.time}\n• Стоимость: ${state.data.price}\n\nВсё верно?`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [
                Keyboard.button.callback(
                  "✅ Да, записываем!",
                  "demo_hair_confirm",
                ),
              ],
              [Keyboard.button.callback("❌ Отмена", "demo_hair")],
            ]),
          ],
        },
      );
      break;
    }
    case "demo_hair_confirm":
      await ctx.reply(
        `🎉 *Готово! Вы записаны!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЖдём вас ${state.data.date} в ${state.data.time}.\n\n📱 За час до визита пришлём напоминание.\n\nЕсли нужно отменить или перенести запись — просто напишите мне!`,
        {
          attachments: [
            Keyboard.inlineKeyboard([
              [Keyboard.button.callback("🏁 Завершить демо", "demo_end")],
            ]),
          ],
        },
      );
      trackEvent("demo_hair_complete", userId, state.data);
      break;
  }
  userStates.set(userId, state);
}

module.exports = { startDemoHair, handleDemoHairStep };
