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

module.exports = { getUserId };