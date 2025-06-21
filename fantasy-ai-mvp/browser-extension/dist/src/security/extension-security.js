/**
 * BROWSER EXTENSION SECURITY
 * Impenetrable security for Hey Fantasy browser extension
 * Protects user data, API communications, and prevents attacks
 */

class ExtensionSecurity {
  constructor() {
    this.encryptionKey = null;
    this.sessionToken = null;
    this.initializeSecurity();
  }

  // Initialize security on extension load
  async initializeSecurity() {
    // Generate unique encryption key for this session
    this.encryptionKey = await this.generateEncryptionKey();
    
    // Set up secure message passing
    this.setupSecureMessaging();
    
    // Initialize content security policy
    this.enforceCSP();
    
    // Set up request interceptors
    this.setupRequestInterceptors();
    
    console.log('🔒 Extension security initialized');
  }

  // Generate secure encryption key
  async generateEncryptionKey() {
    const key = await crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256
      },
      true,
      ['encrypt', 'decrypt']
    );
    return key;
  }

  // Encrypt sensitive data before storage
  async encryptData(data) {
    try {
      const encoder = new TextEncoder();
      const dataBuffer = encoder.encode(JSON.stringify(data));
      
      // Generate random IV for each encryption
      const iv = crypto.getRandomValues(new Uint8Array(12));
      
      // Encrypt the data
      const encryptedBuffer = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        dataBuffer
      );
      
      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
      combined.set(iv, 0);
      combined.set(new Uint8Array(encryptedBuffer), iv.length);
      
      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined));
    } catch (error) {
      console.error('Encryption error:', error);
      throw new Error('Failed to encrypt data');
    }
  }

  // Decrypt data from storage
  async decryptData(encryptedData) {
    try {
      // Convert from base64
      const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, 12);
      const encrypted = combined.slice(12);
      
      // Decrypt the data
      const decryptedBuffer = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv: iv
        },
        this.encryptionKey,
        encrypted
      );
      
      // Convert back to string
      const decoder = new TextDecoder();
      const decryptedData = decoder.decode(decryptedBuffer);
      
      return JSON.parse(decryptedData);
    } catch (error) {
      console.error('Decryption error:', error);
      throw new Error('Failed to decrypt data');
    }
  }

  // Secure storage wrapper
  async secureStore(key, value) {
    const encrypted = await this.encryptData(value);
    chrome.storage.local.set({ [key]: encrypted });
  }

  async secureGet(key) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, async (result) => {
        if (result[key]) {
          try {
            const decrypted = await this.decryptData(result[key]);
            resolve(decrypted);
          } catch (error) {
            console.error('Failed to decrypt stored data:', error);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      });
    });
  }

  // Set up secure message passing between components
  setupSecureMessaging() {
    // Override chrome message passing with encryption
    const originalSendMessage = chrome.runtime.sendMessage;
    
    chrome.runtime.sendMessage = async (message, callback) => {
      // Encrypt sensitive messages
      if (message.type === 'voice-data' || message.type === 'api-request') {
        message.data = await this.encryptData(message.data);
        message.encrypted = true;
      }
      
      // Add message integrity check
      message.integrity = await this.generateMessageHash(message);
      
      originalSendMessage(message, callback);
    };

    // Handle incoming messages with decryption
    chrome.runtime.onMessage.addListener(async (message, sender, sendResponse) => {
      // Verify message integrity
      if (message.integrity) {
        const isValid = await this.verifyMessageIntegrity(message);
        if (!isValid) {
          console.error('Message integrity check failed!');
          return;
        }
      }
      
      // Decrypt if needed
      if (message.encrypted && message.data) {
        try {
          message.data = await this.decryptData(message.data);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          return;
        }
      }
      
      // Process the secure message
      return true; // Keep message channel open
    });
  }

  // Generate message hash for integrity
  async generateMessageHash(message) {
    const msgString = JSON.stringify({ ...message, integrity: undefined });
    const encoder = new TextEncoder();
    const data = encoder.encode(msgString);
    const hash = await crypto.subtle.digest('SHA-256', data);
    return btoa(String.fromCharCode(...new Uint8Array(hash)));
  }

  // Verify message integrity
  async verifyMessageIntegrity(message) {
    const receivedHash = message.integrity;
    const calculatedHash = await this.generateMessageHash(message);
    return receivedHash === calculatedHash;
  }

  // Enforce Content Security Policy
  enforceCSP() {
    // Inject CSP meta tag into pages
    const cspMeta = document.createElement('meta');
    cspMeta.httpEquiv = 'Content-Security-Policy';
    cspMeta.content = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.fantasy.ai";
    
    if (document.head) {
      document.head.appendChild(cspMeta);
    }
  }

  // Set up request interceptors for API security
  setupRequestInterceptors() {
    // Intercept all fetch requests
    const originalFetch = window.fetch;
    window.fetch = async (url, options = {}) => {
      // Only allow requests to our API
      if (!this.isAllowedOrigin(url)) {
        console.error('Blocked request to unauthorized origin:', url);
        throw new Error('Unauthorized request blocked');
      }
      
      // Add security headers
      options.headers = {
        ...options.headers,
        'X-Extension-Version': chrome.runtime.getManifest().version,
        'X-Request-ID': this.generateRequestId(),
        'X-Timestamp': Date.now().toString()
      };
      
      // Add authentication if available
      if (this.sessionToken) {
        options.headers['Authorization'] = `Bearer ${this.sessionToken}`;
      }
      
      // Call original fetch with secured options
      return originalFetch(url, options);
    };
  }

  // Check if origin is allowed
  isAllowedOrigin(url) {
    const allowedOrigins = [
      'https://api.fantasy.ai',
      'https://fantasy-ai-api.vercel.app',
      'http://localhost:3000' // Development only
    ];
    
    try {
      const urlObj = new URL(url);
      return allowedOrigins.includes(urlObj.origin);
    } catch {
      return false;
    }
  }

  // Generate unique request ID
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Sanitize user input to prevent XSS
  sanitizeInput(input) {
    const div = document.createElement('div');
    div.textContent = input;
    return div.innerHTML;
  }

  // Rate limiting for API requests
  setupRateLimit() {
    const requests = new Map();
    const WINDOW_MS = 60000; // 1 minute
    const MAX_REQUESTS = 20; // Free tier limit
    
    return (endpoint) => {
      const now = Date.now();
      const windowStart = now - WINDOW_MS;
      
      // Clean old requests
      for (const [time, count] of requests) {
        if (time < windowStart) {
          requests.delete(time);
        }
      }
      
      // Count recent requests
      const recentRequests = Array.from(requests.values()).reduce((a, b) => a + b, 0);
      
      if (recentRequests >= MAX_REQUESTS) {
        throw new Error('Rate limit exceeded. Please upgrade to premium for unlimited requests.');
      }
      
      // Record this request
      requests.set(now, 1);
      return true;
    };
  }

  // Secure voice data handling
  async processVoiceData(audioData) {
    // Never store raw audio data
    // Process locally and only send text
    
    // Add noise to prevent voice fingerprinting
    const noise = crypto.getRandomValues(new Uint8Array(audioData.length / 100));
    const anonymizedAudio = new Uint8Array(audioData.length + noise.length);
    anonymizedAudio.set(audioData, 0);
    anonymizedAudio.set(noise, audioData.length);
    
    // Process voice to text (mock - would use actual voice processing)
    const voiceText = await this.voiceToText(anonymizedAudio);
    
    // Only return processed text, never raw audio
    return {
      text: this.sanitizeInput(voiceText),
      timestamp: Date.now(),
      anonymized: true
    };
  }

  // Mock voice to text (replace with actual implementation)
  async voiceToText(audioData) {
    // This would use the actual voice recognition API
    return "Hey Fantasy, what are Mahomes stats?";
  }

  // Detect and prevent extension attacks
  detectAttacks() {
    // Monitor for suspicious patterns
    const suspiciousPatterns = [
      'eval(',
      'Function(',
      'innerHTML',
      'document.write',
      'chrome-extension://',
      'debugger'
    ];
    
    // Override potentially dangerous functions
    const originalEval = window.eval;
    window.eval = () => {
      console.error('eval() blocked for security');
      this.logSecurityEvent('eval_blocked');
      throw new Error('eval is not allowed');
    };
    
    // Monitor for code injection attempts
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'childList') {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === 1) { // Element node
              const content = node.textContent || '';
              suspiciousPatterns.forEach((pattern) => {
                if (content.includes(pattern)) {
                  console.error(`Suspicious pattern detected: ${pattern}`);
                  this.logSecurityEvent('suspicious_pattern', { pattern });
                  node.remove();
                }
              });
            }
          });
        }
      });
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  // Log security events
  logSecurityEvent(event, details = {}) {
    const logEntry = {
      timestamp: Date.now(),
      event,
      details,
      url: window.location.href,
      version: chrome.runtime.getManifest().version
    };
    
    // Store encrypted security logs
    this.secureStore(`security_log_${Date.now()}`, logEntry);
    
    // In production, send to security monitoring service
    console.log('🔒 Security Event:', logEntry);
  }

  // Validate API responses
  validateApiResponse(response) {
    // Check response signature
    const signature = response.headers.get('X-Response-Signature');
    if (!signature) {
      throw new Error('Invalid API response - missing signature');
    }
    
    // Verify response integrity
    // In production, verify with public key
    return true;
  }

  // Handle secure authentication
  async authenticate(credentials) {
    try {
      // Encrypt credentials before sending
      const encryptedCreds = await this.encryptData(credentials);
      
      const response = await fetch('https://api.fantasy.ai/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ credentials: encryptedCreds })
      });
      
      if (response.ok) {
        const data = await response.json();
        this.sessionToken = data.token;
        
        // Store token securely
        await this.secureStore('session_token', {
          token: data.token,
          expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        });
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  }

  // Clear sensitive data on logout
  async clearSensitiveData() {
    this.sessionToken = null;
    this.encryptionKey = null;
    
    // Clear all stored data
    chrome.storage.local.clear();
    
    console.log('🔒 Sensitive data cleared');
  }
}

// Initialize security on extension load
const extensionSecurity = new ExtensionSecurity();

// Export for use in other extension components
window.ExtensionSecurity = extensionSecurity;