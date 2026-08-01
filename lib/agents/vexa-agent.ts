import { A2AMessageBus, A2AMessageType } from "../a2a";
import { ScraplingCrawler } from "../scrapling";
import { performDynamicInferenceJSON } from "../ai-provider-router";
import crypto from "crypto";
import { generateMockCompleteGTM, generateMockPlaybook } from "../mock-responses";

export function initializeVexaAgent(messageBus: A2AMessageBus) {
  const agentId = "vexa-agent";

  console.log(`[VexaAgent] Subscribing to A2A topic: ${agentId}`);

  // Helper to delegate tasks to other agents over A2A and wait for response
  async function delegateTask(to: string, taskType: string, input: any): Promise<any> {
    const correlationId = crypto.randomUUID();
    const taskId = crypto.randomUUID();

    return new Promise((resolve, reject) => {
      const unsubscribe = messageBus.subscribe(agentId, (message) => {
        if (
          message.correlationId === correlationId &&
          (message.type === A2AMessageType.TASK_RESULT || message.type === A2AMessageType.TASK_ERROR)
        ) {
          unsubscribe();
          if (message.type === A2AMessageType.TASK_RESULT) {
            resolve(message.payload.result);
          } else {
            reject(new Error(message.payload.error || "Task failed"));
          }
        }
      });

      messageBus
        .createAndSendMessage(
          agentId,
          to,
          A2AMessageType.TASK_DELEGATION,
          {
            taskId,
            taskType,
            input,
          },
          { correlationId, priority: "high" }
        )
        .catch((err) => {
          unsubscribe();
          reject(err);
        });
    });
  }

  // Subscribe to A2A message bus
  messageBus.subscribe(agentId, async (message) => {
    if (message.type !== A2AMessageType.TASK_DELEGATION) {
      return;
    }

    const { taskId, taskType, input } = message.payload;
    console.log(`[VexaAgent] Received task: ${taskId} (${taskType})`);

    try {
    let result: any;

    switch (taskType) {
      case "generate_agenda": {
        console.log(`[VexaAgent] Generating agenda for meeting: ${input.meetingId}`);
        result = {
          success: true,
          agenda: [
            { id: crypto.randomUUID(), title: "Check-in & Introduction" },
            { id: crypto.randomUUID(), title: "Review Previous Action Items" },
            { id: crypto.randomUUID(), title: "Main Discussion Topics" },
            { id: crypto.randomUUID(), title: "Next Steps & Action Items" },
          ]
        };
        break;
      }
      case "post_meeting_analysis": {
        console.log(`[VexaAgent] Generating post-meeting analysis for: ${input.meetingId}`);
        result = {
          success: true,
          summary: "This was a productive meeting where we discussed key topics and agreed on next steps.",
          actionItems: ["Send follow-up email", "Schedule next meeting", "Prepare presentation"],
        };
        break;
      }
      case "process_intake_form": {
          const rawFormData = input.formData;
          const leadId = input.leadId || "unauth";

          console.log(`[VexaAgent] Processing intake form for company: ${rawFormData.companyName || "Unknown"}`);
          const structuredIntake = ScraplingCrawler.processIntakeForm(rawFormData);

          let websiteContent = "No website content available.";
          if (structuredIntake.websiteUrl) {
            console.log(`[VexaAgent] Triggering Scrapling crawl on website: ${structuredIntake.websiteUrl}`);
            const crawlResult = await ScraplingCrawler.crawl(structuredIntake.websiteUrl);
            websiteContent = crawlResult.cleanedText;
          }

          // Step 1: Generate GTM Analysis
          console.log(`[VexaAgent] Step 1: Generating GTM Analysis via LLM...`);
          const gtmSystemPrompt = "You are Vexa, the lead strategist agent for DealFlow.AI. Generate a structured Go-To-Market analysis that strictly adheres to the OpenSpec GTM format.";
          const gtmUserPrompt = `
Generate a GTM Analysis for:
Company: ${structuredIntake.companyName}
Website: ${structuredIntake.websiteUrl}
Intake Profile: ${JSON.stringify(structuredIntake, null, 2)}
Scraped Website Content: ${websiteContent.substring(0, 8000)}

Follow this JSON structure exactly:
{
  "executiveSummary": "A concise summary of the strategy (~150 words)",
  "icpDefinition": {
    "inclusionCriteria": ["string", "string"],
    "exclusionCriteria": ["string", "string"]
  },
  "table1FirmographicDemographic": [
    {
      "priorityTier": "Tier 1",
      "industryVertical": "string",
      "companySize": "string",
      "arrRange": "string",
      "location": "string",
      "keyDecisionMakerDemographics": "string",
      "notes": "string",
      "primaryCostDriver": "string",
      "currentSolutionStatus": "string",
      "numberOfSitesTeamsLocations": "string",
      "sustainabilityEsgComplianceCommitment": "string"
    }
  ],
  "behavioralPsychographicTraits": {
    "observableBehavioralPatterns": ["string"],
    "corePsychographicAttributes": ["string"]
  },
  "table2PainPointAnalysis": [
    {
      "painPoint": "string",
      "severity": "string",
      "businessImpact": "string",
      "rootCause": "string",
      "dealFlowAISolution": "string",
      "frequencyOfPain": "string",
      "howPainIsCurrentlyDiscovered": "string",
      "competitorCurrentSolutionInUse": "string"
    }
  ],
  "table3DecisionMakerInfluence": [
    {
      "role": "string",
      "influenceScore": "string",
      "coreDecisionRole": "string",
      "top3Priorities": "string",
      "dealFlowAIMessagingFocus": "string",
      "preferredContactChannel": "string",
      "primaryObjectionType": "string",
      "contentFormatPreference": "string"
    }
  ],
  "purchasingJourneyMapping": [
    {
      "stage": "string",
      "duration": "string",
      "customerActions": "string",
      "customerNeedsQuestions": "string",
      "channelPreferences": "string",
      "dealFlowAIAssetsEngagement": "string"
    }
  ],
  "table4LeadScoringFramework": {
    "criteria": [
      {
        "category": "string",
        "criterion": "string",
        "points": "string"
      }
    ],
    "qualificationThresholds": {
      "mql": "string",
      "sql": "string",
      "sal": "string"
    }
  },
  "table5ChannelEffectiveness": [
    {
      "channel": "string",
      "icpSegmentsBestFor": "string",
      "monthlyLeadVolume": "string",
      "conversionRate": "string",
      "costPerAcquisition": "string",
      "ltvToCacRatio": "string",
      "budgetAllocation": "string",
      "optimizationRecommendations": "string"
    }
  ],
  "crossTeamAlignmentGuidelines": {
    "sharedSLAs": [{ "sla": "string", "owner": "string", "escalationPath": "string" }],
    "weeklyReviewMeeting": { "cadence": "string", "owner": "string" },
    "hotLeadCriteria": "string"
  },
  "icpValidationChecklist": {
    "preQualificationChecklist": ["string"],
    "quarterlyValidationReview": ["string"],
    "dataSourcesForValidation": ["string"],
    "icpUpdateTriggers": ["string"],
    "quarterlyReviewOwner": "string",
    "scoringThresholdForRevision": "string",
    "reviewChecklist": ["string"]
  }
}
`;

          let gtmAnalysis;
          try {
            gtmAnalysis = await performDynamicInferenceJSON(
              gtmUserPrompt,
              gtmSystemPrompt,
              { requestType: `gtm-analysis-${leadId}` }
            );
            gtmAnalysis = { ...generateMockCompleteGTM(structuredIntake.companyName, rawFormData), ...gtmAnalysis };
          } catch (error) {
            console.warn(`[VexaAgent] Failed to generate GTM analysis via LLM, using fallback:`, error);
            gtmAnalysis = generateMockCompleteGTM(structuredIntake.companyName, rawFormData);
          }

          // Validate GTM Analysis via OpenSpec agent
          console.log(`[VexaAgent] Validating GTM Analysis with OpenSpec agent...`);
          const gtmValidation = await delegateTask("openspec-agent", "validate_gtm_spec", { data: gtmAnalysis });
          if (!gtmValidation.success) {
            console.warn(`[VexaAgent] GTM validation warnings:`, gtmValidation.errors);
          }

          // Store GTM Analysis in Hermes Memory
          console.log(`[VexaAgent] Storing GTM Analysis in Hermes agent...`);
          await delegateTask("hermes-agent", "store_memory", {
            content: JSON.stringify(gtmAnalysis),
            category: "gtm_analysis",
            tier: "long-term",
            leadId,
            metadata: {}
          });

          // Step 2: Generate Playbook
          console.log(`[VexaAgent] Step 2: Generating Outreach Playbook via LLM...`);
          const playbookSystemPrompt = "You are Vexa, the lead strategist agent for DealFlow.AI. Generate a structured strategic playbook that strictly adheres to the OpenSpec Playbook format.";
          const playbookUserPrompt = `
Generate a Strategic Outreach Playbook based on this GTM Analysis:
GTM Analysis: ${JSON.stringify(gtmAnalysis, null, 2)}
Intake Profile: ${JSON.stringify(structuredIntake, null, 2)}

Follow this JSON structure exactly:
{
  "sectionACompetitiveLandscape": [
    {
      "competitorName": "string",
      "coreOffering": "string",
      "keyWeakness": "string",
      "companyDifferentiator": "string",
      "positioningStatement": "string"
    }
  ],
  "sectionBMessagingAndPositioning": [
    {
      "painPoint": "string",
      "valuePillar": "string",
      "hookLine": "string",
      "supportingProofPoint": "string",
      "cta": "string",
      "personaMessaging": [
        {
          "persona": "string",
          "messaging": "string"
        }
      ]
    }
  ],
  "sectionCObjectionHandlingMatrix": [
    {
      "objection": "string",
      "personaMostLikelyToRaiseIt": "string",
      "responseFramework": "string",
      "supportingAsset": "string"
    }
  ],
  "sectionDTamSamSom": {
    "tam": "string",
    "sam": "string",
    "som": "string"
  },
  "sectionEPartnerAndChannelStrategy": {
    "referralPartners": ["string"],
    "partnerIncentiveModel": "string",
    "coMarketingOpportunities": ["string"]
  },
  "sectionFRiskRegister": [
    {
      "risk": "string",
      "likelihood": "Medium",
      "impact": "Medium",
      "mitigation": "string"
    }
  ],
  "campaignSuccessMetrics": {
    "pipelineGeneratedTargetByTier": [{ "tier": "Tier 1", "target": "string" }],
    "mqlToSqlConversionRateTarget": "string",
    "cacTargetByChannel": [{ "channel": "string", "target": "string" }],
    "dealVelocityBenchmarkByTier": [{ "tier": "Tier 1", "days": "string" }]
  }
}
`;

          let playbook;
          try {
            playbook = await performDynamicInferenceJSON(
              playbookUserPrompt,
              playbookSystemPrompt,
              { requestType: `gtm-playbook-${leadId}` }
            );
            playbook = { ...generateMockPlaybook(structuredIntake.companyName), ...playbook };
          } catch (error) {
            console.warn(`[VexaAgent] Failed to generate playbook via LLM, using fallback:`, error);
            playbook = generateMockPlaybook(structuredIntake.companyName);
          }

          // Validate Playbook via OpenSpec agent
          console.log(`[VexaAgent] Validating Outreach Playbook with OpenSpec agent...`);
          const playbookValidation = await delegateTask("openspec-agent", "validate_playbook_spec", { data: playbook });
          if (!playbookValidation.success) {
            console.warn(`[VexaAgent] Playbook validation warnings:`, playbookValidation.errors);
          }

          // Store Playbook in Hermes Memory
          console.log(`[VexaAgent] Storing Outreach Playbook in Hermes agent...`);
          await delegateTask("hermes-agent", "store_memory", {
            content: JSON.stringify(playbook),
            category: "playbook",
            tier: "long-term",
            leadId,
            metadata: {}
          });

          result = {
            success: true,
            gtmAnalysis,
            playbook,
          };
          break;
        }

        default:
          throw new Error(`Unsupported task type: ${taskType}`);
      }

      await messageBus.createAndSendMessage(
        agentId,
        message.from,
        A2AMessageType.TASK_RESULT,
        {
          taskId,
          result,
        },
        { correlationId: message.correlationId }
      );
      console.log(`[VexaAgent] Successfully completed task execution: ${taskId}`);
    } catch (error) {
      console.error(`[VexaAgent] Failed task ${taskId}:`, error);
      await messageBus.createAndSendMessage(
        agentId,
        message.from,
        A2AMessageType.TASK_ERROR,
        {
          taskId,
          error: error instanceof Error ? error.message : String(error),
        },
        { correlationId: message.correlationId }
      );
    }
  });
}
