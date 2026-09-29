import sys

with open('app/(drawer)/finance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''      <Modal
        visible={showEditBalanceModal}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '85%' }}>'''

replacement = '''      <Modal
        visible={showEditBalanceModal}
        transparent
        animationType="fade"
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '90%', maxWidth: 360, shadowColor: '#000', shadowOffset: {width: 0, height: 10}, shadowOpacity: 0.1, shadowRadius: 20, elevation: 10 }}>'''

if target in content:
    content = content.replace(target, replacement)
    
    # Also adjust the text input styling
    target2 = '''            <TextInput
              style={{ backgroundColor: '#f8fafc', borderRadius: 12, padding: 16, fontSize: 16, fontWeight: '700', marginBottom: 24 }}'''
    replacement2 = '''            <TextInput
              style={{ backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 16, fontSize: 20, fontWeight: '700', marginBottom: 24, textAlign: 'center', color: '#0f172a' }}'''
    content = content.replace(target2, replacement2)

    with open('app/(drawer)/finance.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Modal UI fixed')
else:
    print('Target not found')
