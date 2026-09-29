const fs = require('fs');
const fpath = 'c:/Users/bharunesh/OneDrive/Desktop/D_f-mgtG/AgriSync-Mobile/app/(drawer)/reports.tsx';
let data = fs.readFileSync(fpath, 'utf8');

data = data.replace(/height: \(\(d.in\/30000\)\*100\) \+ "%"/g, 'height: (((d.in/30000)*100) + "%") as any');
data = data.replace(/height: \(\(d.out\/30000\)\*100\) \+ "%"/g, 'height: (((d.out/30000)*100) + "%") as any');
data = data.replace(/width: item.pct \+ "%"/g, 'width: (item.pct + "%") as any');
data = data.replace(/width: \(\(item.val\/42\)\*100\) \+ "%"/g, 'width: (((item.val/42)*100) + "%") as any');

fs.writeFileSync(fpath, data);
console.log('Fixed Dimensions');
