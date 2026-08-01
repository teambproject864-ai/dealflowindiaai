import { z } from 'zod';

export const GTMReportInputSchema = z.object({
  topic: z.string().min(3, 'Topic must be at least 3 characters long'),
  industry: z.string().min(2, 'Industry is required'),
  targetAudience: z.string().min(2, 'Target audience is required'),
  budget: z.union([z.string(), z.number()]).optional(),
  keyObjectives: z.array(z.string()).optional(),
  tone: z.enum(['professional', 'aggressive', 'consultative', 'authoritative', 'friendly']).optional().default('professional'),
  region: z.string().optional().default('Global'),
});

export type GTMReportInput = z.infer<typeof GTMReportInputSchema>;

export const ImageryGenerationInputSchema = z.object({
  prompt: z.string().min(3, 'Image prompt must be at least 3 characters long'),
  aspect_ratio: z.enum(['1:1', '16:9', '9:16', '4:3', '21:9']).optional().default('16:9'),
  style: z.enum(['photorealistic', '3d-render', 'minimalist-vector', 'cyberpunk', 'cinematic', 'isometric']).optional().default('photorealistic'),
  width: z.number().int().min(256).max(4096).optional().default(1920),
  height: z.number().int().min(256).max(4096).optional().default(1080),
  resolution: z.enum(['720p', '1080p', '4k', '8k']).optional().default('1080p'),
  negative_prompt: z.string().optional(),
});

export type ImageryGenerationInput = z.infer<typeof ImageryGenerationInputSchema>;

export const VideoBlueprintInputSchema = z.object({
  topic: z.string().min(3, 'Video topic must be at least 3 characters long'),
  duration_seconds: z.number().min(5).max(600).optional().default(60),
  format: z.enum(['vertical-9:16', 'landscape-16:9', 'square-1:1']).optional().default('landscape-16:9'),
  target_audience: z.string().min(2, 'Target audience is required'),
  tone: z.string().optional().default('engaging'),
  call_to_action: z.string().optional(),
});

export type VideoBlueprintInput = z.infer<typeof VideoBlueprintInputSchema>;

export function validateGTMReportInput(data: unknown): GTMReportInput {
  return GTMReportInputSchema.parse(data);
}

export function validateImageryInput(data: unknown): ImageryGenerationInput {
  return ImageryGenerationInputSchema.parse(data);
}

export function validateVideoBlueprintInput(data: unknown): VideoBlueprintInput {
  return VideoBlueprintInputSchema.parse(data);
}
