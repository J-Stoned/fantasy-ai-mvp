/**
 * Biometric Authentication Manager
 * Handles Face ID, Touch ID, and WebAuthn for secure mobile authentication
 */

interface BiometricAuthOptions {
  fallbackToPin?: boolean;
  rememberDevice?: boolean;
  requireRecentAuth?: boolean;
}

interface AuthenticationResult {
  success: boolean;
  method: 'faceId' | 'touchId' | 'webauthn' | 'pin' | 'none';
  timestamp: number;
  deviceId?: string;
}

export class BiometricAuthManager {
  private static instance: BiometricAuthManager;
  private lastAuthTime: number = 0;
  private authTimeout: number = 300000; // 5 minutes
  
  private constructor() {}
  
  static getInstance(): BiometricAuthManager {
    if (!BiometricAuthManager.instance) {
      BiometricAuthManager.instance = new BiometricAuthManager();
    }
    return BiometricAuthManager.instance;
  }
  
  /**
   * Check if biometric authentication is available
   */
  async isAvailable(): Promise<boolean> {
    // Check for WebAuthn support (modern biometric API)
    if ('credentials' in navigator && 'PublicKeyCredential' in window) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch (error) {
        console.error('WebAuthn check failed:', error);
      }
    }
    
    // Check for legacy Touch ID/Face ID via vendor prefixes
    if (this.isIOSSafari()) {
      return true; // iOS devices have biometric support
    }
    
    // Check for Android biometric support
    if (this.isAndroidChrome()) {
      return 'credentials' in navigator;
    }
    
    return false;
  }
  
  /**
   * Get the type of biometric available
   */
  async getBiometricType(): Promise<'faceId' | 'touchId' | 'fingerprint' | 'none'> {
    if (!await this.isAvailable()) {
      return 'none';
    }
    
    // iOS detection
    if (this.isIOSSafari()) {
      // Check for Face ID capable devices (iPhone X and later)
      const isFaceIDCapable = this.checkFaceIDCapability();
      return isFaceIDCapable ? 'faceId' : 'touchId';
    }
    
    // Android typically uses fingerprint
    if (this.isAndroidChrome()) {
      return 'fingerprint';
    }
    
    return 'none';
  }
  
  /**
   * Authenticate using biometrics
   */
  async authenticate(options: BiometricAuthOptions = {}): Promise<AuthenticationResult> {
    try {
      // Check if recent auth is still valid
      if (!options.requireRecentAuth && this.isRecentlyAuthenticated()) {
        return {
          success: true,
          method: 'none',
          timestamp: this.lastAuthTime
        };
      }
      
      const biometricType = await this.getBiometricType();
      
      if (biometricType === 'none') {
        return this.fallbackAuthentication(options);
      }
      
      // Use WebAuthn for modern biometric authentication
      if ('credentials' in navigator) {
        return await this.webAuthnAuthenticate(biometricType);
      }
      
      // Fallback for older devices
      return this.fallbackAuthentication(options);
      
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return {
        success: false,
        method: 'none',
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Register biometric credentials
   */
  async register(userId: string, username: string): Promise<boolean> {
    if (!('credentials' in navigator)) {
      return false;
    }
    
    try {
      // Generate challenge
      const challenge = this.generateChallenge();
      
      // Create credential options
      const createCredentialOptions: CredentialCreationOptions = {
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'Fantasy.AI',
            id: window.location.hostname
          },
          user: {
            id: this.stringToArrayBuffer(userId),
            name: username,
            displayName: username
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' }, // ES256
            { alg: -257, type: 'public-key' } // RS256
          ],
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required'
          },
          timeout: 60000,
          attestation: 'direct'
        }
      };
      
      // Create credential
      const credential = await navigator.credentials.create(createCredentialOptions);
      
      if (credential) {
        // Store credential info
        await this.storeCredential(userId, credential);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Biometric registration failed:', error);
      return false;
    }
  }
  
  /**
   * WebAuthn authentication
   */
  private async webAuthnAuthenticate(biometricType: string): Promise<AuthenticationResult> {
    try {
      const challenge = this.generateChallenge();
      
      // Get stored credential IDs for this device
      const credentialIds = await this.getStoredCredentialIds();
      
      const getCredentialOptions: CredentialRequestOptions = {
        publicKey: {
          challenge: challenge,
          allowCredentials: credentialIds.map(id => ({
            id: this.base64ToArrayBuffer(id),
            type: 'public-key'
          })),
          userVerification: 'required',
          timeout: 60000
        }
      };
      
      const assertion = await navigator.credentials.get(getCredentialOptions);
      
      if (assertion) {
        this.lastAuthTime = Date.now();
        
        // Verify the assertion on the server
        const verified = await this.verifyAssertion(assertion);
        
        return {
          success: verified,
          method: biometricType as any,
          timestamp: this.lastAuthTime,
          deviceId: await this.getDeviceId()
        };
      }
      
      return {
        success: false,
        method: biometricType as any,
        timestamp: Date.now()
      };
      
    } catch (error: any) {
      // User cancelled or biometric failed
      if (error.name === 'NotAllowedError') {
        console.log('User cancelled biometric authentication');
      }
      
      return {
        success: false,
        method: biometricType as any,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Fallback authentication method
   */
  private async fallbackAuthentication(options: BiometricAuthOptions): Promise<AuthenticationResult> {
    if (options.fallbackToPin) {
      // Implement PIN fallback
      const pin = await this.promptForPin();
      const verified = await this.verifyPin(pin);
      
      if (verified) {
        this.lastAuthTime = Date.now();
      }
      
      return {
        success: verified,
        method: 'pin',
        timestamp: this.lastAuthTime
      };
    }
    
    return {
      success: false,
      method: 'none',
      timestamp: Date.now()
    };
  }
  
  /**
   * Check if recently authenticated
   */
  private isRecentlyAuthenticated(): boolean {
    return (Date.now() - this.lastAuthTime) < this.authTimeout;
  }
  
  /**
   * Platform detection helpers
   */
  private isIOSSafari(): boolean {
    const ua = navigator.userAgent;
    return /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  }
  
  private isAndroidChrome(): boolean {
    const ua = navigator.userAgent;
    return /Android/.test(ua) && /Chrome/.test(ua);
  }
  
  private checkFaceIDCapability(): boolean {
    // Check screen size and notch to detect Face ID capable devices
    const hasNotch = window.screen.height >= 812; // iPhone X and later
    return this.isIOSSafari() && hasNotch;
  }
  
  /**
   * Utility functions
   */
  private generateChallenge(): ArrayBuffer {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return array.buffer;
  }
  
  private stringToArrayBuffer(str: string): ArrayBuffer {
    const encoder = new TextEncoder();
    return encoder.encode(str);
  }
  
  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }
  
  private async getDeviceId(): Promise<string> {
    // Generate a unique device ID
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('Fantasy.AI', 2, 2);
    }
    
    const dataURL = canvas.toDataURL();
    const hash = await this.hashString(dataURL + navigator.userAgent);
    return hash;
  }
  
  private async hashString(str: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  
  /**
   * Storage functions (would connect to your backend)
   */
  private async storeCredential(userId: string, credential: any): Promise<void> {
    // Store credential info in backend
    const response = await fetch('/api/auth/biometric/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        credentialId: btoa(String.fromCharCode(...new Uint8Array(credential.rawId))),
        publicKey: credential.response.publicKey
      })
    });
    
    if (!response.ok) {
      throw new Error('Failed to store credential');
    }
  }
  
  private async getStoredCredentialIds(): Promise<string[]> {
    // Get stored credentials from backend
    try {
      const response = await fetch('/api/auth/biometric/credentials');
      const data = await response.json();
      return data.credentialIds || [];
    } catch {
      return [];
    }
  }
  
  private async verifyAssertion(assertion: any): Promise<boolean> {
    // Verify assertion on backend
    try {
      const response = await fetch('/api/auth/biometric/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          credentialId: btoa(String.fromCharCode(...new Uint8Array(assertion.rawId))),
          authenticatorData: assertion.response.authenticatorData,
          clientDataJSON: assertion.response.clientDataJSON,
          signature: assertion.response.signature
        })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
  
  private async promptForPin(): Promise<string> {
    // This would show a PIN entry UI
    return prompt('Enter your PIN:') || '';
  }
  
  private async verifyPin(pin: string): Promise<boolean> {
    // Verify PIN on backend
    try {
      const response = await fetch('/api/auth/pin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin })
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }
}

// Export singleton instance
export const biometricAuth = BiometricAuthManager.getInstance();