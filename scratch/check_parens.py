
with open('App.tsx', 'r') as f:
    lines = f.readlines()

balance = 0
for i, line in enumerate(lines):
    open_count = line.count('(')
    close_count = line.count(')')
    balance += open_count - close_count
    if balance < 0:
        print(f"Broke at line {i+1}: {line.strip()} (Current balance: {balance})")
        # Reset balance to continue finding others if they exist
        balance = 0
