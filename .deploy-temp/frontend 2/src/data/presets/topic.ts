// src/pages/DefineTopic/topic.presets.ts
export type TopicPreset = {
    question: string;
    others: string[];
  };
  
  export const TOPIC_PRESETS: Record<string, TopicPreset> = {
    happiness: {
      question:
        'Let us define the correlation between expectation, satisfaction, and the degree of happiness.',
      others: [
        'Why Expectations Shape Our Joy',
        'Hedonic Adaptation & Baseline',
        'Gratitude vs. Goals',
      ],
    },
    obsession: {
      question: 'When does persistence become obsession—and how can we tell?',
      others: ['Flow or Fixation?', 'Healthy Grind', 'Signals to Stop'],
    },
    success: {
      question: 'Define success without external metrics. What remains?',
      others: ['Redefining Wins', 'Inner Scoreboard', 'Process > Outcome'],
    },
    art: {
      question: 'Is art defined by intention, perception, or context?',
      others: ['Artist vs. Audience', 'Frame Effects', 'Meaning Emerges'],
    },
    direction: {
      question: 'How do we choose direction under uncertainty?',
      others: ['Explore/Exploit', 'Regret Minimization', 'Tiny Bets'],
    },
  };