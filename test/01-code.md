# Syntax highlighting

Shiki, bundled. Every language below is highlighted with the same grammars
VS Code uses.

## TypeScript

```ts
type Result<T, E = Error> =
  | { ok: true; value: T }
  | { ok: false; error: E }

export async function readDocument(path: string): Promise<Result<Document>> {
  try {
    const content = await readFile(path, 'utf8')
    return { ok: true, value: { path, name: basename(path), content } }
  } catch (error) {
    return { ok: false, error: error as Error }
  }
}
```

## Rust

```rust
#[derive(Debug, Clone)]
struct Anchor {
    block: usize,
    offset: f32,
}

impl Anchor {
    fn resolve(&self, blocks: &[Block]) -> Option<f32> {
        blocks.get(self.block).map(|b| b.top + self.offset * b.height)
    }
}
```

## Python

```python
from dataclasses import dataclass

@dataclass(frozen=True, slots=True)
class Settings:
    theme: str = "system"
    chars_per_second: int = 1200

    def faster(self, factor: float = 2.0) -> "Settings":
        return Settings(self.theme, int(self.chars_per_second * factor))
```

## Go

```go
func Watch(path string, onChange func()) (func(), error) {
	w, err := fsnotify.NewWatcher()
	if err != nil {
		return nil, err
	}
	go func() {
		for ev := range w.Events {
			if ev.Op&fsnotify.Write == fsnotify.Write {
				onChange()
			}
		}
	}()
	return func() { _ = w.Close() }, w.Add(path)
}
```

## SQL

```sql
select f.name, count(*) as opens, max(o.at) as last_open
from files f
join opens o on o.file_id = f.id
where o.at > now() - interval '30 days'
group by f.name
order by opens desc
limit 10;
```

## Shell

```bash
pnpm install
pnpm dist
cp -R release/mac-arm64/Leaf.app /Applications/
```

## Diff

```diff
- backgroundThrottling: true,
+ // Chromium stalls rAF in unfocused windows and freezes the typewriter.
+ backgroundThrottling: false,
```

## JSON

```json
{
  "theme": "system",
  "rendering": "typewriter",
  "charsPerSecond": 1200,
  "fadeIn": { "enabled": true, "granularity": "word" }
}
```

Inline code stays plain: `const x = 1`, `~/Library/Application Support/Leaf`.
