import {
  generateOTP,
  saveOTPToRedis,
  verifyOTPFromRedis,
} from "../../utils/otp.utils";
import redis from "../../config/redis";

jest.mock("../../config/redis", () => ({
  setex: jest.fn(),
  get: jest.fn(),
  del: jest.fn(),
}));

describe("OTP Utils", () => {
  test("generateOTP returns exactly 6 digits", () => {
    const otp = generateOTP();
    expect(otp).toHaveLength(6);
    expect(/^\d{6}$/.test(otp)).toBe(true);
  });

  test("saveOTPToRedis calls setex with correct TTL", async () => {
    await saveOTPToRedis("test@test.com", "123456");
    expect(redis.setex).toHaveBeenCalledWith(
      "otp::test@test.com",
      300,
      "123456",
    );
  });

  test("verifyOTPFromRedis returns false when no OTP stored", async () => {
    (redis.get as jest.Mock).mockResolvedValue(null);
    const result = await verifyOTPFromRedis("test@test.com", "123456");
    expect(result).toBe(false);
  });

  test("verifyOTPFromRedis returns true on match and deletes key", async () => {
    (redis.get as jest.Mock).mockResolvedValue("123456");
    const result = await verifyOTPFromRedis("test@test.com", "123456");
    expect(result).toBe(true);
    expect(redis.del).toHaveBeenCalled();
  });

  test("verifyOTPFromRedis returns false on mismatch", async () => {
    (redis.get as jest.Mock).mockResolvedValue("654321");
    const result = await verifyOTPFromRedis("test@test.com", "123456");
    expect(result).toBe(false);
  });
});
