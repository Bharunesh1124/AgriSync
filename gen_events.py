import sys

with open('src/contexts/FarmEventContext.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
skip = False
for line in lines:
    if "useEffect(() => {" in line:
        skip = True
        new_lines.append(line)
        new_lines.append('''
      const generatedEvents: FarmEvent[] = [];
      const baseDate = new Date();
      let eventId = 1;

      for (let i = -7; i <= 7; i++) {
        const d = new Date(baseDate);
        d.setDate(baseDate.getDate() + i);
        const dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
        
        // Every day tasks
        generatedEvents.push({ id: String(eventId++), title: 'Morning Feed', subtitle: 'Poultry & Cattle', date: dateStr, time: '06:30 AM', category: 'Livestock', priority: 'High', status: i < 0 ? 'Completed' : (i === 0 ? 'Pending' : 'Pending') });
        generatedEvents.push({ id: String(eventId++), title: 'Field Inspection', subtitle: 'All active fields', date: dateStr, time: '10:00 AM', category: 'Crop', priority: 'Medium', status: i < 0 ? 'Completed' : 'Pending' });
        generatedEvents.push({ id: String(eventId++), title: 'Evening Feed', subtitle: 'Cattle & Goats', date: dateStr, time: '05:30 PM', category: 'Livestock', priority: 'High', status: i < 0 ? 'Completed' : 'Pending' });

        // Alternating tasks
        if (i % 2 === 0) {
          generatedEvents.push({ id: String(eventId++), title: 'Irrigate Fields', subtitle: 'Field A & B', date: dateStr, time: '08:00 AM', category: 'Water', priority: 'High', status: i < 0 ? 'Completed' : (i === 0 ? 'Overdue' : 'Pending'), preparation: ['Check water pump fuel'] });
        } else {
          generatedEvents.push({ id: String(eventId++), title: 'Equipment Maintenance', subtitle: 'Clean & fuel tractors', date: dateStr, time: '02:00 PM', category: 'General', priority: 'Low', status: i < 0 ? 'Completed' : 'Pending' });
        }

        if (i % 3 === 0) {
          generatedEvents.push({ id: String(eventId++), title: 'Apply Pesticides / Fertilizer', subtitle: 'Wheat Field A', date: dateStr, time: '07:00 AM', category: 'Crop', priority: 'Medium', status: i < 0 ? 'Completed' : 'Pending' });
        }
      }
      
      setEvents(generatedEvents);
    }, []);
''')
        continue
        
    if skip and "}, []);" in line:
        skip = False
        continue
        
    if not skip:
        new_lines.append(line)

with open('src/contexts/FarmEventContext.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done generator')
