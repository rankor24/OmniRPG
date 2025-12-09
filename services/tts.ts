// Helper function to sanitize text for any TTS provider
const sanitizeText = (text: string): string => {
  return text
    // Remove status blocks
    .replace(/\[CHARACTER STATUS\][\s\S]*?(\[USER STATUS\]|(?=\n\n)|$)/s, '')
    .replace(/\[USER STATUS\][\s\S]*?(?=\n\n|$)/s, '')
    // Remove asterisks used for italics
    .replace(/\*/g, '')
    .trim();
};

export const getGroqTtsAudio = async (text: string, voice: string, apiKey: string): Promise<ArrayBuffer> => {
  if (!apiKey) {
    throw new Error("Groq API key is not set. Please add it in settings.");
  }
  
  const sanitized = sanitizeText(text);
  if (!sanitized) return new ArrayBuffer(0);

  const response = await fetch('https://api.groq.com/openai/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'playai-tts',
      input: sanitized,
      voice: voice,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
        const errorJson = JSON.parse(errorText);
        throw new Error(`Groq TTS API Error: ${errorJson.error.message}`);
    } catch (e) {
        throw new Error(`Groq TTS API Error: ${errorText}`);
    }
  }

  return response.arrayBuffer();
};

export const getGoogleTtsAudio = async (text: string, voice: string, apiKey: string): Promise<string> => {
  if (!apiKey) {
    throw new Error("Google API key (set in Gemini field) is not set. Please add it in settings.");
  }

  const sanitized = sanitizeText(text);
  if (!sanitized) return '';

  const languageCode = voice.startsWith('en-GB') ? 'en-GB' : 'en-US';

  const response = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text: sanitized },
      voice: { languageCode: languageCode, name: voice },
      audioConfig: { audioEncoding: 'MP3' },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`Google TTS API Error: ${errorData.error.message}`);
  }

  const data = await response.json();
  if (!data.audioContent) {
    throw new Error('Google TTS API returned no audio content.');
  }
  return data.audioContent; // This is a base64 string
};