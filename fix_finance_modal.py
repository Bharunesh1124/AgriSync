import sys

with open('app/(drawer)/finance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''        </View>
      </Modal>
    </>
  );
}'''

replacement = '''        </View>
      </Modal>
      
      {/* Edit Balance Modal */}
      <Modal
        visible={showEditBalanceModal}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '85%' }}>
            <Text style={{ fontFamily: 'Inter_700Bold', fontSize: 18, marginBottom: 16 }}>Set Starting Balance</Text>
            <Text style={{ color: '#64748b', marginBottom: 16, fontSize: 13 }}>Enter the actual cash/bank balance you currently have. We will save this securely and calculate your real-time available cash moving forward.</Text>
            
            <TextInput
              style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '700', marginBottom: 24 }}
              keyboardType="numeric"
              value={newBalanceInput}
              onChangeText={setNewBalanceInput}
              placeholder="e.g. 85000"
            />
            
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity onPress={() => setShowEditBalanceModal(false)} style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#f1f5f9', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#64748b' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleUpdateOpeningCash} style={{ flex: 1, padding: 16, borderRadius: 12, backgroundColor: '#16a34a', alignItems: 'center' }}>
                <Text style={{ fontWeight: '700', color: '#fff' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
}'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/finance.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Modal added successfully')
else:
    print('Target not found')
