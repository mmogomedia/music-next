# Clarification System Design

## Overview

When user intent is ambiguous (low confidence), instead of defaulting to discovery, we'll ask clarifying questions with clickable options. The system will use user history to provide smart suggestions.

---

## Response Type: ClarificationResponse

### Base Structure

```typescript
interface ClarificationResponse extends BaseAIResponse {
  type: 'clarification';
  message: string; // Human-readable question/context
  data: {
    questions: ClarificationQuestion[]; // One or more questions
    context?: {
      detectedGenres?: string[]; // Genres from user history
      detectedMoods?: string[]; // Moods from user history
      previousIntent?: string; // Previous conversation intent
    };
    metadata?: {
      requiresResponse: boolean; // If false, user can skip
      canSkip?: boolean; // Allow user to proceed without answering
    };
  };
}
```

### Question Types

#### 1. Single Select (Radio Buttons)

```typescript
interface SingleSelectQuestion extends ClarificationQuestion {
  questionType: 'single_select';
  question: string; // "What would you like to do?"
  options: ClarificationOption[];
  required: boolean;
}

interface ClarificationOption {
  id: string; // Unique identifier
  label: string; // Display text
  value: string; // Value to send back
  icon?: string; // Optional icon
  description?: string; // Optional helper text
  metadata?: {
    intent?: AgentIntent; // Suggested intent for this option
    genre?: string; // If this option implies a genre
    mood?: string; // If this option implies a mood
  };
}
```

**Example:**

```json
{
  "type": "clarification",
  "message": "I'd love to help! What would you like to do?",
  "data": {
    "questions": [
      {
        "questionType": "single_select",
        "question": "What would you like to do?",
        "options": [
          {
            "id": "discover",
            "label": "Find music",
            "value": "discovery",
            "icon": "🔍",
            "metadata": { "intent": "discovery" }
          },
          {
            "id": "recommend",
            "label": "Get recommendations",
            "value": "recommendation",
            "icon": "💡",
            "metadata": { "intent": "recommendation" }
          },
          {
            "id": "play",
            "label": "Play something",
            "value": "playback",
            "icon": "▶️",
            "metadata": { "intent": "playback" }
          }
        ],
        "required": true
      }
    ]
  }
}
```

#### 2. Multiple Select (Checkboxes)

```typescript
interface MultipleSelectQuestion extends ClarificationQuestion {
  questionType: 'multiple_select';
  question: string;
  options: ClarificationOption[];
  minSelections?: number;
  maxSelections?: number;
  required: boolean;
}
```

**Example:**

```json
{
  "type": "clarification",
  "message": "What genres are you in the mood for?",
  "data": {
    "questions": [
      {
        "questionType": "multiple_select",
        "question": "Select genres (you can choose multiple):",
        "options": [
          {
            "id": "amapiano",
            "label": "Amapiano",
            "value": "Amapiano",
            "metadata": { "genre": "Amapiano" },
            "highlighted": true // From user history
          },
          {
            "id": "afrobeat",
            "label": "Afrobeat",
            "value": "Afrobeat",
            "metadata": { "genre": "Afrobeat" }
          }
        ],
        "minSelections": 1,
        "maxSelections": 3,
        "required": true
      }
    ]
  }
}
```

#### 3. Sequential Questions (Multiple Questions, One at a Time)

```typescript
interface SequentialQuestions extends ClarificationQuestion {
  questionType: 'sequential';
  questions: SingleSelectQuestion[]; // Array of questions
  currentIndex: number; // Which question to show
  required: boolean;
}
```

**Example:**

```json
{
  "type": "clarification",
  "message": "Let me help you find the perfect music!",
  "data": {
    "questions": [{
      "questionType": "sequential",
      "questions": [
        {
          "questionType": "single_select",
          "question": "What would you like to do?",
          "options": [...],
          "required": true
        },
        {
          "questionType": "single_select",
          "question": "What genre?",
          "options": [...],
          "required": true
        },
        {
          "questionType": "single_select",
          "question": "What mood?",
          "options": [...],
          "required": false
        }
      ],
      "currentIndex": 0,
      "required": true
    }]
  }
}
```

#### 4. Conditional Questions (Show next question based on previous answer)

```typescript
interface ConditionalQuestion extends ClarificationQuestion {
  questionType: 'conditional';
  question: SingleSelectQuestion;
  conditions: {
    [optionValue: string]: ClarificationQuestion; // Next question based on selection
  };
  required: boolean;
}
```

**Example:**

```json
{
  "type": "clarification",
  "message": "I see you've listened to Amapiano before!",
  "data": {
    "questions": [{
      "questionType": "conditional",
      "question": {
        "questionType": "single_select",
        "question": "What do you want suggestions for in Amapiano?",
        "options": [
          {
            "id": "same_genre",
            "label": "More Amapiano",
            "value": "amapiano",
            "metadata": { "genre": "Amapiano" }
          },
          {
            "id": "different_genre",
            "label": "Try a different genre",
            "value": "other"
          }
        ],
        "required": true
      },
      "conditions": {
        "amapiano": {
          "questionType": "single_select",
          "question": "What mood are you in?",
          "options": [...],
          "required": false
        },
        "other": {
          "questionType": "multiple_select",
          "question": "Which genres interest you?",
          "options": [...],
          "required": true
        }
      },
      "required": true
    }]
  }
}
```

---

## Union Type for All Question Types

```typescript
type ClarificationQuestion =
  | SingleSelectQuestion
  | MultipleSelectQuestion
  | SequentialQuestions
  | ConditionalQuestion;

interface ClarificationQuestionBase {
  id: string; // Unique question ID
  questionType: string;
  required: boolean;
}
```

---

## User History Integration

### Getting User Genre History

```typescript
// src/lib/ai/agents/clarification-agent.ts
async function getUserGenreHistory(userId: string): Promise<string[]> {
  // Option 1: From AIPreferences
  const prefs = await preferenceTracker.get(userId);
  const genres = Object.entries(prefs.genres)
    .sort((a, b) => b[1] - a[1]) // Sort by frequency
    .slice(0, 5) // Top 5 genres
    .map(([genre]) => genre);

  // Option 2: From listening history (if available)
  // Query PlayHistory or similar table

  return genres;
}
```

### Smart Genre Suggestions

```typescript
async function buildGenreOptions(
  userId?: string,
  allGenres: Genre[] = []
): Promise<ClarificationOption[]> {
  const userGenres = userId ? await getUserGenreHistory(userId) : [];

  // Build options with user history highlighted
  const options: ClarificationOption[] = allGenres.map(genre => ({
    id: genre.slug,
    label: genre.name,
    value: genre.slug,
    metadata: { genre: genre.name },
    highlighted: userGenres.includes(genre.name.toLowerCase()),
  }));

  // Sort: highlighted (user history) first
  return options.sort((a, b) => {
    if (a.highlighted && !b.highlighted) return -1;
    if (!a.highlighted && b.highlighted) return 1;
    return 0;
  });
}
```

---

## Clarification Agent

### New Agent: ClarificationAgent

```typescript
// src/lib/ai/agents/clarification-agent.ts
export class ClarificationAgent extends BaseAgent {
  async process(
    message: string,
    context?: AgentContext
  ): Promise<AgentResponse> {
    // Analyze what's missing
    const missingInfo = this.analyzeMissingInfo(message, context);

    // Get user history for smart suggestions
    const userGenres = context?.userId
      ? await getUserGenreHistory(context.userId)
      : [];

    // Build clarification questions
    const questions = await this.buildClarificationQuestions(
      missingInfo,
      userGenres,
      context
    );

    return {
      message: this.buildClarificationMessage(userGenres, missingInfo),
      data: {
        type: 'clarification',
        data: {
          questions,
          context: {
            detectedGenres: userGenres,
            previousIntent: context?.metadata?.previousIntent,
          },
        },
      },
    };
  }

  private analyzeMissingInfo(
    message: string,
    context?: AgentContext
  ): MissingInfo {
    // Determine what information is missing:
    // - Intent (discovery/recommendation/playback)
    // - Genre
    // - Mood
    // - Other filters
  }
}
```

---

## Router Integration

### Update Router to Use Clarification

```typescript
// src/lib/ai/agents/router-agent.ts
async route(message: string, context?: AgentContext): Promise<AgentResponse> {
  // ... existing keyword analysis ...

  // If confidence is very low and no context to help
  if (
    keywordDecision.confidence < MIN_KEYWORD_CONFIDENCE_THRESHOLD &&
    !hasEnoughContext(context) &&
    isTrulyAmbiguous(message, keywordDecision)
  ) {
    // Route to ClarificationAgent instead of DiscoveryAgent
    return this.clarificationAgent.process(message, context);
  }

  // Otherwise, use LLM fallback or proceed
  // ...
}
```

---

## Frontend Component: ClarificationRenderer

### Component Structure

```typescript
// src/components/ai/response-renderers/clarification-renderer.tsx
interface ClarificationRendererProps {
  response: ClarificationResponse;
  onAnswer: (answers: ClarificationAnswers) => void;
  onSkip?: () => void;
}

interface ClarificationAnswers {
  [questionId: string]: string | string[]; // Single or multiple values
}
```

### Rendering Logic

```typescript
export function ClarificationRenderer({
  response,
  onAnswer,
  onSkip,
}: ClarificationRendererProps) {
  const [answers, setAnswers] = useState<ClarificationAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  const question = response.data.questions[currentQuestionIndex];

  const handleAnswer = (questionId: string, value: string | string[]) => {
    const newAnswers = { ...answers, [questionId]: value };
    setAnswers(newAnswers);

    // Auto-advance for sequential questions
    if (question.questionType === 'sequential') {
      // Move to next question
    }

    // For conditional questions, show next question based on answer
    if (question.questionType === 'conditional') {
      // Show conditional question
    }
  };

  const handleSubmit = () => {
    onAnswer(answers);
  };

  // Render based on question type
  switch (question.questionType) {
    case 'single_select':
      return <SingleSelectQuestionComponent ... />;
    case 'multiple_select':
      return <MultipleSelectQuestionComponent ... />;
    case 'sequential':
      return <SequentialQuestionsComponent ... />;
    case 'conditional':
      return <ConditionalQuestionComponent ... />;
  }
}
```

### UI Components

#### Single Select (Radio Buttons)

```tsx
function SingleSelectQuestionComponent({
  question,
  selected,
  onSelect,
}: {
  question: SingleSelectQuestion;
  selected?: string;
  onSelect: (value: string) => void;
}) {
  return (
    <div className='space-y-3'>
      <p className='text-lg font-medium'>{question.question}</p>
      <div className='space-y-2'>
        {question.options.map(option => (
          <button
            key={option.id}
            onClick={() => onSelect(option.value)}
            className={`
              w-full p-4 rounded-lg border-2 text-left
              transition-all
              ${
                selected === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
              }
              ${option.highlighted ? 'ring-2 ring-yellow-400' : ''}
            `}
          >
            <div className='flex items-center gap-3'>
              {option.icon && <span className='text-2xl'>{option.icon}</span>}
              <div className='flex-1'>
                <div className='font-medium'>{option.label}</div>
                {option.description && (
                  <div className='text-sm text-gray-600 dark:text-gray-400'>
                    {option.description}
                  </div>
                )}
              </div>
              {option.highlighted && (
                <span className='text-xs bg-yellow-100 dark:bg-yellow-900 px-2 py-1 rounded'>
                  You've listened to this
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
```

#### Multiple Select (Checkboxes)

```tsx
function MultipleSelectQuestionComponent({
  question,
  selected,
  onToggle,
}: {
  question: MultipleSelectQuestion;
  selected?: string[];
  onToggle: (value: string) => void;
}) {
  const isSelected = (value: string) => selected?.includes(value) ?? false;
  const canSelectMore =
    !question.maxSelections || (selected?.length ?? 0) < question.maxSelections;

  return (
    <div className='space-y-3'>
      <p className='text-lg font-medium'>{question.question}</p>
      {question.maxSelections && (
        <p className='text-sm text-gray-600'>
          Select up to {question.maxSelections} options
        </p>
      )}
      <div className='space-y-2'>
        {question.options.map(option => {
          const selected = isSelected(option.value);
          const disabled = !selected && !canSelectMore;

          return (
            <button
              key={option.id}
              onClick={() => !disabled && onToggle(option.value)}
              disabled={disabled}
              className={`
                w-full p-4 rounded-lg border-2 text-left
                transition-all
                ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gray-300'}
                ${option.highlighted ? 'ring-2 ring-yellow-400' : ''}
              `}
            >
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={selected}
                  readOnly
                  className='w-5 h-5'
                />
                <div className='flex-1'>
                  <div className='font-medium'>{option.label}</div>
                </div>
                {option.highlighted && (
                  <span className='text-xs bg-yellow-100 px-2 py-1 rounded'>
                    Your favorite
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
```

---

## Handling User Responses

### API Endpoint for Clarification Answers

```typescript
// src/app/api/ai/chat/clarify/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { conversationId, answers, originalMessage } = body;

  // Re-route with clarified intent
  const clarifiedIntent = determineIntentFromAnswers(answers);
  const enrichedMessage = enrichMessageWithAnswers(originalMessage, answers);

  // Route to appropriate agent with clarified context
  const agentResponse = await routerAgent.route(enrichedMessage, {
    ...context,
    metadata: {
      ...context.metadata,
      clarifiedIntent,
      clarificationAnswers: answers,
    },
  });

  return NextResponse.json(agentResponse);
}
```

---

## Questions for Discussion

### 1. Question Flow & UX

**Q1:** Should we show all questions at once, or one at a time (sequential)?

- **Option A:** All at once (faster, but can be overwhelming)
- **Option B:** One at a time (slower, but clearer)
- **Option C:** Hybrid - simple questions together, complex ones sequential
- **Recommendation:** Option C - Single select questions together, complex/multi-step sequential

**Q2:** Can users skip clarification and proceed with a default?

- **Option A:** Always require clarification
- **Option B:** Allow skip with "Just show me something" button
- **Option C:** Skip only after showing options (user saw them but chose not to answer)
- **Recommendation:** Option B - Always provide skip option with smart default

### 2. History & Personalization

**Q3:** How many genres from history should we show?

- **Option A:** Top 3 genres
- **Option B:** Top 5 genres
- **Option C:** All genres user has listened to (with "See more" option)
- **Recommendation:** Option B - Top 5, with "Browse all genres" option

**Q4:** Should we show history-based suggestions even if user didn't explicitly ask?

- **Example:** User says "I feel lonely" - should we suggest "Amapiano" if that's their history?
- **Recommendation:** Yes, but make it clear it's based on their history

**Q5:** What if user has no history?

- **Option A:** Show popular genres
- **Option B:** Show all genres
- **Option C:** Ask "What genres interest you?" without suggestions
- **Recommendation:** Option A - Show top 5 popular genres on platform

### 3. Question Types & Complexity

**Q6:** Should we support asking multiple things at once?

- **Example:** "What genre and mood do you want?"
- **Option A:** Yes, show both questions together
- **Option B:** No, always sequential (genre first, then mood)
- **Option C:** Conditional - if genre selected, then ask mood
- **Recommendation:** Option C - Conditional questions based on previous answers

**Q7:** How do we handle very vague queries like "help me"?

- **Option A:** Always ask "What would you like to do?" first
- **Option B:** Try to infer from context, only ask if truly unclear
- **Option C:** Show intent options + genre options together
- **Recommendation:** Option A - Start with intent clarification

### 4. Response Handling

**Q8:** When user clicks an option, should we:

- **Option A:** Immediately submit and route (instant)
- **Option B:** Show confirmation/next question first
- **Option C:** For single questions, instant; for sequential, show next
- **Recommendation:** Option C - Smart based on question type

**Q9:** How do we handle partial answers in sequential questions?

- **Option A:** User must answer all required questions
- **Option B:** Allow skipping optional questions
- **Option C:** Auto-submit when enough info gathered
- **Recommendation:** Option B - Required questions must be answered, optional can be skipped

### 5. Edge Cases

**Q10:** What if user types a response instead of clicking?

- **Option A:** Parse typed response and match to options
- **Option B:** Treat as new query and re-route
- **Option C:** Show error and ask to select from options
- **Recommendation:** Option A - Try to match, fallback to Option B

**Q11:** What if clarification is needed mid-conversation?

- **Example:** User says "show me more" but we don't know what "more" refers to
- **Option A:** Ask clarification in context
- **Option B:** Use conversation history to infer
- **Recommendation:** Option B first, Option A if truly unclear

**Q12:** How do we handle clarification for logged-out users?

- **Option A:** Same clarification, no history-based suggestions
- **Option B:** Simpler clarification (fewer questions)
- **Option C:** Show popular/default options
- **Recommendation:** Option C - Show popular genres, no personalization

---

## Implementation Phases

### Phase 1: Basic Clarification (Week 1)

1. Create `ClarificationResponse` type
2. Create `ClarificationAgent`
3. Update router to use clarification for low-confidence queries
4. Create basic `ClarificationRenderer` (single select only)
5. Handle clarification answers in API

### Phase 2: History Integration (Week 1-2)

1. Get user genre history from preferences
2. Highlight user history in options
3. Smart genre suggestions based on history

### Phase 3: Advanced Question Types (Week 2)

1. Multiple select questions
2. Sequential questions
3. Conditional questions

### Phase 4: UX Polish (Week 2-3)

1. Better UI/UX for clarification
2. Skip options
3. Typed response handling
4. Error handling

---

## Example Flows

### Flow 1: Ambiguous Query with History

**User:** "I feel lonely today"

**System:**

1. Detects low confidence (0.1)
2. Checks user history → finds "Amapiano", "R&B"
3. Returns clarification:

   ```
   "I see you've listened to Amapiano and R&B before.
   What would you like to do?"

   [🔍 Find music] [💡 Get recommendations] [▶️ Play something]

   "What genre are you in the mood for?"

   [Amapiano] ⭐ Your favorite
   [R&B] ⭐ Your favorite
   [Afrobeat]
   [Hip Hop]
   [Browse all genres →]
   ```

**User clicks:** "Get recommendations" + "Amapiano"

**System:** Routes to RecommendationAgent with genre filter

### Flow 2: No History

**User:** "Help me"

**System:**

1. Detects low confidence
2. No user history
3. Returns clarification:

   ```
   "I'd love to help! What would you like to do?"

   [🔍 Find music]
   [💡 Get recommendations]
   [▶️ Play something]
   ```

**User clicks:** "Get recommendations"

**System:**

- Next question: "What genre interests you?"
- Shows popular genres (no highlights)

---

## Next Steps

1. **Answer the questions above** to finalize design
2. **Create TypeScript types** for clarification responses
3. **Implement ClarificationAgent**
4. **Update router** to use clarification
5. **Create frontend components**
6. **Test with real users**
