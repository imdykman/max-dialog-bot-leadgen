const { Keyboard } = require('@maxhub/max-bot-api');
const { trackEvent } = require('../../services/analytics');
const { handleDemoHairStep, startDemoHair } = require('./hair');
const { handleDemoDeliveryStep, startDemoDelivery } = require('./delivery');
const { handleDemoDentistStep, startDemoDentist } = require('./dentist');

async function handleDemoMenu(ctx, userId) {
  await ctx.reply(`📚 *Интерактивные демо-режимы*\n\nПопробуйте бота в действии! Вы будете играть роль клиента, а я покажу, как работает бот для бизнеса.\n\nВыберите сферу:`, {
    attachments: [Keyboard.inlineKeyboard([
      [Keyboard.button.callback('💇 Запись в парикмахерскую', 'demo_hair')],
      [Keyboard.button.callback('🍕 Доставка еды', 'demo_delivery')],
      [Keyboard.button.callback('🦷 Запись к стоматологу', 'demo_dentist')],
      [Keyboard.button.callback('🏢 Другое / Мой вариант', 'demo_custom')],
      [Keyboard.button.callback('⬅️ Назад', 'start')]
    ])]
  });
  if (userId) trackEvent('demo_menu', userId);
}

async function startDemoCustom(ctx) {
  await ctx.reply(`🏢 *Другие варианты ботов*\n\nМы разрабатываем ботов для любых задач:\n\n• 🏪 Интернет-магазины\n• 🏨 Отели и гостиницы\n• 🎓 Онлайн-школы\n• 🚗 Автосервисы\n• 🏋️ Фитнес-клубы\n• 📊 CRM-боты\n• 🤖 И многое другое!\n\nРасскажите о вашем бизнесе, и мы предложим решение:`, {
    attachments: [Keyboard.inlineKeyboard([
      [Keyboard.button.callback('💼 Заказать бота', 'order_start')],
      [Keyboard.button.callback('⬅️ Назад', 'demo_menu')]
    ])]
  });
}

async function endDemo(ctx, userId, userStates) {
  const state = userStates.get(userId);
  const demoType = state?.demo_type || 'unknown';
  await ctx.reply(`✨ *Вот так работает бот для бизнеса!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЭтот бот может:\n\n✅ Работать 24/7 без выходных\n✅ Принимать заявки и записи\n✅ Собирать имя и телефон клиента\n✅ Валидировать номера телефонов\n✅ Отправлять заявки на email менеджеру\n✅ Интегрироваться с вашей CRM\n\n🚀 *Хотите такого же бота для своего бизнеса?*\n\nНажмите кнопку ниже, и я покажу, как бот собирает контакты клиентов!`, {
    attachments: [Keyboard.inlineKeyboard([
      [Keyboard.button.callback('💼 Хочу такого бота!', 'order_start')],
      [Keyboard.button.callback('📚 Посмотреть другие примеры', 'demo_menu')],
      [Keyboard.button.callback('🏠 Главное меню', 'start')]
    ])]
  });
  trackEvent(`demo_${demoType}_end`, userId);
  userStates.delete(userId);
}

async function handleDemoAction(ctx, userId, data, userStates) {
  if (data === 'demo_menu') return handleDemoMenu(ctx, userId);
  if (data === 'demo_hair') return startDemoHair(ctx, userId, userStates);
  if (data === 'demo_delivery') return startDemoDelivery(ctx, userId, userStates);
  if (data === 'demo_dentist') return startDemoDentist(ctx, userId, userStates);
  if (data === 'demo_custom') return startDemoCustom(ctx);
  if (data === 'demo_end') return endDemo(ctx, userId, userStates);

  if (data.startsWith('demo_hair_')) return handleDemoHairStep(ctx, userId, data, userStates);
  if (data.startsWith('demo_delivery_')) return handleDemoDeliveryStep(ctx, userId, data, userStates);
  if (data.startsWith('demo_dentist_')) return handleDemoDentistStep(ctx, userId, data, userStates);
}

async function handleDemoTextInput(ctx, userId, text, userStates) {
  const state = userStates.get(userId);
  if (!state || state.mode !== 'demo' || state.demo_type !== 'delivery' || state.step !== 'address') return false;
  state.data.address = text;
  state.step = 'payment';
  await ctx.reply(`📍 Адрес: ${text}\n\n💳 Способ оплаты:`, {
    attachments: [Keyboard.inlineKeyboard([
      [Keyboard.button.callback('💵 Наличные', 'demo_delivery_cash')],
      [Keyboard.button.callback('💳 Карта курьеру', 'demo_delivery_card')],
      [Keyboard.button.callback('📱 Онлайн', 'demo_delivery_online')]
    ])]
  });
  userStates.set(userId, state);
  return true;
}

module.exports = { handleDemoMenu, handleDemoAction, handleDemoTextInput };