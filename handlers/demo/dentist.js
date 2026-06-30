const { Keyboard } = require('@maxhub/max-bot-api');
const { trackEvent } = require('../../services/analytics');

// ========== СПРАВОЧНИК СПЕЦИАЛИСТОВ ==========
const DOCTORS = {
  // Терапевты
  'demo_dentist_doc_ivanov': { name: 'Dr. Иванов', specialty: 'Терапевт', experience: '12 лет' },
  'demo_dentist_doc_petrova': { name: 'Dr. Петрова', specialty: 'Терапевт', experience: '8 лет' },
  // Ортопеды
  'demo_dentist_doc_sidorov': { name: 'Dr. Сидоров', specialty: 'Ортопед', experience: '15 лет' },
  'demo_dentist_doc_kuznetsova': { name: 'Dr. Кузнецова', specialty: 'Ортопед', experience: '10 лет' },
  // Гигиенисты
  'demo_dentist_doc_smirnova': { name: 'Dr. Смирнова', specialty: 'Гигиенист', experience: '6 лет' },
  'demo_dentist_doc_volkov': { name: 'Dr. Волков', specialty: 'Гигиенист', experience: '4 года' }
};

// ========== СООТВЕТСТВИЕ УСЛУГА → СПЕЦИАЛИСТЫ ==========
const SERVICE_DOCTORS = {
  'demo_dentist_checkup': [
    'demo_dentist_doc_ivanov',
    'demo_dentist_doc_petrova',
    'demo_dentist_doc_sidorov',
    'demo_dentist_doc_kuznetsova'
  ],
  'demo_dentist_treatment': [
    'demo_dentist_doc_ivanov',
    'demo_dentist_doc_petrova'
  ],
  'demo_dentist_cleaning': [
    'demo_dentist_doc_smirnova',
    'demo_dentist_doc_volkov'
  ],
  'demo_dentist_prosthetics': [
    'demo_dentist_doc_sidorov',
    'demo_dentist_doc_kuznetsova'
  ]
};

async function startDemoDentist(ctx, userId, userStates) {
  userStates.set(userId, { mode: 'demo', demo_type: 'dentist', step: 'service_choice' });
  await ctx.reply(`🦷 *Демо: Бот для стоматологии*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЗдравствуйте! Я помощник стоматологии "Здоровая улыбка". 🦷\n\nПомогу записаться к врачу, подберу нужного специалиста и запишу на удобное время.\n\nЧто вас беспокоит?`, {
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
    // ========== ВЫБОР УСЛУГИ ==========
    case 'demo_dentist_checkup':
    case 'demo_dentist_treatment':
    case 'demo_dentist_cleaning':
    case 'demo_dentist_prosthetics': {
      const services = {
        'demo_dentist_checkup': { name: 'Осмотр / Консультация', price: '500 ₽', emoji: '🔍' },
        'demo_dentist_treatment': { name: 'Лечение зубов', price: 'от 2500 ₽', emoji: '🦷' },
        'demo_dentist_cleaning': { name: 'Чистка / Отбеливание', price: 'от 3000 ₽', emoji: '✨' },
        'demo_dentist_prosthetics': { name: 'Протезирование', price: 'от 15 000 ₽', emoji: '👑' }
      };
      const s = services[action];
      state.data = { 
        service: s.name, 
        price: s.price,
        service_key: action  // ← сохраняем ключ услуги для выбора врачей
      };
      
      // Получаем список подходящих специалистов
      const doctorKeys = SERVICE_DOCTORS[action];
      const doctorButtons = doctorKeys.map(key => {
        const doc = DOCTORS[key];
        return [Keyboard.button.callback(`${doc.name} (${doc.specialty})`, key)];
      });
      doctorButtons.push([Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]);
      
      await ctx.reply(`${s.emoji} *${s.name}*\n\nСтоимость: ${s.price}\n\n💡 *Подберём подходящего специалиста*\n\nВыберите врача:`, {
        attachments: [Keyboard.inlineKeyboard(doctorButtons)]
      });
      break;
    }

    // ========== ВЫБОР ВРАЧА ==========
    case 'demo_dentist_doc_ivanov':
    case 'demo_dentist_doc_petrova':
    case 'demo_dentist_doc_sidorov':
    case 'demo_dentist_doc_kuznetsova':
    case 'demo_dentist_doc_smirnova':
    case 'demo_dentist_doc_volkov': {
      const doc = DOCTORS[action];
      state.data.doctor = doc.name;
      state.data.doctor_specialty = doc.specialty;
      state.data.doctor_experience = doc.experience;
      await ctx.reply(`👨‍⚕️ *${doc.name}*\n${doc.specialty} • Стаж: ${doc.experience}\n\nКогда вам удобно прийти?`, {
        attachments: [Keyboard.inlineKeyboard([
          [Keyboard.button.callback('📅 Сегодня', 'demo_dentist_today')],
          [Keyboard.button.callback('📅 Завтра', 'demo_dentist_tomorrow')],
          [Keyboard.button.callback('📅 Послезавтра', 'demo_dentist_day_after')],
          [Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]
        ])]
      });
      break;
    }

    // ========== ВЫБОР ДАТЫ ==========
    case 'demo_dentist_today':
    case 'demo_dentist_tomorrow':
    case 'demo_dentist_day_after': {
      const dates = {
        'demo_dentist_today': 'сегодня',
        'demo_dentist_tomorrow': 'завтра',
        'demo_dentist_day_after': 'послезавтра'
      };
      state.data.date = dates[action];
      await ctx.reply(`🕐 *${state.data.date.charAt(0).toUpperCase() + state.data.date.slice(1)}*\n\nСвободное время:`, {
        attachments: [Keyboard.inlineKeyboard([
          [Keyboard.button.callback('09:00', 'demo_dentist_time_09'), Keyboard.button.callback('11:00', 'demo_dentist_time_11')],
          [Keyboard.button.callback('13:00', 'demo_dentist_time_13'), Keyboard.button.callback('15:00', 'demo_dentist_time_15')],
          [Keyboard.button.callback('17:00', 'demo_dentist_time_17'), Keyboard.button.callback('19:00', 'demo_dentist_time_19')],
          [Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]
        ])]
      });
      break;
    }

    // ========== ВЫБОР ВРЕМЕНИ ==========
    case 'demo_dentist_time_09':
    case 'demo_dentist_time_11':
    case 'demo_dentist_time_13':
    case 'demo_dentist_time_15':
    case 'demo_dentist_time_17':
    case 'demo_dentist_time_19': {
      state.data.time = action.replace('demo_dentist_time_', '') + ':00';
      await ctx.reply(`✅ *Подтверждение записи*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Детали:*\n• Услуга: ${state.data.service}\n• Врач: ${state.data.doctor} (${state.data.doctor_specialty})\n• Дата: ${state.data.date}\n• Время: ${state.data.time}\n• Стоимость: ${state.data.price}\n\nВсё верно?`, {
        attachments: [Keyboard.inlineKeyboard([
          [Keyboard.button.callback('✅ Да, записываем!', 'demo_dentist_confirm')],
          [Keyboard.button.callback('❌ Отмена', 'demo_dentist')]
        ])]
      });
      break;
    }

    // ========== ПОДТВЕРЖДЕНИЕ ==========
    case 'demo_dentist_confirm':
      await ctx.reply(`🎉 *Готово! Вы записаны!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЖдём вас ${state.data.date} в ${state.data.time}.\n\n👨‍⚕️ Ваш врач: ${state.data.doctor} (${state.data.doctor_specialty})\n\n📋 *Что взять с собой:*\n• Паспорт\n• Полис ОМС (при наличии)\n• Результаты предыдущих обследований\n\n📱 За день до визита пришлём напоминание.\n\nЕсли нужно отменить или перенести запись — просто напишите мне!`, {
        attachments: [Keyboard.inlineKeyboard([[Keyboard.button.callback('🏁 Завершить демо', 'demo_end')]])]
      });
      trackEvent('demo_dentist_complete', userId, state.data);
      break;
  }

  userStates.set(userId, state);
}

module.exports = { startDemoDentist, handleDemoDentistStep };