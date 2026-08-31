import React from 'react';
import ChromaKeyPanel from './ChromaKeyPanel';
import styles from './FrameUploadWorkspace.module.css';

const FrameSlotToolbar = ({
  slots,
  activePreset,
  onApplyPreset,
  onAddSlot,
  onResetSlots,
  onReplaceImage,
  imageSrc,
  chromaKeyedSrc,
  chromaKeyColor,
  chromaKeyTolerance,
  chromaKeySoftness,
  isEyedropperActive,
  isChromaProcessing,
  onToggleEyedropper,
  onToleranceChange,
  onSoftnessChange,
  onClearChromaKey,
  onConfirm
}) => {
  return (
    <div className={styles.inspectorCol}>
      {/* Side-by-side row: 01. Chroma Key & 02. Slot Presets */}
      <div className={styles.toolbarSideBySideRow}>
        {/* 01. Chroma Key */}
        <div className={styles.toolbarCol}>
          <div className={styles.sectionTitle}>
            <span className={styles.instructionNum}>01.</span>
            <span className={styles.sectionHeading}>Chroma Key</span>
          </div>
          {imageSrc && (
            <ChromaKeyPanel
              chromaKeyedSrc={chromaKeyedSrc}
              chromaKeyColor={chromaKeyColor}
              chromaKeyTolerance={chromaKeyTolerance}
              chromaKeySoftness={chromaKeySoftness}
              isEyedropperActive={isEyedropperActive}
              isProcessing={isChromaProcessing}
              onToggleEyedropper={onToggleEyedropper}
              onToleranceChange={onToleranceChange}
              onSoftnessChange={onSoftnessChange}
              onClearChromaKey={onClearChromaKey}
            />
          )}
        </div>

        {/* 02. Slot Presets */}
        <div className={styles.toolbarCol}>
          <div className={styles.sectionTitle}>
            <span className={styles.instructionNum}>02.</span>
            <span className={styles.sectionHeading}>Slot Presets</span>
          </div>
          <div className={styles.presetList}>
            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'AUTO_TWIN' ? styles.active : ''}`}
              onClick={() => onApplyPreset('AUTO_TWIN')}
            >
              <span className={styles.presetName}>AUTO TWIN</span>
              <span className={styles.presetDesc}>DUPLICATE</span>
            </button>

            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'AUTO' ? styles.active : ''}`}
              onClick={() => onApplyPreset('AUTO')}
            >
              <span className={styles.presetName}>AUTO SCAN</span>
              <span className={styles.presetDesc}>SEQUENTIAL</span>
            </button>

            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'STRIP_3' ? styles.active : ''}`}
              onClick={() => onApplyPreset('STRIP_3')}
            >
              <span className={styles.presetName}>3-PHOTO STRIP</span>
              <span className={styles.presetDesc}>CLASSIC</span>
            </button>

            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'GRID_4' ? styles.active : ''}`}
              onClick={() => onApplyPreset('GRID_4')}
            >
              <span className={styles.presetName}>4-GRID QUAD</span>
              <span className={styles.presetDesc}>2×2</span>
            </button>
          </div>
        </div>
      </div>

      {/* Action Buttons (Down below without heading) */}
      <div className={styles.bottomActionRow}>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onAddSlot}
        >
          + ADD SLOT
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onResetSlots}
        >
          RESET
        </button>
        <button
          type="button"
          className={styles.secondaryBtn}
          onClick={onReplaceImage}
          title="Remove existing frame and return to upload"
        >
          CHANGE
        </button>
      </div>
    </div>
  );
};

export default FrameSlotToolbar;
