# Architecture

```mermaid
flowchart TB
    subgraph Main["Main process"]
        W[Window manager]
        FS[File service]
        WATCH[Disk watcher]
        MENU[Menu]
    end
    subgraph Pre["Preload"]
        API[contextBridge API]
    end
    subgraph Rend["Renderer - Vue 3"]
        DOC[useDocument]
        PREV[PreviewPane]
        EDIT[EditorPane]
        TREE[FileTree]
        SET[useSettings]
    end
    W --> API
    FS --> API
    WATCH --> API
    MENU --> API
    API --> DOC
    DOC --> PREV
    DOC --> EDIT
    DOC --> TREE
    SET --> PREV
```

## Process split

| Layer | Owns |
| --- | --- |
| `src/main/` | windows, file IO, the disk watcher, the application menu |
| `src/preload/` | the one API object bridged into the renderer |
| `src/shared/` | types both sides agree on |
| `src/renderer/` | the Vue app: preview, editor, tree, settings |

## Invariants

- The renderer never touches `fs`.
- `src/shared/` imports nothing from either side.
- A document has exactly one owner window.
