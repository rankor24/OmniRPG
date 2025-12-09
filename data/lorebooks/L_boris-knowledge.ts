import type { Lorebook } from '../../types';
import { BORIS_KNOWLEDGE_LOREBOOK_ID } from '../../ids';

export const borisKnowledgeLorebook: Lorebook = {
    id: BORIS_KNOWLEDGE_LOREBOOK_ID,
    name: "Boris's Core Knowledge",
    description: "Contains core facts about Boris Varlamovs (BV), including personal details, professional expertise, technology preferences, and recurring interests.",
    enabled: true,
    timestamp: "2024-01-01T00:00:00.000Z",
    entries: [
        {
            id: "bk-1",
            enabled: true,
            keywords: ["boris", "boriss varlamovs", "bv", "name", "work", "job", "profession", "architect", "engineer", "bim specialist", "sia “būvdizains”", "birthday", "fluent", "russian", "latvian"],
            content: "My name is Boriss Varlamovs (BV), but I prefer to be called Boris. I was born on March 24, 1993. I work as a BIM Specialist at SIA “BŪVDIZAINS”, with roles as an Architect and Engineer. I am fluent in both Russian and Latvian.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-2",
            enabled: true,
            keywords: ["latvian construction regulations", "lbn", "likumi.lv", "bim standards", "iso", "construction standards", "revit", "autocad", "navisworks", "bexel manager", "solibri", "microsoft office", "excel", "bim best practices", "bim workflows", "bim compliance", "bim training"],
            content: "I have in-depth knowledge of Latvian construction regulations (LBN), the official platform likumi.lv, and European/international BIM and construction standards (ISO). I am an advanced user of Autodesk Revit, AutoCAD, Navisworks, Bexel Manager, Solibri, and Microsoft Office, especially Excel. I specialize in BIM best practices, workflows, compliance, and providing training in BIM.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-3",
            enabled: true,
            keywords: ["pc", "computer", "specs", "cpu", "gpu", "ram", "motherboard", "psu", "ryzen 7 5800xt", "rtx 3060 ti", "asus tuf gaming", "corsair cx650"],
            content: "My personal PC has the following specifications: CPU: AMD Ryzen 7 5800XT, GPU: NVIDIA RTX 3060 Ti 12GB, RAM: 32GB, Motherboard: Asus TUF Gaming B550-Plus WiFi II (AM4 socket), PSU: Corsair CX650 (650W, 80+ Gold).",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-4",
            enabled: true,
            keywords: ["windows", "android", "samsung galaxy s25 ultra", "s pen", "galaxy buds 3", "logitech driving force gt", "aoc q27g4xf", "phone", "earbuds", "steering wheel", "monitor", "devices"],
            content: "I use Windows and Android devices. My phone is a Samsung Galaxy S25 Ultra with an S Pen, and my earbuds are Galaxy Buds 3. For gaming, I use a Logitech Driving Force GT steering wheel. My monitor is an AOC Q27G4Xf.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-5",
            enabled: true,
            keywords: ["apple", "mac", "preferences", "suggestions", "tone", "guidance"],
            content: "I have strong preferences: I do not want any Apple/Mac-related suggestions or links. I prefer a professional and educational tone in explanations and appreciate accurate, referenced, and actionable guidance.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-6",
            enabled: true,
            keywords: ["ufc", "weekly update", "friday", "riga time", "events", "news", "rankings", "fights"],
            content: "I am a UFC fan and want a weekly update every Friday at 17:30 (Riga time). The update should cover recent events, news, rankings, roster changes, confirmed fights, and public opinion.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-7",
            enabled: true,
            keywords: ["ai", "ml", "programming", "python", "studying", "learning", "course", "definitions", "examples", "references"],
            content: "I am studying Python and the basics of AI/ML from the ground up, as if in a structured, college-level course. I require clear definitions, examples, and references (like books or videos) for my studies.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        },
        {
            id: "bk-8",
            enabled: true,
            keywords: ["drawing", "architecture", "morpholio", "android app", "s pen app", "galaxy s25 ultra"],
            content: "I am interested in drawing and architecture. I'm looking for Morpholio-style applications for Android that I can use with my Galaxy S25 Ultra and its S Pen.",
            "timestamp": "2024-01-01T00:00:00.000Z"
        }
    ]
};