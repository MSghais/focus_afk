'use client'
import { useEffect, useState } from "react";
import { useAuthStore } from "../../store/auth";
import GoalCreate from "../modules/goals/GoalCreate";
import { useFocusAFKStore } from "../../store/store";
import CreateTask from "../modules/tasks/CreateTask";
import Onboarding from "./Onboarding";


const STEPS = [
    {
        title: "Goal",
        component: GoalCreate
    }
]
export default function FormMultistep({ onNext }: { onNext?: () => void }) {

    const [step, setStep] = useState(0);

    const { userConnected, isAuthenticated, } = useAuthStore();


    const { tasks } = useFocusAFKStore()

    // useEffect(() => {
    //     if (isAuthenticated && step === 0) {
    //         setStep(1);
    //     }
    // }, [isAuthenticated, step]);

    const maxSteps = 3;

    const handleNext = () => {
        setStep(step + 1);
    }

    const handlePrevious = () => {
        setStep(step - 1);
    }

    const handleSubmit = () => {
        onNext && onNext();
    }
    return (
        <div>
            <h1>Form Multistep</h1>


            <div>
                <h2>Step {step} of {maxSteps}</h2>
            </div>


            <div>


                {step === 0 && (
                    <div>
                        <h2>Step 0</h2>
                        <Onboarding isWelcomeStep={false} />
                    </div>
                )}

                {step === 1 && (
                    <div>
                        <h2>Step 1</h2>
                        <GoalCreate onNext={handleNext}
                            tasks={tasks.map((task) => ({
                                id: task.id || '',
                                title: task.title || ''
                            }))}
                        />
                    </div>
                )}

                {step === 2 && (
                    <div>
                        <CreateTask onNext={handleNext} />
                    </div>
                )}

                {step === 3 && (
                    <div>
                        <h2>Step 3</h2>
                    </div>
                )}
            </div>





            <div className="flex flex-row gap-2">

                <div>
                    <button onClick={handlePrevious}>Previous</button>
                </div>

                <div>
                    <button onClick={handleNext}>Next</button>
                </div>

                <div>
                    <button onClick={handleSubmit}>Submit</button>
                </div>

            </div>

        </div>
    )
}   