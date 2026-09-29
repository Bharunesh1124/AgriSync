import sys

with open('src/contexts/FarmEventContext.tsx', 'r', encoding='utf-8') as f:
    lines = f.readlines()

new_lines = []
in_events = False
for line in lines:
    if "setEvents([" in line:
        in_events = True
        new_lines.append(line)
        new_lines.append("        { id: '1', title: 'Apply Pesticides', subtitle: 'Wheat Field A', date: today, time: '06:00 AM', category: 'Crop', priority: 'High', status: 'Completed', preparation: ['Mix pesticide', 'Check wind speed'] },\n")
        new_lines.append("        { id: '2', title: 'Irrigate Fields', subtitle: 'Field A & B', date: today, time: '08:00 AM', category: 'Water', priority: 'High', status: 'Overdue', preparation: ['Check water pump fuel'] },\n")
        new_lines.append("        { id: '3', title: 'Morning Feed', subtitle: 'Poultry & Cattle', date: today, time: '11:00 AM', category: 'Livestock', priority: 'Medium', status: 'Pending' },\n")
        new_lines.append("        { id: '4', title: 'Field inspection', subtitle: 'Wheat Field B', date: today, time: '03:00 PM', category: 'Crop', priority: 'Low', status: 'Pending' },\n")
        new_lines.append("        { id: '5', title: 'Equipment Maintenance', subtitle: 'Clean Tractor', date: today, time: '05:00 PM', category: 'General', priority: 'Medium', status: 'Pending' },\n")
        new_lines.append("        { id: '6', title: 'Evening Feed', subtitle: 'Cattle & Goats', date: today, time: '06:30 PM', category: 'Livestock', priority: 'Medium', status: 'Pending' },\n")
        new_lines.append("        { id: '7', title: 'Apply Fertilizer', subtitle: 'Rice Field C', date: tomorrow, time: '07:00 AM', category: 'Crop', priority: 'High', status: 'Pending', preparation: ['Load fertilizer', 'Check soil moisture'] },\n")
        new_lines.append("        { id: '8', title: 'Check Soil Moisture', subtitle: 'All Fields', date: tomorrow, time: '10:00 AM', category: 'General', priority: 'High', status: 'Pending' },\n")
        continue
        
    if in_events:
        if "]);" in line:
            in_events = False
            new_lines.append(line)
    else:
        new_lines.append(line)

with open('src/contexts/FarmEventContext.tsx', 'w', encoding='utf-8') as f:
    f.writelines(new_lines)
print('Done!')
