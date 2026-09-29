# -*- coding: utf-8 -*-
import sys

with open('app/(drawer)/reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

start_target = "          {/* Farm Highlights AI */}"
end_target = "            </View>\n          </View>"

start_idx = content.find(start_target)
# find the first instance of end_target after start_idx
end_idx = content.find(end_target, start_idx) + len(end_target)

replacement2 = '''          {/* Farm Highlights AI */}
          <View style={[styles.card, { width: "48%", padding: 16, marginBottom: 0 }]}>
            <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
               <Text style={{ fontSize: 16, marginRight: 6 }}>?</Text>
               <Text style={{ fontFamily: "Inter_700Bold", fontSize: 13, color: "#111827" }}>Farm Highlights</Text>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              <Text style={{ fontSize: 11, color: '#374151', fontFamily: 'Inter_500Medium', lineHeight: 16 }}>{aiSummary}</Text>
            </ScrollView>
          </View>'''

if start_idx != -1:
    content = content[:start_idx] + replacement2 + content[end_idx:]
    with open('app/(drawer)/reports.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('AI UI patched')
else:
    print('Target 2 not found')

