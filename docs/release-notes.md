![Leaf](https://raw.githubusercontent.com/maleta/leaf/main/docs/demo.gif)

Leaf opens a Markdown file straight from Finder and renders it instantly, with an optional split-screen editor.

### What's new

- JSON and JSONL open as a collapsible tree: values aligned per level, nesting guides, inline previews of collapsed nodes, and a copy button for each value's path (`build.mac.target[0]`)
- JSONL shows one record per line with its line number and flags lines that do not parse, without hiding the rest of the file
- `.txt`, `.text`, `.log`, `.yml`, `.yaml`, `.toml`, `.xml`, `.ini`, `.conf` and `.csv` files open as one highlighted block with long lines wrapped
- Files opened from Finder join the existing window as tabs; `⌘W` closes a tab, `⌃Tab` / `⌃⇧Tab` switch between them
- Closing a window with unsaved tabs asks before discarding changes
- The reading column sits as a page on a darker desk, so its width is visible at any window size
- Leaf appears under *Open With* for all of these formats without claiming them as the default app

### Install

Requires macOS 13 (Ventura) or newer on Apple silicon. The DMG is arm64 only, there is no Intel build.

Download the DMG below and drag **Leaf** to Applications.

The build is neither signed nor notarised, so the download is quarantined. On macOS 13 and 14 the first launch needs a right-click on **Leaf** → **Open**. From macOS 15 on that bypass is gone: open it once, then go to System Settings → Privacy & Security and click **Open Anyway**.

To make it the default for Markdown: right-click any `.md` file → **Get Info** → **Open with** → *Leaf* → **Change All…**

