![Leaf](https://raw.githubusercontent.com/maleta/leaf/main/docs/demo.gif)

Leaf opens a Markdown file straight from Finder and renders it instantly, with an optional split-screen editor.

### What's in it

- Offline rendering: shiki, KaTeX and mermaid are bundled, nothing is fetched from a CDN
- Split editor with live preview and synced scrolling
- Typewriter mode that replays a document as if it were being written
- File tree with Finder-style type-ahead
- Scroll position remembered per document, so you land where you left off
- Registers as a handler for `.md`, `.markdown`, `.mdown`, `.mkd` and `.mdx`

### Install

Requires macOS 13 (Ventura) or newer on Apple silicon. The DMG is arm64 only, there is no Intel build.

Download the DMG below and drag **Leaf** to Applications.

The build is neither signed nor notarised, so the download is quarantined. On macOS 13 and 14 the first launch needs a right-click on **Leaf** → **Open**. From macOS 15 on that bypass is gone: open it once, then go to System Settings → Privacy & Security and click **Open Anyway**.

To make it the default for Markdown: right-click any `.md` file → **Get Info** → **Open with** → *Leaf* → **Change All…**

