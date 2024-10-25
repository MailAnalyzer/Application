import {Job} from "../data/Job.ts";
import "./email-panel.css"
import Folder from "../components/Folder.tsx";
import EmailVisualizer from "../components/EmailVisualizer.tsx";
import {useCallback, useEffect, useState} from "react";
import {Email, Header} from "postal-mime";
import {getEmail} from "../net/queries.ts";
import AnalysisVisualizer from "./AnalysisVisualizer.tsx";

export interface EmailPanelProps {
    job: Job
}

export default function EmailPanel({job}: EmailPanelProps) {

    const [emailString, setEmailString] = useState<Email | null>(null);

    useEffect(() => {
        getEmail(job.id).then(setEmailString)
    }, [job.id])

    const visualizeEmail = useCallback(() => emailString
        ? <EmailVisualizer email={emailString} />
        : "Retrieving email ...", [emailString])

    const visualizeHeaders = useCallback(() => emailString
        ? <div className={"email-headers data-text"}>
            {emailString.headers.map(({key, value}: Header, idx) =>
                <div key={idx}><strong>{key}</strong>: {value}</div>
            )}
        </div>
        : "Retrieving email ...", [emailString])

    return <div id={"email-panel"}>
        <div id="email-panel-header">
            <div id="email-panel-title">{job.subject}</div>
        </div>

        <div id="email-panel-content">
            <Folder tabs={[
                {
                    title: "email",
                    render: visualizeEmail
                },
                {
                    title: "headers",
                    render: visualizeHeaders
                },
                {
                    title: "analysis",
                    render: () => <AnalysisVisualizer job={job} emailHeaders={emailString?.headers ?? null}/>
                },
            ]}/>
        </div>
    </div>

}