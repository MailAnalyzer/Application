export interface AnalysisResult {
    id: number,
    name: string,
    description: string,
    verdictDescription: string,
    errors: string[],
}

export interface Job {
    subject: string;
    id: number;
    targetResultCount: number;
    error?: string;

    results: Map<number, AnalysisResult>;
}

export type JobDescription = Omit<Job, "results"> & { results: AnalysisResult[] };