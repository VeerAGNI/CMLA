export type Role = 'creator' | 'strategist' | 'builder' | 'unassigned';

export interface User {
  id: string;
  displayName: string;
  role: Role;
  points: number;
  streak: number;
  lastDropDate?: string;
  createdAt: string;
  updatedAt: string;
}

export type TimelineEvent = {
  stage: IdeaStatus;
  time: string;
  note?: string;
  by: string; // The user ID or name who made the change
}

export type IdeaStatus = 'under_review' | 'rejected' | 'appealed' | 'approved' | 'building' | 'done' | 'final_rejected' | 'postponed';

export interface AppIdea {
  id: string;
  title: string;
  description: string;
  createdBy: string;
  status: IdeaStatus;
  strategy?: string;
  rejectionReason?: string;
  appealReason?: string;
  postponeReason?: string;
  appealUsed: boolean;
  timeline: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
}
