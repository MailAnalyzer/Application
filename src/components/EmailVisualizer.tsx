import {Email} from "postal-mime";
import "./email-visualizer.css"
import {useMemo} from "react";
import DOMPurify from 'dompurify';

export interface EmailVisualizerProps {
    email: Email
}

export default function EmailVisualizer({email}: EmailVisualizerProps) {

    const sanitizedHTML = useMemo(() => DOMPurify.sanitize(email.html || email.text || "<<<<No content.>>>>"), [email])

    return <div className={"email-visualizer"}>
        <div dangerouslySetInnerHTML={{__html: sanitizedHTML}}></div>
    </div>;
}