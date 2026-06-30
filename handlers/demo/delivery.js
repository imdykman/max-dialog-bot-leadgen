const { Keyboard } = require('@maxhub/max-bot-api');
const { trackEvent } = require('../../services/analytics');

async function startDemoDelivery(ctx, userId, userStates) {
  userStates.set(userId, { mode: 'demo', demo_type: 'delivery', step: 'menu_choice', data: { items: [], total: 0 } });
  await ctx.reply(`🍕 *Демо: Бот для доставки еды*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\nПривет! Я бот пиццерии "Вкусно и Точка". 🍕\n\nПомогу выбрать блюда, оформить заказ и доставить прямо к вашей двери!\n\nЧто хотите заказать?`, {
    attachments: [Keyboard.inlineKeyboard([
      [Keyboard.button.callback('🍕 Пицца', 'demo_delivery_pizza')],
      [Keyboard.button.callback('🍔 Бургеры', 'demo_delivery_burgers')],
      [Keyboard.button.callback('🥗 Салаты', 'demo_delivery_salads')],
      [Keyboard.button.callback('🥤 Напитки', 'demo_delivery_drinks')],
      [Keyboard.button.callback('⬅️ Назад к списку', 'demo_menu')]
    ])]
  });
  trackEvent('demo_delivery_start', userId);
}

async function handleDemoDeliveryStep(ctx, userId, action, userStates) {
  const state = userStates.get(userId);
  if (!state || state.mode !== 'demo' || state.demo_type !== 'delivery') return;
  if (!state.data) state.data = { items: [], total: 0 };

  switch (action) {
    case 'demo_delivery_pizza':
      await ctx.reply(`🍕 *Пицца*\n\nВыберите размер:`, { attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('🔸 Маленькая (25 см) — 490₽', 'demo_delivery_pizza_small')],
        [Keyboard.button.callback('🔸 Средняя (30 см) — 690₽', 'demo_delivery_pizza_medium')],
        [Keyboard.button.callback('🔸 Большая (35 см) — 890₽', 'demo_delivery_pizza_large')],
        [Keyboard.button.callback('⬅️ Назад', 'demo_delivery')]
      ])]}); break;
    case 'demo_delivery_pizza_small': case 'demo_delivery_pizza_medium': case 'demo_delivery_pizza_large': {
      const sizes = { 'demo_delivery_pizza_small': { name: 'Маленькая', price: 490 }, 'demo_delivery_pizza_medium': { name: 'Средняя', price: 690 }, 'demo_delivery_pizza_large': { name: 'Большая', price: 890 } };
      state.data.items.push(`Пицца ${sizes[action].name}`); state.data.total += sizes[action].price;
      await showDeliveryCart(ctx, state); break;
    }
    case 'demo_delivery_burgers':
      await ctx.reply(`🍔 *Бургеры*`, { attachments: [Keyboard.inlineKeyboard([
        [Keyboard.button.callback('🍔 Классический — 350₽', 'demo_delivery_burger_classic')],
        [Keyboard.button.callback('🍔 Чизбургер — 390₽', 'demo_delivery_burger_cheese')],
        [Keyboard.button.callback('🍔 Двойной — 490₽', 'demo_delivery_burger_double')],
        [Keyboard.button.callback('⬅️ Назад', 'demo_delivery')]
      ])]}); break;
    case 'demo_delivery_burger_classic': case 'demo_delivery_burger_cheese': case 'demo_delivery_burger_double': {
      const burgers = { 'demo_delivery_burger_classic': { name: 'Классический', price: 350 }, 'demo_delivery_burger_cheese': { name: 'Чизбургер', price: 390 }, 'demo_delivery_burger_double': { name: 'Двойной', price: 490 } };
      state.data.items.push(`Бургер ${burgers[action].name}`); state.data.total += burgers[action].price;
      await showDeliveryCart(ctx, state); break;
    }
    case 'demo_delivery_checkout':
      state.step = 'address';
      await ctx.reply(`📍 *Оформление заказа*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🛒 *Ваш заказ:*\n${state.data.items.map(i => `• ${i}`).join('\n')}\n\n💰 *Итого: ${state.data.total}₽*\n\n📝 Напишите адрес доставки текстом:`); break;
    case 'demo_delivery_cash': case 'demo_delivery_card': case 'demo_delivery_online': {
      const payments = { 'demo_delivery_cash': 'Наличные', 'demo_delivery_card': 'Карта курьеру', 'demo_delivery_online': 'Онлайн' };
      state.data.payment = payments[action];
      await ctx.reply(`🎉 *Заказ принят!*\n\n━━━━━━━━━━━━━━━━━━━━━━\n\n🛒 ${state.data.items.join(', ')}\n📍 ${state.data.address}\n💳 ${state.data.payment}\n💰 ${state.data.total}₽\n\n⏱ Примерное время доставки: 40-60 минут.\n\n📱 Курьер свяжется с вами перед выездом.\n\nСпасибо за заказ! 😊`, { attachments: [Keyboard.inlineKeyboard([[Keyboard.button.callback('🏁 Завершить демо', 'demo_end')]])]});
      trackEvent('demo_delivery_complete', userId, state.data); break;
    }
  }
  userStates.set(userId, state);
}

async function showDeliveryCart(ctx, state) {
  await ctx.reply(`✅ Добавлено в корзину!\n\n💰 *Итого: ${state.data.total}₽*\n\nЧто-то ещё?`, { attachments: [Keyboard.inlineKeyboard([
    [Keyboard.button.callback('🍕 Ещё пиццу', 'demo_delivery_pizza')],
    [Keyboard.button.callback('🍔 Бургеры', 'demo_delivery_burgers')],
    [Keyboard.button.callback('🛒 Оформить заказ', 'demo_delivery_checkout')],
    [Keyboard.button.callback('⬅️ Назад', 'demo_delivery')]
  ])]});
}

module.exports = { startDemoDelivery, handleDemoDeliveryStep };