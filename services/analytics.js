const fs = require('fs');
const path = require('path');

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

module.exports = { trackEvent };