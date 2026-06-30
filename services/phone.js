// ========== ФОРМАТИРОВАНИЕ ТЕЛЕФОНА ==========
function formatPhone(input) {
  if (!input) return '';
  
  // Убираем всё, кроме цифр
  let digits = input.replace(/\D/g, '');
  
  // Если начинается с 8 — заменяем на 7
  if (digits.startsWith('8') && digits.length === 11) {
    digits = '7' + digits.slice(1);
  }
  
  // Если нет кода страны — добавляем 7
  if (digits.length === 10) {
    digits = '7' + digits;
  }
  
  // Если всё ещё не 11 цифр — возвращаем как есть (не валидно)
  if (digits.length !== 11) {
    return input;
  }
  
  // Форматируем: +7 909 000 40 77
  return `+${digits[0]} ${digits.slice(1, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 9)} ${digits.slice(9, 11)}`;
}

// ========== ВАЛИДАЦИЯ ТЕЛЕФОНА ==========
function isValidPhone(input) {
  if (!input) return false;
  
  const digits = input.replace(/\D/g, '');
  
  // Должно быть 10 или 11 цифр
  if (digits.length !== 10 && digits.length !== 11) {
    return false;
  }
  
  // Нормализуем к 11 цифрам
  let normalized = digits;
  if (normalized.length === 10) {
    normalized = '7' + normalized;
  } else if (normalized.startsWith('8')) {
    normalized = '7' + normalized.slice(1);
  }
  
  // Первая цифра должна быть 7 (код страны)
  if (normalized[0] !== '7') {
    return false;
  }
  
  // Вторая цифра должна быть 9 (мобильный оператор РФ)
  if (normalized[1] !== '9') {
    return false;
  }
  
  return true;
}

module.exports = { formatPhone, isValidPhone };