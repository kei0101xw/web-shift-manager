import request from "supertest";
import app from "../src/app";

describe("authGuard", () => {
  it("未ログインだと /api/v1/shifts は 401/403 になる", async () => {
    const res = await request(app).get("/api/v1/shifts");
    expect([401, 403]).toContain(res.status);
  });
});
