import {ReactNode} from "react";
import "./category.css"

export interface CategoryProps {
    title: string
    children: ReactNode
    color?: string
}

export default function Category({ title, children }: CategoryProps) {
    return (
        <div className={"category"}>
            <div className={"category-header"}>{title}</div>
            {children}
        </div>
    )
}