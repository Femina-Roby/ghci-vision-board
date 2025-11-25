import React, { useState, useEffect, useRef } from 'react';
import html2canvas from "html2canvas";
import { Download, X, ChevronDown, ChevronUp, Calendar, Heart, Plus } from 'lucide-react';

// NOTE: You must ensure conferenceData.js exports the data with the new 'speakers' array format.
import { TRACKS, SESSIONS, HOURS, DAYS } from '../constants/conferenceData'; 

// --- COLOR PALETTE DEFINITIONS ---
const ACCENT_COLOR = 'text-fuchsia-600';
const BG_GRADIENT = 'from-pink-50 to-purple-50';


// ===================================
// 🛠️ UTILITY FUNCTIONS
// ===================================

/**
 * Shortens a session title for display in the small calendar cells.
 * @param {string} title - The full title.
 * @param {number} maxLength - The maximum length before truncation.
 * @returns {string} The shortened title with ellipsis if truncated.
 */
const shortenTitle = (title, maxLength = 18) => {
    if (!title) return '';
    if (title.length > maxLength) {
        return title.substring(0, maxLength - 3) + '...';
    }
    return title;
};

// ===================================
// 💻 MAIN COMPONENT
// ===================================

function PlanMyDayPage({ userData, onUpdateData }) {

  const [expandedTrack, setExpandedTrack] = useState(null);
    // --- Merge defaults with incoming userData ---
  const defaults = {
    // page-specific defaults
    selectedSessions: [],
    customActivities: [],
    preSelectedTracks: [],
    preConferenceGoals: '',
    learnings: '',
    photoUrls: [],
    userName: '',
    visionBoard: {
      name: '',
      role: '',
      personality: '',
      expectations: [],
      speakerToMeet: '',
      selectedSessions: [],
      favoriteTrack: '',
      travelMode: '',
      inspiringImage: null,
      backgroundImage: null,
      accentColor: '#FF6B9D',
      uploadedPhoto: null,
    },
  };

  const pageData = { ...defaults, ...(userData || {}) };

  const [selectedSessions, setSelectedSessions] = useState(userData.selectedSessions || []);
  const [customActivities, setCustomActivities] = useState(userData.customActivities || []);
  const [activityName, setActivityName] = useState('');
  const [activityDay, setActivityDay] = useState('Dec 1');
  const [activityStartTime, setActivityStartTime] = useState('7:00 AM');
  const [activityEndTime, setActivityEndTime] = useState('8:00 AM');
  const [activityColor, setActivityColor] = useState('#FF6B6B'); 

  const calendarRef = useRef(null);


  useEffect(() => {
  
    
    onUpdateData({ 
      ...pageData, 
      selectedSessions, 
      customActivities 
    });
  }, [selectedSessions, customActivities, onUpdateData, pageData]); // Added dependencies

  const toggleSession = (sessionId) => {
    const isSelected = selectedSessions.includes(sessionId);
    if (isSelected) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      const session = SESSIONS.find(s => s.id === sessionId);
      
      // Check for overlap (max 2 activities per slot)
      const overlappingCount = getActivitiesForDayAndTime(session.date, session.startTime).length;
      
      if (overlappingCount < 2) { 
        setSelectedSessions([...selectedSessions, sessionId]);
      } else {
        alert("You can only select two activities per time slot!");
      }
    }
  };

  const getTrackColor = (trackId) => {
    return TRACKS.find(t => t.id === trackId)?.color || '#A3A3A3'; 
  };

  const getActivitiesForDayAndTime = (day, time) => {
    const sessions = SESSIONS.filter(s => s.date === day && s.startTime === time && selectedSessions.includes(s.id))
      .map(s => ({ ...s, color: getTrackColor(s.trackId) })); 
    
    const activities = customActivities.filter(a => a.day === day && a.startTime === time);
    
    return [...sessions, ...activities];
  };

  const addCustomActivity = () => {
    if (activityName.trim()) {
      const existingCount = getActivitiesForDayAndTime(activityDay, activityStartTime).length;

      if (existingCount < 2) {
        const newActivity = {
          id: `custom_${Date.now()}`,
          name: activityName.trim(),
          day: activityDay,
          startTime: activityStartTime,
          endTime: activityEndTime,
          color: activityColor,
          isCustom: true
        };
        setCustomActivities([...customActivities, newActivity]);
        setActivityName('');
      } else {
        alert("This time slot already has two activities. Please choose another time.");
      }
    }
  };

  const removeCustomActivity = (id) => {
    setCustomActivities(customActivities.filter(a => a.id !== id));
  };

  const clearAllSessions = () => {
    setSelectedSessions([]);
    setCustomActivities([]);
  };

  // Function for exporting the calendar image (omitted for brevity, assume it works)

const exportAsImage = async (ref, fileName) => {
  if (!ref.current) return;

  try {
    // Take a screenshot of the DOM node
    const canvas = await html2canvas(ref.current, { useCORS: true });

    // Convert to PNG data URL
    const dataUrl = canvas.toDataURL("image/png");

    // Create a temporary link and trigger download
    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  } catch (err) {
    console.error("Export failed:", err);
  }
};
 


  return (
    <div className={`min-h-screen bg-gradient-to-br ${BG_GRADIENT} pb-12`}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        <div className="text-center mb-10">
          <h1 className={`text-5xl font-extrabold ${ACCENT_COLOR} mb-3 flex items-center justify-center gap-3`}>
            <Calendar size={36} className="text-fuchsia-400" /> Plan My Day!
          </h1>
          <p className="text-gray-600 font-medium">Build your perfect, personalized GHC schedule!</p>
          <p className="text-sm text-gray-500 mt-2">Note: Session titles are shortened in the schedule preview for layout clarity.</p>
        </div>

---

        {/* ----------------- Schedule Preview and Export ----------------- */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-10 border-4 border-fuchsia-100">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-3xl font-bold text-gray-800">🗓️ My Dream Schedule</h2>
            <button
              onClick={() => exportAsImage(calendarRef, 'My_GHC_Schedule')}
              className="px-4 py-2 bg-pink-400 text-white rounded-lg hover:bg-pink-500 transition font-semibold flex items-center gap-1"
            >
              <Download size={16}/> Export Schedule
            </button>
          </div>
          
          <div ref={calendarRef} className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="min-w-full">
              {/* Calendar Header */}
              <div className="flex gap-0 border-b border-gray-300">
                <div className="w-24 flex-shrink-0 bg-fuchsia-50"></div>
                {DAYS.map(day => (
                  <div key={day} className="flex-1 text-center font-extrabold text-lg text-fuchsia-700 py-3 bg-fuchsia-50 border-l border-gray-300">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Body with Fixed Height Cells (h-24) */}
              {HOURS.map(hour => (
                <div key={hour} className="flex gap-0 border-b border-gray-100 h-24"> {/* Fixed height: h-24 */}
                  {/* Time Column */}
                  <div className="w-24 flex-shrink-0 p-3 font-bold text-gray-500 text-sm bg-gray-50 flex items-start justify-end">{hour}</div>
                  
                  {/* Day Columns */}
                  {DAYS.map(day => {
                    const sessionsInSlot = getActivitiesForDayAndTime(day, hour);
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="flex-1 border-l border-gray-100 p-1 flex flex-col gap-0.5 justify-center overflow-hidden"
                      >
                        {sessionsInSlot.map(item => {
                          // Combine title and speaker names for tooltip
                          const speakerNames = item.isCustom 
                            ? '' 
                            : item.speakers.map(s => s.name).join(', ');
                          const fullTitle = `${item.name || item.title} - ${speakerNames}`;

                          return (
                            <div
                              key={item.id}
                              // Reduced size for fixed cell height
                              className="text-[10px] p-1.5 rounded-lg text-white font-semibold shadow-md"
                              style={{ 
                                backgroundColor: item.color,
                                color: item.isCustom ? '#333' : 'white', 
                                backgroundImage: item.isCustom ? `linear-gradient(135deg, ${item.color} 50%, #fff 150%)` : `linear-gradient(135deg, ${item.color} 50%, #333 150%)`
                              }}
                              title={fullTitle} // Full details visible on hover
                            >
                              {shortenTitle(item.name || item.title)} {/* Shortened title visible */}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <div className="text-center mt-6">
          </div>
        </div>

---

        {/* ----------------- Custom Activity Input ----------------- */}
        <div className="bg-white rounded-lg shadow p-4 mt-6">
  <h2 className="text-lg font-semibold mb-3">Add Custom Activity</h2>
  
  <input
    type="text"
    placeholder="Activity name"
    value={activityName}
    onChange={(e) => setActivityName(e.target.value)}
    className="w-full px-3 py-2 border rounded mb-2"
  />

  <div className="flex gap-2 mb-2">
    <select value={activityDay} onChange={(e) => setActivityDay(e.target.value)} className="border rounded px-2 py-1">
      {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
    </select>
    <select value={activityStartTime} onChange={(e) => setActivityStartTime(e.target.value)} className="border rounded px-2 py-1">
      {HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
    </select>
    <select value={activityEndTime} onChange={(e) => setActivityEndTime(e.target.value)} className="border rounded px-2 py-1">
      {HOURS.map(hour => <option key={hour} value={hour}>{hour}</option>)}
    </select>
  </div>

  <button
    onClick={addCustomActivity}
    className="bg-pink-500 text-white px-4 py-2 rounded hover:bg-pink-600"
  >
    Add Activity
  </button>
</div>

---

        {/* ----------------- Session Selection ----------------- */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-10 border-4 border-pink-100">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
              <Heart className={ACCENT_COLOR} size={28} /> Select Sessions
            </h2>
            <button
              onClick={clearAllSessions}
              className="px-4 py-2 bg-red-400 text-white rounded-lg hover:bg-red-500 transition font-semibold flex items-center gap-1"
            >
              <X size={16}/> Clear Schedule
            </button>
          </div>

          <div className="space-y-4">
            {TRACKS.map(track => {
              const trackSessions = SESSIONS.filter(s => s.trackId === track.id);
              const isExpanded = expandedTrack === track.id;

              return (
                <div key={track.id} className="border-2 border-gray-100 rounded-xl overflow-hidden shadow-md">
                  <button
                    onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                    className="w-full p-4 flex items-center justify-between font-bold text-lg text-white transition"
                    style={{ backgroundColor: track.color }}
                  >
                    <span>{track.name} ({trackSessions.length} Sessions)</span>
                    {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                  </button>

                  {isExpanded && (
                    <div className="p-4 bg-gray-50 space-y-4">
                      {trackSessions.map(session => (
                        <div key={session.id} className="flex items-start gap-4 p-4 bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition">
                          <input
                            type="checkbox"
                            checked={selectedSessions.includes(session.id)}
                            onChange={() => toggleSession(session.id)}
                            className="mt-1.5 w-6 h-6 rounded-md accent-fuchsia-500 cursor-pointer flex-shrink-0"
                          />
                          <div className="flex-1">
                            <p className="font-extrabold text-lg text-gray-900">{session.title}</p>
                            
                            {/* Display Day and Time */}
                            <p className="text-sm font-semibold text-fuchsia-600 mt-1">
                              🗓️ {session.date} | ⏰ {session.startTime} - {session.endTime}
                            </p>

                            {/* Handle Multiple Speakers */}
                            <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-0.5"> 
  {/* Flex container ensures everything stays together and wraps cleanly */}
  
  <span className="flex-shrink-0">Speaker(s):</span>
  
  {session.speakers.map((speaker, index) => (
    <React.Fragment key={index}>
      {/* Ensure the name itself is contained in a span */}
      <span className={`font-semibold ${ACCENT_COLOR}`}>
        {speaker.name}
      </span>
      {/* Ensure the comma/separator has a small gap if it wraps */}
      {index < session.speakers.length - 1 ? <span className="mr-0.5">,</span> : ''}
    </React.Fragment>
  ))}
</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PlanMyDayPage;