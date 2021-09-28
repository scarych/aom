import React from "react";
import clsx from "clsx";
import styles from "./HomepageFeatures.module.css";

import Translate, { translate } from "@docusaurus/Translate";

const FeatureList = [
  // /*
  {
    title: { id: "features.easyToUse.title", default: "Easy to use" },
    // Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    description: {
      id: "features.easyToUse.text",
      default: "aom provides clear logic and data links",
    },
  },
  {
    title: { id: "features.focusMatter.title", default: "Focus on What Matters" },
    // Svg: require("../../static/img/undraw_docusaurus_mountain.svg").default,
    description: {
      id: "features.focusMatter.text",
      default: "Write useful code only. No boilerplate needed",
    },
  },
  // */
];

function Feature({ Svg, title, description }) {
  return (
    <div className={clsx("col col--6")}>
      {/* 
      <div className="text--center">
        <Svg className={styles.featureSvg} alt={title} />
      </div>
      */}
      <div className="text--center padding-horiz--md">
        <h3>
          <Translate id={title.id}>{title.default}</Translate>
        </h3>
        <p>
          <Translate id={description.id}>{description.default}</Translate>
        </p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
