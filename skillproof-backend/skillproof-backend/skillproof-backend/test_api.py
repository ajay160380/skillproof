import requests
import time

BASE_URL = "http://127.0.0.1:8000/api/auth"

def test_auth():
    print("Wait a moment for the server to start...")
    time.sleep(3)

    # 1. Register
    register_data = {
        "email": "testcandidate2@example.com",
        "password": "SecurePassword123!",
        "full_name": "Test Candidate",
        "role": "candidate"
    }
    print(f"\n--- Testing POST /register/ ---")
    r1 = requests.post(f"{BASE_URL}/register/", json=register_data)
    print(f"Status: {r1.status_code}")
    print(f"Response: {r1.json()}")
    assert r1.status_code == 201

    # 2. Login
    login_data = {
        "email": "testcandidate2@example.com",
        "password": "SecurePassword123!"
    }
    print(f"\n--- Testing POST /login/ ---")
    r2 = requests.post(f"{BASE_URL}/login/", json=login_data)
    print(f"Status: {r2.status_code}")
    print(f"Response: {r2.json()}")
    assert r2.status_code == 200
    access_token = r2.json()["access"]

    # 3. Get Me
    headers = {
        "Authorization": f"Bearer {access_token}"
    }
    print(f"\n--- Testing GET /me/ ---")
    r3 = requests.get(f"{BASE_URL}/me/", headers=headers)
    print(f"Status: {r3.status_code}")
    print(f"Response: {r3.json()}")
    assert r3.status_code == 200

if __name__ == "__main__":
    test_auth()
