import { describe, it, expect } from 'vitest';
import { getDevicePreset, DEVICE_PRESETS } from '../../src/core/devices';

describe('Device Presets', () => {
  it('retrieves Samsung Galaxy S25+ preset correctly', () => {
    const s25plus = getDevicePreset('Samsung Galaxy S25+');
    expect(s25plus.width).toBe(412);
    expect(s25plus.height).toBe(915);
    expect(s25plus.isMobile).toBe(true);
    expect(s25plus.hasTouch).toBe(true);
  });

  it('retrieves iPhone and Desktop presets', () => {
    const iphone = getDevicePreset('iPhone 16 Pro');
    expect(iphone.width).toBe(393);

    const desktop = getDevicePreset('Desktop 1080p');
    expect(desktop.width).toBe(1920);
    expect(desktop.isMobile).toBe(false);
  });

  it('performs case-insensitive fuzzy lookup', () => {
    const fuzzy = getDevicePreset('s25');
    expect(fuzzy.name).toContain('Samsung Galaxy S25');
  });
});
