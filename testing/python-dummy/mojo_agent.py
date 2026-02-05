import requests
import json

class MojoGuardian:
    def __init__(self, api_key):
        self.api_key = api_key
        self.endpoint = "https://agenttestx-production-19d6.up.railway.app/api/agent/manifest"
        self.rules = {}

    def init(self):
        try:
            headers = {"Authorization": f"Bearer {self.api_key}"}
            response = requests.get(self.endpoint, headers=headers, timeout=10)
            if response.status_code == 200:
                self.rules = response.json().get("rules", {})
                return True
        except Exception as e:
            print(f"[Mojo] Error: {e}")
        return False

    def get_metadata(self, path):
        clean_path = "/" if path == "" else path.rstrip("/")
        return self.rules.get(clean_path)
