const fs = require('fs');
const path = require('path');

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

async function getLeads() {
  try {
    if (!fs.existsSync(LEADS_FILE)) return [];
    return JSON.parse(fs.readFileSync(LEADS_FILE, 'utf-8'));
  } catch (e) {
    console.error('Ошибка чтения лидов:', e);
    return [];
  }
}

module.exports = { saveLead, getLeads };