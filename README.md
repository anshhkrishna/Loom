# Loom

Thoughts rarely arrive in order. Loom gives you space to scatter them, and surfaces how they connect.

Click anywhere to start. The more you add, the more structure emerges on its own.

## How it works

- **Click** anywhere on the canvas to create a node and start typing
- **Enter** to save a thought
- **Double-click** a node to edit it
- **Drag** nodes to rearrange
- **Scroll** to zoom, **drag background** to pan
- **Backspace / Delete** to remove a selected node

Smart connections are powered by embeddings. When you save a thought, it's embedded and compared against all existing nodes via cosine similarity. If the score exceeds a threshold, an edge appears, brighter and thicker for stronger matches.

Supported providers: **OpenAI** (`sk-...`) and **Gemini** (`AIzaSy...`). The app auto-detects which one you're using from the key format.

## Getting started

```bash
npm install
npm run dev
```

On first load you'll be prompted for your OpenAI API key. It's stored in your browser only and never sent anywhere else.

To use an environment variable instead:

```bash
cp .env.example .env
# fill in your key
```

## Stack

- React 19 + Vite
- [@xyflow/react](https://reactflow.dev) for canvas rendering
- OpenAI `text-embedding-3-small` for semantic similarity
