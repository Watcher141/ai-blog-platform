import styles from "./Footer.module.css";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerInner}>
        {/* LEFT */}
        <div className={styles.left}>
          <div className={styles.logo}>
            Bits<span className={styles.dot}>.</span>Scraper
          </div>
          <p className={styles.tagline}>
            Turn ideas into structured blogs using AI-powered scraping.
          </p>
        </div>

        {/* CENTER */}
        <div className={styles.links}>
          <div>
            <h4>Product</h4>
            {/* <a href="#features">Features</a>
            <a href="#how">How it works</a> */}
            <a
              href="http://localhost:8000/docs"
              target="_blank"
              rel="noreferrer"
            >
              API Docs
            </a>
          </div>

          <div>
            <h4>Resources</h4>
            <a href="#">Blog</a>
            {/* <a href="#">Examples</a>
            <a href="#">Changelog</a> */}
          </div>

          <div>
            <h4>Support</h4>
            <a
              href="https://www.buymeacoffee.com/monojitdas"
              target="_blank"
              rel="noreferrer"
            >
              Support Dev ^-^
            </a>
            <a href="#">Contact</a>
          </div>
        </div>

        {/* RIGHT */}
        <div className={styles.right}>
          <span className={styles.stack}>
            Built with FastAPI + Groq + React
          </span>
          <span className={styles.copy}>
            © {new Date().getFullYear()} Bits.Scraper
          </span>
        </div>
      </div>
    </footer>
  );
}
