/**
 * Google Nano Banana Pro to OpenClaw Integration
 *
 * Generates images using Google's Nano Banana Pro (Gemini 3 Pro Image) model
 * and sends them to messaging channels via OpenClaw.
 *
 * Usage:
 *   npx ts-node scripts/clawra-selfie.ts "<prompt>" "<channel>" ["<caption>"]
 *
 * Environment variables:
 *   GOOGLE_API_KEY - Your Google Gemini API key
 *   OPENCLAW_GATEWAY_URL - OpenClaw gateway URL (default: http://localhost:18789)
 *   OPENCLAW_GATEWAY_TOKEN - Gateway auth token (optional)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { GoogleGenerativeAI } from "@google/generative-ai";

const execAsync = promisify(exec);

// Types
interface ImageInput {
  prompt: string;
  num_images?: number;
  aspect_ratio?: string;
}

interface ImageResponse {
  imageUrl: string; // For compatibility, we'll use a data URL for base64
  revised_prompt?: string;
}

interface OpenClawMessage {
  action: "send";
  channel: string;
  message: string;
  media?: string;
}

interface GenerateAndSendOptions {
  prompt: string;
  channel: string;
  caption?: string;
  aspectRatio?: string;
  useClaudeCodeCLI?: boolean;
}

interface Result {
  success: boolean;
  imageUrl: string;
  channel: string;
  prompt: string;
  revisedPrompt?: string;
}

/**
 * Generate image using Google Nano Banana Pro (Gemini 3 Pro Image)
 */
async function generateImage(
  input: ImageInput
): Promise<ImageResponse> {
  const googleKey = process.env.GOOGLE_API_KEY;

  if (!googleKey) {
    throw new Error(
      "GOOGLE_API_KEY environment variable not set. Get your key from https://aistudio.google.com/"
    );
  }

  const genAI = new GoogleGenerativeAI(googleKey);
  // Nano Banana Pro is gemini-3-pro-image-preview
  const model = genAI.getGenerativeModel({ model: "gemini-3-pro-image-preview" });

  console.log(`[INFO] Calling Google Gemini API (Nano Banana Pro)...`);

  // Google Gemini Image Generation via generateContent
  // Note: The structure might depend on the specific preview API version.
  // Generally it takes a prompt and parameters.
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: input.prompt }] }],
    generationConfig: {
      // Custom parameters for image generation if supported by the SDK
    }
  } as any);

  const response = await result.response;

  // Extract images. In Gemini Image API, images are often returned as inlineData (base64)
  // or via a specific image response object.
  const candidates = response.candidates;
  if (!candidates || candidates.length === 0) {
    throw new Error("No candidates returned from Gemini API");
  }

  const firstCandidate = candidates[0];
  const parts = firstCandidate.content.parts;

  // Find the image part
  const imagePart = parts.find((p: any) => p.inlineData && p.inlineData.mimeType.startsWith("image/"));

  if (!imagePart) {
    // Check if it's in a different format or just logged as text for debugging
    console.log("[DEBUG] Gemini Response:", JSON.stringify(response, null, 2));
    throw new Error("No image data found in Gemini response. Ensure headers/model support image generation.");
  }

  const base64Data = imagePart.inlineData.data;
  const mimeType = imagePart.inlineData.mimeType;
  const dataUrl = `data:${mimeType};base64,${base64Data}`;

  return {
    imageUrl: dataUrl,
    revised_prompt: (response as any).usageMetadata?.prompt_token_count ? "Prompt processed by Gemini" : undefined
  };
}

/**
 * Send image via OpenClaw
 */
async function sendViaOpenClaw(
  message: OpenClawMessage,
  useCLI: boolean = true
): Promise<void> {
  if (useCLI) {
    // Use OpenClaw CLI
    // Note: Passing a large data URL to CLI might hit argument length limits.
    // If that happens, we should write to a temp file.
    const cmd = `openclaw message send --action send --channel "${message.channel}" --message "${message.message}" --media "${message.media}"`;
    try {
      await execAsync(cmd);
    } catch (e) {
      console.warn(`[WARN] CLI call failed (possibly due to data URL length). Trying direct API call...`);
      return sendViaOpenClaw(message, false);
    }
    return;
  }

  // Direct API call
  const gatewayUrl =
    process.env.OPENCLAW_GATEWAY_URL || "http://localhost:18789";
  const gatewayToken = process.env.OPENCLAW_GATEWAY_TOKEN;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (gatewayToken) {
    headers["Authorization"] = `Bearer ${gatewayToken}`;
  }

  const response = await fetch(`${gatewayUrl}/message`, {
    method: "POST",
    headers,
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenClaw send failed: ${error}`);
  }
}

/**
 * Main function: Generate image and send to channel
 */
async function generateAndSend(options: GenerateAndSendOptions): Promise<Result> {
  const {
    prompt,
    channel,
    caption = "Generated with Google Nano Banana Pro",
    aspectRatio = "1:1",
    useClaudeCodeCLI = true,
  } = options;

  console.log(`[INFO] Generating image with Nano Banana Pro...`);
  console.log(`[INFO] Prompt: ${prompt}`);

  // Generate image
  const imageResult = await generateImage({
    prompt,
    num_images: 1,
    aspect_ratio: aspectRatio,
  });

  const imageUrl = imageResult.imageUrl;
  console.log(`[INFO] Image generated (Base64 data URL)`);

  // Send via OpenClaw
  console.log(`[INFO] Sending to channel: ${channel}`);

  await sendViaOpenClaw(
    {
      action: "send",
      channel,
      message: caption,
      media: imageUrl,
    },
    useClaudeCodeCLI
  );

  console.log(`[INFO] Done! Image sent to ${channel}`);

  return {
    success: true,
    imageUrl: imageUrl.substring(0, 50) + "...", // Don't log full base64
    channel,
    prompt,
    revisedPrompt: imageResult.revised_prompt,
  };
}

// CLI entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.length < 2) {
    console.log(`
Usage: npx ts-node scripts/clawra-selfie.ts <prompt> <channel> [caption] [aspect_ratio]

Arguments:
  prompt        - Image description (required)
  channel       - Target channel (required) e.g., #general, @user
  caption       - Message caption (default: 'Generated with Google Nano Banana Pro')
  aspect_ratio  - Image ratio (default: 1:1)

Environment:
  GOOGLE_API_KEY - Your Google Gemini API key (required)

Example:
  GOOGLE_API_KEY=your_key npx ts-node scripts/clawra-selfie.ts "A cyberpunk city" "#art" "Check this out!"
`);
    process.exit(1);
  }

  const [prompt, channel, caption, aspectRatio] = args;

  try {
    const result = await generateAndSend({
      prompt,
      channel,
      caption,
      aspectRatio,
    });

    console.log("\n--- Result ---");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error(`[ERROR] ${(error as Error).message}`);
    // If it's a 404 or model not found, it might be due to lack of API access
    if ((error as any).status === 404) {
      console.error("[TIP] The model 'gemini-3-pro-image-preview' might not be available in your region or for your API key yet.");
    }
    process.exit(1);
  }
}

// Export for module use
export {
  generateImage,
  sendViaOpenClaw,
  generateAndSend,
};

export type {
  ImageInput,
  ImageResponse,
  OpenClawMessage,
  GenerateAndSendOptions,
  Result,
};

// Run if executed directly
import { fileURLToPath } from 'url';
if (process.argv[1] && (process.argv[1] === fileURLToPath(import.meta.url) || process.argv[1].endsWith('clawra-selfie.ts'))) {
  main();
}
