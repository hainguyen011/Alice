const imageGenService = require('./services/imageGenService');

async function testPicsum() {
    try {
        console.log('🧪 Testing Picsum fallback...');
        const result = await imageGenService.generateImage(
            'A beautiful city skyline at sunset',
            { api_key: 'fake_key' }, // Will fail, triggering fallback
            'Comics'
        );
        console.log('✅ Test passed! Image URL:', result);
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testPicsum();
