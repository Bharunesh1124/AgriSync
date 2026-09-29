const fs = require('fs');
const path = 'app/(drawer)/reports.tsx';
let data = fs.readFileSync(path, 'utf8');

// What-If navigation
data = data.replace(
  '<TouchableOpacity style={{ backgroundColor: "#EFF6FF", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center" }}>',
  '<TouchableOpacity onPress={() => router.push("/what-if")} style={{ backgroundColor: "#EFF6FF", borderRadius: 12, padding: 16, flexDirection: "row", alignItems: "center" }}>'
);

// Livestock View Details
data = data.replace(
  '<Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#3B82F6" }}>View Details {\'>\'}</Text>',
  '<TouchableOpacity onPress={() => router.push("/crops")}><Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#3B82F6" }}>View Details {\'>\'}</Text></TouchableOpacity>'
);

// Adding filter for Farm Activity Trend
const filterHtml = `
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={{ backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, marginRight: 8 }}>
                <Text style={{ fontSize: 10, fontFamily: 'Inter_600SemiBold', color: '#4B5563' }}>Activities ▼</Text>
              </TouchableOpacity>
              <View style={{ backgroundColor: '#DCFCE7', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>
                 <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 12, color: '#065F46' }}>{stats.tasksCompleted} total</Text>
              </View>
            </View>
`;
data = data.replace(
  '<View style={{ backgroundColor: "#DCFCE7", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 }}>\n               <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: "#065F46" }}>{stats.tasksCompleted} total</Text>\n            </View>',
  filterHtml
);

fs.writeFileSync(path, data);
