// ====================================
// Gemini Nano API Test Script (CORRECTED)
// ====================================
// Run this in your Chrome DevTools console to test the API

async function testGeminiNano() {
  console.log('🧪 Testing Gemini Nano API...\n');

  // Step 1: Check if LanguageModel exists
  console.log('1️⃣ Checking window.LanguageModel...');
  if (!('LanguageModel' in window)) {
    console.error('❌ window.LanguageModel not found!');
    console.log('💡 Make sure Chrome flags are enabled:');
    console.log('   - chrome://flags/#prompt-api-for-gemini-nano');
    console.log('   - chrome://flags/#optimization-guide-on-device-model');
    return;
  }
  console.log('✅ window.LanguageModel found!');
  console.log('   Static methods:', Object.getOwnPropertyNames(window.LanguageModel));
  console.log('');

  // Step 2: Check availability
  console.log('2️⃣ Checking availability...');
  try {
    const availability = await window.LanguageModel.availability();
    console.log('📊 Availability:', availability);

    if (availability !== 'readily') {
      console.warn('⚠️  Model status:', availability);
      if (availability === 'after-download') {
        console.log('💡 Visit chrome://components/ and update "Optimization Guide On Device Model"');
      }
      return;
    }
    console.log('✅ Model is ready!\n');
  } catch (error) {
    console.error('❌ Error checking availability:', error);
    return;
  }

  // Step 3: Create a session
  console.log('3️⃣ Creating session...');
  let session;
  try {
    session = await window.LanguageModel.create({
      systemPrompt: 'You are a helpful AI assistant.',
    });

    // Set parameters on session instance
    session.temperature = 0.7;
    session.topK = 40;

    console.log('✅ Session created!');
    console.log('   Session properties:', {
      temperature: session.temperature,
      topK: session.topK,
      inputUsage: session.inputUsage,
      inputQuota: session.inputQuota,
    });
    console.log('');
  } catch (error) {
    console.error('❌ Error creating session:', error);
    return;
  }

  // Step 4: Test prompt
  console.log('4️⃣ Testing prompt...');
  try {
    const response = await session.prompt('What is 2+2? Answer briefly.');
    console.log('✅ Response received!');
    console.log('📝 Response:', response);
  } catch (error) {
    console.error('❌ Error during prompt:', error);
  } finally {
    // Clean up
    if (session) {
      session.destroy();
      console.log('\n🧹 Session cleaned up');
    }
  }

  console.log('\n✅ Test complete!');
}

// Run the test
testGeminiNano();
