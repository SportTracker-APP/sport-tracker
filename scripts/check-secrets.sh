#!/usr/bin/env bash

set -euo pipefail

mode="${1:---staged}"
scanner_path="scripts/check-secrets.sh"
failed=0

is_sensitive_path() {
  local path="$1"
  local name="${path##*/}"

  case "$name" in
    .env|.env.*)
      [[ "$name" == ".env.example" ]] || return 0
      ;;
    *.pem|*.key|*.p12|*.pfx|*.jks|*.keystore|id_rsa|id_ed25519|credentials.json|service-account*.json)
      return 0
      ;;
  esac

  [[ "$path" == */secrets/* || "$path" == secrets/* ]]
}

looks_like_secret() {
  local file="$1"

  grep -Iq . "$file" || return 1

  grep -Eq -- '-----BEGIN ([A-Z0-9 ]+ )?PRIVATE KEY-----' "$file" && return 0
  grep -Eq -- '(^|[^A-Za-z0-9])(AKIA|ASIA)[A-Z0-9]{16}([^A-Za-z0-9]|$)' "$file" && return 0
  grep -Eq -- '(^|[^A-Za-z0-9])(github_pat_[A-Za-z0-9_]{20,}|gh[pousr]_[A-Za-z0-9]{30,})([^A-Za-z0-9]|$)' "$file" && return 0
  grep -Eq -- '(^|[^A-Za-z0-9])(sk_live_|rk_live_|whsec_)[A-Za-z0-9_]{16,}([^A-Za-z0-9]|$)' "$file" && return 0
  grep -Eq -- '(^|[^A-Za-z0-9])xox[baprs]-[A-Za-z0-9-]{20,}([^A-Za-z0-9]|$)' "$file" && return 0
  grep -Eq -- '(^|[^A-Za-z0-9])re_[A-Za-z0-9_-]{20,}([^A-Za-z0-9]|$)' "$file" && return 0

  awk '
    /^[[:space:]]*[A-Z][A-Z0-9_]*(SECRET|TOKEN|PASSWORD|API_KEY|PRIVATE_KEY|DATABASE_URL|SERVICE_ROLE_KEY)[[:space:]]*=/ {
      value = $0
      sub(/^[^=]*=[[:space:]]*/, "", value)
      gsub(/^"|"$/, "", value)
      lower = tolower(value)

      if (value == "" ||
          lower ~ /(example|placeholder|replace|changeme|change-me|dummy|test-only|your[-_])/ ||
          value ~ /^[$][({]/ ||
          value ~ /^<[A-Z0-9_-]+>$/) {
        next
      }

      if (length(value) >= 12) {
        found = 1
        exit
      }
    }
    END { exit(found ? 0 : 1) }
  ' "$file" && return 0

  return 1
}

scan_path() {
  local path="$1"
  local source="$2"
  local temporary_file

  [[ "$path" == "$scanner_path" ]] && return

  if is_sensitive_path "$path"; then
    printf 'ERREUR: fichier sensible indexé: %s\n' "$path" >&2
    failed=1
    return
  fi

  temporary_file="$(mktemp)"
  if [[ "$source" == "index" ]]; then
    git show ":$path" >"$temporary_file" 2>/dev/null || {
      rm -f "$temporary_file"
      return
    }
  elif [[ "$source" == commit:* ]]; then
    git show "${source#commit:}:$path" >"$temporary_file" 2>/dev/null || {
      rm -f "$temporary_file"
      return
    }
  else
    [[ -f "$path" ]] || {
      rm -f "$temporary_file"
      return
    }
    cp "$path" "$temporary_file"
  fi

  if looks_like_secret "$temporary_file"; then
    printf 'ERREUR: valeur ressemblant à un secret détectée dans %s\n' "$path" >&2
    failed=1
  fi

  rm -f "$temporary_file"
}

case "$mode" in
  --staged)
    while IFS= read -r -d '' path; do
      scan_path "$path" index
    done < <(git diff --cached --name-only --diff-filter=ACMR -z)
    ;;
  --tracked)
    while IFS= read -r -d '' path; do
      scan_path "$path" worktree
    done < <(git ls-files -z)
    ;;
  --commit)
    commit="${2:-}"
    if [[ -z "$commit" ]]; then
      printf 'Usage: %s --commit <commit>\n' "$0" >&2
      exit 2
    fi
    while IFS= read -r -d '' path; do
      scan_path "$path" "commit:$commit"
    done < <(git diff-tree --root --no-commit-id --name-only --diff-filter=ACMR -r -z "$commit")
    ;;
  *)
    printf 'Usage: %s [--staged|--tracked|--commit <commit>]\n' "$0" >&2
    exit 2
    ;;
esac

if (( failed != 0 )); then
  printf '\nCommit bloqué. Retire le fichier de Git et révoque toute clé déjà exposée.\n' >&2
  exit 1
fi

printf 'Contrôle des secrets: OK\n'
