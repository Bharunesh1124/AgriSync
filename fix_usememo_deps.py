import sys

with open('app/(drawer)/finance.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = '''    };
  }, [transactionsList]);'''

replacement = '''    };
  }, [transactionsList, openingCashBalance]);'''

if target in content:
    content = content.replace(target, replacement)
    with open('app/(drawer)/finance.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print('useMemo deps fixed')
else:
    print('Target not found')
