// utils.js
const fs = require('fs');

// Функция для сохранения данных пользователей в JSON файл
const saveUserData = (userId, userData) => {
  const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
  users[userId] = userData;
  fs.writeFileSync('users.json', JSON.stringify(users, null, 2), 'utf8');
};

// Функция для проверки формата и валидности даты
const isValidDate = (dateString) => {
  // Проверка формата даты (ДД.ММ.ГГГГ)
  const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = datePattern.exec(dateString);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  // Проверка валидности даты
  const date = new Date(year, month - 1, day);
  return date.getDate() === day && date.getMonth() === month - 1 && date.getFullYear() === year;
};

// Функция для проверки, является ли дата разумной (не слишком старая и не в будущем)
const isReasonableDate = (dateString) => {
  const today = new Date();
  const datePattern = /^(\d{2})\.(\d{2})\.(\d{4})$/;
  const match = datePattern.exec(dateString);

  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);

  const date = new Date(year, month - 1, day);

  // Дата должна быть в прошлом и не раньше 1900 года
  return date < today && date >= new Date('1900-01-01');
};

// Функция для запроса корректной даты у пользователя
const requestValidDate = (bot, userId, callback, username) => {
  bot.sendMessage(userId, 'Пожалуйста, укажите вашу дату рождения (в формате ДД.ММ.ГГГГ):');
  
  bot.once('message', (msg) => {
    const birthDate = msg.text;

    if (!isValidDate(birthDate)) {
      bot.sendMessage(userId, 'Неверный формат даты. Пожалуйста, укажите дату в формате ДД.ММ.ГГГГ.');
      requestValidDate(bot, userId, callback);
    } else if (!isReasonableDate(birthDate)) {
      bot.sendMessage(userId, 'Дата слишком старая или в будущем. Пожалуйста, укажите разумную дату.');
      requestValidDate(bot, userId, callback);
    } else {
      const [day, month, year] = birthDate.split('.');
      callback({ day, month, year });
    }
    console.log(`Пользователь ${username}, ввел свою дату рождения!Его дата рожения: ${birthDate}`)
  });
};
const loadAllUsers = () => {
    const users = JSON.parse(fs.readFileSync('users.json', 'utf8'));
    return users;
  };
module.exports = {
  saveUserData,
  isValidDate,
  isReasonableDate,
  requestValidDate,
  loadAllUsers,
};
