import { addJob } from "@/lib/redis";
import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { TextToCadToolInput } from "@/types/app";

export const textToCadTool = createTool({
  id: "text-to-cad",
  description: "Generate CAD geometry from a descriptive prompt using KittyCAD's text-to-CAD API",
  inputSchema: z.object({
    prompt: z.string().min(1).describe("Description of the part or feature to generate"),
    outputFormat: z
      .enum(["stl", "glb", "step", "iges", "obj"])
      .default("stl")
      .describe("Output format for the CAD model"),
    kcl: z.boolean().optional().default(true).describe("Whether to run the KittyCAD compiler (KCL)"),
    kclVersion: z.string().optional().describe("Specific KittyCAD compiler version"),
    modelVersion: z.string().optional().describe("KittyCAD model version to run the prompt through"),
    projectName: z.string().optional().describe("Project name to associate with the prompt"),
  }),
  execute: async (input: TextToCadToolInput) => {
    try {
        // Get keys from toolContext or fall back to env
        const kittyCADKey = process.env.NEXT_PUBLIC_KITTYCAD_API_KEY;
        const redisUrl = process.env.REDIS_URL;
        console.log('kittyCADKey', kittyCADKey);
        console.log('redisUrl', redisUrl);
        
        console.log('input', input.context);
        const actualInput = input.context;
        const outputFormat = 'obj';
        const bodyPayload = {
            prompt: actualInput.prompt,
            kcl_version: actualInput.kclVersion ?? "bcgqgil8c",
            project_name: actualInput.projectName ?? "hello123",
        };

        // Mirroring the sample curl request with a fetch call instead of the SDK helper
        const response = await fetch(
            `https://api.zoo.dev/ai/text-to-cad/${encodeURIComponent(outputFormat)}?kcl=true`,
            {
            method: "POST",
            headers: {
                Authorization: `Bearer ${kittyCADKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify(bodyPayload)
            }
        );

        const data = await response.json();

        console.log('data', data);

        // add to redis with dynamic URL
        await addJob(data.id);

        return {
            success: response.ok,
            message: response.ok ? "Text prompt translated into a CAD model successfully" : data.message ?? "Cad API error",
            data,
            status: response.status,
        };
    } catch (error) {
      console.error(error);
      return {
        success: false,
        message: "Failed to reach the CAD generation API",
      };
    }
  },
});

export const coreCADTools = [textToCadTool];
