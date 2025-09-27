import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function DatabaseStatus() {
  const [status, setStatus] = useState<'checking' | 'connected' | 'disconnected' | 'error'>('checking');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    checkConnection();
    // Also check connection every 30 seconds to keep status updated
    const interval = setInterval(checkConnection, 30000);
    return () => clearInterval(interval);
  }, []);

  const checkConnection = async () => {
    try {
      console.log('Checking Supabase connection...');
      // Check if environment variables are set
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      console.log('Supabase URL:', supabaseUrl ? 'Set' : 'Not set');
      console.log('Supabase Key:', supabaseAnonKey ? 'Set' : 'Not set');

      if (!supabaseUrl || !supabaseAnonKey || 
          supabaseUrl === 'https://placeholder.supabase.co' || 
          supabaseAnonKey === 'placeholder-key') {
        console.log('Environment variables not configured properly');
        setStatus('disconnected');
        setError('Supabase environment variables not configured');
        return;
      }

      console.log('Testing Supabase connection...');
      // Test the connection by trying to get session
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.error('Auth session error:', error);
        setStatus('error');
        setError(error.message);
        return;
      }

      console.log('Testing database access...');
      // Try to query a table to test database access
      const { error: dbError } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);

      if (dbError) {
        console.error('Database access error:', dbError);
        setStatus('error');
        setError(`Database error: ${dbError.message}`);
        return;
      }

      console.log('Supabase connection successful!');
      setStatus('connected');
    } catch (err: any) {
      console.error('Connection check failed:', err);
      setStatus('error');
      setError(err.message || 'Unknown error');
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'connected':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'disconnected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Database className="w-5 h-5 text-gray-600 animate-pulse" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'connected':
        return 'Database Connected';
      case 'disconnected':
        return 'Database Not Connected';
      case 'error':
        return 'Database Connection Error';
      default:
        return 'Checking Connection...';
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'connected':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'disconnected':
        return 'bg-red-50 border-red-200 text-red-800';
      case 'error':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  return (
    <div className={`rounded-lg p-4 border ${getStatusColor()}`}>
      <div className="flex items-center gap-3">
        {getStatusIcon()}
        <div>
          <p className="font-medium">{getStatusText()}</p>
          {error && (
            <p className="text-sm mt-1 opacity-80">{error}</p>
          )}
          {status === 'disconnected' && (
            <p className="text-sm mt-1 opacity-80">
              Click "Connect to Supabase" in the top right to set up your database
            </p>
          )}
        </div>
      </div>
      
      <button
        onClick={checkConnection}
        className="mt-3 text-sm underline opacity-70 hover:opacity-100"
      >
        Recheck Connection
      </button>
    </div>
  );
}