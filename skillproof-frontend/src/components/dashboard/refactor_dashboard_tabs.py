import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# We need to wrap each tab's content in a <motion.div>
# Since there are multiple tabs, we'll replace the `{activeTab === 'TabName' && (` with a `<AnimatePresence mode="wait">` block 
# and render a single switch case, or we can just wrap the inside of the && block.
# Actually, the simplest way is to replace `{activeTab === 'Dashboard' && (` with:
# `<AnimatePresence mode="wait">` around all of them is better, but since it's conditional rendering, we can just wrap the inner div with motion.div

def replace_tab(tab_name, content):
    pattern = r"\{\s*activeTab === '" + tab_name + r"'\s*&&\s*\(\s*(<div|<>\s*<div|<>\s*<\!|<>\s*<div[^>]*>.*?<div)"
    # We will just inject motion.div right inside the `( ... )`
    # It's safer to use regex to find `{activeTab === 'xyz' && (` and wrap the block.
    return content

# Let's just use a simpler regex for motion.div staggered grids
content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">', 
                          '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">')

content = content.replace('<div className="grid grid-cols-1 md:grid-cols-3 gap-6">', 
                          '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-3 gap-6">')

content = content.replace('<div className="grid grid-cols-1 md:grid-cols-2 gap-6">', 
                          '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-6">')

content = content.replace('<div className="grid grid-cols-1 gap-6">', 
                          '<motion.div variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 gap-6">')

# Close tags for motion.div grids (since we replaced <div className="grid ..."> with <motion.div>)
# We can't simply replace </div> because there are many. We need to do it precisely.
# A small hack is to change the opening tag to <motion.div and then closing tag manually.
pass

