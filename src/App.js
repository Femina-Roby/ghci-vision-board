import React, { useState, useEffect } from 'react';
import { LogOut, Calendar, Target, Award } from 'lucide-react';
import { setPersistence, browserSessionPersistence } from "firebase/auth";
import PlanMyDayPage from './pages/PlanMyDay';
import PreConferencePage from './pages/PreConference';
import PostConferencePage from './pages/PostConference';

import { useAuth } from "./AuthContext";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { logOut } from "./firebase";

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

  useEffect(() => {
  logOut(); // clear any remembered session on first mount
}, []);


  useEffect(() => {
  if (!user) {
    // logged out → no page
    setCurrentPage(null);
  } else {
    // logged in → default to PlanMyDay
    setCurrentPage('plan');
  }
}, [user]);

  // Load Firestore data on login
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

// Save to Firestore whenever userData changes
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
      visionBoard: {},   // include visionBoard reset too
    });
  }
}, [user]);

  if (loading) return null;

  // If not logged in, show simplified login card
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-400 via-purple-400 to-blue-400 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <h1 className="text-3xl font-bold text-center mb-2 text-purple-600">GHC 2025</h1>
          <p className="text-center text-gray-600 mb-8">Create Your Conference Vision Board</p>

          <button
            onClick={() => window.signIn()}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition"
          >
            Login with Google
          </button>
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
              <h1 className="text-2xl font-bold text-purple-600">GHC 2025 Vision Board</h1>
              <p className="text-sm text-gray-600">{user.email}</p>
            </div>
            <button
              onClick={logOut}
              className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
            >
              <LogOut size={18} /> Logout
            </button>
          </div>

          <div className="flex gap-4 border-b border-gray-200">
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

            <button
              onClick={() => setCurrentPage('post')}
              className={`flex items-center gap-2 px-4 py-3 font-semibold transition border-b-4 ${
                currentPage === 'post'
                  ? 'border-teal-500 text-teal-600'
                  : 'border-transparent text-gray-600 hover:text-gray-800'
              }`}
            >
              <Award size={20} /> Post-Conference
            </button>
          </div>
        </div>
      </div>

      <div>
        {currentPage === 'plan' && <PlanMyDayPage userData={userData} onUpdateData={setUserData} />}
        {currentPage === 'pre' && <PreConferencePage userData={userData} onUpdateData={setUserData} />}
        {currentPage === 'post' && <PostConferencePage userData={userData} onUpdateData={setUserData} />}
      </div>
    </div>
  );
}
