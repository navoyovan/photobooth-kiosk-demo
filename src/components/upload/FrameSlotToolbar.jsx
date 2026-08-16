import React from 'react';
import styles from './FrameUploadWorkspace.module.css';

const FrameSlotToolbar = ({
  slots,
  activePreset,
  onApplyPreset,
  onAddSlot,
  onResetSlots,
  onReplaceImage,
  onConfirm
}) => {
  return (
    <div className={styles.inspectorCol}>
      <div>
        {/* Presets Section */}
        <div className={styles.toolSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.instructionNum}>01.</span>
            <span className={styles.sectionHeading}>Slot Presets</span>
          </div>
          <div className={styles.presetGrid}>
            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'AUTO_TWIN' ? styles.active : ''}`}
              onClick={() => onApplyPreset('AUTO_TWIN')}
            >
              <span className={styles.presetName}>⚡ Auto Twin</span>
              <span className={styles.presetDesc}>Duplicate: 123... 123...</span>
            </button>

            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'AUTO' ? styles.active : ''}`}
              onClick={() => onApplyPreset('AUTO')}
            >
              <span className={styles.presetName}>⚡ Auto Scan</span>
              <span className={styles.presetDesc}>Sequential: 1, 2, 3...</span>
            </button>

            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'STRIP_3' ? styles.active : ''}`}
              onClick={() => onApplyPreset('STRIP_3')}
            >
              <span className={styles.presetName}>3-Photo Strip</span>
              <span className={styles.presetDesc}>Vertical 3-cutout classic</span>
            </button>

            <button
              type="button"
              className={`${styles.presetCard} ${activePreset === 'GRID_4' ? styles.active : ''}`}
              onClick={() => onApplyPreset('GRID_4')}
            >
              <span className={styles.presetName}>4-Grid Quad</span>
              <span className={styles.presetDesc}>2×2 square collage</span>
            </button>
          </div>
        </div>

        {/* Manual Adjustments */}
        <div className={styles.toolSection}>
          <div className={styles.sectionTitle}>
            <span className={styles.instructionNum}>02.</span>
            <span className={styles.sectionHeading}>Fine Tuning ({slots.length} {slots.length === 1 ? 'Slot' : 'Slots'})</span>
          </div>
          <div className={styles.buttonRow}>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onAddSlot}
            >
              + Add Slot
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onResetSlots}
            >
              Reset
            </button>
            <button
              type="button"
              className={styles.secondaryBtn}
              onClick={onReplaceImage}
              title="Upload a different image"
            >
              ↺ Change
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FrameSlotToolbar;
