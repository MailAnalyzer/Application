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

    const [email, setEmail] = useState<Email | null>(null);

    useEffect(() => {
        getEmail(job.id).then(setEmail)
    }, [job.id])

    const visualizeEmail = useCallback(() => email
        ? <EmailVisualizer email={email} />
        : "Retrieving email ...", [email])

    const visualizeHeaders = useCallback(() => email
        ? <div className={"email-headers data-text"}>
            {email.headers.map(({key, value}: Header, idx) =>
                <div key={idx}><strong>{key}</strong>: {value}</div>
            )}
        </div>
        : "Retrieving email ...", [email])

    return <div id={"email-panel"}>
        <div id="email-panel-header">
            <div id="email-panel-title">{job.subject}</div>
        </div>

        <div id="email-panel-content">
            <Folder tabs={[
                {
                    title: "Email",
                    render: visualizeEmail
                },
                {
                    title: "Headers",
                    render: visualizeHeaders
                },
                {
                    title: "Analysis",
                    render: () => <AnalysisVisualizer job={job} emailHeaders={email?.headers ?? null}/>
                },
                {
                    title: "Report",
                    render: () => <p>Report will be available once analysis is complete.</p>
                }
            ]}/>
        </div>
    </div>

}