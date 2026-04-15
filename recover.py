import re

with open('/Users/enningzzz/.gemini/antigravity/conversations/b66f3f4f-0be9-47da-9673-45736aa171b2.pb', 'rb') as f:
    content = f.read()

# the text is mixed with protobuf length prefixes, but usually large strings are contiguous.
# Let's clean out non-printable chars or just look for the pattern in bytes
import string
printable = bytes(string.printable, 'ascii')

try:
    s = content.decode('utf-8', errors='ignore')
    pattern = r"Showing lines 1 to 797.*?The following code has been modified.*?<original_line>.*?1: (import React, \{ useState, useEffect \} from 'react';.*?)(?:The above content shows the entire, complete file contents of the requested file\.|$)”"
    match = re.search(pattern, s, re.DOTALL)
    
    if match:
        block = match.group(1)
        lines = block.split('\n')
        
        result_lines = []
        for line in lines:
            m = re.match(r'^\d+:\s?(.*)', line)
            if m:
                result_lines.append(m.group(1))
            elif line.startswith('The above content shows the entire'):
                break
                
        with open('App.tsx.recovered', 'w') as out:
            out.write('\n'.join(result_lines) + '\n')
            
        print("Recovered {0} lines".format(len(result_lines)))
    else:
        # maybe simplified pattern
        pattern = r"1:\simport React, { useState, useEffect } from 'react';\n2:(.*?)\nThe above content shows"
        match = re.search(pattern, s, re.DOTALL)
        if match:
            block = "1: import React, { useState, useEffect } from 'react';\n2:" + match.group(1)
            lines = block.split('\n')
            result_lines = []
            for line in lines:
                m = re.match(r'^\d+:\s?(.*)', line)
                if m:
                    result_lines.append(m.group(1))
            
            with open('App.tsx.recovered', 'w') as out:
                out.write('\n'.join(result_lines) + '\n')
            
            print("Recovered {0} lines (method 2)".format(len(result_lines)))
        else:
            print("Pattern not found!")
except Exception as e:
    print(e)
