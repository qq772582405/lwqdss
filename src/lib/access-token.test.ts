import { extractAccessToken } from "@/lib/access-token";

describe("extractAccessToken", () => {
  it("extracts the full token value from the accessToken field", () => {
    const input = `{"foo":"bar","accessToken":"eyJhbGciOiJSUzI1NiIsImtpZCI6IkFCQyIsInR5cCI6IkpXVCJ9.payload.signature","other":"value"}`;

    expect(extractAccessToken(input)).toEqual({
      token: "eyJhbGciOiJSUzI1NiIsImtpZCI6IkFCQyIsInR5cCI6IkpXVCJ9.payload.signature",
    });
  });

  it("returns a readable error when the field does not exist", () => {
    expect(extractAccessToken('{"foo":"bar"}')).toEqual({
      error: "未找到 accessToken 字段",
    });
  });
});
