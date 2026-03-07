#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

cd "$ROOT_DIR"

if ! command -v git >/dev/null 2>&1; then
	echo "error: git is required to build the source archive" >&2
	exit 1
fi

if ! command -v zip >/dev/null 2>&1; then
	echo "error: zip is required to build the source archive" >&2
	exit 1
fi

VERSION="${npm_package_version:-$(node -p "require('./package.json').version")}"
ARCHIVE_PATH="${1:-build/betterfloat-source-v${VERSION}.zip}"

if [[ "$ARCHIVE_PATH" != /* ]]; then
	ARCHIVE_PATH="$ROOT_DIR/$ARCHIVE_PATH"
fi

STAGING_DIR="$(mktemp -d)"
STAGING_ROOT="$STAGING_DIR/betterfloat-source"

cleanup() {
	rm -rf "$STAGING_DIR"
}

trap cleanup EXIT

mkdir -p "$STAGING_ROOT"
mkdir -p "$(dirname "$ARCHIVE_PATH")"

should_exclude() {
	case "$1" in
		.* | */.*)
			return 0
			;;
		build/* | dist/* | out/* | coverage/* | node_modules/*)
			return 0
			;;
		.env | .env.* | keys.json | key.json)
			return 0
			;;
		*.tsbuildinfo | *.pem)
			return 0
			;;
	esac

	return 1
}

FILE_COUNT=0

while IFS= read -r -d '' file; do
	if should_exclude "$file"; then
		continue
	fi

	mkdir -p "$STAGING_ROOT/$(dirname "$file")"
	cp -p "$file" "$STAGING_ROOT/$file"
	FILE_COUNT=$((FILE_COUNT + 1))
done < <(git ls-files -z)

rm -f "$ARCHIVE_PATH"

(
	cd "$STAGING_DIR"
	zip -q -r "$ARCHIVE_PATH" "betterfloat-source"
)

echo "Created $ARCHIVE_PATH with $FILE_COUNT files."
