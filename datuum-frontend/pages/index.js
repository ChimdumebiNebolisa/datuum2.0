import { useUser } from '@auth0/nextjs-auth0/client';
import Head from 'next/head';
import Link from 'next/link';
import styles from '../styles/Home.module.css';

export default function Home() {
  const { user, isLoading } = useUser();

  return (
    <div className={styles.container}>
      <Head>
        <title>Datuum 2.0 - Modern Data Management</title>
        <meta name="description" content="Datuum 2.0 - Secure and scalable data management solution" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <span className={styles.brandName}>Datuum 2.0</span>
        </h1>

        <p className={styles.description}>
          Modern, secure, and scalable data management for your business
        </p>

        {!isLoading && (
          <div className={styles.authSection}>
            {user ? (
              <div className={styles.userInfo}>
                <p>Welcome back, {user.name}!</p>
                <div className={styles.buttonGroup}>
                  <Link href="/dashboard" className={styles.button}>
                    Go to Dashboard
                  </Link>
                  <a href="/api/auth/logout" className={styles.buttonSecondary}>
                    Logout
                  </a>
                </div>
              </div>
            ) : (
              <a href="/api/auth/login" className={styles.button}>
                Login / Sign Up
              </a>
            )}
          </div>
        )}

        <div className={styles.grid}>
          <div className={styles.card}>
            <h2>Secure Authentication</h2>
            <p>Powered by Auth0 for enterprise-grade security and user management.</p>
          </div>

          <div className={styles.card}>
            <h2>Real-time Data</h2>
            <p>Access and manage your data in real-time with our robust API.</p>
          </div>

          <div className={styles.card}>
            <h2>Scalable Architecture</h2>
            <p>Built on Next.js and Spring Boot for maximum performance and scalability.</p>
          </div>

          <div className={styles.card}>
            <h2>Modern Stack</h2>
            <p>Leveraging the latest technologies for a seamless user experience.</p>
          </div>
        </div>
      </main>

      <footer className={styles.footer}>
        <p>&copy; 2025 Datuum 2.0. All rights reserved.</p>
      </footer>
    </div>
  );
}

