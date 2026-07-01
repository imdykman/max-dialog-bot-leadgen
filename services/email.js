async function sendManagerEmail(data) {
  console.log(`\n📧 ========== НАЧАЛО ОТПРАВКИ EMAIL ==========`);
  console.log(`📧 Данные лида:`, JSON.stringify(data, null, 2));
  
  if (!process.env.SMTP_USER || !process.env.MANAGER_EMAIL) {
    console.log('⚠️ Email не настроен, пропускаем отправку');
    console.log(`📧 SMTP_USER: ${process.env.SMTP_USER || 'НЕ УСТАНОВЛЕН'}`);
    console.log(`📧 MANAGER_EMAIL: ${process.env.MANAGER_EMAIL || 'НЕ УСТАНОВЛЕН'}`);
    return;
  }

  console.log(`📧 SMTP_USER: ${process.env.SMTP_USER}`);
  console.log(`📧 MANAGER_EMAIL: ${process.env.MANAGER_EMAIL}`);
  console.log(`📧 SMTP_HOST: ${process.env.SMTP_HOST}`);
  console.log(`📧 SMTP_PORT: ${process.env.SMTP_PORT}`);
  
  try {
    const nodemailer = require('nodemailer');
    
    console.log(`📧 Создаём transporter...`);
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    console.log(`📧 Transporter создан, отправляем письмо...`);
    
    const info = await transporter.sendMail({
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
    console.log(`📧 Message ID: ${info.messageId}`);
    console.log(`📧 ========== КОНЕЦ ОТПРАВКИ EMAIL ==========\n`);
  } catch (error) {
    console.error(`\n❌ ========== ОШИБКА ОТПРАВКИ EMAIL ==========`);
    console.error(`❌ Ошибка:`, error.message);
    console.error(`❌ Код ошибки:`, error.code);
    console.error(`❌ Команда:`, error.command);
    console.error(`❌ Полный объект ошибки:`, error);
    console.error(`❌ Stack trace:`, error.stack);
    console.error(`❌ ==========================================\n`);
  }
}

module.exports = { sendManagerEmail };