import { logger } from "./logger";
import {
  SupabaseWorkflowRepo,
  SupabaseChatRepo,
  SupabaseAgentStateRepo,
  SupabaseWorkflow,
  SupabaseChatMessage,
  SupabaseAgentState,
} from "./supabase-service";
import { saveDraft, getDraft, syncPocketBaseToSupabase } from "./pocketbase-service";
import { getCache, setCache } from "./redis-service";

export interface AIWorkflowInitParams {
  workflowId: string;
  organizationId: string;
  title: string;
  agentKey: string;
  userId: string;
  initialDefinition?: Record<string, any>;
}

export interface AIWorkflowStepParams {
  workflowId: string;
  agentKey: string;
  userId: string;
  stepName: string;
  inputPayload: Record<string, any>;
  stepOutput: Record<string, any>;
  isTransientDraft?: boolean;
}

export class AIWorkflowService {
  /**
   * Initializes persistent workflow record in Supabase and caches active session state in Redis
   */
  async initializeWorkflow(params: AIWorkflowInitParams): Promise<{ workflow: SupabaseWorkflow; agentState: SupabaseAgentState }> {
    logger.info(`[AI Workflow] Initializing workflow '${params.workflowId}' for agent '${params.agentKey}'`);

    // 1. Create/upsert persistent workflow in Supabase (Primary Source of Truth)
    const workflow = await SupabaseWorkflowRepo.saveWorkflow({
      id: params.workflowId,
      organizationId: params.organizationId,
      title: params.title,
      definition: params.initialDefinition || { steps: [] },
      status: "active",
      state: { currentStep: "initialized", startedAt: new Date().toISOString() },
    });

    // 2. Initialize or fetch agent state in Supabase
    const agentState = await SupabaseAgentStateRepo.saveAgentState({
      id: `state_${params.agentKey}_${params.userId}`,
      agentKey: params.agentKey,
      userId: params.userId,
      contextMemory: { activeWorkflowId: params.workflowId },
      stepLogs: [{ step: "initialized", timestamp: new Date().toISOString(), status: "completed" }],
    });

    // 3. Cache session metadata in Redis for sub-5ms lookup
    await setCache(`workflow_session:${params.workflowId}`, {
      workflowId: params.workflowId,
      organizationId: params.organizationId,
      agentKey: params.agentKey,
      userId: params.userId,
      status: "active",
    }, 3600);

    return { workflow, agentState };
  }

  /**
   * Executes a workflow step:
   * - Step result & persistent state -> Supabase
   * - Transient artifacts/draft outputs -> PocketBase
   * - Fast execution step cache -> Redis
   */
  async executeStep(params: AIWorkflowStepParams): Promise<{ stepOutput: Record<string, any>; transientDraftId?: string }> {
    const cacheKey = `ai_step_cache:${params.workflowId}:${params.stepName}`;
    const cachedResult = await getCache<Record<string, any>>(cacheKey);
    if (cachedResult) {
      logger.info(`[AI Workflow] Returned cached execution result for step '${params.stepName}'`);
      return { stepOutput: cachedResult };
    }

    let transientDraftId: string | undefined;

    // 1. If transient artifact requested, store in PocketBase
    if (params.isTransientDraft) {
      const draft = await saveDraft("transient_ai_artifacts", {
        workflowId: params.workflowId,
        stepName: params.stepName,
        agentKey: params.agentKey,
        userId: params.userId,
        output: params.stepOutput,
      });
      transientDraftId = draft.id;
      logger.info(`[AI Workflow] Transient step artifact saved to PocketBase draft '${transientDraftId}'`);
    }

    // 2. Persistent Workflow State update -> Supabase (Primary Source of Truth)
    const existingWorkflow = await SupabaseWorkflowRepo.getWorkflow(params.workflowId);
    if (existingWorkflow) {
      const updatedState = {
        ...existingWorkflow.state,
        lastExecutedStep: params.stepName,
        lastUpdated: new Date().toISOString(),
        stepsCount: ((existingWorkflow.state.stepsCount as number) || 0) + 1,
      };

      await SupabaseWorkflowRepo.saveWorkflow({
        id: existingWorkflow.id,
        organizationId: existingWorkflow.organizationId,
        title: existingWorkflow.title,
        definition: existingWorkflow.definition,
        status: "active",
        state: updatedState,
      });
    }

    // 3. Update Agent Context State in Supabase
    const existingAgentState = await SupabaseAgentStateRepo.getAgentState(params.agentKey, params.userId);
    const stepLogs = existingAgentState?.stepLogs || [];
    stepLogs.push({
      step: params.stepName,
      timestamp: new Date().toISOString(),
      status: "success",
    });

    await SupabaseAgentStateRepo.saveAgentState({
      id: `state_${params.agentKey}_${params.userId}`,
      agentKey: params.agentKey,
      userId: params.userId,
      contextMemory: { ...(existingAgentState?.contextMemory || {}), lastStep: params.stepName },
      stepLogs,
    });

    // 4. Cache step output in Redis (5-minute TTL)
    await setCache(cacheKey, params.stepOutput, 300);

    return { stepOutput: params.stepOutput, transientDraftId };
  }

  /**
   * Promotes a transient draft artifact from PocketBase into Supabase as a primary, persistent record
   */
  async commitDraftArtifact(draftId: string): Promise<{ success: boolean; syncedRecordId?: string }> {
    return await syncPocketBaseToSupabase("transient_ai_artifacts", draftId, "workflow");
  }

  /**
   * Persists chat history thread and messages directly to Supabase
   */
  async appendChatMessage(params: { threadId: string; senderId: string; role: "user" | "assistant" | "system"; content: string; agentKey?: string }): Promise<SupabaseChatMessage> {
    const message = await SupabaseChatRepo.addChatMessage(params);
    // Flush chat cache in Redis
    await setCache(`chat_latest:${params.threadId}`, message, 600);
    return message;
  }
}

export const aiWorkflowService = new AIWorkflowService();
