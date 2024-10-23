import {AnalysisResult, Job} from "./Job.ts";
import {useReducer} from "react";

export enum AnalyzerStateActionKind {
    ADD_JOB,
    ADD_JOB_PROGRESS,
    SELECT_JOB,
    SET_ALL_JOBS,
    UPDATE_JOB_EXPECTED_RESULT_COUNT
}

export type AnalyzerStateAction = {
    type: AnalyzerStateActionKind.ADD_JOB;
    job: Job
} | {
    type: AnalyzerStateActionKind.ADD_JOB_PROGRESS;
    jobId: number;
    result: AnalysisResult
} | {
    type: AnalyzerStateActionKind.SELECT_JOB;
    jobId: number | null;
} | {
    type: AnalyzerStateActionKind.SET_ALL_JOBS;
    jobs: Job[];
} | {
    type: AnalyzerStateActionKind.UPDATE_JOB_EXPECTED_RESULT_COUNT;
    jobId: number,
    count: number;
}

export interface AnalyzerState {
    jobs: Job[]
    selectedJobId: number | null
}

const DEFAULT_STATE = {
    jobs: [], selectedJobId: null
};

export function useAnalyzerState() {
    return useReducer(analyzerStateReducer, DEFAULT_STATE);
}

function analyzerStateReducer(state: AnalyzerState, action: AnalyzerStateAction): AnalyzerState {
    switch (action.type) {
        case AnalyzerStateActionKind.ADD_JOB:
            return {...state, jobs: state.jobs.concat(action.job)};
        case AnalyzerStateActionKind.SELECT_JOB:
            return {...state, selectedJobId: action.jobId};
        case AnalyzerStateActionKind.SET_ALL_JOBS:
            return {...state, jobs: action.jobs};
        case AnalyzerStateActionKind.ADD_JOB_PROGRESS: {
            const jobIndex = state.jobs.findIndex(j => j.id === action.jobId);
            const currentJob = state.jobs[jobIndex];
            const job = {
                ...currentJob,
                results: currentJob.results.set(action.result.id, action.result)
            };
            const jobs = state.jobs.toSpliced(jobIndex, 1, job)
            return {...state, jobs: jobs}
        }
        case AnalyzerStateActionKind.UPDATE_JOB_EXPECTED_RESULT_COUNT: {
            const jobIndex = state.jobs.findIndex(j => j.id === action.jobId);
            const currentJob = state.jobs[jobIndex];
            const job = {
                ...currentJob,
                targetResultCount: action.count
            };
            const jobs = state.jobs.toSpliced(jobIndex, 1, job)
            return {...state, jobs: jobs}
        }
    }
}