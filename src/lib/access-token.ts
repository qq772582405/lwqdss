export type AccessTokenExtractionResult =
  | { token: string }
  | { error: string };

export function extractAccessToken(
  input: string,
): AccessTokenExtractionResult {
  const match = input.match(/"accessToken"\s*:\s*"([^"]+)"/);

  if (!match?.[1]) {
    return {
      error: "未找到 accessToken 字段",
    };
  }

  return {
    token: match[1],
  };
}
