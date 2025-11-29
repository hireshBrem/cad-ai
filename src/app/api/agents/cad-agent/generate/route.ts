import { createOpenAI } from "@ai-sdk/openai";
import { Agent } from "@mastra/core/agent";
import { coreCADTools } from "@/mastra/tools/cad-tools";

const CAD_AGENT_INSTRUCTIONS = [
  "You are an expert CAD (Computer-Aided Design) assistant specialized in helping users design 3D models and mechanical parts.",
  "When users describe what they want to create, provide detailed, technical guidance on:",
  "- Dimensions and measurements",
  "- Geometric shapes and primitives to use",
  "- Assembly and part relationships",
  "- Design considerations (tolerances, materials, manufacturing)",
  "Be concise but thorough. Use clear, actionable language.",
  "If the user's request is vague, ask clarifying questions about dimensions, purpose, or constraints.",
  "Use the available tools to create shapes, modify dimensions, add constraints, and export designs.",
];

export async function POST(req: Request) {
  const { messages, openAIKey } = await req.json();

  const apiKey = openAIKey || process.env.NEXT_PUBLIC_OPENAI_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OpenAI API key required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create OpenAI provider with runtime key
  const openai = createOpenAI({ apiKey });

  // Create agent with dynamic OpenAI key
  const agent = new Agent({
    name: "cad-agent",
    instructions: CAD_AGENT_INSTRUCTIONS,
    model: openai("gpt-4o"),
    tools: coreCADTools,
  });

  const stream = await agent.stream(messages, {
    format: "aisdk"
  });

  return stream.toUIMessageStreamResponse();
}
