import { PrismaClient } from "../src/generated/prisma/index.js";

const prisma = new PrismaClient();

async function main() {
  const profile = await prisma.profile.upsert({
    where: { userId: "demo-user" },
    update: {},
    create: {
      userId: "demo-user",
      name: "Demo Learner",
      email: "learner@example.com",
      cefrRange: "A2",
      goals: "Practice travel conversations",
      interests: "travel, food",
      nativeLanguage: "uk",
      preferences: {
        reminders: true,
        lesson_length: 15,
      },
    },
  });

  const kbDoc = await prisma.kbDoc.upsert({
    where: { externalRef: "kb://a2/past_simple" },
    update: {},
    create: {
      externalRef: "kb://a2/past_simple",
      cefr: "A2",
      topic: "travel_a2",
      kind: "grammar",
      content: {
        explanation: "Past simple negative forms",
        examples: ["I didn't go", "We didn't have lunch"],
      },
    },
  });

  const lessonPlan = await prisma.lessonPlan.create({
    data: {
      lessonId: "seed-lesson-1",
      userId: profile.id,
      plan: {
        cefr: "A2",
        targets: [
          { type: "structure", id: "past_simple_neg" },
          { type: "vocab", id: "travel_a2" },
        ],
        stages: [
          { id: "warmup", kind: "dialogue" },
          { id: "task", kind: "roleplay" },
          { id: "feedback", kind: "formative" },
        ],
      },
    },
  });

  const lessonRun = await prisma.lessonRun.upsert({
    where: { lessonId: lessonPlan.lessonId },
    update: {
      feedbackJson: {
        summary: "Good job!",
        errors: [],
        recommendations: ["Review minimal pairs"],
      },
      audioRef: "https://example.com/audio.wav",
    },
    create: {
      lessonId: lessonPlan.lessonId,
      profileId: profile.id,
      targetStructures: ["past_simple_neg"],
      targetVocab: ["travel_a2"],
      feedbackJson: {
        summary: "Great start!",
        errors: [],
        recommendations: ["Practice more"],
      },
      audioRef: "https://example.com/audio.wav",
    },
  });

  await prisma.errorLog.create({
    data: {
      profileId: profile.id,
      lessonRunId: lessonRun.id,
      errorType: "GRAM",
      snippet: "I don't went",
      correction: "I didn't go",
      severity: 2,
    },
  });

  await prisma.srsQueue.upsert({
    where: {
      profileId_itemId_itemType: {
        profileId: profile.id,
        itemId: "past_simple_neg",
        itemType: "PATTERN",
      },
    },
    update: {
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      ease: 2.1,
      interval: 2,
    },
    create: {
      profileId: profile.id,
      itemId: "past_simple_neg",
      itemType: "PATTERN",
      dueAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      ease: 2.1,
      interval: 2,
    },
  });

  await prisma.event.create({
    data: {
      profileId: profile.id,
      eventName: "lesson_seeded",
      props: {
        lessonId: lessonRun.lessonId,
        kbDocId: kbDoc.id,
      },
    },
  });

  await prisma.media.create({
    data: {
      profileId: profile.id,
      lessonRunId: lessonRun.id,
      kind: "AUDIO",
      uri: "https://example.com/audio.wav",
      metadata: { duration_ms: 12000 },
    },
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
