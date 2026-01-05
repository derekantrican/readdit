// Centralized localStorage management
const KEYS = {
  SETTINGS: 'settings',
  SOURCES: 'sources',
  HIDDEN_POSTS: 'hiddenPosts',
  DEV_MODE: 'dev',
};

const DEFAULTS = {
  SETTINGS: { expirationTimeMin: 15 },
  SOURCES: [],
  HIDDEN_POSTS: [],
  DEV_MODE: false,
};

class LocalStorage {
  get(key, defaultValue) {
    try {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;
      // Handle special case for dev mode (stored as string 'true')
      if (key === KEYS.DEV_MODE) return value === 'true';
      return JSON.parse(value);
    } catch (err) {
      console.error(`Failed to read ${key}:`, err);
      return defaultValue;
    }
  }

  set(key, value) {
    try {
      // Handle special case for dev mode (store as string)
      if (key === KEYS.DEV_MODE) {
        localStorage.setItem(key, String(value));
      } else {
        localStorage.setItem(key, JSON.stringify(value));
      }
    } catch (err) {
      console.error(`Failed to save ${key}:`, err);
    }
  }

  // Settings methods
  getSettings() { 
    return this.get(KEYS.SETTINGS, DEFAULTS.SETTINGS); 
  }
  setSettings(value) { 
    this.set(KEYS.SETTINGS, value); 
  }
  
  // Sources methods
  getSources() { 
    return this.get(KEYS.SOURCES, DEFAULTS.SOURCES); 
  }
  setSources(value) { 
    this.set(KEYS.SOURCES, value); 
  }
  
  // Hidden posts methods
  getHiddenPosts() { 
    return this.get(KEYS.HIDDEN_POSTS, DEFAULTS.HIDDEN_POSTS); 
  }
  setHiddenPosts(value) { 
    this.set(KEYS.HIDDEN_POSTS, value); 
  }
  
  // Dev mode methods
  isDevMode() { 
    return this.get(KEYS.DEV_MODE, DEFAULTS.DEV_MODE); 
  }
  setDevMode(value) { 
    this.set(KEYS.DEV_MODE, value); 
  }
}

export const storage = new LocalStorage();

// Legacy exports for backward compatibility (can be removed after migration)
export let LocalStorageSettings = DEFAULTS.SETTINGS;

export function readSettings() {
  LocalStorageSettings = storage.getSettings();
}

export function saveSettings(settings) {
  LocalStorageSettings = settings;
  storage.setSettings(settings);
}