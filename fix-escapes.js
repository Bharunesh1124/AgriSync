const fs = require('fs');
const file = 'c:/Users/bharunesh/OneDrive/Desktop/D_f-mgtG/AgriSync-Mobile/app/(drawer)/reports.tsx';
let data = fs.readFileSync(file, 'utf8');
data = data.replace(/\\`/g, '`').replace(/\\\$/g, '$');
fs.writeFileSync(file, data);
console.log("Replaced escape characters");
