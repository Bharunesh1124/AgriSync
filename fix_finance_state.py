import sys

with open('app/(drawer)/finance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add State
state_target = '''  const [transactionsList, setTransactionsList] = useState<any[]>(
    DEFAULT_INITIAL_TRANSACTIONS,
  );'''

state_replacement = '''  const [transactionsList, setTransactionsList] = useState<any[]>(
    DEFAULT_INITIAL_TRANSACTIONS,
  );
  const [openingCashBalance, setOpeningCashBalance] = useState(81800);
  const [showEditBalanceModal, setShowEditBalanceModal] = useState(false);
  const [newBalanceInput, setNewBalanceInput] = useState("");
  
  const handleUpdateOpeningCash = async () => {
    const num = Number(newBalanceInput.replace(/,/g, ''));
    if (!isNaN(num)) {
      setOpeningCashBalance(num);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          await supabase.auth.updateUser({
            data: {
              inventory: {
                ...(user.user_metadata?.inventory || {}),
                cash_balance: num
              }
            }
          });
        }
      } catch (e) {
        console.warn('Error saving cash balance:', e);
      }
    }
    setShowEditBalanceModal(false);
  };'''
content = content.replace(state_target, state_replacement)


# 2. Update fetchTransactions
fetch_target = '''        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;'''

fetch_replacement = '''        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        if (user?.user_metadata?.inventory?.cash_balance !== undefined) {
          setOpeningCashBalance(Number(user.user_metadata.inventory.cash_balance));
        }'''
content = content.replace(fetch_target, fetch_replacement)


# 3. Replace openingCash hardcode
math_target = '''    const openingCash = 81800;'''
math_replacement = '''    const openingCash = openingCashBalance;'''
content = content.replace(math_target, math_replacement)


# 4. Add Edit button to UI
ui_target = '''                  <Wallet color="#ffffff" size={24} />
                </View>
                <View>
                  <Text
                    style={{
                      color: "#eef2ff",
                      fontFamily: "Inter_700Bold",
                      fontSize: 13,
                      marginBottom: 2,
                    }}
                  >
                    {t("available_cash")}
                  </Text>
                  <Text
                    style={{
                      color: "#ffffff",
                      fontFamily: "Inter_700Bold",
                      fontSize: 32,
                      letterSpacing: -0.5,
                    }}
                  >
                    {formatCurrency(totals.availableCash)}
                  </Text>
                </View>
              </View>'''

ui_replacement = '''                  <Wallet color="#ffffff" size={24} />
                </View>
                <View style={{ flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <View>
                    <Text
                      style={{
                        color: "#eef2ff",
                        fontFamily: "Inter_700Bold",
                        fontSize: 13,
                        marginBottom: 2,
                      }}
                    >
                      {t("available_cash")}
                    </Text>
                    <Text
                      style={{
                        color: "#ffffff",
                        fontFamily: "Inter_700Bold",
                        fontSize: 32,
                        letterSpacing: -0.5,
                      }}
                    >
                      {formatCurrency(totals.availableCash)}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => { setNewBalanceInput(String(openingCashBalance)); setShowEditBalanceModal(true); }} style={{ backgroundColor: 'rgba(255,255,255,0.2)', padding: 8, borderRadius: 20 }}>
                    <Text style={{ color: '#fff', fontSize: 12, fontWeight: '700' }}>Edit Start Balance</Text>
                  </TouchableOpacity>
                </View>
              </View>'''
content = content.replace(ui_target, ui_replacement)


# 5. Add Modal to the bottom
modal_target = '''    </View>
  );
}'''

modal_replacement = '''      {/* Edit Balance Modal */}
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
                <Text style={{ fontWeight: '700', color: '#fff' }}>Save Balance</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
}'''
content = content.replace(modal_target, modal_replacement)

with open('app/(drawer)/finance.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Finance patched successfully')
