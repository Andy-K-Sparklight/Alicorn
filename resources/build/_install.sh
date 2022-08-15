#!/bin/sh
echo "Installing Alicorn, just a second..."
USERNAME=`whoami`
DESTFILE="/home/$USERNAME/.local/share/applications/alicorn.desktop"
rm -f $DESTFILE
cd `dirname $0`
MYDIR=`pwd`
chmod +x "Alicorn"
for LN in '[Desktop Entry]' 'Type=Application' 'Version=1.0' 'Name=Alicorn' 'Comment=A cute custom Minecraft launcher for everypony!' "Path=$MYDIR" "Exec=$MYDIR/Alicorn" "Icon=$MYDIR/Alicorn.png" 'Terminal=false'
do
  echo $LN >> $DESTFILE
done

echo "Installation complete, starting for you..."
./Alicorn