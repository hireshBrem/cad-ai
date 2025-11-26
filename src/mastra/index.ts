import { Mastra } from "@mastra/core/mastra";
import { cadAgent } from "./agents/cad-agent";

export const mastra = new Mastra({
  agents: { cadAgent },
});
