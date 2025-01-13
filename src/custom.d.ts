import React from 'react';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.png' {
  const content: any;
  export default content;
}

declare module '*.jpg' {
  const content: any;
  export default content;
}

// Add this to help with environment variables
interface ImportMetaEnv {
  VITE_ODDS_API_KEY: string;
  // Add other env variables here
} 