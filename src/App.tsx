import './App.css'
import Search from "antd/lib/input/Search";
import EmailCard from "./components/EmailCard.tsx";
import EmailUploader from "./components/EmailUploader.tsx";
import EmailPanel from "./page/EmailPanel.tsx";
import {AnalyzerStateActionKind, useAnalyzerState} from "./data/AnalyzerState.ts";
import {useCallback, useEffect} from "react";
import {getAllJobs, getAllJobsIds, listenJobEvents, listenNewJobEvents, submitEmail} from "./net/queries.ts";
import {JobEventType} from "./data/Job.ts";

export default function App() {

    const [state, dispatch] = useAnalyzerState();

    const selectedJob = state.selectedJobId
        ? state.jobs.find((job) => job.id === state.selectedJobId)
        : null;

    useEffect(() => {

        const socketsClosesFunctions: (() => void)[] = [];

        function handleNewJob(jobId: number) {
            const closeFunction = listenJobEvents(jobId, (event) => {
                switch (event.type) {
                    case JobEventType.PROGRESS: {
                        dispatch({
                            type: AnalyzerStateActionKind.ADD_JOB_PROGRESS,
                            jobId,
                            result: event.value
                        })
                        break;
                    }
                    case JobEventType.ERROR:
                        console.error(event.value)
                        break;
                    case JobEventType.EXPANDED_RESULT_COUNT:
                        dispatch({
                            type: AnalyzerStateActionKind.UPDATE_JOB_EXPECTED_RESULT_COUNT,
                            jobId,
                            count: event.value
                        })
                        break;
                }
            })

            socketsClosesFunctions.push(closeFunction)
        }

        async function initializeJobs() {

            socketsClosesFunctions.push(listenNewJobEvents((newJobDesc) => {
                dispatch({
                    type: AnalyzerStateActionKind.ADD_JOB, job: {
                        ...newJobDesc,
                        results: new Map(newJobDesc.results.map(j => [j.id, j]))
                    }
                })

                handleNewJob(newJobDesc.id)
            }))

            const jobIds = await getAllJobsIds();

            dispatch({
                type: AnalyzerStateActionKind.SET_ALL_JOBS, jobs: jobIds.map(id => ({
                    id,
                    subject: "Initializing...",
                    targetResultCount: 1,
                    results: new Map()
                }))
            })

            for (const jobId of jobIds) {
                handleNewJob(jobId)
            }

            const jobs = await getAllJobs()
            dispatch({type: AnalyzerStateActionKind.SET_ALL_JOBS, jobs})


        }

        initializeJobs();

        // close all SSE sockets
        return () => socketsClosesFunctions.forEach(f => f());
    }, [])

    const uploadFile = useCallback(async (files: FileList) => {
        for (const file of files) {
            await submitEmail(file);
        }
    }, [])

    return (
        <>
            <header id="header">
                <EmailUploader onFilesUploaded={uploadFile}/>
                <Search placeholder="input search text" style={{width: 200}}/>
            </header>
            <div id="content">
                <aside id="menu">
                    {state.jobs.map((job) =>
                        <EmailCard key={job.id}
                                   job={job}
                                   onClick={() => dispatch({
                                       type: AnalyzerStateActionKind.SELECT_JOB,
                                       jobId: job.id
                                   })}
                        />)}
                </aside>
                <div id="panel-background"></div>
                <div id="panel">
                    {
                        selectedJob
                            ? <EmailPanel job={selectedJob}/>
                            : <EmailUploader onFilesUploaded={uploadFile}/>
                    }
                </div>
            </div>
        </>
    )
}

