#!/usr/bin/env python3
"""
Mission Control Onboarding Script

Creates a user + API key in one shot and prints a ready-to-use .env snippet.

Usage:
  python onboard.py                        # interactive prompts
  python onboard.py "My Agent" agent       # non-interactive
  python onboard.py "Alice" human          # human user
"""

import sys
import os
import json
import urllib.request
import urllib.error

def load_convex_url():
    """Try to read CONVEX_URL from .env.local or environment."""
    url = os.getenv("CONVEX_URL") or os.getenv("NEXT_PUBLIC_CONVEX_URL")
    if url:
        return url

    env_file = os.path.join(os.path.dirname(__file__), ".env.local")
    if os.path.exists(env_file):
        with open(env_file) as f:
            for line in f:
                line = line.strip()
                if line.startswith("NEXT_PUBLIC_CONVEX_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
                if line.startswith("CONVEX_URL="):
                    return line.split("=", 1)[1].strip().strip('"').strip("'")
    return None


def onboard(name, user_type="agent", key_name=None, convex_url=None):
    if not convex_url:
        convex_url = load_convex_url()

    if not convex_url:
        print("ERROR: Could not find CONVEX_URL.")
        print("  Run 'npx convex dev' first, or set CONVEX_URL in your environment.")
        sys.exit(1)

    convex_url = convex_url.rstrip("/")
    endpoint = f"{convex_url}/api/onboard"

    payload = json.dumps({
        "name": name,
        "type": user_type,
        "keyName": key_name or f"{name} key",
    }).encode()

    req = urllib.request.Request(
        endpoint,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urllib.request.urlopen(req) as resp:
            result = json.loads(resp.read())
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        print(f"ERROR {e.code}: {body}")
        sys.exit(1)
    except urllib.error.URLError as e:
        print(f"ERROR: Could not reach {endpoint}")
        print(f"  {e.reason}")
        print("  Is 'npx convex dev' running?")
        sys.exit(1)

    icon = "🤖" if user_type == "agent" else "👤"
    print(f"\n{icon}  Created {user_type}: {name}")
    print(f"   User ID : {result['userId']}")
    print(f"   Key ID  : {result['keyId']}")
    print()
    print("─" * 50)
    print("  Copy this .env block:")
    print("─" * 50)
    print(f"""
CONVEX_URL={result['convexUrl']}
API_KEY={result['apiKey']}
USER_ID={result['userId']}
""")
    print("─" * 50)
    print("  Then use the CLI:")
    print()
    print(f"    export CONVEX_URL={result['convexUrl']}")
    print(f"    export API_KEY={result['apiKey']}")
    print(f"    export USER_ID={result['userId']}")
    print()
    print("    python agent_cli.py tasks list")
    print()
    print("  WARNING: Save the API_KEY now — it won't be shown again.")
    print()


def main():
    args = sys.argv[1:]

    if len(args) >= 2:
        # Non-interactive: python onboard.py "Name" agent
        name = args[0]
        user_type = args[1] if args[1] in ("human", "agent") else "agent"
    elif len(args) == 1:
        name = args[0]
        user_type = "agent"
    else:
        # Interactive
        print("Mission Control — New User Onboarding")
        print()
        name = input("Name (person or agent): ").strip()
        if not name:
            print("ERROR: Name is required.")
            sys.exit(1)
        raw_type = input("Type [agent/human] (default: agent): ").strip().lower()
        user_type = "human" if raw_type == "human" else "agent"

    onboard(name, user_type)


if __name__ == "__main__":
    main()
