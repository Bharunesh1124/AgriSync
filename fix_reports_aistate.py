import sys

with open('app/(drawer)/reports.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  const [selectedDay, setSelectedDay] = useState<any>(null);'''

replacement = '''  const [selectedDay, setSelectedDay] = useState<any>(null);
  const [aiSummary, setAiSummary] = useState<string>("Analyzing your farm data...");

  React.useEffect(() => {
    if (!isLoading && stats) {
      setAiSummary("Analyzing your farm data...");
      generateWeeklySummary(stats).then(setAiSummary);
    }
  }, [stats, isLoading]);'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/reports.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('AI State written to file')
else:
    print('Target not found')
