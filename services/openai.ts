
export const streamOpenAIResponse = async (
    url: string,
    apiKey: string,
    model: string,
    messages: { role: string; content: string | Array<{type: string, [key: string]: any}> }[],
    temperature: number,
    maxTokens: number,
    onStream: (chunk: string) => void,
    tools?: any[],
    tool_choice?: string,
    signal?: AbortSignal
): Promise<string> => {
    if (!apiKey) {
        throw new Error("API key is missing. Please add it in the settings.");
    }
    
    const body: any = {
        model,
        messages,
        stream: true,
        temperature,
    };

    if (maxTokens > 0) {
        body.max_tokens = maxTokens;
    }

    if (tools) {
        body.tools = tools;
        if (tool_choice) {
            body.tool_choice = tool_choice;
        }
    }

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body),
            signal,
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error; // Allow aborts to propagate
        }
        // Log detailed error to console for debugging
        console.error("OpenAI/DeepSeek API Fetch Error Details:", error);
        
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             if (url.includes('deepseek')) {
                 throw new Error(`DeepSeek API via Proxy Failed: The public proxy service (corsproxy.io) might be down or blocked, or your network connection is unstable. Please check your internet or try again later.`);
             }
             throw new Error(`Network Error: Failed to connect to ${url}. This is often caused by a CORS policy blocking the browser from accessing the API directly, or a network connectivity issue. Please check the browser console (F12) for specific error details.`);
        }
        throw new Error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
        const errorText = await response.text(); // Read the body ONCE as text.
        try {
            const errorBody = JSON.parse(errorText); // Try to parse the text as JSON.
            const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
            if (errorMessage.toLowerCase().includes('invalid api key') || errorMessage.toLowerCase().includes('incorrect api key')) {
                throw new Error('The provided API Key is invalid. Please check your key in the settings.');
            }
            throw new Error(`API Error: ${errorMessage}`);
        } catch (e) {
            // If JSON parsing fails, or it's a different error, use the raw text.
            if (e instanceof Error && e.message.startsWith('The provided API Key')) throw e;
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
    }

    const reader = response.body?.getReader();
    if (!reader) {
        throw new Error("Failed to get response reader");
    }

    const decoder = new TextDecoder();
    let fullText = '';
    let buffer = '';
    
    while (true) {
        const { done, value } = await reader.read();
        if (done) {
             // Process any remaining data in the buffer before exiting
            if (buffer.startsWith('data: ')) {
                const jsonStr = buffer.substring(6).trim();
                if (jsonStr && jsonStr !== '[DONE]') {
                    try {
                        const parsed = JSON.parse(jsonStr);
                        const content = parsed?.choices?.[0]?.delta?.content;
                        if (content) {
                            fullText += content;
                            onStream(content);
                        }
                    } catch (e) {
                         console.error('Failed to parse final stream chunk:', e, 'Raw chunk:', jsonStr);
                    }
                }
            }
            break;
        }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        
        // Keep the last, possibly incomplete, line in the buffer
        buffer = lines.pop() || ''; 
        
        for (const line of lines) {
            if (line.trim() === '') continue; // Skip empty lines
            if (line.startsWith('data: ')) {
                const jsonStr = line.substring(6).trim();
                if (jsonStr === '[DONE]') {
                    continue;
                }
                try {
                    const parsed = JSON.parse(jsonStr);
                    const content = parsed?.choices?.[0]?.delta?.content;
                    if (content) {
                        fullText += content;
                        onStream(content);
                    }
                } catch (e) {
                    console.error('Failed to parse stream chunk:', e, 'Raw chunk:', jsonStr);
                }
            }
        }
    }
    
    return fullText;
};

export const generateOpenAIResponse = async (
    url: string,
    apiKey: string,
    model: string,
    prompt: string,
    systemInstruction: string | null,
    temperature: number,
    isJson: boolean,
    signal?: AbortSignal
): Promise<string> => {
     if (!apiKey) {
        throw new Error("API key is missing. Please add it in the settings.");
    }

    const messages = [];
    if (systemInstruction) {
        messages.push({ role: 'system', content: systemInstruction });
    }
    messages.push({ role: 'user', content: prompt });

    const body: any = {
        model,
        messages,
        temperature,
    };
    
    if (isJson) {
        body.response_format = { type: 'json_object' };
    }

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body),
            signal
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        // Log detailed error to console for debugging
        console.error("OpenAI/DeepSeek API Generate Error Details:", error);

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             if (url.includes('deepseek')) {
                 throw new Error(`DeepSeek API via Proxy Failed: The public proxy service (corsproxy.io) might be down or blocked. Please check your internet or try again later.`);
             }
             throw new Error(`Network Error: Failed to connect to ${url}. This is often caused by a CORS policy blocking the browser from accessing the API directly, or a network connectivity issue. Please check the browser console (F12) for specific error details.`);
        }
        throw new Error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
        const errorText = await response.text(); // Read the body ONCE as text.
        try {
            const errorBody = JSON.parse(errorText); // Try to parse the text as JSON.
            const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
            if (errorMessage.toLowerCase().includes('invalid api key') || errorMessage.toLowerCase().includes('incorrect api key')) {
                throw new Error('The provided API Key is invalid. Please check your key in the settings.');
            }
            throw new Error(`API Error: ${errorMessage}`);
        } catch (e) {
            // If JSON parsing fails, or it's a different error, use the raw text.
            if (e instanceof Error && e.message.startsWith('The provided API Key')) throw e;
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || '';
};


export const generateOpenAIToolResponse = async (
    url: string,
    apiKey: string,
    model: string,
    messages: any[], // Can contain tool calls and results
    temperature: number,
    tools?: any[],
    signal?: AbortSignal
): Promise<any> => {
     if (!apiKey) {
        throw new Error("API key is missing. Please add it in the settings.");
    }

    const body: any = { model, messages, temperature };
    
    if (tools && tools.length > 0) {
        body.tools = tools;
        body.tool_choice = "auto";
    }

    let response;
    try {
        response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body),
            signal
        });
    } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
            throw error;
        }
        // Log detailed error to console for debugging
        console.error("OpenAI/DeepSeek API Tool Error Details:", error);

        if (error instanceof TypeError && error.message === 'Failed to fetch') {
             if (url.includes('deepseek')) {
                 throw new Error(`DeepSeek API via Proxy Failed: The public proxy service (corsproxy.io) might be down or blocked. Please check your internet or try again later.`);
             }
             throw new Error(`Network Error: Failed to connect to ${url}. This is often caused by a CORS policy blocking the browser from accessing the API directly, or a network connectivity issue. Please check the browser console (F12) for specific error details.`);
        }
        throw new Error(`Connection failed: ${error instanceof Error ? error.message : String(error)}`);
    }

    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorBody = JSON.parse(errorText);
            const errorMessage = errorBody?.error?.message || JSON.stringify(errorBody);
            if (errorMessage.toLowerCase().includes('invalid api key')) {
                throw new Error('The provided API Key is invalid.');
            }
            throw new Error(`API Error: ${errorMessage}`);
        } catch (e) {
            if (e instanceof Error && e.message.startsWith('The provided API Key')) throw e;
            throw new Error(`API request failed with status ${response.status}: ${errorText}`);
        }
    }

    const data = await response.json();
    return data.choices[0]?.message; // Returns the full message object, which may contain content or tool_calls
};
