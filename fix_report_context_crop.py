import sys

with open('src/contexts/ReportContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    const cropActivities = periodEvents.filter(e => e.category === 'Crop').length;
    
    const livestockCount = livestock.reduce((acc, curr) => acc + Number(curr.count || 0), 0);'''

replacement = '''    const cropEvents = periodEvents.filter(e => e.category === 'Crop' || e.category === 'Water');
    const cropActivities = cropEvents.length;
    
    let cIrrigation = 0, cFertilizer = 0, cInspection = 0, cPest = 0;
    cropEvents.forEach(e => {
      const t = e.title.toLowerCase();
      if (t.includes('irrig') || t.includes('water')) cIrrigation++;
      else if (t.includes('fertil') || t.includes('nutrient')) cFertilizer++;
      else if (t.includes('pest') || t.includes('spray')) cPest++;
      else cInspection++;
    });
    
    const cropBreakdown = [
      { n: 'Irrigation', v: cIrrigation, c: '#22C55E', pct: 0 },
      { n: 'Fertilizer', v: cFertilizer, c: '#3B82F6', pct: 0 },
      { n: 'Inspection', v: cInspection, c: '#F59E0B', pct: 0 },
      { n: 'Pest mon', v: cPest, c: '#8B5CF6', pct: 0 }
    ].filter(i => i.v > 0);
    const cropTot = cropBreakdown.reduce((acc, curr) => acc + curr.v, 0);
    cropBreakdown.forEach(c => c.pct = cropTot > 0 ? Math.round((c.v / cropTot) * 100) : 0);
    
    const livestockCount = livestock.reduce((acc, curr) => acc + Number(curr.count || 0), 0);'''

if target in content:
    content = content.replace(target, replacement)
else:
    print('Target 1 not found')

target2 = '''        cropsActive: crops.length, cropActivities, livestockCount, healthRecords, livestockBreakdown'''
replacement2 = '''        cropsActive: crops.length, cropActivities, cropBreakdown, livestockCount, healthRecords, livestockBreakdown'''

if target2 in content:
    content = content.replace(target2, replacement2)
    with open('src/contexts/ReportContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('ReportContext crop patched')
else:
    print('Target 2 not found')
