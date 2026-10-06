import requests
import time
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def print_step(step, desc):
    print(f"\n{'='*50}\nSTEP {step}: {desc}\n{'='*50}")

def run_e2e_tests():
    print("Wait for server to start...")
    time.sleep(3)

    # 1. Register a candidate user
    print_step(1, "Register a candidate user")
    candidate_email = f"candidate_{int(time.time())}@example.com"
    candidate_data = {
        "email": candidate_email,
        "password": "Password123!",
        "full_name": "E2E Candidate",
        "role": "candidate"
    }
    r = requests.post(f"{BASE_URL}/auth/register/", json=candidate_data)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    if r.status_code != 201: sys.exit(1)
    candidate_token = r.json()["access"]
    candidate_headers = {"Authorization": f"Bearer {candidate_token}"}

    # Fetch a valid test_id from the seeded data
    print_step(2, "Fetch a valid test_id")
    r = requests.get(f"{BASE_URL}/skills/tests/")
    tests = r.json()
    tests_list = tests.get('results', tests)
    if not tests_list:
        print("No tests found. Did you run seed_skills?")
        sys.exit(1)
    test_id = tests_list[0]['id']
    print(f"Using test ID: {test_id}")

    # 2. Call POST /api/assessments/start/
    print_step(3, "Call POST /api/assessments/start/")
    r = requests.post(f"{BASE_URL}/assessments/start/", json={"test_id": test_id}, headers=candidate_headers)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    if r.status_code != 201: sys.exit(1)
    attempt_id = r.json()['attempt_id']

    # 3. Call POST /api/assessments/<id>/submit/
    print_step(4, "Call POST /api/assessments/<id>/submit/")
    submit_data = {
        "code_submission": "def two_sum(nums, target): return [0, 1]",
        "keystroke_log": {"events": []}
    }
    r = requests.post(f"{BASE_URL}/assessments/{attempt_id}/submit/", json=submit_data, headers=candidate_headers)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    if r.status_code != 200: sys.exit(1)

    # 4. Confirm status "completed" and SkillScore created
    print_step(5, "Confirm status 'completed' and SkillScore created")
    r = requests.get(f"{BASE_URL}/assessments/{attempt_id}/", headers=candidate_headers)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    attempt_data = r.json()
    assert attempt_data['status'] == 'completed', "Status is not completed"
    assert attempt_data['score'] is not None, "SkillScore not created"
    print("Success: Attempt is completed and score is generated.")

    # 5. Confirm Badge auto-created
    print_step(6, "Call GET /api/badges/my-badges/ and confirm Badge")
    r = requests.get(f"{BASE_URL}/badges/my-badges/", headers=candidate_headers)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    res_json = r.json()
    badges = res_json['results'] if 'results' in res_json else res_json
    assert len(badges) > 0, "No badges were found!"
    print(f"Success: Found {len(badges)} badge(s). Badge Level: {badges[0]['badge_level']}")

    # 6. Register a recruiter user
    print_step(7, "Register a recruiter user")
    recruiter_email = f"recruiter_{int(time.time())}@example.com"
    recruiter_data = {
        "email": recruiter_email,
        "password": "Password123!",
        "full_name": "E2E Recruiter",
        "role": "recruiter"
    }
    r = requests.post(f"{BASE_URL}/auth/register/", json=recruiter_data)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    if r.status_code != 201: sys.exit(1)
    recruiter_token = r.json()["access"]
    recruiter_headers = {"Authorization": f"Bearer {recruiter_token}"}

    # 7. Call GET /api/marketplace/candidates/
    print_step(8, "Call GET /api/marketplace/candidates/")
    r = requests.get(f"{BASE_URL}/marketplace/candidates/", headers=recruiter_headers)
    print(f"Status: {r.status_code}\nResponse: {r.json()}")
    candidates = r.json()['results'] if 'results' in r.json() else r.json()
    
    found = any(c['email'] == candidate_email for c in candidates)
    if not found:
        print(f"Error: Candidate {candidate_email} not found in marketplace!")
        sys.exit(1)
    
    print("Success: Candidate appeared in the marketplace search results.")
    print("\nALL END-TO-END TESTS PASSED SUCCESSFULLY! ✅")

if __name__ == "__main__":
    run_e2e_tests()
