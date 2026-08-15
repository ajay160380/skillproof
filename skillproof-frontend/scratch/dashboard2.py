import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# Replace dashboard grid with the updated one
grid_replacement = """                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">
                    <div className="col-span-1 md:col-span-2"><ProfileViewsWidget /></div>
                    <div className="col-span-1 md:col-span-2"><SalaryInsightsWidget badgesCount={allBadges.length} /></div>
                    <div className="col-span-1"><InterviewReadinessWidget /></div>
                    <div className="col-span-1"><TopCompaniesWidget /></div>
                    <div className="col-span-1 md:col-span-2"><NextMilestoneWidget badgesCount={allBadges.length} /></div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <RecentJobMatchesWidget jobs={jobs} />
                    <UpcomingInterviewsWidget invites={invites} />
                    <PortfolioWidget projects={projects} />
                  </div>"""

old_grid_regex = r'<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 auto-rows-fr">.*?<div className="col-span-1"><ExternalCertsWidget /></div>\s*</div>'
content = re.sub(old_grid_regex, grid_replacement, content, flags=re.DOTALL)

with open(filepath, 'w') as f:
    f.write(content)

print("Dashboard grid updated.")
