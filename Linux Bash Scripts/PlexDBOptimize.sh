#!/bin/sh

# Get the contents of the Preferences file, keep only what we need,  push to a temp, then use it in the curl command

# you may remove the sudo if not needed to read your Preferences.xml

sudo cat "/var/lib/plexmediaserver/Library/Application Support/Plex Media Server/Preferences.xml" |  \
sed -e 's;^.* PlexOnlineToken=";;' | sed -e 's;".*$;;' | tail -1 > /tmp/plex.tmp

curl --request PUT http://127.0.0.1:32400/library/optimize\?async=1\&X-Plex-Token=`cat /tmp/plex.tmp`

rm -f /tmp/plex.tmp
