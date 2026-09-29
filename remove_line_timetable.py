import sys

with open('app/(drawer)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''                        textDecorationLine:
                          t.status === "Completed" ? "line-through" : "none",'''

replacement = '''                        textDecorationLine: "none",'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Target not found')
