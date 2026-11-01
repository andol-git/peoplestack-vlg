import { useCallback, useState } from 'react';
import { Button, Modal, Slider } from 'antd';
import Cropper, { type Area } from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import { getCroppedImage } from './cropImage';

interface Props {
  imageSrc: string;
  open: boolean;
  onCancel: () => void;
  onSave: (croppedDataUrl: string) => void;
}

export function PhotoCropModal({ imageSrc, open, onCancel, onSave }: Props) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const handleCropComplete = useCallback((_: Area, pixels: Area) => setCroppedAreaPixels(pixels), []);

  async function handleSave() {
    if (!croppedAreaPixels) return;
    const cropped = await getCroppedImage(imageSrc, croppedAreaPixels);
    onSave(cropped);
  }

  return (
    <Modal title="Adjust Photo" open={open} onCancel={onCancel} footer={null} centered>
      <div style={{ position: 'relative', height: 320, background: '#f1f5f9', borderRadius: 8, overflow: 'hidden' }}>
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={1}
          cropShape="round"
          showGrid={false}
          onCropChange={setCrop}
          onZoomChange={setZoom}
          onCropComplete={handleCropComplete}
        />
      </div>
      <div style={{ marginTop: 16 }}>
        <div style={{ marginBottom: 4, fontSize: 12, fontWeight: 500, color: '#475569' }}>Zoom</div>
        <Slider min={1} max={3} step={0.1} value={zoom} onChange={setZoom} />
      </div>
      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button type="primary" onClick={handleSave}>
          Save
        </Button>
      </div>
    </Modal>
  );
}
