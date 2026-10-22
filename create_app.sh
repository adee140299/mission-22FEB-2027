#!/bin/bash
# Regenerate the native macOS Mission Calendar.app bundle
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

osacompile -o "$DIR/Mission Calendar.app" -e '
set htmlPath to "'"$DIR"'/index.html"
set chromePath to "/Applications/Google Chrome.app"
set bravePath to "/Applications/Brave Browser.app"
set edgePath to "/Applications/Microsoft Edge.app"

tell application "System Events"
    if exists disk item chromePath then
        do shell script "open -na '\''Google Chrome'\'' --args --app='\''file://" & htmlPath & "'\''"
    else if exists disk item bravePath then
        do shell script "open -na '\''Brave Browser'\'' --args --app='\''file://" & htmlPath & "'\''"
    else if exists disk item edgePath then
        do shell script "open -na '\''Microsoft Edge'\'' --args --app='\''file://" & htmlPath & "'\''"
    else
        do shell script "open '\''file://" & htmlPath & "'\''"
    end if
end tell
'

if [ -f "$DIR/assets/AppIcon.icns" ]; then
    cp "$DIR/assets/AppIcon.icns" "$DIR/Mission Calendar.app/Contents/Resources/applet.icns"
    touch "$DIR/Mission Calendar.app"
fi

echo "✅ Mission Calendar.app successfully created at: $DIR/Mission Calendar.app"
