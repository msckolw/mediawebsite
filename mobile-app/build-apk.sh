#!/bin/bash

echo "🚀 Building NoBias Media APK..."

# Navigate to android directory
cd android

# Clean previous builds
echo "🧹 Cleaning previous builds..."
./gradlew clean

# Build APK
echo "📱 Building APK..."
./gradlew assembleRelease

# Check if build was successful
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ APK built successfully!"
    echo "📍 APK location: android/app/build/outputs/apk/release/app-release.apk"
    
    # Copy APK to root directory for easy access
    cp app/build/outputs/apk/release/app-release.apk ../nobias-media.apk
    echo "📱 APK copied to: nobias-media.apk"
else
    echo "❌ APK build failed!"
    exit 1
fi