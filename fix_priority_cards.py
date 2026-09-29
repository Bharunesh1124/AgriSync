import sys

with open('app/(drawer)/index.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for i, line in enumerate(lines):
    if "highPriorityEvents.map" in line and "=> (" in line:
        skip = True
        new_lines.append('''                {highPriorityEvents.map((ev) => {
                  const isDone = ev.status === 'Completed';
                  return (
                  <TouchableOpacity
                    key={ev.id}
                    onPress={() => {
                      if (ev.category === "Crop") router.push('/crops');
                      else if (ev.category === "Livestock") router.push('/livestock');
                      else router.push('/finance');
                    }}
                    style={{
                      backgroundColor: isDone ? "#f0fdf4" : "#fff",
                      borderRadius: 20,
                      padding: 16,
                      width: 160,
                      shadowColor: "#000",
                      shadowOpacity: 0.03,
                      shadowRadius: 10,
                      elevation: 2,
                      opacity: isDone ? 0.7 : 1
                    }}
                  >
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <View
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 16,
                          backgroundColor: isDone ? "#dcfce7" : "#fee2e2",
                          justifyContent: "center",
                          alignItems: "center",
                          marginBottom: 12,
                        }}
                      >
                        {getCategoryIcon(ev.category, isDone ? "#16a34a" : "#ef4444", 16)}
                      </View>
                      
                      <TouchableOpacity 
                        onPress={() => toggleCompletion(ev.id)}
                        style={{ padding: 4 }}
                      >
                        {isDone ? (
                          <CheckCircle color="#16a34a" size={20} />
                        ) : (
                          <View style={{ width: 20, height: 20, borderRadius: 10, borderWidth: 2, borderColor: "#cbd5e1" }} />
                        )}
                      </TouchableOpacity>
                    </View>
                    
                    <Text
                      style={{
                        fontWeight: "800",
                        fontSize: 14,
                        color: isDone ? "#166534" : "#101828",
                        marginBottom: 4,
                        textDecorationLine: isDone ? "line-through" : "none"
                      }}
                      numberOfLines={1}
                    >
                      {ev.title}
                    </Text>
                    <Text
                      style={{
                        fontWeight: "500",
                        fontSize: 12,
                        color: isDone ? "#4ade80" : "#64748b",
                        marginBottom: 16,
                        textDecorationLine: isDone ? "line-through" : "none"
                      }}
                      numberOfLines={1}
                    >
                      {ev.subtitle}
                    </Text>
                    
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <View style={{ backgroundColor: isDone ? '#bbf7d0' : '#ef4444', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}>
                        <Text style={{ color: isDone ? '#166534' : '#fff', fontSize: 10, fontWeight: '700' }}>
                          {isDone ? 'Done' : ev.priority}
                        </Text>
                      </View>
                      <Text style={{ color: isDone ? '#166534' : '#ef4444', fontSize: 11, fontWeight: '700' }}>{ev.time}</Text>
                    </View>
                  </TouchableOpacity>
                )})}
''')
        continue
    
    if skip and "</ScrollView>" in line:
        skip = False
        new_lines.append(line)
        continue
        
    if not skip:
        new_lines.append(line)

with open('app/(drawer)/index.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Replaced successfully')
