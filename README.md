# Telegram Bot

Этот репозиторий содержит код для Telegram-бота, который реализует функционал обработки заявок на вступление в канал и рассылки сообщений. Бот запрашивает у пользователей данные для регистрации и отправляет уведомления создателю.

## Установка и запуск

### 1. Настройка конфигурации

Установить проект с помощью zip файла.

Распакуйте файл, куда вам удобно (можно на рабочий стол)

Зайдите в файл `data.json` в корне проекта и добавьте в него следующие данные:

```json
{
  "botToken": "Ваш_токен_от_бота",
  "creatorId": "Ваш_telegram_id",
  "channelUrl": "Ваша ссылка на канал"
  "channelId": "Ваш айди канала"
}
```

- **`botToken`** — токен вашего бота, полученный от [BotFather](https://t.me/botfather).
- Чтобы его получить напишите /start в бота , в списке выберете /newbot . Бот попросит написать название для вашего бота, потом попросит написать username для бота
- **`creatorId`** — ваш ID в Telegram, используемый для выполнения команд, доступных только создателю бота.
- Зайдите в [Этого бота] (t.me/GetAnyTelegramIdBot) и нажмите на 'start'
- Нам нужна строчка P.S - [Ваш айди] Его и копируем, и вставляем в 4 поле
- [фото помощь](https://github.com/user-attachments/assets/3c826e2e-5f66-4af2-9722-4b22d8311a3b)
- **`channelUrl`** — URL вашего канала, куда пользователи будут перенаправлены после успешной регистрации.
- Канал должен быть приватный! Так же ссылка должна быть с заявками.
  [фото помощь](https://github.com/user-attachments/assets/58210b20-c2a4-4493-8e6f-693d3ab702e3)
- **`channelId`** — Ваш айди канала. Он показывается, Когда в канал отправляется заявка. Его нужно будет вставить в это поле. Это необязятельно, но для стабильной работы нужно
### 2. Установка Node.js

Если Node.js не установлен, скачайте и установите его [по этой ссылке](https://nodejs.org/dist/v22.5.1/node-v22.5.1-x64.msi).
### 3. Поиск папки

После установки Node.js, перезагрузите компьютер. Потом с помощью проводника узнайте путь до вашей, расспакованной папки. После этого скопируйте путь до вашей папки. На клавиатуре нажмите сочитание клавиш win + r
У вас появится маленькое окно, в углу экрана с текстовым полем. В это текствое поле введите:
```
cmd
```
И нажмите enter. У вас откроется терминал. Туда введите ваш cd скопированный путь. это будет выглядить вот так:
```bash
cd [ваш путь до папки с проектом]
```
После всех этих действий нужно написать:
```bash
npm i
```
Для установки всех зависимостей

### 4. Запуск бота

Для запуска бота не выключяя терминал (туда, куда и `npm i` писали) используйте следующую команду:

```bash
node bot.js
```

Убедитесь, что файл конфигурации `data.json` настроен правильно перед запуском.

## Файлы проекта

- **`bot.js`** — основной файл с кодом бота.
- **`utils.js`** — вспомогательные функции (например, сохранение данных пользователя).
- **`data.json`** — файл конфигурации с токеном бота, ID создателя и URL канала.
- **`package.json`** — файл с зависимостями проекта.

## Команды бота

- **`/start`** — запрашивает у пользователя данные для регистрации.
- **`/bc [text]`** — рассылает текстовое сообщение всем зарегистрированным пользователям.
- **`/bc_photo`** — рассылает фото всем зарегистрированным пользователям.
- **`/bc_video`** — рассылает видео всем зарегистрированным пользователям.
- **`/bc_gif`** — рассылает анимации (GIF) всем зарегистрированным пользователям.
- **`/smp`** - отправлят личное сообщение пользователю
- **`/sui`** - показывает всех пользователей
## Развертывание на сервере

Для развертывания бота на сервере воспользуйтесь одной из бесплатных платформ для размещения Node.js приложений, таких как:

- [Heroku](https://www.heroku.com/)
- [Railway](https://railway.app/)
- [Render](https://render.com/)

Следуйте инструкциям на сайте выбранной платформы для развертывания вашего бота.

## Лицензия

Этот проект лицензируется под лицензией MIT. См. [LICENSE](LICENSE) для подробностей.

## Контакт

Если у вас есть вопросы или предложения, пожалуйста, напишите мне на [почту](mailto:stpogood@gamil.com).
