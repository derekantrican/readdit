export let LocalStorageSources = [];

export function readSources() {
  LocalStorageSources = JSON.parse(localStorage.getItem('sources')) ?? [];
}

export function saveSources() {
  localStorage.setItem('sources', JSON.stringify(LocalStorageSources));
}