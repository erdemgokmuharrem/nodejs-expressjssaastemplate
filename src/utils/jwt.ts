import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export interface RefreshTokenPayload {
  userId: string;
  tokenId: string;
}

/**
 * Access token oluşturur
 */
export const generateAccessToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  } as jwt.SignOptions);
};

/**
 * Refresh token oluşturur ve veritabanına kaydeder
 */
export const generateRefreshToken = async (userId: string): Promise<string> => {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 7); // 7 gün

  const refreshToken = await prisma.refreshToken.create({
    data: {
      token: 'temp-token', // Will be replaced by JWT
      userId,
      expiresAt,
    },
  });

  return jwt.sign(
    { userId, tokenId: refreshToken.id } as RefreshTokenPayload,
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

/**
 * Access token'ı doğrular
 */
export const verifyAccessToken = (token: string): JWTPayload => {
  return jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
};

/**
 * Refresh token'ı doğrular
 */
export const verifyRefreshToken = (token: string): RefreshTokenPayload => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as RefreshTokenPayload;
};

/**
 * Refresh token'ı veritabanından siler
 */
export const revokeRefreshToken = async (tokenId: string): Promise<void> => {
  await prisma.refreshToken.delete({
    where: { id: tokenId },
  });
};

/**
 * Kullanıcının tüm refresh token'larını siler
 */
export const revokeAllUserRefreshTokens = async (userId: string): Promise<void> => {
  await prisma.refreshToken.deleteMany({
    where: { userId },
  });
};
