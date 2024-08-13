export let LocalStorageSources = [];

export function readSources() {
  LocalStorageSources = JSON.parse(localStorage.getItem('sources')) ?? [];
}

export function saveSources(sources) {
  LocalStorageSources = sources;
  localStorage.setItem('sources', JSON.stringify(sources));
}