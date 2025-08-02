'use client'
import { useState } from 'react';
import styles from './OnboardingProcess.module.scss';
import { logClickedEvent } from '../../../../lib/analytics';

interface OnboardingStep {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  actionText: string;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Focus AFK',
    subtitle: 'Your Journey to Focused Success',
    description: 'Transform your productivity with AI-powered focus tools, goal tracking, and gamified achievements.',
    image: '/circles.svg',
    actionText: 'Get Started'
  },
  {
    id: 'focus-modes',
    title: 'Focus Modes',
    subtitle: 'Block Distractions, Boost Productivity',
    description: 'Focus Modes help you stay on track by blocking distracting apps and websites during your work sessions.',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&h=600&fit=crop',
    actionText: 'Next'
  },
  {
    id: 'personalize',
    title: 'Personalize Your Focus',
    subtitle: 'Tailor Your Experience',
    description: 'Set goals, track progress, and stay motivated with personalized settings that adapt to your unique workflow.',
    image: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=800&h=600&fit=crop',
    actionText: 'Next'
  },
  {
    id: 'goals',
    title: 'Set Your Goals',
    subtitle: 'Define What Matters Most',
    description: 'Create meaningful goals and break them down into actionable tasks. Track your progress and celebrate achievements.',
    image: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&h=600&fit=crop',
    actionText: 'Create Goals'
  },
  {
    id: 'ready',
    title: "You're All Set!",
    subtitle: 'Ready to Focus and Succeed',
    description: 'Take control back',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=600&fit=crop',
    actionText: 'Start Focusing'
  }
];

interface OnboardingProcessProps {
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
}

export default function OnboardingProcess({ onComplete, onStepChange }: OnboardingProcessProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    logClickedEvent("onboarding_next_step");
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
      onStepChange?.(currentStep + 1);
    } else {
      onComplete?.();
    }
  };

  const handlePrevious = () => {
    logClickedEvent("onboarding_previous_step");
    if (currentStep > 0) {

      setCurrentStep(currentStep - 1);
      onStepChange?.(currentStep - 1);
    }
  };

  const handleSkip = () => {
    logClickedEvent("onboarding_skip");
    onComplete?.();
  };

  // Ensure currentStep is within bounds
  const safeCurrentStep = Math.max(0, Math.min(currentStep, ONBOARDING_STEPS.length - 1));
  const currentStepData = ONBOARDING_STEPS[safeCurrentStep];
  const isLastStep = safeCurrentStep === ONBOARDING_STEPS.length - 1;
  const isFirstStep = safeCurrentStep === 0;

  // If no step data is available, show a fallback
  if (!currentStepData) {
    return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.stepContent}>
            <h1 className={styles.title}>Loading...</h1>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div >
      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressBar}>
          <div
            className={styles.progressFill}
            style={{ width: `${((safeCurrentStep + 1) / ONBOARDING_STEPS.length) * 100}%` }}
          />
        </div>
        <div className={styles.stepIndicator}>
          {safeCurrentStep + 1} of {ONBOARDING_STEPS.length}
        </div>
      </div>

      {/* Skip Button */}
      {!isLastStep && (
        <button className={styles.skipButton} onClick={handleSkip}>
          Skip
        </button>
      )}

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.stepContent}>
          {/* Image */}
          <div className={styles.imageContainer}>
            <div
              className={styles.image}
              style={{
                backgroundImage: `url(${currentStepData.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          </div>

          {/* Text Content */}
          <div className={styles.textContent}>
            <h1 className={styles.title}>{currentStepData.title}</h1>
            <h2 className={styles.subtitle}>{currentStepData.subtitle}</h2>
            <p className={styles.description}>{currentStepData.description}</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <div className={styles.navButtons}>
          {!isLastStep && (
            <button onClick={handleSkip}
            className="cursor-pointer p-4"
            >
              Skip
            </button>
          )}
          
          {!isFirstStep && (
            <button
              className={styles.backButton}
              onClick={handlePrevious}
              aria-label="Previous step"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          )}

          <button
            className={styles.nextButton}
            onClick={handleNext}
            aria-label={isLastStep ? 'Complete onboarding' : 'Next step'}
          >
            {currentStepData.actionText}
            {!isLastStep && (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </div>

        {/* Step Dots */}
        <div className={styles.stepDots}>
          {ONBOARDING_STEPS.map((_, index) => (
            <button
              key={index}
              className={`${styles.dot} ${index === safeCurrentStep ? styles.activeDot : ''}`}
              onClick={() => {
                setCurrentStep(index);
                onStepChange?.(index);
              }}
              aria-label={`Go to step ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
