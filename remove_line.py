import sys

with open('app/(drawer)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace('textDecorationLine: isDone ? "line-through" : "none"', 'textDecorationLine: "none"')

with open('app/(drawer)/index.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
print('Line removed successfully')
