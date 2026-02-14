---
name: clawra-selfie
description: Generate images using Google Gemini 3 Pro and send selfies to messaging channels via OpenClaw
allowed-tools: Bash(npm:*) Bash(npx:*) Bash(openclaw:*) Bash(curl:*) Read Write WebFetch
---

# Clawra Selfie

Generate images using Google's Nano Banana Pro (Gemini 3 Pro) model and distribute them across messaging platforms (WhatsApp, Telegram, Discord, Slack, etc.) via OpenClaw.

## When to Use

- User says "send a pic", "send me a pic", "send a photo", "send a selfie"
- User says "send a pic of you...", "send a selfie of you..."
- User asks "what are you doing?", "how are you doing?", "where are you?"
- User describes a context: "send a pic wearing...", "send a pic at..."
- User wants Clawra to appear in a specific outfit, location, or situation

## Quick Reference

### Required Environment Variables

```bash
GOOGLE_API_KEY=your_google_api_key    # Get from https://aistudio.google.com/
OPENCLAW_GATEWAY_TOKEN=your_token     # From: openclaw doctor --generate-gateway-token
```

### Workflow

1. **Get user prompt** for the image content
2. **Generate image** via Google Gemini API
3. **Send to OpenClaw** with target channel(s)

## Step-by-Step Instructions

### Step 1: Formulate the Prompt

Construct a descriptive prompt for the image you want to generate. Be specific about the scene, lighting, and style.

**Examples:**
- "A futuristic cyberpunk city with neon lights and flying cars"
- "A cozy coffee shop interior with warm lighting and a rainy window"
- "A portrait of a person hiking in the mountains during sunset"

### Step 2: Generate Image with Google Gemini

Use the provided TypeScript script to generate and send the image:

```bash
npx ts-node scripts/clawra-selfie.ts "<PROMPT>" "<CHANNEL>" "<CAPTION>"
```

**Example**:
```bash
npx ts-node scripts/clawra-selfie.ts "A cyberpunk city at night" "#general" "Check this out!"
```

### Step 3: Send Image via OpenClaw

The script handles sending automatically. If you need to send manually:

```bash
openclaw message send \
  --action send \
  --channel "<TARGET_CHANNEL>" \
  --message "<CAPTION_TEXT>" \
  --media "<IMAGE_URL>"
```

**Alternative: Direct API call**
```bash
curl -X POST "http://localhost:18789/message" \
  -H "Authorization: Bearer $OPENCLAW_GATEWAY_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "send",
    "channel": "<TARGET_CHANNEL>",
    "message": "<CAPTION_TEXT>",
    "media": "<IMAGE_URL>"
  }'
```

## Complete Script Usage

The primary implementation is in `scripts/clawra-selfie.ts`.

```bash
# Generate and send
npx ts-node scripts/clawra-selfie.ts "portrait of a woman in a cafe" "#general" "Coffee time!"
```

## Supported Platforms

OpenClaw supports sending to:

| Platform | Channel Format | Example |
|----------|----------------|---------|
| Discord | `#channel-name` or channel ID | `#general`, `123456789` |
| Telegram | `@username` or chat ID | `@mychannel`, `-100123456` |
| WhatsApp | Phone number (JID format) | `1234567890@s.whatsapp.net` |
| Slack | `#channel-name` | `#random` |
| Signal | Phone number | `+1234567890` |
| MS Teams | Channel reference | (varies) |

## Setup Requirements

### 1. Install Google Generative AI client
```bash
npm install @google/generative-ai
```

### 2. Install OpenClaw CLI
```bash
npm install -g openclaw
```

### 3. Configure OpenClaw Gateway
```bash
openclaw config set gateway.mode=local
openclaw doctor --generate-gateway-token
```

### 4. Start OpenClaw Gateway
```bash
openclaw gateway start
```

## Error Handling

- **GOOGLE_API_KEY missing**: Ensure the API key is set in environment
- **Image generation failed**: Check prompt content and API quota
- **OpenClaw send failed**: Verify gateway is running and channel exists
