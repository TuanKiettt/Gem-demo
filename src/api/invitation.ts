import { supabase } from "../lib/supabase";

interface GenerateInvitationArgs {
  fullName: string;
  gender: "NAM" | "NỮ";
  experienceTime: string;
  uploadedImageUrl: string | null;
}

interface ServiceRecord {
  status: string;
  response?: unknown;
}

export interface InvitationGenerationProgress {
  progress: number | null;
  message: string;
}

const GENERATION_TIMEOUT_MS = 200_000;
const IN_PROGRESS_STATUSES = new Set([
  "start",
  "pending",
  "queued",
  "processing",
  "running",
  "in_progress",
  "in progress",
]);
const FAILURE_STATUSES = new Set([
  "error",
  "failed",
  "failure",
  "cancelled",
  "canceled",
]);
const GENERATION_PROMPT =
"Use the uploaded user photo as the ONLY identity reference. Transform the person into a high-end futuristic fashion portrait while preserving her exact facial identity. FACE & IDENTITY Preserve the person’s original facial features, face shape, eyes, nose, lips, jawline, hairstyle, hair color, and recognizable identity. No face blending or identity alteration. Regardless of the original photo angle, generate a natural front-facing or slightly angled fashion portrait with clear facial visibility, direct or near-direct eye contact, and a subtle confident expression. Apply subtle professional makeup and refined beauty retouching. Conceal blemishes, dark circles, and uneven skin tone. Create smoother, healthier-looking skin while preserving realistic skin texture and natural facial details. Enhance the overall look with a polished, elegant, editorial beauty finish without making the face look artificial or overly beautified. FASHION & OUTFIT Generate a unique, randomized high-fashion womenswear outfit with a luxurious black-and-silver editorial aesthetic. The outfit should feel modern, stylish, sleek, feminine, premium, and slightly futuristic. Use black and metallic silver as the dominant palette. Allow creative variation in the clothing design for each generation, as long as the overall mood and tone remain sophisticated, fashionable, and luxury editorial. The outfit may include elegant tailoring, soft futuristic structure, subtle metallic details, clean lines, or refined sculptural elements. It should feel wearable and fashion-forward, not bizarre, costume-like, theatrical, or overly sci-fi. BODY & POSE Generate a half-body fashion portrait framed from the top of the head to the waist or upper hips. If the uploaded photo only shows the face, naturally reconstruct the body with realistic anatomy and balanced proportions. Allow a randomized fashion pose that feels natural, elegant, and editorial. The pose may be front-facing or slightly angled, with relaxed shoulders, a confident posture, and subtle model-like attitude. Keep the pose visually appealing and premium, but not exaggerated, awkward, or unusual. Maintain a slim, elegant, well-proportioned feminine silhouette. Keep the person centered in the frame with enough space around the head and shoulders. LIGHTING & QUALITY Professional luxury fashion editorial photography, soft cinematic studio lighting, refined contrast, realistic skin tones, premium fabric and metallic textures, sharp facial details, and photorealistic DSLR image quality. BACKGROUND & OUTPUT Completely remove the original background. Generate a clean cutout with a fully transparent background and true alpha channel. No background, gradients, environmental elements, or cast shadows. Output a high-resolution vertical PNG with a 3:4 aspect ratio. STRICT PRIORITIES 1. Preserve the exact identity from the uploaded photo. 2. Natural beauty retouching without changing identity. 3. Randomized black-and-silver futuristic high-fashion womenswear that stays elegant and not strange. 4. Randomized pose that feels natural, stylish, and editorial. 5. Fully transparent background. The final result must look like an authentic luxury fashion campaign portrait, not an AI-generated illustration."

type JsonObject = Record<string, unknown>;

const logAiError = (
  stage: string,
  error: unknown,
  metadata: Record<string, string | number | boolean | null> = {},
) => {
  console.error("[AI invitation] Failed", {
    stage,
    message: error instanceof Error ? error.message : String(error),
    ...metadata,
  });
};

const isObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const parseResponse = (text: string): unknown => {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};

const getErrorMessage = (value: unknown, fallback: string): string => {
  if (typeof value === "string" && value.trim()) return value;
  if (isObject(value) && typeof value.error === "string") return value.error;
  if (isObject(value) && typeof value.message === "string") return value.message;
  return fallback;
};

const getNestedObjects = (value: unknown): JsonObject[] => {
  if (!isObject(value)) return [];
  const nested = [value.data, value.service, value.result]
    .filter(isObject);
  return [value, ...nested];
};

const findServiceId = (value: unknown): string | null => {
  for (const object of getNestedObjects(value)) {
    if (typeof object.id === "string" && object.id.length > 0) {
      return object.id;
    }
  }
  return null;
};

const findServiceRecord = (value: unknown): ServiceRecord | null => {
  for (const object of getNestedObjects(value)) {
    if (typeof object.status === "string") {
      return {
        status: object.status,
        response: object.response,
      };
    }
  }
  return null;
};

const getReportedProgress = (value: unknown): number | null => {
  const objects = getNestedObjects(value).flatMap((object) =>
    isObject(object.response)
      ? [object, ...getNestedObjects(object.response)]
      : [object],
  );

  for (const object of objects) {
    for (const field of ["progress", "percentage", "percent"]) {
      const value = object[field];
      const progress =
        typeof value === "number"
          ? value
          : typeof value === "string" && value.trim()
            ? Number(value)
            : Number.NaN;
      if (Number.isFinite(progress) && progress >= 0 && progress <= 100) {
        return Math.round(progress);
      }
    }
  }

  return null;
};

const getProgressMessage = (status: string): string => {
  switch (status.trim().toLowerCase()) {
    case "start":
    case "pending":
    case "queued":
      return "Yêu cầu đã được tiếp nhận. Đang chờ AI xử lý...";
    case "processing":
    case "running":
    case "in_progress":
    case "in progress":
      return "AI đang xử lý ảnh của bạn...";
    default:
      return `Tiến trình AI: ${status}`;
  }
};

const getMediaUrl = (value: unknown): string | null => {
  if (typeof value === "string") {
    try {
      const url = new URL(value);
      return url.protocol === "https:" || url.protocol === "http:"
        ? url.toString()
        : null;
    } catch {
      const parsed = parseResponse(value);
      return parsed === value ? null : getMediaUrl(parsed);
    }
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const url = getMediaUrl(item);
      if (url) return url;
    }
    return null;
  }

  if (!isObject(value)) return null;

  const imageFields = [
    "image_url",
    "imageUrl",
    "generated_image_url",
    "generatedImageUrl",
    "target_image_url",
    "TargetImageUrl",
    "output_url",
    "url",
  ];
  for (const field of imageFields) {
    if (field in value) {
      const url = getMediaUrl(value[field]);
      if (url) return url;
    }
  }

  for (const field of ["data", "output", "result", "images", "image", "response"]) {
    if (field in value) {
      const url = getMediaUrl(value[field]);
      if (url) return url;
    }
  }

  return null;
};

const waitForGeneratedImage = (
  id: string,
  onProgress?: (progress: InvitationGenerationProgress) => void,
): Promise<string> =>
  new Promise((resolve, reject) => {
    let finished = false;
    const channel = supabase
      .channel(`invitation-service-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service",
          filter: `id=eq.${id}`,
        },
        ({ new: row }) => {
          void handleServiceUpdate(row);
        },
      );

    const timeout = window.setTimeout(() => {
      logAiError("waiting for AI result", "Timed out", {
        serviceId: id,
        timeoutMs: GENERATION_TIMEOUT_MS,
      });
      complete(
        new Error(
          "Đã chờ AI quá thời gian cho phép. Hãy kiểm tra workflow AI và việc gọi private/update_service.",
        ),
      );
    }, GENERATION_TIMEOUT_MS);

    const cleanup = () => {
      window.clearTimeout(timeout);
      void supabase.removeChannel(channel);
    };

    const complete = (error?: Error, imageUrl?: string) => {
      if (finished) return;
      finished = true;
      cleanup();
      if (error) reject(error);
      else if (imageUrl) resolve(imageUrl);
      else reject(new Error("Service AI hoàn tất nhưng không có URL media kết quả."));
    };

    const handleServiceUpdate = async (value: unknown) => {
      if (finished) return;
      const record = findServiceRecord(value);
      if (!record) {
        console.warn("[AI invitation] Service update has no status field", {
          serviceId: id,
          responseFields: isObject(value) ? Object.keys(value) : [],
        });
        return;
      }

      const status = record.status.trim().toLowerCase();
      onProgress?.({
        progress: getReportedProgress(value),
        message: getProgressMessage(record.status),
      });

      if (IN_PROGRESS_STATUSES.has(status)) {
        return;
      }

      if (FAILURE_STATUSES.has(status)) {
        logAiError("AI service processing", record.response ?? record.status, {
          serviceId: id,
          status: record.status,
        });
        complete(
          new Error(
            getErrorMessage(record.response, "Dịch vụ AI xử lý ảnh thất bại."),
          ),
        );
        return;
      }

      const mediaUrl = getMediaUrl(record.response);
      if (mediaUrl) {
        onProgress?.({
          progress: 100,
          message: "Đã tạo xong thiệp mời!",
        });
        complete(undefined, mediaUrl);
        return;
      }

      complete(
        new Error(
          `AI đã hoàn tất (status: ${record.status}) nhưng response không chứa URL media. Hãy kiểm tra cấu trúc response của update_service.`,
        ),
      );
    };

    channel.subscribe((status) => {
      if (status === "SUBSCRIBED") {
        onProgress?.({
          progress: null,
          message: "Đã kết nối với AI. Đang chờ cập nhật tiến trình...",
        });
      } else if (
        ["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)
      ) {
        logAiError("connecting to Supabase Realtime", status, {
          serviceId: id,
        });
        complete(
          new Error(
            `Không thể kết nối Supabase Realtime (${status}). Kiểm tra cấu hình Realtime cho bảng service.`,
          ),
        );
      }
    });
  });

export async function generateInvitation(
  {
    fullName,
    gender,
    experienceTime,
    uploadedImageUrl,
  }: GenerateInvitationArgs,
  onProgress?: (progress: InvitationGenerationProgress) => void,
): Promise<string> {
  let stage = "validating uploaded image";
  if (!uploadedImageUrl) {
    const error = new Error("Không tìm thấy URL ảnh đã tải lên.");
    logAiError(stage, error);
    throw error;
  }

  try {
    stage = "creating AI service";
    onProgress?.({
      progress: null,
      message: "Đang gửi yêu cầu tạo thiệp đến AI...",
    });
    const { data: createdService, error: createError } =
      await supabase.functions.invoke<unknown>("private/create_service", {
        body: {
          service: "hub",
          realtime: true,
          data: {
            StyleName: "prompt",
            Gender: gender === "NAM" ? "male" : "female",
            FullName: fullName,
            BrandName: "gem",
            SourceImageUrl: uploadedImageUrl,
            TargetImageUrl: "",
            InviteTime: experienceTime,
            Prompt: GENERATION_PROMPT,
          },
        },
      });
    if (createError) {
      throw new Error(`private/create_service: ${createError.message}`);
    }

    const serviceId = findServiceId(createdService);
    if (!serviceId) {
      throw new Error(
        `create_service không trả về id service như mong đợi. Response fields: ${
          isObject(createdService) ? Object.keys(createdService).join(", ") : typeof createdService
        }`,
      );
    }

    stage = "waiting for AI result";
    onProgress?.({
      progress: getReportedProgress(createdService),
      message: "AI đã nhận yêu cầu. Đang chờ tiến trình xử lý...",
    });
    const generatedMediaUrl = await waitForGeneratedImage(serviceId, onProgress);
    return generatedMediaUrl;
  } catch (error) {
    logAiError(stage, error);
    throw error instanceof Error
      ? error
      : new Error("Không thể tạo thiệp bằng AI. Vui lòng thử lại.");
  }
}
