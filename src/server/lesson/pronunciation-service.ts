interface AnalyzeArgs {
  transcript?: string;
}

export interface PronunciationAnalysis {
  score: number;
  hints: string[];
}

export class PronunciationService {
  async analyze({ transcript }: AnalyzeArgs): Promise<PronunciationAnalysis> {
    if (!transcript) {
      return {
        score: 0.4,
        hints: ["Speak a little louder so I can capture your audio."],
      };
    }
    const syllableCount = transcript.split(/\s+/).length;
    const score = Math.min(0.95, 0.6 + syllableCount * 0.01);
    const hints = [
      "Watch final /d/ consonant release in 'didn't'.",
      "Keep your intonation falling at sentence endings.",
    ];
    return { score, hints };
  }
}
