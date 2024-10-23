import {AnalysisResult, Job, JobDescription, JobEvent} from "../data/Job.ts";
import PostalMime, {Email} from "postal-mime";


export async function getAllJobs(): Promise<Job[]> {
    const response = await fetch('http://localhost:8000/jobs', {
        method: 'GET',
    })

    const {jobs}: { jobs: JobDescription[] } = await response.json()
    return jobs.map((job) => ({
        ...job,
        results: new Map(job.results.map(j => [j.id, j]))
    }))
}

export async function getAllJobsIds(): Promise<number[]> {
    const response = await fetch('http://localhost:8000/jobs_ids', {})
    return await response.json();
}

export function listenJobEvents(jobId: number, listener: (result: JobEvent) => void): () => void {
    return sse(`http://localhost:8000/job/${jobId}/events`, "result", listener)
}

export function listenNewJobEvents(listener: (result: JobDescription) => void): () => void {
    return sse(`http://localhost:8000/job/events`, "new_job", listener)
}

function sse<A>(url: string, channel: string, listener: (result: A) => void): () => void {
    const client = new EventSource(url, {
        withCredentials: true
    });

    client.addEventListener(channel, (event: MessageEvent) => {
        const data: A = JSON.parse(event.data);
        listener(data)
    })

    return () => client.close();
}

export async function submitEmail(email: File) {
    await fetch("http://localhost:8000/job", {
        method: 'POST',
        headers: {
            "Content-Type": 'application/octet-stream'
        },
        body: await email.arrayBuffer(),
        duplex: 'half'
    })
}

export async function getEmail(jobId: number): Promise<Email> {
    const response = await fetch(`http://localhost:8000/job/${jobId}/email`)
    const emailString = await response.text()
    return PostalMime.parse(emailString)
}