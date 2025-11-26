import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, Target, Award } from 'lucide-react';
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import PlanMyDayPage from './pages/PlanMyDay';
import PreConferencePage from './pages/PreConference';

import { useAuth } from "./AuthContext";
import { db, auth } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { logOut } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";

export default function App() {
  const { user, loading } = useAuth();

  const [currentPage, setCurrentPage] = useState(null);
  const [userData, setUserData] = useState({
    selectedSessions: [],
    customActivities: [],
    preSelectedTracks: [],
    preConferenceGoals: '',
    learnings: '',
    photoUrls: [],
    userName: '',
  });

  // Auth form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [authError, setAuthError] = useState('');
  const [resetEmailSent, setResetEmailSent] = useState(false);

  useEffect(() => {
    logOut();
  }, []);

  useEffect(() => {
    if (!user) {
      setCurrentPage(null);
    } else {
      setCurrentPage('plan');
    }
  }, [user]);

  useEffect(() => {
    async function loadUserData() {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      try {
        const snap = await getDoc(ref);
        if (snap.exists()) {
          setUserData(snap.data());
        } else {
          await setDoc(ref, { /* defaults */ });
        }
      } catch (err) {
        console.error("Failed to load user data:", err);
        setUserData({ /* defaults */ });
      }
    }
    loadUserData();
  }, [user]);

  useEffect(() => {
    async function save() {
      if (!user) return;
      const ref = doc(db, "users", user.uid);
      await setDoc(ref, userData, { merge: true });
    }
    save();
  }, [userData, user]);

  useEffect(() => {
    if (!user) {
      setUserData({
        selectedSessions: [],
        customActivities: [],
        preSelectedTracks: [],
        preConferenceGoals: '',
        learnings: '',
        photoUrls: [],
        userName: '',
        visionBoard: {},
      });
    }
  }, [user]);

  // Email/Password Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
    } catch (err) {
      setAuthError(err.message);
    }
  };

  // Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      setAuthError('Please enter your email address');
      return;
    }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetEmailSent(true);
      setTimeout(() => setResetEmailSent(false), 3000);
    } catch (err) {
      setAuthError(err.message);
    }
  };

  if (loading) return null;

  // If not logged in, show login/signup form
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-purple-600">GHC 2025</h1>
          <p className="text-center text-gray-600 mb-8">Create Your Conference Vision Board</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
            
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />

            {authError && <p className="text-red-500 text-sm">{authError}</p>}
            {resetEmailSent && <p className="text-green-500 text-sm">Password reset email sent!</p>}

            <button
              type="submit"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
            >
              {isSignUp ? 'Sign Up' : 'Login'}
            </button>
          </form>

          <div className="mt-4 space-y-2">
            <button
              onClick={handleForgotPassword}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-semibold"
            >
              Forgot Password?
            </button>

            <button
              onClick={() => {
                setIsSignUp(!isSignUp);
                setAuthError('');
              }}
              className="w-full text-gray-600 hover:text-gray-700 text-sm"
            >
              {isSignUp ? 'Already have an account? Login' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main app after login
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="bg-white shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-2xl font-bold text-blue-950">GHC 2025 Vision Board</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={logOut}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="flex gap-4 border-b border-gray-200 justify-center">
            <button
              onClick={() => setCurrentPage('plan')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-4 ${
                currentPage === 'plan'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Calendar size={20} /> Plan My Day
            </button>

            <button 
              onClick={() => setCurrentPage('pre')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-4 ${
                currentPage === 'pre'
                  ? 'border-pink-500 text-pink-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Target size={20} /> Pre-Conference
            </button>
          </div>
        </div>
      </div>

      <div>
        {currentPage === 'plan' && <PlanMyDayPage userData={userData} onUpdateData={setUserData} />}
        {currentPage === 'pre' && <PreConferencePage userData={userData} onUpdateData={setUserData} />}
      </div>
    </div>
  );
}