#!/bin/bash

echo "🚀 Building NoBias Media for All Platforms..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Choose build option:${NC}"
echo "1. Android APK (local build)"
echo "2. Android AAB (local build)"
echo "3. iOS App (EAS build)"
echo "4. All Android builds (local)"
echo "5. All platforms (Android local + iOS EAS)"

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${GREEN}Building Android APK...${NC}"
        ./build-apk.sh
        ;;
    2)
        echo -e "${GREEN}Building Android AAB...${NC}"
        cd android
        ./gradlew bundleRelease
        if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
            echo -e "${GREEN}✅ AAB built successfully!${NC}"
            echo "📍 AAB location: android/app/build/outputs/bundle/release/app-release.aab"
            cp app/build/outputs/bundle/release/app-release.aab ../nobias-media.aab
            echo "📱 AAB copied to: nobias-media.aab"
        else
            echo -e "${RED}❌ AAB build failed!${NC}"
        fi
        cd ..
        ;;
    3)
        echo -e "${GREEN}Building iOS App with EAS...${NC}"
        eas build --platform ios --profile production
        ;;
    4)
        echo -e "${GREEN}Building all Android formats...${NC}"
        # Build APK
        ./build-apk.sh
        
        # Build AAB
        echo -e "${GREEN}Building AAB...${NC}"
        cd android
        ./gradlew bundleRelease
        if [ -f "app/build/outputs/bundle/release/app-release.aab" ]; then
            echo -e "${GREEN}✅ AAB built successfully!${NC}"
            cp app/build/outputs/bundle/release/app-release.aab ../nobias-media.aab
            echo "📱 AAB copied to: nobias-media.aab"
        fi
        cd ..
        ;;
    5)
        echo -e "${GREEN}Building for all platforms...${NC}"
        # Android builds
        ./build-apk.sh
        cd android
        ./gradlew bundleRelease
        cp app/build/outputs/bundle/release/app-release.aab ../nobias-media.aab
        cd ..
        
        # iOS build
        echo -e "${GREEN}Starting iOS build with EAS...${NC}"
        eas build --platform ios --profile production
        ;;
    *)
        echo -e "${RED}Invalid choice!${NC}"
        exit 1
        ;;
esac

echo -e "${GREEN}🎉 Build process completed!${NC}"