import {AnalysisResult, Job} from "../data/Job.ts";
import {useMemo, useState} from "react";

import "./analysis-visualizer.css"
import {Header} from "postal-mime";
import UrlOrDomainDetails from "../components/UrlOrDomainDetails.tsx";
import Category from "../components/Category.tsx";

export interface AnalysisVisualizerProps {
    job: Job
    emailHeaders: Header[] | null
}

/// see https://docs.virustotal.com/reference/domains-object for data structure definition
export interface DomainReport {
    attributes: DomainReportAttributes,
    id: string,
}

export interface DomainReportAttributes {
    categories: { [key: string]: string },
    creation_date: number,
    last_analysis_date: number,
    jarm: string,
    last_analysis_results: { [key: string]: DomainAnalysisResult },
    last_analysis_stats: AnalysisStats,
    last_dns_records: DNSRecord[]
    popularity_ranks: { [key: string]: PopularityRank },
    registrar: string,
    reputation: number,
    tags: string[],
    total_votes: CommunityReputationVotes,
    whois: string,
    whois_date: number,
}

export interface CommunityReputationVotes {
    harmless: number,
    malicious: number
}

export interface PopularityRank {
    rank: number,
    timestamp: number
}

export interface DomainAnalysisResult {
    category: string,
    engine_name: string,
    method: string,
    result: string
}

export interface AnalysisStats {
    harmless: number,
    malicious: number,
    suspicious: number,
    timeout: number,
    undetected: number
}

export interface DNSRecord {
    expire: number,
    flag: number,
    minimum: number,
    priority: number,
    refresh: number,
    rname: string,
    retry: number,
    serial: number,
    tag: string,
    ttl: number,
    type: string,
    value: string
}

export interface UrlReport {
    attributes: UrlReportAttributes
}

export interface UrlReportAttributes {
    url: string

    categories: { [key: string]: string },
    html_meta: { [key: string]: string[] },
    first_submission_date: number,
    last_analysis_date: number,
    last_analysis_results: { [key: string]: UrlAnalysisResult },
    last_analysis_stats: AnalysisStats,
    last_final_url: string,
    outgoing_links: string[],
    redirection_chain?: string[],
    reputation: number,
    tags: string[],
    targeted_brand: { [key: string]: string },
    times_submitted: number,
    title: string,
    total_votes: CommunityReputationVotes
    trackers: Tracker[],
}

export interface Tracker {
    id: string,
    timestamp: number,
    url: string
}


export interface UrlAnalysisResult {
    category: string,
    engine_name: string,
    method: string,
    result: string
}


export interface TriedAnalyses {
    urls: UrlReport[],
    domains: DomainReport[],
    other: AnalysisResult[],
    dkim: DKIMAnalysisResult | null,
    spf: SPFAnalysisResult | null,
    arc: DKIMAnalysisVerdict | null,
    dmarc: DMARCAnalysisResult | null,
}

type DKIMAnalysisVerdict = {
    type: "Pass" | "None"
} | {
    type: "Neutral" | "Fail" | "PermError" | "TempError",
    value: string
}


export interface DKIMAnalysisResult {
    [key: string]: DKIMAnalysisVerdict
}

export interface SPFAnalysisResult {
    domain: string,
    result: string,
}

export interface DMARCAnalysisResult {
    dkim: string,
    spf: string
}

function computeAnalyses(analyses: AnalysisResult[]): TriedAnalyses {
    const triedAnalyses: TriedAnalyses = {
        urls: [],
        domains: [],
        other: [],
        spf: null,
        arc: null,
        dkim: null,
        dmarc: null
    }

    for (const analyse of analyses) {
        switch (analyse.verdict.kind) {
            case "url":
                triedAnalyses.urls.push(JSON.parse(analyse.verdict.value).data)
                break;
            case "domain":
                triedAnalyses.domains.push(JSON.parse(analyse.verdict.value).data)
                break
            case "auth-dkim":
                triedAnalyses.dkim = analyse.verdict.value
                break
            case "auth-spf":
                triedAnalyses.spf = analyse.verdict.value
                break
            case "auth-arc-chain":
                triedAnalyses.arc = analyse.verdict.value
                break
            case "auth-dmarc":
                triedAnalyses.dmarc = analyse.verdict.value
                break
        }
    }

    return triedAnalyses
}

export default function AnalysisVisualizer({job}: AnalysisVisualizerProps) {

    const analyses = useMemo(() => computeAnalyses(Array.from(job.results.values())), [job.results])


    return <div className={"analysis-visualizer"}>

        <Category title="URLS">
            <UrlsSection urls={analyses.urls}/>
        </Category>

        <Category title="Domains">
            <DomainsSection domains={analyses.domains}/>
        </Category>

        <Category title="Email">
            <EmailSection dkim={analyses.dkim} spf={analyses.spf} arc={analyses.arc} dmarc={analyses.dmarc}/>
        </Category>

    </div>
}

interface EmailSectionProps {
    dkim: DKIMAnalysisResult | null,
    spf: SPFAnalysisResult | null,
    arc: DKIMAnalysisVerdict | null,
    dmarc: DMARCAnalysisResult | null,
}

function classNameOfResult(result: string) {
    switch (result.toLowerCase()) {
        case "pass":
            return "harmless"
        case "fail":
            return "suspicious"
        default:
            return ""
    }
}

function EmailSection({dkim, spf, arc, dmarc}: EmailSectionProps) {

    const dkimAnalysis = useMemo(() => {
        if (dkim === null) {
            return "analysing..."
        }
        const passes = Object.values(dkim).every(v => v.type === "Pass")
        return passes ? <div className={"harmless"}>pass</div> : <div className={"suspicious"}>fails</div>
    }, [dkim])

    const spfAnalysis = useMemo(() => {
        if (spf === null) {
            return "analysing..."
        }

        if (spf.result === "unknown") {
            return "unknown"
        }

        const result = <div className={classNameOfResult(spf.result)}>{spf.result}</div>
        return <>Domain : {spf.domain} Verdict : {result}</>
    }, [spf])

    const dmarcAnalysis = useMemo(() => {
        if (dmarc === null) {
            return "analysing..."
        }
        const dkimResult = <div className={classNameOfResult(dmarc.dkim)}>{dmarc.dkim}</div>
        const spfResult = <div className={classNameOfResult(dmarc.spf)}>{dmarc.spf}</div>

        return <>DKIM : {dkimResult}, SPF : {spfResult}</>
    }, [dmarc])

    const arcAnalysis = useMemo(() => {
        if (arc === null) {
            return "analysing..."
        }
        return <div className={classNameOfResult(arc.type)}>{arc.type.toLowerCase()}</div>
    }, [arc])

    return <div className={"analysis-email"}>
        <div className={"analysis-email-line"}>DKIM : {dkimAnalysis}</div>
        <div className={"analysis-email-line"}>SPF : {spfAnalysis}</div>
        <div className={"analysis-email-line"}>DMARC : {dmarcAnalysis}</div>
        <div className={"analysis-email-line"}>ARC Chain : {arcAnalysis}</div>
    </div>
}

interface UrlsSectionProps {
    urls: UrlReport[]
}


function UrlsSection({urls}: UrlsSectionProps) {

    const sortedUrls = useMemo(() => urls.toSorted((a, b) => a.attributes.reputation - b.attributes.reputation), [urls])
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

    return <div className={"analysis-urls"}>
        {sortedUrls.map(report => {
            const url = report.attributes.url
            return <UrlReportView
                key={url}
                url={report}
                isSelected={selectedUrl === url}
                onClick={() => setSelectedUrl(url)}
            />
        })}
    </div>
}

interface UrlReportViewProps {
    url: UrlReport
    isSelected: boolean
    onClick: () => void
}

function UrlReportView({url, isSelected, onClick}: UrlReportViewProps) {
    const attributes = url.attributes

    return (
        <div className="analysis-url">
            <div className={`analysis-url-preview ${isSelected ? "line-selected" : ""}`}
                 onClick={onClick}>
                <AnalysisStatsPreview
                    lastAnalysisStats={attributes.last_analysis_stats}
                    communityVotes={attributes.total_votes}
                    reputation={attributes.reputation}
                />
                <div className={"url-preview"}>{attributes.url}</div>
                <div></div>
            </div>
            {isSelected && <UrlOrDomainDetails
                report={url}
            >
                {(attributes.redirection_chain?.length ?? 0) > 1 &&
                    <Category title={"Redirection Chain"}>
                        {attributes.redirection_chain?.map((url, idx) => <div key={url}
                                                                              className="url-preview">{idx}: {url}</div>)}
                    </Category>
                }
                {(attributes.targeted_brand &&
                    <Category title={"Targeted Brand Detection"}>
                        <div>This category show the targeted brand detected by VT engines if any phishing is detected in
                            the URL
                        </div>
                        {Object.entries(attributes.targeted_brand).map(([engine, brand]) => (
                            <div key={engine}><strong>{engine}</strong>: {brand}</div>
                        ))}
                    </Category>
                )}
            </UrlOrDomainDetails>}
        </div>
    )
}

interface DomainsSectionProps {
    domains: DomainReport[]
}

function DomainsSection({domains}: DomainsSectionProps) {

    const sortedDomains = useMemo(() => domains.toSorted((a, b) => a.attributes.reputation - b.attributes.reputation), [domains])
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null)

    return <div className={"analysis-domains"}>
        {sortedDomains.map(domain => <DomainReportView
            key={domain.id}
            domain={domain}
            isSelected={domain.id === selectedDomain}
            onClick={() => setSelectedDomain(domain.id)}/>
        )}
    </div>
}

interface DomainReportViewProps {
    domain: DomainReport
    isSelected: boolean
    onClick: () => void
}

function DomainReportView({domain, isSelected, onClick}: DomainReportViewProps) {

    const attributes = domain.attributes
    const sortedDomainRecords = useMemo(() => attributes.last_dns_records.toSorted((a, b) => a.type.localeCompare(b.type)), [attributes.last_dns_records])

    return (
        <div key={domain.id} className="analysis-domain">
            <div
                className={`analysis-domain-preview ${isSelected ? "line-selected" : ""}`}
                onClick={onClick}>
                <AnalysisStatsPreview
                    lastAnalysisStats={attributes.last_analysis_stats}
                    communityVotes={attributes.total_votes}
                    reputation={attributes.reputation}
                />
                <div className={"domain-preview"}>{domain.id}</div>
                <div></div>
            </div>
            {isSelected && <UrlOrDomainDetails report={domain}>
                <Category title={"DNS"}>
                    {sortedDomainRecords.map((record, idx) => <DNSRecordView
                        key={idx}
                        record={record}
                    />)}
                </Category>
                <Category title={"Whois"}>
                    <div style={{display: "flex"}}><strong>Last VT whois
                        Update</strong>: {new Date(attributes.whois_date * 1000).toLocaleDateString()}</div>
                    <div className="data-text">
                        {attributes.whois.split("\n").map(line => <div key={line}>{line}</div>)}
                    </div>
                </Category>
            </UrlOrDomainDetails>}
        </div>
    )
}

interface DNSRecordViewProps {
    record: DNSRecord
}

function DNSRecordView({record}: DNSRecordViewProps) {
    return <div>
        {record.type} {record.value}
    </div>
}


interface AnalysisStatsPreviewProps {
    lastAnalysisStats: AnalysisStats
    reputation: number,
    communityVotes: CommunityReputationVotes
}

function AnalysisStatsPreview({lastAnalysisStats, communityVotes, reputation}: AnalysisStatsPreviewProps) {
    return <div className={"analysis-urls-stats"}>
        <div className={"analysis-stats-engines"}>
            <div className={"malicious"}>{lastAnalysisStats.malicious}</div>
            /
            <div className={"suspicious"}>{lastAnalysisStats.suspicious}</div>
            /
            <div className={"harmless"}>{lastAnalysisStats.harmless}</div>
            /(
            <div className={"unknown"}>{lastAnalysisStats.undetected + lastAnalysisStats.timeout}</div>
            )
        </div>
        |
        <div className={"analysis-votes"}>
            <div className="harmless">+{communityVotes.harmless}</div>
            /
            <div className="malicious">-{communityVotes.malicious}</div>
            <div className={"reputation " + (reputation >= 0 ? "harmless" : "malicious")}>({reputation})</div>
        </div>

    </div>
}