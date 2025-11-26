// import React, { useRef } from 'react';
// import { Download, Upload, X } from 'lucide-react';

// function PostConferencePage({ userData, onUpdateData }) {
//   const postVisionRef = useRef(null);

//   const handlePhotoUpload = (e) => {
//     const file = e.target.files?.[0];
//     if (file && userData.photoUrls.length < 5) {
//       const reader = new FileReader();
//       reader.onload = (event) => {
//         onUpdateData({
//           ...userData,
//           photoUrls: [...userData.photoUrls, event.target.result]
//         });
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const removePhoto = (index) => {
//     const updated = userData.photoUrls.filter((_, i) => i !== index);
//     onUpdateData({ ...userData, photoUrls: updated });
//   };

//   const exportAsImage = async (visionRef, fileName) => {
//     if (visionRef.current) {
//       try {
//         const script = document.createElement('script');
//         script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
//         script.onload = async () => {
//           const element = visionRef.current;
//           const canvas = await window.html2canvas(element, {
//             backgroundColor: '#ffffff',
//             scale: 1,
//             useCORS: true,
//             allowTaint: true,
//             logging: false,
//           });
//           const link = document.createElement('a');
//           link.href = canvas.toDataURL('image/png');
//           link.download = `${fileName}.png`;
//           link.click();
//         };
//         document.head.appendChild(script);
//       } catch (error) {
//         alert('Error generating image.');
//       }
//     }
//   };

//   return (
//     <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 pb-8">
//       <div className="max-w-4xl mx-auto px-4 py-8">
//         <div className="text-center mb-8">
//           <h1 className="text-4xl font-bold text-teal-500 mb-2">🎉 Post-Conference Reflection</h1>
//           <p className="text-gray-600">Share your learnings and memories</p>
//         </div>

//         <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">What did you learn?</h2>
//             <textarea
//               value={userData.learnings}
//               onChange={(e) => onUpdateData({ ...userData, learnings: e.target.value })}
//               placeholder="Share key takeaways, insights, and skills you gained..."
//               className="w-full p-4 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-teal-500 resize-none shadow-sm"
//               rows="6"
//             />
//           </div>

//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">Upload Photos (Max 5)</h2>
//             <label className="flex items-center justify-center gap-2 border-2 border-dashed border-teal-300 rounded-lg p-6 cursor-pointer hover:bg-teal-50 transition bg-teal-50 mb-4">
//               <Upload size={24} className="text-teal-500" />
//               <span className="text-sm text-gray-600 font-medium">Click to upload</span>
//               <input
//                 type="file"
//                 accept="image/*"
//                 onChange={handlePhotoUpload}
//                 className="hidden"
//                 disabled={userData.photoUrls.length >= 5}
//               />
//             </label>

//             <div className="grid grid-cols-3 gap-3">
//               {userData.photoUrls.map((url, idx) => (
//                 <div key={idx} className="relative group">
//                   <img src={url} alt={`Photo ${idx + 1}`} className="w-full h-24 object-cover rounded-lg shadow-md" />
//                   <button
//                     onClick={() => removePhoto(idx)}
//                     className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-lg"
//                   >
//                     <X size={16} />
//                   </button>
//                 </div>
//               ))}
//             </div>
//           </div>

//           <div className="mb-8">
//             <h2 className="text-2xl font-bold text-gray-800 mb-4">✨ Your Vision Board</h2>
//             <div
//               ref={postVisionRef}
//               className="bg-gradient-to-br from-teal-50 to-green-50 p-8 rounded-lg border-2 border-teal-200 shadow-lg"
//             >
//               <div className="text-center mb-6">
//                 <h3 className="text-3xl font-bold text-teal-600 mb-1">{userData.userName || 'Student'}</h3>
//                 <p className="text-gray-600 text-sm">GHC 2025 Learnings & Achievements</p>
//               </div>

//               {userData.learnings && (
//                 <div className="mb-6 p-4 bg-white rounded-lg border-l-4 border-blue-400 shadow-sm">
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Key Learnings</p>
//                   <p className="text-gray-700 font-medium leading-relaxed">{userData.learnings}</p>
//                 </div>
//               )}

//               {userData.photoUrls.length > 0 && (
//                 <div className="mb-6">
//                   <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Conference Highlights</p>
//                   <div className="grid grid-cols-2 gap-3">
//                     {userData.photoUrls.slice(0, 4).map((url, idx) => (
//                       <img
//                         key={idx}
//                         src={url}
//                         alt={`Highlight ${idx + 1}`}
//                         className="w-full h-20 object-cover rounded-lg shadow-md"
//                       />
//                     ))}
//                   </div>
//                 </div>
//               )}

//               <div className="text-center text-xs text-gray-400 mt-6 pt-4 border-t border-gray-200">
//                 Grace Hopper Conference 2025 ✨
//               </div>
//             </div>
//           </div>

//           <button
//             onClick={() => exportAsImage(postVisionRef, 'GHC2025_PostConference')}
//             className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-teal-500 to-green-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition transform hover:scale-105"
//           >
//             <Download size={20} /> Download Vision Board
//           </button>
//         </div>
//       </div>
//     </div>
//   );
// }

// export default PostConferencePage;
          