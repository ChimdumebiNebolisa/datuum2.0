import { withPageAuthRequired } from '@auth0/nextjs-auth0';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useState, useEffect } from 'react';
import Head from 'next/head';
import styles from '../styles/Dashboard.module.css';

function Dashboard() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch('/api/data');
      
      if (!response.ok) {
        throw new Error('Failed to fetch items');
      }
      
      const data = await response.json();
      setItems(data);
    } catch (err) {
      setError(err.message);
      console.error('Error fetching items:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.container}>
      <Head>
        <title>Dashboard - Datuum 2.0</title>
      </Head>

      <header className={styles.header}>
        <h1>Dashboard</h1>
        <div className={styles.userSection}>
          <span>Welcome, {user?.name}</span>
          <a href="/api/auth/logout" className={styles.logoutButton}>
            Logout
          </a>
        </div>
      </header>

      <main className={styles.main}>
        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2>Your Items</h2>
            <button onClick={fetchItems} className={styles.refreshButton}>
              Refresh
            </button>
          </div>

          {loading && <p className={styles.loadingText}>Loading items...</p>}
          
          {error && (
            <div className={styles.error}>
              <p>Error: {error}</p>
              <p className={styles.errorHint}>
                Make sure the backend server is running at http://localhost:8080
              </p>
            </div>
          )}

          {!loading && !error && items.length === 0 && (
            <p className={styles.emptyState}>No items found.</p>
          )}

          {!loading && !error && items.length > 0 && (
            <div className={styles.itemsGrid}>
              {items.map((item, index) => (
                <div key={index} className={styles.itemCard}>
                  <h3>{item.name}</h3>
                  <p>{item.description}</p>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2>User Information</h2>
          <div className={styles.userInfo}>
            <div className={styles.userInfoItem}>
              <strong>Name:</strong> {user?.name}
            </div>
            <div className={styles.userInfoItem}>
              <strong>Email:</strong> {user?.email}
            </div>
            <div className={styles.userInfoItem}>
              <strong>Email Verified:</strong> {user?.email_verified ? 'Yes' : 'No'}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default withPageAuthRequired(Dashboard);

