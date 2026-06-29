import { User } from "../../models/User.model";

describe("User Model — Password Handling", () => {
  test("password gets hashed on save", async () => {
    const user = await User.create({
      name: "Test User",
      email: "hash@test.com",
      password: "Password@123",
      isVerified: true,
    });

    expect(user.password).not.toBe("Password@123");
    expect(user.password.startsWith("$2")).toBe(true); // bcrypt prefix
  });

  test("comparePassword validates correct password", async () => {
    const user = await User.create({
      name: "Test",
      email: "compare@test.com",
      password: "Password@123",
      isVerified: true,
    });

    const isMatch = await user.comparePassword("Password@123");
    expect(isMatch).toBe(true);
  });

  test("comparePassword rejects wrong password", async () => {
    const user = await User.create({
      name: "Test",
      email: "wrong@test.com",
      password: "Password@123",
      isVerified: true,
    });

    const isMatch = await user.comparePassword("WrongOne@123");
    expect(isMatch).toBe(false);
  });

  test("duplicate email is rejected by unique index", async () => {
    await User.create({
      name: "First",
      email: "dup@test.com",
      password: "Password@123",
      isVerified: true,
    });

    await expect(
      User.create({
        name: "Second",
        email: "dup@test.com",
        password: "Password@456",
        isVerified: true,
      }),
    ).rejects.toThrow();
  });
});
