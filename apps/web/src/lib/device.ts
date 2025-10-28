/**
 * Device fingerprinting utilities
 */

const DEVICE_HASH_KEY = 'rapbattles_device_hash';

export function getDeviceHash(): string {
  if (typeof window === 'undefined') {
    return 'server-side';
  }

  let deviceHash = localStorage.getItem(DEVICE_HASH_KEY);
  
  if (!deviceHash) {
    // Generate a stable device hash
    const randomId = crypto.randomUUID();
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    
    // Simple hash combining multiple factors
    deviceHash = btoa(randomId + userAgent + timestamp).slice(0, 32);
    localStorage.setItem(DEVICE_HASH_KEY, deviceHash);
  }
  
  return deviceHash;
}
