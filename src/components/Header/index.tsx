/* eslint-disable @next/next/no-html-link-for-pages -- Static export uses document navigation to avoid App Router RSC route requests. */

import Image from "next/image";
import styles from "./styles.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles.identity}>
          <a aria-label="Ir para a página inicial" className={styles.logoLink} href="/">
            <div className={styles.logoWrap}>
              <Image
                alt="RIOW"
                className={styles.logo}
                fill
                priority
                sizes="160px"
                src="/images/logo-riow.webp"
              />
            </div>
          </a>
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.productName}>Relatórios de Obra</span>
        </div>
      </div>
    </header>
  );
}
