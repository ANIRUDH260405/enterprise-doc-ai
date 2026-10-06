import os
import requests

API_BASE = "http://127.0.0.1:8000/api/v1"
EMAIL = "test@example.com"
PASSWORD = "testpass123"

DATASET_ROOT = r"D:\enterprise-doc-ai\railway_dataset"
CATEGORY_FOLDERS = ["rules", "manuals", "technical"]


def login():
    r = requests.post(f"{API_BASE}/auth/login", json={"email": EMAIL, "password": PASSWORD})
    r.raise_for_status()
    return r.json()["access_token"]


def upload_file(token, filepath):
    headers = {"Authorization": f"Bearer {token}"}
    filename = os.path.basename(filepath)
    content_type = "application/pdf" if filepath.endswith(".pdf") else "text/plain"
    with open(filepath, "rb") as f:
        files = {"file": (filename, f, content_type)}
        r = requests.post(f"{API_BASE}/documents/upload", headers=headers, files=files, timeout=300)
    if r.status_code == 201:
        print(f"  OK   {filename} -> status: {r.json().get('status')}")
    else:
        print(f"  FAIL {filename} -> {r.status_code}: {r.text[:200]}")


def main():
    token = login()
    print("Logged in. Uploading dataset...\n")

    for category in CATEGORY_FOLDERS:
        folder = os.path.join(DATASET_ROOT, category)
        if not os.path.isdir(folder):
            print(f"Skipping missing folder: {folder}")
            continue
        print(f"-- {category} --")
        for filename in os.listdir(folder):
            filepath = os.path.join(folder, filename)
            if os.path.isfile(filepath):
                upload_file(token, filepath)
        print()


if __name__ == "__main__":
    main()
