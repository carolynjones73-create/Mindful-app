export interface Quote {
  id: string;
  text: string;
  author: string;
  category: 'money' | 'mindset' | 'progress';
}

const quotes: Quote[] = [
  {
    id: '1',
    text: 'The real measure of your wealth is how much you\'d be worth if you lost all your money.',
    author: 'Anonymous',
    category: 'money'
  },
  {
    id: '2',
    text: 'It\'s not how much money you make, but how much money you keep, how hard it works for you, and how many generations you keep it for.',
    author: 'Robert Kiyosaki',
    category: 'money'
  },
  {
    id: '3',
    text: 'The stock market is filled with individuals who know the price of everything, but the value of nothing.',
    author: 'Philip Fisher',
    category: 'money'
  },
  {
    id: '4',
    text: 'Your net worth to the network is more important than your network\'s net worth to you.',
    author: 'Tim O\'Reilly',
    category: 'money'
  },
  {
    id: '5',
    text: 'The habit of saving is itself an education; it fosters every virtue, teaches self-denial, cultivates the sense of order, trains to forethought, and so broadens the mind.',
    author: 'T.T. Munger',
    category: 'money'
  },
  {
    id: '6',
    text: 'Whether you think you can or you think you can\'t, you\'re right.',
    author: 'Henry Ford',
    category: 'mindset'
  },
  {
    id: '7',
    text: 'The only impossible journey is the one you never begin.',
    author: 'Tony Robbins',
    category: 'mindset'
  },
  {
    id: '8',
    text: 'Your limitation—it\'s only your imagination.',
    author: 'Anonymous',
    category: 'mindset'
  },
  {
    id: '9',
    text: 'Success is not final, failure is not fatal: it is the courage to continue that counts.',
    author: 'Winston Churchill',
    category: 'mindset'
  },
  {
    id: '10',
    text: 'The way to get started is to quit talking and begin doing.',
    author: 'Walt Disney',
    category: 'mindset'
  },
  {
    id: '11',
    text: 'Progress, not perfection.',
    author: 'Anonymous',
    category: 'progress'
  },
  {
    id: '12',
    text: 'A little progress each day adds up to big results.',
    author: 'Satya Nani',
    category: 'progress'
  },
  {
    id: '13',
    text: 'The secret of getting ahead is getting started.',
    author: 'Mark Twain',
    category: 'progress'
  },
  {
    id: '14',
    text: 'Don\'t watch the clock; do what it does. Keep going.',
    author: 'Sam Levenson',
    category: 'progress'
  },
  {
    id: '15',
    text: 'Small steps in the right direction can turn out to be the biggest step of your life.',
    author: 'Anonymous',
    category: 'progress'
  }
];

export function getRandomQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * quotes.length);
  return quotes[randomIndex];
}

export function getTipForQuote(quote: Quote): string {
  const tipsByCategory = {
    money: [
      'Start tracking every expense for the next week to understand where your money goes.',
      'Set up an automatic transfer to savings, even if it\'s just $5 per week.',
      'Review one subscription or recurring payment today - do you still need it?',
      'Calculate how much a daily coffee habit costs per year - you might be surprised!',
      'Create a simple budget with three categories: needs, wants, and savings.'
    ],
    mindset: [
      'Write down three things you\'re grateful for about your financial situation today.',
      'Replace "I can\'t afford it" with "How can I afford it?" to shift your thinking.',
      'Spend 5 minutes visualizing your financial goals as already achieved.',
      'Challenge one limiting belief you have about money today.',
      'Practice saying "I am worthy of financial abundance" three times in the mirror.'
    ],
    progress: [
      'Celebrate one small financial win from this week, no matter how tiny.',
      'Set one specific, measurable financial goal for the next 30 days.',
      'Review your progress from last month - what worked and what didn\'t?',
      'Take one small action today that your future self will thank you for.',
      'Document your financial journey - write down where you are now vs. where you started.'
    ]
  };

  const categoryTips = tipsByCategory[quote.category];
  const randomTipIndex = Math.floor(Math.random() * categoryTips.length);
  return categoryTips[randomTipIndex];
}