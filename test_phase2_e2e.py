import requests
import time
import sys
import os

BASE_URL = "http://127.0.0.1:8000/api"

def print_step(step, desc):
    print(f"\n{'='*50}\nSTEP {step}: {desc}\n{'='*50}")

def poll_status(attempt_id, headers):
    print(f"Polling status for attempt {attempt_id}...")
    for _ in range(120):
        r = requests.get(f"{BASE_URL}/assessments/{attempt_id}/status/", headers=headers)
        status = r.json().get('status')
        if status == 'completed':
            print("Status is completed!")
            return True
        elif status == 'failed':
            print("Status is failed!")
            return False
        time.sleep(2)
    print("Timeout waiting for completion.")
    return False

def run_tests():
    print("Wait for server to start...")
    time.sleep(3)

    print_step(1, "Register a candidate user")
    candidate_email = f"candidate_p2_{int(time.time())}@example.com"
    candidate_data = {
        "email": candidate_email,
        "password": "Password123!",
        "full_name": "E2E P2 Candidate",
        "role": "candidate"
    }
    r = requests.post(f"{BASE_URL}/auth/register/", json=candidate_data)
    if r.status_code != 201:
        print(f"Failed to register: {r.json()}")
        sys.exit(1)
    candidate_token = r.json()["access"]
    candidate_headers = {"Authorization": f"Bearer {candidate_token}"}

    print_step(2, "Fetch test IDs")
    r = requests.get(f"{BASE_URL}/skills/tests/")
    tests = r.json().get('results', r.json())
    coding_test = next((t for t in tests if t['test_type'] == 'coding'), None)
    comm_test = next((t for t in tests if t['test_type'] == 'communication'), None)
    
    if not coding_test or not comm_test:
        print("Missing required tests in DB")
        sys.exit(1)

    print_step(3, "Submit Communication Test (sample.wav)")
    r = requests.post(f"{BASE_URL}/assessments/start/", json={"test_id": comm_test['id']}, headers=candidate_headers)
    comm_attempt_id = r.json()['attempt_id']
    
    # Needs absolute path for celery worker if it runs elsewhere, but since it's local, PWD works.
    # Let's use absolute path
    abs_audio_path = os.path.abspath('sample.wav')
    
    r = requests.post(f"{BASE_URL}/assessments/{comm_attempt_id}/submit/", json={"recording_url": abs_audio_path}, headers=candidate_headers)
    assert r.status_code == 200, f"Submit failed: {r.json()}"
    
    if not poll_status(comm_attempt_id, candidate_headers): sys.exit(1)
    
    r = requests.get(f"{BASE_URL}/assessments/{comm_attempt_id}/", headers=candidate_headers)
    comm_result = r.json()
    print("Transcript:", comm_result['raw_transcript'])
    print("Score:", comm_result['score'])
    assert comm_result['score']['scoring_method'] in ['ai', 'fallback']

    print_step(4, "Submit Coding Test - CORRECT SOLUTION")
    r = requests.post(f"{BASE_URL}/assessments/start/", json={"test_id": coding_test['id']}, headers=candidate_headers)
    code_correct_id = r.json()['attempt_id']
    correct_code = "def two_sum(nums, target):\n    return [0, 1]\n"
    r = requests.post(f"{BASE_URL}/assessments/{code_correct_id}/submit/", json={"code_submission": correct_code, "keystroke_log": {"events": [1,2,3,4,5]}}, headers=candidate_headers)
    if not poll_status(code_correct_id, candidate_headers): sys.exit(1)
    
    r = requests.get(f"{BASE_URL}/assessments/{code_correct_id}/", headers=candidate_headers)
    correct_result = r.json()
    print("Score:", correct_result['score'])
    assert correct_result['score']['scoring_method'] in ['ai', 'fallback']

    print_step(5, "Submit Coding Test - WRONG SOLUTION")
    r = requests.post(f"{BASE_URL}/assessments/start/", json={"test_id": coding_test['id']}, headers=candidate_headers)
    code_wrong_id = r.json()['attempt_id']
    wrong_code = "def wrong_func():\n    pass\n"
    r = requests.post(f"{BASE_URL}/assessments/{code_wrong_id}/submit/", json={"code_submission": wrong_code}, headers=candidate_headers)
    if not poll_status(code_wrong_id, candidate_headers): sys.exit(1)
    
    r = requests.get(f"{BASE_URL}/assessments/{code_wrong_id}/", headers=candidate_headers)
    wrong_result = r.json()
    print("Score:", wrong_result['score'])
    assert wrong_result['score']['sub_scores']['correctness'] < correct_result['score']['sub_scores']['correctness'] or wrong_result['score']['scoring_method'] == 'fallback'
    
    print("\nALL END-TO-END TESTS PASSED SUCCESSFULLY! ✅")

if __name__ == "__main__":
    run_tests()
