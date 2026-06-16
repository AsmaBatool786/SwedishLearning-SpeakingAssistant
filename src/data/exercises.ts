import { Question, PracticeScenario } from '../types';

export const grammarExercises: Question[] = [
  // 1. En / Ett (Noun Gender Focus)
  {
    id: 'en-ett-1',
    category: 'en-ett',
    question: 'Choose the correct indefinite article (En or Ett) for the word: "Bil" (Car)',
    word: 'Bil',
    correctAnswer: 'en',
    hint: 'Most Swedish concrete nouns (about 75%) are "en" words.',
    explanation: '"Bil" is an "en-word" (en bil, bilen). There is no absolute rule, but about 75% of Swedish nouns are en-words.'
  },
  {
    id: 'en-ett-2',
    category: 'en-ett',
    question: 'Choose the correct indefinite article (En or Ett) for the word: "Hus" (House)',
    word: 'Hus',
    correctAnswer: 'ett',
    hint: 'Many central, neuter nouns or spaces are "ett" words.',
    explanation: '"Hus" is an "ett-word" (ett hus, huset). In the plural indefinite, ett-words ending in a consonant don\'t change: flera hus.'
  },
  {
    id: 'en-ett-3',
    category: 'en-ett',
    question: 'Choose the correct indefinite article (En or Ett) for the word: "Kopp" (Cup)',
    word: 'Kopp',
    correctAnswer: 'en',
    hint: 'Think: "en kopp kaffe" (a cup of coffee).',
    explanation: '"Kopp" is an "en-word" (en kopp, koppen, koppar).'
  },
  {
    id: 'en-ett-4',
    category: 'en-ett',
    question: 'Choose the correct indefinite article (En or Ett) for the word: "Barn" (Child)',
    word: 'Barn',
    correctAnswer: 'ett',
    hint: 'Neuter nouns referring to living things are rare, but "child" is one of them.',
    explanation: '"Barn" is an "ett-word" (ett barn, barnet). In plural, it remains "barn" (indefinite) and "barnen" (definite).'
  },
  {
    id: 'en-ett-5',
    category: 'en-ett',
    question: 'Choose the correct indefinite article (En or Ett) for the word: "Fika" (Coffee break)',
    word: 'Fika',
    correctAnswer: 'en',
    hint: 'Traditional fika is usually treated as a common noun or verb, but grammatically: "en fika".',
    explanation: '"Fika" is an "en-word" (en fika, fikan). This refers to the noun coffee break.'
  },
  {
    id: 'en-ett-6',
    category: 'en-ett',
    question: 'Choose the correct indefinite article (En or Ett) for the word: "Äpple" (Apple)',
    word: 'Äpple',
    correctAnswer: 'ett',
    hint: 'Ett-words ending in a vowel get -n in the plural indefinite: äpplen.',
    explanation: '"Äpple" is an "ett-word" (ett äpple, äpplet). Because it ends in a vowel, plural indefinite is "äpplen" and definite is "äpplena".'
  },

  // 2. Verbs (Verb Conjugation Focus)
  {
    id: 'verbs-1',
    category: 'verbs',
    question: 'Fill in the blank with the correct present tense form of "att köpa" (to buy).',
    sentenceWithBlank: 'Hon ______ en stor kanelbulle på bageriet.',
    options: ['köpa', 'köper', 'köpte', 'köpt'],
    correctAnswer: 'köper',
    hint: 'Present tense of group 2 verbs ends in -er.',
    explanation: '"Köper" is the present tense form. "Köpa" is infinitive, "köpte" is past (preteritum), and "köpt" is supine (used with har/hade).'
  },
  {
    id: 'verbs-2',
    category: 'verbs',
    question: 'Choose the correct past tense (Preteritum) of "att vara" (to be) for the blank.',
    sentenceWithBlank: 'Igår ______ jag mycket trött efter jobbet.',
    options: ['är', 'var', 'vara', 'varit'],
    correctAnswer: 'var',
    hint: 'In English, "yesterday I ___ tired". "Att vara" is irregular.',
    explanation: '"Var" is the preteritum (past tense) form. "Är" is present, "vara" is infinitive, and "varit" is the supine (perfekt).'
  },
  {
    id: 'verbs-3',
    category: 'verbs',
    question: 'Complete the sentence using the present tense of "att vilja" (to want / wish).',
    sentenceWithBlank: 'Vad ______ du göra i helgen?',
    options: ['ville', 'vilja', 'vill', 'velat'],
    correctAnswer: 'vill',
    hint: 'This helper verb is auxiliary. Present form is very short.',
    explanation: '"Vill" is the present tense helper verb "wants/wishes". It\'s followed by an infinitive verb without "att".'
  },
  {
    id: 'verbs-4',
    category: 'verbs',
    question: 'Select the correct helper conjugation to form the present perfect (har + supine) of "att äta".',
    sentenceWithBlank: 'Vi har redan ______ frukost.',
    options: ['ätit', 'äter', 'åt', 'äta'],
    correctAnswer: 'ätit',
    hint: 'You are looking for the "supine" form of att äta (irregular).',
    explanation: '"Ätit" is the supine form. After the auxiliary verb "har" (have), Swedish always uses the supine form to construct the present perfect.'
  },

  // 3. Word Order (V2 Rule Syntax Focus)
  {
    id: 'word-order-1',
    category: 'word-order',
    question: 'Rearrange the words keeping the Swedish V2 rule in mind: "Today I am drinking coffee."',
    scrambledWords: ['dricker', 'Idag', 'kaffe', 'jag'],
    correctAnswer: 'Idag dricker jag kaffe',
    hint: 'Starting with a time expression (Idag) forces the verb to come second, preceding the subject.',
    explanation: 'According to the V2 rule, the conjugated verb "dricker" MUST occupy the second position. "Idag" (position 1) -> "dricker" (position 2) -> "jag" (subject, position 3) -> "kaffe" (object, position 4).'
  },
  {
    id: 'word-order-2',
    category: 'word-order',
    question: 'Rearrange the words for general negative question: "Do you not speak Swedish?"',
    scrambledWords: ['svenska', 'Talar', 'inte', 'du'],
    correctAnswer: 'Talar du inte svenska',
    hint: 'In a question, the verb comes first, then the subject, and then "inte" (not).',
    explanation: 'For yes/no questions, the verb starts the clause: "Talar" (1) + "du" (subject, 2) + sentence adverb "inte" (3) + object "svenska" (4).'
  },
  {
    id: 'word-order-3',
    category: 'word-order',
    question: 'Rearrange sentence starting with a subordinate clause: "When it rains, I stay inside."',
    scrambledWords: ['regnar,', 'stannar', 'jag', 'När det', 'inne'],
    correctAnswer: 'När det regnar, stannar jag inne',
    hint: 'The subclause "När det regnar" counts as position one. Therefore, the main clause must start with the verb!',
    explanation: 'The initial subclause "När det regnar" occupies position 1. By Sweden\'s strict V2 rule, the main clause MUST start with the verb "stannar" (position 2) before the subject "jag" (position 3).'
  },

  // 4. Everyday Vocabulary & Useful Phrases
  {
    id: 'vocab-1',
    category: 'vocab',
    question: 'What is the standard, popular Swedish way of expressing "Excuse me / Sorry"?',
    englishPhrase: 'Excuse me / Sorry',
    swedishPhrase: 'Ursäkta',
    options: ['Ursäkta', 'Självklart', 'Tack så mycket', 'Varsågod'],
    correctAnswer: 'Ursäkta',
    hint: 'Often used to catch someone\'s attention or apologize politely on a bus.',
    explanation: '"Ursäkta" translates to "Excuse me". "Självklart" means "Of course", "Tack så mycket" means "Thank you very much" and "Varsågod" means "You are welcome".'
  },
  {
    id: 'vocab-2',
    category: 'vocab',
    question: 'How do you say "Have a nice day!" in Swedish?',
    englishPhrase: 'Have a nice day!',
    swedishPhrase: 'Ha en bra dag!',
    options: ['God morgon!', 'Ha en bra dag!', 'Trevligt att träffas!', 'Vi ses sen!'],
    correctAnswer: 'Ha en bra dag!',
    hint: 'Literally, "Have a good day!"',
    explanation: '"Ha en bra dag!" literally translates to "Have a good day!". "Vi ses sen!" means "See you later", "Trevligt att träffas!" is "Nice to meet you".'
  }
];

export const practiceScenarios: PracticeScenario[] = [
  {
    id: 'cafe',
    title: 'At the Cafe (På caféet)',
    description: 'Order a classic Swedish "fika" (coffee and cinnamon bun) and interact politely with the barista.',
    difficulty: 'A1',
    icon: 'Coffee',
    suggestedPhrases: [
      'En kopp kaffe och en kanelbulle, tack.',
      'Kan jag få betala med kort?',
      'Ingår påtår?',
      'Det var jättegott, tack!'
    ],
    initialAiGreeting: 'Hej och välkommen till café Kaffestugan! Vad vill du beställa idag?'
  },
  {
    id: 'directions',
    title: 'Asking for Directions (Hitta vägen)',
    description: 'Ask for directions to the Central Station (Centralstationen) or Gamla Stan in Stockholm.',
    difficulty: 'A2',
    icon: 'MapPin',
    suggestedPhrases: [
      'Ursäkta, var ligger Centralstationen?',
      'Går det en buss härifrån?',
      'Är det långt att gå dit?',
      'Tack för hjälpen!'
    ],
    initialAiGreeting: 'Hej! Du ser lite vilsen ut. Kan jag hjälpa dig att hitta någonstans?'
  },
  {
    id: 'grocery',
    title: 'Grocery Shopping (I mataffären)',
    description: 'Find certain ingredients for dinner and ask a store clerk where items are located.',
    difficulty: 'A2',
    icon: 'ShoppingBag',
    suggestedPhrases: [
      'Ursäkta, var har ni laktosfri mjölk?',
      'Vilken hylla ligger knäckebröd på?',
      'Är frukten ekologisk?',
      'Tack, jag letar vidare.'
    ],
    initialAiGreeting: 'Hej! Behöver du hjälp att hitta något i butiken idag?'
  },
  {
    id: 'smalltalk',
    title: 'Small Talk at Work (Fika-småprat)',
    description: 'Discuss weekend plans, local weather or standard work-life routines in the lunchroom.',
    difficulty: 'B1',
    icon: 'MessageSquare',
    suggestedPhrases: [
      'Vad har du för planer för helgen?',
      'Vilket härligt väder vi har idag!',
      'Hur går det med ditt nya projekt?',
      'Ska vi ta en fika klockan tre?'
    ],
    initialAiGreeting: 'Hej kollega! Kul att ses vid kaffemaskinen. Hur har din vecka varit än så länge?'
  },
  {
    id: 'job-interview',
    title: 'Swedish Job Interview (Anställningsintervju)',
    description: 'Practice sharing your skills, past working assignments, and why you want to work in Sweden.',
    difficulty: 'B2',
    icon: 'Briefcase',
    suggestedPhrases: [
      'Jag har fem års erfarenhet inom programmering.',
      'Jag vill förbättra min svenska på arbetsplatsen.',
      'Jag är stresstålig och gillar att samarbeta.',
      'Kan du berätta mer om företagskulturen?'
    ],
    initialAiGreeting: 'Välkommen till intervjun! Roligt att du vill arbeta hos oss på NordTech. Kan du börja med att berätta lite om dig själv på svenska?'
  }
];
