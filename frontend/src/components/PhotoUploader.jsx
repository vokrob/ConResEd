import { useRef, useState, useEffect } from "react";

export function PhotoUploader({ onPhotoSelect, currentPhoto, readOnly = false }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 10, y: 10, width: 80, height: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  
  const handleRemovePhoto = () => {
    onPhotoSelect(null);
  };

  useEffect(() => {
    const handleGlobalPointerMove = (e) => {
      if (!isDragging && !isResizing) return;
      if (!containerRef.current) return;

      e.preventDefault();
      const rect = containerRef.current.getBoundingClientRect();

      if (isDragging) {
        const xPercent = ((e.clientX - dragStart.offsetX - rect.left) / rect.width) * 100;
        const yPercent = ((e.clientY - dragStart.offsetY - rect.top) / rect.height) * 100;
        const boundedX = Math.max(0, Math.min(xPercent, 100 - cropArea.width));
        const boundedY = Math.max(0, Math.min(yPercent, 100 - cropArea.height));
        setCropArea(prev => ({ ...prev, x: boundedX, y: boundedY }));
      } else if (isResizing && resizeHandle) {
        const deltaX = ((e.clientX - dragStart.mouseX) / rect.width) * 100;
        const deltaY = ((e.clientY - dragStart.mouseY) / rect.height) * 100;

        setCropArea(prev => {
          let newArea = { ...prev };
          switch (resizeHandle) {
            case 'se':
              newArea.width = Math.max(20, Math.min(100 - prev.x, dragStart.width + deltaX));
              newArea.height = Math.max(20, Math.min(100 - prev.y, dragStart.height + deltaY));
              break;
            case 'sw':
              newArea.x = Math.max(0, Math.min(dragStart.x + deltaX, dragStart.x + dragStart.width - 20));
              newArea.width = Math.max(20, dragStart.x + dragStart.width - newArea.x);
              newArea.height = Math.max(20, Math.min(100 - prev.y, dragStart.height + deltaY));
              break;
            case 'ne':
              newArea.y = Math.max(0, Math.min(dragStart.y + deltaY, dragStart.y + dragStart.height - 20));
              newArea.height = Math.max(20, dragStart.y + dragStart.height - newArea.y);
              newArea.width = Math.max(20, Math.min(100 - prev.x, dragStart.width + deltaX));
              break;
            case 'nw':
              newArea.x = Math.max(0, Math.min(dragStart.x + deltaX, dragStart.x + dragStart.width - 20));
              newArea.y = Math.max(0, Math.min(dragStart.y + deltaY, dragStart.y + dragStart.height - 20));
              newArea.width = Math.max(20, dragStart.x + dragStart.width - newArea.x);
              newArea.height = Math.max(20, dragStart.y + dragStart.height - newArea.y);
              break;
            default:
              break;
          }
          return newArea;
        });
      }
    };

    const handleGlobalPointerUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setResizeHandle(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('pointermove', handleGlobalPointerMove, { passive: false });
      document.addEventListener('pointerup', handleGlobalPointerUp);
      document.addEventListener('pointercancel', handleGlobalPointerUp);
    }

    return () => {
      document.removeEventListener('pointermove', handleGlobalPointerMove);
      document.removeEventListener('pointerup', handleGlobalPointerUp);
      document.removeEventListener('pointercancel', handleGlobalPointerUp);
    };
  }, [isDragging, isResizing, resizeHandle, dragStart, cropArea.width, cropArea.height]);

  const openModal = () => {
    setIsModalOpen(true);
    setSelectedImage(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedImage(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedImage(event.target.result);
        setCropArea({ x: 10, y: 10, width: 80, height: 80 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = () => {
    const margin = 10;
    setCropArea({
      x: margin,
      y: margin,
      width: 100 - margin * 2,
      height: 100 - margin * 2
    });
  };

  const handlePointerDown = (e, type, handle = null) => {
    e.preventDefault();
    e.stopPropagation();
    if (!containerRef.current) return;
    e.currentTarget.setPointerCapture?.(e.pointerId);
    const rect = containerRef.current.getBoundingClientRect();

    if (type === 'move') {
      const offsetX = e.clientX - (rect.left + (cropArea.x / 100) * rect.width);
      const offsetY = e.clientY - (rect.top + (cropArea.y / 100) * rect.height);
      setIsDragging(true);
      setDragStart({ mouseX: e.clientX, mouseY: e.clientY, offsetX, offsetY });
    } else if (type === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({
        mouseX: e.clientX,
        mouseY: e.clientY,
        x: cropArea.x,
        y: cropArea.y,
        width: cropArea.width,
        height: cropArea.height
      });
    }
  };

  const savePhoto = () => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return;
    const canvas = canvasRef.current;
    const img = imageRef.current;
    const scaleX = img.naturalWidth / 100;
    const scaleY = img.naturalHeight / 100;
    const cropX = cropArea.x * scaleX;
    const cropY = cropArea.y * scaleY;
    const cropW = cropArea.width * scaleX;
    const cropH = cropArea.height * scaleY;
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, cropX, cropY, cropW, cropH, 0, 0, cropW, cropH);
    const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
    onPhotoSelect(croppedDataUrl);
    closeModal();
  };

  return (
    <>
      <div className="avatar-placeholder" onClick={openModal} style={{ cursor: 'pointer', position: 'relative' }}>
        {currentPhoto ? (
		  <>
            <img src={currentPhoto} alt="Фото" />
            {!readOnly && (
              <button
                type="button"
                className="remove-photo-btn"
                onClick={(e) => { e.stopPropagation(); handleRemovePhoto(); }}
                title="Удалить фото"
                style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  background: '#dc2626',
                  color: '#fff',
                  border: '2px solid #fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  lineHeight: 1,
                  padding: 0,
                  zIndex: 5
                }}
              >
                ×
              </button>
            )}
          </>
        ) : (
          <>
            <span>📷</span>
            <span className="upload-hint">Нажмите для загрузки фото</span>
          </>
        )}
      </div>

      {isModalOpen && (
        <div className="photo-modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="photo-modal">
            <div className="modal-header">
              <h3>Загрузка фотографии</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {!selectedImage ? (
                <div className="upload-area">
                  <label className="upload-label">
                    <input type="file" accept="image/*" onChange={handleFileChange} style={{ display: 'none' }} />
                    <div className="upload-content">
                      <span className="upload-icon">📁</span>
                      <p>Выберите фотографию</p>
                      <p className="upload-hint-text">или перетащите файл сюда</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="crop-container" ref={containerRef}>
                  <img ref={imageRef} src={selectedImage} alt="Для обрезки" className="crop-image" onLoad={handleImageLoad} />
                  <div
                    className="crop-overlay"
                    onPointerDown={(e) => handlePointerDown(e, 'move')}
                    style={{
                      position: 'absolute',
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                      cursor: 'move',
                      touchAction: 'none',
                    }}
                  >
                    <div className="resize-handle nw" onPointerDown={(e) => handlePointerDown(e, 'resize', 'nw')} style={{ position: 'absolute', top: '-8px', left: '-8px', width: '16px', height: '16px', background: '#fff', border: '2px solid #333', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10, touchAction: 'none' }} />
                    <div className="resize-handle ne" onPointerDown={(e) => handlePointerDown(e, 'resize', 'ne')} style={{ position: 'absolute', top: '-8px', right: '-8px', width: '16px', height: '16px', background: '#fff', border: '2px solid #333', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 10, touchAction: 'none' }} />
                    <div className="resize-handle sw" onPointerDown={(e) => handlePointerDown(e, 'resize', 'sw')} style={{ position: 'absolute', bottom: '-8px', left: '-8px', width: '16px', height: '16px', background: '#fff', border: '2px solid #333', borderRadius: '50%', cursor: 'nesw-resize', zIndex: 10, touchAction: 'none' }} />
                    <div className="resize-handle se" onPointerDown={(e) => handlePointerDown(e, 'resize', 'se')} style={{ position: 'absolute', bottom: '-8px', right: '-8px', width: '16px', height: '16px', background: '#fff', border: '2px solid #333', borderRadius: '50%', cursor: 'nwse-resize', zIndex: 10, touchAction: 'none' }} />
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedImage && (<button className="btn-cancel" onClick={() => setSelectedImage(null)}>Выбрать другое фото</button>)}
              <button className="btn-close" onClick={closeModal}>Отмена</button>
              {selectedImage && (<button className="btn-save" onClick={savePhoto}>Сохранить</button>)}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
