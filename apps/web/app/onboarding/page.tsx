'use client'
import { useState } from 'react';
import FormMultistep from '../../components/onboarding/multistep/FormMultistep';
import OnboardingProcess from '../../components/onboarding/multistep/process';
import styles from './onboarding.module.scss';
import { OnboardingFun } from '../../components/onboarding/fun';

export default function OnboardingPage() {
  const [showMultistep, setShowMultistep] = useState(true);
  const [showProcess, setShowProcess] = useState(false);
  const [showFun, setShowFun] = useState(false);

  const handleComplete = () => {
    // Redirect to dashboard or main app
    // window.location.href = '/dashboard';
  };

  const handleStepChange = (stepIndex: number) => {
    console.log(`Step changed to: ${stepIndex}`);
  };

  return (
    <div className={styles.container}>
      {/* Demo Controls */}
      {/* <div className={styles.demoControls}>
        <div className={styles.buttonGroup}>
          <button 
            className={styles.demoButton}
            onClick={() => {
              setShowMultistep(true);
              setShowProcess(false);
            }}
          >
            Show Multistep Form
          </button>
          <button 
            className={styles.demoButton}
            onClick={() => {
              setShowFun(true);
              setShowMultistep(false);
              setShowProcess(false);
            }}
          >
            Show Fun Form
          </button>
          <button 
            className={styles.demoButton}
            onClick={() => {
              setShowProcess(true);
              setShowMultistep(false);
            }}
          >
            Show Onboarding Process
          </button>
          <button 
            className={styles.demoButton}
            onClick={() => {
              setShowMultistep(false);
              setShowProcess(false);
              setShowFun(false);
            }}
          >
            Hide All
          </button>
        </div>
      </div> */}

      {/* Component Display */}
      <div className={styles.componentArea}>
        {showMultistep && (
          <div className={styles.componentContainer}>
            {/* <h3 className={styles.componentTitle}>FormMultistep Component</h3> */}
            <FormMultistep 
              onComplete={handleComplete}
              onStepChange={handleStepChange}
              showOnboarding={true}
            />
          </div>
        )}

        {showProcess && (
          <div className={styles.componentContainer}>
            {/* <h3 className={styles.componentTitle}>OnboardingProcess Component</h3> */}
            <OnboardingProcess 
              onComplete={handleComplete}
              onStepChange={handleStepChange}
            />
          </div>
        )}

        {showFun && (
          <div className={styles.componentContainer}>
            <OnboardingFun onComplete={handleComplete} />
          </div>
        )}
{/* 
        {!showMultistep && !showProcess && !showFun && (
          <div className={styles.welcomeMessage}>
            <h1 className={styles.welcomeTitle}>Welcome to FocusFi</h1>
            <p className={styles.welcomeText}>
              Choose an onboarding component to preview above. The improved components feature:
            </p>
            <ul className={styles.featureList}>
              <li>✨ Modern, responsive design</li>
              <li>🎯 Step-by-step progress tracking</li>
              <li>📱 Mobile-optimized interface</li>
              <li>🎨 Beautiful animations and transitions</li>
              <li>♿ Accessibility features</li>
              <li>🌙 Dark mode support</li>
            </ul>
          </div>
        )} */}
      </div>
    </div>
  );
} 