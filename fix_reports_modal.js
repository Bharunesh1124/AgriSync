const fs = require('fs');

let content = fs.readFileSync('app/(drawer)/reports.tsx', 'utf-8');

const startTarget = "      {/* DAILY DETAILS MODAL */}";
const endTarget = "      </SafeAreaView>";

const startIdx = content.indexOf(startTarget);
const endIdx = content.indexOf(endTarget, startIdx);

const replacement = \      {/* DAILY DETAILS MODAL */}
      <Modal visible={!!selectedDay} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 20, padding: 24, width: '100%', maxWidth: 400, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10, maxHeight: '80%' }}>
            
            {(() => {
              const dayEvents = selectedDay?.events || stats.trendData.find((d: any) => d.date === selectedDay?.date)?.events || [];
              const dayTxs = selectedDay?.txs || stats.financesData.find((d: any) => d.date === selectedDay?.date)?.txs || [];
              const dayIn = selectedDay?.in !== undefined ? selectedDay.in : (stats.financesData.find((d: any) => d.date === selectedDay?.date)?.in || 0);
              const dayOut = selectedDay?.out !== undefined ? selectedDay.out : (stats.financesData.find((d: any) => d.date === selectedDay?.date)?.out || 0);
              const dayCount = selectedDay?.count !== undefined ? selectedDay.count : (stats.trendData.find((d: any) => d.date === selectedDay?.date)?.count || 0);
              
              return (
                <>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                    <Text style={{ fontFamily: 'Inter_800ExtraBold', fontSize: 18 }}>{selectedDay?.date} Details</Text>
                    <TouchableOpacity onPress={() => setSelectedDay(null)}><X color="#6B7280" size={24} /></TouchableOpacity>
                  </View>
                  
                  <ScrollView showsVerticalScrollIndicator={false}>
                    {/* FINANCE SECTION */}
                    <View style={{ marginBottom: 24, backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#111827', marginBottom: 12 }}>Finance Summary</Text>
                      
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                        <Text style={{ color: '#6B7280', fontFamily: 'Inter_500Medium' }}>Income</Text>
                        <Text style={{ color: '#16A34A', fontFamily: 'Inter_700Bold' }}>?{dayIn.toLocaleString()}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Text style={{ color: '#6B7280', fontFamily: 'Inter_500Medium' }}>Expenses</Text>
                        <Text style={{ color: '#EF4444', fontFamily: 'Inter_700Bold' }}>?{dayOut.toLocaleString()}</Text>
                      </View>
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 12, borderTopWidth: 1, borderColor: '#E5E7EB' }}>
                        <Text style={{ color: '#111827', fontFamily: 'Inter_700Bold' }}>Net</Text>
                        <Text style={{ fontFamily: 'Inter_800ExtraBold', color: (dayIn - dayOut) >= 0 ? '#16A34A' : '#EF4444' }}>
                          ?{(dayIn - dayOut).toLocaleString()}
                        </Text>
                      </View>

                      {/* Mini Bar Graph for Finance */}
                      <View style={{ flexDirection: 'row', height: 24, marginTop: 16, borderRadius: 4, overflow: 'hidden', backgroundColor: '#E5E7EB' }}>
                        {dayIn > 0 || dayOut > 0 ? (
                          <>
                            <View style={{ width: \\%\, backgroundColor: '#4ADE80' }} />
                            <View style={{ width: \\%\, backgroundColor: '#F87171' }} />
                          </>
                        ) : (
                          <View style={{ width: '100%', backgroundColor: '#E5E7EB' }} />
                        )}
                      </View>
                      
                      {dayTxs.length > 0 && (
                        <View style={{ marginTop: 12 }}>
                          {dayTxs.map((t: any, i: number) => (
                            <View key={'tx'+i} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
                              <Text style={{ fontSize: 11, color: '#6B7280' }}>• {t.vendor || t.category}</Text>
                              <Text style={{ fontSize: 11, color: t.type === 'in' ? '#16A34A' : '#EF4444' }}>{t.type === 'in' ? '+' : '-'}?{t.amount}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </View>
                    
                    {/* ACTIVITIES SECTION */}
                    <View style={{ backgroundColor: '#F9FAFB', padding: 16, borderRadius: 12 }}>
                      <Text style={{ fontFamily: 'Inter_600SemiBold', color: '#111827', marginBottom: 4 }}>Activities</Text>
                      <Text style={{ fontFamily: 'Inter_500Medium', color: '#6B7280', fontSize: 12, marginBottom: 12 }}>
                        {dayCount} {dayCount === 1 ? 'activity' : 'activities'} completed.
                      </Text>
                      
                      {dayEvents.length > 0 ? (
                        dayEvents.map((e: any, i: number) => (
                          <View key={'ev'+i} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                            <CheckCircle color="#16A34A" size={14} style={{ marginRight: 6 }} />
                            <Text style={{ fontSize: 12, color: '#374151', flex: 1 }}>{e.title}</Text>
                          </View>
                        ))
                      ) : (
                        <Text style={{ fontSize: 12, color: '#9CA3AF', fontStyle: 'italic' }}>No activities logged this day.</Text>
                      )}
                    </View>
                  </ScrollView>
                </>
              );
            })()}
          </View>
        </View>
      </Modal>\n\n\;

if (startIdx !== -1) {
  content = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync('app/(drawer)/reports.tsx', content, 'utf-8');
  console.log('Modal patched using JS');
} else {
  console.log('Target not found');
}
