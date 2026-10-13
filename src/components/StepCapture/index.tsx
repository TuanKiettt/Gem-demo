
import { useEffect, useRef, useState } from "react";
import Cropper, { type ReactCropperElement } from "react-cropper";
import "cropperjs/dist/cropper.css";
import { uploadImage } from "../../api/uploadImage";
import { ArrowUp, Check, FocusIcon, X } from "lucide-react";

type PhotoSource = "upload" | "camera";

interface StepCaptureProps {
  onNext: () => void;
  preview: string | null;
  uploadedImageUrl: string | null;
  photoSource: PhotoSource | null;
  onImageUploaded: (
    preview: string | null,
    uploadedImageUrl: string | null,
    photoSource: PhotoSource | null,
  ) => void;
}

export function StepCapture({
  onNext,
  preview,
  uploadedImageUrl,
  photoSource,
  onImageUploaded,
}: StepCaptureProps) {
  const [photo, setPhoto] = useState<string | null>(preview);
  const [file, setFile] = useState<File | null>(null);
  const [storedImageUrl, setStoredImageUrl] = useState<string | null>(
    uploadedImageUrl,
  );
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cropSource, setCropSource] = useState<string | null>(null);

  const galleryRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cropperRef = useRef<ReactCropperElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const cameraRequestRef = useRef(0);
  const countdownTimerRef = useRef<number | null>(null);
  const [countdown, setCountdown] = useState<number | null>(null);

  useEffect(() => {
    if (cameraOpen && videoRef.current && streamRef.current) {
      videoRef.current.setAttribute("webkit-playsinline", "true");
      videoRef.current.srcObject = streamRef.current;
    }
  }, [cameraOpen]);

  useEffect(
    () => () => {
      cameraRequestRef.current += 1;
      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    },
    [],
  );

  useEffect(() => {
    const source = cropSource;
    return () => {
      if (source?.startsWith("blob:")) URL.revokeObjectURL(source);
    };
  }, [cropSource]);

  const stopCamera = () => {
    cameraRequestRef.current += 1;
    if (countdownTimerRef.current !== null) {
      window.clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setCountdown(null);
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCameraOpen(false);
  };

  const openCamera = async () => {
    setError("");
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Trình duyệt không hỗ trợ chụp ảnh trực tiếp. Vui lòng tải ảnh lên.");
      return;
    }

    const requestId = ++cameraRequestRef.current;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: false,
        video: { facingMode: "user" },
      });
      if (requestId !== cameraRequestRef.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
      streamRef.current = stream;
      setCameraOpen(true);
    } catch (cameraError) {
      if (requestId !== cameraRequestRef.current) return;
      console.error("Không thể mở camera:", cameraError);
      setError(
        cameraError instanceof DOMException && cameraError.name === "NotAllowedError"
          ? "Bạn chưa cấp quyền camera. Hãy cho phép truy cập camera trong trình duyệt rồi thử lại."
          : cameraError instanceof DOMException && cameraError.name === "NotFoundError"
            ? "Không tìm thấy camera trên thiết bị này. Vui lòng tải ảnh lên."
            : "Không thể mở camera. Hãy kiểm tra quyền truy cập camera và thử lại.",
      );
    }
  };

  const handleFile = (file: File | undefined, source: PhotoSource) => {
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
    onImageUploaded(nextPreview, null, source);
  };

  const handleGalleryFile = (file?: File) => {
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
    setCropSource(URL.createObjectURL(file));
  };

  const cancelCrop = () => {
    setCropSource(null);
  };

  const applyCrop = async () => {
    const canvas = cropperRef.current?.cropper.getCroppedCanvas({
      width: 768,
      height: 768,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
    if (!canvas) {
      setError("Không thể cắt ảnh. Vui lòng thử lại.");
      return;
    }

    const croppedBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!croppedBlob) {
      setError("Không thể tạo ảnh đã cắt. Vui lòng thử lại.");
      return;
    }

    handleFile(
      new File([croppedBlob], "cropped-photo.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      }),
      "upload",
    );
    cancelCrop();
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
      onImageUploaded(photo, imageUrl, photoSource);
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

  const handleCapture = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      setError("Camera chưa sẵn sàng. Vui lòng thử lại.");
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const context = canvas.getContext("2d");
    if (!context) {
      setError("Không thể chụp ảnh trên thiết bị này. Vui lòng thử lại.");
      return;
    }

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92),
    );
    if (!imageBlob) {
      setError("Không thể tạo ảnh chụp. Vui lòng thử lại.");
      return;
    }

    handleFile(
      new File([imageBlob], "camera-capture.jpg", {
        type: "image/jpeg",
        lastModified: Date.now(),
      }),
      "camera",
    );
    stopCamera();
  };

  const startCaptureCountdown = () => {
    if (countdown !== null || countdownTimerRef.current !== null) return;

    let remaining = 3;
    setCountdown(remaining);
    countdownTimerRef.current = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        setCountdown(remaining);
        return;
      }

      if (countdownTimerRef.current !== null) {
        window.clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
      }
      setCountdown(null);
      void handleCapture();
    }, 1000);
  };

  const goldButton =
    "flex min-h-12 items-center justify-center gap-2 rounded-full border border-[#D9A44F] bg-[#111D48]/80 px-3 text-xs font-bold text-white transition hover:bg-white/10 active:scale-[0.98] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <main>
      {/* Transparent blue overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 bg-linear-to-b from-[#0C1636]/40 via-[#0C1636]/25 to-[#23409C]/35"
      />

      {/* Main content */}
      <section
        className={`mx-auto flex min-h-dvh w-full max-w-lg flex-col px-5 pb-6 pt-5 ${
          cropSource ? "hidden" : ""
        }`}
      >

        {/* Heading */}
        <header className="shrink-0 text-center">
          <h1 className="font-serif text-[clamp(1.5625rem,7vw,2.125rem)] leading-tight tracking-wide text-[#FFF7ED]">
            CHỌN HOẶC CHỤP ẢNH
          </h1>

          <p className="mt-2 text-xs leading-5 text-[#C0C9DD]">
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
            handleGalleryFile(event.target.files?.[0]);
            event.currentTarget.value = "";
          }}
        />

        {/* Upload area */}
        <div className="mt-3 flex min-h-62.5 flex-1 flex-col items-center justify-center rounded-3xl border border-dashed border-[#D7A15B] bg-[#101A35]/75 px-4 py-5">
          <div className="relative aspect-square w-[min(75vw,15.625rem)] shrink-0 overflow-hidden rounded-full bg-[#39323A] text-[#DFA45F]">
            {cameraOpen ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  disablePictureInPicture
                  aria-label="Hình ảnh camera trực tiếp"
                  className="pointer-events-none absolute inset-0 h-full w-full scale-x-[-1] object-cover"
                />
                {countdown !== null && (
                  <div
                    className="pointer-events-none absolute inset-0 flex items-center justify-center bg-black/20"
                    aria-live="assertive"
                    aria-label={`Chụp ảnh sau ${countdown} giây`}
                  >
                    <span
                      key={countdown}
                      className="animate-[capture-countdown_1s_ease-out] text-6xl font-black tabular-nums text-white drop-shadow-[0_0.25rem_0.75rem_rgba(0,0,0,0.8)]"
                    >
                      {countdown}
                    </span>
                  </div>
                )}
              </>
            ) : (
              <button
                type="button"
                onClick={() => galleryRef.current?.click()}
                disabled={photoSource === "camera"}
                aria-label={photo ? "Thay đổi ảnh" : "Chọn ảnh"}
                className="flex h-full w-full items-center justify-center transition hover:ring-2 hover:ring-[#D7A15B]/60"
              >
                {photo ? (
                  <img
                    src={photo}
                    alt="Ảnh xem trước"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div>
                    <h1 className="text-5xl">+</h1>
                  </div>
                )}
              </button>
            )}
          </div>

          {cropSource ? (
            <div className="mt-4 flex flex-col items-center gap-10">
              <p className="text-center text-xs leading-5 text-[#B9C2D5]">
                Kéo ảnh để đổi vị trí. Cuộn chuột để thu phóng trên máy tính
                hoặc chụm hai ngón tay trên điện thoại.
              </p>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={cancelCrop}
                  className="min-h-10 rounded-full border border-white/40 px-5 text-xs font-bold text-white transition hover:bg-white/10"
                >
                  HỦY
                </button>
                <button
                  type="button"
                  onClick={() => void applyCrop()}
                  className="min-h-10 rounded-full border border-[#FFF5EA]/80 px-5 text-xs font-bold text-[#160D08] shadow transition hover:brightness-110"
                  style={{
                    background:
                      "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
                  }}
                >
                  DÙNG ẢNH NÀY
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="mt-4 max-w-62.5 text-center text-xs leading-5 text-[#B9C2D5]">
                Ưu tiên ảnh rõ mặt, đủ sáng và nhìn thẳng vào camera.
              </p>

              {photo && !cameraOpen && (
                <button
                  type="button"
                  onClick={() => {
                    if (photo?.startsWith("blob:")) URL.revokeObjectURL(photo);
                    setPhoto(null);
                    setFile(null);
                    setStoredImageUrl(null);
                    onImageUploaded(null, null, null);
                  }}
                  className="mt-2 text-xs text-[#E9B95F] underline underline-offset-4"
                >
                  Xóa ảnh
                </button>
              )}
            </>
          )}
        </div>

        {/* Upload / Camera buttons */}
        {!cropSource && (
          <div className="mt-5 grid shrink-0 grid-cols-2 gap-3">
            {cameraOpen ? (
              <>
                <button
                  type="button"
                  onClick={stopCamera}
                  className={goldButton}
                >
                  QUAY LẠI
                </button>
                <button
                  type="button"
                  onClick={startCaptureCountdown}
                  disabled={countdown !== null}
                  className={goldButton}
                >
                  CHỤP ẢNH
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                  disabled={photoSource === "camera"}
                  className={goldButton}
                >
                  <span aria-hidden="true"><ArrowUp className="w-4 h-4"/></span>
                  {photo ? "Tải ảnh khác" : "Tải ảnh lên"}
                </button>

                <button
                  type="button"
                  onClick={() => void openCamera()}
                  disabled={photoSource === "upload"}
                  className={goldButton}
                >
                  <span aria-hidden="true"><FocusIcon className="w-4 h-4"/></span>
                  {photo ? "Chụp lại" : "Chụp ảnh"}
                </button>
              </>
            )}
          </div>
        )}

        {/* Validation */}
        {error && (
          <p role="alert" className="mt-3 text-center text-xs text-red-200">
            {error}
          </p>
        )}

        {/* Continue button */}
        <div className="mt-6 flex shrink-0 justify-center">
          <button
            type="button"
            onClick={() => void handleContinue()}
            disabled={!photo || uploading || Boolean(cropSource)}
            className="w-[min(100%,17.5rem)] rounded-full border border-[#FFF5EA]/80 px-5 py-3 text-sm font-bold tracking-wide text-[#160D08] shadow-lg transition hover:brightness-110 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
            style={{
              background:
                "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
            }}
          >
            {uploading ? "ĐANG TẢI ẢNH..." : "TIẾP TỤC"}
          </button>
        </div>
      </section>
      {cropSource && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/75 p-2">
          <div className="flex h-full max-h-[90dvh] w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#D7A15B]/70 bg-[#101A35] shadow-2xl">
            <header className="relative flex h-16 shrink-0 items-center justify-center border-b border-white/10 px-16">
              <button
                type="button"
                onClick={cancelCrop}
                aria-label="Đóng cắt ảnh"
                className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-500 text-white shadow transition hover:bg-red-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <X aria-hidden="true" className="h-6 w-6" />
              </button>
              <h2 className="text-lg font-bold tracking-wide text-[#FFF7ED]">
                Cắt ảnh
              </h2>
            </header>

            <div className="min-h-0 flex-1 bg-[#858585]">
              <Cropper
                ref={cropperRef}
                src={cropSource}
                style={{ height: "100%", width: "100%" }}
                className="capture-cropper"
                aspectRatio={1}
                viewMode={1}
                dragMode="move"
                cropBoxMovable={false}
                cropBoxResizable={false}
                guides
                center
                highlight={false}
                background={false}
                responsive
                checkOrientation
                ready={(event) => {
                  const cropper = event.currentTarget.cropper;
                  const container = cropper.getContainerData();
                  const canvas = cropper.getCanvasData();
                  const size = Math.min(
                    container.width * 0.76,
                    container.height * 0.76,
                  );

                  cropper.setCropBoxData({
                    left: (container.width - size) / 2,
                    top: (container.height - size) / 2,
                    width: size,
                    height: size,
                  });

                  const scale = Math.max(
                    size / canvas.width,
                    size / canvas.height,
                  );
                  const scaledWidth = canvas.width * scale;
                  const scaledHeight = canvas.height * scale;
                  cropper.setCanvasData({
                    left: (container.width - scaledWidth) / 2,
                    top: (container.height - scaledHeight) / 2,
                    width: scaledWidth,
                    height: scaledHeight,
                  });
                }}
                zoomOnWheel
                zoomOnTouch
                wheelZoomRatio={0.1}
                toggleDragModeOnDblclick={false}
              />
            </div>

            <footer className="shrink-0 border-t border-white/10 px-5 py-4">
              <button
                type="button"
                onClick={() => void applyCrop()}
                className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-[#FFF5EA]/80 px-5 text-sm font-bold tracking-wide text-[#160D08] shadow-lg transition hover:brightness-110 active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                style={{
                  background:
                    "linear-gradient(180deg, #FFF0D9 0%, #D8B18D 25%, #A66D49 75%, #E7C5A2 100%)",
                }}
              >
                <Check aria-hidden="true" className="h-5 w-5" />
                CẮT ẢNH
              </button>
            </footer>
          </div>
        </div>
      )}
    </main>
  );
}
