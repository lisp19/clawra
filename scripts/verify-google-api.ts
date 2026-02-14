import { generateImage } from "./clawra-selfie.ts";
import { setGlobalDispatcher, ProxyAgent } from "undici";

// Configure proxy if present
const proxyUrl = process.env.https_proxy || process.env.http_proxy;
if (proxyUrl) {
    console.log(`[INFO] Using proxy: ${proxyUrl}`);
    const dispatcher = new ProxyAgent(proxyUrl);
    setGlobalDispatcher(dispatcher);
}

import * as fs from 'fs';
import * as path from 'path';

async function testStructure() {
    console.log("--- Testing API Call Structure (Expected to fail without key) ---");

    // Set a dummy key to see if it reaches the API call step
    // Only set if not already set, to allow user testing with real key
    if (!process.env.GOOGLE_API_KEY) {
        process.env.GOOGLE_API_KEY = "dummy_key_for_testing_structure";
    }

    try {
        const result = await generateImage({
            prompt: "A beautiful futuristic city with bananas",
            num_images: 1
        });
        console.log("Success: Image generated.");

        if (result.imageUrl && result.imageUrl.startsWith('data:image/')) {
            const matches = result.imageUrl.match(/^data:image\/([a-zA-Z+]+);base64,(.+)$/);
            if (matches && matches.length === 3) {
                const ext = matches[1];
                const data = matches[2];
                const buffer = Buffer.from(data, 'base64');
                const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
                const outputDir = path.join(process.cwd(), 'test-output');

                if (!fs.existsSync(outputDir)) {
                    fs.mkdirSync(outputDir);
                }

                const filename = `generated-image-${timestamp}.${ext}`;
                const filepath = path.join(outputDir, filename);

                fs.writeFileSync(filepath, buffer);
                console.log(`\n[VERIFICATION] Image saved to: ${filepath}`);
            } else {
                console.log("Could not parse data URL.");
            }
        } else {
            console.log("Result does not contain a valid data URL.");
        }

    } catch (error: any) {
        console.log("Caught Error (expected):", error.message);

        // If it's a 404/403/401 or "API key not valid", it means the SDK logic and endpoint are correct
        if (error.message.includes("API key not valid") || error.message.includes("403") || error.message.includes("401") || error.message.includes("400")) {
            console.log("\n[VERIFICATION] API connection logic confirmed. The SDK is correctly targeting the Google API.");
        } else if (error.message.includes("fetch failed")) {
            console.log("\n[VERIFICATION] Network error: Could not reach Google API servers.");
            console.log("Check your internet connection or proxy settings if you are in a region where Google is blocked.");
            console.log("Ensure you have set 'http_proxy' or 'https_proxy' environment variables.");
        } else {
            console.log("\n[VERIFICATION] Unexpected error type:", typeof error, error);
        }
    }
}

testStructure();
