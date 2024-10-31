import {useMemo, useState} from "react";

import "./analysis-visualizer.css"
import UrlOrDomainDetails from "../components/UrlOrDomainDetails.tsx";
import Category from "../components/Category.tsx";
import {AnalysisResult, Job} from "../data/Job.ts";
import {Header} from "postal-mime";
import * as E from "fp-ts/Either";

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

interface Error {
    code: string,
    message: string
}

interface TaggedUrl {
    report: E.Either<Error, UrlReport>;
    tags: string[]
}

interface TaggedDomain {
    report: E.Either<Error, DomainReport>,
    tags: string[]
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

interface Entity {
    type: string,
    name: string,
    invest: EntityInvestigationResults | null
}

interface EntityInvestigationResults {
    is_known_on_internet: boolean,
}

export interface TriedAnalyses {
    urls: TaggedUrl[],
    domains: TaggedDomain[],
    other: AnalysisResult[],
    entities: Entity[],
    dkim: DKIMAnalysisResult | null,
    spf: SPFAnalysisResult | null,
    arc: DKIMAnalysisVerdict | null,
    dmarc: DMARCAnalysisResult | null,
    summary: string | null,
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
        entities: [],
        spf: null,
        arc: null,
        dkim: null,
        dmarc: null,
        summary: null,
    }

    for (const analysis of analyses) {
        const value = analysis.verdict.value
        switch (analysis.verdict.kind) {
            case "error":
                console.log("received erroned analysis : ", analysis)
                break;
            case "url":
                triedAnalyses.urls.push({
                    report: value.report.data ? E.right(value.report.data) : E.left(value.report.error),
                    tags: value.tags,
                })
                break;
            case "domain":
                triedAnalyses.domains.push({
                    report: value.report.data ? E.right(value.report.data) : E.left(value.report.error),
                    tags: value.tags,
                })
                break
            case "auth-dkim":
                triedAnalyses.dkim = value
                break
            case "auth-spf":
                triedAnalyses.spf = value
                break
            case "auth-arc-chain":
                triedAnalyses.arc = value
                break
            case "auth-dmarc":
                triedAnalyses.dmarc = value
                break
            case "nlp-summary":
                triedAnalyses.summary = value
                break
            case "entity":
                triedAnalyses.entities.push(value)
                break
            case "entity-investigation":
                const entity = triedAnalyses.entities.find(entity => entity.name === value.entity.name && entity.type === value.entity.type)
                if (entity === undefined) {
                    console.log("received investigation result for an unknown entity : ", value)
                    break
                }
                const {entity: e, ...results} = value
                entity.invest = results
                break
        }
    }

    return triedAnalyses
}

export default function AnalysisVisualizer({job, emailHeaders}: AnalysisVisualizerProps) {

    const analyses = useMemo(() => computeAnalyses(Array.from(job.results.values())), [job.results])

    return <div className={"analysis-visualizer"}>

        <Category title="Email Summary">
            {analyses.summary ?? "Waiting for LLM..."}
        </Category>

        <Category title="Related Entities">
            {analyses.entities.length > 0 ? analyses.entities.map(entity => (
                <EntityView entity={entity}
                            key={entity.name + entity.type}/>
            )) : "No entity found"}
        </Category>

        <Category title="URLS">
            <UrlsSection urls={analyses.urls}/>
        </Category>

        <Category title="Domains">
            <DomainsSection domains={analyses.domains}/>
        </Category>

        <div style={{display: "flex"}}>
            <Category title="Email">
                <EmailSection {...analyses}/>
            </Category>
            {emailHeaders && <EmailHeaders headers={emailHeaders}/>}
        </div>


    </div>
}

interface EntityViewProps {
    entity: Entity
}

function EntityView({entity}: EntityViewProps) {
    console.log(entity)
    return <div className={"entity-view"}>
        <div className="line"><strong>{entity.name}</strong> ({entity.type})</div>
        <div className={"entity-invest-details"}>
            {entity.invest
                ? Object.entries(entity.invest)
                    .map(([key, value]) => (
                        <div className={"line"} key={key}><strong>{key}</strong>: {value.toString()}</div>
                    ))
                : "Investigating..."
            }
        </div>

    </div>
}

interface EmailHeadersProps {
    headers: Header[]
}

function EmailHeaders({headers}: EmailHeadersProps) {

    const from = useMemo(() => headers.find(h => h.key === "from")?.value ?? "<unset>", [headers])
    const to = useMemo(() => headers.find(h => h.key === "to")?.value ?? "<unset>", [headers])
    const date = useMemo(() => headers.find(h => h.key === "date")?.value ?? "<unset>", [headers])
    const returnPath = useMemo(() => headers.find(h => h.key === "return-path")?.value ?? "<unset>", [headers])

    return (
        <Category title="Info">
            <div className={"line"}>
                <strong>From</strong> : {from}
            </div>
            <div className={"line"}>
                <strong>To</strong> : {to}
            </div>
            <div className={"line"}>
                <strong>Date</strong> : {date}
            </div>
            <div className={"line"}>
                <strong>Return-Path</strong> : {returnPath}
            </div>
            {
                returnPath !== from && <div className="suspicious">/!\ From and Return-Path are not equivalent</div>
            }
        </Category>
    )
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
    urls: TaggedUrl[]
}


function UrlsSection({urls}: UrlsSectionProps) {
    const sortedUrls = useMemo(() => urls.toSorted((a, b) => (
        E.isRight(a.report) && E.isRight(b.report)
            ? a.report.right.attributes.reputation - b.report.right.attributes.reputation
            : 0
    )), [urls])
    const [selectedUrl, setSelectedUrl] = useState<string | null>(null)

    return <div className={"analysis-urls"}>
        {sortedUrls.map((taggedUrl, idx) => {
            if (E.isLeft(taggedUrl.report)) {
                return <div key={idx}>ERROR!</div>
            }
            const url = taggedUrl.report.right.attributes.url
            return <UrlReportView
                key={url}
                url={taggedUrl}
                isSelected={selectedUrl === url}
                onClick={() => setSelectedUrl(url)}
            />
        })}
    </div>
}

interface UrlReportViewProps {
    url: TaggedUrl
    isSelected: boolean
    onClick: () => void
}

//TODO can be factorized with DomainReportView
function UrlReportView({url, isSelected, onClick}: UrlReportViewProps) {

    if (E.isLeft(url.report)) {
        return <div></div>
    }

    const attributes = url.report.right.attributes

    return (
        <div className="analysis-url">
            <div className={`analysis-url-preview ${isSelected ? "line-selected" : ""}`}
                 onClick={onClick}>
                <AnalysisStatsPreview
                    lastAnalysisStats={attributes.last_analysis_stats}
                    communityVotes={attributes.total_votes}
                    reputation={attributes.reputation}
                />
                <div className={"url-preview"}>{attributes.url} (<strong>{url.tags.join(", ")}</strong>)</div>
                <div></div>
            </div>
            {isSelected && <UrlOrDomainDetails
                report={url.report.right}
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
    domains: TaggedDomain[]
}

function DomainsSection({domains}: DomainsSectionProps) {

    const sortedDomains = useMemo(() => domains.toSorted((a, b) => (
        E.isRight(a.report) && E.isRight(b.report)
            ? a.report.right.attributes.reputation - b.report.right.attributes.reputation
            : 0
    )), [domains])
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null)


    return <div className={"analysis-domains"}>
        {sortedDomains.map((domain, idx) => {
                if (E.isLeft(domain.report)) {
                    return <div key={idx}>ERROR!</div>
                }
                const report = domain.report.right;
                return <DomainReportView
                    key={report.id}
                    report={domain.report.right}
                    tags={domain.tags}
                    isSelected={report.id === selectedDomain}
                    onClick={() => setSelectedDomain(report.id)}/>
            }
        )}
    </div>
}

interface DomainReportViewProps {
    report: DomainReport,
    tags: string[]
    isSelected: boolean
    onClick: () => void
}

function DomainReportView({report, isSelected, onClick, tags}: DomainReportViewProps) {

    const attributes = report.attributes
    const id = report.id
    const sortedDomainRecords = useMemo(() => attributes.last_dns_records.toSorted((a, b) => a.type.localeCompare(b.type)), [attributes.last_dns_records])

    return (
        <div key={id} className="analysis-domain">
            <div
                className={`analysis-domain-preview ${isSelected ? "line-selected" : ""}`}
                onClick={onClick}>
                <AnalysisStatsPreview
                    lastAnalysisStats={attributes.last_analysis_stats}
                    communityVotes={attributes.total_votes}
                    reputation={attributes.reputation}
                />
                <div className={"domain-preview"}>{id} (<strong>{tags.join(", ")}</strong>)</div>
                <div></div>
            </div>
            {isSelected && <UrlOrDomainDetails report={report}>
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