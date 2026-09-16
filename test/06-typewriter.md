# Typewriter

Set **Rendering** to *Typewriter* in settings (`⌘,`), then press ▷ in the
toolbar to replay this document.

This text is short on purpose. At **Natural** speed it takes a few seconds,
which is the right length for a screen recording.

## What it is for

The renderer is the one that drives streaming model output. Replaying a
finished file at a chosen rate uses the same code path, so a document written
by a model reads back the way it was written.

## Speeds

| Preset | Characters per second |
| --- | ---: |
| Slow | 400 |
| Natural | 1200 |
| Fast | 3000 |
| Turbo | 9000 |

Or drag the slider to anything in between.

## Rules

- Typing in the editor cancels the animation immediately.
- Split view never types; two panes racing each other helps nobody.
- Fade-in and its granularity apply here too.

```ts
const reveal = (text: string, cps: number) =>
  animate(text.length, { duration: (text.length / cps) * 1000 })
```

That is all of it.
