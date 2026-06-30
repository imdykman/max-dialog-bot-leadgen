const { Keyboard } = require('@maxhub/max-bot-api');
const { trackEvent } = require('../../services/analytics');

async function startDemoDentist(ctx, userId, userStates) {
  userStates.set(userId, { mode: 'demo', demo_type: 'dentist', step: 'service_choice' });
  await ctx.reply(`🦷 *Демо: Бот для стоматологии*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЗдравствуйте! Я помощник стоматологии "Здоровая улыбка". 🦷\n\nПомогу записаться к врачу, расскажу об услугах и ценах.\n\nЧто вас беспокоит?`, {
    attachments: [Keyboard.inlineKeyboard([
      [Keyboard.button.callback('🔍 Осмотр / Консультация', 'demo_dentist_checkup')],
      [Keyboard.button.callback('🦷 Лечение зубов', 'demo_dentist_treatment')],
      [Keyboard.button.callback('✨ Чистка / Отбеливание', 'demo_dentist_cleaning')],
      [Keyboard.button.callback('👑 Протезирование', 'demo_dentist_prosthetics')],
      [Keyboard.button.callback('⬅️ Назад к списку', 'demo_menu')]
    ])]
  });
  trackEvent('demo_dentist_start', userId);
}

async function handleDemoDentistStep(ctx, userId, action, userStates) {
  const state = userStates.get(userId);
  if (!state || state.mode !== 'demo' || state.demo_type !== 'dentist') return;
  if (!state.data) state.data = {};

  switch (action) {
    case 'demo_dentist_checkup':
      state.data = { service: 'Осмотр / Консультация', price: '500 ₽' };
      await ctx.reply(`🔍 *Осмотр и консультация*\n\nСтоимость: 500 ₽\n\nВыберите врача:`, { attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('👨‍⚕️ Dr. Иванов (терапевт)', 'demo_dentist_doc_ivanov')],
        [Keyboard.button.callback('👩‍⚕️ Dr. Петрова (терапевт)', 'demo_dentist_doc_petrova')],
        [Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]
      ])]}); break;
    case 'demo_dentist_doc_ivanov': case 'demo_dentist_doc_petrova': {
      const doctors = { 'demo_dentist_doc_ivanov': 'Dr. Иванов', 'demo_dentist_doc_petrova': 'Dr. Петрова' };
      state.data.doctor = doctors[action];
      await ctx.reply(`👨‍⚕️ *Врач: ${state.data.doctor}*\n\nКогда удобно прийти?`, { attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('📅 Сегодня', 'demo_dentist_today')],
        [Keyboard.button.callback('📅 Завтра', 'demo_dentist_tomorrow')],
        [Keyboard.button.callback('📅 На этой неделе', 'demo_dentist_week')],
        [Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]
      ])]}); break;
    }
    case 'demo_dentist_today': case 'demo_dentist_tomorrow': case 'demo_dentist_week': {
      const dates = { 'demo_dentist_today': 'сегодня', 'demo_dentist_tomorrow': 'завтра', 'demo_dentist_week': 'на этой неделе' };
      state.data.date = dates[action];
      await ctx.reply(`✅ *Запись оформлена!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Детали:*\n• Услуга: ${state.data.service}\n• Врач: ${state.data.doctor}\n• Дата: ${state.data.date}\n• Стоимость: ${state.data.price}\n\n📱 Пришлём напоминание за день до визита.\n\n❓ Есть вопросы? Напишите мне!`, { attachments: [Keyboard.inlineKeyboard([[Keyboard.button.callback('🏁 Завершить демо', 'demo_end')]])]});
      trackEvent('demo_dentist_complete', userId, state.data); break;
    }
  }
  userStates.set(userId, state);
}

module.exports = { startDemoDentist, handleDemoDentistStep };