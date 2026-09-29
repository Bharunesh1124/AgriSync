import sys

with open('app/(drawer)/reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''const styles = StyleSheet.create({
  card: {'''

replacement = '''const styles = StyleSheet.create({
  gridCard: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2
  },
  card: {'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/reports.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Fixed styles")
else:
    print("Not found")
