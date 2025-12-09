import type { AppSettings } from '../types';

let audio: HTMLAudioElement | null = null;
let isEnabledBySettings = true;

const getAudio = (): HTMLAudioElement => {
  if (!audio) {
    audio = document.createElement('audio');
    audio.loop = true;
    // A silent 1-byte data WAV file encoded in base64
    audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    document.body.appendChild(audio);
  }
  return audio;
};

export const startKeepAlive = (appSettings: AppSettings) => {
  isEnabledBySettings = appSettings.enableBackgroundKeepAlive ?? true;
  if (!isEnabledBySettings) return;

  const audioEl = getAudio();
  const playPromise = audioEl.play();
  if (playPromise !== undefined) {
    playPromise.catch(error => {
      // Autoplay may be prevented by the browser. This is expected if the user hasn't interacted
      // with the page yet. Subsequent calls after user interaction should succeed.
      console.log("Keep-alive audio failed to start automatically. This is expected and usually resolves after the first user interaction.", error.name);
    });
  }
};

export const stopKeepAlive = () => {
  if (!isEnabledBySettings || !audio) return;
  
  const audioEl = getAudio();
  audioEl.pause();
  audioEl.currentTime = 0;
};
