import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";

export type PromissePayment = {
  id: string;
  status: string;
  amountCents: number;
  qrCodeBase64?: string;
  copyPaste?: string;
  paymentLink?: string;
  expiresAt?: string;
};

type PromisseResponse = Record<string, unknown>;

function getPromisseConfig() {
  const apiKey = ENV.promisseApiKey;
  const baseUrl = ENV.promisseApiBaseUrl.replace(/\/$/, "");

  if (!apiKey || !baseUrl) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "O pagamento ainda não está configurado. Tente novamente mais tarde.",
    });
  }

  return { apiKey, baseUrl };
}

function asRecord(value: unknown): PromisseResponse {
  return value && typeof value === "object" ? value as PromisseResponse : {};
}

function asString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizePayment(payload: unknown, fallbackAmountCents?: number): PromissePayment {
  const root = asRecord(payload);
  const transaction = asRecord(root.transaction);
  const qrCode = asRecord(root.qrcode ?? root.qrCode);
  const id = asString(root.id) ?? asString(transaction.id);

  if (!id) {
    throw new TRPCError({
      code: "BAD_GATEWAY",
      message: "O provedor não retornou o identificador da cobrança.",
    });
  }

  const amount = root.amount ?? transaction.amount;
  const amountCents = typeof amount === "number" ? amount : fallbackAmountCents ?? 0;

  return {
    id,
    status: asString(root.status) ?? asString(transaction.status) ?? "pending",
    amountCents,
    qrCodeBase64: asString(root.qrCodeBase64) ?? asString(qrCode.base64) ?? asString(qrCode.data),
    copyPaste: asString(root.copyPaste) ?? asString(root.pixCopiaECola) ?? asString(transaction.copyPaste),
    paymentLink: asString(root.paymentLink) ?? asString(transaction.paymentLink),
    expiresAt: asString(root.expiresAt) ?? asString(transaction.expiresAt),
  };
}

async function promisseRequest(path: string, init: RequestInit) {
  const { apiKey, baseUrl } = getPromisseConfig();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...init,
      headers: {
        Authorization: apiKey,
        "Content-Type": "application/json",
        ...(init.headers ?? {}),
      },
    });
  } catch (error) {
    console.error("[PromissePay] request failed", error);
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Não foi possível conectar ao provedor de pagamento." });
  }

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    console.error("[PromissePay] provider rejected request", response.status, asRecord(payload).message ?? "unknown error");
    throw new TRPCError({ code: "BAD_REQUEST", message: "O provedor não aceitou a cobrança. Confira o valor e tente novamente." });
  }

  return payload;
}

export async function createPromissePix(amountCents: number) {
  const payload = await promisseRequest("/transactions", {
    method: "POST",
    body: JSON.stringify({ amount: amountCents }),
  });
  return normalizePayment(payload, amountCents);
}

export async function getPromissePayment(transactionId: string) {
  const payload = await promisseRequest(`/transactions/${encodeURIComponent(transactionId)}`, { method: "GET" });
  return normalizePayment(payload);
}
