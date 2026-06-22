'use client';

import { useState, useRef } from 'react';
import { Camera, X, Image as ImageIcon, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PhotoCaptureProps {
  label: string;
  required?: boolean;
  value?: string;
  onChange: (dataUrl: string | undefined) => void;
  className?: string;
}

export function PhotoCapture({ label, required, value, onChange, className }: PhotoCaptureProps) {
  const [capturing, setCapturing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function startCamera() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCapturing(true);
    } catch {
      fileInputRef.current?.click();
    }
  }

  function capturePhoto() {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(videoRef.current, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
    onChange(dataUrl);
    stopCamera();
  }

  function stopCamera() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCapturing(false);
  }

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
  }

  if (value) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden', className)}>
        <img src={value} alt={label} className="w-full h-32 object-cover rounded-xl" />
        <div className="absolute top-2 right-2 flex gap-1">
          <button
            onClick={() => { onChange(undefined); startCamera(); }}
            className="p-1.5 bg-black/60 rounded-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <RotateCcw size={14} className="text-white" />
          </button>
          <button
            onClick={() => onChange(undefined)}
            className="p-1.5 bg-black/60 rounded-lg backdrop-blur-sm hover:bg-black/80 transition-colors"
          >
            <X size={14} className="text-white" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-green-500/90 rounded text-[10px] font-semibold text-black">
          {label} ✓
        </div>
      </div>
    );
  }

  if (capturing) {
    return (
      <div className={cn('relative rounded-xl overflow-hidden bg-black', className)}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-40 object-cover"
        />
        <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-3">
          <button
            onClick={capturePhoto}
            className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-lg border-4 border-white/50 active:scale-90 transition-transform"
          >
            <div className="w-11 h-11 bg-white rounded-full border-2 border-gray-300" />
          </button>
          <button
            onClick={stopCamera}
            className="p-3 bg-red-500/80 rounded-full backdrop-blur-sm"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <div className={cn(
        'w-full border-2 border-dashed rounded-xl p-3 transition-all',
        required ? 'border-bs-orange/50' : 'border-bs-border'
      )}>
        <button
          onClick={() => fileInputRef.current?.click()}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-bs-surface hover:bg-bs-card transition-colors"
        >
          <ImageIcon size={16} className="text-bs-green" />
          <span className="text-xs text-bs-text-secondary">{label}</span>
        </button>
        {required && <span className="block text-[10px] text-bs-orange text-center mt-1.5">Obligatorio</span>}
      </div>
    </div>
  );
}

interface PhotoGridProps {
  photos: string[];
  onAdd: (dataUrl: string) => void;
  onRemove: (index: number) => void;
  label?: string;
  maxPhotos?: number;
}

export function PhotoGrid({ photos, onAdd, onRemove, label = 'Agregar foto', maxPhotos = 5 }: PhotoGridProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onAdd(reader.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {photos.map((photo, i) => (
        <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
          <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
          <button
            onClick={() => onRemove(i)}
            className="absolute top-1 right-1 p-1 bg-black/60 rounded-lg"
          >
            <X size={12} className="text-white" />
          </button>
        </div>
      ))}
      {photos.length < maxPhotos && (
        <>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="aspect-square border-2 border-dashed border-bs-border rounded-xl flex flex-col items-center justify-center gap-1 hover:border-bs-accent transition-colors"
          >
            <ImageIcon size={18} className="text-bs-text-muted" />
            <span className="text-[9px] text-bs-text-muted">{label}</span>
          </button>
        </>
      )}
    </div>
  );
}
