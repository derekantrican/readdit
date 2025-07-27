const defaultSettings = {
  expirationTimeMin: 15,
};

export let LocalStorageSettings = defaultSettings; // Init with default value

export function readSettings() {
  LocalStorageSettings = JSON.parse(localStorage.getItem('settings')) ?? defaultSettings;
}

export function saveSettings(settings) {
  LocalStorageSettings = settings;
  localStorage.setItem('settings', JSON.stringify(settings));
}