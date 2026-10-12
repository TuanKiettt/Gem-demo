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
  "Use the uploaded image as the only identity reference. Create a realistic professional studio portrait of the exact same person wearing a traditional Vietnamese Áo Dài. Preserve the original face, facial features, skin tone, hairstyle, hair color, head shape, body proportions, and physique exactly. Do not beautify, reshape, slim, or change the identity. Use an elegant, authentic Áo Dài with realistic fabric and natural folds. Simple graceful standing pose, natural hands. Pure white seamless studio background, soft professional lighting, natural skin tones, sharp facial details, realistic hair and fabric texture, high-end DSLR photography quality.";

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
): Promise<string> =>
  new Promise((resolve, reject) => {
    let finished = false;
    let initialReadStarted = false;
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
      if (status === "SUBSCRIBED" && !initialReadStarted) {
        initialReadStarted = true;
        void (async () => {
          try {
            const { data: service, error } =
              await supabase.functions.invoke<unknown>(
                `private/read_service?id=${encodeURIComponent(id)}`,
                { method: "GET" },
              );
            if (error) throw error;

            await handleServiceUpdate(service);
          } catch (error: unknown) {
            logAiError("reading initial service status", error, {
              serviceId: id,
            });
            complete(
              error instanceof Error
                ? error
                : new Error("Không thể đọc trạng thái service AI."),
            );
          }
        })();
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

export async function generateInvitation({
  fullName,
  gender,
  experienceTime,
  uploadedImageUrl,
}: GenerateInvitationArgs): Promise<string> {
  let stage = "validating uploaded image";
  if (!uploadedImageUrl) {
    const error = new Error("Không tìm thấy URL ảnh đã tải lên.");
    logAiError(stage, error);
    throw error;
  }

  try {
    stage = "creating AI service";
    const { data: createdService, error: createError } =
      await supabase.functions.invoke<unknown>("private/create_service", {
        body: {
          service: "hub",
          realtime: true,
          data: {
            StyleName: "prompt",
            Gender: gender === "NAM" ? "male" : "female",
            FullName: fullName,
            ExperienceTime: experienceTime,
            BrandName: "invitation",
            SourceImageUrl: uploadedImageUrl,
            TargetImageUrl: "",
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
    const generatedMediaUrl = await waitForGeneratedImage(serviceId);
    return generatedMediaUrl;
  } catch (error) {
    logAiError(stage, error);
    throw error instanceof Error
      ? error
      : new Error("Không thể tạo thiệp bằng AI. Vui lòng thử lại.");
  }
}
