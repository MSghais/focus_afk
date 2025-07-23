'use client';

import { useAuthStore } from '../../../store/auth';
import Link from 'next/link';

export default function LoginCheck() {
  const { jwtToken, userConnected } = useAuthStore();

  if (!jwtToken || !userConnected) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-4">
        <h3 className="font-bold text-red-800 mb-2">Authentication Required</h3>
        <p className="text-red-700 mb-3">
          You need to login to use the chat features. Please login with your wallet first.
        </p>
        <Link 
          href="/profile" 
          className="inline-block px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
        >
          Go to Login
        </Link>
      </div>
    );
  }

  return null;
} 