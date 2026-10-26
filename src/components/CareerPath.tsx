import { Fragment } from "react";
import type { CareerItem } from "../game/types";
import TeamBadge from "./TeamBadge";

export default function CareerPath({ items }: { items: CareerItem[] }) {
  return (
    <ol className="career">
      {items.map((item, i) => (
        <Fragment key={i}>
          {i > 0 && <li className="career-link" aria-hidden="true" />}
          <li className="career-step">
            <TeamBadge item={item} />
            <span className="career-name">{item.name}</span>
            {item.years && <span className="career-years">{item.years}</span>}
          </li>
        </Fragment>
      ))}
    </ol>
  );
}
