/**
 * Screen Component
 *
 * Main content area that renders the active screen.
 * Seeded with the template; the project owns this file and edits it directly.
 */

import React from 'react';
import styles from './Screen.module.css';

export interface ScreenProps {
  children?: React.ReactNode;
}

export const Screen: React.FC<ScreenProps> = ({ children }) => {
  return (
    <main className={styles.screen}>
      {children}
    </main>
  );
};

Screen.displayName = 'Screen';
