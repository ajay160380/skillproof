import re

filepath = 'src/pages/CandidateDashboard.tsx'
with open(filepath, 'r') as f:
    content = f.read()

# 1. Add Profile to sidebarItems
sidebar_replacement = """    {
      category: 'OVERVIEW',
      items: [
        { id: 'Profile', icon: '👤', label: 'Profile' },
        { id: 'Dashboard', icon: '📊', label: 'Dashboard' },"""
content = content.replace("""    {
      category: 'OVERVIEW',
      items: [
        { id: 'Dashboard', icon: '📊', label: 'Dashboard' },""", sidebar_replacement)

# 2. Add state for profile and projects
state_replacement = """  const [profile, setProfile] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);"""
content = re.sub(r'const \[loading, setLoading\] = useState\(true\);', state_replacement, content)

# 3. Add fetching for profile and projects
fetch_promise = """const [catsRes, testsRes, badgesRes, attemptsRes, followersRes, invitesRes, analyticsRes, jobsRes, profileRes, projectsRes] = await Promise.all([
          api.get('/skills/categories/'),
          api.get('/skills/tests/'),
          api.get('/badges/my-badges/'),
          api.get('/assessments/my-attempts/').catch(() => ({ data: { results: [] } })),
          api.get('/network/followers/').catch(() => ({ data: { count: 0, results: [] } })),
          api.get('/jobs/invites/').catch(() => ({ data: { results: [] } })),
          api.get('/assessments/analytics/').catch(() => ({ data: null })),
          api.get('/jobs/').catch(() => ({ data: { results: [] } })),
          api.get('/accounts/me/').catch(() => ({ data: null })),
          api.get('/portfolio/projects/').catch(() => ({ data: { results: [] } }))
        ]);"""
content = re.sub(r'const \[catsRes.*?\] = await Promise\.all\(\[.*?\]\);', fetch_promise, content, flags=re.DOTALL)

# 4. Set state for profile, projects, invites
set_states = """        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || []);
        
        if (profileRes.data) setProfile(profileRes.data);
        setProjects(Array.isArray(projectsRes.data) ? projectsRes.data : projectsRes.data.results || []);
        setInvites(Array.isArray(invitesRes.data) ? invitesRes.data : invitesRes.data.results || []);"""
content = content.replace("        setJobs(Array.isArray(jobsRes.data) ? jobsRes.data : jobsRes.data.results || []);", set_states)

with open(filepath, 'w') as f:
    f.write(content)

print("Dashboard updated successfully.")
