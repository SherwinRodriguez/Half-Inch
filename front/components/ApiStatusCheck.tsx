'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

export function ApiStatusCheck() {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api/test');
        if (response.ok) {
          const data = await response.json();
          setStatus('success');
          setMessage(data.message);
        } else {
          setStatus('error');
          setMessage('API endpoints not responding correctly');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Failed to connect to API endpoints');
      }
    };

    checkApiStatus();
  }, []);

  return (
    <div className="mb-6 p-4 rounded-lg border">
      <div className="flex items-center space-x-2">
        {status === 'loading' && (
          <>
            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-blue-700 dark:text-blue-300">Checking API status...</span>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle className="w-5 h-5 text-green-500" />
            <span className="text-green-700 dark:text-green-300">{message}</span>
          </>
        )}
        {status === 'error' && (
          <>
            <AlertCircle className="w-5 h-5 text-red-500" />
            <span className="text-red-700 dark:text-red-300">{message}</span>
          </>
        )}
      </div>
    </div>
  );
}
