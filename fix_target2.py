import sys

with open('src/contexts/ReportContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = "cropsActive: crops.length, cropActivities, livestockCount, healthRecords, livestockBreakdown"
replacement = "cropsActive: crops.length, cropActivities, cropBreakdown, livestockCount, healthRecords, livestockBreakdown"

if target in content:
    content = content.replace(target, replacement)
    with open('src/contexts/ReportContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Target 2 patched')
else:
    print('Target 2 still not found')
