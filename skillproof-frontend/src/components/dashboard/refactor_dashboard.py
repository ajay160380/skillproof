import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add framer-motion import
if "import { motion, AnimatePresence } from 'framer-motion';" not in content:
    content = content.replace("import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';", "import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';\nimport { motion, AnimatePresence } from 'framer-motion';")

# 2. Add container variants
container_variants = """
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  },
  exit: { opacity: 0, transition: { duration: 0.2 } }
};

const tabVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
  exit: { opacity: 0, y: -10, transition: { duration: 0.2 } }
};
"""
if "const containerVariants =" not in content:
    content = re.sub(r'(export function CandidateDashboard\(\) \{)', r'\1\n' + container_variants, content)

# 3. Animate sidebar items
sidebar_btn = r'<button\s+key=\{item\.id\}\s+onClick=\{[^}]+\}\s+className=\{`([^`]+)`\}'
content = re.sub(sidebar_btn, r'<button key={item.id} onClick={() => setActiveTab(item.id)} className={`relative overflow-hidden group \1`}', content)
# It's easier to just do a manual replace for the sidebar item map to add a motion.div layoutId for the active state
old_sidebar_map = """                    {cat.items.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-widest transition-all ${activeTab === item.id ? 'bg-verification text-ink shadow-[0_4px_20px_-4px_rgba(16,185,129,0.4)]' : 'text-ink/60 hover:text-ink hover:bg-structure/5'}`}
                      >
                        <span className="text-sm">{item.icon}</span>
                        {item.label}
                      </button>
                    ))}"""

new_sidebar_map = """                    {cat.items.map(item => (
                      <button 
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`relative w-full flex items-center gap-3 px-4 py-2.5 rounded-xl font-mono text-[10px] uppercase font-bold tracking-widest transition-colors ${activeTab === item.id ? 'text-ink' : 'text-ink/60 hover:text-ink hover:bg-structure/5'}`}
                      >
                        {activeTab === item.id && (
                           <motion.div layoutId="activeTab" className="absolute inset-0 bg-verification shadow-[0_4px_20px_-4px_rgba(16,185,129,0.4)] rounded-xl" transition={{ type: "spring", stiffness: 300, damping: 25 }} />
                        )}
                        <span className="text-sm relative z-10">{item.icon}</span>
                        <span className="relative z-10">{item.label}</span>
                      </button>
                    ))}"""

content = content.replace(old_sidebar_map, new_sidebar_map)

# 4. Wrap the main content area in AnimatePresence and add motion.div to each tab content
# Content area starts around `<div className="flex-1 bg-vellum overflow-y-auto">`
# We'll replace `{activeTab === 'Dashboard' && (` with `<AnimatePresence mode="wait"> {activeTab === 'Dashboard' && ( <motion.div key="Dashboard" variants={tabVariants} initial="hidden" animate="show" exit="exit">`
# And add `</motion.div>` before the `)}`

# Let's do it using multi_replace_file_content instead, it's safer for large structural changes in TSX.
with open(filepath, 'w') as f:
    f.write(content)

print("Updated imports and sidebar in CandidateDashboard.tsx")
