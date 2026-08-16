import { useState, useCallback, useEffect } from 'react';
import { detectPunchholesFromImage, PRESET_LAYOUTS } from '../utils/punchholeDetector';

const STORAGE_KEY = 'photobooth_custom_frame';

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

  const [imageSrc, setImageSrc] = useState(initialData?.imageSrc || null);
  const [fileName, setFileName] = useState(initialData?.fileName || '');
  const [slots, setSlots] = useState(initialData?.slots || []);
  const [selectedSlotId, setSelectedSlotId] = useState(initialData?.slots?.length > 0 ? 0 : null);
  const [activePreset, setActivePreset] = useState(initialData?.activePreset || 'AUTO_TWIN');

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
            savedAt: Date.now()
          })
        );
      } catch (err) {
        console.warn('[useFrameUpload] Could not save frame to localStorage (quota or disabled):', err);
      }
    }
  }, [imageSrc, fileName, slots, activePreset]);

  const handleImageSelected = async (src, name) => {
    setImageSrc(src);
    setFileName(name || 'custom_frame.png');
    setActivePreset('AUTO_TWIN');

    const detected = await detectPunchholesFromImage(src, 4, 'twin');
    if (detected && detected.length > 0) {
      setSlots(detected);
      setSelectedSlotId(0);
    } else {
      setSlots(PRESET_LAYOUTS.STRIP_3);
      setSelectedSlotId(0);
      setActivePreset('STRIP_3');
    }
  };

  const handleApplyPreset = async (presetKey) => {
    setActivePreset(presetKey);
    if (presetKey === 'AUTO') {
      if (imageSrc) {
        const detected = await detectPunchholesFromImage(imageSrc, 4, 'sequential');
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
          return;
        }
      }
      setSlots(PRESET_LAYOUTS.STRIP_3);
      setSelectedSlotId(0);
    } else if (presetKey === 'AUTO_TWIN') {
      if (imageSrc) {
        const detected = await detectPunchholesFromImage(imageSrc, 4, 'twin');
        if (detected && detected.length > 0) {
          setSlots(detected);
          setSelectedSlotId(0);
          return;
        }
      }
      setSlots(PRESET_LAYOUTS.STRIP_3);
      setSelectedSlotId(0);
    } else if (PRESET_LAYOUTS[presetKey]) {
      setSlots(PRESET_LAYOUTS[presetKey]);
      setSelectedSlotId(0);
    }
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
    handleApplyPreset(activePreset || 'STRIP_3');
  };

  const handleReplaceImage = () => {
    setImageSrc(null);
    setFileName('');
    setSlots([]);
    setSelectedSlotId(null);
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
      thumbnail: imageSrc,
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
    setSelectedSlotId,
    handleImageSelected,
    handleApplyPreset,
    handleUpdateSlot,
    handleDeleteSlot,
    handleDuplicateSlot,
    handleAddSlot,
    handleResetSlots,
    handleReplaceImage,
    handleConfirm
  };
}
