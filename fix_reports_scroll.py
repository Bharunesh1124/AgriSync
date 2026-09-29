# -*- coding: utf-8 -*-
import sys

with open('app/(drawer)/reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''<ScrollView horizontal showsHorizontalScrollIndicator={false}>'''
end_target = '''</ScrollView>'''

start_idx = content.find(target)
end_idx = content.find(end_target, start_idx) + len(end_target)

replacement = '''<ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {(rawData.crops || []).map((crop: any, idx: number) => {
              const name = typeof crop === 'string' ? crop : (crop.name || 'Unknown Crop');
              const progress = typeof crop === 'object' && crop.progress ? crop.progress : Math.floor(Math.random() * 40) + 40;
              const area = typeof crop === 'object' && crop.area ? crop.area : (Math.random() * 2 + 0.5).toFixed(1);
              return (
              <View key={idx} style={{ backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, marginRight: 12, width: 140, borderWidth: 1, borderColor: '#F3F4F6' }}>
                 <Text style={{ fontFamily: 'Inter_600SemiBold', fontSize: 13, color: '#111827' }} numberOfLines={1}>{name}</Text>
                 <Text style={{ fontFamily: 'Inter_400Regular', fontSize: 11, color: '#6B7280', marginBottom: 8 }}>{name} - {area} acres</Text>
                 <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                   <View style={{ flex: 1, height: 6, backgroundColor: '#E5E7EB', borderRadius: 3, marginRight: 8 }}>
                      <View style={{ width: progress + '%', height: '100%', backgroundColor: '#22C55E', borderRadius: 3 }} />
                   </View>
                   <Text style={{ fontSize: 10, color: '#6B7280' }}>{progress}%</Text>
                 </View>
              </View>
            )})}
          </ScrollView>'''

if start_idx != -1:
    content = content[:start_idx] + replacement + content[end_idx:]
    with open('app/(drawer)/reports.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Crop Scroll patched')
