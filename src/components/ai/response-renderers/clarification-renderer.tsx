'use client';

import React, { useState, useCallback, useEffect } from 'react';
import type {
  ClarificationResponse,
  ClarificationQuestion,
  SingleSelectQuestion,
  MultipleSelectQuestion,
  SequentialQuestions,
  ConditionalQuestion,
} from '@/types/ai-responses';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';

interface ClarificationRendererProps {
  response: ClarificationResponse;
  onAnswer?: (_answers: ClarificationAnswers) => void;
  onSkip?: () => void;
}

interface ClarificationAnswers {
  [questionId: string]: string | string[];
}

/**
 * Renders clarification questions with clickable options
 */
export function ClarificationRenderer({
  response,
  onAnswer,
  onSkip,
}: ClarificationRendererProps) {
  const [answers, setAnswers] = useState<ClarificationAnswers>({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [conditionalPath, setConditionalPath] = useState<string[]>([]);

  const questions = response.data.questions;

  const handleAnswer = useCallback(
    (questionId: string, value: string | string[]) => {
      const newAnswers = { ...answers, [questionId]: value };
      setAnswers(newAnswers);

      // For sequential questions, auto-advance
      const currentQuestion = questions[currentQuestionIndex];
      if (currentQuestion?.questionType === 'sequential') {
        const seqQuestion = currentQuestion as SequentialQuestions;
        if (currentQuestionIndex < seqQuestion.questions.length - 1) {
          setCurrentQuestionIndex(prev => prev + 1);
        } else {
          // All questions answered, submit
          onAnswer(newAnswers);
        }
      } else if (currentQuestion?.questionType === 'conditional') {
        // For conditional questions, show next question based on answer
        const condQuestion = currentQuestion as ConditionalQuestion;
        if (typeof value === 'string' && condQuestion.conditions[value]) {
          setConditionalPath([...conditionalPath, value]);
        }
      }
    },
    [answers, questions, currentQuestionIndex, conditionalPath, onAnswer]
  );

  const handleSubmit = useCallback(() => {
    // Validate required questions
    const currentQuestion = questions[currentQuestionIndex];
    if (currentQuestion?.required && !answers[currentQuestion.id]) {
      return; // Don't submit if required question not answered
    }

    // Check if there are more questions to answer
    if (currentQuestionIndex < questions.length - 1) {
      // Advance to next question
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      // This is the last question, submit all answers
      if (onAnswer) {
        onAnswer(answers);
      }
    }
  }, [answers, questions, currentQuestionIndex, onAnswer]);

  const handleSkip = useCallback(() => {
    if (onSkip) {
      onSkip();
    } else {
      // Default skip behavior: submit with empty answers
      onAnswer({});
    }
  }, [onAnswer, onSkip]);

  // Get current question to render
  const getCurrentQuestion = (): ClarificationQuestion | null => {
    if (questions.length === 0) return null;

    const question = questions[currentQuestionIndex];

    // Handle conditional questions
    if (question.questionType === 'conditional') {
      const condQuestion = question as ConditionalQuestion;
      const lastAnswer = conditionalPath[conditionalPath.length - 1];
      if (lastAnswer && condQuestion.conditions[lastAnswer]) {
        return condQuestion.conditions[lastAnswer];
      }
      return condQuestion.question;
    }

    // Handle sequential questions
    if (question.questionType === 'sequential') {
      const seqQuestion = question as SequentialQuestions;
      return seqQuestion.questions[seqQuestion.currentIndex] || null;
    }

    return question;
  };

  const currentQuestion = getCurrentQuestion();
  if (!currentQuestion) return null;

  const canSubmit =
    !currentQuestion.required || answers[currentQuestion.id] !== undefined;
  const hasMultipleQuestions = questions.length > 1;

  return (
    <div className='space-y-6'>
      {/* Message */}
      {response.message && (
        <div className='rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800'>
          <p className='text-gray-900 dark:text-white whitespace-pre-wrap'>
            {response.message}
          </p>
        </div>
      )}

      {/* Questions */}
      <div className='space-y-6'>
        {currentQuestion.questionType === 'single_select' && (
          <SingleSelectQuestionComponent
            question={currentQuestion as SingleSelectQuestion}
            selected={answers[currentQuestion.id] as string | undefined}
            onSelect={value => handleAnswer(currentQuestion.id, value)}
          />
        )}

        {currentQuestion.questionType === 'multiple_select' && (
          <MultipleSelectQuestionComponent
            question={currentQuestion as MultipleSelectQuestion}
            selected={answers[currentQuestion.id] as string[] | undefined}
            onToggle={value => {
              const current = (answers[currentQuestion.id] as string[]) || [];
              const newSelection = current.includes(value)
                ? current.filter(v => v !== value)
                : [...current, value];
              handleAnswer(currentQuestion.id, newSelection);
            }}
          />
        )}
      </div>

      {/* Action Buttons */}
      <div className='flex gap-3 pt-4'>
        {canSubmit && (
          <button
            onClick={handleSubmit}
            className='px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors'
          >
            {currentQuestionIndex < questions.length - 1
              ? 'Continue'
              : 'Submit'}
          </button>
        )}

        {response.data.metadata?.canSkip && (
          <button
            onClick={handleSkip}
            className='px-6 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors'
          >
            Skip
          </button>
        )}
      </div>

      {/* Question Progress (if multiple questions) */}
      {hasMultipleQuestions && questions.length > 1 && (
        <div className='text-sm text-gray-500 dark:text-gray-400'>
          Question {currentQuestionIndex + 1} of {questions.length}
        </div>
      )}
    </div>
  );
}

/**
 * Single Select Question Component (Radio Buttons)
 */
function SingleSelectQuestionComponent({
  question,
  selected,
  onSelect,
}: {
  question: SingleSelectQuestion;
  selected?: string;
  onSelect: (_value: string) => void;
}) {
  return (
    <div className='space-y-3'>
      <p className='text-lg font-medium text-gray-900 dark:text-white'>
        {question.question}
      </p>
      <div className='space-y-2'>
        {question.options.map(option => (
          <button
            key={option.id}
            onClick={() => onSelect(option.value)}
            className={`
              w-full p-4 rounded-lg border-2 text-left
              transition-all duration-200
              ${
                selected === option.value
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
              }
              ${
                option.highlighted
                  ? 'ring-2 ring-yellow-400 dark:ring-yellow-500'
                  : ''
              }
            `}
          >
            <div className='flex items-center gap-3'>
              {option.icon && (
                <span className='text-2xl flex-shrink-0'>{option.icon}</span>
              )}
              <div className='flex-1 min-w-0'>
                <div className='font-medium text-gray-900 dark:text-white'>
                  {option.label}
                </div>
                {option.description && (
                  <div className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                    {option.description}
                  </div>
                )}
              </div>
              {option.highlighted && (
                <span className='text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded flex-shrink-0'>
                  Your favorite
                </span>
              )}
              {selected === option.value && (
                <div className='w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0'>
                  <div className='w-2 h-2 rounded-full bg-white' />
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

/**
 * Multiple Select Question Component (Checkboxes)
 */
function MultipleSelectQuestionComponent({
  question,
  selected,
  onToggle,
}: {
  question: MultipleSelectQuestion;
  selected?: string[];
  onToggle: (_value: string) => void;
}) {
  const isSelected = (value: string) => selected?.includes(value) ?? false;
  const selectedCount = selected?.length ?? 0;
  const canSelectMore =
    !question.maxSelections || selectedCount < question.maxSelections;
  const [showGenreSearch, setShowGenreSearch] = useState(false);
  const [genreSearchQuery, setGenreSearchQuery] = useState('');
  const [availableGenres, setAvailableGenres] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);
  const [filteredGenres, setFilteredGenres] = useState<
    Array<{ id: string; name: string; slug: string }>
  >([]);

  // Load all genres when "Browse all genres" is clicked
  useEffect(() => {
    if (showGenreSearch && availableGenres.length === 0) {
      fetch('/api/genres')
        .then(res => res.json())
        .then(data => {
          const genres = data.genres || [];
          setAvailableGenres(genres);
          setFilteredGenres(genres);
        })
        .catch(err => console.error('Failed to load genres:', err));
    }
  }, [showGenreSearch, availableGenres.length]);

  // Filter genres based on search query
  useEffect(() => {
    if (!genreSearchQuery.trim()) {
      setFilteredGenres(availableGenres);
    } else {
      const query = genreSearchQuery.toLowerCase();
      setFilteredGenres(
        availableGenres.filter(
          genre =>
            genre.name.toLowerCase().includes(query) ||
            genre.slug.toLowerCase().includes(query)
        )
      );
    }
  }, [genreSearchQuery, availableGenres]);

  // Handle "Browse all genres" option
  const handleBrowseAllClick = () => {
    setShowGenreSearch(true);
  };

  // Handle genre selection from search
  const handleGenreSelect = (genre: {
    id: string;
    name: string;
    slug: string;
  }) => {
    // Add as a new option if not already in options
    const exists = question.options.some(opt => opt.value === genre.slug);
    if (!exists && canSelectMore) {
      onToggle(genre.slug);
    } else if (exists) {
      onToggle(genre.slug);
    }
  };

  return (
    <div className='space-y-3'>
      <p className='text-lg font-medium text-gray-900 dark:text-white'>
        {question.question}
      </p>

      {question.maxSelections && (
        <p className='text-sm text-gray-600 dark:text-gray-400'>
          {selectedCount > 0
            ? `Selected ${selectedCount} of ${question.maxSelections}`
            : `Select up to ${question.maxSelections} options`}
        </p>
      )}

      <div className='space-y-2'>
        {question.options.map(option => {
          if (option.value === 'browse_all' && !showGenreSearch) {
            return (
              <button
                key={option.id}
                onClick={handleBrowseAllClick}
                className='w-full p-4 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 text-left transition-all'
              >
                <div className='flex items-center gap-3'>
                  <MagnifyingGlassIcon className='w-5 h-5 text-gray-400' />
                  <div className='flex-1'>
                    <div className='font-medium text-gray-900 dark:text-white'>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className='text-sm text-gray-600 dark:text-gray-400 mt-1'>
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          }

          if (option.value === 'browse_all') {
            return null; // Don't show browse_all when search is open
          }

          const selected = isSelected(option.value);
          const disabled = !selected && !canSelectMore;

          return (
            <button
              key={option.id}
              onClick={() => !disabled && onToggle(option.value)}
              disabled={disabled}
              className={`
                w-full p-4 rounded-lg border-2 text-left
                transition-all duration-200
                ${
                  selected
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-sm'
                    : 'border-gray-200 dark:border-gray-700'
                }
                ${
                  disabled
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:border-gray-300 dark:hover:border-gray-600'
                }
                ${
                  option.highlighted
                    ? 'ring-2 ring-yellow-400 dark:ring-yellow-500'
                    : ''
                }
              `}
            >
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={selected}
                  readOnly
                  className='w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500'
                />
                <div className='flex-1 min-w-0'>
                  <div className='font-medium text-gray-900 dark:text-white'>
                    {option.label}
                  </div>
                </div>
                {option.highlighted && (
                  <span className='text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded flex-shrink-0'>
                    Your favorite
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Genre Search Dropdown */}
      {showGenreSearch && (
        <div className='mt-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800'>
          <div className='relative mb-3'>
            <MagnifyingGlassIcon className='absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400' />
            <input
              type='text'
              value={genreSearchQuery}
              onChange={e => setGenreSearchQuery(e.target.value)}
              placeholder='Search genres...'
              className='w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div className='max-h-60 overflow-y-auto space-y-1'>
            {filteredGenres.length === 0 ? (
              <p className='text-sm text-gray-500 dark:text-gray-400 text-center py-4'>
                No genres found
              </p>
            ) : (
              filteredGenres.map(genre => {
                const isSelected = selected?.includes(genre.slug) ?? false;
                const disabled = !isSelected && !canSelectMore;

                return (
                  <button
                    key={genre.id}
                    onClick={() => !disabled && handleGenreSelect(genre)}
                    disabled={disabled}
                    className={`
                      w-full p-3 rounded-lg text-left transition-all
                      ${
                        isSelected
                          ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-300 dark:border-blue-700'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      }
                      ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className='flex items-center gap-3'>
                      <input
                        type='checkbox'
                        checked={isSelected}
                        readOnly
                        className='w-4 h-4 rounded border-gray-300 text-blue-600'
                      />
                      <span className='text-gray-900 dark:text-white'>
                        {genre.name}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <button
            onClick={() => setShowGenreSearch(false)}
            className='mt-3 text-sm text-blue-600 dark:text-blue-400 hover:underline'
          >
            Close search
          </button>
        </div>
      )}
    </div>
  );
}
