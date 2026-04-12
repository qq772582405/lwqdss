import { NextResponse } from "next/server";
import {
  formatSubmittedAt,
  submitRedeemRequest,
  validateRedeemInput,
} from "@/lib/redeem";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  let payload: { email?: string; code?: string };

  try {
    payload = (await request.json()) as { email?: string; code?: string };
  } catch {
    return NextResponse.json(
      {
        success: false,
        submittedAt: formatSubmittedAt(new Date()),
        email: "",
        code: "",
        title: "参数错误",
        message: "请求体格式不正确，请刷新页面后重试。",
      },
      { status: 400 },
    );
  }

  const input = {
    email: payload.email ?? "",
    code: payload.code ?? "",
  };
  const fieldErrors = validateRedeemInput(input);

  if (Object.keys(fieldErrors).length > 0) {
    return NextResponse.json(
      {
        success: false,
        submittedAt: formatSubmittedAt(new Date()),
        email: input.email.trim(),
        code: input.code.trim(),
        title: "参数错误",
        message: Object.values(fieldErrors)[0],
      },
      { status: 400 },
    );
  }

  const result = await submitRedeemRequest(input);

  return NextResponse.json(result, {
    status: result.success ? 200 : 400,
  });
}
