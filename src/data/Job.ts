export enum JobEventType {
    PROGRESS = "Progress",
    ERROR = "Error",
    EXPANDED_RESULT_COUNT = "ExpandedResultCount",
    DONE = "Done",
}

export type JobEvent = {
    type: JobEventType.PROGRESS,
    value: AnalysisResult
} | {
    type: JobEventType.ERROR,
    value: string,
} | {
    type: JobEventType.EXPANDED_RESULT_COUNT,
    value: number
} | {
    type: JobEventType.DONE,
}

export interface AnalysisResult {
    id: number,
    analysisName: string,
    verdict: AnalysisVerdict,
}

export type AnalysisVerdict = {
    kind: string,
    value: any
}

export interface Job {
    subject: string;
    id: number;
    targetResultCount: number;
    error?: string;

    results: Map<number, AnalysisResult>;
}

export type JobDescription = Omit<Job, "results"> & { results: AnalysisResult[] };