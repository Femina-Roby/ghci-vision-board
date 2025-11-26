import React, { useState, useEffect, useRef } from 'react';
import html2canvas from "html2canvas";
import { Download, X, ChevronDown, ChevronUp, Calendar, Heart, Plus } from 'lucide-react';
import { auth } from '../firebase';

import { TRACKS, SESSIONS, HOURS, DAYS } from '../constants/conferenceData'; 

// --- COLOR PALETTE DEFINITIONS ---
const ACCENT_COLOR = 'text-blue-950';
const BG_GRADIENT = 'from-pink-50 to-purple-50';

const shortenTitle = (title, maxLength = 42) => {
    if (!title) return '';
    if (title.length > maxLength) {
        return title.substring(0, maxLength - 3) + '...';
    }
    return title;
};

// ===================================
// EXPORT HELPER FUNCTIONS
// ===================================

const exportAsImage = async (ref, fileName) => {
  if (!ref.current) return;

  try {
    const canvas = await html2canvas(ref.current, { useCORS: true });
    const dataUrl = canvas.toDataURL("image/png");

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = fileName;
    link.click();
  } catch (err) {
    console.error("Export failed:", err);
  }
};

const convertToDateTime = (dateStr, timeStr) => {

  // timeStr format: "7:00 AM" or "2:30 PM"
  const currentYear = new Date().getFullYear();
  const dateTimeStr = `${dateStr} ${currentYear} ${timeStr}`;
  const date = new Date(dateTimeStr);
  return date;
};

const exportToGoogleCalendar = async (selectedSessions, customActivities) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      alert("Please login first");
      return;
    }

    const token = await user.getIdToken();

    // Build events array from selected sessions
    const sessionEvents = selectedSessions
      .map(sessionId => SESSIONS.find(s => s.id === sessionId))
      .filter(Boolean)
      .map(session => {
        const speakerNames = session.speakers.map(s => s.name).join(', ');
        return {
          summary: session.title,
          description: `Speakers: ${speakerNames}`,
          start: {
            dateTime: convertToDateTime(session.date, session.startTime).toISOString(),
          },
          end: {
            dateTime: convertToDateTime(session.date, session.endTime).toISOString(),
          },
        };
      });

    // Build events array from custom activities
    const customEvents = customActivities.map(activity => ({
      summary: activity.name,
      description: 'Custom Activity',
      start: {
        dateTime: convertToDateTime(activity.day, activity.startTime).toISOString(),
      },
      end: {
        dateTime: convertToDateTime(activity.day, activity.endTime).toISOString(),
      },
    }));

    const allEvents = [...sessionEvents, ...customEvents];

    if (allEvents.length === 0) {
      alert("No events to export! Please select some sessions or add custom activities.");
      return;
    }

    // Add each event to Google Calendar
    let successCount = 0;
    for (const event of allEvents) {
      const response = await fetch(
        "https://www.googleapis.com/calendar/v3/calendars/primary/events",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(event),
        }
      );

      if (response.ok) {
        successCount++;
      } else {
        console.error(`Failed to add event: ${event.summary}`);
      }
    }

    alert(`Successfully exported ${successCount} of ${allEvents.length} events to Google Calendar!`);
  } catch (err) {
    console.error("Calendar export failed:", err);
    alert("Failed to export to calendar. Make sure you're logged in with Google.");
  }
};

// ===================================
// MAIN COMPONENT
// ===================================

function PlanMyDayPage({ userData, onUpdateData }) {

  const [expandedTrack, setExpandedTrack] = useState(null);
  
  const defaults = {
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
  const [activityStartTime, setActivityStartTime] = useState('10:00 AM');
  const [activityEndTime, setActivityEndTime] = useState('11:00 AM');
  const [activityColor, setActivityColor] = useState('#ff6d00'); 

  const calendarRef = useRef(null);

  useEffect(() => {
    onUpdateData({ 
      ...pageData, 
      selectedSessions, 
      customActivities 
    });
  }, [selectedSessions, customActivities]);

  const toggleSession = (sessionId) => {
    const isSelected = selectedSessions.includes(sessionId);
    if (isSelected) {
      setSelectedSessions(selectedSessions.filter(id => id !== sessionId));
    } else {
      const session = SESSIONS.find(s => s.id === sessionId);
      
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
    const timeInAMPM = to24Number(time);
    const sessions = SESSIONS.filter(s => s.date === day && s.startTime === time && selectedSessions.includes(s.id))
      .map(s => ({ ...s, color: getTrackColor(s.trackId) })); 
    
    const activities = customActivities.filter(a => a.day === day && a.startTime === time);
    
    return [...sessions, ...activities];
  };

//   //Add this helper function
// const convertTo12Hour = (time24) => {
//   const [hours, minutes] = time24.split(':');
//   const hour = parseInt(hours);
//   const ampm = hour >= 12 ? 'PM' : 'AM';
//   const hour12 = hour % 12 || 12;
//   return `${hour12}:${minutes} ${ampm}`;
// };

//   const addCustomActivity = () => {
//     if (activityName.trim()) {
//          const [startHour] = activityStartTime.split(':');
//     const [endHour] = activityEndTime.split(':');
    
//     if (parseInt(startHour) < 10 || parseInt(startHour) > 12) {
//       alert('Start time must be between 10:00 AM and 12:00 PM');
//       return;
//     }
    
//     if (parseInt(endHour) < 10 || parseInt(endHour) > 12) {
//       alert('End time must be between 10:00 AM and 12:00 PM');
//       return;
//     }
      
//       const existingCount = getActivitiesForDayAndTime(activityDay, activityStartTime).length;

//       if (existingCount < 2) {
//         const newActivity = {
//           id: `custom_${Date.now()}`,
//           name: activityName.trim(),
//           day: activityDay,
//           startTime: activityStartTime,
//           endTime: activityEndTime,
//           color: activityColor,
//           isCustom: true
//         };
//         setCustomActivities([...customActivities, newActivity]);
//         setActivityName('');
//       } else {
//         alert("This time slot already has two activities. Please choose another time.");
//       }
//     }
//   };


  // Convert "10:00 AM" → 1000, "11:00 PM" → 2300, "12:00 AM" → 2400
  const to24Number = (timeStr) => {
    const [time, modifier] = timeStr.split(" ");
    let [hour, minutes] = time.split(":");

    hour = parseInt(hour);
    minutes = parseInt(minutes);

    // Handle AM/PM conversion
    if (modifier === "PM" && hour !== 12) hour += 12;
    if (modifier === "AM" && hour === 12) hour = 0;

    // Special case: 12:00 AM should be considered as 24:00 for range comparison
    if (modifier === "AM" && hour === 0 && minutes === 0) {
      return 2400;
    }

    return hour * 100 + minutes;
  };

  const startNum = to24Number(activityStartTime);
  const endNum = to24Number(activityEndTime);

  // Allowed window: 10:00 AM (1000) → 12:00 AM (2400)
  if (startNum < 1000 || startNum > 2400) {
    alert("Start time must be between 10:00 AM and 12:00 AM");
    return;
  }

  if (endNum < 1000 || endNum > 2400) {
    alert("End time must be between 10:00 AM and 12:00 AM");
    return;
  }

  const addCustomActivity = () => {

    
    if (!activityName.trim()) return;

    const startNum = to24Number(activityStartTime);
    const endNum = to24Number(activityEndTime);

    // Allowed window: 10:00 AM (1000) → 12:00 AM (2400)
    if (startNum < 1000 || startNum > 2400) {
      alert('Start time must be between 10:00 AM and 12:00 AM');
      return;
    }

    if (endNum < 1000 || endNum > 2400) {
      alert('End time must be between 10:00 AM and 12:00 AM');
      return;
    }

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
  };
  

  const removeCustomActivity = (id) => {
    setCustomActivities(customActivities.filter(a => a.id !== id))
  };

  const clearAllSessions = () => {
    setSelectedSessions([]);
    setCustomActivities([]);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${BG_GRADIENT} pb-12`}>
      <div className="max-w-7xl mx-auto px-4 py-10">
        
        <div className="text-center mb-10">
          <h1 className={`text-5xl font-bold ${ACCENT_COLOR} mb-3 flex items-center justify-center gap-3`}>
            <Calendar size={36} className="text-blue-950" /> Plan My Day!
          </h1>
          <p className="text-gray-600 font-medium">Build your own personalized GHC schedule!</p>
          <p className="text-sm text-gray-500 mt-2">Note: Session titles are shortened in the schedule preview for layout clarity.</p>
        </div>

        {/* My Dream Schedule with Export Buttons */}
        <div className="bg-white rounded-xl shadow-2xl p-8 mb-10 border-4 border-fuchsia-100">
          <div className="flex justify-between items-center mb-6 border-b pb-2">
            <h2 className="text-3xl font-bold text-gray-800">My GHCI Schedule</h2>
            
            <div className="flex gap-3">
              {/* Export as Image */}
              <button
                onClick={() => exportAsImage(calendarRef, 'My_GHC_Schedule')}
                className="px-4 py-2 bg-blue-400 text-white rounded-lg hover:bg-pink-500 transition font-semibold flex items-center gap-1"
              >
                <Download size={16}/> Export as Image
              </button>

              {/* Export to Google Calendar
              <button
                onClick={() => exportToGoogleCalendar(selectedSessions, customActivities)}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-semibold flex items-center gap-1"
              >
                Save to Calendar
              </button> */}
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div ref={calendarRef} className="overflow-x-auto rounded-lg border border-gray-200">
            <div className="min-w-full">
              {/* Calendar Header */}
              <div className="flex gap-0 border-b border-gray-300">
                <div className="w-24 flex-shrink-0 bg-fuchsia-50"></div>
                {DAYS.map(day => (
                  <div key={day} className="flex-1 text-center font-bold text-lg text-blue-900 py-3 bg-fuchsia-50 border-l border-gray-300">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Body */}
              {HOURS.map(hour => (
                <div key={hour} className="flex gap-0 border-b border-gray-100 h-24">
                  <div className="w-24 flex-shrink-0 p-3 font-bold text-gray-500 text-sm bg-gray-50 flex items-start justify-end">{hour}</div>
                  
                  {DAYS.map(day => {
                    const sessionsInSlot = getActivitiesForDayAndTime(day, hour);
                    return (
                      <div
                        key={`${day}-${hour}`}
                        className="flex-1 border-l border-gray-100 p-1 flex flex-col gap-0.5 justify-center overflow-hidden"
                      >
                        {sessionsInSlot.map(item => {
                          const speakerNames = item.isCustom 
                            ? '' 
                            : item.speakers.map(s => s.name).join(', ');
                          const fullTitle = `${item.name || item.title} - ${speakerNames}`;

                          return (
                            <div
                              key={item.id}
                              className="text-[10px] p-1.5 rounded-lg text-white font-semibold shadow-md"
                              style={{ 
                                backgroundColor: item.color,
                                color: item.isCustom ? '#FFFFF' : 'white', 
                                backgroundImage: item.isCustom ? `linear-gradient(135deg, ${item.color} 50%, #fff 150%)` : `linear-gradient(135deg, ${item.color} 50%, #333 150%)`
                              }}
                              title={fullTitle}
                            >
                              {shortenTitle(item.name || item.title)}
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
        </div>

        {/* Custom Activity Input */}
<div className="bg-white rounded-lg shadow p-6 mt-6 border-2 border-pink-100">
  <h2 className="text-2xl font-semibold mb-4 text-gray-800">➕ Add Custom Activity</h2>
  
  <div className="space-y-4">
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-2">Activity Name</label>
      <input
        type="text"
        placeholder="e.g., Lunch, Networking, Break"
        value={activityName}
        onChange={(e) => setActivityName(e.target.value)}
        className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
      />
    </div>

    <div className="grid grid-cols-3 gap-4">
  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Date</label>
    <select value={activityDay} onChange={(e) => setActivityDay(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
      {DAYS.map(day => <option key={day} value={day}>{day}</option>)}
    </select>
  </div>

  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">Start Time</label>
    <select value={activityStartTime} onChange={(e) => setActivityStartTime(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
      {['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'].map(time => <option key={time} value={time}>{time}</option>)}
    </select>
  </div>

  <div>
    <label className="block text-sm font-semibold text-gray-700 mb-2">End Time</label>
    <select value={activityEndTime} onChange={(e) => setActivityEndTime(e.target.value)} className="w-full border-2 border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:border-pink-500">
      {['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '7:00 PM', '8:00 PM', '9:00 PM', '10:00 PM', '11:00 PM'].map(time => <option key={time} value={time}>{time}</option>)}
    </select>

    
  </div>
</div>
{/* Custom Activities List */}
<div className='bg-white p-6 rounded-xl shadow mb-10 text-left'>

<h2 className='text-xl font-bold mb-4'>Your Custom Activities</h2>


{customActivities.length === 0 && <p className='text-gray-500'>No custom activities yet.</p>}


{customActivities.map(a => (
<div key={a.id} className='flex items-left justify-between p-3 border rounded mb-2'>
<div>
<p className='font-semibold'>{a.name}</p>
<p className='text-sm text-gray-600'>{a.day} | {a.startTime} - {a.endTime}</p>
</div>
<button onClick={() => removeCustomActivity(a.id)} className='text-red-500'>Remove</button>
</div>
))}
</div>

    <button
      onClick={addCustomActivity}
      className="w-full bg-gradient-to-r from-blue-400 to-pink-300 text-white px-4 py-3 rounded-lg hover:shadow-lg transition font-semibold"
    >
      Add Activity
    </button>
  </div>
</div>
        {/* Session Selection */}
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
                  <div className="w-full p-4 flex items-center justify-between font-semibold text-lg text-white" style={{ backgroundColor: track.color }}>
                    <button
                      onClick={() => setExpandedTrack(isExpanded ? null : track.id)}
                      className="flex-1 flex items-center justify-between transition"
                    >
                      <span>{track.name} ({trackSessions.length} Sessions)</span>
                      {isExpanded ? <ChevronUp size={22} /> : <ChevronDown size={22} />}
                    </button>
                    {isExpanded && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const allSessionIds = trackSessions.map(s => s.id);
                          const allSelected = allSessionIds.every(id => selectedSessions.includes(id));
                          
                          if (allSelected) {
                            setSelectedSessions(selectedSessions.filter(id => !allSessionIds.includes(id)));
                          } else {
                            setSelectedSessions([...new Set([...selectedSessions, ...allSessionIds])]);
                          }
                        }}
                        className="ml-4 px-3 py-1 bg-white text-sm font-semibold rounded hover:bg-gray-100 transition"
                        style={{ color: track.color }}
                      >
                        {trackSessions.every(s => selectedSessions.includes(s.id)) ? 'Deselect All' : 'Select All'}
                      </button>
                    )}
                  </div>

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
                            <p className="font-bold text-lg text-gray-900">{session.title}</p>
                            
                            <p className="text-sm font-semibold text-gray-600 mt-1">
                              {session.date} | {session.startTime} - {session.endTime}
                            </p>

                            <div className="text-sm text-gray-600 mt-1 flex flex-wrap gap-x-0.5"> 
                              <span className="flex-shrink-0">Speaker(s):</span>
                              
                              {session.speakers.map((speaker, index) => (
                                <React.Fragment key={index}>
                                  <span className={`font-semibold ${ACCENT_COLOR}`}>
                                    {speaker.name}
                                  </span>
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