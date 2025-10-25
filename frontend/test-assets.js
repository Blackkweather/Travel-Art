// Test script to verify logo loading
import { getLogoUrl, getIconUrl, getAssetConfig } from './src/config/assets'

console.log('=== Asset Configuration Test ===')
console.log('Current asset config:', getAssetConfig())
console.log('Logo URL (transparent):', getLogoUrl('transparent'))
console.log('Logo URL (final):', getLogoUrl('final'))
console.log('Logo URL (test):', getLogoUrl('test'))
console.log('Icon URL (compass):', getIconUrl('compass'))
console.log('Icon URL (favicon):', getIconUrl('favicon'))

// Test logo loading
const testLogoLoading = async () => {
  const logoUrl = getLogoUrl('transparent')
  console.log(`\n=== Testing Logo Loading ===`)
  console.log(`Testing URL: ${logoUrl}`)
  
  try {
    const response = await fetch(logoUrl, { method: 'HEAD' })
    if (response.ok) {
      console.log('✅ Logo loads successfully!')
      console.log(`Content-Type: ${response.headers.get('content-type')}`)
      console.log(`Content-Length: ${response.headers.get('content-length')} bytes`)
    } else {
      console.log(`❌ Logo failed to load: ${response.status} ${response.statusText}`)
    }
  } catch (error) {
    console.log(`❌ Logo failed to load: ${error.message}`)
  }
}

// Run the test
testLogoLoading()
