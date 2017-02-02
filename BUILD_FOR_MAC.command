cd "`dirname "$0"`"

# Uses: https://github.com/electron-userland/electron-packager
# To install it globally:
#
#     npm install electron-packager -g
#

# Clean
rm -rf Soy\ McInky-darwin-x64/
rm ReleaseUpload/Soy_McInky_mac.dmg

# Ensure it's correctly/fully installed first
( cd app && npm install )

# Create icon from PNG
./resources/makeIcns.command

# Mac
electron-packager app Soy\ McInky --platform=darwin --arch=x64 --icon=resources/Icon.icns --extend-info=resources/info.plist --app-bundle-id=com.inkle.inky --prune --asar.unpackDir="main-process/ink" --ignore="inklecate_win.exe"

# Create a DMG
# Requires appdmg: npm install -g appdmg
# https://www.npmjs.com/package/appdmg
mkdir -p ReleaseUpload
appdmg resources/appdmg.json ReleaseUpload/Soy_McInky_mac.dmg

# Remove .icns again
rm resources/Icon.icns
