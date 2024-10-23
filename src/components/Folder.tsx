import {ReactNode, useState} from "react";

import "./folder.css"

export interface FolderProps {
    tabs: Tab[]
}

export interface Tab {
    title: string,
    render: () => ReactNode
}

export default function Folder({tabs}: FolderProps) {

    const [selectedTab, setSelectedTab] = useState<number>(0)

    return <div className={"folder"}>
        <div className={"tabs"}>
            {tabs?.map((tab, idx) => <div
                key={idx}
                className={"tab " + (idx === selectedTab ? "tab-selected" : "")}
                onClick={() => setSelectedTab(idx)}
            >
                {tab.title}
            </div>)}
        </div>
        <div className={"selected-tab"}>
            {tabs[selectedTab].render()}
        </div>
    </div>

}