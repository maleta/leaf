# Release sync

**2026-09-15** · present: everyone

## Decisions

1. Ship `0.1.0` as a GitHub Release with the DMG attached.
2. arm64 only for the first release; revisit universal if anyone asks.
3. No auto-update in the first release.

## Open

- [ ] Apple Developer account for notarisation
- [ ] LICENSE file (package.json already says MIT)
- [ ] Screenshots and a demo GIF for the README
- [x] Icon
- [x] File associations in `electron-builder.yml`

## Notes

> The Gatekeeper prompt on a non-notarised DMG is the single biggest install
> drop-off. Everything else on this list is cosmetic by comparison.

Next sync: after the first release is public.
