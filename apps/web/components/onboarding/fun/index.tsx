import { useState } from 'react';
import { ButtonPrimary } from '../../small/buttons';
import GoalCreate from '../../modules/goals/GoalCreate';
import { useFocusAFKStore } from '../../../store/store';
import { Goal } from '../../../types';
import { useUIStore } from '../../../store/uiStore';

interface OnboardingProps {
    onComplete: () => void;
}


export function OnboardingFun({ onComplete }: OnboardingProps) {
    const [currentStep, setCurrentStep] = useState(0);

    const {showToast, showModal} = useUIStore();
    const {addGoal, loadGoals} = useFocusAFKStore();
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            onComplete();
        }
    };


  const handleCreate = async (goal: Goal) => {
   const newGoal = await addGoal({
      title: goal.title,
      description: goal.description,
      targetDate: goal.targetDate ? new Date(goal.targetDate) : undefined,
      completed: false,
      progress: 0,
      category: goal.category,
      relatedTasks: goal.relatedTasks,
    });
    await loadGoals();
    if( newGoal ) {
        showToast( {message: "Goal created successfully", type: "success"} );
        setCurrentStep(currentStep + 1);
        // setShowModal(false);
    }
  };


const steps = [
    {
        content: "Doom scrolling is stealing your focus and draining your mental energy",
        buttonText: "Next",

    },
    {
        content: "And the worst is the time you lose",
        buttonText: "So what?"
    },
    {
        content: "Take control back!",
        buttonText: "Start doing it"
    },
    {
        content: "Set goals",
        buttonText: "Next",
        children: (<GoalCreate
            tasks={[]}
            onCreate={handleCreate}
        />),
        next: 4
    }
];

    // Fallback for out-of-bounds
    const step = steps[currentStep] ?? steps[steps.length - 1];

    return (
        // <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="rounded-2xl shadow-2xl max-w-md w-full mx-4 p-8 text-center">
            <div className="space-y-8">
                <p className="text-lg leading-relaxed">
                    {step?.content}
                </p>
                {step?.children}
                <ButtonPrimary
                    onClick={handleNext}
                    className="w-full py-3 px-6 rounded-lg text-lg font-semibold hover:bg-blue-700 transition"
                    type="button"
                >
                    {step?.buttonText}
                </ButtonPrimary>
            </div>
        </div>
        // </div>
    );
}