# Repository Structure

When working on this project, ALWAYS remember the following repository structure:

1. **Backend Repository (`skillproof`)**: 
   - The root directory (`/Users/ajayvishwakarma/Desktop/SkillProof/`) is tracked by the backend repository (`ajay160380/skillproof`).
   - Do NOT commit frontend changes to this repository.
   
2. **Frontend Repository (`skillproof-frontend`)**:
   - The frontend is a completely separate Git repository located in the `skillproof-frontend` directory (`/Users/ajayvishwakarma/Desktop/SkillProof/skillproof-frontend/`).
   - It is tracked by `ajay160380/skillproof-frontend`.
   - Any frontend-related git commands (add, commit, push) MUST be run by changing directory into `skillproof-frontend` first (e.g., `cd skillproof-frontend && git push`).

Never mix the two repositories or push frontend code into the backend repository.
