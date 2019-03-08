# Maker Lab Device and Premise Access System

## Introduction
This system is broken up into two parts, the log/application server and the devices.  The log/application server will simply be called the server, and it provides a central location for the devices to log their activity and status to.  The server also provides a website that shows the logs and device status as well as letting a user update the access list.  The devices and the server use the winston library to provide access/error logging.  This provided off the shelf logging both locally, across the network and with multiple transports including email for notification of devices going down and errors.

## Application/Log Server
The application server includes a logging endpoint for all the devices and an http server and browser client for viewing.  The server has a minimal configuration that can be found in server/server-config.js.  There should only be one server running in the deployed environment.  This server can/should be configured to automatically start/restart using the systemd script and commands located in the systemd/ folder. 

The server holds its data in the build/data folder.  This includes the access list and the logs from all devices.  These are just .json files and could be manually edited, viewed.  This is mentioned because overall this is very simple.  Where it gets more complex is when we introduce the browser client for viewing logs and updating the access list.  Strictly speaking it is not necessary, but for end user simplicity, it was added.

The server and devices should be configured with network names following the Pi configuration steps.  The devices do not discover the server but rather need to be configured to point to it.  The default is for the server to be called rfid-server.  Meaning that the user interface can be reached at http://rfserver or http://rfserver.local (depending on windows or linux).  

The server is setup with basic auth.  The devices need to know the password.  In both cases the username/password is looked for in the environment variables BASIC_USER and BASIC_PASSWORD.  If neither is set, it will default to 'admin'/'password'.  The environment variables are easily set in the systemd scripts and then are outside of the git pull refresh cycle so they can be set without commiting their values.

## Devices
The devices will probably not be that varied or if they are they will be only subtle variations.  Right now there are two, one for a plug and one for the door located in the devices folder.  There are two versions of these one that supports the Phidget RFID 1024_0B and the other supports the ID12LA RFID Reader.  

### Device Configuration
The devices are configured via devices/device-config.js.  This configuration file contains a list of devices that should encompass the entire set of devices for the lab.  From this list at runtime the correct configuration is chosen based on the hostname of the Pi running the device code.  This simplifies deployment as one build/configuration is used for the entire lab.  Then, based on what you name the Pi, you configure which device that Pi is.  The devices can/should be configured to automatically start/restart using the systemd script and commands located in the systemd/ folder. 

## Access List
The access list defines the user, their rfid tag and the devices they have access to.  Typical workflow for the lab would be to maintain the membership, rfid access list in a google sheet.  This sheet can be saved to .csv when it is changed (File -> Download As -> Comma-separated values).  This csv would then be uploaded to the server.  The sheet will have the following columns, note the header names, Name and RFID are mandatory.  The remaining names should match the id set in the configuration file for the various devices.  The string 'x' or 'true' in the column for a device indicates the user has access to that device.

The header names must match the hostname of the corresponding device Pi.  This is how access is wired from the spreadsheet to an actual physical device.  An 'x' or 'true' in the rfid-laser1 column means that user can use whatever device is attached to the Pi named 'rfid-laser1'.

Name | RFID | enabled | rfentrance | rflaser1 | *ignore | more-machines...
---- | ---- | ------- | ----------------- | ------------ | ------- | ----------------
Agent Smith | x | 6F007F12C3C1 | x | x | ...
Sarah Connor |  | 6F007F12C3C2 | x |  | ...
... | | | 

In this example, both users have access to the building, but only Agent Smith has access to the rfid-laser1.  Column names prefixed with an * are ignored.  All non mandatory columns and non device column names should start with an *.  The enabled column turns on or off the RFID card access to all devices.  Enabled of value 'x' or 'true' means the user has access, any other value and the is prevented from using all devices.

### Reading New RFID Tags 
Most cards won't have the RFID printed on them and even if they do its unlikely it is in the same format as the access list expects it.  So, when assigning a new card to someone, just go scan it on some device.  Then look in the logs and you will see a row with User 'Unknown' and the rfid tag.  Now you have it.

## Hardware
The system is targetd at raspberry pi's and uses the `rpio` library to interface with it.  The server can be run concurrently with a device however multiple devices on the same pi will probably not work as is.  Support for reading from ID-12LA and PhidgetRFID 1024_0B is currently provided.  

Both the ID-12LA plug and door code is targeted at the Pimoroni Automation phat.  This was easier than using a level shifter and separate relay for handling 5v for the plug and 12v for the door.  The Phidget version uses the Raspberry GPIO directly as it targets a Digital Loggers plug which works on 3V.

## Full Setup Directions

There is actually a lot going on here to get setup.  

Set the Pi Host Name
```
sudo nano /etc/hostname #Change name
sudo nano /etc/hosts    #Change 127.0.1.1 raspberrypi -> name
sudo reboot -h now
```

Standard Update, Build Tools and Node
```
sudo apt update
sudo apt full-upgrade
sudo apt-get install -y build-essential
sudo apt-get install -y git

#Node on Raspbery PI 3
curl -sL https://deb.nodesource.com/setup_10.x | sudo -E bash -
sudo apt-get install -y nodejs

#Node in zero
wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v10.15.0.sh | sudo bash

#Clone the rfid app
git clone https://github.com/asawho/rfid-makerlab

#Verify your host name is in the device-config file, if not, update and then commit/push your changes in git
#remeber, one copy for all devices
cat rfid-makerlab/build/devices/device-config.js

#Setup the daemon for the device and or server
sudo cp rfid-makerlab/systemd/rfid-device.service or rfid-server.service /etc/systemd/system
#Edit the files in the /etc/systemd/system folder and update the password
sudo systemctl daemon-reload
sudo systemctl enable rfid-device or server
sudo systemctl start rfid-device or server
```

## Phidget Setup Directions
In order to operate with Javascript, the phidget library requires we talk through the Phidget22NetworkServer. The steps below setup the phidget libraries and configure the phidgetnetwork server to run as a daemon.

Phidget Install Rasberry Pi 3 (does not work on zero)
```
#Install the libs, they are already build for Pi 3
wget -qO- http://www.phidgets.com/gpgkey/pubring.gpg | sudo apt-key add -
sudo nano /etc/apt/sources.list.d/phidgets.list
    paste in --> deb http://www.phidgets.com/debian stretch main
sudo apt-get install libphidget22
sudo apt-get install phidget22networkserver

#Edit the network server config file and turn off the web server
sudo nano /etc/phidgets/phidget22networkserver.pc

#Run the networkserver as a daemon, this will start it up again on reboot.  
sudo phidget22networkserver -D
```

Phidget Install Rasberry Pi Zero (build from source)
```
sudo apt-get install libusb-1.0-0-dev
wget https://www.phidgets.com/downloads/phidget22/libraries/linux/libphidget22.tar.gz
wget https://www.phidgets.com/downloads/phidget22/libraries/linux/libphidget22extra.tar.gz
wget https://www.phidgets.com/downloads/phidget22/servers/linux/phidget22networkserver.tar.gz
#For each file
tar -xvf *.gz
# In each folder  (starting with lib and libextra), build the libs and put them in /usr/lib
./configure --prefix=/usr && make && sudo make install

#Edit the network server config file and turn off the web server, set the log folder to /var/log/phidget22networkserver.log
cp phidget22networkserver-version/phidget22networkserver.pc-dist /etc/phidgets/phidget22networkserver.pc
sudo nano /etc/phidgets/phidget22networkserver.pc

#Run the networkserver as a daemon, this will start it up again on reboot. 
sudo cp rfid-makerlab/systemd/rfid-phidgetnetworkserver.service /etc/systemd/system
sudo systemctl daemon-reload
sudo systemctl enable rfid-phidget22networkserver
sudo systemctl start rfid-phidget22networkserver 

```

Finally for both the Pi Zero and 3, We don't need (and probably don't want) anyone else connecting to the server and reading RFID cards.  So block the port that the network server uses for all but local connections.
```
# Note: -D removes a rule, -L lists all rules, the save is necessary otherwise it is dumped next go
sudo apt-get install iptables-persistent
sudo iptables -A INPUT -p tcp -s localhost --dport 5661 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 5661 -j DROP
sudo iptables-save > /etc/iptables/rules.v4 # may need to decompose into sudo iptables-save, copy, sudo nano /etc/iptables/rules.v4, paste and save
```

And Test
```
#reboot
sudo reboot
sudo ps -A | grep phidget   #Verify network server came up
sudo iptables -L            #Verify firewall took
```

## Extra Special Sauce - Configuring Automatic Code Updates
There are going to be a lot of these Pis running around.  In order to streamline the continued development, the Pi can be configured to poll github and automatically pull down any updates and then restart the services.  The included ./git-monitor.sh performs this.  Set this script up with cron to execute at a reasonable interval (for the example below it is every 5 minutes).  Note that updates to the systemd scripts and updates to the basic auth username and password cannot be made in this manner.  All other changes can. 
```
#Make the script executable
chmod +x git-monitor.sh
#Run it as the pi user, he can sudo to start/stop/reboot and if you run as root the git pull confuses permissions
crontab -e
#Paste in
*/5 * * * * /home/pi/rfid-makerlab/git-monitor.sh
```

## Todo
Add in the Mail transport to email errors to staff.
Put in log rotation so we don't fill up.

## For Develop Only
```
#set up smb (only for development)
sudo apt-get install samba samba-common-bin
sudo nano /etc/samba/smb.conf

#Pull out everying beneath/including [homes] and replace with
[PiShare]
comment=Raspberry Pi Share
path=/home/pi
browseable=Yes
writeable=Yes
only guest=no
create mask=0644
directory mask=0755
public=no

#Set the password
sudo smbpasswd -a pi
```
