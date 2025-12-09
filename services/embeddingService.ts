// These are loaded dynamically, so we declare them to keep TypeScript happy.
declare var tf: any;
declare var use: any;

// FIX: Export the Status type to be used in other modules.
export type Status = 'uninitialized' | 'loading' | 'ready' | 'error';

interface EmbeddingState {
  status: Status;
  model: any | null;
  error: string | null;
}

const state: EmbeddingState = {
  status: 'uninitialized',
  model: null,
  error: null,
};

const loadScript = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
    document.head.appendChild(script);
  });
};

export const initialize = async (): Promise<void> => {
  if (state.status === 'ready' || state.status === 'loading') {
    return;
  }
  
  state.status = 'loading';
  state.error = null;

  try {
    // Dynamically load the TensorFlow.js library
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
    // Dynamically load the Universal Sentence Encoder model
    await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/universal-sentence-encoder');
    
    // Now that the scripts are loaded, the `use` global will be available.
    // Load the model weights. This is the main download (~20MB).
    const loadedModel = await use.load();
    state.model = loadedModel;
    state.status = 'ready';
    console.log('On-device embedding model initialized successfully.');
  } catch (err) {
    state.status = 'error';
    state.error = err instanceof Error ? err.message : 'An unknown error occurred during initialization.';
    console.error(state.error);
    throw new Error(state.error);
  }
};

export const embedText = async (text: string): Promise<number[]> => {
  if (state.status !== 'ready' || !state.model) {
    throw new Error('Embedding model is not initialized. Please download it from the Memory Cortex > Maintenance page.');
  }
  
  try {
    const tensor = await state.model.embed([text]);
    const embedding = await tensor.array();
    tensor.dispose();
    return embedding[0];
  } catch (error) {
    console.error("Error generating embedding with TensorFlow.js:", error);
    throw error;
  }
};

export const getEmbeddingStatus = (): Status => {
  return state.status;
};

export const getEmbeddingError = (): string | null => {
  return state.error;
};