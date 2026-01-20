/**
 * Static word list for offline typing tests
 * Contains ~200 most common English words
 * 
 * Words are lowercase, no punctuation
 * Loaded once at app start, no API calls needed
 */

export const COMMON_WORDS: readonly string[] = [
  // Most common words
  'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
  'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
  'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
  'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their', 'what',
  'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go', 'me',
  'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know', 'take',
  'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them', 'see', 'other',
  'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over', 'think', 'also',
  'back', 'after', 'use', 'two', 'how', 'our', 'work', 'first', 'well', 'way',
  'even', 'new', 'want', 'because', 'any', 'these', 'give', 'day', 'most', 'us',
  
  // Additional common words for variety
  'very', 'her', 'need', 'feel', 'high', 'really', 'something', 'never', 'still', 'find',
  'here', 'thing', 'been', 'many', 'those', 'much', 'right', 'while', 'each', 'made',
  'yes', 'may', 'part', 'before', 'should', 'through', 'great', 'where', 'keep', 'long',
  'same', 'always', 'another', 'own', 'around', 'show', 'might', 'try', 'such', 'call',
  'why', 'ask', 'went', 'every', 'close', 'set', 'again', 'start', 'point', 'old',
  'last', 'end', 'does', 'turn', 'run', 'put', 'say', 'help', 'tell', 'few',
  'world', 'home', 'hand', 'school', 'place', 'under', 'away', 'let', 'name', 'three',
  'without', 'mean', 'between', 'night', 'young', 'both', 'life', 'being', 'open', 'big',
  'house', 'against', 'seem', 'leave', 'best', 'move', 'enough', 'small', 'read', 'next',
  'kind', 'often', 'head', 'live', 'write', 'little', 'face', 'watch', 'far', 'word',
  
  // More words for longer tests
  'child', 'side', 'water', 'city', 'together', 'story', 'group', 'question', 'during', 'country',
  'state', 'change', 'family', 'important', 'almost', 'rather', 'idea', 'however', 'different', 'mother',
  'father', 'money', 'along', 'system', 'become', 'problem', 'today', 'since', 'power', 'line',
  'hear', 'hold', 'bring', 'stop', 'once', 'stand', 'ever', 'already', 'though', 'number',
  'walk', 'real', 'white', 'begin', 'fact', 'learn', 'talk', 'woman', 'game', 'until',
  
  // Slightly longer words
  'example', 'paper', 'music', 'company', 'market', 'study', 'never', 'second', 'early', 'everything',
  'anything', 'nothing', 'believe', 'possible', 'minute', 'happen', 'remember', 'special', 'actually', 'morning',
] as const

/**
 * Word count for easy reference
 */
export const WORD_LIST_SIZE = COMMON_WORDS.length

