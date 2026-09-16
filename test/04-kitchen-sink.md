# Kitchen sink

Every ordinary Markdown construct, in one place.

## Headings

# H1
## H2
### H3
#### H4
##### H5
###### H6

## Emphasis

*italic*, **bold**, ***both***, ~~struck through~~, `inline code`,
<kbd>⌘</kbd> + <kbd>B</kbd>, and a footnote[^1].

[^1]: Footnotes land at the bottom of the document.

## Lists

Unordered, nested:

- Rendering
  - Instant
  - Typewriter
    - Slow, 400 cps
    - Natural, 1200 cps
    - Fast, 3000 cps
    - Turbo, 9000 cps
- Layout
  - Preview only
  - Split

Ordered:

1. Open a file
2. Press `⌘B`
3. Walk the tree
   1. Single-click opens
   2. Double-click enters a folder

Tasks:

- [x] Offline rendering
- [x] Scroll memory per document
- [x] Live reload on external edit
- [ ] Export to PDF
- [ ] Windows build

Definition-style:

Term
: A word being defined.

Anchor
: The block of text at the top of the viewport, used to restore scroll.

## Table

| Setting | Default | Range |
| --- | :---: | ---: |
| Theme | system | light / dark / system |
| Rendering | instant | instant / typewriter |
| Speed | 1200 | 1–20000 cps |
| Fade-in | on | on / off |
| Text size | 100% | 50–300% |

## Blockquotes

> A quote.
>
> > Nested inside another quote.
>
> — with an attribution line

## Rules and breaks

Above.

---

Below.

## Links and images

An [inline link](https://github.com/jinghaihan/vue-stream-markdown), a
[reference link][engine], a bare URL <https://example.com>, and an anchor to
[the table above](#table).

[engine]: https://github.com/jinghaihan/vue-stream-markdown

![A local image that does not exist, to show the fallback](assets/missing.png)

## HTML passthrough

<details>
<summary>A collapsed section</summary>

Hidden until clicked. Contains a list:

- one
- two

</details>

## Escapes

Literal asterisks: \*not italic\*. A backslash: \\. A pipe in a table cell:

| Column |
| --- |
| a \| b |

## Long line

This paragraph is deliberately one very long line so that you can see how the preview pane wraps text when you toggle the split editor with ⌘E and the available width suddenly halves, which is exactly the case where anchor-based scroll restoration earns its keep.
