import re

filepath = 'src/components/dashboard/DashboardWidgets.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Add framer-motion import
if "import { motion } from 'framer-motion';" not in content:
    content = content.replace("import React from 'react';", "import React from 'react';\nimport { motion } from 'framer-motion';")

# Replace outer div with motion.div for widgets
# We want to replace the first <div className="bg-white/60... or <div className="bg-ink... or <div className="bg-gradient... 
# inside each widget export with <motion.div

# Pattern to match: export const WidgetName = (...) => ( <div className="..."
pattern = r'(export const \w+ = .*?=> \(\s*)<div (className="(?:bg-white/60|bg-ink|bg-gradient|bg-verification)[^"]*")>'

# Replacement
replacement = r'\1<motion.div variants={itemVariants} whileHover={{ y: -4, scale: 1.01 }} transition={{ type: "spring", stiffness: 300, damping: 20 }} \2>'

# Add itemVariants definition at the top of the file
item_variants = """
export const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  show: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 300, damping: 24 } }
};
"""
if "export const itemVariants" not in content:
    content = content.replace("import { motion } from 'framer-motion';", "import { motion } from 'framer-motion';\n" + item_variants)

content = re.sub(pattern, replacement, content)

# Don't forget to replace closing </div> with </motion.div> for the outer div.
# This is tricky with regex, but since we know each widget ends with `  </div>\n);`, we can replace that!
content = re.sub(r'  </div>\n\);', r'  </motion.div>\n);', content)

with open(filepath, 'w') as f:
    f.write(content)

print("Updated DashboardWidgets.tsx")
