import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Check where to add the Profile tab
print(content[-500:])

