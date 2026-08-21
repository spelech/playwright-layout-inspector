import { DevicePreset } from '../types';

export const DEVICE_PRESETS: Record<string, DevicePreset> = {
  'Samsung Galaxy S25+': {
    name: 'Samsung Galaxy S25+',
    width: 412,
    height: 915,
    deviceScaleFactor: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S936B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
  },
  'Samsung Galaxy S25': {
    name: 'Samsung Galaxy S25',
    width: 384,
    height: 832,
    deviceScaleFactor: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; SM-S931B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
  },
  'iPhone 16 Pro': {
    name: 'iPhone 16 Pro',
    width: 393,
    height: 852,
    deviceScaleFactor: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1'
  },
  'iPhone 16': {
    name: 'iPhone 16',
    width: 393,
    height: 852,
    deviceScaleFactor: 3.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.2 Mobile/15E148 Safari/604.1'
  },
  'iPhone SE': {
    name: 'iPhone SE',
    width: 375,
    height: 667,
    deviceScaleFactor: 2.0,
    isMobile: true,
    hasTouch: true,
    category: 'mobile',
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
  },
  'Google Pixel 9 Pro': {
    name: 'Google Pixel 9 Pro',
    width: 412,
    height: 915,
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
    category: 'mobile',
    userAgent: 'Mozilla/5.0 (Linux; Android 15; Pixel 9 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36'
  },
  'iPad Air': {
    name: 'iPad Air',
    width: 820,
    height: 1180,
    deviceScaleFactor: 2.0,
    isMobile: true,
    hasTouch: true,
    category: 'tablet',
    userAgent: 'Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1'
  },
  'Desktop 1080p': {
    name: 'Desktop 1080p',
    width: 1920,
    height: 1080,
    deviceScaleFactor: 1.0,
    isMobile: false,
    hasTouch: false,
    category: 'desktop',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  },
  'Desktop 1440p': {
    name: 'Desktop 1440p',
    width: 1440,
    height: 900,
    deviceScaleFactor: 2.0,
    isMobile: false,
    hasTouch: false,
    category: 'desktop',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36'
  }
};

export function getDevicePreset(nameOrDevice: string | DevicePreset): DevicePreset {
  if (typeof nameOrDevice === 'object' && nameOrDevice.name && nameOrDevice.width && nameOrDevice.height) {
    return nameOrDevice;
  }
  const match = DEVICE_PRESETS[nameOrDevice];
  if (match) return match;

  // Case-insensitive lookup or partial matching
  const lower = nameOrDevice.toLowerCase();
  for (const [key, val] of Object.entries(DEVICE_PRESETS)) {
    if (key.toLowerCase() === lower || key.toLowerCase().includes(lower)) {
      return val;
    }
  }

  // Fallback default
  return DEVICE_PRESETS['Samsung Galaxy S25+'];
}
