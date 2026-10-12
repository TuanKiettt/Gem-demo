
import { useRef, useState } from "react";
import { uploadImage } from "../../api/uploadImage";

interface StepCaptureProps {
  onNext: () => void;
  onBack?: () => void;
  preview: string | null;
  uploadedImageUrl: string | null;
  onImageUploaded: (
    preview: string | null,
    uploadedImageUrl: string | null,
  ) => void;
}

export function StepCapture({
  onNext,
  onBack,
  preview,
  uploadedImageUrl,
  onImageUploaded,
}: StepCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(preview);
  const [file, setFile] = useState<File | null>(null);
  const [storedImageUrl, setStoredImageUrl] = useState<string | null>(
    uploadedImageUrl,
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);

  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const handleFile = (file?: File) => {
    if (!file) return;

    if (!["image/png", "image/jpeg", "image/gif", "image/webp"].includes(file.type)) {
      setError("Chỉ hỗ trợ ảnh PNG, JPG, GIF hoặc WEBP.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Ảnh phải có dung lượng không quá 5 MB.");
      return;
    }

    setError("");
    if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo);
    const nextPreview = URL.createObjectURL(file);
    setPhoto(nextPreview);
    setFile(file);
    setStoredImageUrl(null);
    onImageUploaded(nextPreview, null);
  };

  const handleContinue = async () => {
    if (!photo) return;
    setError("");

    if (storedImageUrl) {
      onNext();
      return;
    }
    if (!file) {
      setError("Vui lòng chọn lại ảnh trước khi tiếp tục.");
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file);
      setStoredImageUrl(imageUrl);
      onImageUploaded(photo, imageUrl);
      onNext();
    } catch (uploadError) {
      console.error("Không thể tải ảnh lên Supabase Storage:", uploadError);
      setError(
        uploadError instanceof Error
          ? uploadError.message
          : "Không thể tải ảnh lên. Vui lòng thử lại.",
      );
    } finally {
      setUploading(false);
    }
  };

  const goldButton =
    "flex min-h-[48px] items-center justify-center gap-2 rounded-full border border-[#D9A44F] bg-[#111D48]/80 px-3 text-xs font-bold text-white transition hover:bg-white/10 active:scale-[0.98] sm:text-sm";

  return (
    <main>
      {/* Background */}
      {/* Transparent blue overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-[#0C1636]/40 via-[#0C1636]/25 to-[#23409C]/35"
      />

      {/* Main content */}
      <section className="mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-6 pt-5 sm:px-7">
        {/* Back button */}
        <div className="flex h-10 shrink-0 items-center">
          <button
            type="button"
            onClick={onBack}
            aria-label="Quay lại"
            className="flex h-9 w-9 items-center justify-center rounded-full border border-[#D9A44F] text-[#E9B95F] transition hover:bg-white/10"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-5 w-5"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <path
                d="M19 12H5m7 7-7-7 7-7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </div>

        {/* Heading */}
        <header className="mt-5 shrink-0 text-center sm:mt-7">
          <h1 className="font-serif text-[clamp(25px,7vw,34px)] leading-tight tracking-wide text-[#FFF7ED]">
            TẢI ẢNH CỦA BẠN
          </h1>

          <p className="mt-2 text-xs leading-5 text-[#C0C9DD] sm:text-sm">
            Ảnh của bạn sẽ được sử dụng để tạo thiệp mời
          </p>
        </header>

        {/* Hidden file inputs */}
        <input
          ref={galleryRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />

        <input
          ref={cameraRef}
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          capture="user"
          className="hidden"
          onChange={(event) => {
            handleFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />

        {/* Upload area */}
        <div className="mt-7 flex min-h-[250px] flex-1 flex-col items-center justify-center rounded-[24px] border border-dashed border-[#D7A15B] bg-[#101A35]/75 px-4 py-5 sm:mt-8">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            aria-label={photo ? "Thay đổi ảnh" : "Chọn ảnh"}
            className="relative flex aspect-square w-[min(58vw,190px)] shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#39323A] text-[#DFA45F] transition hover:ring-2 hover:ring-[#D7A15B]/60"
          >
            {photo ? (
              <img
                src={photo}
                alt="Ảnh xem trước"
                className="h-full w-full object-cover"
              />
            ) : (
              <svg
                viewBox="0 0 48 48"
                fill="none"
                className="h-10 w-10"
                stroke="currentColor"
                strokeWidth="3"
              >
                <path
                  d="M24 11v26M11 24h26"
                  strokeLinecap="round"
                />
              </svg>
            )}
          </button>

          <p className="mt-4 max-w-[250px] text-center text-xs leading-5 text-[#B9C2D5]">
            Ưu tiên ảnh rõ mặt, đủ sáng và nhìn thẳng vào camera.
          </p>

          <p className="mt-5 text-center text-xs font-medium tracking-wide text-[#C0C9DD]">
            {photo ? "ẢNH ĐÃ ĐƯỢC CHỌN" : "CHƯA CÓ ẢNH ĐƯỢC CHỌN"}
          </p>

          {photo && (
            <button
              type="button"
              onClick={() => {
                if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo);
                setPhoto(null);
                setFile(null);
                setStoredImageUrl(null);
                onImageUploaded(null, null);
              }}
              className="mt-2 text-xs text-[#E9B95F] underline underline-offset-4"
            >
              Xóa ảnh
            </button>
          )}
        </div>

        {/* Upload / Camera buttons */}
        <div className="mt-5 grid shrink-0 grid-cols-2 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => galleryRef.current?.click()}
            className={goldButton}
          >
            <span aria-hidden="true">↑</span>
            Tải ảnh lên
          </button>

          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className={goldButton}
          >
            <span aria-hidden="true">◎</span>
            Chụp ảnh
          </button>
        </div>

        {/* Validation */}
        {error && (
          <p role="alert" className="mt-3 text-center text-xs text-red-200">
            {error}
          </p>
        )}

        {/* Continue button */}
        <div className="mt-6 flex shrink-0 justify-center sm:mt-8">
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={!photo || uploading}
            className="w-[min(100%,280px)] rounded-full border border-[#FFF5EA]/80 px-5 py-3 text-sm font-bold tracking-wide text-[#160D08] shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
            }}
          >
            {uploading ? "ĐANG TẢI ẢNH..." : "TIẾP TỤC"}
          </button>
        </div>
      </section>
    </main>
  );
}
