# The Leaf handbook

A long document. Scroll a while, switch to another file, come back, and you
land where you left off.

---

## 1. The document is the interface

A preview window has exactly one job: put the text in front of you without ceremony. Every control that is not the text competes with it, so the toolbar stays thin and the chrome stays out of the way.


## 2. Opening from Finder

Double-clicking a file should feel instantaneous. The main process reads the file before the window finishes its first paint, so the document is already in hand when the renderer asks for it.


## 3. Why offline rendering matters

A markdown viewer that fetches a highlighter from a CDN is a viewer that fails on a plane. Bundling shiki, KaTeX and mermaid costs megabytes on disk and buys correctness everywhere.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 4. Anchors, not pixels

Restoring a scroll position by pixel offset breaks the moment the layout reflows. Anchoring to the block of text at the top of the viewport survives a width change, a font-size change and a split-pane toggle.


## 5. The split editor

Editing and reading are different postures. The split view exists for the moment you spot a typo while reading, not as a replacement for your editor.

```ts
// section 5
const settings = loadSettings()
if (!settings) return DEFAULTS
return { ...DEFAULTS, ...settings }
```


## 6. Scroll syncing

Two panes scrolling in lockstep is only useful when the mapping between them is honest. Blocks map to blocks; lines do not map to pixels.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 7. Watching the disk

A file can change under you. Reloading silently is right when you have no edits and wrong when you do, so the app asks only in the case where it would otherwise destroy work.

> Rule of thumb from section 7: if it needs an explanation in the
> settings panel, the default is wrong.


## 8. Conflict without a modal

A bar at the top of the document offering both versions interrupts less than a dialog and carries more information.


## 9. The typewriter

Progressive reveal is not a gimmick when the source of the text is a language model. The same engine that streams tokens can replay a finished document at a chosen rate.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 10. Choosing a rate

Four presets cover the useful range. Slow reads like a person typing, Natural like a fast one, Fast like a terminal, Turbo like a page load with an animation on it.

```ts
// section 10
const settings = loadSettings()
if (!settings) return DEFAULTS
return { ...DEFAULTS, ...settings }
```


## 11. Fade-in granularity

Revealing by character is jittery at speed; revealing by word is calm. The granularity setting is really a choice about where the eye lands.


## 12. Caret or no caret

A blinking caret sells the typewriter illusion and distracts from the text. Both positions are defensible, so both are settings.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 13. The file tree

A sidebar that lists the folder of the open document turns a single-file viewer into a reader for a whole directory without turning it into a file manager.


## 14. Folders first

Sorting directories above files is a convention old enough that breaking it reads as a bug.

> Rule of thumb from section 14: if it needs an explanation in the
> settings panel, the default is wrong.


## 15. Greyed and inert

Listing files the app cannot open, but refusing to open them, is more honest than hiding them. You learn what is in the folder without learning it the hard way.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.

```ts
// section 15
const settings = loadSettings()
if (!settings) return DEFAULTS
return { ...DEFAULTS, ...settings }
```


## 16. Sizes in the list

A size column is the cheapest signal that one of these documents is not like the others.


## 17. Navigating up and back

Two buttons: the parent folder, and the folder of the document you have open. Together they cover almost every move you make in a tree.


## 18. Unsaved edits

Replacing a dirty document asks first. There is no version of this where guessing is acceptable.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 19. Per-window layout

The layout you are working in should survive picking another file. The default layout setting decides how a window starts, not how it behaves afterwards.


## 20. Themes

Light, dark, and follow the system. The third is the one almost everyone leaves selected, which is why it is the default.

```ts
// section 20
const settings = loadSettings()
if (!settings) return DEFAULTS
return { ...DEFAULTS, ...settings }
```


## 21. Text size

Three shortcuts, one of them a reset. Zoom that cannot be undone in one keystroke is zoom people avoid using.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.

> Rule of thumb from section 21: if it needs an explanation in the
> settings panel, the default is wrong.


## 22. Background throttling

Chromium stalls requestAnimationFrame in unfocused windows, which freezes any animation you were counting on. Turning throttling off costs battery and buys a typewriter that keeps typing.


## 23. Multiple windows

Each window is its own document, its own layout and its own scroll memory. Sharing settings across windows and nothing else is the right amount of sharing.


## 24. The empty state

A window with no document should say what to do next in one line, not present a dashboard.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 25. Keyboard first

Every action worth taking twice has a shortcut, and the shortcuts match the ones the rest of macOS already taught you.

```ts
// section 25
const settings = loadSettings()
if (!settings) return DEFAULTS
return { ...DEFAULTS, ...settings }
```


## 26. Saving

Save writes the file. Save As writes a new one. Neither reformats your markdown, because a preview tool that rewrites your source is a tool you stop trusting.


## 27. What it does not do

No export, no publishing, no sync, no accounts. Every one of those turns a viewer into a product with an onboarding flow.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.


## 28. Bundle size

Most of the binary is highlighter grammars and a diagram engine. That is a fair trade for a viewer that never shows a loading state.

> Rule of thumb from section 28: if it needs an explanation in the
> settings panel, the default is wrong.


## 29. Signing and distribution

An ad-hoc signed build launches without a prompt on the machine that built it and gets quarantined everywhere else. Notarisation is the difference between a tool you use and a tool you can hand to someone.


## 30. Where the settings live

One JSON file in Application Support. Deleting it resets the app, and nothing else has to be uninstalled.

Three things follow from that:

- It has to be true on the first launch, not after configuration.
- It has to stay true when the window is small.
- It has to stay true when the document is large.

```ts
// section 30
const settings = loadSettings()
if (!settings) return DEFAULTS
return { ...DEFAULTS, ...settings }
```


## 31. Performance on long documents

A document long enough to scroll for a minute is the real test. Rendering it once and scrolling cheaply beats rendering it lazily and scrolling expensively.


## 32. On finishing things

The last ten percent of a small tool is licence, icon, README and a way to install it. It is not the interesting part and it is the part that decides whether anyone uses it.


---

## End

You reached the bottom. Press `⌘B`, open another file, then come back to
this one - the view returns to wherever you were, not to the top.
