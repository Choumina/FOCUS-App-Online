import re
import os

log_file = "/Users/enningzzz/.gemini/antigravity/brain/b66f3f4f-0be9-47da-9673-45736aa171b2/.system_generated/logs/overview.txt"
with open(log_file, "r") as f:
    text = f.read()

# We need to find the view_file block for App.tsx that showed lines 1 to 797.
# It starts with "File Path: `file:///Users/enningzzz/Downloads/-Focus-AI-3.0-main/App.tsx`"
# "Total Lines: 797"
# "Showing lines 1 to 797"
# "1: import React, { useState, useEffect } from 'react';"
# and ends with "The above content shows the entire, complete file contents of the requested file."

pattern = r"Showing lines 1 to 797\n.*?\n1:(.*?)\nThe above content shows the entire, complete file contents of the requested file\."
match = re.search(pattern, text, re.DOTALL)

if match:
    lines_block = match.group(0)
    lines = lines_block.split("\n")[2:-1] # Skip 'Showing lines...' and 'The following code...'
    
    app_tsx = []
    for line in lines:
        if line.strip() == "":
            pass # empty line? wait, they have line numbers
        
        # parse the line number
        m = re.match(r"^\d+:\s?(.*)", line)
        if m:
            app_tsx.append(m.group(1))
        elif line.startswith("The above content shows"):
            break
            
    with open("App.tsx", "w") as f:
        f.write("\n".join(app_tsx) + "\n")
    print("Successfully restored App.tsx")
else:
    print("Could not find block")
