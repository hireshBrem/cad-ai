# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 16 (App Router) client application for an AI-powered CAD (Computer-Aided Design) assistant. The application features a split-panel interface with a multi-tab CAD viewer (70%) and a chat panel (30%) where users interact with an AI agent to generate 3D designs.

## Technology Stack

- **Framework**: Next.js 16.0.3 with App Router and React 19.2.0
- **AI/Agent Framework**: Mastra Core (v0.24.5) for agent orchestration
- **AI SDK**: Vercel AI SDK (@ai-sdk/react v2.0.100, @ai-sdk/openai v2.0.71)
- **Styling**: Tailwind CSS v4 with PostCSS
- **TypeScript**: Strict mode enabled
- **React Compiler**: Enabled via babel-plugin-react-compiler

## Development Commands

```bash
# Start development server (runs on http://localhost:3000)
npm run dev

# Build production bundle
npm run build

# Start production server
npm run start
```

## Architecture

### Directory Structure

```
src/
├── app/                    # Next.js App Router pages and API routes
│   ├── page.tsx           # Main UI with split CAD viewer + chat panel
│   ├── layout.tsx         # Root layout with Nunito font
│   ├── globals.css        # Global Tailwind styles
│   └── api/
│       └── agents/
│           └── cad-agent/
│               └── generate/
│                   └── route.ts    # POST endpoint for AI agent streaming
└── mastra/                 # Mastra AI agent configuration
    ├── index.ts           # Mastra instance initialization
    ├── agents/
    │   └── cad-agent.ts   # CAD agent definition with GPT-4o model
    └── tools/
        └── cad-tools.ts   # CAD-specific tools (shapes, dimensions, constraints)
```

### Key Components

**Main UI (src/app/page.tsx)**
- Client component using `useChat` hook from @ai-sdk/react
- Multi-tab CAD viewer with up to 8 tabs (create/delete functionality)
- Chat panel displaying messages with specialized rendering for:
  - User messages (right-aligned, dark background)
  - AI text responses (left-aligned, gray background)
  - Tool calls (purple background with input JSON)
  - Tool results (green background with output JSON)
  - Agent data (blue background for agent status)
  - Workflow/network data (indigo/orange backgrounds)

**Agent System (src/mastra/)**
- Single `cadAgent` configured with GPT-4o model
- Specialized in CAD design assistance with detailed instructions
- Equipped with 5 core tools:
  - `create-shape`: Create 3D primitives (cube, sphere, cylinder, cone, box)
  - `modify-dimensions`: Adjust shape dimensions
  - `add-constraint`: Add design constraints (parallel, perpendicular, etc.)
  - `export-design`: Export in CAD formats (STL, STEP, IGES, OBJ, PDF)
  - `view-design`: Control viewport angles and rendering

**API Route (src/app/api/agents/cad-agent/generate/route.ts)**
- POST endpoint receiving messages array
- Fetches `cadAgent` from Mastra instance
- Streams responses using `format: "aisdk"` for AI SDK v5 compatibility
- Returns streaming response via `toUIMessageStreamResponse()`

### Important Configuration

**Path Aliases**
- `@/*` maps to `./src/*` (configured in tsconfig.json)

**React Compiler**
- Enabled in next.config.ts with `reactCompiler: true`
- Optimizes React components automatically

**TypeScript**
- Target: ES2017
- JSX: react-jsx (new JSX transform)
- Strict mode enabled
- Module resolution: bundler

## Development Notes

### Adding New CAD Tools

1. Create tool in `src/mastra/tools/cad-tools.ts` using `createTool` from `@mastra/core/tools`
2. Define schema with Zod validation
3. Implement execute function (currently mock implementations)
4. Add to `coreCADTools` array export
5. Tool automatically available to agent via `tools` config in `cad-agent.ts`

### Agent Configuration

The CAD agent is instructed to:
- Provide detailed technical CAD guidance
- Ask clarifying questions for vague requests
- Focus on dimensions, geometric shapes, assembly, and design considerations
- Use available tools to create/modify designs

### Message Rendering

The chat UI in `page.tsx` handles multiple message part types from AI SDK v5:
- Standard text/reasoning parts
- Tool parts with pattern `tool-<name>` containing `toolCallId`, `input`, and `output`
- Custom data parts with pattern `data-*` for agent/workflow/network data

When extending the UI, maintain the color-coded visual hierarchy:
- User: dark (gray-800)
- AI text: light gray (gray-100)
- Tools: purple (tool calls) / green (results)
- Agents: blue
- Workflows: indigo
- Network: orange

## Backend Integration

This client expects a companion backend server (likely in `../server/`) to handle:
- Actual CAD geometry generation
- Tool execution implementation
- OpenAI API key management

The current tools in `cad-tools.ts` return mock responses and would need backend integration for real CAD operations.
