
import {
  LoopPhase,
  LoopStatus,
  LoopIteration,
  LoopMetrics,
  FeedbackItem,
  LoopConfiguration,
  LoopState,
  AgentType
} from "./types";
import { KimiClient } from "../kimi";

export class LoopEngine {
  private loops: Map<string, LoopState>;
  private kimiClient: KimiClient;

  constructor(kimiClient: KimiClient) {
    this.loops = new Map();
    this.kimiClient = kimiClient;
  }

  createLoop(config: LoopConfiguration): LoopState {
    const loop: LoopState = {
      id: config.id,
      config,
      status: LoopStatus.IDLE,
      currentPhase: LoopPhase.REQUIREMENT_PARSE,
      currentIteration: 0,
      iterations: [],
      metrics: {
        totalIterations: 0,
        totalTime: 0,
        averageTimePerIteration: 0,
        errorRate: 0,
        improvementRate: 0,
        tasksCompleted: 0
      },
      feedback: [],
      startedAt: Date.now()
    };
    this.loops.set(config.id, loop);
    return loop;
  }

  getLoop(loopId: string): LoopState | undefined {
    return this.loops.get(loopId);
  }

  getAllLoops(): LoopState[] {
    return Array.from(this.loops.values());
  }

  async startLoop(loopId: string): Promise<LoopState> {
    const loop = this.loops.get(loopId);
    if (!loop) {
      throw new Error(`Loop ${loopId} not found`);
    }
    loop.status = LoopStatus.RUNNING;
    await this.runLoop(loop);
    return loop;
  }

  pauseLoop(loopId: string): void {
    const loop = this.loops.get(loopId);
    if (loop) {
      loop.status = LoopStatus.PAUSED;
    }
  }

  async resumeLoop(loopId: string): Promise<LoopState | undefined> {
    const loop = this.loops.get(loopId);
    if (loop) {
      loop.status = LoopStatus.RUNNING;
      await this.runLoop(loop);
      return loop;
    }
    return undefined;
  }

  async runLoop(loop: LoopState): Promise<void> {
    while (loop.status === LoopStatus.RUNNING && loop.currentIteration < loop.config.maxIterations) {
      for (const phase of loop.config.phases) {
        if (loop.status !== LoopStatus.RUNNING) break;
        await this.executePhase(loop, phase);
      }

      if (loop.config.enableSelfImprovement) {
        await this.executeSelfImprovement(loop);
      }

      loop.currentIteration++;
    }

    if (loop.status === LoopStatus.RUNNING) {
      loop.status = LoopStatus.COMPLETED;
      loop.completedAt = Date.now();
    }
  }

  private async executePhase(loop: LoopState, phase: LoopPhase): Promise<void> {
    const iteration: LoopIteration = {
      id: crypto.randomUUID(),
      loopId: loop.id,
      phase,
      startedAt: Date.now(),
      status: LoopStatus.RUNNING
    };

    loop.iterations.push(iteration);

    try {
      await this.runPhaseAgents(loop, phase, iteration);
      iteration.status = LoopStatus.COMPLETED;
    } catch (error: any) {
      iteration.status = LoopStatus.FAILED;
      iteration.error = error.message;
      console.error(`Phase ${phase} failed:`, error);
    } finally {
      iteration.completedAt = Date.now();
      this.updateLoopMetrics(loop);
    }
  }

  private async runPhaseAgents(
    loop: LoopState,
    phase: LoopPhase,
    iteration: LoopIteration
  ): Promise<void> {
    // Mock agent execution for now
    switch (phase) {
      case LoopPhase.REQUIREMENT_PARSE:
        await this.simulateAgent(AgentType.REQUIREMENT_ANALYST, iteration);
        break;
      case LoopPhase.TASK_DECOMPOSITION:
        await this.simulateAgent(AgentType.TASK_DECOMPOSER, iteration);
        break;
      case LoopPhase.CODE_GENERATION:
        await this.simulateAgent(AgentType.CODE_GENERATOR, iteration);
        break;
      case LoopPhase.VALIDATION:
        await this.simulateAgent(AgentType.TESTING_AGENT, iteration);
        break;
      case LoopPhase.DEPLOYMENT:
        await this.simulateAgent(AgentType.MONITORING_AGENT, iteration);
        break;
      default:
        break;
    }
  }

  private async simulateAgent(type: AgentType, iteration: LoopIteration): Promise<void> {
    // Simulate agent work with random delay
    const delay = 1000 + Math.random() * 2000;
    await new Promise(resolve => setTimeout(resolve, delay));
    iteration.output = {
      agent: type,
      success: true,
      result: `Successfully completed ${type} task`
    };
  }

  private async executeSelfImprovement(loop: LoopState): Promise<void> {
    // Self improvement loop based on feedback
    const improvementIteration: LoopIteration = {
      id: crypto.randomUUID(),
      loopId: loop.id,
      phase: LoopPhase.SELF_IMPROVEMENT,
      startedAt: Date.now(),
      status: LoopStatus.RUNNING
    };

    await this.simulateAgent(AgentType.IMPROVEMENT_AGENT, improvementIteration);
    improvementIteration.status = LoopStatus.COMPLETED;
    improvementIteration.completedAt = Date.now();
    loop.iterations.push(improvementIteration);
  }

  addFeedback(loopId: string, feedback: Omit<FeedbackItem, "id" | "timestamp" | "processed">): void {
    const loop = this.loops.get(loopId);
    if (loop) {
      loop.feedback.push({
        ...feedback,
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        processed: false
      });
    }
  }

  processFeedback(loopId: string): void {
    const loop = this.loops.get(loopId);
    if (loop) {
      loop.feedback.forEach(fb => {
        fb.processed = true;
      });
    }
  }

  private updateLoopMetrics(loop: LoopState): void {
    const completedIterations = loop.iterations.filter(i => i.status === LoopStatus.COMPLETED);
    const failedIterations = loop.iterations.filter(i => i.status === LoopStatus.FAILED);

    loop.metrics.totalIterations = loop.iterations.length;
    loop.metrics.tasksCompleted = completedIterations.length;
    loop.metrics.errorRate = failedIterations.length / (loop.iterations.length || 1);

    if (completedIterations.length > 0) {
      const totalTime = completedIterations.reduce(
        (sum, i) => sum + ((i.completedAt || Date.now()) - i.startedAt),
        0
      );
      loop.metrics.totalTime = totalTime;
      loop.metrics.averageTimePerIteration = totalTime / completedIterations.length;
    }

    // Simple improvement rate mock
    loop.metrics.improvementRate = Math.min(0.5, loop.currentIteration * 0.05);
  }
}

