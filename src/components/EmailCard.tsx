import {Progress} from "antd";
import {WarningTwoTone} from "@ant-design/icons";

import "./email-card.css"
import {Job} from "../data/Job.ts";

export interface EmailCardProps {
    job: Job;
    onClick: () => void;
}

export default function EmailCard({job, onClick}: EmailCardProps) {

    const {subject, id, targetResultCount, error, results} = job

    const progress = error ? 100 : (results.size / targetResultCount) * 100;

    const status = error ? "exception" : progress === 100 ? "success" : "normal"

    return <div className={`email-card ${status}`} onClick={onClick}>
        <div className="email-card-subject">{subject}</div>
        <div className="email-card-id">#{id}</div>

        {error && <div className={"email-card-error"}>
            <WarningTwoTone twoToneColor={"#b8b001"} />
            <div>{error}</div>
        </div>}

        <Progress
            className={"email-card-progress"}
            percent={progress}
            status={status}
            showInfo={false}
        />
    </div>
}