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
    // Use alternative if crypto.randomUUID is not available
    const randomId = (crypto.randomUUID || (() => {
      return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }))();
    
    const userAgent = navigator.userAgent;
    const timestamp = Date.now().toString();
    
    // Simple hash combining multiple factors
    deviceHash = btoa(randomId + userAgent + timestamp).slice(0, 32);
    localStorage.setItem(DEVICE_HASH_KEY, deviceHash);
  }
  
  return deviceHash;
}
