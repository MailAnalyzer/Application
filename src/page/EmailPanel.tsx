import {Job} from "../data/Job.ts";
import "./email-panel.css"

export interface EmailPanelProps {
    job: Job
}

export default function EmailPanel({job}: EmailPanelProps) {


    return <div id={"email-panel"}>
        <div id="email-panel-header">
            <div id="email-panel-title">{job.subject}</div>
        </div>

        <div id="email-panel-content">
            <div id="analysis-results">
                {Array.from(job.results.values())
                    .map((j, i) => <div key={i}>
                        <div><strong>name: </strong>{j.name}</div>
                        <div><strong>description: </strong>{j.description}</div>
                        <div><strong>verdict description: </strong>{j.verdictDescription}</div>
                        <div><strong>errors: </strong>{j.errors.join(", ")}</div>
                        <div>-----------------------------</div>
                    </div>)}
            </div>
        </div>
    </div>

}