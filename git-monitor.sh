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
    # update to the changes, reset because of npm-install and package lock
    git reset --hard origin/master;
    git pull origin master;
    # pull any new dependencies, don't rebuild as the built copy is checked in
    npm install
    #restart
    if systemctl is-active --quiet rfid-server 
    then
        echo "Restarting Server"
        sudo systemctl restart rfid-server
    fi
    if systemctl is-active --quiet rfid-device 
    then
        # So... the phidget seems to have a bug where if you stop the node service or stop
        # the network service and start them back up.  Half the time on the pi zero (and 1 out of
        # 15 times on the Pi) it won't read any tags.  It'll do this during development too,
        # but it is easy to deal with that.  So... anyway, coming all the way up fresh seems
        # to avoid this.
        echo "Rebooting"
        sudo reboot
    fi
else
    echo "No Updates"
fi


