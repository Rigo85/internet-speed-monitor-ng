#!/usr/bin/env bash
# uninstall.sh — Removes all traces of Internet Speed Monitor.
#
# Removes:
#   ~/.internet-speed-monitor/      — database and logs
#   ~/.local/share/applications/    — .desktop launcher
#   ~/.local/share/icons/           — app icon
#   ~/.config/ookla/                — Ookla Speedtest license acceptance
#
# The AppImage binary itself must be deleted manually (or pass --appimage <path>).
#
# Usage:
#   bash uninstall.sh
#   bash uninstall.sh --yes                         # non-interactive
#   bash uninstall.sh --appimage ~/Downloads/ISM.AppImage
#   bash uninstall.sh --yes --appimage ~/ISM.AppImage

set -euo pipefail

DESKTOP_ID="internet-speed-monitor"
APP_DATA_DIR="$HOME/.internet-speed-monitor"
OOKLA_CONFIG_DIR="$HOME/.config/ookla"
DESKTOP_FILE="$HOME/.local/share/applications/${DESKTOP_ID}.desktop"
ICON_FILE="$HOME/.local/share/icons/hicolor/1024x1024/apps/${DESKTOP_ID}.png"

NON_INTERACTIVE=false
APPIMAGE_PATH=""

# ── argument parsing ─────────────────────────────────────────────────────────

while [[ $# -gt 0 ]]; do
	case "$1" in
		--yes|-y)         NON_INTERACTIVE=true; shift ;;
		--appimage)       APPIMAGE_PATH="$2"; shift 2 ;;
		--appimage=*)     APPIMAGE_PATH="${1#*=}"; shift ;;
		*) echo "Unknown option: $1" >&2; exit 1 ;;
	esac
done

# ── helpers ──────────────────────────────────────────────────────────────────

removed=0

info() { echo "  $*"; }
skip() { echo "  (skip) $*"; }

confirm() {
	$NON_INTERACTIVE && return 0
	read -r -p "$1 [Y/n] " reply
	[[ -z "$reply" || "$reply" =~ ^[Yy] ]]
}

remove_path() {
	local target="$1"
	if [[ -e "$target" || -L "$target" ]]; then
		rm -rf "$target"
		info "Removed: $target"
		removed=1
	else
		skip "Not found: $target"
	fi
}

# ── confirmation ─────────────────────────────────────────────────────────────

echo ""
echo "This will remove Internet Speed Monitor and all its data:"
echo "  $APP_DATA_DIR"
echo "  $DESKTOP_FILE"
echo "  $ICON_FILE"
echo "  $OOKLA_CONFIG_DIR"
[[ -n "$APPIMAGE_PATH" ]] && echo "  $APPIMAGE_PATH"
echo ""

confirm "Continue?" || { echo "Aborted."; exit 0; }

# ── removal ──────────────────────────────────────────────────────────────────

remove_path "$APP_DATA_DIR"
remove_path "$DESKTOP_FILE"
remove_path "$ICON_FILE"
remove_path "$OOKLA_CONFIG_DIR"

if [[ -n "$APPIMAGE_PATH" ]]; then
	if [[ -f "$APPIMAGE_PATH" ]]; then
		remove_path "$APPIMAGE_PATH"
	else
		echo "WARNING: AppImage not found at $APPIMAGE_PATH — skipped."
	fi
fi

# ── update desktop database ──────────────────────────────────────────────────

if command -v update-desktop-database &>/dev/null; then
	update-desktop-database "$HOME/.local/share/applications" 2>/dev/null || true
fi

if command -v gtk-update-icon-cache &>/dev/null; then
	gtk-update-icon-cache -f -t "$HOME/.local/share/icons/hicolor" 2>/dev/null || true
fi

# ── summary ──────────────────────────────────────────────────────────────────

echo ""
if [[ $removed -eq 1 ]]; then
	echo "Internet Speed Monitor has been uninstalled."
else
	echo "Nothing to remove — Internet Speed Monitor was not installed."
fi
echo ""
