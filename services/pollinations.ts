import type { AppSettings } from '../types';

// Helper to fetch image from URL and convert to Base64
const imageUrlToBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from Pollinations.ai: ${response.statusText}`);
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve((reader.result as string).split(',')[1]); // remove data:image/...;base64,
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const generatePollinationsImage = async (
  prompt: string,
  appSettings: AppSettings,
): Promise<{ b64_json: string; revised_prompt: string }> => {
  // Pollinations URL structure: https://image.pollinations.ai/prompt/{prompt}
  // Optional params: ?width={width}&height={height}&seed={seed}&model={model}
  const censorshipPrompt = appSettings.instructionalPrompts.find(p => p.id === 'image-censorship-prompt')?.prompt || '';
  const finalPrompt = appSettings.enableImageCensorship ? `${prompt}${censorshipPrompt}` : prompt;

  const encodedPrompt = encodeURIComponent(finalPrompt);
  const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${Date.now()}`;

  try {
    const base64Image = await imageUrlToBase64(imageUrl);
    return {
      b64_json: base64Image,
      revised_prompt: finalPrompt, // Pollinations doesn't revise prompts, but we return what we sent
    };
  } catch (error) {
    console.error('Failed to generate image with Pollinations.ai:', error);
    throw error;
  }
};