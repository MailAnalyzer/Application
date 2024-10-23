import {Job} from "../data/Job.ts";
import "./email-panel.css"
import Folder from "../components/Folder.tsx";
import EmailVisualizer from "../components/EmailVisualizer.tsx";
import {useCallback, useEffect, useState} from "react";
import {Email, Header} from "postal-mime";
import {getEmail} from "../net/queries.ts";

export interface EmailPanelProps {
    job: Job
}

export default function EmailPanel({job}: EmailPanelProps) {

    const [emailContent, setEmailContent] = useState<Email | null>(null);

    useEffect(() => {
        getEmail(job.id).then(setEmailContent)
    }, [job.id])

    const visualizeEmail = useCallback(() => emailContent
        ? <EmailVisualizer email={emailContent} />
        : "Retrieving email ...", [emailContent])

    const visualizeHeaders = useCallback(() => emailContent
        ? <div className={"email-headers"}>
            {emailContent.headers.map(({key, value}: Header, idx) =>
                <div key={idx}><strong>{key}</strong>: {value}</div>
            )}
        </div>
        : "Retrieving email ...", [emailContent])

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
                    render: () => Array.from(job.results.values())
                        .map((j, i) => <div key={i}>
                        <div><strong>name: </strong>{j.name}</div>
                            <div><strong>description: </strong>{j.description}</div>
                            <div><strong>verdict description: </strong>{j.verdictDescription}</div>
                            <div><strong>errors: </strong>{j.errors.join(", ")}</div>
                            <div>-----------------------------</div>
                        </div>)
                },
            ]}/>
        </div>
    </div>

}