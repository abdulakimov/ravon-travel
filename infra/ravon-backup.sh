#!/usr/bin/env bash
# /usr/local/sbin/ravon-backup.sh — daily snapshot of /opt/ravon-travel/data (host, root, cron).
# rsync --link-dest snapshots: unchanged files (media, closed orders) are hard links, so each day
# only costs what changed. Files are written by the app via tmp+rename, so every copied JSON is whole;
# an *.ndjson may end in a half-written last line (harmless — readers skip it).
set -euo pipefail
umask 077

SRC=/opt/ravon-travel/data
DEST=${BACKUP_DEST:-/var/backups/ravon-travel}
KEEP=${BACKUP_KEEP:-14}                 # daily snapshots kept locally
REMOTE=${BACKUP_REMOTE:-}               # optional offsite: user@host:/srv/backups/ravon-travel (ssh key)
PING_URL=${BACKUP_PING_URL:-}           # optional dead-man switch (healthchecks.io etc.)
STAMP=$(date -u +%Y%m%dT%H%M%SZ)
SNAP="$DEST/$STAMP"

exec 9>/run/ravon-backup.lock
flock -n 9 || { echo "another backup is running"; exit 1; }
mkdir -p "$DEST"

fail() {
  echo "BACKUP FAILED: $*" >&2
  [ -n "$PING_URL" ] && curl -fsS -m 10 "$PING_URL/fail" >/dev/null || true
  exit 1
}

# 1) Integrity: flag corrupt JSON (still back it up — but alert, and never prune old snapshots on a bad day)
bad=""
for f in "$SRC"/content/*.json "$SRC"/admin/*.json "$SRC"/media/index.json "$SRC"/orders/_seq.json; do
  [ -f "$f" ] || continue
  if command -v jq >/dev/null; then jq empty "$f" 2>/dev/null || bad="$bad $f"
  else python3 -c 'import json,sys; json.load(open(sys.argv[1]))' "$f" 2>/dev/null || bad="$bad $f"; fi
done

# Shared disk (~45 sites): never let the backup fill it. Need >= 2x the live data free, min 2 GB.
need_kb=$(( $(du -sk "$SRC" | cut -f1) * 2 )); [ "$need_kb" -lt 2097152 ] && need_kb=2097152
free_kb=$(df -Pk "$DEST" | awk 'NR==2{print $4}')
[ "$free_kb" -gt "$need_kb" ] || fail "low disk: ${free_kb}KB free, need ${need_kb}KB"

# 2) Snapshot (low priority on the shared box)
LINK=()
[ -d "$DEST/latest/" ] && LINK=(--link-dest="$DEST/latest/")
nice -n 19 ionice -c3 rsync -a --delete --exclude='*.tmp' "${LINK[@]}" "$SRC/" "$SNAP.part/" \
  || fail "rsync exited $?"
mv "$SNAP.part" "$SNAP"
ln -sfn "$SNAP" "$DEST/latest"

# 3) Offsite (same-disk backups do not survive losing the VPS)
if [ -n "$REMOTE" ]; then
  nice -n 19 rsync -aH --delete --timeout=300 "$DEST/" "$REMOTE/" || fail "offsite rsync exited $?"
fi

[ -n "$bad" ] && fail "corrupt JSON:$bad (snapshot $SNAP kept, nothing pruned)"

# 4) Retention by name (rsync -a copies source dir mtimes, so -mtime is useless here)
ls -1d "$DEST"/20*Z 2>/dev/null | sort | head -n -"$KEEP" | xargs -r rm -rf --
find "$DEST" -maxdepth 1 -name '*.part' -mmin +180 -exec rm -rf -- {} +

[ -n "$PING_URL" ] && curl -fsS -m 10 "$PING_URL" >/dev/null || true
echo "backup ok: $SNAP ($(du -sh "$SNAP" | cut -f1) apparent; $(du -sh "$DEST" | cut -f1) total)"
