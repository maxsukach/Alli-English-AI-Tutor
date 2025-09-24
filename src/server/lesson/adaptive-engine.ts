import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma";
import type {
  AdaptiveDecisionContract,
  AdaptiveInput,
  LessonPlanContract,
} from "./contracts";

export class AdaptiveEngine {
  async recommend(
    input: AdaptiveInput,
    plan: LessonPlanContract,
  ): Promise<AdaptiveDecisionContract> {
    const primaryTarget = plan.targets[0]?.id ?? "structure.A2.default";
    const abilityRecord = await prisma.adaptiveAbility.upsert({
      where: {
        profileId_skillId: {
          profileId: input.profileId,
          skillId: primaryTarget,
        },
      },
      update: {},
      create: {
        profileId: input.profileId,
        skillId: primaryTarget,
        theta: 0,
        sigma: 0.5,
      },
    });

    const accuracy = input.signals.acc ?? 0.6;
    const responseTime = input.signals.rt_ms ?? 6000;
    const confidence = input.signals.conf ?? 2;

    const baseline = 0.65;
    const thetaDelta = (accuracy - baseline) * 0.8 - Math.max(0, (responseTime - 8000) / 8000) * 0.1;
    const newTheta = abilityRecord.theta + thetaDelta;
    const newSigma = Math.max(0.15, abilityRecord.sigma * 0.9);

    await prisma.adaptiveAbility.update({
      where: { id: abilityRecord.id },
      data: {
        theta: newTheta,
        sigma: newSigma,
      },
    });

    const action = this.selectAction(accuracy, confidence);
    const decision = {
      action,
      delta: action === "advance" ? 1 : action === "remediate" ? -1 : 0,
    } as AdaptiveDecisionContract["decision"];

    const nextTask = this.pickNextTask(plan, action);

    const decisionContract: AdaptiveDecisionContract = {
      lessonId: input.lessonId,
      stageId: input.stageId,
      ability: {
        [primaryTarget]: { theta: newTheta, sigma: newSigma },
      },
      decision,
      nextTask: nextTask ?? undefined,
      rationale: {
        signals: {
          acc: Number(accuracy.toFixed(2)),
          rt_ms: responseTime,
          conf: confidence,
        },
        rule: this.describeRule(action, accuracy, confidence),
      },
    };

    await prisma.adaptiveEvent.create({
      data: {
        lessonRunId: input.lessonId,
        stageId: input.stageId,
        action: action === "advance" ? "ADVANCE" : action === "remediate" ? "REMEDIATE" : "REPEAT",
        decisionJson: decisionContract as unknown as Prisma.InputJsonValue,
        abilityBefore: {
          theta: abilityRecord.theta,
          sigma: abilityRecord.sigma,
        } as unknown as Prisma.InputJsonValue,
        abilityAfter: {
          theta: newTheta,
          sigma: newSigma,
        } as unknown as Prisma.InputJsonValue,
        signals: input.signals as unknown as Prisma.InputJsonValue,
      },
    });

    return decisionContract;
  }

  private selectAction(accuracy: number, confidence: number): "advance" | "repeat" | "remediate" {
    if (accuracy >= 0.75 && confidence >= 2) {
      return "advance";
    }
    if (accuracy < 0.45) {
      return "remediate";
    }
    return "repeat";
  }

  private pickNextTask(plan: LessonPlanContract, action: "advance" | "repeat" | "remediate") {
    if (action === "advance") {
      const extensionStage = plan.stages.find((stage) => stage.kind === "extension");
      if (extensionStage) {
        return {
          id: extensionStage.id,
          difficulty: 0.4,
          variant: "extension",
        };
      }
    }
    if (action === "remediate") {
      return {
        id: "remediate_drill",
        difficulty: -0.2,
        variant: "remediate",
      };
    }
    return null;
  }

  private describeRule(
    action: "advance" | "repeat" | "remediate",
    accuracy: number,
    confidence: number,
  ) {
    if (action === "advance") {
      return "IRT.confident_success";
    }
    if (action === "remediate") {
      return accuracy < 0.3 ? "IRT.high_error" : "IRT.low_confidence";
    }
    return confidence < 2 ? "IRT.monitor_confidence" : "IRT.low_margin";
  }
}
