// Memecoin trivia questions and answers
export interface TriviaQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number; // index of correct option
  explanation: string;
}

export const MEMECOIN_TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 1,
    question: "Which memecoin started as a joke based on the 'Doge' meme?",
    options: ["Shiba Inu", "Dogecoin", "Floki", "Bonk"],
    correctAnswer: 1,
    explanation: "Dogecoin was created in 2013 as a joke cryptocurrency featuring the Shiba Inu dog from the 'Doge' meme."
  },
  {
    id: 2,
    question: "What blockchain is BONK built on?",
    options: ["Ethereum", "Binance Smart Chain", "Solana", "Polygon"],
    correctAnswer: 2,
    explanation: "BONK is Solana's first dog-themed memecoin, launched in December 2022."
  },
  {
    id: 3,
    question: "Which billionaire frequently tweets about Dogecoin?",
    options: ["Bill Gates", "Elon Musk", "Jeff Bezos", "Warren Buffett"],
    correctAnswer: 1,
    explanation: "Elon Musk has been a vocal supporter of Dogecoin, often tweeting about it."
  },
  {
    id: 4,
    question: "What does 'HODL' mean in crypto culture?",
    options: ["Hold On for Dear Life", "High Order Digital Ledger", "Highly Optimized Data Link", "Hold On During Loss"],
    correctAnswer: 0,
    explanation: "HODL originated from a misspelling of 'hold' and became 'Hold On for Dear Life' in crypto culture."
  },
  {
    id: 5,
    question: "Which memecoin is known as the 'Dogecoin killer'?",
    options: ["SafeMoon", "Shiba Inu", "Pepe", "Floki"],
    correctAnswer: 1,
    explanation: "Shiba Inu (SHIB) marketed itself as the 'Dogecoin killer' when it launched."
  },
  {
    id: 6,
    question: "What inspired the creation of Pepe coin?",
    options: ["Pepe the Frog meme", "Pepsi Cola", "A famous trader", "A video game"],
    correctAnswer: 0,
    explanation: "Pepe coin was inspired by the popular internet meme character Pepe the Frog."
  },
  {
    id: 7,
    question: "Which platform popularized pump.fun memecoins?",
    options: ["Ethereum", "Binance", "Solana", "Bitcoin"],
    correctAnswer: 2,
    explanation: "Pump.fun is a Solana-based platform for launching memecoins quickly."
  },
  {
    id: 8,
    question: "What year was Dogecoin created?",
    options: ["2011", "2013", "2015", "2017"],
    correctAnswer: 1,
    explanation: "Dogecoin was created in December 2013 by Billy Markus and Jackson Palmer."
  },
  {
    id: 9,
    question: "What is the maximum supply of Dogecoin?",
    options: ["21 million", "100 billion", "1 trillion", "No maximum supply"],
    correctAnswer: 3,
    explanation: "Unlike Bitcoin, Dogecoin has no maximum supply limit and is inflationary."
  },
  {
    id: 10,
    question: "Which memecoin was airdropped to Solana users in 2022?",
    options: ["SAMO", "BONK", "WIF", "MYRO"],
    correctAnswer: 1,
    explanation: "BONK was airdropped to Solana users in December 2022 as a community token."
  },
  {
    id: 11,
    question: "What does 'To the moon!' mean in memecoin culture?",
    options: ["Price will crash", "Price will skyrocket", "New launch coming", "Community meetup"],
    correctAnswer: 1,
    explanation: "'To the moon!' expresses hope that a cryptocurrency's price will dramatically increase."
  },
  {
    id: 12,
    question: "Which dog breed is featured in Dogecoin?",
    options: ["Golden Retriever", "Shiba Inu", "Corgi", "Husky"],
    correctAnswer: 1,
    explanation: "Dogecoin features a Shiba Inu dog, which became famous through the 'Doge' meme."
  },
  {
    id: 13,
    question: "What is a 'rug pull' in memecoin terms?",
    options: ["Price increase", "Developer scam", "Community vote", "Token burn"],
    correctAnswer: 1,
    explanation: "A rug pull is when developers abandon a project and run away with investors' funds."
  },
  {
    id: 14,
    question: "Which chain hosts the most memecoins by volume?",
    options: ["Bitcoin", "Ethereum", "Solana", "Cardano"],
    correctAnswer: 2,
    explanation: "Solana has become the preferred chain for memecoin launches due to low fees and fast transactions."
  },
  {
    id: 15,
    question: "What is 'diamond hands' in memecoin trading?",
    options: ["Selling quickly", "Holding despite losses", "Day trading", "Buying the dip"],
    correctAnswer: 1,
    explanation: "Diamond hands refers to holding an investment despite pressure to sell, especially during dips."
  }
];

export function getRandomQuestions(count: number = 5): TriviaQuestion[] {
  const shuffled = [...MEMECOIN_TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

export function calculateTriviaReward(correctAnswers: number, totalQuestions: number): number {
  const percentage = (correctAnswers / totalQuestions) * 100;

  if (percentage === 100) {
    return 40; // Max reward for perfect score
  } else if (percentage >= 80) {
    return 30;
  } else if (percentage >= 60) {
    return 20;
  } else if (percentage >= 40) {
    return 15;
  } else {
    return 10; // Min reward for trying
  }
}