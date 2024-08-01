const fs = require('fs');
const data = JSON.parse(fs.readFileSync('data.json', 'utf8'));
module.exports = data;
