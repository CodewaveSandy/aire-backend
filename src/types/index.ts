import { Request } from "express";
import { IUser } from "../models/user.model";
import { IJobOpening } from "../models/jobOpening.model";
import { ISkill } from "../models/skill.model";
import { ICandidate } from "../models/candidate.model";
import { IOrgSkill } from "../models/orgSkill.model";

// Extended Request interface with user
export interface AuthRequest extends Request {
  user?: IUser;
}

// API response interface
export interface ApiResponse {
  status: "success" | "error" | "fail";
  data?: any;
  message?: string;
  errors?: any;
}

// Login request body interface
export interface LoginRequestBody {
  email: string;
  password: string;
}

// Register request body interface
export interface RegisterRequestBody {
  name: string;
  email: string;
  password: string;
  role: "hr" | "interviewer";
}

export type JobWithSkills = Omit<IJobOpening, "skills"> & { skills: ISkill[] };
export type CandidateWithSkills = Omit<ICandidate, "skills"> & {
  skills: ISkill[];
};

export type RankedCandidate = CandidateWithSkills & {
  matchPercentage: number;
  matchedSkills: string[];
};

export type PopulatedOrgSkill = Omit<IOrgSkill, "skill"> & {
  skill: ISkill | null;
};

