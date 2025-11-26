import { mastra } from "@/mastra/index";

export async function POST(req: Request) {
  const { messages } = await req.json();
  const myAgent = mastra.getAgent("cadAgent");
  const stream = await myAgent.stream(messages, { format: "aisdk" });

  return stream.toUIMessageStreamResponse();
}