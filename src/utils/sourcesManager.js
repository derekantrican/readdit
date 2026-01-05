import { storage } from './settingsManager';

export let LocalStorageSources = [];

export function readSources() {
  LocalStorageSources = storage.getSources();
}

export function saveSources(sources) {
  LocalStorageSources = sources;
  storage.setSources(sources);
}