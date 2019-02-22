#!/bin/bash
# Setup 
# chmod +x git-monitor.sh
# sudo crontab -e
# Paste in
# */5 * * * * /home/pi/rfid-makerlab/git-monitor.sh

# This is a simple bash script that will poll github for changes to your repo,
# if found pull them down and then npm install and restart the service.
# Use cron to execute it however often is desired, with the the working
# folder being the root of the repo

cd /home/pi/rfid-makerlab

git fetch;
LOCAL=$(git rev-parse HEAD);
REMOTE=$(git rev-parse @{u});

#if our local revision id doesn't match the remote, we will need to pull the changes
if [ $LOCAL != $REMOTE ]; then
    echo "Code updated"
    # update to the changes
    git reset --hard origin/master;
    git pull origin master;
    # pull any new dependencies, don't rebuild as the built copy is checked in
    #npm install
    #restart
    if systemctl is-active --quiet rfid-server 
    then
        echo "Restarting Server"
        sudo systemctl restart rfid-server
    fi
    if systemctl is-active --quiet rfid-device 
    then
        echo "Restarting Device"
        sudo systemctl restart rfid-device
    fi
else
    echo "No Updates"
fi


