import sys

with open('app/(drawer)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => {
              const dNum = 14 + i;
              const dateStr = 2026-09-\;
              const active = dateStr === selectedDate;

              const dayEvs = events.filter((e) => e.date === dateStr);

              return (
                <TouchableOpacity
                  key={day}
                  onPress={() => setSelectedDate(dateStr)}'''

replacement = '''            {Array.from({ length: 7 }).map((_, i) => {
              const d = new Date(todayObj);
              const currentDay = d.getDay() === 0 ? 7 : d.getDay();
              d.setDate(d.getDate() - currentDay + 1 + i);
              
              const day = d.toLocaleDateString('en-US', { weekday: 'short' });
              const dNum = d.getDate();
              const dateStr = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
              const active = dateStr === selectedDate;

              const dayEvs = events.filter((e) => e.date === dateStr);

              return (
                <TouchableOpacity
                  key={dateStr}
                  onPress={() => setSelectedDate(dateStr)}'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Target not found')
