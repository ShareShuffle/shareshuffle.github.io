#!/usr/bin/env python3
"""Install the reusable Tempo Account client on another Firebase Hosting target."""
from __future__ import annotations
import argparse, json, shutil
from pathlib import Path

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--target", required=True)
    parser.add_argument("--property-id", required=True)
    parser.add_argument("--property-name", required=True)
    args = parser.parse_args()

    repo = Path(args.repo).expanduser().resolve()
    firebase = json.loads((repo / "firebase.json").read_text())
    hosting = next(
        (entry for entry in firebase.get("hosting", []) if entry.get("target") == args.target),
        None,
    )
    if not hosting:
        raise RuntimeError(f"Hosting target {args.target!r} was not found.")

    public = repo / hosting["public"]
    account_dir = public / "account"
    account_dir.mkdir(parents=True, exist_ok=True)

    source = repo / "shared" / "tempo-account" / "web" / "tempo-account-client.js"
    if not source.exists():
        raise RuntimeError("Install Tempo Accounts 1.0 first.")
    shutil.copy2(source, account_dir / "tempo-account-client.js")

    config = f'''window.TEMPO_ACCOUNT_PROPERTY = {{
  id: {args.property_id!r},
  name: {args.property_name!r},
  accountName: "Tempo Account",
  loginPath: "/login",
  dashboardPath: "/dashboard",
}};
'''
    (account_dir / "property.js").write_text(config)
    print(f"Installed shared Tempo Account client into {account_dir}")
    print("Add product-specific login/dashboard HTML and API behavior before deployment.")

if __name__ == "__main__":
    main()
