import Image from "next/image";
import styles from "./styles.module.scss";

export default function Header() {
  return (
    <header className={styles.header}>
      <div className={styles.content}>
        <div className={styles.identity}>
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
          <span className={styles.divider} aria-hidden="true" />
          <span className={styles.productName}>Relatórios de Obra</span>
        </div>
      </div>
    </header>
  );
}
