import { useState, useCallback, useEffect } from 'react';
import { assetUrl } from '../utils/assetUrl';
import { detectPunchholesFromImage, PRESET_LAYOUTS } from '../utils/punchholeDetector';
import { useChromaKey, samplePixelFromImage } from './useChromaKey';

const STORAGE_KEY = 'photobooth_custom_frame';
const DEFAULT_FRAME_SRC = assetUrl('assets/tutorial.png');
const DEFAULT_FILE_NAME = 'tutorial.png';

function getPersistedFrame() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && parsed.imageSrc && Array.isArray(parsed.slots) && parsed.slots.length > 0) {
      return parsed;
    }
  } catch (e) {
    console.error('Failed to parse saved custom frame from localStorage:', e);
  }
  return null;
}

export function useFrameUpload() {
  const initialData = getPersistedFrame();

  const [imageSrc, setImageSrc] = useState(initialData?.imageSrc || DEFAULT_FRAME_SRC);
  const [fileName, setFileName] = useState(initialData?.fileName || DEFAULT_FILE_NAME);
  const [slots, setSlots] = useState(initialData?.slots || []);
  const [selectedSlotId, setSelectedSlotId] = useState(initialData?.slots?.length > 0 ? 0 : null);
  const [activePreset, setActivePreset] = useState(initialData?.activePreset || null);

  // Chroma Key State
  const [chromaKeyedSrc, setChromaKeyedSrc] = useState(initialData?.chromaKeyedSrc || null);
  const [chromaKeyColor, setChromaKeyColor] = useState(initialData?.chromaKeyColor || '#00FF00');
  const [chromaKeyTolerance, setChromaKeyTolerance] = useState(initialData?.chromaKeyTolerance ?? 30);
  const [chromaKeySoftness, setChromaKeySoftness] = useState(initialData?.chromaKeySoftness ?? 10);
  const [isEyedropperActive, setIsEyedropperActive] = useState(false);

  const { applyChromaKey, isProcessing: isChromaProcessing } = useChromaKey();

  // Scan default image on initial mount if not persisted
  useEffect(() => {
    if (!initialData && imageSrc === DEFAULT_FRAME_SRC) {
      detectPunchholesFromImage(DEFAULT_FRAME_SRC, 4, 'twin').then((detected) => {
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
          setActivePreset('AUTO_TWIN');
        } else {
          setSlots([]);
          setSelectedSlotId(null);
          setActivePreset(null);
        }
      });
    }
  }, []);

  // Automatically persist to browser localStorage whenever custom frame data changes
  useEffect(() => {
    if (imageSrc && slots.length > 0) {
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            imageSrc,
            fileName,
            slots,
            activePreset,
            chromaKeyedSrc,
            chromaKeyColor,
            chromaKeyTolerance,
            chromaKeySoftness,
            savedAt: Date.now()
          })
        );
      } catch (err) {
        console.warn('[useFrameUpload] Could not save frame to localStorage (quota or disabled):', err);
      }
    }
  }, [imageSrc, fileName, slots, activePreset, chromaKeyedSrc, chromaKeyColor, chromaKeyTolerance, chromaKeySoftness]);

  const handleImageSelected = async (src, name) => {
    setImageSrc(src);
    setFileName(name || 'custom_frame.png');
    setChromaKeyedSrc(null);
    setIsEyedropperActive(false);

    const detected = await detectPunchholesFromImage(src, 4, 'twin');
    if (detected && detected.length > 0) {
      setSlots(detected);
      setSelectedSlotId(0);
      setActivePreset('AUTO_TWIN');
    } else {
      // When no alpha/transparency is detected, do NOT auto add slot presets
      setSlots([]);
      setSelectedSlotId(null);
      setActivePreset(null);
    }
  };

  const handleApplyPreset = async (presetKey) => {
    setActivePreset(presetKey);
    const activeSrc = chromaKeyedSrc || imageSrc;
    if (presetKey === 'AUTO') {
      if (activeSrc) {
        const detected = await detectPunchholesFromImage(activeSrc, 4, 'sequential');
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
          return;
        }
      }
    } else if (presetKey === 'AUTO_TWIN') {
      if (activeSrc) {
        const detected = await detectPunchholesFromImage(activeSrc, 4, 'twin');
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
          return;
        }
      }
    } else if (PRESET_LAYOUTS[presetKey]) {
      setSlots(PRESET_LAYOUTS[presetKey]);
      setSelectedSlotId(0);
    }
  };

  const toggleEyedropper = () => {
    setIsEyedropperActive((prev) => !prev);
  };

  const handleCanvasTapKey = async (xPercent, yPercent) => {
    if (!imageSrc) return;
    try {
      const pixel = await samplePixelFromImage(imageSrc, xPercent, yPercent);
      if (!pixel) return;
      const sampledHex = pixel.hex;
      setChromaKeyColor(sampledHex);

      const keyedResult = await applyChromaKey(imageSrc, sampledHex, chromaKeyTolerance, chromaKeySoftness);
      if (keyedResult) {
        setChromaKeyedSrc(keyedResult);

        // Automatically auto-delete holes / detect transparent punchholes
        const mode = activePreset === 'AUTO' ? 'sequential' : 'twin';
        const detected = await detectPunchholesFromImage(keyedResult, 4, mode);
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
        }

        setIsEyedropperActive(false);
      }
    } catch (err) {
      console.error('[useFrameUpload] Error in handleCanvasTapKey:', err);
    }
  };

  const handleToleranceChange = async (newTol) => {
    setChromaKeyTolerance(newTol);
    if (imageSrc && chromaKeyedSrc && chromaKeyColor) {
      try {
        const keyedResult = await applyChromaKey(imageSrc, chromaKeyColor, newTol, chromaKeySoftness);
        if (keyedResult) {
          setChromaKeyedSrc(keyedResult);
          const mode = activePreset === 'AUTO' ? 'sequential' : 'twin';
          const detected = await detectPunchholesFromImage(keyedResult, 4, mode);
          if (detected && detected.length > 0) {
            setSlots(detected);
            setSelectedSlotId(0);
          }
        }
      } catch (err) {
        console.error('[useFrameUpload] Error updating tolerance:', err);
      }
    }
  };

  const handleSoftnessChange = async (newSoft) => {
    setChromaKeySoftness(newSoft);
    if (imageSrc && chromaKeyedSrc && chromaKeyColor) {
      try {
        const keyedResult = await applyChromaKey(imageSrc, chromaKeyColor, chromaKeyTolerance, newSoft);
        if (keyedResult) {
          setChromaKeyedSrc(keyedResult);
        }
      } catch (err) {
        console.error('[useFrameUpload] Error updating softness:', err);
      }
    }
  };

  const handleApplyChromaKey = async (color, tolerance, softness) => {
    if (!imageSrc) return;
    try {
      const keyedResult = await applyChromaKey(imageSrc, color, tolerance, softness);
      if (keyedResult) {
        setChromaKeyedSrc(keyedResult);
        setChromaKeyColor(color);
        setChromaKeyTolerance(tolerance);
        setChromaKeySoftness(softness);

        // Auto-detect punchholes on keyed image
        const mode = activePreset === 'AUTO' ? 'sequential' : 'twin';
        const detected = await detectPunchholesFromImage(keyedResult, 4, mode);
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
        }
      }
    } catch (err) {
      console.error('[useFrameUpload] Failed to apply chroma key:', err);
    }
  };

  const handleClearChromaKey = () => {
    setChromaKeyedSrc(null);
    setIsEyedropperActive(false);
  };

  const handleUpdateSlot = useCallback((id, updates) => {
    setSlots((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
    );
  }, []);

  const handleDeleteSlot = (id) => {
    setSlots((prev) => {
      const filtered = prev.filter((s) => s.id !== id);
      const uniqueIndices = Array.from(
        new Set(filtered.map((s) => (s.photo_index !== undefined ? s.photo_index : s.id)))
      ).sort((a, b) => a - b);

      const indexMap = new Map();
      uniqueIndices.forEach((oldIdx, newIdx) => {
        indexMap.set(oldIdx, newIdx);
      });

      return filtered.map((s, idx) => ({
        ...s,
        id: idx,
        photo_index: indexMap.get(s.photo_index !== undefined ? s.photo_index : s.id) ?? idx
      }));
    });
    setSelectedSlotId(null);
  };

  const handleDuplicateSlot = (id) => {
    setSlots((prev) => {
      const target = prev.find((s) => s.id === id);
      if (!target) return prev;
      const newIndex = prev.length;
      const duplicatedSlot = {
        ...target,
        id: newIndex,
        x: Math.min(100 - target.w, target.x + 3),
        y: Math.min(100 - target.h, target.y + 3),
        photo_index: target.photo_index !== undefined ? target.photo_index : target.id
      };
      return [...prev, duplicatedSlot];
    });
    setSelectedSlotId(slots.length);
  };

  const handleAddSlot = () => {
    setSlots((prev) => {
      const newIndex = prev.length;
      const maxPhotoIndex = prev.reduce((max, s) => Math.max(max, s.photo_index ?? 0), -1);
      const newSlot = {
        id: newIndex,
        type: 'rectangle',
        x: 15,
        y: 15 + ((newIndex * 15) % 60),
        w: 70,
        h: 25,
        photo_index: maxPhotoIndex + 1
      };
      return [...prev, newSlot];
    });
    setSelectedSlotId(slots.length);
  };

  const handleResetSlots = () => {
    setSlots([]);
    setSelectedSlotId(null);
    setActivePreset(null);
    setChromaKeyedSrc(null);
    setChromaKeyColor('#00FF00');
    setChromaKeyTolerance(30);
    setChromaKeySoftness(10);
    setIsEyedropperActive(false);
  };

  const handleReplaceImage = () => {
    setImageSrc(null);
    setFileName('');
    setSlots([]);
    setSelectedSlotId(null);
    setChromaKeyedSrc(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  };

  const handleConfirm = (onFinish, onPrepareCamera) => {
    if (!imageSrc || slots.length === 0) return;

    onPrepareCamera?.();

    const uniqueCaptureCount = new Set(slots.map((s) => s.photo_index !== undefined ? s.photo_index : s.id)).size;

    const customFrame = {
      id: `upload-${Date.now()}`,
      name: fileName || 'Custom Frame',
      category: 'UPLOAD',
      thumbnail: chromaKeyedSrc || imageSrc,
      slots: Math.max(1, uniqueCaptureCount),
      slots_config: slots
    };

    onFinish(customFrame);
  };

  return {
    imageSrc,
    fileName,
    slots,
    selectedSlotId,
    activePreset,
    chromaKeyedSrc,
    chromaKeyColor,
    chromaKeyTolerance,
    chromaKeySoftness,
    isEyedropperActive,
    isChromaProcessing,
    setSelectedSlotId,
    setIsEyedropperActive,
    toggleEyedropper,
    handleCanvasTapKey,
    handleToleranceChange,
    handleSoftnessChange,
    handleImageSelected,
    handleApplyPreset,
    handleApplyChromaKey,
    handleClearChromaKey,
    handleUpdateSlot,
    handleDeleteSlot,
    handleDuplicateSlot,
    handleAddSlot,
    handleResetSlots,
    handleReplaceImage,
    handleConfirm
  };
}


