// ========== ПОДКЛЮЧЕНИЕ БИБЛИОТЕК ==========
const fs = require('fs');
const path = require('path');
const { Bot, Keyboard } = require('@maxhub/max-bot-api');
require('dotenv').config();

// ========== ТОКЕН БОТА ==========
const BOT_TOKEN = process.env.MAX_BOT_API_TOKEN;
const bot = new Bot(BOT_TOKEN);

// ========== ХРАНИЛИЩЕ СОСТОЯНИЙ ==========
const userStates = new Map();
// ========== УНИВЕРСАЛЬНАЯ ФУНКЦИЯ ПОЛУЧЕНИЯ USERID ==========
function getUserId(ctx) {
  // Для callback-кнопок
  if (ctx.callback?.user?.user_id) {
    return ctx.callback.user.user_id.toString();
  }
  
  // Для текстовых сообщений
  if (ctx.message?.sender?.user_id) {
    return ctx.message.sender.user_id.toString();
  }
  
  return null;
}
// ========== АНАЛИТИКА ==========
const ANALYTICS_FILE = path.join(process.cwd(), 'analytics.json');

function trackEvent(event, userId, extra = {}) {
  const record = {
    event,
    userId,
    timestamp: new Date().toISOString(),
    ...extra
  };
  console.log(`[Analytics] ${event} | User: ${userId}`);
  
  try {
    let data = [];
    if (fs.existsSync(ANALYTICS_FILE)) {
      data = JSON.parse(fs.readFileSync(ANALYTICS_FILE, 'utf-8'));
    }
    data.push(record);
    fs.writeFileSync(ANALYTICS_FILE, JSON.stringify(data, null, 2));
  } catch (e) {
    console.error('Ошибка записи аналитики:', e);
  }
}

// ========== ПРИВЕТСТВИЕ ==========
async function sendWelcome(ctx) {
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
}

// ========== ЦЕНЫ ==========
async function handlePricing(ctx) {
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
}

// ========== ДЕМО-МЕНЮ ==========
async function handleDemoMenu(ctx) {
  const keyboard = Keyboard.inlineKeyboard([
    [Keyboard.button.callback('💇 Запись в парикмахерскую', 'demo_hair')],
    [Keyboard.button.callback('🍕 Доставка еды', 'demo_delivery')],
    [Keyboard.button.callback('🦷 Запись к стоматологу', 'demo_dentist')],
    [Keyboard.button.callback('🏢 Другое / Мой вариант', 'demo_custom')],
    [Keyboard.button.callback('⬅️ Назад', 'start')]
  ]);
  
  await ctx.reply(
    `📚 *Интерактивные демо-режимы*\n\nПопробуйте бота в действии! Вы будете играть роль клиента, а я покажу, как работает бот для бизнеса.\n\nВыберите сферу:`,
    { attachments: [keyboard] }
  );
}

// ========== ДЕМО: ПАРИКМАХЕРСКАЯ ==========
async function startDemoHair(ctx, userId) {
  userStates.set(userId, { 
    mode: 'demo', 
    demo_type: 'hair',
    step: 'service_choice'
  });
  
  await ctx.reply(
    `💇 *Демо: Бот для парикмахерской*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЗдравствуйте! Я виртуальный администратор салона красоты "Стиль". \n\nПомогу записаться к мастеру онлайн — быстро и без звонков! 💚\n\nЧто вас интересует?`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('✂️ Стрижка', 'demo_hair_haircut')],
        [Keyboard.button.callback('🎨 Окрашивание', 'demo_hair_color')],
        [Keyboard.button.callback('💅 Маникюр', 'demo_hair_nails')],
        [Keyboard.button.callback('💇‍♀️ Укладка', 'demo_hair_styling')],
        [Keyboard.button.callback('⬅️ Назад к списку', 'demo_menu')]
      ])]
    }
  );
}

async function handleDemoHairStep(ctx, userId, action) {
  const state = userStates.get(userId);
  if (!state || state.mode !== 'demo' || state.demo_type !== 'hair') return;
  
  if (!state.data) state.data = {};
  
  switch (action) {
    case 'demo_hair_haircut':
      state.data = { service: 'Стрижка', price: 'от 1500 ₽' };
      await ctx.reply(
        `✂️ *Стрижка*\n\nОтличный выбор! Стоимость — от 1500 ₽.\n\nК какому мастеру хотите записаться?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('👩‍🦰 Анна (стаж 5 лет)', 'demo_hair_master_anna')],
            [Keyboard.button.callback('👨‍🦱 Дмитрий (стаж 8 лет)', 'demo_hair_master_dima')],
            [Keyboard.button.callback('👩 Елена (стаж 3 года)', 'demo_hair_master_elena')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_hair')]
          ])]
        }
      );
      break;
      
    case 'demo_hair_master_anna':
    case 'demo_hair_master_dima':
    case 'demo_hair_master_elena':
      const masters = {
        'demo_hair_master_anna': 'Анна',
        'demo_hair_master_dima': 'Дмитрий',
        'demo_hair_master_elena': 'Елена'
      };
      state.data.master = masters[action];
      await ctx.reply(
        `👤 *Мастер: ${state.data.master}*\n\nОтлично! Когда вам удобно прийти?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('📅 Сегодня', 'demo_hair_today')],
            [Keyboard.button.callback('📅 Завтра', 'demo_hair_tomorrow')],
            [Keyboard.button.callback('📅 Послезавтра', 'demo_hair_day_after')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_hair')]
          ])]
        }
      );
      break;
      
    case 'demo_hair_today':
    case 'demo_hair_tomorrow':
    case 'demo_hair_day_after':
      const dates = {
        'demo_hair_today': 'сегодня',
        'demo_hair_tomorrow': 'завтра',
        'demo_hair_day_after': 'послезавтра'
      };
      state.data.date = dates[action];
      await ctx.reply(
        `🕐 *${state.data.date.charAt(0).toUpperCase() + state.data.date.slice(1)}*\n\nСвободное время:`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('10:00', 'demo_hair_time_10'), Keyboard.button.callback('12:00', 'demo_hair_time_12')],
            [Keyboard.button.callback('14:00', 'demo_hair_time_14'), Keyboard.button.callback('16:00', 'demo_hair_time_16')],
            [Keyboard.button.callback('18:00', 'demo_hair_time_18'), Keyboard.button.callback('20:00', 'demo_hair_time_20')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_hair')]
          ])]
        }
      );
      break;
      
    case 'demo_hair_time_10':
    case 'demo_hair_time_12':
    case 'demo_hair_time_14':
    case 'demo_hair_time_16':
    case 'demo_hair_time_18':
    case 'demo_hair_time_20':
      const time = action.replace('demo_hair_time_', '') + ':00';
      state.data.time = time;
      await ctx.reply(
        `✅ *Подтверждение записи*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Детали:*\n• Услуга: ${state.data.service}\n• Мастер: ${state.data.master}\n• Дата: ${state.data.date}\n• Время: ${state.data.time}\n• Стоимость: ${state.data.price}\n\nВсё верно?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('✅ Да, записываем!', 'demo_hair_confirm')],
            [Keyboard.button.callback('❌ Отмена', 'demo_hair')]
          ])]
        }
      );
      break;
      
    case 'demo_hair_confirm':
      await ctx.reply(
        `🎉 *Готово! Вы записаны!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЖдём вас ${state.data.date} в ${state.data.time}.\n\n📱 За час до визита пришлём напоминание.\n\nЕсли нужно отменить или перенести запись — просто напишите мне!`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('🏁 Завершить демо', 'demo_end')]
          ])]
        }
      );
      trackEvent('demo_hair_complete', userId, state.data);
      break;
  }
  
  userStates.set(userId, state);
}

// ========== ДЕМО: ДОСТАВКА ==========
async function startDemoDelivery(ctx, userId) {
  userStates.set(userId, { 
    mode: 'demo', 
    demo_type: 'delivery',
    step: 'menu_choice',
    data: { items: [], total: 0 }
  });
  
  await ctx.reply(
    `🍕 *Демо: Бот для доставки еды*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nПривет! Я бот пиццерии "Вкусно и Точка". 🍕\n\nПомогу выбрать блюда, оформить заказ и доставить прямо к вашей двери!\n\nЧто хотите заказать?`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('🍕 Пицца', 'demo_delivery_pizza')],
        [Keyboard.button.callback('🍔 Бургеры', 'demo_delivery_burgers')],
        [Keyboard.button.callback('🥗 Салаты', 'demo_delivery_salads')],
        [Keyboard.button.callback('🥤 Напитки', 'demo_delivery_drinks')],
        [Keyboard.button.callback('⬅️ Назад к списку', 'demo_menu')]
      ])]
    }
  );
}

async function handleDemoDeliveryStep(ctx, userId, action) {
  const state = userStates.get(userId);
  if (!state || state.mode !== 'demo' || state.demo_type !== 'delivery') return;
  
  if (!state.data) state.data = { items: [], total: 0 };
  
  switch (action) {
    case 'demo_delivery_pizza':
      await ctx.reply(
        `🍕 *Пицца*\n\nВыберите размер:`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('🔸 Маленькая (25 см) — 490₽', 'demo_delivery_pizza_small')],
            [Keyboard.button.callback('🔸 Средняя (30 см) — 690₽', 'demo_delivery_pizza_medium')],
            [Keyboard.button.callback('🔸 Большая (35 см) — 890₽', 'demo_delivery_pizza_large')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_delivery')]
          ])]
        }
      );
      break;
      
    case 'demo_delivery_pizza_small':
    case 'demo_delivery_pizza_medium':
    case 'demo_delivery_pizza_large':
      const sizes = {
        'demo_delivery_pizza_small': { name: 'Маленькая', price: 490 },
        'demo_delivery_pizza_medium': { name: 'Средняя', price: 690 },
        'demo_delivery_pizza_large': { name: 'Большая', price: 890 }
      };
      const size = sizes[action];
      state.data.items.push(`Пицца ${size.name}`);
      state.data.total += size.price;
      await showDeliveryCart(ctx, state);
      break;
      
    case 'demo_delivery_burgers':
      await ctx.reply(
        `🍔 *Бургеры*`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('🍔 Классический — 350₽', 'demo_delivery_burger_classic')],
            [Keyboard.button.callback('🍔 Чизбургер — 390₽', 'demo_delivery_burger_cheese')],
            [Keyboard.button.callback('🍔 Двойной — 490₽', 'demo_delivery_burger_double')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_delivery')]
          ])]
        }
      );
      break;
      
    case 'demo_delivery_burger_classic':
    case 'demo_delivery_burger_cheese':
    case 'demo_delivery_burger_double':
      const burgers = {
        'demo_delivery_burger_classic': { name: 'Классический', price: 350 },
        'demo_delivery_burger_cheese': { name: 'Чизбургер', price: 390 },
        'demo_delivery_burger_double': { name: 'Двойной', price: 490 }
      };
      const burger = burgers[action];
      state.data.items.push(`Бургер ${burger.name}`);
      state.data.total += burger.price;
      await showDeliveryCart(ctx, state);
      break;
      
    case 'demo_delivery_checkout':
      state.step = 'address';
      await ctx.reply(
        `📍 *Оформление заказа*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🛒 *Ваш заказ:*\n${state.data.items.map(item => `• ${item}`).join('\n')}\n\n💰 *Итого: ${state.data.total}₽*\n\n📝 Напишите адрес доставки текстом:`
      );
      break;
      
    case 'demo_delivery_cash':
    case 'demo_delivery_card':
    case 'demo_delivery_online':
      const payments = {
        'demo_delivery_cash': 'Наличные',
        'demo_delivery_card': 'Карта курьеру',
        'demo_delivery_online': 'Онлайн'
      };
      state.data.payment = payments[action];
      await ctx.reply(
        `🎉 *Заказ принят!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🛒 ${state.data.items.join(', ')}\n📍 ${state.data.address}\n💳 ${state.data.payment}\n💰 ${state.data.total}₽\n\n⏱ Примерное время доставки: 40-60 минут.\n\n📱 Курьер свяжется с вами перед выездом.\n\nСпасибо за заказ! 😊`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('🏁 Завершить демо', 'demo_end')]
          ])]
        }
      );
      trackEvent('demo_delivery_complete', userId, state.data);
      break;
  }
  
  userStates.set(userId, state);
}

async function showDeliveryCart(ctx, state) {
  await ctx.reply(
    `✅ Добавлено в корзину!\n\n💰 *Итого: ${state.data.total}₽*\n\nЧто-то ещё?`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('🍕 Ещё пиццу', 'demo_delivery_pizza')],
        [Keyboard.button.callback('🍔 Бургеры', 'demo_delivery_burgers')],
        [Keyboard.button.callback('🛒 Оформить заказ', 'demo_delivery_checkout')],
        [Keyboard.button.callback('⬅️ Назад', 'demo_delivery')]
      ])]
    }
  );
}

// ========== ДЕМО: СТОМАТОЛОГ ==========
async function startDemoDentist(ctx, userId) {
  userStates.set(userId, { 
    mode: 'demo', 
    demo_type: 'dentist',
    step: 'service_choice'
  });
  
  await ctx.reply(
    `🦷 *Демо: Бот для стоматологии*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЗдравствуйте! Я помощник стоматологии "Здоровая улыбка". 🦷\n\nПомогу записаться к врачу, расскажу об услугах и ценах.\n\nЧто вас беспокоит?`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('🔍 Осмотр / Консультация', 'demo_dentist_checkup')],
        [Keyboard.button.callback('🦷 Лечение зубов', 'demo_dentist_treatment')],
        [Keyboard.button.callback('✨ Чистка / Отбеливание', 'demo_dentist_cleaning')],
        [Keyboard.button.callback('👑 Протезирование', 'demo_dentist_prosthetics')],
        [Keyboard.button.callback('⬅️ Назад к списку', 'demo_menu')]
      ])]
    }
  );
}

async function handleDemoDentistStep(ctx, userId, action) {
  const state = userStates.get(userId);
  if (!state || state.mode !== 'demo' || state.demo_type !== 'dentist') return;
  
  if (!state.data) state.data = {};
  
  switch (action) {
    case 'demo_dentist_checkup':
      state.data = { service: 'Осмотр / Консультация', price: '500 ₽' };
      await ctx.reply(
        `🔍 *Осмотр и консультация*\n\nСтоимость: 500 ₽\n\nВыберите врача:`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('👨‍⚕️ Dr. Иванов (терапевт)', 'demo_dentist_doc_ivanov')],
            [Keyboard.button.callback('👩‍⚕️ Dr. Петрова (терапевт)', 'demo_dentist_doc_petrova')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]
          ])]
        }
      );
      break;
      
    case 'demo_dentist_doc_ivanov':
    case 'demo_dentist_doc_petrova':
      const doctors = {
        'demo_dentist_doc_ivanov': 'Dr. Иванов',
        'demo_dentist_doc_petrova': 'Dr. Петрова'
      };
      state.data.doctor = doctors[action];
      await ctx.reply(
        `👨‍⚕️ *Врач: ${state.data.doctor}*\n\nКогда удобно прийти?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('📅 Сегодня', 'demo_dentist_today')],
            [Keyboard.button.callback('📅 Завтра', 'demo_dentist_tomorrow')],
            [Keyboard.button.callback('📅 На этой неделе', 'demo_dentist_week')],
            [Keyboard.button.callback('⬅️ Назад', 'demo_dentist')]
          ])]
        }
      );
      break;
      
    case 'demo_dentist_today':
    case 'demo_dentist_tomorrow':
    case 'demo_dentist_week':
      const dates = {
        'demo_dentist_today': 'сегодня',
        'demo_dentist_tomorrow': 'завтра',
        'demo_dentist_week': 'на этой неделе'
      };
      state.data.date = dates[action];
      await ctx.reply(
        `✅ *Запись оформлена!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Детали:*\n• Услуга: ${state.data.service}\n• Врач: ${state.data.doctor}\n• Дата: ${state.data.date}\n• Стоимость: ${state.data.price}\n\n📱 Пришлём напоминание за день до визита.\n\n❓ Есть вопросы? Напишите мне!`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('🏁 Завершить демо', 'demo_end')]
          ])]
        }
      );
      trackEvent('demo_dentist_complete', userId, state.data);
      break;
  }
  
  userStates.set(userId, state);
}

// ========== ДЕМО: ДРУГОЕ ==========
async function startDemoCustom(ctx) {
  await ctx.reply(
    `🏢 *Другие варианты ботов*\n\nМы разрабатываем ботов для любых задач:\n\n• 🏪 Интернет-магазины\n• 🏨 Отели и гостиницы\n• 🎓 Онлайн-школы\n• 🚗 Автосервисы\n• 🏋️ Фитнес-клубы\n• 📊 CRM-боты\n• 🤖 И многое другое!\n\nРасскажите о вашем бизнесе, и мы предложим решение:`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('💼 Заказать бота', 'order_start')],
        [Keyboard.button.callback('⬅️ Назад', 'demo_menu')]
      ])]
    }
  );
}

// ========== ЗАВЕРШЕНИЕ ДЕМО ==========
async function endDemo(ctx, userId) {
  const state = userStates.get(userId);
  const demoType = state?.demo_type || 'unknown';
  
  await ctx.reply(
    `✨ *Вот так работает бот для бизнеса!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nЭтот бот может:\n\n✅ Работать 24/7 без выходных\n✅ Принимать заявки и записи\n✅ Собирать базу клиентов\n✅ Напоминать о визитах\n✅ Интегрироваться с вашей CRM\n✅ Отправлять уведомления менеджеру\n\n🚀 *Хотите такого же бота для своего бизнеса?*\n\nНажмите кнопку ниже, и я рассчитаю стоимость!`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('💼 Хочу такого бота!', 'order_start')],
        [Keyboard.button.callback('📚 Посмотреть другие примеры', 'demo_menu')],
        [Keyboard.button.callback('🏠 Главное меню', 'start')]
      ])]
    }
  );
  
  trackEvent(`demo_${demoType}_end`, userId);
  userStates.delete(userId);
}

// ========== ЗАКАЗ БОТА: КВАЛИФИКАЦИЯ ==========
const ORDER_STEPS = {
  BUSINESS_TYPE: 'business_type',
  BUSINESS_SIZE: 'business_size',
  FEATURES: 'features',
  CLIENTS_COUNT: 'clients_count',
  NAME: 'name',
  CONTACT: 'contact',
  CALL_TIME: 'call_time',
  DONE: 'done'
};

async function handleOrderStart(ctx, userId) {
  userStates.set(userId, { 
    mode: 'order', 
    step: ORDER_STEPS.BUSINESS_TYPE,
    data: {}
  });
  
  await ctx.reply(
    `💼 *Заказать бота*\n\nОтлично! Давайте подберём идеальное решение для вашего бизнеса. 🎯\n\nСначала расскажите о вашем бизнесе:`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('💇 Красота (салоны, барбершопы)', 'order_beauty')],
        [Keyboard.button.callback('🍕 Доставка / Рестораны', 'order_food')],
        [Keyboard.button.callback('🏥 Медицина / Стоматология', 'order_med')],
        [Keyboard.button.callback('🏗️ Услуги / Сервис', 'order_service')],
        [Keyboard.button.callback('🛍️ Торговля', 'order_retail')],
        [Keyboard.button.callback('🤔 Другое / Не знаю', 'order_other')]
      ])]
    }
  );
  
  trackEvent('order_start', userId);
}

async function handleOrderStep(ctx, userId, data) {
  console.log(`\n📝 HANDLE_ORDER_STEP | userId: ${userId} | data: "${data}"`);
  
  const state = userStates.get(userId);
  console.log(`📊 Current state:`, state ? `mode=${state.mode}, step=${state.step}` : 'NO STATE');
  
  if (!state || state.mode !== 'order') {
    console.log(`❌ State not found or mode !== 'order', returning`);
    return;
  }
  
  console.log(`✅ Processing step: ${state.step}`);
  
  switch (state.step) {
    case ORDER_STEPS.BUSINESS_TYPE:
      state.data.business_type = data;
      state.step = ORDER_STEPS.BUSINESS_SIZE;
      await ctx.reply(
        `Какой у вас масштаб?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('1 точка', 'size_1')],
            [Keyboard.button.callback('2-5 точек', 'size_2_5')],
            [Keyboard.button.callback('Больше 5', 'size_5+')],
            [Keyboard.button.callback('Пока нет, только запускаюсь', 'size_0')]
          ])]
        }
      );
      break;
      
    case ORDER_STEPS.BUSINESS_SIZE:
      state.data.business_size = data;
      state.step = ORDER_STEPS.FEATURES;
      await ctx.reply(
        `Что должен делать бот? (можно несколько)`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('📅 Запись / Бронирование', 'feat_booking')],
            [Keyboard.button.callback('🛒 Приём заказов', 'feat_orders')],
            [Keyboard.button.callback('❓ Ответы на вопросы', 'feat_faq')],
            [Keyboard.button.callback('📢 Рассылки клиентам', 'feat_broadcast')],
            [Keyboard.button.callback('✨ Всё вместе', 'feat_all')]
          ])]
        }
      );
      break;
      
    case ORDER_STEPS.FEATURES:
      state.data.features = data;
      state.step = ORDER_STEPS.CLIENTS_COUNT;
      await ctx.reply(
        `Примерное количество клиентов в месяц?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('До 50', 'clients_50')],
            [Keyboard.button.callback('50-200', 'clients_200')],
            [Keyboard.button.callback('200-500', 'clients_500')],
            [Keyboard.button.callback('Больше 500', 'clients_500+')],
            [Keyboard.button.callback('Не знаю', 'clients_unknown')]
          ])]
        }
      );
      break;
      
    case ORDER_STEPS.CLIENTS_COUNT:
      state.data.clients_count = data;
      state.step = ORDER_STEPS.NAME;
      await ctx.reply(`Отлично! Как к вам обращаться? 👤`);
      break;
      
    case ORDER_STEPS.NAME:
      state.data.name = data;
      state.step = ORDER_STEPS.CONTACT;
      await ctx.reply(`Отлично, ${data}! 📱\n\nОставьте телефон или @username для связи:`);
      break;
      
    case ORDER_STEPS.CONTACT:
      state.data.contact = data;
      state.step = ORDER_STEPS.CALL_TIME;
      await ctx.reply(
        `Когда вам удобно принять звонок?`,
        {
          attachments: [Keyboard.inlineKeyboard([
            [Keyboard.button.callback('Утром (9-12)', 'time_morning')],
            [Keyboard.button.callback('Днём (12-17)', 'time_day')],
            [Keyboard.button.callback('Вечером (17-20)', 'time_evening')],
            [Keyboard.button.callback('📞 Позвоните сейчас', 'time_now')]
          ])]
        }
      );
      break;
      
    case ORDER_STEPS.CALL_TIME:
      state.data.call_time = data;
      
      await saveLead(userId, state.data);
      await sendManagerEmail(state.data);
      await showThankYou(ctx, state.data);
      
      trackEvent('order_complete', userId, state.data);
      userStates.delete(userId);
      return; // ← ВАЖНО: return, а не break! Чтобы не сохранять удалённое состояние
  }
  
  // ОДИН РАЗ сохраняем состояние в конце
  console.log(`💾 Saving state | new step: ${state.step}`);
  userStates.set(userId, state);
}

// ========== СОХРАНЕНИЕ ЛИДА ==========
const LEADS_FILE = path.join(process.cwd(), 'leads.json');

async function saveLead(userId, data) {
  const lead = {
    id: Date.now(),
    userId,
    ...data,
    created_at: new Date().toISOString(),
    status: 'new'
  };
  
  try {
    let leads = [];
    if (fs.existsSync(LEADS_FILE)) {
      leads = JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
    }
    leads.push(lead);
    fs.writeFileSync(LEADS_FILE, JSON.stringify(leads, null, 2));
    console.log(`✅ Лид сохранён: ${data.name} (${data.contact})`);
  } catch (e) {
    console.error('Ошибка сохранения лида:', e);
  }
}

// ========== EMAIL МЕНЕДЖЕРУ ==========
async function sendManagerEmail(data) {
  if (!process.env.SMTP_USER || !process.env.MANAGER_EMAIL) {
    console.log('⚠️ Email не настроен, пропускаем отправку');
    return;
  }
  
  try {
    const nodemailer = require('nodemailer');
    
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    await transporter.sendMail({  
      from: process.env.SMTP_USER,
      to: process.env.MANAGER_EMAIL,
      subject: `🔥 Новый лид: ${data.name}`,
      html: `
        <h2>🔥 Новая заявка на бота!</h2>
        <table style="border-collapse: collapse; width: 100%;">
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Имя:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.name}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Контакт:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.contact}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Сфера:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.business_type}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Масштаб:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.business_size}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Функции:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.features}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Клиентов/мес:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.clients_count}</td></tr>
          <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Удобное время:</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${data.call_time}</td></tr>
        </table>
        <p style="margin-top: 20px; color: #666;">Заявка получена: ${new Date().toLocaleString('ru-RU')}</p>
      `
    });
    
    console.log(`✅ Email отправлен менеджеру: ${process.env.MANAGER_EMAIL}`);
  } catch (e) {
    console.error('Ошибка отправки email:', e);
  }
}

// ========== ФИНАЛЬНЫЙ ЭКРАН ==========
async function showThankYou(ctx, data) {
  await ctx.reply(
    `✅ *Заявка принята!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n📋 *Что дальше:*\n1. Менеджер свяжется с вами в течение 30 минут\n2. Обсудит детали и покажет расчёт\n3. Предложит готовое решение или разработает с нуля\n\n🎁 *Бонус*: при заказе до конца недели — настройка YandexGPT в подарок!\n\nСпасибо, ${data.name}! 💚`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('🏠 Главное меню', 'start')]
      ])]
    }
  );
}

// ========== ПОДДЕРЖКА ==========
async function handleSupport(ctx) {
  await ctx.reply(
    `🆘 *Поддержка*\n\nЭтот раздел будет добавлен в следующем обновлении.\n\nА пока вы можете:\n• Написать нам в Telegram: @your_username\n• Позвонить: +7 (XXX) XXX-XX-XX\n• Email: support@yourcompany.ru`,
    {
      attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('⬅️ Назад', 'start')]
      ])]
    }
  );
}

// ========== ОБРАБОТЧИКИ СОБЫТИЙ ==========

// Стартовое событие
bot.on('bot_started', async (ctx) => {
  await sendWelcome(ctx);
});

// Команда /start
bot.command('start', async (ctx) => {
  const userId = getUserId(ctx);  // ← ИСПРАВЛЕНО
  if (userId) userStates.delete(userId);
  await sendWelcome(ctx);
  trackEvent('start', userId);
});

// Callback-кнопки
bot.on('message_callback', async (ctx) => {
  const data = ctx.callback.payload;
  const userId = getUserId(ctx);  // ← ИСПРАВЛЕНО
  
  console.log(`\n🔘 НАЖАТА КНОПКА: ${data} | userId: ${userId}`);
  
  if (!userId) return;
  
  // Навигация
  if (data === 'start') {
    userStates.delete(userId);
    await sendWelcome(ctx);
    trackEvent('start', userId);
    return;
  }
  
  if (data === 'demo_menu') {
    await handleDemoMenu(ctx);
    trackEvent('demo_menu', userId);
    return;
  }
  
  if (data === 'pricing') {
    await handlePricing(ctx);
    trackEvent('pricing', userId);
    return;
  }
  
  if (data === 'order_start') {
    await handleOrderStart(ctx, userId);
    trackEvent('order_start', userId);
    return;
  }
  
  if (data === 'support') {
    await handleSupport(ctx);
    trackEvent('support', userId);
    return;
  }
  
  // Демо
  if (data === 'demo_hair') {
    await startDemoHair(ctx, userId);
    trackEvent('demo_hair_start', userId);
    return;
  }
  if (data === 'demo_delivery') {
    await startDemoDelivery(ctx, userId);
    trackEvent('demo_delivery_start', userId);
    return;
  }
  if (data === 'demo_dentist') {
    await startDemoDentist(ctx, userId);
    trackEvent('demo_dentist_start', userId);
    return;
  }
  if (data === 'demo_custom') {
    await startDemoCustom(ctx);
    return;
  }
  if (data === 'demo_end') {
    await endDemo(ctx, userId);
    return;
  }
  
  // Заказ: обработка кнопок
  if (data.startsWith('order_') || data.startsWith('size_') || 
      data.startsWith('feat_') || data.startsWith('clients_') || 
      data.startsWith('time_')) {
    await handleOrderStep(ctx, userId, data);
    return;
  }
  
  // Шаги демо
  if (data.startsWith('demo_hair_')) {
    await handleDemoHairStep(ctx, userId, data);
    return;
  }
  if (data.startsWith('demo_delivery_')) {
    await handleDemoDeliveryStep(ctx, userId, data);
    return;
  }
  if (data.startsWith('demo_dentist_')) {
    await handleDemoDentistStep(ctx, userId, data);
    return;
  }
});

// Текстовые сообщения
bot.on('message_created', async (ctx) => {
  const text = ctx.message?.body?.text || '';
  const userId = getUserId(ctx);  // ← ИСПРАВЛЕНО
  
  console.log(`\n📩 MESSAGE_CREATED | text: "${text}" | userId: ${userId}`);
  
  if (text.startsWith('/')) return;
  if (!userId) return;
  
  const state = userStates.get(userId);
  console.log(`📊 State found:`, state ? `mode=${state.mode}, step=${state.step}` : 'NO STATE');
  
  // 1. Обработка текстовых ответов для ЗАКАЗА
  if (state && state.mode === 'order') {
    await handleOrderStep(ctx, userId, text);
    return;
  }
  
  // 2. Обработка адреса в ДОСТАВКЕ
  if (state && state.mode === 'demo' && state.demo_type === 'delivery' && state.step === 'address') {
    state.data.address = text;
    state.step = 'payment';
    await ctx.reply(
      `📍 Адрес: ${text}\n\n💳 Способ оплаты:`,
      {
        attachments: [Keyboard.inlineKeyboard([
          [Keyboard.button.callback('💵 Наличные', 'demo_delivery_cash')],
          [Keyboard.button.callback('💳 Карта курьеру', 'demo_delivery_card')],
          [Keyboard.button.callback('📱 Онлайн', 'demo_delivery_online')]
        ])]
      }
    );
    userStates.set(userId, state);
    return;
  }
  
  // 3. Если ничего не подошло
  await sendWelcome(ctx);
});
  
// ========== ЗАПУСК ==========
bot.start();
console.log('\n' + '='.repeat(50));
console.log('🤖 MAX-DIALOG Demo Bot запущен!');
console.log('📊 Аналитика пишется в файл: analytics.json');
console.log('='.repeat(50));