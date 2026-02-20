import json
import sys

try:
    with open('eslint-report.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
        
    counts = []
    for f in data:
        errors = len([m for m in f.get('messages', []) if m.get('ruleId') == '@typescript-eslint/no-explicit-any'])
        if errors > 0:
            counts.append({
                'file': f.get('filePath', '').split('LIAMED\\\\')[-1],
                'errors': errors
            })
            
    counts.sort(key=lambda x: x['errors'], reverse=True)
    
    print("Files with 'any' types:")
    for c in counts[:20]:
        print(f"{c['errors']} -> {c['file']}")
    print(f"\nTotal files needing fix: {len(counts)}")
    
except Exception as e:
    print(f"Error parsing json: {e}")
