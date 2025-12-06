import React from 'react';
import * as ReactDOMClient from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Robustly resolve createRoot. 
// Some CDN bundles export it as a named export, others on the default object.
const createRoot = (ReactDOMClient as any).createRoot || (ReactDOMClient as any).default?.createRoot;

if (!createRoot) {
  throw new Error("Failed to find createRoot in react-dom/client");
}

const root = createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);