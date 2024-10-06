import {AnalysisResult, Job} from "./Job.ts";
import {useReducer} from "react";

export enum AnalyzerStateActionKind {
    ADD_JOB,
    ADD_JOB_PROGRESS,
    SELECT_JOB,
    SET_ALL_JOBS
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
}

export interface AnalyzerState {
    jobs: Job[]
    selectedJobId: number | null
}

// const DEFAULT_STATE = {
//     jobs: [
//         {
//             subject: "Re: I'm a phishing",
//             id: 1248,
//             targetResultCount: 10,
//             results: [{name: "test", description: "description", verdictDescription: "fake", errors: []}]
//         },
//         {subject: "Re: Important meeting", error: "Parsing Error", id: 42423, targetResultCount: 10, results: []},
//         {
//             subject: "Re: Elon musk's secret cousin",
//             error: "Splunk API Error",
//             id: 123214,
//             targetResultCount: 10,
//             results: []
//         },
//         {subject: "Re: Jeux Olympiques Paris 2024", id: 452, targetResultCount: 10, results: []},
//         {subject: "Re: This is a very long email subject", id: 2314, targetResultCount: 10, results: []},
//     ], selectedJobId: null
// };

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
        case AnalyzerStateActionKind.ADD_JOB_PROGRESS:
            const jobIndex = state.jobs.findIndex(j => j.id === action.jobId);
            const currentJob = state.jobs[jobIndex];
            const job = {
                ...currentJob,
                results: currentJob.results.set(action.result.id, action.result)
            };
            const jobs = state.jobs.toSpliced(jobIndex, 1, job)
            return {...state, jobs: jobs}
    }
}