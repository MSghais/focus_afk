
// API service for backend communication
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
}


export interface TimerSession {
    id?: string;
    type: 'focus' | 'deep' | 'break';
    userId: string;
    taskId?: string;
    goalId?: string;
    startTime: string;
    endTime?: string;
    duration: number;
    completed: boolean;
    notes?: string;
    createdAt: string;
    updatedAt?: string;


    // break?

    isHavingFun?: boolean;
    metadata?: any;
    breakMetadata?: {
        isHavingFun?: boolean;
        activities?: string[];
        persons?: string[];
        location?: string;
        weather?: string;
        mood?: string;
        energyLevel?: string;
        productivityLevel?: string;
        notes?: string;
    }

    activities?: string[];
    persons?: string[];
    location?: string;
    weather?: string;
    mood?: string;
    energyLevel?: string;
    productivityLevel?: string;
}

// Types for our database entities
export interface Task {
    id?: number;
    title: string;
    subTaskId?: number;
    description?: string;
    completed: boolean;
    priority: 'low' | 'medium' | 'high';
    category?: string;
    dueDate?: Date;
    createdAt: Date;
    updatedAt: Date;
    estimatedMinutes?: number;
    actualMinutes?: number;
}

export interface Goal {
    id?: number;
    title: string;
    description?: string;
    targetDate?: Date;
    completed: boolean;
    progress: number; // 0-100
    category?: string;
    createdAt: Date;
    updatedAt: Date;
    relatedTasks?: number[]; // Task IDs
}




export interface UserSettings {
    id?: string;
    userId: string;
    defaultFocusDuration: number;
    defaultBreakDuration: number;
    autoStartBreaks: boolean;
    autoStartSessions: boolean;
    notifications: boolean;
    theme: 'light' | 'dark' | 'auto';
    updatedAt?: string;
}

export interface User {
    id?: string;
    userAddress: string;
    email?: string;
    name?: string;
    loginType: string;
    verified: boolean;
    createdAt?: string;
    updatedAt?: string;
    starknetAddress?: string;
    evmAddress?: string;
}

export interface AuthResponse {
    user: User;
    accessToken: string;
    refreshToken: string;
}



export interface Message {
    id?: string;
    userId: string;
    mentorId?: string;
    role: 'user' | 'assistant' | 'system';
    content: string;
    model?: string;
    tokens?: number;
    metadata?: any;
    createdAt?: string;
    mentor?: {
        id?: string;
        name: string;
        role: string;
    };
}

export interface FundingAccount {
    id?: string;
    userId: string;
    accountType: 'crypto' | 'fiat' | 'subscription';
    accountName: string;
    accountAddress?: string;
    accountDetails?: any;
    isActive: boolean;
    balance?: number;
    currency: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface Mentor {
    id?: string;
    userId: string;
    name: string;
    role: string;
    notes?: string[];
    note?: string;
    knowledges: string[];
    about?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    evmAddress?: string;
    starknetAddress?: string;
    loginType?: string;
    verified?: boolean;
    user?: User;
    metadata?: any;
    knowledge?: string[];
    sources?: string[];
    personality?: any;
    accountEvmAddress?: string;
    evmAddressAgent?:string;
    assistant_metadata?: any;


}

export interface MentorFeedback {
    sessionId: string;
    rating: number;
    message: string;
    tips: string[];
    nextSteps: string[];
}