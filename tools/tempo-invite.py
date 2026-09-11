#!/usr/bin/env python3
from __future__ import annotations

import argparse
from datetime import datetime, timedelta, timezone
import hashlib
import json
import re
import secrets
import sys
from pathlib import Path
from urllib.parse import quote

HANDLE_RE = re.compile(r"^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$")


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


def iso(value: datetime) -> str:
    return value.isoformat().replace("+00:00", "Z")


def slug(value: str, fallback: str = "invite") -> str:
    cleaned = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return cleaned or fallback


def load_registry(repo: Path) -> dict:
    path = repo / "config" / "tempo-properties.json"
    if not path.exists():
        raise RuntimeError("Tempo Invites 2.0 is not installed.")
    return json.loads(path.read_text())


def load_config(repo: Path) -> tuple[Path, dict]:
    path = repo / "functions" / "tempo-invites.generated.json"
    if path.exists():
        data = json.loads(path.read_text())
    else:
        data = {"version": 2, "invites": []}

    data["version"] = 2
    data.setdefault("invites", [])
    return path, data


def save_config(path: Path, data: dict) -> None:
    path.write_text(json.dumps(data, indent=2) + "\n")


def property_record(registry: dict, property_id: str) -> dict:
    record = registry.get("properties", {}).get(property_id)
    if not record:
        choices = ", ".join(sorted(registry.get("properties", {})))
        raise ValueError(f"Unknown property {property_id!r}. Choose: {choices}")
    return record


def migrate_invite(raw: dict, registry: dict) -> dict:
    item = dict(raw)
    property_id = str(item.get("property") or "").strip().lower()
    record = registry.get("properties", {}).get(property_id, {})

    handle = str(item.get("handle") or "").strip().lower() or None
    token_hash = str(item.get("tokenHash") or "").strip().lower()
    item["id"] = item.get("id") or (
        f"{property_id}-{handle or token_hash[:12] or 'invite'}"
    )
    item["property"] = property_id
    item["handle"] = handle
    item["maxClaims"] = int(item.get("maxClaims") or 1)
    item["features"] = list(item.get("features") or [])
    item["redirectPath"] = (
        item.get("redirectPath")
        or record.get("defaultRedirect")
        or "/"
    )
    item["allowedEmail"] = item.get("allowedEmail") or None
    item["allowedDomain"] = item.get("allowedDomain") or None
    item["badge"] = item.get("badge") or None
    item["cohort"] = item.get("cohort") or None
    item["revokedAt"] = item.get("revokedAt") or None
    item["createdAt"] = item.get("createdAt") or None
    item.setdefault("priceWaived", False)
    item.setdefault("publicProfileEnabled", False)
    item.setdefault("publicLinkListingEnabled", False)
    return item


def migrate_all(repo: Path) -> dict:
    registry = load_registry(repo)
    path, data = load_config(repo)
    data["invites"] = [
        migrate_invite(item, registry)
        for item in data.get("invites", [])
    ]
    save_config(path, data)
    return data


def private_directory(repo: Path) -> Path:
    path = repo / ".tempo-private" / "invites"
    path.mkdir(parents=True, exist_ok=True)
    try:
        path.chmod(0o700)
    except PermissionError:
        pass
    return path


def invitation_url(record: dict, token: str) -> str:
    return (
        f"{record['baseUrl'].rstrip('/')}"
        f"/invite/#code={quote(token)}"
    )


def find_invite(data: dict, invitation_id: str) -> tuple[int, dict]:
    for index, invite in enumerate(data.get("invites", [])):
        if invite.get("id") == invitation_id:
            return index, invite
    raise ValueError(f"Invitation {invitation_id!r} was not found.")


def write_action(repo: Path, payload: dict) -> None:
    directory = private_directory(repo)
    path = directory.parent / "last-invite-action.json"
    path.write_text(json.dumps(payload, indent=2) + "\n")
    try:
        path.chmod(0o600)
    except PermissionError:
        pass


def create_invitation(
    repo: Path,
    *,
    property_id: str,
    role: str,
    reserved_for: str = "",
    handle: str = "",
    allowed_email: str = "",
    allowed_domain: str = "",
    purpose: str = "",
    relationship: str = "",
    features: list[str] | None = None,
    badge: str = "",
    cohort: str = "",
    max_claims: int = 1,
    days: int = 90,
    redirect_path: str = "",
    price_waived: bool = False,
    invitation_id: str = "",
) -> dict:
    registry = load_registry(repo)
    record = property_record(registry, property_id)
    config_path, data = load_config(repo)
    data["invites"] = [
        migrate_invite(item, registry)
        for item in data.get("invites", [])
    ]

    normalized_handle = handle.strip().lower()
    if normalized_handle and not HANDLE_RE.fullmatch(normalized_handle):
        raise ValueError(
            "Handles may contain lowercase letters, numbers, and meaningful hyphens."
        )

    if normalized_handle and not record.get("supportsHandles"):
        raise ValueError(f"{record['name']} invitations do not use handles.")

    if normalized_handle and max_claims != 1:
        raise ValueError("An invitation reserving a handle must be one-use.")

    if max_claims < 1 or max_claims > 10000:
        raise ValueError("maxClaims must be between 1 and 10000.")

    role_value = role.strip() or record.get("defaultRole") or "member"
    basis = normalized_handle or reserved_for or role_value
    invitation_id = invitation_id.strip() or (
        f"{property_id}-{slug(basis)}-"
        f"{utc_now().strftime('%Y%m%d')}-"
        f"{secrets.token_hex(3)}"
    )

    if any(item.get("id") == invitation_id for item in data["invites"]):
        raise ValueError(f"Invitation ID {invitation_id!r} already exists.")

    token = secrets.token_urlsafe(32)
    token_hash = hashlib.sha256(token.encode("utf8")).hexdigest()
    created_at = utc_now()
    expires_at = (
        None
        if days == 0
        else iso(created_at + timedelta(days=days))
    )

    invite = {
        "id": invitation_id,
        "tokenHash": token_hash,
        "property": property_id,
        "handle": normalized_handle or None,
        "reservedFor": reserved_for.strip() or None,
        "relationship": relationship.strip() or None,
        "purpose": purpose.strip() or None,
        "role": role_value,
        "features": sorted(
            {
                value.strip()
                for value in (features or [])
                if value.strip()
            }
        ),
        "badge": badge.strip() or None,
        "cohort": cohort.strip() or None,
        "priceWaived": bool(price_waived),
        "publicProfileEnabled": False,
        "publicLinkListingEnabled": False,
        "allowedEmail": allowed_email.strip().lower() or None,
        "allowedDomain": allowed_domain.strip().lower().lstrip("@") or None,
        "maxClaims": max_claims,
        "expiresAt": expires_at,
        "revokedAt": None,
        "redirectPath": (
            redirect_path.strip()
            or record.get("defaultRedirect")
            or "/"
        ),
        "createdAt": iso(created_at),
    }

    data["invites"].append(invite)
    save_config(config_path, data)

    private = private_directory(repo)
    token_path = private / f"{invitation_id}.token"
    message_path = private / f"{invitation_id}.txt"
    token_path.write_text(token + "\n")

    url = invitation_url(record, token)
    recipient = reserved_for.strip() or "there"
    message = (
        f"{record['name'].upper()} INVITATION\n\n"
        f"Hi {recipient},\n\n"
        f"You have been invited to {record['name']} as "
        f"{role_value.replace('-', ' ')}.\n"
    )

    if purpose.strip():
        message += f"\n{purpose.strip()}\n"

    message += (
        f"\nOpen your private invitation:\n{url}\n\n"
        "Sign in with Google to accept it. "
        "There is no new Tempo Foundry password to remember.\n\n"
        "The invitation code appears only after the # symbol, "
        "which keeps it out of ordinary page requests and referrer headers.\n"
    )

    message_path.write_text(message)

    for path in [token_path, message_path]:
        try:
            path.chmod(0o600)
        except PermissionError:
            pass

    action = {
        "action": "create",
        "invitationId": invitation_id,
        "property": property_id,
        "target": record["target"],
        "url": url,
        "messageFile": str(message_path),
        "deploymentRequired": True,
    }
    write_action(repo, action)

    print(message)
    print(f"Invitation ID: {invitation_id}")
    print(f"Private message file: {message_path}")
    return action


def list_invitations(repo: Path) -> None:
    registry = load_registry(repo)
    data = migrate_all(repo)
    invites = data.get("invites", [])

    if not invites:
        print("No invitations.")
        return

    headings = [
        "ID",
        "PRODUCT",
        "ROLE",
        "HANDLE",
        "CLAIMS",
        "EXPIRES",
        "STATUS",
    ]

    rows = []
    for item in invites:
        record = registry.get("properties", {}).get(item["property"], {})
        status = "revoked" if item.get("revokedAt") else "active"
        rows.append([
            item["id"],
            record.get("name", item["property"]),
            item.get("role") or "member",
            item.get("handle") or "—",
            str(item.get("maxClaims") or 1),
            (item.get("expiresAt") or "never")[:10],
            status,
        ])

    widths = [
        max(len(headings[index]), *(len(row[index]) for row in rows))
        for index in range(len(headings))
    ]

    print("  ".join(
        headings[index].ljust(widths[index])
        for index in range(len(headings))
    ))
    print("  ".join("-" * width for width in widths))

    for row in rows:
        print("  ".join(
            row[index].ljust(widths[index])
            for index in range(len(row))
        ))


def change_revocation(repo: Path, invitation_id: str, revoke: bool) -> None:
    registry = load_registry(repo)
    path, data = load_config(repo)
    data["invites"] = [
        migrate_invite(item, registry)
        for item in data.get("invites", [])
    ]

    index, invite = find_invite(data, invitation_id)
    invite["revokedAt"] = iso(utc_now()) if revoke else None
    data["invites"][index] = invite
    save_config(path, data)

    record = property_record(registry, invite["property"])
    action = {
        "action": "revoke" if revoke else "restore",
        "invitationId": invitation_id,
        "property": invite["property"],
        "target": record["target"],
        "deploymentRequired": True,
    }
    write_action(repo, action)
    print(
        f"{'Revoked' if revoke else 'Restored'} invitation "
        f"{invitation_id}."
    )


def show_invitation(repo: Path, invitation_id: str) -> None:
    registry = load_registry(repo)
    _, data = load_config(repo)
    data["invites"] = [
        migrate_invite(item, registry)
        for item in data.get("invites", [])
    ]
    _, invite = find_invite(data, invitation_id)

    token_path = private_directory(repo) / f"{invitation_id}.token"
    message_path = private_directory(repo) / f"{invitation_id}.txt"

    if message_path.exists():
        print(message_path.read_text())
        print(f"Private message file: {message_path}")
        return

    if not token_path.exists():
        raise RuntimeError(
            "The deployable invitation exists, but its private token "
            "is not available on this computer."
        )

    token = token_path.read_text().strip()
    record = property_record(registry, invite["property"])
    print(invitation_url(record, token))


def prompt(label: str, default: str = "") -> str:
    suffix = f" [{default}]" if default else ""
    value = input(f"{label}{suffix}: ").strip()
    return value or default


def yes_no(label: str, default: bool = False) -> bool:
    suffix = " [Y/n]" if default else " [y/N]"
    value = input(f"{label}{suffix}: ").strip().lower()

    if not value:
        return default

    return value in {"y", "yes"}


def choose_property(registry: dict) -> str:
    items = list(registry.get("properties", {}).items())

    print("\nWhich product?")
    for index, (_, record) in enumerate(items, start=1):
        print(f"  {index}. {record['name']}")

    while True:
        value = input("Selection: ").strip()
        if value.isdigit() and 1 <= int(value) <= len(items):
            return items[int(value) - 1][0]
        if value in registry.get("properties", {}):
            return value
        print("Choose a number from the list.")


def wizard(repo: Path) -> None:
    registry = load_registry(repo)
    property_id = choose_property(registry)
    record = property_record(registry, property_id)

    print(f"\nCreating a {record['name']} invitation.")
    print("Suggested roles:")
    for role in record.get("roleSuggestions", []):
        print(f"  - {role}")

    role = prompt("Role", record.get("defaultRole", "member"))
    reserved_for = prompt("Person or group name")
    purpose = prompt("What does this invitation unlock?")

    handle = ""
    if record.get("supportsHandles"):
        handle = prompt("Reserved handle (optional)")

    max_claims = int(prompt("Number of people who may claim it", "1"))

    if handle and max_claims != 1:
        raise ValueError("A reserved handle invitation must be one-use.")

    allowed_email = prompt("Lock to one email address (optional)")
    allowed_domain = ""

    if not allowed_email:
        allowed_domain = prompt(
            "Restrict to an email domain such as school.edu (optional)"
        )

    days = int(prompt("Days until expiration; 0 means never", "90"))
    feature_text = prompt(
        "Features or benefits, comma separated (optional)"
    )
    features = [
        value.strip()
        for value in feature_text.split(",")
        if value.strip()
    ]
    badge = prompt("Badge (optional)")
    cohort = prompt("Cohort, city, class, or group (optional)")
    price_waived = yes_no("Waive associated invitation pricing?", False)
    redirect_path = prompt(
        "Redirect after claim",
        record.get("defaultRedirect", "/"),
    )

    create_invitation(
        repo,
        property_id=property_id,
        role=role,
        reserved_for=reserved_for,
        handle=handle,
        allowed_email=allowed_email,
        allowed_domain=allowed_domain,
        purpose=purpose,
        features=features,
        badge=badge,
        cohort=cohort,
        max_claims=max_claims,
        days=days,
        redirect_path=redirect_path,
        price_waived=price_waived,
    )


def manage(repo: Path) -> None:
    list_invitations(repo)
    print("\nActions: revoke, restore, show, cancel")
    action = prompt("Action", "cancel").lower()

    if action == "cancel":
        write_action(repo, {
            "action": "cancel",
            "deploymentRequired": False,
        })
        return

    invitation_id = prompt("Invitation ID")

    if action == "revoke":
        change_revocation(repo, invitation_id, True)
    elif action == "restore":
        change_revocation(repo, invitation_id, False)
    elif action == "show":
        show_invitation(repo, invitation_id)
        write_action(repo, {
            "action": "show",
            "invitationId": invitation_id,
            "deploymentRequired": False,
        })
    else:
        raise ValueError("Choose revoke, restore, show, or cancel.")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Create and manage Tempo Foundry product invitations."
    )
    parser.add_argument("--repo", required=True)
    sub = parser.add_subparsers(dest="command", required=True)

    create = sub.add_parser("create")
    create.add_argument("--property", required=True)
    create.add_argument("--role", required=True)
    create.add_argument("--reserved-for", default="")
    create.add_argument("--handle", default="")
    create.add_argument("--email", default="")
    create.add_argument("--email-domain", default="")
    create.add_argument("--purpose", default="")
    create.add_argument("--relationship", default="")
    create.add_argument("--feature", action="append", default=[])
    create.add_argument("--badge", default="")
    create.add_argument("--cohort", default="")
    create.add_argument("--max-claims", type=int, default=1)
    create.add_argument("--days", type=int, default=90)
    create.add_argument("--redirect", default="")
    create.add_argument("--price-waived", action="store_true")
    create.add_argument("--id", default="")

    sub.add_parser("wizard")
    sub.add_parser("list")

    revoke = sub.add_parser("revoke")
    revoke.add_argument("invitation_id")

    restore = sub.add_parser("restore")
    restore.add_argument("invitation_id")

    show = sub.add_parser("show")
    show.add_argument("invitation_id")

    sub.add_parser("manage")
    sub.add_parser("migrate")
    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    repo = Path(args.repo).expanduser().resolve()

    if args.command == "create":
        create_invitation(
            repo,
            property_id=args.property,
            role=args.role,
            reserved_for=args.reserved_for,
            handle=args.handle,
            allowed_email=args.email,
            allowed_domain=args.email_domain,
            purpose=args.purpose,
            relationship=args.relationship,
            features=args.feature,
            badge=args.badge,
            cohort=args.cohort,
            max_claims=args.max_claims,
            days=args.days,
            redirect_path=args.redirect,
            price_waived=args.price_waived,
            invitation_id=args.id,
        )
    elif args.command == "wizard":
        wizard(repo)
    elif args.command == "list":
        list_invitations(repo)
    elif args.command == "revoke":
        change_revocation(repo, args.invitation_id, True)
    elif args.command == "restore":
        change_revocation(repo, args.invitation_id, False)
    elif args.command == "show":
        show_invitation(repo, args.invitation_id)
    elif args.command == "manage":
        manage(repo)
    elif args.command == "migrate":
        data = migrate_all(repo)
        print(f"Migrated {len(data.get('invites', []))} invitations.")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print(f"ERROR: {error}", file=sys.stderr)
        raise SystemExit(1)
