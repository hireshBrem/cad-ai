import { Mastra } from "@mastra/core/mastra";
import { cadAgent } from "@/mastra/agents/cad-agent";

export const mastra = new Mastra({
  agents: { cadAgent },
});
