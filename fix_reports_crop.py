# -*- coding: utf-8 -*-
import sys

with open('app/(drawer)/reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target1 = '''          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
             <View style={{ marginRight: 24 }}>
               <MultiDonut data={[{color:'#22C55E', pct: 40, val: 5}, {color:'#3B82F6', pct: 25, val: 3}, {color:'#F59E0B', pct: 15, val: 2}, {color:'#8B5CF6', pct: 15, val: 2}]} size={110} centerTitle="75%" centerSub="Activities Completed" />
             </View>
             <View style={{ flex: 1 }}>
                {[{c:'#22C55E', n:'Irrigation', v:5}, {c:'#3B82F6', n:'Fertilizer', v:3}, {c:'#F59E0B', n:'Inspection', v:2}, {c:'#8B5CF6', n:'Pest mon', v:2}].map((itm, i) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: itm.c, marginRight: 8 }} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: "#4B5563" }}>{itm.n}</Text>
                    </View>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#111827" }}>{itm.v}</Text>
                  </View>
                ))}
             </View>
          </View>'''

replacement1 = '''          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 24 }}>
             <View style={{ marginRight: 24 }}>
               <MultiDonut data={(stats.cropBreakdown || []).map((c: any) => ({color: c.c, pct: c.pct, val: c.v}))} size={110} centerTitle={stats.cropActivities.toString()} centerSub="Activities Completed" />
             </View>
             <View style={{ flex: 1 }}>
                {(stats.cropBreakdown || []).map((itm: any, i: number) => (
                  <View key={i} style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <View style={{ flexDirection: "row", alignItems: "center" }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: itm.c, marginRight: 8 }} />
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: "#4B5563" }}>{itm.n}</Text>
                    </View>
                    <Text style={{ fontFamily: "Inter_700Bold", fontSize: 14, color: "#111827" }}>{itm.v}</Text>
                  </View>
                ))}
             </View>
          </View>'''

if target1 in content:
    content = content.replace(target1, replacement1)
    print('Crop Donut patched')
else:
    print('Crop Donut target not found')

with open('app/(drawer)/reports.tsx', 'w', encoding='utf-8') as f:
    f.write(content)

