const fs = require('fs');

// Загрузка данных из файла data.json
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));

// Экспорт данных
module.exports = data;
