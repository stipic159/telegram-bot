const TelegramBot = require('node-telegram-bot-api');
const { saveUserData, loadAllUsers, requestValidDate } = require('./utils');
const data = require('./data');
const fs = require('fs');
const bot = new TelegramBot(data.botToken, { polling: true });
const userRequests = {};
const userStates = {};
bot.on('chat_join_request', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;
  console.log(`${username} (${userId}), Отправил заявку в канал с id - ${chatId}.`)
  userRequests[userId] = { chatId, username };

  bot.sendMessage(userId, 'Вы отправили заявку на вступление в канал. Пожалуйста, введите /start', {
    reply_markup: {
      keyboard: [['/start']],
      resize_keyboard: true,
      one_time_keyboard: true
    }
  }).catch(err => console.error('Ошибка при отправке сообщения о заявке:', err));
});

bot.onText(/\/start/, async (msg) => {
  const userId = msg.from.id;

  if (userRequests[userId]) {
    bot.sendMessage(userId, 'Предоставьте данные, чтобы я мог пропустить вас в канал.', {
      reply_markup: {
        inline_keyboard: [[{ text: 'Предоставить данные', callback_data: `provide_data_${userId}` }]]
      }
    }).catch(err => console.error('Ошибка при отправке сообщения о предоставлении данных:', err));
  }
});

bot.on('callback_query', async (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;
  const username = callbackQuery.from.username

  if (callbackData.startsWith('provide_data_')) {
    const requestId = callbackData.split('_')[2];

    if (userRequests[requestId]) {
      try {
        await console.log(`Пользователь @${username} (${userId}) нажал на кнопку регестрации`)

        await delay(1000)
        await console.log(`Запрашиваю информацию у пользователя @${username} (${userId}). Запрос: Имя`)
        const name = await getUserInput(userId, 'Пожалуйста, укажите ваше имя:');
        await console.log(`Информация получена! Имя у пользователя @${username} (${userId}): ${name}`)

        await delay(1000)
        await console.log(`Запрашиваю информацию у пользователя @${username} (${userId}). Запрос: Фамилия`)
        const surname = await getUserInput(userId, 'Пожалуйста, укажите вашу фамилию:');
        await console.log(`Информация получена! Фамилия у пользователя @${username} (${userId}): ${surname}`)

        await delay(1000)
        await console.log(`Запрашиваю информацию у пользователя @${username} (${userId}). Запрос: Локация`)
        const location = await getUserInput(userId, 'Пожалуйста, укажите ваше место нахождения (название Села, Города, Деревни или Поселка):');
        await console.log(`Информация получена! Локация у пользователя @${username} (${userId}): ${location}`)

        await delay(1000)
        await console.log(`Запрашиваю информацию у пользователя @${username} (${userId}). Запрос: Дата рождения`)
        const birthDate = await new Promise((resolve, reject) => requestValidDate(bot, userId, resolve, username));
        await console.log(`Информация получена! Дата рождения у пользователя @${username} (${userId}): ${birthDate.day}.${birthDate.month}.${birthDate.year}`)

        await delay(1000)
        await console.log(`Запрашиваю информацию у пользователя @${username} (${userId}). Запрос: Номер телефона`)
        const phoneNumber = await getUserContact(userId);
        await console.log(`Информация получена! Номер телефона у пользователя @${username} (${userId}): ${phoneNumber}. Это последнее дейстиве. Вся информация о нем:\n\n`)
        
        await delay(2500)
        const creatorId = data.creatorId;
        await bot.sendMessage(creatorId, `Принял заявку в канал пользователя: @${username} (${userId}). Информация о нем:\n\nИмя: ${name}\nФамилия: ${surname}\nМесто жительства: ${location}\nДата рождения: ${birthDate.day}.${birthDate.month}.${birthDate.year}\nТелефон: ${phoneNumber}`);
        await console.log(`Имя: ${name}\nФамилия: ${surname}\nМесто жительства: ${location}\nДата рождения: ${birthDate.day}.${birthDate.month}.${birthDate.year}\nТелефон: ${phoneNumber}\n`)
        const options = { reply_markup: { inline_keyboard: [[{ text: 'Перейти в канал', url: data.channelUrl }]] } };
        await bot.sendMessage(userId, 'Отлично! Вы успешно прошли регистрацию. Вы можете зайти в канал по этой ссылке:', options);
        await bot.approveChatJoinRequest(userRequests[requestId].chatId, requestId);
        await console.log(`Заявка в канал принята, записываю пользователя в базу данных...`)
        await delay(1000);
        const userData = { userId, name, surname, location, dateOfBirth: birthDate, phoneNumber };
        saveUserData(userId, userData);
        delete userRequests[requestId];
      } catch (err) {
        console.error('Ошибка при обработке данных пользователя:', err);
      }
    }
  }
});

bot.onText(/\/bc (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const message = match[1];
  
  if (userId.toString() === data.creatorId) {
    console.log(`Создатель @${username} (${userId}) написал команду /bc с текстом: "${message}"`)
    console.log(`Рассылка сообщения наченается...`)
    const users = loadAllUsers();
    await Promise.all(Object.keys(users).map(user => bot.sendMessage(user, message)));
    await bot.sendMessage(userId, 'Рассылка текстового сообщения завершена.');
    await console.log(`Рассылка сообщения:\n\n${message}\n\nУспешно завершена!`)
  } else {
    console.log(`Пользователь @${username} (${userId}) написал написал команду /bc с текстом: "${message}", но у него недостаточно прав для выполнения данной команды`)
    await bot.sendMessage(userId, 'У вас нет прав для выполнения этой команды.');
  }
});

bot.onText(/\/bc_(photo|video|gif) (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const username = msg.from.username;
  const type = match[1];
  const message = match[2];
  if (userId.toString() === data.creatorId) {
    console.log(`Создатель @${username} (${userId}) написал команду /bc_${type} с текстом: "${message}"`)
    console.log(`Запрос type для рассылки...`)
    bot.sendMessage(userId, `Пожалуйста, отправьте ${type} для рассылки.`);
    console.log(`${type} успешно получено!`)
    bot.once(type, async (msg) => {
      try {
        console.log(`Рассылка сообщения наченается...`)
        const fileId = msg[type].file_id;
        const users = loadAllUsers();
        await Promise.all(Object.keys(users).map(user => bot[`send${capitalizeFirstLetter(type)}`](user, fileId, { caption: message })));
        await bot.sendMessage(userId, `Рассылка ${type} + сообщение завершена.`);
        await console.log(`Рассылка сообщения:\n\n${message} + ${type}\n\nУспешно завершена!`)
      } catch (err) {
        console.error(`Ошибка при отправке ${type}:`, err);
      }
    });
  } else {
    console.log(`Пользователь @${username} (${userId}) написал написал команду /bc_${type} с текстом: "${message}", но у него недостаточно прав для выполнения данной команды`)
    await bot.sendMessage(userId, 'У вас нет прав для выполнения этой команды.');
  }
});

bot.onText(/\/sui/, async (msg) => {
  const userId = msg.chat.id;

  if (userId.toString() === data.creatorId) {
    console.log(`Создатель @${username} (${userId}) написал команду /sui`)
    const users = readUsersFromFile();
    if (Object.keys(users).length === 0) {
      bot.sendMessage(userId, 'Нет данных о пользователях.');
      console.log(`Информация о пользователях не может быть получена, так как пользователей 0!`)
      return;
    }

    if (Object.keys(users).length > 3) {
      userStates[userId] = { waitingForConfirmation: true };
      console.log(`В базе данных больше трех пользователей, ожидаем подтверждения от создателя...`)
      bot.sendMessage(userId, `У вас более 3 пользователей (всего пользователей: ${Object.keys(users).length}). Бот будет отправлять сообщения с интервалом в 2,5 секунды. Вы готовы продолжить?`, {
        reply_markup: {
          keyboard: [[{ text: 'Да' }], [{ text: 'Нет' }]],
          one_time_keyboard: true,
          resize_keyboard: true
        }
      });
    } else {
      await sendUsersInfo(userId, users);
    }
  } else {
    bot.sendMessage(userId, 'Эта команда доступна только создателю бота.');
  }
});

bot.on('message', async (msg) => {
  const userId = msg.chat.id;
  const text = msg.text ? msg.text.toLowerCase() : ''; // Проверка на undefined

  if (userStates[userId]?.waitingForConfirmation) {
    if (text === 'да') {
      console.log(`Операция начала выполнятся...`)
      const users = readUsersFromFile();
      await sendUsersInfo(userId, users);
      console.log(`Операция успешно выполнена!`)
      bot.sendMessage(userId, 'Операция выполнена.');
    } else if (text === 'нет') {
      console.log(`Операция отменена.`)
      bot.sendMessage(userId, 'Операция отменена.');
    }
    userStates[userId] = { waitingForConfirmation: false };
  }
});

async function getUserInput(userId, question) {
  return new Promise((resolve, reject) => {
    bot.sendMessage(userId, question)
      .then(() => bot.once('message', msg => resolve(msg.text)))
      .catch(err => reject(err));
  });
}

async function getUserContact(userId) {
  return new Promise((resolve, reject) => {
    bot.sendMessage(userId, 'Пожалуйста, отправьте ваш номер телефона:', {
      reply_markup: {
        keyboard: [[{ text: 'Отправить номер телефона', request_contact: true }]],
        one_time_keyboard: true
      }
    })
    .then(() => bot.once('contact', msg => resolve(msg.contact.phone_number)))
    .catch(err => reject(err));
  });
}

function readUsersFromFile() {
  return JSON.parse(fs.readFileSync('./users.json'));
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function sendUsersInfo(userId, users) {
  const userIds = Object.keys(users);
  bot.sendMessage(userId, `Все пользователи:`);
  
  await delay(1000);
  
  for (const [i, id] of userIds.entries()) {
    const user = users[id];
    const message = `Пользователь ${i + 1} из ${userIds.length}:\nID пользователя: ${id}\nИмя: ${user.name}\nФамилия: ${user.surname}\nМестоположение: ${user.location}\nДата рождения: ${user.dateOfBirth.day}.${user.dateOfBirth.month}.${user.dateOfBirth.year}\nНомер телефона: ${user.phoneNumber}`;
    
    try {
      await bot.sendMessage(userId, message);
    } catch (err) {
      console.error('Ошибка при отправке сообщения:', err);
    }
    
    await delay(2500);
  }
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
