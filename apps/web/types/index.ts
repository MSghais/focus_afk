
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
    notes?: string[];
    note?:string;
    createdAt: string;
    updatedAt?: string;

    // Sync fields for backend integration
    syncedToBackend?: boolean;
    backendId?: string;

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
    id?: string; // Changed from number to string to match backend CUID
    userId?: string; // Added userId field for backend sync
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
    goalId?: number; 
    goalIds?: number[];
}

export interface Goal {
    id?: string; // Changed from number to string to match backend CUID
    userId?: string; // Added userId field for backend sync
    title: string;
    description?: string;
    targetDate?: Date;
    completed: boolean;
    progress: number; // 0-100
    category?: string;
    createdAt: Date;
    updatedAt: Date;
    relatedTasks?: number[]; // Task IDs
    relatedTaskIds?: string[]; // Backend field name
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



export interface Chat {
    id?: string;
    userId: string;
    mentorId?: string;
    title?: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    metadata?: any;
    mentor?: {
        id?: string;
        name: string;
        role: string;
    };
    messages?: Message[];
    _count?: {
        messages: number;
    };
}

export interface Message {
    id?: string;
    userId: string;
    mentorId?: string;
    chatId?: string; // New field for chat-based system
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


export interface Badge {
    id?: string;
    userId?: string;
    type?: string;   // e.g. 'daily_connection', 'streak', etc.
    name?: string;
    description?: string;
    icon?: string;  // emoji or icon name
    dateAwarded?: string;
    meta?: any;
    createdAt?: string;
    updatedAt?: string;
    nftContractAddress?: string;
    nftTokenId?: string;
    imageUrl?: string;
    isCompleted?: string;
    requirements?: string[];
    user?: User;

}

export interface Quest {
    id?: string;
    title?: string;
    requirements?: string[];
    taskAbout?: string;
    type?: string;
    name?: string;
    description?: string;
    icon?: string;
    dateAwarded?: string;
    meta?: any;
    nftContractAddress?: string;
    nftTokenId?: string;
    imageUrl?: string;
    difficulty?: number;
    rewardXp?: number;
    rewardBadge?: string;
    badgeReward?: string;
    levelRequired?: number;
    progress?: number;

    // metadata
    metadata?: any;

    // dates
    createdAt?: string;
    updatedAt?: string;
    isCompleted?: boolean;
    isActive?: boolean;
    isPublic?: boolean;
    topics?: string[];
    isProfilePublic?: boolean;
    isGoalPublic?: boolean;
    isTaskPublic?: boolean;
    user?: User;
}

export interface NoteSource {
    id?: string;
    type: 'link' | 'text' | 'file' | 'google_drive' | 'youtube' | 'website';
    title: string;
    content?: string;
    url?: string;
    fileType?: string;
    fileSize?: number;
    metadata?: any;
    createdAt?: string;
}

export interface NoteRelation {
    id?: string;
    sourceNoteId: string;
    targetNoteId: string;
    relationType: 'references' | 'extends' | 'contradicts' | 'supports' | 'related';
    strength: number; // 0-1 scale
    createdAt?: string;
}

export interface Note {
    id?: string;
    userId: string;
    text?: string;
    description?: string;
    summary?: string;
    topics: string[];
    sources: NoteSource[]; // Keep for backward compatibility
    noteSources?: NoteSource[]; // New structured sources
    aiSources: string[];
    aiTopics: string[];
    metadata?: any;
    aiSummary?: string;
    type?: 'user' | 'ai' | 'notebook';
    difficulty?: number;
    requirements: string[];
    parentNoteId?: string; // For hierarchical notes
    childNoteIds?: string[]; // For hierarchical notes
    relations?: NoteRelation[]; // For note-to-note relationships
    isNotebook?: boolean; // Flag for notebook projects
    notebookSettings?: {
        allowCollaboration?: boolean;
        defaultView?: 'list' | 'grid' | 'timeline';
        tags?: string[];
    };
    createdAt?: string;
    updatedAt?: string;
    user?: User;
}