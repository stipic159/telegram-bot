const TelegramBot = require('node-telegram-bot-api');
const { saveUserData, loadAllUsers, requestValidDate } = require('./utils'); // Импорт функций
const data = require('./data'); // Импорт данных из data.json

const bot = new TelegramBot(data.botToken, { polling: true });
const userRequests = {};

// Обработка событий вступления в канал
bot.on('chat_join_request', (msg) => {
  const chatId = msg.chat.id;
  const userId = msg.from.id;
  const username = msg.from.username;

  // Запоминаем информацию о пользователе и запросе
  userRequests[userId] = { chatId, username };

  const options = {
    reply_markup: {
      keyboard: [
        ['/start']
      ],
      resize_keyboard: true, // Автоматически изменяет размер клавиатуры
      one_time_keyboard: true // Клавиатура скрывается после выбора
    }
  };

  console.log(`${chatId} айди канала`)
  console.log(`Пользователь ${username}, отправил заявку в канал. Ждем когда он пройдет регестрацию.`)
  bot.sendMessage(userId, `Вы отправили заявку на вступление в канал. Пожалуйста, введите /start`, options)
    .catch(err => console.error('Ошибка при отправке сообщения о заявке:', err));
});

// Обработка команды /start
bot.onText(/\/start/, (msg) => {
  const userId = msg.from.id;

  if (userRequests[userId]) {
    bot.sendMessage(userId, 'Предоставьте данные, чтобы я мог пропустить вас в канал.', {
      reply_markup: {
        inline_keyboard: [
          [{ text: 'Предоставить данные', callback_data: `provide_data_${userId}` }]
        ]
      }
    }).catch(err => console.error('Ошибка при отправке сообщения о предоставлении данных:', err));
  }
});

// Обработка нажатия на инлайн-кнопки
bot.on('callback_query', async (callbackQuery) => {
  const userId = callbackQuery.from.id;
  const callbackData = callbackQuery.data;

  if (callbackData.startsWith('provide_data_')) {
    const requestId = callbackData.split('_')[2]; // Получаем userId из callbackData

    if (userRequests[requestId]) {
      try {
        const { username } = userRequests[requestId];
        const name = await new Promise((resolve, reject) => {
          bot.sendMessage(userId, 'Пожалуйста, укажите ваше имя:')
            .then(() => bot.once('message', msg => resolve(msg.text)))
            .catch(err => reject(err));
        });
        console.log(`Пользователь ${username}, ввел свое имя! Его зовут: ${name}`)

        const surname = await new Promise((resolve, reject) => {
          bot.sendMessage(userId, 'Пожалуйста, укажите вашу фамилию:')
            .then(() => bot.once('message', msg => resolve(msg.text)))
            .catch(err => reject(err));
        });
        console.log(`Пользователь ${username}, ввел свою фамилию! Его фамилия: ${surname}`)
        const location = await new Promise((resolve, reject) => {
          bot.sendMessage(userId, 'Пожалуйста, укажите ваше место нахождения (название Села, Города, Деревни или Поселка):')
            .then(() => bot.once('message', msg => resolve(msg.text)))
            .catch(err => reject(err));
        });
        console.log(`Пользователь ${username}, указал место нахождения: ${location}`);

        const birthDate = await new Promise((resolve, reject) => {
          requestValidDate(bot, userId, resolve, username);
        });

        const phoneNumber = await new Promise((resolve, reject) => {
          bot.sendMessage(userId, 'Пожалуйста, отправьте ваш номер телефона:', {
            reply_markup: {
              keyboard: [
                [{
                  text: 'Отправить номер телефона',
                  request_contact: true
                }]
              ],
              one_time_keyboard: true
            }
          })
            .then(() => bot.once('contact', msg => resolve(msg.contact.phone_number)))
            .catch(err => reject(err));
        });
        console.log(`Пользователь ${username}, ввел свой номер теелфона! Его номер теелфона: ${phoneNumber}`)

        const options = {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: 'Перейти в канал',
                  url: data.channelUrl // Используем URL из data.json
                }
              ]
            ]
          }
        };

        // Отправляем данные создателю и уведомляем пользователя
        const creatorId = data.creatorId;
        await bot.sendMessage(creatorId, `Принял заявку в канал пользователя: @${username}. Информация о нем:\n\nИмя: ${name}\nФамилия: ${surname}\nМесто жительства: ${location}\nДата рождения: ${birthDate.day}.${birthDate.month}.${birthDate.year}\nТелефон: ${phoneNumber}`);
        await bot.sendMessage(userId, `Отлично! Вы успешно прошли регистрацию. Вы можете зайти в канал по этой ссылке:`, options);

        // Сохраняем данные пользователя
        const userData = {
          userId,
          name,
          surname,
          location,
          dateOfBirth: {
            day: birthDate.day,
            month: birthDate.month,
            year: birthDate.year
          },
          phoneNumber
        };
        saveUserData(userId, userData);

        // Одобряем заявку на вступление в канал
        await bot.approveChatJoinRequest(userRequests[requestId].chatId, requestId);
      } catch (err) {
        console.error('Ошибка при обработке данных пользователя:', err);
      }
      delete userRequests[requestId];
    }
  }
});

// Обработка команды /broadcast_text
bot.onText(/\/bc (.+)/, async (msg, match) => {
  const userId = msg.from.id;
  const message = match[1]; // Текст сообщения после команды /broadcast_text

  // Проверка, что команду вызывает создатель
  if (userId.toString() === data.creatorId) {
    const users = loadAllUsers();
    for (const user in users) {
      try {
        await bot.sendMessage(user, message);
      } catch (err) {
        console.error(`Ошибка при отправке сообщения пользователю ${user}:`, err);
      }
    }
    await bot.sendMessage(userId, 'Рассылка текстового сообщения завершена.');
    console.log(`Рассылка сообщения:\n\n'${message}'\n\nПроизошло успешно!`)
  } else {
    await bot.sendMessage(userId, 'У вас нет прав для выполнения этой команды.');
  }
});

// Обработка команды /broadcast_photo
bot.onText(/\/bc_photo/, async (msg) => {
  const userId = msg.from.id;

  // Проверка, что команду вызывает создатель
  if (userId.toString() === data.creatorId) {
    bot.sendMessage(userId, 'Пожалуйста, отправьте фото для рассылки.');
    bot.once('photo', async (msg) => {
      try {
        const photo = msg.photo[msg.photo.length - 1].file_id; // Получаем file_id последнего (наибольшего) фото
        const users = loadAllUsers();
        for (const user in users) {
          await bot.sendPhoto(user, photo);
        }
        console.log(`Рассылка сообщения:\n\n'${message}' + фото \n\nПроизошло успешно!`)
        await bot.sendMessage(userId, 'Рассылка фото завершена.');
      } catch (err) {
        console.error('Ошибка при отправке фото:', err);
      }
    });
  } else {
    await bot.sendMessage(userId, 'У вас нет прав для выполнения этой команды.');
  }
});

// Обработка команды /broadcast_video
bot.onText(/\/bc_video/, async (msg) => {
  const userId = msg.from.id;

  // Проверка, что команду вызывает создатель
  if (userId.toString() === data.creatorId) {
    bot.sendMessage(userId, 'Пожалуйста, отправьте видео для рассылки.');
    bot.once('video', async (msg) => {
      try {
        const video = msg.video.file_id; // Получаем file_id видео
        const users = loadAllUsers();
        for (const user in users) {
          await bot.sendVideo(user, video);
        }
        await bot.sendMessage(userId, 'Рассылка видео завершена.');
        console.log(`Рассылка сообщения:\n\n'${message}' + видео \n\nПроизошло успешно!`)
      } catch (err) {
        console.error('Ошибка при отправке видео:', err);
      }
    });
  } else {
    await bot.sendMessage(userId, 'У вас нет прав для выполнения этой команды.');
  }
});

// Обработка команды /broadcast_animation
bot.onText(/\/bc_gif/, async (msg) => {
  const userId = msg.from.id;

  // Проверка, что команду вызывает создатель
  if (userId.toString() === data.creatorId) {
    bot.sendMessage(userId, 'Пожалуйста, отправьте анимацию (GIF) для рассылки.');
    bot.once('animation', async (msg) => {
      try {
        const animation = msg.animation.file_id; // Получаем file_id анимации
        const users = loadAllUsers();
        for (const user in users) {
          await bot.sendAnimation(user, animation);
        }
        await bot.sendMessage(userId, 'Рассылка GIF завершена.');
        console.log(`Рассылка сообщения:\n\n'${message}' + GIF \n\nПроизошло успешно!`)
      } catch (err) {
        console.error('Ошибка при отправке анимации:', err);
      }
    });
  } else {
    await bot.sendMessage(userId, 'У вас нет прав для выполнения этой команды.');
  }
});

bot.onText(/\/smp/, async (msg) => {
  const userId = msg.from.id;
  // Проверка, что команду вызывает создатель
  if (userId.toString() === data.creatorId) {
  const iD = await new Promise((resolve, reject) => {
    bot.sendMessage(userId, `Чтобы отправить сообщение пользователю, скажите мне telegram-id. Можно посмотреть его id в user.json`)
      .then(() => bot.once('message', msg => resolve(msg.text)))
      .catch(err => reject(err));
  });
  
  const message = await new Promise((resolve, reject) => {
    bot.sendMessage(userId, `Теперь мне нужно узнать сообщение, которое ты хочешь отправить пользователю`)
      .then(() => bot.once('message', msg => resolve(msg.text)))
      .catch(err => reject(err));
  });
  bot.sendMessage(iD, message)
  bot.sendMessage(userId, `Сообщение пользователю успешно отправлено`)
  console.log(`Сообщение пользователю - ${iD}, Успешно отправленно!`)
}
})

bot.on('polling_error', (error) => {
  console.error('Polling error:', error);
});
