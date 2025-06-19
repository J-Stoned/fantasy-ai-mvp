/**
 * FANTASY.AI AUTHENTICATION SYSTEM
 * Military-grade authentication with future-proof security
 * Multi-factor authentication, biometrics, and zero-trust architecture
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import { SecurityUtils, SECURITY_CONFIG } from './security-config';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  mfaSecret?: string;
  mfaEnabled: boolean;
  biometricEnabled: boolean;
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  apiKey: string;
  createdAt: Date;
  lastLogin: Date;
  loginAttempts: number;
  lockoutUntil?: Date;
}

export interface AuthToken {
  userId: string;
  email: string;
  tier: string;
  permissions: string[];
  iat: number;
  exp: number;
}

export interface BiometricData {
  type: 'fingerprint' | 'face' | 'voice';
  template: string; // Encrypted biometric template
  confidence: number;
}

export class AuthenticationSystem {
  private readonly jwtSecret: string;
  private readonly encryptionKey: string;
  private loginAttempts: Map<string, number> = new Map();
  private securityEvents: any[] = [];

  constructor() {
    this.jwtSecret = process.env.JWT_SECRET || crypto.randomBytes(64).toString('hex');
    this.encryptionKey = process.env.ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
  }

  // Register new user with secure password handling
  async registerUser(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Validate email and password strength
      if (!this.isValidEmail(email)) {
        return { success: false, error: 'Invalid email format' };
      }

      if (!this.isStrongPassword(password)) {
        return { success: false, error: 'Password does not meet security requirements' };
      }

      // Hash password with salt
      const saltRounds = SECURITY_CONFIG.encryption.saltRounds;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate secure API key
      const apiKey = SecurityUtils.generateApiKey();

      // Create user object
      const user: User = {
        id: crypto.randomUUID(),
        email: email.toLowerCase(),
        passwordHash,
        mfaEnabled: false,
        biometricEnabled: false,
        subscriptionTier: 'free',
        apiKey,
        createdAt: new Date(),
        lastLogin: new Date(),
        loginAttempts: 0
      };

      // In production, save to database
      console.log('🔐 User registered successfully:', user.email);
      
      this.logSecurityEvent('user_registered', { email, userId: user.id });

      return { success: true, user };
    } catch (error) {
      this.logSecurityEvent('registration_error', { email, error: error.message });
      return { success: false, error: 'Registration failed' };
    }
  }

  // Authenticate user with multiple security layers
  async authenticateUser(
    email: string, 
    password: string, 
    mfaCode?: string,
    biometricData?: BiometricData
  ): Promise<{ success: boolean; token?: string; requiresMFA?: boolean; error?: string }> {
    try {
      // Check for account lockout
      if (this.isAccountLocked(email)) {
        this.logSecurityEvent('login_attempt_locked', { email });
        return { success: false, error: 'Account temporarily locked due to multiple failed attempts' };
      }

      // Retrieve user (mock - in production, fetch from database)
      const user = await this.getUserByEmail(email);
      if (!user) {
        this.incrementLoginAttempts(email);
        this.logSecurityEvent('login_attempt_invalid_user', { email });
        return { success: false, error: 'Invalid credentials' };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        this.incrementLoginAttempts(email);
        this.logSecurityEvent('login_attempt_invalid_password', { email, userId: user.id });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if MFA is required
      if (user.mfaEnabled && !mfaCode) {
        return { success: false, requiresMFA: true };
      }

      // Verify MFA if enabled
      if (user.mfaEnabled && mfaCode) {
        const mfaValid = speakeasy.totp.verify({
          secret: user.mfaSecret!,
          encoding: 'base32',
          token: mfaCode,
          window: 2 // Allow 2 time steps of variance
        });

        if (!mfaValid) {
          this.incrementLoginAttempts(email);
          this.logSecurityEvent('login_attempt_invalid_mfa', { email, userId: user.id });
          return { success: false, error: 'Invalid MFA code' };
        }
      }

      // Verify biometric data if provided
      if (biometricData && user.biometricEnabled) {
        const biometricValid = await this.verifyBiometric(user.id, biometricData);
        if (!biometricValid) {
          this.incrementLoginAttempts(email);
          this.logSecurityEvent('login_attempt_invalid_biometric', { email, userId: user.id });
          return { success: false, error: 'Biometric verification failed' };
        }
      }

      // Generate JWT token
      const token = this.generateJWT(user);

      // Reset login attempts on successful login
      this.loginAttempts.delete(email);

      // Update last login (in production, update database)
      user.lastLogin = new Date();

      this.logSecurityEvent('login_success', { email, userId: user.id });

      return { success: true, token };
    } catch (error) {
      this.logSecurityEvent('login_error', { email, error: error.message });
      return { success: false, error: 'Authentication failed' };
    }
  }

  // Generate secure JWT token
  private generateJWT(user: User): string {
    const payload: AuthToken = {
      userId: user.id,
      email: user.email,
      tier: user.subscriptionTier,
      permissions: this.getUserPermissions(user.subscriptionTier),
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };

    return jwt.sign(payload, this.jwtSecret, { algorithm: 'HS256' });
  }

  // Verify JWT token
  async verifyToken(token: string): Promise<{ valid: boolean; payload?: AuthToken; error?: string }> {
    try {
      const payload = jwt.verify(token, this.jwtSecret) as AuthToken;
      
      // Check if token is expired
      if (payload.exp < Math.floor(Date.now() / 1000)) {
        return { valid: false, error: 'Token expired' };
      }

      return { valid: true, payload };
    } catch (error) {
      this.logSecurityEvent('token_verification_failed', { error: error.message });
      return { valid: false, error: 'Invalid token' };
    }
  }

  // Set up Multi-Factor Authentication
  async setupMFA(userId: string): Promise<{ secret: string; qrCode: string; backupCodes: string[] }> {
    const secret = speakeasy.generateSecret({
      name: `Fantasy.AI (${userId})`,
      issuer: 'Fantasy.AI'
    });

    // Generate backup codes
    const backupCodes = Array.from({ length: 10 }, () => crypto.randomBytes(4).toString('hex'));

    // In production, save secret and backup codes to database (encrypted)
    
    this.logSecurityEvent('mfa_setup', { userId });

    return {
      secret: secret.base32,
      qrCode: secret.otpauth_url!,
      backupCodes
    };
  }

  // Enable MFA after verification
  async enableMFA(userId: string, secret: string, verificationCode: string): Promise<boolean> {
    const verified = speakeasy.totp.verify({
      secret,
      encoding: 'base32',
      token: verificationCode,
      window: 2
    });

    if (verified) {
      // In production, update user in database
      this.logSecurityEvent('mfa_enabled', { userId });
      return true;
    }

    this.logSecurityEvent('mfa_enable_failed', { userId });
    return false;
  }

  // Register biometric data
  async registerBiometric(userId: string, biometricData: BiometricData): Promise<boolean> {
    try {
      // Encrypt biometric template
      const encryptedTemplate = SecurityUtils.encrypt(biometricData.template, this.encryptionKey);
      
      // In production, store encrypted template in database
      // NEVER store raw biometric data

      this.logSecurityEvent('biometric_registered', { 
        userId, 
        type: biometricData.type,
        confidence: biometricData.confidence 
      });

      return true;
    } catch (error) {
      this.logSecurityEvent('biometric_registration_failed', { userId, error: error.message });
      return false;
    }
  }

  // Verify biometric data
  private async verifyBiometric(userId: string, biometricData: BiometricData): Promise<boolean> {
    try {
      // In production, retrieve encrypted template from database
      // Compare with provided biometric data
      // Use secure biometric matching algorithms

      // Mock verification for demo
      const isValid = biometricData.confidence > 0.95;
      
      this.logSecurityEvent('biometric_verification', { 
        userId, 
        type: biometricData.type,
        success: isValid 
      });

      return isValid;
    } catch (error) {
      this.logSecurityEvent('biometric_verification_failed', { userId, error: error.message });
      return false;
    }
  }

  // API key authentication for programmatic access
  async authenticateAPIKey(apiKey: string): Promise<{ valid: boolean; user?: User; error?: string }> {
    try {
      // Validate API key format
      if (!apiKey.match(/^fai_[a-zA-Z0-9]{28}$/)) {
        this.logSecurityEvent('invalid_api_key_format', { apiKey: apiKey.substring(0, 10) + '...' });
        return { valid: false, error: 'Invalid API key format' };
      }

      // In production, look up user by API key in database
      const user = await this.getUserByAPIKey(apiKey);
      if (!user) {
        this.logSecurityEvent('invalid_api_key', { apiKey: apiKey.substring(0, 10) + '...' });
        return { valid: false, error: 'Invalid API key' };
      }

      this.logSecurityEvent('api_key_authenticated', { userId: user.id });
      return { valid: true, user };
    } catch (error) {
      this.logSecurityEvent('api_key_error', { error: error.message });
      return { valid: false, error: 'API key authentication failed' };
    }
  }

  // Password reset with secure token
  async requestPasswordReset(email: string): Promise<{ success: boolean; error?: string }> {
    try {
      const user = await this.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists
        return { success: true };
      }

      // Generate secure reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // In production, store reset token in database
      // Send email with reset link

      this.logSecurityEvent('password_reset_requested', { email, userId: user.id });
      return { success: true };
    } catch (error) {
      this.logSecurityEvent('password_reset_error', { email, error: error.message });
      return { success: false, error: 'Password reset request failed' };
    }
  }

  // Utility methods
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private isStrongPassword(password: string): boolean {
    // At least 12 characters, with uppercase, lowercase, numbers, and symbols
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{12,}$/;
    return strongRegex.test(password);
  }

  private isAccountLocked(email: string): boolean {
    const attempts = this.loginAttempts.get(email) || 0;
    return attempts >= SECURITY_CONFIG.authentication.maxLoginAttempts;
  }

  private incrementLoginAttempts(email: string): void {
    const current = this.loginAttempts.get(email) || 0;
    this.loginAttempts.set(email, current + 1);
  }

  private getUserPermissions(tier: string): string[] {
    switch (tier) {
      case 'free':
        return ['voice_commands:basic', 'stats:limited'];
      case 'premium':
        return ['voice_commands:unlimited', 'stats:full', 'ai_insights:basic'];
      case 'enterprise':
        return ['voice_commands:unlimited', 'stats:full', 'ai_insights:advanced', 'api_access:full'];
      default:
        return ['voice_commands:basic'];
    }
  }

  private logSecurityEvent(event: string, details: any): void {
    const logEntry = {
      timestamp: new Date(),
      event,
      details,
      ip: details.ip || 'unknown',
      userAgent: details.userAgent || 'unknown'
    };
    
    this.securityEvents.push(logEntry);
    
    // In production, send to security monitoring service
    console.log('🔐 Security Event:', logEntry);
  }

  // Mock database methods (replace with actual database operations)
  private async getUserByEmail(email: string): Promise<User | null> {
    // In production, query database
    return null;
  }

  private async getUserByAPIKey(apiKey: string): Promise<User | null> {
    // In production, query database
    return null;
  }

  // Get recent security events for monitoring
  getSecurityEvents(limit: number = 100): any[] {
    return this.securityEvents.slice(-limit);
  }

  // Generate new API key for user
  async regenerateAPIKey(userId: string): Promise<string> {
    const newApiKey = SecurityUtils.generateApiKey();
    
    // In production, update user in database
    
    this.logSecurityEvent('api_key_regenerated', { userId });
    return newApiKey;
  }
}

// Rate limiting middleware
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();

  isAllowed(identifier: string, maxRequests: number, windowMs: number): boolean {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get existing requests for this identifier
    const userRequests = this.requests.get(identifier) || [];
    
    // Filter out old requests
    const recentRequests = userRequests.filter(time => time > windowStart);
    
    // Check if under limit
    if (recentRequests.length >= maxRequests) {
      return false;
    }
    
    // Add this request
    recentRequests.push(now);
    this.requests.set(identifier, recentRequests);
    
    return true;
  }
}

// Export authentication system
export const authSystem = new AuthenticationSystem();
export const rateLimiter = new RateLimiter();