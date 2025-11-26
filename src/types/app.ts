export interface CADTab {
    tabId: string;  // Unique identifier for the tab (random UUID)
    jobId: string;  // CAD job ID (can be duplicated across tabs)
    name: string;
    cadJob?: CADJob;
}

export interface CADJob {
    type: "text_to_cad";
    id: string;
    created_at: string;
    started_at: string;
    completed_at: string;
    user_id: string;
    status: string;
    updated_at: string;
    conversation_id: string;
    prompt: string;
    outputs: {
      "source.gltf": string;
      "source.obj": string;
      "source.step": string;
    };
    output_format: string;
    model_version: string;
    kcl_version: string;
    model: string;
    feedback: null;
    code: string;
  };
  

export type ToolVariant = "call" | "result";

export type ToolCardProps = {
  toolName: string;
  variant: ToolVariant;
  payload?: unknown;
  label?: string;
}

export interface TextToCadToolInput {
    context: {
      prompt: string;
      kclVersion?: string;
      projectName?: string;
    };
  }
  