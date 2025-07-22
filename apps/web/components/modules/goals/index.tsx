'use client';

import { useEffect, useState } from 'react';
import { useFocusAFKStore } from '../../../store/store';
import styles from '../../../styles/components/learning.module.scss';

interface LearningPath {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  lessons: Lesson[];
  progress: number;
  isEnrolled: boolean;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: number; // in minutes
  content: string;
  quiz: Quiz;
  completed: boolean;
}

interface Quiz {
  id: string;
  questions: QuizQuestion[];
  passingScore: number;
}

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export default function Goals() {
  const { goals, addGoal, updateGoalProgress } = useFocusAFKStore();
  const [learningPaths, setLearningPaths] = useState<LearningPath[]>([]);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);
  const [currentLesson, setCurrentLesson] = useState<Lesson | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizAnswers, setQuizAnswers] = useState<number[]>([]);
  const [quizResults, setQuizResults] = useState<boolean[]>([]);

  useEffect(() => {
    loadLearningPaths();
  }, []);

  const loadLearningPaths = () => {
    // Sample learning paths with AI-generated content
    const paths: LearningPath[] = [
      {
        id: 'crypto-basics',
        title: 'Crypto Fundamentals',
        description: 'Master the basics of blockchain, cryptocurrencies, and DeFi',
        category: 'Technology',
        difficulty: 'beginner',
        estimatedHours: 8,
        progress: 0,
        isEnrolled: false,
        lessons: [
          {
            id: 'crypto-1',
            title: 'What is Blockchain?',
            description: 'Understanding the foundation of cryptocurrency',
            duration: 25,
            content: 'Blockchain is a distributed ledger technology that enables secure, transparent, and tamper-proof record-keeping...',
            completed: false,
            quiz: {
              id: 'quiz-1',
              passingScore: 70,
              questions: [
                {
                  id: 'q1',
                  question: 'What is the main purpose of blockchain technology?',
                  options: [
                    'To make transactions faster',
                    'To create a decentralized, secure ledger',
                    'To reduce transaction costs',
                    'To enable anonymous transactions'
                  ],
                  correctAnswer: 1,
                  explanation: 'Blockchain creates a decentralized, secure ledger that cannot be tampered with.'
                }
              ]
            }
          },
          {
            id: 'crypto-2',
            title: 'Understanding Bitcoin',
            description: 'Learn about the first and most popular cryptocurrency',
            duration: 30,
            content: 'Bitcoin was created in 2009 by an anonymous person or group known as Satoshi Nakamoto...',
            completed: false,
            quiz: {
              id: 'quiz-2',
              passingScore: 70,
              questions: [
                {
                  id: 'q2',
                  question: 'Who created Bitcoin?',
                  options: [
                    'Elon Musk',
                    'Satoshi Nakamoto',
                    'Vitalik Buterin',
                    'Mark Zuckerberg'
                  ],
                  correctAnswer: 1,
                  explanation: 'Bitcoin was created by the pseudonymous Satoshi Nakamoto in 2009.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'productivity-mastery',
        title: 'Productivity Mastery',
        description: 'Learn proven techniques to boost your productivity and focus',
        category: 'Personal Development',
        difficulty: 'intermediate',
        estimatedHours: 6,
        progress: 0,
        isEnrolled: false,
        lessons: [
          {
            id: 'prod-1',
            title: 'The Pomodoro Technique',
            description: 'Master time management with focused work sessions',
            duration: 20,
            content: 'The Pomodoro Technique is a time management method developed by Francesco Cirillo...',
            completed: false,
            quiz: {
              id: 'quiz-3',
              passingScore: 70,
              questions: [
                {
                  id: 'q3',
                  question: 'How long is a typical Pomodoro session?',
                  options: [
                    '15 minutes',
                    '25 minutes',
                    '45 minutes',
                    '60 minutes'
                  ],
                  correctAnswer: 1,
                  explanation: 'A typical Pomodoro session is 25 minutes of focused work.'
                }
              ]
            }
          }
        ]
      },
      {
        id: 'web-development',
        title: 'Web Development Basics',
        description: 'Build your first website with HTML, CSS, and JavaScript',
        category: 'Programming',
        difficulty: 'beginner',
        estimatedHours: 12,
        progress: 0,
        isEnrolled: false,
        lessons: [
          {
            id: 'web-1',
            title: 'HTML Fundamentals',
            description: 'Learn the structure of web pages',
            duration: 35,
            content: 'HTML (HyperText Markup Language) is the standard markup language for creating web pages...',
            completed: false,
            quiz: {
              id: 'quiz-4',
              passingScore: 70,
              questions: [
                {
                  id: 'q4',
                  question: 'What does HTML stand for?',
                  options: [
                    'HyperText Markup Language',
                    'High Tech Modern Language',
                    'Home Tool Markup Language',
                    'Hyperlink and Text Markup Language'
                  ],
                  correctAnswer: 0,
                  explanation: 'HTML stands for HyperText Markup Language.'
                }
              ]
            }
          }
        ]
      }
    ];

    setLearningPaths(paths);
  };

  const enrollInPath = (pathId: string) => {
    setLearningPaths(prev => prev.map(path => 
      path.id === pathId ? { ...path, isEnrolled: true } : path
    ));
    
    // Create a goal for this learning path
    const path = learningPaths.find(p => p.id === pathId);
    if (path) {
      addGoal({
        title: `Complete ${path.title}`,
        description: path.description,
        targetDate: new Date(Date.now() + path.estimatedHours * 60 * 60 * 1000), // estimated completion
        progress: 0,
        completed: false,
        category: 'learning'
      });
    }
  };

  const startLesson = (lesson: Lesson) => {
    setCurrentLesson(lesson);
    setShowQuiz(false);
    setQuizAnswers([]);
    setQuizResults([]);
  };

  const completeLesson = () => {
    if (!currentLesson || !selectedPath) return;

    // Mark lesson as completed
    setLearningPaths(prev => prev.map(path => {
      if (path.id === selectedPath.id) {
        const updatedLessons = path.lessons.map(lesson => 
          lesson.id === currentLesson.id ? { ...lesson, completed: true } : lesson
        );
        const progress = (updatedLessons.filter(l => l.completed).length / updatedLessons.length) * 100;
        return { ...path, lessons: updatedLessons, progress };
      }
      return path;
    }));

    // Update goal progress
    const path = learningPaths.find(p => p.id === selectedPath.id);
    if (path) {
      const completedLessons = path.lessons.filter(l => l.completed).length + 1;
      const progress = (completedLessons / path.lessons.length) * 100;
      // Find and update the corresponding goal
      const goal = goals.find(g => g.title.includes(path.title));
      if (goal) {
        updateGoalProgress(goal?.id!, progress);
      }
    }

    setCurrentLesson(null);
  };

  const startQuiz = () => {
    if (!currentLesson) return;
    setShowQuiz(true);
    setQuizAnswers(new Array(currentLesson.quiz.questions.length).fill(-1));
  };

  const submitQuiz = () => {
    if (!currentLesson) return;

    const results = currentLesson.quiz.questions.map((question, index) => 
      quizAnswers[index] === question.correctAnswer
    );
    
    setQuizResults(results);
    
    const score = (results.filter(r => r).length / results.length) * 100;
    const passed = score >= currentLesson.quiz.passingScore;

    if (passed) {
      completeLesson();
    }
  };

  const getRecommendedPaths = () => {
    // AI recommendation logic based on user's current goals and progress
    const userInterests = goals.map(g => g.category).filter(Boolean);
    return learningPaths
      .filter(path => !path.isEnrolled)
      .sort((a, b) => {
        // Prioritize paths matching user interests
        const aMatch = userInterests.includes(a.category) ? 1 : 0;
        const bMatch = userInterests.includes(b.category) ? 1 : 0;
        return bMatch - aMatch;
      })
      .slice(0, 3);
  };

  const recommendedPaths = getRecommendedPaths();

  if (currentLesson && !showQuiz) {
    return (
      <div className={styles.lessonView}>
        <div className={styles.lessonHeader}>
          <button onClick={() => setCurrentLesson(null)} className={styles.backButton}>
            ← Back to Path
          </button>
          <h1 className={styles.lessonTitle}>{currentLesson.title}</h1>
        </div>
        
        <div className={styles.lessonContent}>
          <div className={styles.lessonInfo}>
            <span className={styles.duration}>⏱️ {currentLesson.duration} minutes</span>
            <span className={styles.description}>{currentLesson.description}</span>
          </div>
          
          <div className={styles.content}>
            <p>{currentLesson.content}</p>
            {/* Here you would render the full lesson content */}
          </div>
          
          <div className={styles.lessonActions}>
            <button onClick={startQuiz} className={styles.quizButton}>
              🧠 Take Quiz
            </button>
            <button onClick={completeLesson} className={styles.completeButton}>
              ✅ Mark Complete
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showQuiz && currentLesson) {
    return (
      <div className={styles.quizView}>
        <div className={styles.quizHeader}>
          <button onClick={() => setShowQuiz(false)} className={styles.backButton}>
            ← Back to Lesson
          </button>
          <h1 className={styles.quizTitle}>Quiz: {currentLesson.title}</h1>
        </div>
        
        <div className={styles.quizContent}>
          {currentLesson.quiz.questions.map((question, index) => (
            <div key={question.id} className={styles.question}>
              <h3 className={styles.questionText}>
                {index + 1}. {question.question}
              </h3>
              <div className={styles.options}>
                {question.options.map((option, optionIndex) => (
                  <label key={optionIndex} className={styles.option}>
                    <input
                      type="radio"
                      name={`question-${index}`}
                      value={optionIndex}
                      checked={quizAnswers[index] === optionIndex}
                      onChange={() => {
                        const newAnswers = [...quizAnswers];
                        newAnswers[index] = optionIndex;
                        setQuizAnswers(newAnswers);
                      }}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
              {quizResults.length > 0 && (
                <div className={`${styles.explanation} ${quizResults[index] ? styles.correct : styles.incorrect}`}>
                  {quizResults[index] ? '✅ Correct!' : '❌ Incorrect.'} {question.explanation}
                </div>
              )}
            </div>
          ))}
          
          <div className={styles.quizActions}>
            {quizResults.length === 0 ? (
              <button 
                onClick={submitQuiz} 
                className={styles.submitButton}
                disabled={quizAnswers.includes(-1)}
              >
                Submit Quiz
              </button>
            ) : (
              <div className={styles.results}>
                <p>Quiz completed! Score: {quizResults.filter(r => r).length}/{quizResults.length}</p>
                <button onClick={() => setShowQuiz(false)} className={styles.continueButton}>
                  Continue
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.learning}>
      <h1 className={styles.title}>Learning Paths</h1>

      <div className={styles.learningGrid}>
        {/* AI Recommendations */}
        <div className={styles.recommendationsCard}>
          <h2 className={styles.cardTitle}>🤖 AI Recommendations</h2>
          <p className={styles.cardDescription}>
            Based on your goals and progress, here are some learning paths that might interest you:
          </p>
          <div className={styles.recommendationsList}>
            {recommendedPaths.map((path) => (
              <div key={path.id} className={styles.recommendation}>
                <div className={styles.recommendationInfo}>
                  <h3 className={styles.recommendationTitle}>{path.title}</h3>
                  <p className={styles.recommendationDescription}>{path.description}</p>
                  <div className={styles.recommendationMeta}>
                    <span className={styles.difficulty}>{path.difficulty}</span>
                    <span className={styles.hours}>{path.estimatedHours}h</span>
                    <span className={styles.category}>{path.category}</span>
                  </div>
                </div>
                <button 
                  onClick={() => enrollInPath(path.id)}
                  className={styles.enrollButton}
                >
                  Enroll
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Enrolled Paths */}
        <div className={styles.enrolledCard}>
          <h2 className={styles.cardTitle}>My Learning Paths</h2>
          {learningPaths.filter(p => p.isEnrolled).length === 0 ? (
            <div className={styles.emptyState}>
              <p>You haven't enrolled in any learning paths yet.</p>
              <p>Check out the AI recommendations above to get started!</p>
            </div>
          ) : (
            <div className={styles.enrolledPaths}>
              {learningPaths.filter(p => p.isEnrolled).map((path) => (
                <div key={path.id} className={styles.enrolledPath}>
                  <div className={styles.pathHeader}>
                    <h3 className={styles.pathTitle}>{path.title}</h3>
                    <span className={styles.progress}>{Math.round(path.progress)}%</span>
                  </div>
                  <div className={styles.progressBar}>
                    <div 
                      className={styles.progressFill}
                      style={{ width: `${path.progress}%` }}
                    ></div>
                  </div>
                  <div className={styles.lessonsList}>
                    {path.lessons.map((lesson) => (
                      <div key={lesson.id} className={styles.lessonItem}>
                        <div className={styles.lessonInfo}>
                          <span className={styles.lessonTitle}>{lesson.title}</span>
                          <span className={styles.lessonDuration}>{lesson.duration}m</span>
                        </div>
                        <div className={styles.lessonStatus}>
                          {lesson.completed ? (
                            <span className={styles.completed}>✅</span>
                          ) : (
                            <button 
                              onClick={() => {
                                setSelectedPath(path);
                                startLesson(lesson);
                              }}
                              className={styles.startButton}
                            >
                              Start
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* All Available Paths */}
        <div className={styles.allPathsCard}>
          <h2 className={styles.cardTitle}>All Learning Paths</h2>
          <div className={styles.pathsGrid}>
            {learningPaths.map((path) => (
              <div key={path.id} className={styles.pathCard}>
                <div className={styles.pathContent}>
                  <h3 className={styles.pathTitle}>{path.title}</h3>
                  <p className={styles.pathDescription}>{path.description}</p>
                  <div className={styles.pathMeta}>
                    <span className={styles.difficulty}>{path.difficulty}</span>
                    <span className={styles.hours}>{path.estimatedHours}h</span>
                    <span className={styles.category}>{path.category}</span>
                  </div>
                  <div className={styles.pathStats}>
                    <span>{path.lessons.length} lessons</span>
                    <span>{path.lessons.reduce((sum, l) => sum + l.duration, 0)}m total</span>
                  </div>
                </div>
                <div className={styles.pathActions}>
                  {path.isEnrolled ? (
                    <button 
                      onClick={() => setSelectedPath(path)}
                      className={styles.continueButton}
                    >
                      Continue
                    </button>
                  ) : (
                    <button 
                      onClick={() => enrollInPath(path.id)}
                      className={styles.enrollButton}
                    >
                      Enroll
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}