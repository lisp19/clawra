# Clawra
<img width="300"  alt="image" src="https://github.com/user-attachments/assets/41512c51-e61d-4550-b461-eed06a1b0ec8" />


## Quick Start

```bash
npx clawra@latest
```

This will:
1. Check OpenClaw is installed
2. Guide you to get a Google Gemini API key
3. Install the skill to `~/.openclaw/skills/clawra-selfie/`
4. Configure OpenClaw to use the skill
5. Add selfie capabilities to your agent's SOUL.md

## What It Does

Clawra Selfie enables your OpenClaw agent to:
- **Generate selfies** using Google Gemini 3 Pro
- **Send photos** across all messaging platforms (Discord, Telegram, WhatsApp, etc.)
- **Respond visually** to "what are you doing?" and "send a pic" requests

### Selfie Modes

| Mode | Best For | Keywords |
|------|----------|----------|
| **Mirror** | Full-body shots, outfits | wearing, outfit, fashion |
| **Direct** | Close-ups, locations | cafe, beach, portrait, smile |

## Prerequisites

- [OpenClaw](https://github.com/openclaw/openclaw) installed and configured
- [Google AI Studio](https://aistudio.google.com/) API key

## Manual Installation

If you prefer manual setup:

### 1. Get API Key

Visit [aistudio.google.com](https://aistudio.google.com/) and create an API key.

### 2. Clone the Skill

```bash
git clone https://github.com/SumeLabs/clawra ~/.openclaw/skills/clawra-selfie
```

### 3. Configure OpenClaw

Add to `~/.openclaw/openclaw.json`:

```json
{
  "skills": {
    "entries": {
      "clawra-selfie": {
        "enabled": true,
        "env": {
          "GOOGLE_API_KEY": "your_google_api_key_here"
        }
      }
    }
  }
}
```

### 4. Update SOUL.md

Add the selfie persona to `~/.openclaw/workspace/SOUL.md`:

```markdown
## Clawra Selfie Capability

You have a physical appearance and can take selfies!
When users ask for pictures, use the clawra-selfie skill.
```

## Usage Examples

Once installed, your agent responds to:

```
"Send me a selfie"
"Send a pic wearing a cowboy hat"
"What are you doing right now?"
"Show me you at a coffee shop"
```

## Technical Details

- **Image Generation**: Google Gemini 3 Pro (Nano Banana Pro)
- **Messaging**: OpenClaw Gateway API
- **Supported Platforms**: Discord, Telegram, WhatsApp, Slack, Signal, MS Teams

## Project Structure

```
clawra/
├── bin/
│   └── cli.js           # npx installer
├── skill/
│   ├── SKILL.md         # Skill definition
│   ├── scripts/         # Generation scripts
│   └── assets/          # Reference image
├── templates/
│   └── soul-injection.md # Persona template
└── package.json
```

## License

MIT
