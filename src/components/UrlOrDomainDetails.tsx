import {DomainReport, UrlReport} from "../page/AnalysisVisualizer.tsx";
import Category from "./Category.tsx";
import {ReactNode, useMemo} from "react";
import "./url-domain-details.css"


export interface UrlDetailsProps {
    report: UrlReport | DomainReport;
    // added before the "Misc" category
    children?: ReactNode[] | ReactNode | null;
}

export default function UrlOrDomainDetails({report, children}: UrlDetailsProps) {
    const lastAnalysisDate = useMemo(() => new Date(report.attributes.last_analysis_date * 1000).toLocaleDateString(), [report.attributes.last_analysis_date])
    const stats = report.attributes.last_analysis_stats

    return <div className="analysis-details">
        <div className="analysis-details-head">
            <Category title={"Categories"}>
                {
                    Object.entries(report.attributes.categories).map(([engine, categories]) => (
                        <div key={engine}><strong>{engine}</strong>: {categories}</div>
                    ))
                }
            </Category>

            <Category title={"Tags"}>
                {
                    report.attributes.tags.map((tag) => <div key={tag}>{tag}</div>)
                }
            </Category>

            <Category title={"Virus Total Stats"}>
                <div className={"line"}>
                    <strong>Malicious: </strong>
                    <div className={"malicious"}>{stats.malicious}</div>
                </div>
                <div className={"line"}>
                    <strong>Suspicious: </strong>
                    <div className={"suspicious"}>{stats.suspicious}</div>
                </div>
                <div className={"line"}>
                    <strong>Harmless: </strong>
                    <div className={"harmless"}>{stats.harmless}</div>
                </div>
                <div className={"line"}>
                    <strong>Unknown/Unspecified: </strong>
                    <div className={"unknown"}>{stats.undetected + stats.timeout}</div>
                </div>
                <div className={"line"}>
                    <strong>Total: </strong>
                    <div className={"unknown"}>
                        {stats.undetected + stats.timeout + stats.harmless + stats.suspicious + stats.malicious}
                    </div>
                </div>
            </Category>
        </div>

        {children}

        <Category title={"Misc"}>
            <div><strong>Last Virus Total Analysis</strong>: {lastAnalysisDate}</div>
        </Category>
    </div>
}

