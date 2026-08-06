import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace the closing tag of sidebar div
sidebar_end = r'          )}' + '\n' + r'        </div>' + '\n'
# Find where the sidebar ends. It ends exactly before `{/* Dashboard Tab */}`
sidebar_end_exact = r'        </div>' + '\n\n' + r'        {/* Dashboard Tab */}'

# Add <AnimatePresence mode="wait">
replacement = r'        </div>' + '\n\n' + r'        <AnimatePresence mode="wait">' + '\n' + r'        {/* Dashboard Tab */}'
content = content.replace(sidebar_end_exact, replacement)

# Now find the end of the tabs. 
# It ends right before `      </div>` + '\n' + `    </div>` + '\n' + `  );` + '\n' + `}`
end_exact = r'      </div>' + '\n' + r'    </div>' + '\n' + r'  );' + '\n' + r'}'
end_replacement = r'        </AnimatePresence>' + '\n' + r'      </div>' + '\n' + r'    </div>' + '\n' + r'  );' + '\n' + r'}'

content = content.replace(end_exact, end_replacement)

# Also wrap the Dashboard tab in motion.div because right now it's `<>`
content = content.replace("{/* Dashboard Tab */}\n        {activeTab === 'Dashboard' && (\n          <>",
                          "{/* Dashboard Tab */}\n        {activeTab === 'Dashboard' && (\n          <motion.div key=\"dashboard\" variants={tabVariants} initial=\"hidden\" animate=\"show\" exit=\"exit\">")

content = content.replace("                </div>\n              </>\n            )}\n          </motion.div>\n        )}",
                          "                </div>\n              </>\n            )}\n          </motion.div>\n        )}")

with open(filepath, 'w') as f:
    f.write(content)

print("Wrapped with AnimatePresence")
