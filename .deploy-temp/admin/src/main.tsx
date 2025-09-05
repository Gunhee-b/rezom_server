import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { AdminAuthProvider } from './providers/AdminAuthProvider';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AdminAuthProvider>
      <RouterProvider router={router} />
    </AdminAuthProvider>
  </React.StrictMode>,
);// Cache bust Fri Aug 29 06:32:07 UTC 2025
