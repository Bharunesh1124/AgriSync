import sys

with open('app/(drawer)/reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

idx = content.rfind('</Modal>')
if idx != -1:
    content = content[:idx + 8]
    footer = '''
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  }
});
'''
    content += footer
    with open('app/(drawer)/reports.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed EOF")
else:
    print("Not found")
