import { kimiInferJSON } from "../kimi";
import {
  validateGTMReportInput,
  validateImageryInput,
  validateVideoBlueprintInput,
  GTMReportInput,
  ImageryGenerationInput,
  VideoBlueprintInput
} from "./input-validator";
import { handleKimiError } from "./error-handler";
import { verifyInternalMTLS } from "../security/mtls";

export interface StandardGTMReportOutput {
  title: string;
  executiveSummary: string;
  targetAudience: {
    personaName: string;
    industry: string;
    painPoints: string[];
    valueProposition: string;
  };
  marketAnalysis: {
    marketSizeTAM: string;
    keyCompetitors: string[];
    differentiators: string[];
  };
  gtmStrategy: {
    channels: string[];
    pricingTier: string;
    outreachPlaybook: string[];
    launchTimeline: Array<{ phase: string; duration: string; milestones: string[] }>;
  };
  kpiFramework: Array<{ metric: string; target: string; timebound: string }>;
  recommendedModel: string;
  generatedAt: string;
}

export interface StandardImageryOutput {
  promptSpec: {
    corePrompt: string;
    enhancedPrompt: string;
    negativePrompt: string;
    style: string;
    aspectRatio: string;
    dimensions: { width: number; height: number };
    lightingAndCamera: string;
    colorPalette: string[];
  };
  assetSpecifications: {
    format: string;
    recommendedResolution: string;
    usageGuidelines: string;
  };
  sampleVariants: Array<{ id: string; concept: string; promptVariation: string }>;
  generatedAt: string;
}

export interface StandardVideoBlueprintOutput {
  title: string;
  durationSeconds: number;
  format: string;
  targetAudience: string;
  scriptStructure: Array<{
    sceneNumber: number;
    timestampRange: string;
    visualDescription: string;
    audioVoiceover: string;
    onScreenText: string;
    bRollAssetPrompt: string;
  }>;
  thumbnailBlueprint: {
    concept: string;
    visualPrompt: string;
    textOverlay: string;
  };
  productionNotes: {
    pacing: string;
    musicStyle: string;
    voiceStyle: string;
  };
  generatedAt: string;
}

export class KimiContentOrchestrator {
  /**
   * Generates a comprehensive professional Go-To-Market (GTM) Analysis Report via Kimi API.
   */
  async generateGTMReport(rawInput: unknown, mtlsHeaders?: Headers | Record<string, string>): Promise<StandardGTMReportOutput> {
    if (mtlsHeaders) {
      const mtls = verifyInternalMTLS(mtlsHeaders);
      if (!mtls.authenticated) {
        throw new Error(`mTLS authentication failed: ${mtls.error}`);
      }
    }

    const input = validateGTMReportInput(rawInput);
    const systemPrompt = `You are Dealflow AI's Chief Strategy Officer powered by Kimi AI (Moonshot).
Your job is to generate a comprehensive, enterprise-grade Go-To-Market (GTM) strategy analysis report in raw JSON format.
Ensure all sections are filled with actionable, high-precision B2B SaaS strategies, data points, and clear milestone timelines.`;

    const userPrompt = `Generate a complete GTM Analysis Report for:
Topic/Product: ${input.topic}
Industry: ${input.industry}
Target Audience: ${input.targetAudience}
Budget: ${input.budget || 'Standard startup/growth budget'}
Tone: ${input.tone}
Region: ${input.region}
Objectives: ${JSON.stringify(input.keyObjectives || ['Rapid market penetration', 'ICP acquisition', 'Pipeline generation'])}

Return raw JSON matching this structure exactly:
{
  "title": "string",
  "executiveSummary": "string",
  "targetAudience": {
    "personaName": "string",
    "industry": "string",
    "painPoints": ["string"],
    "valueProposition": "string"
  },
  "marketAnalysis": {
    "marketSizeTAM": "string",
    "keyCompetitors": ["string"],
    "differentiators": ["string"]
  },
  "gtmStrategy": {
    "channels": ["string"],
    "pricingTier": "string",
    "outreachPlaybook": ["string"],
    "launchTimeline": [
      { "phase": "string", "duration": "string", "milestones": ["string"] }
    ]
  },
  "kpiFramework": [
    { "metric": "string", "target": "string", "timebound": "string" }
  ]
}`;

    try {
      const result = await kimiInferJSON(userPrompt, systemPrompt, { model: 'moonshot-v1-8k', temperature: 0.2 });
      return {
        ...result,
        recommendedModel: 'moonshot-v1-8k',
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      const errResponse = handleKimiError(error, { endpoint: 'generateGTMReport' });
      throw new Error(`Kimi GTM Report generation failed: ${errResponse.error.message}`);
    }
  }

  /**
   * Generates custom imagery prompt blueprints and asset specifications via Kimi API.
   */
  async generateImagerySpecs(rawInput: unknown, mtlsHeaders?: Headers | Record<string, string>): Promise<StandardImageryOutput> {
    if (mtlsHeaders) {
      const mtls = verifyInternalMTLS(mtlsHeaders);
      if (!mtls.authenticated) {
        throw new Error(`mTLS authentication failed: ${mtls.error}`);
      }
    }

    const input = validateImageryInput(rawInput);
    const systemPrompt = `You are Dealflow AI's Principal Creative Director powered by Kimi AI (Moonshot).
Your job is to synthesize high-quality image generation prompts, lighting setup, color palette, and asset specifications for text-to-image engines.`;

    const userPrompt = `Create a custom imagery generation blueprint for:
Prompt Concept: ${input.prompt}
Style: ${input.style}
Aspect Ratio: ${input.aspect_ratio}
Dimensions: ${input.width}x${input.height}
Resolution: ${input.resolution}
Negative Prompt Context: ${input.negative_prompt || 'blurry, low quality, distorted, extra limbs'}

Return raw JSON matching this structure exactly:
{
  "promptSpec": {
    "corePrompt": "string",
    "enhancedPrompt": "string",
    "negativePrompt": "string",
    "style": "string",
    "aspectRatio": "string",
    "dimensions": { "width": number, "height": number },
    "lightingAndCamera": "string",
    "colorPalette": ["string"]
  },
  "assetSpecifications": {
    "format": "PNG",
    "recommendedResolution": "string",
    "usageGuidelines": "string"
  },
  "sampleVariants": [
    { "id": "var-1", "concept": "string", "promptVariation": "string" },
    { "id": "var-2", "concept": "string", "promptVariation": "string" }
  ]
}`;

    try {
      const result = await kimiInferJSON(userPrompt, systemPrompt, { model: 'moonshot-v1-8k', temperature: 0.3 });
      return {
        ...result,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      const errResponse = handleKimiError(error, { endpoint: 'generateImagerySpecs' });
      throw new Error(`Kimi Imagery Generation failed: ${errResponse.error.message}`);
    }
  }

  /**
   * Generates a structured video content blueprint and asset generation script via Kimi API.
   */
  async generateVideoBlueprint(rawInput: unknown, mtlsHeaders?: Headers | Record<string, string>): Promise<StandardVideoBlueprintOutput> {
    if (mtlsHeaders) {
      const mtls = verifyInternalMTLS(mtlsHeaders);
      if (!mtls.authenticated) {
        throw new Error(`mTLS authentication failed: ${mtls.error}`);
      }
    }

    const input = validateVideoBlueprintInput(rawInput);
    const systemPrompt = `You are Dealflow AI's Lead Executive Video Director powered by Kimi AI (Moonshot).
Your job is to generate a scene-by-scene video content blueprint, voiceover script, visual directives, and thumbnail concepts.`;

    const userPrompt = `Create a structured video content blueprint for:
Video Topic: ${input.topic}
Duration: ${input.duration_seconds} seconds
Format: ${input.format}
Target Audience: ${input.target_audience}
Tone: ${input.tone}
CTA: ${input.call_to_action || 'Book a demo at Dealflow AI'}

Return raw JSON matching this structure exactly:
{
  "title": "string",
  "durationSeconds": number,
  "format": "string",
  "targetAudience": "string",
  "scriptStructure": [
    {
      "sceneNumber": 1,
      "timestampRange": "00:00 - 00:05",
      "visualDescription": "string",
      "audioVoiceover": "string",
      "onScreenText": "string",
      "bRollAssetPrompt": "string"
    }
  ],
  "thumbnailBlueprint": {
    "concept": "string",
    "visualPrompt": "string",
    "textOverlay": "string"
  },
  "productionNotes": {
    "pacing": "string",
    "musicStyle": "string",
    "voiceStyle": "string"
  }
}`;

    try {
      const result = await kimiInferJSON(userPrompt, systemPrompt, { model: 'moonshot-v1-8k', temperature: 0.3 });
      return {
        ...result,
        durationSeconds: input.duration_seconds,
        format: input.format,
        targetAudience: input.target_audience,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      const errResponse = handleKimiError(error, { endpoint: 'generateVideoBlueprint' });
      throw new Error(`Kimi Video Blueprint generation failed: ${errResponse.error.message}`);
    }
  }
}

export const kimiContentOrchestrator = new KimiContentOrchestrator();
