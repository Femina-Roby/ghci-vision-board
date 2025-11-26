import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Download, ChevronDown, ChevronUp } from 'lucide-react';
import { TRACKS, SESSIONS, HOURS, DAYS } from '../constants/conferenceData';
import bgTrain from '../assets/Vision Board (Instagram Story)- Train Background.png';
import bgBus from '../assets/Vision Board (Instagram Story)- Bus Background.png';
import bgFlight from '../assets/Vision Board (Instagram Story)- Flight Background.png';
import image1 from '../assets/image1.jpg';
import image2 from '../assets/image2.jpg';
import image3 from '../assets/image3.png';
import image4 from '../assets/image4.jpg';
import image5 from '../assets/image5.jpg';
import { useAuth } from "../AuthContext";
import { saveVisionBoard, loadVisionBoard } from "../services/visionBoard";

const INSPIRATIONAL_IMAGES = [
    { id: 1, url: image1, label: 'Image 1' },
    { id: 2, url: image2, label: 'Image 2' },
    { id: 3, url: image3, label: 'Image 3' },
    { id: 4, url: image4, label: 'Image 4' },
    { id: 5, url: image5, label: 'Image 5' },
];



// Vision board layout (derived from Vision Board.json)
const VISION_BOARD_LAYOUT = {
    EXPECTATION_1: { x: 41, y: 370, w: 322, h: 174, size: 28.54, font: 'Poppins', case: 'lowercase', color: '#03164E', rotation: 0 },
    EXPECTATION_2: { x: 465, y: 396, w: 322, h: 174, size: 28.54, font: 'Poppins', case: 'lowercase', color: '#03164E', rotation: 0 },
    EXPECTATION_3: { x: 122, y: 712, w: 322, h: 174, size: 28.54, font: 'Poppins', case: 'lowercase', color: '#03164E', rotation: 0 },
    PERSONALITY: { x: 35.49, y: 90.28, w: 266, h: 147, size: 60, font: 'Gochi Hand', case: 'title', color: '#000000', rotation: 9.55 },
    TRACK: { x: 339, y: 127, w: 353, h: 118, size: 24, font: 'Poppins', case: 'sentence', color: '#5D0A01', rotation: 0 },
    NAME: { x: 1598, y: 57, w: 260, h: 38, size: 28.41, font: 'Poppins', case: 'title', color: '#000000', rotation: 0 },
    ROLE: { x: 1598, y: 92, w: 260, h: 38, size: 17.76, font: 'Poppins', case: 'sentence', color: '#000000', rotation: 0 },
    SESSION1: { x: 870.03, y: 547.31, w: 331.58, h: 117.83, size: 24, font: 'McLaren', case: 'normal', color: '#051C62', rotation: 15.98 },
    SESSION2: { x: 924.69, y: 701.23, w: 331.58, h: 117.83, size: 24, font: 'McLaren', case: 'normal', color: '#051C63', rotation: 15.98 },
    SPEAKER: { x: 1222, y: 869, w: 679, h: 159, size: 90, font: 'Seaweed Script', case: 'title', color: '#03164E', rotation: 0 },
    INSPIRING_IMAGE: { x: 819, y: 94, w: 241, h: 177.92, rotation: 5.6 },
    PHOTO: { x: 1440, y: 30, w: 130, h: 130, rotation: 0 }
};

// Helper: apply text case
const applyTextCase = (text, textCase) => {
    if (!text) return '';
    switch ((textCase || '').toLowerCase()) {
        case 'uppercase': return text.toUpperCase();
        case 'lowercase': return text.toLowerCase();
        case 'title': case 'title case': return text.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
        case 'sentence': case 'sentence case': return text.charAt(0).toUpperCase() + text.slice(1);
        default: return text;
    }
};

// Helper: wrap text into lines to fit width. Break long words if necessary.
const wrapTextLines = (ctx, text, maxWidth) => {
    if (!text) return [''];
    const words = text.split(' ');
    const lines = [];
    let current = '';

    for (let i = 0; i < words.length; i++) {
        let word = words[i];

        // If a single word is wider than the max width, break it into chunks
        if (ctx.measureText(word).width > maxWidth) {
            // flush current line first
            if (current) {
                lines.push(current);
                current = '';
            }

            // Break the long word into smaller parts that fit
            while (word.length > 0) {
                // find largest substring that fits
                let fit = 1;
                while (fit < word.length && ctx.measureText(word.slice(0, fit + 1)).width <= maxWidth) {
                    fit++;
                }
                // if nothing fits (maxWidth too small), force a single character to avoid infinite loop
                if (fit === 0) fit = 1;

                const part = word.slice(0, fit);
                // append hyphen if there's more to come
                const remainder = word.slice(fit);
                lines.push(remainder ? part + '-' : part);
                word = remainder;
            }
            continue;
        }

        const test = current ? current + ' ' + word : word;
        const w = ctx.measureText(test).width;
        if (w <= maxWidth || !current) {
            current = test;
        } else {
            lines.push(current);
            current = word;
        }
    }

    if (current) lines.push(current);
    return lines;
};

// Ensure required webfonts are loaded (inject Google Fonts link and wait for document.fonts)
const loadRequiredFonts = async () => {
    if (typeof document === 'undefined') return;
    const id = 'ghc-vision-fonts';
    if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id;
        link.rel = 'stylesheet';
        link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;700&family=Gochi+Hand&family=McLaren&family=Seaweed+Script&display=swap';
        document.head.appendChild(link);
    }

    // Wait for FontFaceSet to report fonts loaded (best-effort)
    if (document.fonts && document.fonts.load) {
        try {
            const checks = [
                document.fonts.load('10px Poppins'),
                document.fonts.load('10px Gochi Hand'),
                document.fonts.load('10px McLaren'),
                document.fonts.load('10px "Seaweed Script"'),
            ];
            await Promise.all(checks);
        } catch (e) {
            // ignore and continue — fonts may still render with fallback
            console.warn('Font loading failed or timed out', e);
        }
    }
};

function PreConferencePage({ userData, onUpdateData }) 
{
    const { user, loading } = useAuth();
    

  const canvasRef = useRef(null);
  const [expandedTrack, setExpandedTrack] = useState(null);
  const [showVisionBoard, setShowVisionBoard] = useState(false);
  const [isLoading, setIsLoading] = useState(false); 

  // Photo upload / crop state
  const [photoModalOpen, setPhotoModalOpen] = useState(false);
  const [photoTempSrc, setPhotoTempSrc] = useState(null);
  const [photoImgSize, setPhotoImgSize] = useState(null);
  const [photoScale, setPhotoScale] = useState(1);
  const [photoOffset, setPhotoOffset] = useState({ x: 0, y: 0 });
  const photoDragRef = useRef({ dragging: false, lastX: 0, lastY: 0 });
  const photoInputRef = useRef(null);


  const generateVisionBoardCanvas = useCallback((data) => 
  {
        // `data` is expected to be the current visionData snapshot to render.
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = 1920;
        canvas.height = 1080;

        const travelMode = data?.travelMode;

        // Select template based on travelMode and load template image
        const img = new Image();
        img.crossOrigin = 'anonymous';
        let templateSrc = bgTrain; // default
        if (travelMode === 'bus') templateSrc = bgBus;
        if (travelMode === 'flight') templateSrc = bgFlight;
        img.src = templateSrc;
        img.onerror = (err) => console.error('Failed to load background image for canvas', err);
        img.onload = async () => {
            await loadRequiredFonts();

            // Draw accent frame outside the image by filling the canvas with the accent color
            // and then drawing the template image inset so the accent shows as a border.
            try {
                const accent = (data && data.accentColor) ? data.accentColor : '#FF6B9D';
                const frameThickness = Math.max(6, Math.round(canvas.width * 0.0125)); // ~24px on 1920 width

                // Fill whole canvas with accent color
                ctx.save();
                ctx.fillStyle = accent;
                ctx.fillRect(0, 0, canvas.width, canvas.height);

                // Draw the template image inset so the accent color forms an outer frame
                const innerX = frameThickness;
                const innerY = frameThickness;
                const innerW = canvas.width - innerX * 2;
                const innerH = canvas.height - innerY * 2;
                ctx.drawImage(img, innerX, innerY, innerW, innerH);
                ctx.restore();

                // Translate the coordinate space so the rest of the drawing can reuse
                // the original layout coordinates (which were designed for a full-size image).
                ctx.save();
                ctx.translate(innerX, innerY);
                // Draw uploaded user photo (circular) if present
                if (data?.uploadedPhoto) {
                    try {
                        const pImg = new Image();
                        pImg.crossOrigin = 'anonymous';
                        pImg.src = data.uploadedPhoto;
                        await new Promise(resolve => { pImg.onload = resolve; pImg.onerror = resolve; });
                        const pBox = VISION_BOARD_LAYOUT.PHOTO;
                        const cx = pBox.x + pBox.w / 2;
                        const cy = pBox.y + pBox.h / 2;
                        const radius = Math.min(pBox.w, pBox.h) / 2;
                        ctx.save();
                        ctx.beginPath();
                        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
                        ctx.closePath();
                        ctx.clip();
                        try { ctx.drawImage(pImg, pBox.x, pBox.y, pBox.w, pBox.h); } catch (e) {}
                        ctx.restore();
                    } catch (e) {
                        console.warn('Failed to draw uploaded photo', e);
                    }
                }
            } catch (e) {
                // don't block rendering on frame errors
                console.warn('Failed to draw accent frame', e);
            }

            // Attempt to load inspiring image if selected
            let inspiringImg = null;
            if (data?.inspiringImage) {
                const insp = INSPIRATIONAL_IMAGES.find(i => i.id === data.inspiringImage);
                if (insp) {
                    inspiringImg = new Image();
                    inspiringImg.crossOrigin = 'anonymous';
                    inspiringImg.src = insp.url;
                    await new Promise(resolve => { inspiringImg.onload = resolve; inspiringImg.onerror = resolve; });
                }
            }

            // Prepare draw helper
            const drawBoxText = (box, text, opts = {}) => {
                if (!text) return;
                const { x, y, w, h, size, font, case: textCase, color, rotation } = box;
                const finalText = applyTextCase(text, textCase || opts.case);
                ctx.save();
                // center point
                const cx = x + w / 2;
                const cy = y + h / 2;
                ctx.translate(cx, cy);
                // Negate angle to match design's rotation direction
                ctx.rotate(-(rotation || 0) * Math.PI / 180);
                ctx.fillStyle = opts.color || color || '#000000';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                let fontSize = opts.size || size || 16;
                const fontWeight = opts.fontWeight || 'normal';
                ctx.font = `${fontWeight} ${fontSize}px ${font || 'Arial'}`;

                // If singleLine requested, try to shrink font until it fits on one line.
                // If shrinking reaches a minimum size and still doesn't fit, fall back
                // to a wrapped multi-line layout (max 2 lines) so it doesn't overflow the frame.
                if (opts.singleLine) {
                    let measured = ctx.measureText(finalText).width;
                    const maxW = w - 10;
                    const minFontSize = opts.minFontSize || 8;
                    while (measured > maxW && fontSize > minFontSize) {
                        fontSize -= 1;
                        ctx.font = `${fontWeight} ${fontSize}px ${font || 'Arial'}`;
                        measured = ctx.measureText(finalText).width;
                    }

                    // If it still doesn't fit after shrinking, fallback to up to 2 lines
                    if (measured > maxW) {
                        // Use the final (small) font size for wrapped lines
                        ctx.font = `${fontWeight} ${fontSize}px ${font || 'Arial'}`;
                        const lines = wrapTextLines(ctx, finalText, maxW);
                        // Limit to maximum 2 lines; join remainder with ellipsis
                        let drawLines = lines.slice(0, 2);
                        if (lines.length > 2) {
                            const last = drawLines[1];
                            // ensure ellipsis fits
                            let ell = '…';
                            while (ctx.measureText(last + ell).width > maxW && last.length > 0) {
                                drawLines[1] = drawLines[1].slice(0, -1);
                            }
                            drawLines[1] = drawLines[1].trim() + ell;
                        }

                        const lineHeight = fontSize * (opts.lineHeightMultiplier || 1.05);
                        const totalHeight = drawLines.length * lineHeight;
                        let startY = -totalHeight / 2 + lineHeight / 2;
                        drawLines.forEach((line, i) => {
                            const yPos = startY + i * lineHeight;
                            if (opts.shadow) {
                                ctx.shadowColor = opts.shadowColor || '#000000';
                                ctx.shadowBlur = opts.shadowBlur ?? Math.max(2, fontSize * 0.15);
                                ctx.shadowOffsetX = opts.shadowOffsetX ?? 2;
                                ctx.shadowOffsetY = opts.shadowOffsetY ?? 2;
                            }
                            try { ctx.fillText(line, 0, yPos); } catch (e) {}
                            if (opts.shadow) {
                                ctx.shadowColor = 'transparent';
                                ctx.shadowBlur = 0;
                                ctx.shadowOffsetX = 0;
                                ctx.shadowOffsetY = 0;
                            }
                        });
                        ctx.restore();
                        return;
                    }

                    // If it fits after shrinking, draw single line as before
                    if (opts.shadow) {
                        ctx.shadowColor = opts.shadowColor || '#000000';
                        ctx.shadowBlur = opts.shadowBlur ?? Math.max(2, fontSize * 0.15);
                        ctx.shadowOffsetX = opts.shadowOffsetX ?? 2;
                        ctx.shadowOffsetY = opts.shadowOffsetY ?? 2;
                    }
                    try { ctx.fillText(finalText, 0, 0); } catch (e) {}
                    ctx.restore();
                    return;
                }

                const lines = wrapTextLines(ctx, finalText, w - 10);
                const lineHeight = (fontSize * (opts.lineHeightMultiplier || 1.1)) || 20;
                const totalHeight = lines.length * lineHeight;
                let startY = -totalHeight / 2 + lineHeight / 2;
                lines.forEach((line, i) => {
                    const yPos = startY + i * lineHeight;
                    if (opts.shadow) {
                        ctx.shadowColor = opts.shadowColor || '#000000';
                        ctx.shadowBlur = opts.shadowBlur ?? Math.max(2, fontSize * 0.15);
                        ctx.shadowOffsetX = opts.shadowOffsetX ?? 2;
                        ctx.shadowOffsetY = opts.shadowOffsetY ?? 2;
                    }
                    try { ctx.fillText(line, 0, yPos); } catch (e) {}
                    if (opts.shadow) {
                        ctx.shadowColor = 'transparent';
                        ctx.shadowBlur = 0;
                        ctx.shadowOffsetX = 0;
                        ctx.shadowOffsetY = 0;
                    }
                });
                ctx.restore();
            };

            // Draw expectations (make bold and a bit larger)
            drawBoxText(VISION_BOARD_LAYOUT.EXPECTATION_1, data?.expectations?.[0] || '', { size: VISION_BOARD_LAYOUT.EXPECTATION_1.size + 6, fontWeight: '700' });
            drawBoxText(VISION_BOARD_LAYOUT.EXPECTATION_2, data?.expectations?.[1] || '', { size: VISION_BOARD_LAYOUT.EXPECTATION_2.size + 6, fontWeight: '700' });
            drawBoxText(VISION_BOARD_LAYOUT.EXPECTATION_3, data?.expectations?.[2] || '', { size: VISION_BOARD_LAYOUT.EXPECTATION_3.size + 6, fontWeight: '700' });

            // Draw personality with white text and a pure-black shadow using design offsets
            drawBoxText(VISION_BOARD_LAYOUT.PERSONALITY, data?.personality || '', {
                color: '#FFFFFF',
                shadow: true,
                shadowColor: '#000000',
                shadowOffsetX: -5,
                shadowOffsetY: -4,
                shadowBlur: 0,
                lineHeightMultiplier: 0.9,
            });

            // Draw track (favorite track name) — make bold and increase line-height
            const favTrackName = TRACKS.find(t => String(t.id) === String(data?.favoriteTrack))?.name || '';
            if (favTrackName) drawBoxText(VISION_BOARD_LAYOUT.TRACK, favTrackName, { fontWeight: '700', size: VISION_BOARD_LAYOUT.TRACK.size + 6, lineHeightMultiplier: 1.3 });

            // Draw name and role (name bold, single-line)
            drawBoxText(VISION_BOARD_LAYOUT.NAME, data?.name || '', { fontWeight: '700', singleLine: true , textAlign: 'left'});
            drawBoxText(VISION_BOARD_LAYOUT.ROLE, data?.role || '', { textAlign: 'left' });

            // Draw sessions (first two selected)
            const s1Id = data?.selectedSessions?.[0];
            const s2Id = data?.selectedSessions?.[1];
            const s1 = SESSIONS.find(s => s.id === s1Id);
            const s2 = SESSIONS.find(s => s.id === s2Id);
            if (s1) drawBoxText(VISION_BOARD_LAYOUT.SESSION1, s1.title || '');
            if (s2) drawBoxText(VISION_BOARD_LAYOUT.SESSION2, s2.title || '');

            // Draw speaker name
            if (data?.speakerToMeet) {
                drawBoxText(VISION_BOARD_LAYOUT.SPEAKER, data.speakerToMeet);
            }

            // Draw inspiring image if available — scale and center-crop to fill the box
            if (inspiringImg && inspiringImg.complete) {
                const box = VISION_BOARD_LAYOUT.INSPIRING_IMAGE;
                ctx.save();
                // rotate around center
                const cx = box.x + box.w / 2;
                const cy = box.y + box.h / 2;
                ctx.translate(cx, cy);
                // Negate rotation to match design's direction
                ctx.rotate(-(box.rotation || 0) * Math.PI / 180);

                // Cover the box by scaling the image up and cropping excess (center-crop)
                const imgW = inspiringImg.naturalWidth || inspiringImg.width;
                const imgH = inspiringImg.naturalHeight || inspiringImg.height;
                if (imgW > 0 && imgH > 0) {
                    const scale = Math.max(box.w / imgW, box.h / imgH);
                    const srcW = box.w / scale;
                    const srcH = box.h / scale;
                    const sx = Math.max(0, (imgW - srcW) / 2);
                    const sy = Math.max(0, (imgH - srcH) / 2);
                    try {
                        ctx.drawImage(inspiringImg, sx, sy, srcW, srcH, -box.w / 2, -box.h / 2, box.w, box.h);
                    } catch (e) {
                        // fallback: draw stretched to fit box
                        ctx.drawImage(inspiringImg, -box.w / 2, -box.h / 2, box.w, box.h);
                    }
                } else {
                    // if dimensions unknown, just draw to fit box
                    ctx.drawImage(inspiringImg, -box.w / 2, -box.h / 2, box.w, box.h);
                }

                ctx.restore();
            }
            // restore translation that was applied to offset drawing inside the frame
            try { ctx.restore(); } catch (e) { /* ignore */ }
        };
    }, []);
    useEffect(() => 
        {
        if (showVisionBoard) {
            // Render once when preview is first shown. Subsequent input changes won't auto-render.
            generateVisionBoardCanvas(visionData);
        }
    }, [showVisionBoard]);
    useEffect(() => {
    if (user) {
      loadVisionBoard().then(board => {
      const defaults = {
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
      };
      onUpdateData({ visionBoard: { ...defaults, ...(board || {}) } });

      });
    }

  }, [user, onUpdateData]);

  const updateVisionData = (key, value) => {
    const updated = { ...userData.visionBoard, [key]: value };
    onUpdateData({ ...userData, visionBoard: updated });
    saveVisionBoard(updated); // persist to Firestore
  };
  const defaults = {
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
};

const visionData = { ...defaults, ...(userData?.visionBoard || {}) };

//check if all fields are filled
const validateVisionData = () => {
  const errors = [];

  if (!visionData.name || visionData.name.trim() === '') {
    errors.push('Please enter your name');
  }
  if (!visionData.role || visionData.role.trim() === '') {
    errors.push('Please enter your role');
  }
  if (!visionData.personality || visionData.personality.trim() === '') {
    errors.push('Please complete: "Hey I\'m a..."');
  }
  if (visionData.expectations.length !== 3) {
    errors.push('Please add exactly 3 expectations');
  }
  if (!visionData.speakerToMeet || visionData.speakerToMeet.trim() === '') {
    errors.push('Please select a speaker to meet');
  }
  if (visionData.selectedSessions.length !== 2) {
    errors.push('Please select exactly 2 sessions');
  }
  if (!visionData.favoriteTrack || visionData.favoriteTrack === '') {
    errors.push('Please select your favorite track');
  }
  if (!visionData.travelMode || visionData.travelMode === '') {
    errors.push('Please select your travel mode');
  }
  if (!visionData.inspiringImage || visionData.inspiringImage === null) {
    errors.push('Please select an inspiring image');
  }
  if (!visionData.uploadedPhoto) {
    errors.push('Please upload your photo');
  }

  return errors;
};

useEffect(() => {
  if (!user) {
    // Reset vision board to defaults on logout
    onUpdateData({ visionBoard: { ...defaults } });
  }
}, [user, onUpdateData]);



    if (loading) return null;

  if (!user) {
    return <p style={{ padding: 20 }}>Please log in to continue.</p>;
  }
    
      
    const addExpectation = (e) => {
        if (e.key === 'Enter' && e.target.value.trim() && visionData.expectations.length < 3) {
            const newExpectations = [...visionData.expectations, e.target.value.trim()];
            updateVisionData('expectations', newExpectations);
            e.target.value = '';
        }
    };

    const removeExpectation = (index) => {
        const updated = visionData.expectations.filter((_, i) => i !== index);
        updateVisionData('expectations', updated);
    };

    // New function to handle session selection
    const toggleSession = (sessionId) => {
        let updated = visionData.selectedSessions;
        if (updated.includes(sessionId)) {
            updated = updated.filter(id => id !== sessionId);
        } else if (updated.length < 2) {
            updated = [...updated, sessionId];
        }
        updateVisionData('selectedSessions', updated);
    };

    // New function to get unique speaker names
    const getSpeakerNames = () => {
        // Conference data uses a `speakers` array on each session with objects like { name: '...' }
        // Extract all speaker names, flatten, filter falsy/placeholder values, dedupe and sort.
        const names = SESSIONS
            .map(session => session.speakers || [])
            .flat()
            .map(sp => sp?.name)
            .filter(n => n && n.trim() && n.trim() !== '...');

        return Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
    };

    // --- Photo upload & crop handlers ---
    const handlePhotoFile = (e) => {
        console.log('handlePhotoFile called', e);
        const file = e?.target?.files?.[0];
        if (!file) return;
        console.log('selected file', file.name, file.type, file.size);
        const url = URL.createObjectURL(file);
        setPhotoTempSrc(url);
        const img = new Image();
        img.onload = () => {
            setPhotoImgSize({ width: img.width, height: img.height });
            const vp = 240; // viewport size in px for crop UI
            const scale = Math.max(vp / img.width, vp / img.height);
            setPhotoScale(scale);
            const dispW = img.width * scale;
            const dispH = img.height * scale;
            setPhotoOffset({ x: (vp - dispW) / 2, y: (vp - dispH) / 2 });
            setPhotoModalOpen(true);
        };
        img.src = url;
    };

    const openPhotoDialog = () => {
        console.log('openPhotoDialog');
        if (photoInputRef.current) photoInputRef.current.click();
    };

    const onPhotoMouseDown = (ev) => {
        ev.preventDefault();
        photoDragRef.current.dragging = true;
        photoDragRef.current.lastX = ev.clientX || ev.touches?.[0]?.clientX;
        photoDragRef.current.lastY = ev.clientY || ev.touches?.[0]?.clientY;
    };
    const onPhotoMouseMove = (ev) => {
        if (!photoDragRef.current.dragging) return;
        const x = ev.clientX || ev.touches?.[0]?.clientX;
        const y = ev.clientY || ev.touches?.[0]?.clientY;
        const dx = x - photoDragRef.current.lastX;
        const dy = y - photoDragRef.current.lastY;
        photoDragRef.current.lastX = x;
        photoDragRef.current.lastY = y;
        setPhotoOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    };
    const onPhotoMouseUp = () => {
        photoDragRef.current.dragging = false;
    };

    const cancelCropPhoto = () => {
        // revoke object URL
        if (photoTempSrc) URL.revokeObjectURL(photoTempSrc);
        setPhotoTempSrc(null);
        setPhotoImgSize(null);
        setPhotoScale(1);
        setPhotoOffset({ x: 0, y: 0 });
        setPhotoModalOpen(false);
    };

    const applyCropPhoto = async () => {
        console.log('applyCropPhoto start', { photoTempSrc, photoScale, photoOffset, photoImgSize });
        if (!photoTempSrc || !photoImgSize) return;
        const vp = 240; // crop viewport size
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.src = photoTempSrc;
        await new Promise(resolve => { img.onload = resolve; img.onerror = resolve; });

        const scale = photoScale || 1;
        const dispW = img.width * scale;
        const dispH = img.height * scale;
        const offsetX = photoOffset.x;
        const offsetY = photoOffset.y;

        // Compute source rectangle from original image coordinates
        const srcX = Math.max(0, (-offsetX) / scale);
        const srcY = Math.max(0, (-offsetY) / scale);
        const srcW = Math.min(img.width - srcX, vp / scale);
        const srcH = Math.min(img.height - srcY, vp / scale);

        const canvas = document.createElement('canvas');
        canvas.width = vp;
        canvas.height = vp;
        const ctx = canvas.getContext('2d');

        // Clip to a circle and draw the selected portion scaled to fill the viewport
        ctx.save();
        ctx.beginPath();
        ctx.arc(vp / 2, vp / 2, vp / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        try {
            ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, vp, vp);
        } catch (e) {
            console.warn('Crop draw failed', e);
        }
        ctx.restore();

        const dataUrl = canvas.toDataURL('image/png');
        console.log('cropped dataUrl length', dataUrl?.length);
        // save to visionData
        updateVisionData('uploadedPhoto', dataUrl);

        // cleanup
        try { URL.revokeObjectURL(photoTempSrc); } catch (e) {}
        setPhotoTempSrc(null);
        setPhotoImgSize(null);
        setPhotoScale(1);
        setPhotoOffset({ x: 0, y: 0 });
        setPhotoModalOpen(false);
    };


    
    
    // Generate preview only after the user clicks "Generate"
    // Intentionally only run when `showVisionBoard` changes so the preview doesn't auto-update
    

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 pb-8">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-semibold text-pink-950 mb-2">Create Your Vision Board</h1>
                    <p className="text-gray-600">Answer these questions to personalize your vision board</p>
                </div>

                <div className="bg-white rounded-lg shadow-lg p-8 mb-8 space-y-8">
                    {/* Question 0: Name (moved up) */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            1. My name
                        </label>
                        <input
                            type="text"
                            maxLength="20"
                            placeholder="Your name"
                            value={visionData.name}
                            onChange={(e) => updateVisionData('name', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 font-semibold text-left"
                        />
                        <p className="text-xs text-gray-500 mt-1">{visionData.name.length}/20</p>
                    </div>

                    {/* Question 1: Role (moved up) */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            2. My role (e.g., Student)
                        </label>
                        <input
                            type="text"
                            maxLength="15"
                            placeholder="e.g. Student, Developer"
                            value={visionData.role}
                            onChange={(e) => updateVisionData('role', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500 text-left"
                        />
                        <p className="text-xs text-gray-500 mt-1">{visionData.role.length}/15</p>
                    </div>

                    {/* Question 2: Personality (Existing) */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            1. Hey I'm a ______________ <span className="text-xs text-gray-500">(max 15 characters)</span>
                        </label>
                        <input
                            type="text"
                            maxLength="15"
                            placeholder="e.g. matcha girl, tinkerer"
                            value={visionData.personality}
                            onChange={(e) => updateVisionData('personality', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">{visionData.personality.length}/15</p>
                    </div>

                    {/* Question 2: Expectations (Existing) */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            2. What are my expectations? (Press Enter to add, 3 total)
                        </label>
                        <div className="space-y-2 mb-3">
                            {visionData.expectations.map((expectation, idx) => (
                                <div key={idx} className="flex items-center justify-between bg-pink-50 p-3 rounded-lg">
                                    <span className="text-gray-700 font-bold">{expectation}</span>
                                    <button
                                        onClick={() => removeExpectation(idx)}
                                        className="text-red-500 hover:text-red-700 font-bold"
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                        {visionData.expectations.length < 3 && (
                            <input
                                type="text"
                                maxLength="50"
                                placeholder="Type an expectation and press Enter..."
                                onKeyPress={addExpectation}
                                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                            />
                        )}
                        <p className="text-xs text-gray-500 mt-1">{visionData.expectations.length}/3</p>
                    </div>

                    {/* --- START OF ADDED SECTIONS FROM COMMENTED CODE --- */}

                    {/* Question 3: Speaker to Meet */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            3. I'm excited about meeting ____________ <span className="text-xs text-gray-500">(Speaker)</span>
                        </label>
                        <select
                            value={visionData.speakerToMeet}
                            onChange={(e) => updateVisionData('speakerToMeet', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                        >
                            <option value="">-- Select a speaker --</option>
                            {getSpeakerNames().map(speaker => (
                                <option key={speaker} value={speaker}>{speaker}</option>
                            ))}
                        </select>
                    </div>

                    {/* Question 4: Selected Sessions */}
                    <div>
                        <div className="flex items-center justify-between mb-2">
                            <label className="text-lg font-semibold text-gray-800">
                                4. What sessions am I most excited for? <span className="text-xs text-gray-500">(Select 2)</span>
                            </label>
                            <button
                                type="button"
                                onClick={() => updateVisionData('selectedSessions', [])}
                                className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 rounded"
                            >
                                Clear All
                            </button>
                        </div>
                        <div className="space-y-2">
                            {TRACKS.map(track => (
                                <div key={track.id} className="border rounded-lg overflow-hidden">
                                    <button
                                        onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
                                        className="w-full p-3 flex items-center justify-between font-semibold text-white transition"
                                        style={{ backgroundColor: track.color }}
                                    >
                                        <span>{track.name}</span>
                                        {expandedTrack === track.id ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                                    </button>

                                    {expandedTrack === track.id && (
                                        <div className="p-3 bg-gray-50 space-y-2">
                                            {SESSIONS.filter(s => s.trackId === track.id).map(session => (
                                                <label key={session.id} className="flex items-center cursor-pointer p-2 hover:bg-gray-100 rounded">
                                                    <input
                                                        type="checkbox"
                                                        checked={visionData.selectedSessions.includes(session.id)}
                                                        onChange={() => toggleSession(session.id)}
                                                        disabled={visionData.selectedSessions.length >= 2 && !visionData.selectedSessions.includes(session.id)}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className="ml-3 text-gray-700">{session.title}</span>
                                                </label>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{visionData.selectedSessions.length}/2</p>
                    </div>

                    {/* Question 5: Favorite Track */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            5. I'm most excited for the _______________ track
                        </label>
                        <select
                            value={visionData.favoriteTrack}
                            onChange={(e) => updateVisionData('favoriteTrack', e.target.value)}
                            className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-pink-500"
                        >
                            <option value="">-- Select a track --</option>
                            {TRACKS.map(track => (
                                <option key={track.id} value={track.id}>{track.name}</option>
                            ))}
                        </select>
                    </div>

                    {/* Question 6: Travel Mode */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            6. How am I travelling?
                        </label>
                        <div className="grid grid-cols-3 gap-3">
                            {['bus', 'flight', 'train'].map(mode => (
                                <button
                                    key={mode}
                                    onClick={() => updateVisionData('travelMode', mode)}
                                    className={`py-3 px-4 rounded-lg font-semibold transition capitalize ${
                                        visionData.travelMode === mode
                                            ? 'bg-pink-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {mode === 'bus' && '🚌 Bus'}
                                    {mode === 'flight' && '✈️ Flight'}
                                    {mode === 'train' && '🚆 Train'}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question 7: Inspiring Image */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            7. What speaks to me? (Select 1)
                        </label>
                        <div className="grid grid-cols-5 gap-3">
                            {INSPIRATIONAL_IMAGES.map(img => (
                                <button
                                    key={img.id}
                                    onClick={() => updateVisionData('inspiringImage', img.id)}
                                    className={`relative rounded-lg overflow-hidden border-4 transition ${
                                        visionData.inspiringImage === img.id
                                            ? 'border-pink-500'
                                            : 'border-gray-300'
                                    }`}
                                >
                                    {/* Note: In a real app, ensure image URLs are properly configured to be accessible (CORS) */}
                                    <img src={img.url} alt={img.label} className="w-full h-24 object-cover" crossOrigin="anonymous" />
                                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white text-xs p-1 text-center">
                                        {img.label}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Question 8: Upload your photo (round, crop) */}
                    <div>
                        <label className="block text-lg font-semibold text-gray-800 mb-2">
                            8. Upload your photo <span className="text-xs text-gray-500">(round — crop to fit)</span>
                        </label>

                        <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-gray-200 shadow-sm flex items-center justify-center">
                                {visionData.uploadedPhoto ? (
                                    <img src={visionData.uploadedPhoto} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <div className="text-xs text-gray-400">No photo</div>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                <input ref={photoInputRef} onChange={handlePhotoFile} type="file" accept="image/*" className="hidden" />
                                <button type="button" onClick={() => { if (photoInputRef.current) photoInputRef.current.click(); }} className="px-4 py-2 bg-blue-500 text-white rounded">Upload</button>
                                {visionData.uploadedPhoto && (
                                    <button type="button" onClick={() => updateVisionData('uploadedPhoto', null)} className="px-3 py-2 border rounded text-sm">Remove</button>
                                )}
                                <p className="text-xs text-gray-500">Crop preview opens after selecting a file.</p>
                            </div>
                        </div>
                    </div>

                    {/* Question 9: Accent Color */}
<div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-6 border-2 border-pink-200">
  <label className="block text-2xl font-bold text-gray-900 mb-1">
    Pick Your Accent Colour
  </label>
  <p className="text-sm text-gray-600 mb-6">This colour will frame your vision board and define your style!</p>


  {/* Quick Palette */}
  <div className="mb-6">
    <p className="text-sm font-semibold text-gray-700 mb-3">Quick Palette - Click to Select</p>
    <div className="grid grid-cols-5 gap-3">
      {['#cdb4db', '#f2cc8f', '#adc178', '#ffafcc', '#a2d2ff'].map(c => (
        <button
          key={c}
          onClick={() => updateVisionData('accentColor', c)}
          className={`w-16 h-16 rounded-xl shadow-md transition transform hover:scale-110 ${
            visionData.accentColor === c ? 'ring-4 ring-offset-2' : 'hover:shadow-lg'
          }`}
          style={{ 
            background: c,
            ringColor: c
          }}
          aria-label={`Select ${c}`}
          title={c}
        />
      ))}
    </div>
  </div>

  {/* Custom Color */}
  <div className="bg-white rounded-lg p-4 border border-gray-200">
    <p className="text-sm font-semibold text-gray-700 mb-3">Custom Colour</p>
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={visionData.accentColor}
          onChange={(e) => updateVisionData('accentColor', e.target.value)}
          className="w-14 h-14 rounded-lg p-1 border-2 border-gray-300 cursor-pointer"
        />
        <div>
          <p className="text-xs text-gray-500">Colour Picker</p>
        </div>
      </div>

      <div className="flex-1">
        <p className="text-xs text-gray-500 mb-1">Hex Code</p>
        <input
          type="text"
          value={visionData.accentColor}
          onChange={(e) => updateVisionData('accentColor', e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:border-pink-500"
          placeholder="#FF6B9D"
        />
      </div>

      <button
        type="button"
        onClick={() => updateVisionData('accentColor', '#FF6B9D')}
        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold rounded-lg transition text-sm"
      >
        Reset
      </button>
    </div>
  </div>
</div>
                    
                    {/* --- END OF ADDED SECTIONS --- */}

                </div>

                {/* Photo crop modal (appears after selecting a file) */}
                {photoModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <div className="bg-white rounded-lg shadow-lg p-6 w-[520px] max-w-full">
                            <h3 className="text-lg font-semibold mb-3">Crop your photo</h3>
                            <div className="flex gap-4">
                                <div className="w-60 h-60 bg-gray-100 overflow-hidden relative" onMouseDown={onPhotoMouseDown} onMouseMove={onPhotoMouseMove} onMouseUp={onPhotoMouseUp} onMouseLeave={onPhotoMouseUp} onTouchStart={onPhotoMouseDown} onTouchMove={onPhotoMouseMove} onTouchEnd={onPhotoMouseUp}>
                                    {photoTempSrc ? (
                                        <>
                                            <img
                                                src={photoTempSrc}
                                                alt=""
                                                style={{
                                                    position: 'absolute',
                                                    left: photoOffset.x,
                                                    top: photoOffset.y,
                                                    width: (photoImgSize ? photoImgSize.width * photoScale : 'auto'),
                                                    height: (photoImgSize ? photoImgSize.height * photoScale : 'auto'),
                                                    userSelect: 'none',
                                                    touchAction: 'none'
                                                }}
                                            />

                                            {/* Circular overlay: darken outside circle and show white stroke */}
                                            <svg
                                                viewBox="0 0 240 240"
                                                width="100%"
                                                height="100%"
                                                style={{ position: 'absolute', left: 0, top: 0, pointerEvents: 'none' }}
                                            >
                                                <defs>
                                                    <mask id="crop-mask">
                                                        <rect x="0" y="0" width="240" height="240" fill="white" />
                                                        <circle cx="120" cy="120" r="120" fill="black" />
                                                    </mask>
                                                </defs>
                                                <rect x="0" y="0" width="240" height="240" fill="rgba(0,0,0,0.5)" mask="url(#crop-mask)" />
                                                <circle cx="120" cy="120" r="116" fill="none" stroke="#FFFFFF" strokeWidth="4" />
                                            </svg>
                                        </>
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-sm text-gray-400">No image</div>
                                    )}
                                </div>

                                <div className="flex-1">
                                    <label className="text-sm text-gray-600">Zoom</label>
                                    <input type="range" min="0.5" max="3" step="0.01" value={photoScale} onChange={(e) => setPhotoScale(parseFloat(e.target.value))} className="w-full mb-3" />
                                    <div className="flex gap-2">
                                        <button onClick={cancelCropPhoto} className="px-3 py-2 border rounded">Cancel</button>
                                        <button onClick={applyCropPhoto} className="px-3 py-2 bg-green-500 text-white rounded">Crop & Save</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Generate button - students don't see the board until they click */}
                {!showVisionBoard && (
                    <div className="mb-6">
    {/* Error messages displayed inline */}
    {(() => {
      const errors = validateVisionData();
      return errors.length > 0 ? (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
          <p className="text-red-700 font-semibold mb-2">⚠️ Please complete all fields:</p>
          <ul className="list-disc list-inside space-y-1">
            {errors.map((err, i) => (
              <li key={i} className="text-red-600 text-sm">{err}</li>
            ))}
          </ul>
        </div>
      ) : null;
    })()}
    <button
  onClick={() => {
    const errors = validateVisionData();
    
    if (errors.length === 0) {
          setShowVisionBoard(true);
        }
      }}
      className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-teal-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
      disabled={validateVisionData().length > 0 || isLoading}
    >
      {isLoading ? 'Loading Fonts and Assets...' : 'Generate Vision Board'}
</button>
                    </div>
                )}

                {/* Preview Section (visible only after generate) */}
                {showVisionBoard && (
                    <>
                        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-2xl font-bold text-gray-800">Your Vision Board</h2>
                                <div>
                                    <button
                                        type="button"
                                        onClick={() => generateVisionBoardCanvas(visionData)}
                                        className="px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded font-semibold"
                                    >
                                        Regenerate Preview
                                    </button>
                                </div>
                            </div>

                            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
                                <div className="p-4">
                                    <canvas
                                        ref={canvasRef}
                                        className="w-full"
                                        style={{ aspectRatio: '16/9' }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Download Button (Canvas export remains the same) */}
                        <button
                            onClick={() => {
                                const canvas = canvasRef.current;
                                if (canvas) {
                                    const link = document.createElement('a');
                                    link.href = canvas.toDataURL('image/png');
                                    link.download = 'vision-board.png';
                                    link.click();
                                }
                            }}
                            className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition"
                        >
                            <Download size={20} /> Download Vision Board
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

export default PreConferencePage;

