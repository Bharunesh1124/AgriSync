import sys

with open('app/(drawer)/index.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''  MapPin,
} from "lucide-react-native";'''

replacement = '''  MapPin,
  CheckCircle,
} from "lucide-react-native";'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/index.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('Replaced successfully')
else:
    print('Target not found')
