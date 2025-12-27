import * as React from "react"
import { Link } from "gatsby"

const TableOfContents = ({ data, slug }) => {
    if (!data) return null;

    return (
        <div className="toc-container">
            <ul>
                {data.map((item, i) => (
                    <li key={i}>
                        <Link to={item.url}>{item.title}</Link>
                        {item.items && <TableOfContents data={item.items} slug={slug} />}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export default TableOfContents