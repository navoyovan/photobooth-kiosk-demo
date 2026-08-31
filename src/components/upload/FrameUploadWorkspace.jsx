import React from 'react';
import FrameIngestZone from './FrameIngestZone';
import FrameCanvasStage from './FrameCanvasStage';
import styles from './FrameUploadWorkspace.module.css';

const FrameUploadWorkspace = ({ uploadState, onConfirm }) => {
  const {
    imageSrc,
    slots,
    selectedSlotId,
    setSelectedSlotId,
    handleImageSelected,
    handleUpdateSlot,
    handleDeleteSlot,
    handleDuplicateSlot
  } = uploadState;

  return (
    <div className={styles.workspaceRoot}>
      {!imageSrc ? (
        <FrameIngestZone onImageSelected={handleImageSelected} />
      ) : (
        <div className={styles.studioContainer}>
          <FrameCanvasStage
            imageSrc={imageSrc}
            fileName={uploadState.fileName}
            displaySrc={uploadState.chromaKeyedSrc || imageSrc}
            slots={slots}
            selectedSlotId={selectedSlotId}
            isEyedropperActive={uploadState.isEyedropperActive}
            onCanvasTapKey={uploadState.handleCanvasTapKey}
            onSelectSlot={setSelectedSlotId}
            onUpdateSlot={handleUpdateSlot}
            onDeleteSlot={handleDeleteSlot}
            onDuplicateSlot={handleDuplicateSlot}
            onConfirm={onConfirm}
          />
        </div>
      )}
    </div>
  );
};

export default FrameUploadWorkspace;
