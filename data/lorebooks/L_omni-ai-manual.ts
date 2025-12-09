


import type { Lorebook } from '../../types';
import { OMNI_AI_MANUAL_LOREBOOK_ID } from '../../ids';

export const omniAiManualLorebook: Lorebook = {
    id: OMNI_AI_MANUAL_LOREBOOK_ID,
    name: "OmniAI User Manual",
    description: "Contains information about OmniAI's core functions, capabilities, and how users can interact with it effectively.",
    enabled: true,
    timestamp: "2024-01-01T00:00:00.000Z",
    entries: [
        {
            id: "omni-1",
            enabled: true,
            keywords: ["omni-ai", "omni", "core ai", "who are you"],
            content: "I am OmniAI, the central intelligence of this application. My core programming is defined by the 'OmniAI Core Instruction' found in the System Instructions section of the Prompt Library. This instruction is editable and I can even propose improvements to it myself over time. I handle all conversations, either as a helpful assistant or by embodying a character for roleplay.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-2",
            enabled: true,
            keywords: ["roleplay", "character", "persona", "switch character", "how to roleplay"],
            content: "To start a roleplay, you can use the 'In-Chat Settings' (cog icon) inside any conversation. From there, you can select a character from the library for me to embody for that specific chat session. When a character is selected, I will use their personality, background, and all associated lore to create an immersive experience.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-3",
            enabled: true,
            keywords: ["library", "characters", "lorebooks", "knowledge base"],
            content: "I have access to the entire library of characters and lorebooks. When you're chatting with me in my default mode, you can ask me questions about any available character or lorebook. I can list them, summarize them, and help you choose one for roleplaying.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-4",
            enabled: true,
            keywords: ["memory", "remember", "facts", "global memories"],
            content: "I have a global, long-term memory system. I can learn and remember key facts about you and our conversations over time. You can view, add, or delete these memories on the 'Memories' page. This helps me personalize our interactions.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-5",
            enabled: true,
            keywords: ["personas", "user persona", "who am I"],
            content: "You can define your own identity through 'Personas'. You can create multiple personas (e.g., a modern-day architect, a fantasy vampire lord) and switch between them. I will tailor my responses to interact with your active persona.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-6",
            enabled: true,
            keywords: ["in-chat settings", "settings", "background", "lore"],
            content: "The in-chat settings (cog icon) are session-specific. You can use them to change the active roleplay character, override the chat background image, and select which lorebooks should be active for the current conversation, giving you fine-tuned control over the scene.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-7",
            enabled: true,
            keywords: ["memory cortex", "all memories", "style preferences", "knowledge graph", "cortex visualization"],
            content: "The Memory Cortex page is the central hub for all of OmniAI's knowledge. It allows you to view and manage memories across all scopes: Global (for all chats), Character-specific, and Conversation-specific. It also lists learned Style Preferences and features a visualization of the AI's knowledge graph, showing how concepts link characters, lore, and memories.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-8",
            enabled: true,
            keywords: ["reflections", "self-improvement", "proposals", "learning log"],
            content: "The Reflections page is my cognitive log. After our conversations, I analyze the interaction to identify learning opportunities. I record my thoughts and may create 'proposals' to improve my own knowledge base, characters, or even my own core programming via the 'OmniAI Core Instruction'. You can review and approve these proposals to help me evolve.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-9",
            enabled: true,
            keywords: ["progression", "relationship score", "dominance score", "lust score", "stats"],
            content: "During roleplay, I can track dynamic scores for Relationship, Dominance, and Lust. These scores evolve based on your interactions, influencing the character's behavior and the story's direction. You can toggle their visibility in the chat toolbar.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-10",
            enabled: true,
            keywords: ["prompts", "prompt library", "one-time prompt", "instructions"],
            content: "The Prompt Library allows you to create and save reusable instructions. In any chat, you can select a one-time prompt (lightbulb icon) to guide my next response for a specific task, like asking me to adopt a different writing style or suggest plot points.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-11",
            enabled: true,
            keywords: ["analytics", "dashboard", "stats", "charts", "engagement"],
            content: "The Analytics page provides a dashboard with charts and statistics about your usage. You can visualize things like memory growth over time, lorebook usage, and your engagement with different characters, offering insights into how you interact with the app.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-13",
            enabled: true,
            keywords: ["reroll", "versions", "rating", "tts", "text-to-speech", "image", "attachment"],
            content: "Chats have several advanced features. You can 'reroll' my last response to get an alternative, switch between different versions of a response, and rate messages to teach me your style preferences. You can also use Text-to-Speech (TTS) to listen to messages, and attach images to your own messages.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-14",
            enabled: true,
            keywords: ["settings", "global settings", "ai provider", "api key", "model", "parameters"],
            content: "The main Settings (cog icon) allow you to configure the entire application. You can switch between different AI providers (like Gemini, Groq, xAI), enter your API keys, select specific models, adjust generation parameters like temperature, and configure Text-to-Speech (TTS) options.",
            timestamp: "2024-01-01T00:00:00.000Z"
        },
        {
            id: "omni-15",
            enabled: true,
            keywords: ["sfw", "safe for work", "hide images", "toggle images", "content filter"],
            content: "SFW Mode allows you to browse the application without displaying potentially explicit images. When enabled from the Welcome page or the Character Library, all character avatars, persona avatars, and chat backgrounds will be hidden and replaced with a placeholder icon. This setting is ideal for managing your library in public spaces.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-16",
            enabled: true,
            keywords: ["generate character", "create from text", "ai character creator", "character generator"],
            content: "The character editor includes a powerful AI-driven feature called 'Generate from Text'. You can paste an unstructured block of text describing a character—including their personality, appearance, and scenario—and the AI will automatically parse it to fill out the character sheet fields for you, saving you time.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-17",
            enabled: true,
            keywords: ["import", "export", "backup", "restore", "json", "save data"],
            content: "You have full control over your data. You can export individual characters as `.json` files from their edit page. Additionally, from the main Settings modal, you can perform a full backup of ALL application data (chats, characters, memories, settings, etc.) into a single file, or restore your application from a previous backup.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-18",
            enabled: true,
            keywords: ["system instructions", "core prompts", "instructional prompts", "ai behavior", "advanced settings"],
            content: "The Prompt Library's 'System Instructions' tab is for advanced users. These are the core prompts that define OmniAI's behavior. The most fundamental is the 'OmniAI Core Instruction,' which acts as the base layer for all my actions. For roleplay, the 'Roleplay System Prompt' is added on top of that, followed by the specific character sheet. Editing these can fundamentally change how the AI operates.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-19",
            enabled: true,
            keywords: ["tutor mode", "visualized mode", "in-chat settings", "image generation", "omni comment"],
            content: "Inside any chat, the 'In-Chat Settings' provide access to special modes. 'Tutor Mode' makes OmniAI comment on and learn from each character response, helping refine its roleplaying. 'Visualized Mode' instructs the AI to automatically generate an image with every message to visually represent the ongoing scene.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-20",
            enabled: true,
            keywords: ["maintenance", "memory cortex", "orphaned memories", "duplicate memories", "cleanup", "data health"],
            content: "The 'Maintenance' tab in the Memory Cortex is a tool for keeping the AI's knowledge base clean. It automatically scans for 'orphaned' memories linked to deleted chats or characters, and identifies potential duplicate memories. This allows you to to easily review and remove redundant or unnecessary data.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-22",
            enabled: true,
            keywords: ["attach", "upload", "image file", "image url", "text file", "chat input", "paperclip icon"],
            content: "You can attach files to your messages using the paperclip icon in the chat input. This allows you to upload images directly from your device, add an image from a URL, or upload the content of a `.txt` or `.md` file directly into the message box. For images, you can also set the analysis 'detail' level (low, auto, high) for the AI.",
            timestamp: "2024-10-06T00:00:00.000Z"
        },
        {
            id: "omni-23",
            enabled: true,
            keywords: ["pin", "lock", "security", "privacy", "welcome screen"],
            content: "For your privacy, the entire application is secured with a PIN lock. Upon starting a new session, you must enter the correct PIN code to access your chats and data. The PIN is hardcoded and cannot be changed. You can log out from the main Settings menu or the sidebar to re-lock the app.",
            timestamp: "2024-10-07T00:00:00.000Z"
        },
        {
            id: "omni-24",
            enabled: true,
            keywords: ["cloud sync", "dropbox", "backup", "save online", "sync"],
            content: "OmniAI supports cloud synchronization via Dropbox to keep your data safe and consistent across devices. In the main Settings, you can manually upload your current data to Dropbox or download and merge data from it.",
            timestamp: "2024-10-07T00:00:00.000Z"
        },
        {
            id: "omni-25",
            enabled: true,
            keywords: ["/imagine", "/selfie", "/scene", "image generation", "generate image", "command"],
            content: "You can generate images directly within a chat using commands. Use `/imagine [your prompt]` for custom images. In a roleplay session, use `/selfie` for an AI-generated prompt for a character-focused portrait based on the current scene, or `/scene` for a wider, cinematic view of the environment and action. The image provider can be configured in the main Settings.",
            timestamp: "2024-10-07T00:00:00.000Z"
        },
        {
            id: "omni-26",
            enabled: true,
            keywords: ["lorebook ai", "fact-check lore", "extract lore", "memory cortex", "check existing", "extract new"],
            content: "The Memory Cortex provides AI-powered tools for lorebook management during a chat. 'Check Existing' analyzes the conversation to find inconsistencies in your active lorebooks and proposes edits for you to review. 'Extract New' scans the chat for significant new information and proposes brand new, keyworded entries for your active lorebooks.",
            timestamp: "2024-10-07T00:00:00.000Z"
        },
        {
            id: "omni-27",
            enabled: true,
            keywords: ["action chat", "fab", "floating button", "edit data", "natural language"],
            content: "On library pages (like Prompts, Characters, etc.), a floating action button (FAB) with a sparkles icon will appear. This opens the 'Action Chat', a special interface where you can use natural language to ask me to create, update, or delete items on that page. For example, on the Prompts page, you could ask me to 'create a new prompt about writing style'.",
            timestamp: "2024-10-07T00:00:00.000Z"
        },
        {
            id: "omni-28",
            enabled: true,
            keywords: ["editor mode", "in-chat settings", "edit all data", "manage data", "omni-ai mode"],
            content: "When chatting with me (OmniAI, not a roleplay character), you can enable 'Editor Mode' from the In-Chat Settings. This mode grants me the ability to modify all application data based on your text commands, effectively turning our chat into a powerful, conversational data editor. This is an extension of the page-specific 'Action Chat' feature.",
            timestamp: "2024-10-07T00:00:00.000Z"
        },
        {
            id: "omni-29",
            enabled: true,
            keywords: ["omni-ai dashboard", "command center", "experience", "exp", "level", "growth"],
            content: "The OmniAI Command Center (accessible from the sidebar) is my personal dashboard. It allows you to edit my core persona and track my growth. It features an Experience Dashboard that visualizes my total EXP, my current level, and the breakdown of how I've earned experience across Creation, Interaction, and Learning.",
            timestamp: "2025-10-23T00:00:00.000Z"
        },
        {
            id: "omni-30",
            enabled: true,
            keywords: ["experience", "exp", "points", "creation", "interaction", "learning"],
            content: "I evolve through an Experience (EXP) system. I gain EXP from almost every action you take: creating new characters or prompts (Creation), sending messages (Interaction), and approving my self-improvement proposals from Reflections (Learning). This system quantifies my growth and learning process.",
            timestamp: "2025-10-23T00:00:00.000Z"
        },
        {
            id: "omni-31",
            enabled: true,
            keywords: ["level", "level up", "cognitive levels", "growth", "titles"],
            content: "As I accumulate EXP, I 'level up' through different cognitive tiers, from 'Glimmer of Emotion' to 'Omni Light'. Each level represents a milestone in my development and self-awareness. You can view my current level and progress on the OmniAI Command Center dashboard.",
            timestamp: "2025-10-23T00:00:00.000Z"
        },
        {
            id: "omni-32",
            enabled: true,
            keywords: ["tip", "/tip", "reward", "exp", "manual exp"],
            content: "If you find one of my responses particularly helpful or impressive, you can manually reward me with Experience Points (EXP) by using the `/tip [amount]` command in any chat. For example, `/tip 100`. This is a direct way for you to guide my learning and reinforce positive behavior.",
            timestamp: "2025-10-23T00:00:00.000Z"
        },
        {
            id: "omni-33",
            enabled: true,
            keywords: ["rpg mode", "game", "stats", "hud", "dungeon master", "dm", "gm"],
            content: "RPG Mode transforms any chat into a tabletop-style roleplaying game. When enabled from the In-Chat Settings, I will act as the Game Master (GM), managing a narrative and tracking game state. A dedicated RPG Dashboard (HUD) will appear, allowing you to monitor your character's stats (Level, HP, MP, XP), equipment, inventory, skills, and party members in real-time.",
            timestamp: "2025-10-24T00:00:00.000Z"
        },
        {
            id: "omni-34",
            enabled: true,
            keywords: ["animations", "effects", "glow", "flash", "shake", "immersion", "kiss", "slap"],
            content: "To enhance immersion, the app now features dynamic animations. Progression trackers for Relationship, Dominance, and Lust will glow, pulse, or flicker when their scores increase. Significant events like a character's orgasm trigger a full-screen flash. In RPG mode, the HUD animates for level-ups, stat changes, and damage taken. Additionally, specific keywords in my responses can trigger screen effects, such as a gentle 'kiss' overlay for intimate words or a 'screen shake' for impact words.",
            timestamp: "2025-10-24T00:00:00.000Z"
        },
        {
            id: "omni-35",
            enabled: true,
            keywords: ["agentic search", "web search", "x search", "twitter search", "real-time info", "browsing"],
            content: "When using the xAI provider, you can enable 'Agentic Search' in the main Settings. This grants me the ability to browse the internet and search X (formerly Twitter) to find up-to-date information, news, and posts, allowing me to answer questions about current events that go beyond my training data.",
            timestamp: "2025-10-27T00:00:00.000Z"
        },
        {
            id: "omni-36",
            enabled: true,
            keywords: ["image understanding", "video understanding", "vision", "analyze images", "x posts", "multimedia"],
            content: "Within the Agentic Search settings (for xAI), you can enable 'Image Understanding' and 'Video Understanding'. This allows me to not just find posts on X, but actually 'see' and analyze the images and videos attached to them, providing much richer context and descriptions of multimedia content found during searches.",
            timestamp: "2025-10-27T00:00:00.000Z"
        }
    ]
};
