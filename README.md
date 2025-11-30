# CAD AI

AI-powered CAD design assistant. This project lets you create CAD designs using AI.

![CAD AI demo screenshot](public/demo-pic.png)

## Clone the Repository

```bash
git clone https://github.com/hireshBrem/cad-ai.git .
```

## Setup

### 1. Start Redis

```bash
docker run -p 6379:6379 -d redis
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file:

```bash
cp .env.local.example .env.local
```

Required variables (see also `.env.local.example`):

| Variable           | Description                                                                 |
|--------------------|-----------------------------------------------------------------------------|
| `OPENAI_API_KEY`   | Your OpenAI API key ([get one here](https://platform.openai.com/api-keys))  |
| `KITTYCAD_API_KEY` | Your KittyCAD API ([get one here](https://zoo.dev/account))                                                       |
| `REDIS_URL`        | Redis connection URL (e.g., `redis://localhost:6379`)                       |


### 4. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Example Prompts
Here are some example prompts you can use to generate CAD designs:

- "Create a flange with a 50mm diameter, 6 holes for M8 bolts, and 10mm thickness"
- "Design a gear with 40 teeth, 30mm pitch diameter, and 5mm face width"
- "Model a mounting bracket with two 8mm holes spaced 60mm apart"

## Tech Stack

- Next.js 16 (App Router) + React 19
- Mastra SDK + Vercel AI SDK
- Tailwind CSS
- TypeScript
