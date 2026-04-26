const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const authService = require("../../src/modules/auth/auth.service");
const ApiError = require("../../src/common/errors/ApiError");
const User = require("../../src/models/user.model");
const Tenant = require("../../src/models/tenant.model");
const RefreshToken = require("../../src/models/refreshToken.model");
const tokenService = require("../../src/services/token.service");
const auditService = require("../../src/services/audit.service");
const notificationAdapter = require("../../src/modules/notifications/notification.adapter");

jest.mock("bcrypt");
jest.mock("jsonwebtoken");
jest.mock("../../src/models/user.model");
jest.mock("../../src/models/tenant.model");
jest.mock("../../src/models/refreshToken.model");
jest.mock("../../src/services/token.service");
jest.mock("../../src/services/audit.service");
jest.mock("../../src/modules/notifications/notification.adapter");

describe("auth.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("login", () => {
    it("returns tokens and user on valid credentials", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      const userDoc = {
        _id: "user-1",
        tenantId: "tenant-1",
        roleIds: ["role-1"],
        currentPositionId: "position-1",
        name: "John",
        email: "john@test.com",
        passwordHash: "hashed",
        status: "ACTIVE",
        save,
      };
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(userDoc),
      });
      bcrypt.compare.mockResolvedValue(true);
      tokenService.signAccessToken.mockReturnValue("access-token");
      tokenService.signRefreshToken.mockReturnValue("refresh-token");
      Tenant.findById.mockResolvedValue({ _id: "tenant-1", status: "ACTIVE" });
      RefreshToken.create.mockResolvedValue({ _id: "rt-1" });

      const result = await authService.login({
        email: "john@test.com",
        password: "StrongPass123!",
      });

      expect(result.accessToken).toBe("access-token");
      expect(result.refreshToken).toBe("refresh-token");
      expect(result.user.email).toBe("john@test.com");
      expect(save).toHaveBeenCalledTimes(1);
      expect(auditService.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "AUTH_LOGIN" })
      );
    });

    it("throws 401 when user not found", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.login({ email: "missing@test.com", password: "test12345" })
      ).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
    });

    it("throws 403 when account not active", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          tenantId: "tenant-1",
          status: "OTP_PENDING",
        }),
      });
      Tenant.findById.mockResolvedValue({ _id: "tenant-1", status: "ACTIVE" });

      await expect(
        authService.login({ email: "x@test.com", password: "test12345" })
      ).rejects.toEqual(expect.objectContaining({ statusCode: 403 }));
    });

    it("throws 401 on invalid password", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "u-1",
          tenantId: "tenant-1",
          status: "ACTIVE",
          passwordHash: "hash",
          save: jest.fn().mockResolvedValue(undefined),
        }),
      });
      bcrypt.compare.mockResolvedValue(false);
      Tenant.findById.mockResolvedValue({ _id: "tenant-1", status: "ACTIVE" });

      await expect(
        authService.login({ email: "x@test.com", password: "bad-pass" })
      ).rejects.toEqual(expect.objectContaining({ statusCode: 401 }));
    });
  });

  describe("inviteUser", () => {
    it("creates/upserts user in OTP_PENDING and returns invite payload", async () => {
      User.findOneAndUpdate.mockResolvedValue({
        _id: "user-123",
      });
      notificationAdapter.sendEmail.mockResolvedValue(undefined);

      const result = await authService.inviteUser({
        tenantId: "tenant-1",
        name: "Alice",
        email: "alice@test.com",
        roleIds: ["role-1"],
      });

      expect(result.userId).toBe("user-123");
      expect(result.inviteToken).toHaveLength(64);
      expect(result.otpCode).toMatch(/^\d{6}$/);
      expect(auditService.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "USER_INVITED" })
      );
    });
  });

  describe("verifyOtp", () => {
    it("verifies OTP and persists user", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          inviteExpiry: new Date(Date.now() + 60_000),
          otpExpiry: new Date(Date.now() + 60_000),
          otpCode: "123456",
          otpVerified: false,
          save,
        }),
      });

      const result = await authService.verifyOtp({
        inviteToken: "invite-token",
        otpCode: "123456",
      });

      expect(result).toEqual({ message: "OTP verified" });
      expect(save).toHaveBeenCalledTimes(1);
    });

    it("throws when invite token is invalid", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(
        authService.verifyOtp({ inviteToken: "bad", otpCode: "123456" })
      ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
    });

    it("throws when OTP mismatches", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          inviteExpiry: new Date(Date.now() + 60_000),
          otpExpiry: new Date(Date.now() + 60_000),
          otpCode: "654321",
          save: jest.fn(),
        }),
      });

      await expect(
        authService.verifyOtp({ inviteToken: "good", otpCode: "123456" })
      ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe("setPassword", () => {
    it("sets password and activates account after OTP verification", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "user-1",
          tenantId: "tenant-1",
          otpVerified: true,
          save,
        }),
      });
      bcrypt.hash.mockResolvedValue("new-hash");

      const result = await authService.setPassword({
        inviteToken: "invite",
        password: "StrongPass123!",
      });

      expect(result).toEqual({ message: "Password set successfully" });
      expect(save).toHaveBeenCalledTimes(1);
      expect(auditService.writeAudit).toHaveBeenCalledWith(
        expect.objectContaining({ action: "AUTH_PASSWORD_SET" })
      );
    });

    it("throws when OTP is not verified", async () => {
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          otpVerified: false,
        }),
      });

      await expect(
        authService.setPassword({ inviteToken: "invite", password: "12345678" })
      ).rejects.toEqual(expect.objectContaining({ statusCode: 400 }));
    });
  });

  it("uses ApiError class in failures", async () => {
    User.findOne.mockReturnValue({
      select: jest.fn().mockResolvedValue(null),
    });

    try {
      await authService.login({ email: "none@test.com", password: "12345678" });
    } catch (error) {
      expect(error).toBeInstanceOf(ApiError);
    }
  });

  describe("refresh", () => {
    it("rotates refresh token", async () => {
      jwt.verify.mockReturnValue({ userId: "u1" });
      RefreshToken.findOne.mockResolvedValue({ revokedAt: null, save: jest.fn().mockResolvedValue(undefined) });
      User.findById.mockResolvedValue({
        _id: "u1",
        tenantId: "t1",
        roleIds: ["r1"],
        currentPositionId: "p1",
        status: "ACTIVE",
      });
      tokenService.signAccessToken.mockReturnValue("new-access");
      tokenService.signRefreshToken.mockReturnValue("new-refresh");
      RefreshToken.create.mockResolvedValue({ _id: "rt2" });

      const result = await authService.refresh({ refreshToken: "old-refresh" });
      expect(result.accessToken).toBe("new-access");
      expect(result.refreshToken).toBe("new-refresh");
    });
  });

  describe("resend/forgot/reset", () => {
    it("resends invite for existing user", async () => {
      User.findOne.mockResolvedValue({
        _id: "u1",
        name: "A",
        email: "a@b.com",
        roleIds: ["r1"],
        currentPositionId: "p1",
      });
      User.findOneAndUpdate.mockResolvedValue({ _id: "u1" });
      notificationAdapter.sendEmail.mockResolvedValue(undefined);

      const result = await authService.resendInvite({ tenantId: "t1", email: "a@b.com" });
      expect(result.message).toBe("Invite resent");
    });

    it("handles forgot password existing user", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({ email: "a@b.com", save }),
      });
      notificationAdapter.sendEmail.mockResolvedValue(undefined);

      const result = await authService.forgotPassword({ email: "a@b.com" });
      expect(result.message).toContain("reset email");
      expect(save).toHaveBeenCalled();
    });

    it("resets password and revokes old refresh tokens", async () => {
      const save = jest.fn().mockResolvedValue(undefined);
      User.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue({
          _id: "u1",
          tenantId: "t1",
          resetExpiry: new Date(Date.now() + 60000),
          save,
        }),
      });
      bcrypt.hash.mockResolvedValue("h");
      RefreshToken.updateMany.mockResolvedValue({});

      const result = await authService.resetPassword({ resetToken: "x", password: "StrongPass123!" });
      expect(result.message).toContain("reset");
      expect(save).toHaveBeenCalled();
    });
  });
});
