import re
with open('/Users/enningzzz/.gemini/antigravity/conversations/b66f3f4f-0be9-47da-9673-45736aa171b2.pb', 'rb') as f:
    s = f.read().decode('utf-8', errors='ignore')

# Find string that looks like "File Path: `file:///Users/enningzzz/Downloads/-Focus-AI-3.0-main/App.tsx`"
# down to "1: import React"
matches = re.finditer(r'1: import React, { useState, useEffect } from.*?export default App;', s, re.DOTALL)
for i, m in enumerate(matches):
    print(f"Match {i} length: {len(m.group(0))}")
    with open(f'App_extracted_{i}.txt', 'w') as out:
        out.write(m.group(0))
