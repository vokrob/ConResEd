import { useRef, useState, useCallback } from "react";

export function PhotoUploader({ onPhotoSelect, currentPhoto }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 100, height: 100 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);
  const containerRef = useRef(null);

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

  const handleMouseDown = (e, type, handle = null) => {
    e.preventDefault();
    if (type === 'move') {
      setIsDragging(true);
      setDragStart({ x: e.clientX - cropArea.x, y: e.clientY - cropArea.y });
    } else if (type === 'resize') {
      setIsResizing(true);
      setResizeHandle(handle);
      setDragStart({ x: e.clientX, y: e.clientY, ...cropArea });
    }
  };

  const handleMouseMove = useCallback((e) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();

    if (isDragging) {
      let newX = e.clientX - dragStart.x;
      let newY = e.clientY - dragStart.y;

      // Ограничиваем движение в пределах контейнера
      newX = Math.max(0, Math.min(newX, 100 - cropArea.width));
      newY = Math.max(0, Math.min(newY, 100 - cropArea.height));

      setCropArea(prev => ({ ...prev, x: newX, y: newY }));
    } else if (isResizing && resizeHandle) {
      const deltaX = ((e.clientX - dragStart.x) / rect.width) * 100;
      const deltaY = ((e.clientY - dragStart.y) / rect.height) * 100;

      setCropArea(prev => {
        let newArea = { ...prev };

        switch (resizeHandle) {
          case 'se': // нижний правый угол
            newArea.width = Math.max(20, Math.min(100 - prev.x, prev.width + deltaX));
            newArea.height = Math.max(20, Math.min(100 - prev.y, prev.height + deltaY));
            break;
          case 'sw': // нижний левый угол
            newArea.x = Math.max(0, Math.min(prev.x + deltaX, prev.x + prev.width - 20));
            newArea.width = Math.max(20, prev.x + prev.width - newArea.x);
            newArea.height = Math.max(20, Math.min(100 - prev.y, prev.height + deltaY));
            break;
          case 'ne': // верхний правый угол
            newArea.y = Math.max(0, Math.min(prev.y + deltaY, prev.y + prev.height - 20));
            newArea.height = Math.max(20, prev.y + prev.height - newArea.y);
            newArea.width = Math.max(20, Math.min(100 - prev.x, prev.width + deltaX));
            break;
          case 'nw': // верхний левый угол
            newArea.x = Math.max(0, Math.min(prev.x + deltaX, prev.x + prev.width - 20));
            newArea.y = Math.max(0, Math.min(prev.y + deltaY, prev.y + prev.height - 20));
            newArea.width = Math.max(20, prev.x + prev.width - newArea.x);
            newArea.height = Math.max(20, prev.y + prev.height - newArea.y);
            break;
          default:
            break;
        }

        return newArea;
      });
    }
  }, [isDragging, isResizing, resizeHandle, dragStart, cropArea]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle(null);
  }, []);

  const savePhoto = () => {
    if (!selectedImage || !canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const img = imageRef.current;

    // Вычисляем реальные размеры обрезки
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
      <div
        className="avatar-placeholder"
        onClick={openModal}
        style={{ cursor: 'pointer', position: 'relative' }}
      >
        {currentPhoto ? (
          <img src={currentPhoto} alt="Фото" />
        ) : (
          <>
            <span>📷</span>
            <span className="upload-hint">Нажмите для загрузки фото</span>
          </>
        )}
      </div>

      {isModalOpen && (
        <div
          className="photo-modal-overlay"
          onClick={(e) => e.target === e.currentTarget && closeModal()}
        >
          <div className="photo-modal">
            <div className="modal-header">
              <h3>Загрузка фотографии</h3>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>

            <div className="modal-body">
              {!selectedImage ? (
                <div className="upload-area">
                  <label className="upload-label">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                    />
                    <div className="upload-content">
                      <span className="upload-icon">📁</span>
                      <p>Выберите фотографию</p>
                      <p className="upload-hint-text">или перетащите файл сюда</p>
                    </div>
                  </label>
                </div>
              ) : (
                <div className="crop-container" ref={containerRef}>
                  <img
                    ref={imageRef}
                    src={selectedImage}
                    alt="Для обрезки"
                    className="crop-image"
                    onLoad={() => {}}
                  />
                  <div
                    className="crop-overlay"
                    onMouseDown={(e) => handleMouseDown(e, 'move')}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    style={{
                      position: 'absolute',
                      left: `${cropArea.x}%`,
                      top: `${cropArea.y}%`,
                      width: `${cropArea.width}%`,
                      height: `${cropArea.height}%`,
                      border: '2px solid #fff',
                      boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.5)',
                      cursor: 'move',
                    }}
                  >
                    {/* Углы для изменения размера */}
                    <div
                      className="resize-handle nw"
                      onMouseDown={(e) => handleMouseDown(e, 'resize', 'nw')}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        left: '-4px',
                        width: '8px',
                        height: '8px',
                        background: '#fff',
                        cursor: 'nw-resize',
                      }}
                    />
                    <div
                      className="resize-handle ne"
                      onMouseDown={(e) => handleMouseDown(e, 'resize', 'ne')}
                      style={{
                        position: 'absolute',
                        top: '-4px',
                        right: '-4px',
                        width: '8px',
                        height: '8px',
                        background: '#fff',
                        cursor: 'ne-resize',
                      }}
                    />
                    <div
                      className="resize-handle sw"
                      onMouseDown={(e) => handleMouseDown(e, 'resize', 'sw')}
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        left: '-4px',
                        width: '8px',
                        height: '8px',
                        background: '#fff',
                        cursor: 'sw-resize',
                      }}
                    />
                    <div
                      className="resize-handle se"
                      onMouseDown={(e) => handleMouseDown(e, 'resize', 'se')}
                      style={{
                        position: 'absolute',
                        bottom: '-4px',
                        right: '-4px',
                        width: '8px',
                        height: '8px',
                        background: '#fff',
                        cursor: 'se-resize',
                      }}
                    />
                  </div>
                  <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>
              )}
            </div>

            <div className="modal-footer">
              {selectedImage && (
                <button className="btn-cancel" onClick={() => setSelectedImage(null)}>
                  Выбрать другое фото
                </button>
              )}
              <button className="btn-close" onClick={closeModal}>Отмена</button>
              {selectedImage && (
                <button className="btn-save" onClick={savePhoto}>
                  Сохранить
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}