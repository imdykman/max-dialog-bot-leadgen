const { Keyboard } = require('@maxhub/max-bot-api');
const { trackEvent } = require('../services/analytics');

// ========== ПРИВЕТСТВИЕ ==========
async function sendWelcome(ctx, userId, userStates) {
  // Сбрасываем состояние пользователя
  if (userId) userStates.delete(userId);
  
  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.callback('📚 Посмотреть примеры', 'demo_menu')],
    [Keyboard.button.callback('💼 Заказать бота', 'order_start')],
    [Keyboard.button.callback('💰 Узнать цены', 'pricing')],
    [Keyboard.button.callback('🆘 Поддержка', 'support')]
  ]);
  
  await ctx.reply(
    `👋 *Привет! Я бот, который продаёт... ботов!*\n\nПокажу, как они работают, помогу выбрать решение для вашего бизнеса или сразу рассчитаю стоимость.\n\nВыберите, что вас интересует:`,
    { attachments: [keyboard] }
  );
  
  if (userId) trackEvent('start', userId);
}

// ========== ЦЕНЫ ==========
async function handlePricing(ctx, userId) {
  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.callback('💼 Заказать бота', 'order_start')],
    [Keyboard.button.callback('⬅️ Назад', 'start')]
  ]);
  
  await ctx.reply(
    `💰 *Тарифы на разработку ботов*\n\n` +
    `🟢 *Старт* — от 15 000 ₽\n• Простой бот с FAQ\n• Приём заявок\n• Базовая интеграция\n\n` +
    `🟡 *Бизнес* — от 50 000 ₽\n• Запись/бронирование\n• Приём заказов\n• Интеграция с CRM\n• YandexGPT для умных ответов\n\n` +
    `🔴 *Премиум* — от 150 000 ₽\n• Индивидуальная разработка\n• Любые интеграции\n• Выделенный менеджер\n• Приоритетная поддержка\n\n` +
    `💡 *Обслуживание* — от 5 000 ₽/мес\n• Хостинг и техподдержка 24/7\n• Обновления и доработки\n• Аналитика и отчёты\n\n` +
    `🎁 *Акция*: при заказе до конца месяца — настройка YandexGPT в подарок!`,
    { attachments: [keyboard] }
  );
  
  if (userId) trackEvent('pricing', userId);
}

// ========== ПОДДЕРЖКА ==========
async function handleSupport(ctx, userId) {
  await ctx.reply(
    `🆘 *Поддержка*\n\nЭтот раздел будет добавлен в следующем обновлении.\n\nА пока вы можете:\n• Написать нам в Telegram: @your_username\n• Позвонить: +7 (XXX) XXX-XX-XX\n• Email: support@yourcompany.ru`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('⬅️ Назад', 'start')]
      ])]
    }
  );
  
  if (userId) trackEvent('support', userId);
}

module.exports = { sendWelcome, handlePricing };