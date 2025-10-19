# Gemini Nano Integration - Updated Guide

## ✅ API Correction Applied

Based on your console output, the correct API is:
- ✅ **`window.LanguageModel`** (not `window.ai.languageModel`)
- ✅ **`LanguageModel.capabilities()`** (not `ai.availability()`)
- ✅ **`capabilities.available`** (returns status)

## 🧪 Testing the API

### Step 1: Test in Console
1. Open Chrome DevTools console
2. Copy and paste the test script from `test-gemini-nano.js`
3. Or run this quick check:

```javascript
// Quick availability check
window.LanguageModel.capabilities().then(c => console.log(c));
```

Expected output:
```javascript
{
  available: "readily",  // or "after-download", "no"
  defaultTemperature: 0.8,
  defaultTopK: 3,
  maxTopK: 128
}
```

### Step 2: Load Extension
```bash
# Go to: chrome://extensions/
# Enable "Developer mode"
# Click "Load unpacked"
# Select: /Users/khwahishvaid/Desktop/nanobrowserq1.0/dist
```

### Step 3: Configure Gemini Nano
1. Click Nanobrowser icon → Settings (⚙️)
2. **Add Provider:**
   - Provider Type: "Gemini Nano (Built-in)"
   - API Key: Leave empty or type "local" (not used)
   - Click "Add Provider"
3. **Assign to Agent:**
   - Navigator or Planner → Select "Gemini Nano (Built-in)"
   - Model: "gemini-nano"
   - Save

### Step 4: Test with Task
Try a simple task:
```
Go to example.com
```

## 📝 Code Changes Made

### File: `chrome-extension/src/background/agent/geminiNano.ts`

**Changed:**
```javascript
// OLD (incorrect):
window.ai.languageModel
await ai.availability()

// NEW (correct):
window.LanguageModel
await LanguageModel.capabilities()
```

**Key Updates:**
1. ✅ Check: `'LanguageModel' in window`
2. ✅ Capabilities: `await LanguageModel.capabilities()`
3. ✅ Status: `capabilities.available === 'readily'`
4. ✅ Create session: `await LanguageModel.create({...})`

## 🔍 Troubleshooting

### If `window.LanguageModel` is `undefined`:

**Check Chrome Flags:**
```
chrome://flags/#prompt-api-for-gemini-nano
chrome://flags/#optimization-guide-on-device-model
```
Both should be **"Enabled"**

**Download Model:**
1. Visit `chrome://components/`
2. Find "Optimization Guide On Device Model"
3. Click "Check for update"
4. Wait for download (can be large ~1.7GB)

### If `capabilities.available === "after-download"`:
- Model is not downloaded yet
- Visit chrome://components/ and update

### If `capabilities.available === "no"`:
- Your system doesn't meet requirements
- Requires: ≥22GB disk, ≥4GB VRAM, Windows/Mac

## ✅ API Reference

### Complete API Structure:
```typescript
interface LanguageModelCapabilities {
  available: 'readily' | 'after-download' | 'no';
  defaultTemperature?: number;
  defaultTopK?: number;
  maxTopK?: number;
}

interface LanguageModelSession {
  prompt(text: string): Promise<string>;
  promptStreaming(text: string): ReadableStream;
  destroy(): void;
}

interface LanguageModelStatic {
  capabilities(): Promise<LanguageModelCapabilities>;
  create(options: {
    temperature?: number;
    topK?: number;
    systemPrompt?: string;
  }): Promise<LanguageModelSession>;
}

declare global {
  interface Window {
    LanguageModel: LanguageModelStatic;
  }
}
```

## 🎯 Next Steps

1. ✅ Code updated to use `window.LanguageModel`
2. ✅ Build successful
3. ⏳ Test in browser console first
4. ⏳ Load extension and configure
5. ⏳ Try a simple task

**You're ready to test! 🚀**
