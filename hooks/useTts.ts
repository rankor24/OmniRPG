import { useState, useRef, useCallback } from 'react';
import { getGroqTtsAudio, getGoogleTtsAudio } from '../services/tts';
import type { AppSettings } from '../types';

export const useTts = (appSettings: AppSettings) => {
  const [ttsState, setTtsState] = useState<{ isLoading: boolean; playingMessageId: string | null }>({
    isLoading: false,
    playingMessageId: null,
  });
  const audioRef = useRef<HTMLAudioElement>(null);

  const playAudio = useCallback(async (messageId: string, text: string) => {
    const audio = audioRef.current;
    if (!audio) return;

    if (ttsState.playingMessageId === messageId) {
      audio.pause();
      audio.src = '';
      setTtsState({ isLoading: false, playingMessageId: null });
      return;
    }

    audio.pause();
    audio.src = '';
    setTtsState({ isLoading: true, playingMessageId: messageId });

    try {
      let audioUrl = '';

      if (appSettings.ttsProvider === 'google') {
        const base64Audio = await getGoogleTtsAudio(text, appSettings.ttsVoice, appSettings.googleCloudApiKey);
        if (base64Audio) {
          audioUrl = `data:audio/mpeg;base64,${base64Audio}`;
        }
      } else { // groq
        const audioBuffer = await getGroqTtsAudio(text, appSettings.ttsVoice, appSettings.groqApiKey);
        if (audioBuffer && audioBuffer.byteLength > 0) {
          const blob = new Blob([audioBuffer], { type: 'audio/mpeg' });
          audioUrl = URL.createObjectURL(blob);
        }
      }

      if (audioUrl) {
        audio.src = audioUrl; // Set src before playing
        await audio.play().catch(e => {
            console.error("Audio playback failed:", e);
            setTtsState({ isLoading: false, playingMessageId: null });
        });

        const onEnd = () => {
          setTtsState(prev => (prev.playingMessageId === messageId ? { isLoading: false, playingMessageId: null } : prev));
          audio.removeEventListener('ended', onEnd);
          audio.removeEventListener('pause', onEnd);
          if (audioUrl.startsWith('blob:')) {
            URL.revokeObjectURL(audioUrl);
          }
        };

        audio.addEventListener('ended', onEnd);
        audio.addEventListener('pause', onEnd);
        setTtsState(prev => ({ ...prev, isLoading: false }));

      } else {
        setTtsState({ isLoading: false, playingMessageId: null });
      }
    } catch (error) {
      console.error("TTS Error:", error);
      alert(error instanceof Error ? error.message : "An unknown TTS error occurred.");
      setTtsState({ isLoading: false, playingMessageId: null });
    }
  }, [appSettings, ttsState.playingMessageId]);

  return { audioRef, ttsState, playAudio };
};
