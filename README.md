# loom

think in threads.

An infinite canvas for thinking. Create named clusters, chain thoughts sequentially within them, and watch semantic connections form across clusters automatically.

## what it does

- **Clusters** — named workspaces. Each cluster holds a chain of thoughts. New thoughts auto-connect to the previous one in sequence.
- **Smart connections** — when you save a thought, it's embedded and compared against all other nodes via cosine similarity. Matching thoughts across clusters connect automatically.
- **Chat** — ask questions about your canvas. The AI references specific nodes by number and cites them inline. Click a citation to jump to that node.
- **Appearance** — light and dark mode, custom background color, grain/texture control.

## getting started

```bash
npm install
npm run dev
```

On first load you'll be prompted for an API key. Stored in your browser only, never sent anywhere else.

## supported providers

| Provider | Chat | Smart connections |
|---|---|---|
| OpenAI (`sk-...`) | ✓ | ✓ |
| Gemini (`AIza...`) | ✓ | ✓ |
| Anthropic (`sk-ant-...`) | ✓ | — |

Anthropic does not have an embeddings API, so smart connections are unavailable with Anthropic keys.

## stack

- React 19 + Vite
- [@xyflow/react](https://reactflow.dev) for canvas rendering
- OpenAI `text-embedding-3-small` / Gemini `text-embedding-004` for semantic similarity
- OpenAI `gpt-4o-mini` / Gemini `gemini-1.5-flash` / Anthropic `claude-haiku-4-5` for chat
