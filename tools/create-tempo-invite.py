#!/usr/bin/env python3
from __future__ import annotations
import argparse
from datetime import datetime, timedelta, timezone
import hashlib, json, secrets, sys
from pathlib import Path
from urllib.parse import quote

def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo", required=True)
    parser.add_argument("--handle", required=True)
    parser.add_argument("--reserved-for", required=True)
    parser.add_argument("--property", default="linkwombat")
    parser.add_argument("--relationship", default="")
    parser.add_argument("--purpose", default="")
    parser.add_argument("--role", default="founding-teacher")
    parser.add_argument("--base-url", default="https://linkwombat.web.app")
    parser.add_argument("--days", type=int, default=180)
    args = parser.parse_args()

    repo = Path(args.repo).expanduser().resolve()
    private_dir = repo / ".tempo-private"
    private_dir.mkdir(parents=True, exist_ok=True)

    handle = args.handle.strip().lower()
    token_file = private_dir / f"{args.property}-{handle}-invite-token.txt"
    output_file = private_dir / f"{args.property}-{handle}-invite-url.txt"

    if token_file.exists():
        token = token_file.read_text().strip()
    else:
        token = secrets.token_urlsafe(32)
        token_file.write_text(token + "\n")
        token_file.chmod(0o600)

    token_hash = hashlib.sha256(token.encode("utf8")).hexdigest()
    expires = datetime.now(timezone.utc) + timedelta(days=args.days)

    invite_path = repo / "functions" / "tempo-invites.generated.json"
    if invite_path.exists():
        data = json.loads(invite_path.read_text())
    else:
        data = {"version": 1, "invites": []}

    invites = data.setdefault("invites", [])
    invite = {
        "tokenHash": token_hash,
        "property": args.property,
        "handle": handle,
        "reservedFor": args.reserved_for,
        "relationship": args.relationship or None,
        "purpose": args.purpose or None,
        "role": args.role,
        "priceWaived": True,
        "publicProfileEnabled": False,
        "publicLinkListingEnabled": False,
        "expiresAt": expires.isoformat().replace("+00:00", "Z"),
    }

    replaced = False
    for index, existing in enumerate(invites):
        if (
            existing.get("property") == args.property
            and existing.get("handle") == handle
        ):
            if existing.get("tokenHash") == token_hash and existing.get("expiresAt"):
                invite["expiresAt"] = existing["expiresAt"]
            invites[index] = invite
            replaced = True
            break

    if not replaced:
        invites.append(invite)

    invite_path.write_text(json.dumps(data, indent=2) + "\n")

    # Reserve the bare username route without intercepting unrelated
    # one-segment LinkWombat shortcuts. Each invited handle gets one exact
    # Hosting rewrite placed before the existing catch-all resolver.
    firebase_path = repo / "firebase.json"
    firebase = json.loads(firebase_path.read_text())
    hosting = next(
        (
            entry
            for entry in firebase.get("hosting", [])
            if entry.get("target") == "wombat"
        ),
        None,
    )
    if not hosting:
        raise RuntimeError("Firebase Hosting target 'wombat' was not found.")

    rewrites = hosting.setdefault("rewrites", [])
    root_rule = {
        "source": f"/{handle}",
        "function": {
            "functionId": "wombatMemberResolve",
            "region": "us-central1",
        },
    }

    if root_rule not in rewrites:
        insert_at = len(rewrites)
        for index, rule in enumerate(rewrites):
            if rule.get("source") in ("/**", "**"):
                insert_at = index
                break
        rewrites.insert(insert_at, root_rule)
        firebase_path.write_text(json.dumps(firebase, indent=2) + "\n")

    base = args.base_url.rstrip("/")
    url = f"{base}/invite/#code={quote(token)}"
    custom_url = f"https://linkwombat.com/invite/#code={quote(token)}"

    output = (
        "TIFFANY HILL — LINKWOMBAT FOUNDING TEACHER INVITATION\n\n"
        f"Guaranteed Firebase Hosting URL:\n{url}\n\n"
        f"Custom-domain URL (use after linkwombat.com login is verified):\n"
        f"{custom_url}\n\n"
        "The code is stored only after the # symbol, so browsers do not send it "
        "as part of ordinary page requests or referrer headers.\n"
    )

    output_file.write_text(output)
    output_file.chmod(0o600)
    print(output)
    print(f"Private invitation record: {output_file}")

if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise
