'use client'
import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/auth";
import GoalCreate from "../../modules/goals/GoalCreate";
import { useFocusAFKStore } from "../../../store/store";
import CreateTask from "../../modules/tasks/CreateTask";
import OnboardingProcess from "./process";
import styles from './FormMultistep.module.scss';
import { Goal } from "../../../types";
import { useUIStore } from "../../../store/uiStore";

import { logClickedEvent } from '../../../lib/analytics';
import { useRouter } from "next/navigation";
import PrivyUser from "../../profile/PrivyUser";
import ProfileUser from "../../profile/ProfileUser";

interface Step {
  id: string;
  title: string;
  description: string;
  component: React.ComponentType<any>;
  props?: Record<string, any>;
}

const STEPS: Step[] = [
  {
    id: 'onboarding',
    title: 'Welcome',
    description: 'Get started with FocusFi',
    component: OnboardingProcess
  },
  {
    id: 'login',
    title: 'Login',
    description: 'Login to your account',
    component: PrivyUser
  },
  {
    id: 'goals',
    title: 'Set Goals',
    description: 'Define your objectives',
    component: GoalCreate
  },
  {
    id: 'tasks',
    title: 'Create Tasks',
    description: 'Break down your goals',
    component: CreateTask
  },
  {
    id: 'complete',
    title: 'All Set',
    description: 'Ready to focus',
    component: () => <div>Completion step</div>
  }
];

interface FormMultistepProps {
  onComplete?: () => void;
  onStepChange?: (stepIndex: number) => void;
  showOnboarding?: boolean;
}

export default function FormMultistep({
  onComplete,
  onStepChange,
  showOnboarding = true
}: FormMultistepProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const { userConnected, isAuthenticated } = useAuthStore();
  const { tasks, addGoal, addTask } = useFocusAFKStore();
  const { showToast } = useUIStore();
  const router = useRouter();
  // Skip onboarding if not needed
  useEffect(() => {
    if (!showOnboarding && currentStep === 0) {
      setCurrentStep(1);
    }
  }, [showOnboarding, currentStep]);


  const handleNext = () => {
    console.log("currentStep", currentStep);
    if (currentStep < STEPS.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);

      console.log("nextStep", nextStep);
      if (nextStep === 5) {
        // router.push("/timer")
        // onComplete?.();
      }
    } else {
      // showToast( {message: "Onboarding complete", type: "success"} );
      // onComplete?.();
      // router.push("/timer")

    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    setCurrentStep(stepIndex);
    onStepChange?.(stepIndex);
  };

  const handleOnboardingComplete = () => {
    handleNext();
  };

  const handleCreateGoal = async (goal: Goal) => {
    logClickedEvent('goal_create_onboarding');
    const newGoal = await addGoal({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate,
      completed: false,
      progress: 0,
      category: goal.category,
      relatedTasks: goal.relatedTasks,
    });
    if (newGoal) {
      showToast({ message: "Goal created successfully", type: "success" });
    }
  };


  const handleOnboardEnd = () => {
    logClickedEvent('onboarding_complete');
    showToast({ message: "Onboarding complete", type: "success" });
    localStorage?.setItem('onboarding_complete', 'true');
    onComplete?.();
    router.push("/timer")
  }
  const currentStepData = STEPS[currentStep];
  const isLastStep = currentStep === STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  // If it's the onboarding step, render the onboarding process
  if (currentStep === 0 && showOnboarding) {
    return (
      <OnboardingProcess
        onComplete={handleOnboardingComplete}
        onStepChange={(stepIndex) => onStepChange?.(stepIndex)}
      />
    );
  }

  console.log("currentStep", currentStep);
  return (
    <div className={styles.container}>
      {/* Progress Header */}
      <div className={styles.header}>
        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div
              className={styles.progressFill}
              style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
            />
          </div>
          <div className={styles.stepInfo}>
            <span className={styles.stepNumber}>Step {currentStep + 1} of {STEPS.length}</span>
            <span className={styles.stepTitle}>{currentStepData?.title}</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.content}>
        <div className={styles.stepContent}>
          {/* Step Header */}
          <div className={styles.stepHeader}>
            <h1 className={styles.title}>{currentStepData?.title}</h1>
            <p className={styles.description}>{currentStepData?.description}</p>
          </div>

          {/* Step Component */}

          <div className={styles.stepComponent}>
            {currentStep === 1 && (
              <div>
                <ProfileUser isLoggoutViewActive={true} />
                <button onClick={() => {
                  logClickedEvent('onboarding_skip_login');
                  handleNext();
                }}>Skip</button>
              </div>
            )}
            {currentStep === 2 && (
              <GoalCreate
                onNext={handleNext}
                tasks={tasks.map((task) => ({
                  id: task.id || '',
                  title: task.title || ''
                }))}
                onCreate={handleCreateGoal}
              />
            )}

            {currentStep === 3 && (
              <CreateTask onNext={() => {
                logClickedEvent('onboarding_create_task');
                handleNext();
              }} />
            )}

            {currentStep === 4 && (
              <div className={styles.completionStep}>
                <div className={styles.completionIcon}>
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                  </svg>
                </div>
                <h2 className={styles.completionTitle}>You're All Set!</h2>
                <p className={styles.completionDescription}>
                  Your focus environment is ready. Start your first focused session and begin your journey to success.
                </p>
                <button
                  className={styles.completionButton}
                  onClick={handleOnboardEnd}
                >
                  Start Focusing
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className={styles.navigation}>
        <div className={styles.navButtons}>
          {!isFirstStep && (
            <button
              className={styles.backButton}
              onClick={handlePrevious}
              aria-label="Previous step"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back
            </button>
          )}

          {!isLastStep && (
            <button
              className={styles.nextButton}
              onClick={handleNext}
              aria-label="Next step"
            >
              Next
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          )}
        </div>

        {/* Step Indicators */}
        <div className={styles.stepIndicators}>
          {STEPS.map((step, index) => (
            <button
              key={step.id}
              className={`${styles.stepIndicator} ${index === currentStep ? styles.activeIndicator : ''} ${index < currentStep ? styles.completedIndicator : ''}`}
              onClick={() => handleStepClick(index)}
              aria-label={`Go to ${step.title}`}
            >
              <span className={styles.indicatorNumber}>
                {index < currentStep ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M9 12L11 14L15 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  index + 1
                )}
              </span>
              <span className={styles.indicatorLabel}>{step.title}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}   