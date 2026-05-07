import { useRef, useState } from 'react';
import { FiImage, FiSend, FiX } from 'react-icons/fi';

type MessageInputProps = {
  value: string;
  error: string;
  sendingImage: boolean;
  onChange: (value: string) => void;
  onSendMessage: () => void;
  onUploadImage: (file: File, content?: string) => void;
  onTypingStart: () => void;
  onTypingStop: () => void;
};

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;

const MessageInput = ({
  value,
  error,
  sendingImage,
  onChange,
  onSendMessage,
  onUploadImage,
  onTypingStart,
  onTypingStop,
}: MessageInputProps) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const typingTimerRef = useRef<number | null>(null);

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedImagePreview, setSelectedImagePreview] = useState<string | null>(
    null
  );
  const [localError, setLocalError] = useState('');

  const handleChooseImage = () => {
    fileInputRef.current?.click();
  };

  const clearSelectedImage = () => {
    if (selectedImagePreview) {
      URL.revokeObjectURL(selectedImagePreview);
    }

    setSelectedImage(null);
    setSelectedImagePreview(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setLocalError('');

    if (!file.type.startsWith('image/')) {
      setLocalError('Chỉ được chọn file ảnh');
      e.target.value = '';
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setLocalError('Ảnh không được vượt quá 10MB');
      e.target.value = '';
      return;
    }

    clearSelectedImage();

    setSelectedImage(file);
    setSelectedImagePreview(URL.createObjectURL(file));

    e.target.value = '';
  };

  const handleChange = (nextValue: string) => {
    onChange(nextValue);
    onTypingStart();

    if (typingTimerRef.current) {
      window.clearTimeout(typingTimerRef.current);
    }

    typingTimerRef.current = window.setTimeout(() => {
      onTypingStop();
    }, 900);
  };

  const handleSend = () => {
    if (selectedImage) {
      onUploadImage(selectedImage, value.trim() || undefined);
      clearSelectedImage();
      onChange('');
      onTypingStop();
      return;
    }

    onSendMessage();
    onTypingStop();
  };

  return (
    <div className="border-t border-slate-200 bg-white px-4 py-3">
      {(error || localError) && (
        <div className="mb-3 rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
          {error || localError}
        </div>
      )}

      {selectedImagePreview && (
        <div className="mb-3 flex items-end gap-3">
          <div className="relative">
            <img
              src={selectedImagePreview}
              alt="preview"
              className="h-28 w-28 rounded-2xl object-cover shadow-sm"
            />

            <button
              type="button"
              onClick={clearSelectedImage}
              className="absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white shadow"
            >
              <FiX size={16} />
            </button>
          </div>

          <div className="text-sm text-slate-500">
            Ảnh đã sẵn sàng. Nhấn gửi để gửi ảnh.
          </div>
        </div>
      )}

      <div className="flex items-end gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <button
          type="button"
          onClick={handleChooseImage}
          disabled={sendingImage}
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600 transition hover:bg-blue-100 disabled:opacity-60"
          title="Gửi ảnh"
        >
          <FiImage size={20} />
        </button>

        <div className="flex min-h-11 flex-1 items-end rounded-3xl bg-slate-100 px-4 py-2 transition focus-within:ring-4 focus-within:ring-blue-100">
          <textarea
            value={value}
            onChange={(e) => handleChange(e.target.value)}
            placeholder="Aa"
            rows={1}
            className="max-h-32 min-h-7 flex-1 resize-none bg-transparent py-1 text-sm text-slate-800 outline-none placeholder:text-slate-400"
            onBlur={onTypingStop}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sendingImage || (!value.trim() && !selectedImage)}
          className="mb-1 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300"
          title="Gửi"
        >
          <FiSend size={18} />
        </button>
      </div>

      <p className="mt-2 px-14 text-xs text-slate-400">
        Enter để gửi, Shift + Enter để xuống dòng
      </p>
    </div>
  );
};

export default MessageInput;