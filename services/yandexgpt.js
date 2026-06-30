// ========== СЕРВИС YANDEXGPT ==========

const YANDEX_API_KEY = process.env.YANDEX_API_KEY;
const YANDEX_FOLDER_ID = process.env.YANDEX_FOLDER_ID;
const YANDEX_API_URL = 'https://llm.api.cloud.yandex.net/foundationModels/v1/completion';

// Системный промпт для бота-поддержки
const SYSTEM_PROMPT = `Ты — дружелюбный помощник компании Max-Dialog, которая разрабатывает чат-ботов для бизнеса.

Твоя задача:
- Отвечать на вопросы о разработке ботов
- Рассказывать о возможностях, ценах, сроках
- Помогать выбрать решение для бизнеса
- Быть вежливым и профессиональным

Стиль ответов:
- Дружелюбный, но профессиональный
- Краткий и по делу (2-4 абзаца максимум)
- Используй эмодзи умеренно
- Если вопрос не о ботах — вежливо верни разговор в нужное русло

Важная информация:
- Простой бот — от 15 000 ₽ (3-5 дней)
- Средний бот — от 50 000 ₽ (2-3 недели)
- Сложный бот — от 150 000 ₽ (1-2 месяца)
- Обслуживание — от 5 000 ₽/мес
- Работаем с MAX (VK), Telegram, WhatsApp
- Интеграции: Bitrix24, amoCRM, YandexGPT, платёжные системы
- Есть приложения внутри мессенджера (мини-сайты с фото)

Если клиент спрашивает конкретную цену — предложи оставить заявку через раздел "Заказать бота", менеджер свяжется и обсудит детали.

Не выдумывай факты, которых нет в этом описании. Если не знаешь ответа — предложи связаться с менеджером.`;

/**
 * Отправляет запрос в YandexGPT и получает ответ
 * @param {string} userMessage - Сообщение пользователя
 * @param {string} userId - ID пользователя (для контекста)
 * @returns {Promise<string>} - Ответ бота
 */
async function askYandexGPT(userMessage, userId) {
  if (!YANDEX_API_KEY || !YANDEX_FOLDER_ID) {
    console.error('❌ YandexGPT API не настроен. Проверьте YANDEX_API_KEY и YANDEX_FOLDER_ID в .env');
    return 'Извините, умный помощник временно недоступен. Пожалуйста, задайте свой вопрос менеджеру: info@max-dialog.ru';
  }

  try {
    const response = await fetch(YANDEX_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Api-Key ${YANDEX_API_KEY}`,
        'x-folder-id': YANDEX_FOLDER_ID
      },
      body: JSON.stringify({
        modelUri: `gpt://${YANDEX_FOLDER_ID}/yandexgpt-lite`,
        completionOptions: {
          stream: false,
          temperature: 0.6,
          maxTokens: 2000
        },
        messages: [
          {
            role: 'system',
            text: SYSTEM_PROMPT
          },
          {
            role: 'user',
            text: userMessage
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ YandexGPT API error:', response.status, errorText);
      return 'Извините, произошла ошибка при обработке вашего вопроса. Попробуйте позже или напишите менеджеру: info@max-dialog.ru';
    }

    const data = await response.json();
    
    // Извлекаем ответ из структуры YandexGPT
    const assistantMessage = data.result?.alternatives?.[0]?.message?.text;
    
    if (!assistantMessage) {
      console.error('❌ YandexGPT вернул пустой ответ:', JSON.stringify(data));
      return 'Извините, не удалось сформировать ответ. Попробуйте переформулировать вопрос.';
    }

    console.log(`✅ YandexGPT ответ сформирован (${assistantMessage.length} символов)`);
    return assistantMessage;

  } catch (error) {
    console.error('❌ Ошибка вызова YandexGPT:', error);
    return 'Извините, умный помощник временно недоступен. Пожалуйста, напишите менеджеру: info@max-dialog.ru';
  }
}

module.exports = { askYandexGPT };