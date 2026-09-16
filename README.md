# Leaf

A macOS app that opens a Markdown file straight from Finder and renders it
instantly, with an optional split-screen editor. Rendering is done by
[`vue-stream-markdown`](https://github.com/jinghaihan/vue-stream-markdown), so
the same engine that drives streaming LLM output also drives the typewriter mode.

Syntax highlighting (shiki), math (KaTeX) and diagrams (mermaid) are bundled
into the app, so nothing is fetched from a CDN and everything works offline.

## Install

```bash
pnpm install
pnpm dist          # -> release/Leaf-0.1.0-arm64.dmg
```

Either double-click the DMG and drag **Leaf** onto the Applications
shortcut, or skip the DMG entirely:

```bash
cp -R release/mac-arm64/Leaf.app /Applications/
```

Then make it the default handler, once:

1. Right-click any `.md` file → **Get Info**
2. **Open with** → *Leaf*
3. **Change All…**

From then on a double-click in Finder opens the file in Leaf.

The DMG is 127 MB and the installed app 310 MB: the Electron runtime baseline
plus 23 MB of app, most of it shiki's language grammars. That is what rendering
code, math and diagrams with nothing fetched at runtime costs.

The build is ad-hoc signed, not notarised. A locally built app carries no
`com.apple.quarantine` flag, so it launches with no Gatekeeper prompt. Copy the
DMG to another Mac and it will be quarantined there, in which case the first
launch needs right-click → **Open**.

To uninstall: delete the app, and `~/Library/Application Support/Leaf`
(window state and settings).

## Using it

| | |
| --- | --- |
| Open a file | double-click in Finder, drag onto the window, or `⌘O` |
| Toggle file tree | `⌘B` |
| Toggle split editor | `⌘E` |
| Save / Save As | `⌘S` / `⇧⌘S` |
| Reload from disk | `⌘R` |
| Settings | `⌘,` |
| Text size | `⌘+` / `⌘-` / `⌘0` |
| New window | `⌘N` |

### File tree

`⌘B` opens a sidebar listing the folder of the open document: folders first,
then the files the app can open, then everything else greyed out and inert.
Each file shows its size. Single-click opens a document, double-click enters a
folder, and the header carries a button for the parent folder and one that jumps
back to the folder of the file you have open. Replacing a document with unsaved
edits asks first.

Each document remembers where you were reading it, for as long as the window
stays open. Switching back to a file puts you where you left it; a file you have
not opened yet starts at the top. The position is anchored to the block of text
at the top of the viewport rather than to a pixel offset, so toggling the split
editor keeps you on the same paragraph even though the narrower pane reflows the
document to a different height.

Picking another file keeps the layout you are working in; the *Editing* setting
only decides how a window's first document opens.

Editing a file elsewhere updates the preview live. If the file changes on disk
while you have unsaved edits, a bar offers you both versions instead of picking
for you.

## Settings

**Rendering** decides what happens when a document opens.

- **Instant** (default) renders the whole file at once.
- **Typewriter** reveals it progressively at a configurable rate
  (Slow 400 / Natural 1200 / Fast 3000 / Turbo 9000 characters per second, or a
  free slider). The ▷ button in the toolbar replays it.

Typing is skipped as soon as you start editing, and never runs in split view.

Also configurable: fade-in animation and its granularity, caret, light/dark/system
theme, text size, the layout new files open in, and scroll syncing in split view.

## Development

```bash
pnpm dev           # electron-vite dev server
pnpm typecheck     # vue-tsc + tsc
pnpm build         # typecheck + bundle into out/
pnpm dist          # build + package the DMG
pnpm icon          # regenerate build/icon.icns from build/icon.svg
```

`pnpm dev -- path/to/file.md` opens a file on launch.

`test/` holds a demo folder: markdown covering code, math, diagrams and the
whole file tree, plus a recording script in `test/README.md`.

### Releasing

CI typechecks and builds every push. Tagging cuts the release:

```bash
pnpm version patch         # or minor / major, writes the tag
git push --follow-tags
```

The tag runs electron-builder on a macOS runner and attaches the DMG to a
GitHub Release. The build is ad-hoc signed, so the release asset is not
notarised.

### Layout

```
src/main/       Electron main: windows, file IO, disk watcher, menu
src/preload/    contextBridge API exposed to the renderer
src/shared/     types used by both sides
src/renderer/   Vue 3 app (preview, CodeMirror editor, settings)
```

### Notes

- `typescript` is pinned to 5.x: `vue-tsc` runs on the JavaScript compiler API,
  which the native TypeScript 7 build no longer exposes.
- Windows are created with `backgroundThrottling: false`; Chromium otherwise
  stalls `requestAnimationFrame` in unfocused windows and freezes the typewriter.
