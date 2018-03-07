# Lab Device and Premise Access System

## Introduction
This system is broken up into two parts, the log/application server and the devices.  The log/application server will simply be called the server, and it provides a central location for the devices to log their activity and status to.  The server also provides a website that shows the logs and device status as well as letting a user update the access list.  The devices and the server use the winston library to provide access/error logging.  This provided off the shelf logging both locally, across the network and with multiple transports including email for notification of devices going down and errors.

## Application/Log Server
The application server includes is a winstond log server and an http server and browser client combined.  The server can be built by running, `npm run build` followed by `sudo npm run start`.  There should only be one server running in the deployed environment.  This server will be configured to automatically restart on crash and reboot using pm2.  The commands to set that up are, 

```
pm2 startup
sudo pm2 start build/pm2-server.json
pm2 save
```

Note all the `sudo's` above are because the server runs on port 80.  Change that and you don't need sudo.  Once configured and in operation, `sudo pm2 list` will list the currently executing node processes.

The server holds its data in the build/data folder.  This includes the access list and the logs from all devices.  These are just .json files and could be manually edited, viewed.  This is mentioned because overall this is very simple.  Where it gets more complex is when we introduce the browser client for viewing logs and updating the access list.  Strictly speaking it is not necessary, but for end user simplicity, it was added.

The server should be configured with a static IP or other static name resolution mechanism as the devices will need to be configured to point to the server and the server will need to be referenced by an end user through the browser.

## Devices
The devices will probably not be that varied or if they are they will be only subtle variations.  Right now there are two, located in the devices folder.  There is plug.js and door.js.  The devices are configured via devices/config.js and this configuration is mandatory as it includes the url to the server and the id of the device.  The id of the device identifies the log entries from the device and is used when tying users to particular devices through the access list.  Devices should also be configured to automatically restart on crash and reboot using pm2.  The commands to set that up for say the plug, are:

```
pm2 startup
sudo pm2 start build/devices/plug.js
pm2 save
```
Note all the `sudo` above is because the harward interface library used requires root.  Once configured and in operation, `sudo pm2 list` will list the currently executing node processes.

## Access List
The access list defines the user, their rfid tag and the devices they have access to.  Typical workflow for the lab would be to maintain the membership, rfid access list in a google sheet.  This sheet can be saved to .csv when it is changed (File -> Download As -> Comma-separated values).  This csv would then be uploaded to the server.  The sheet will have the following columns, note the header names, Name and RFID are mandatory.  The remaining names should match the id set in the configuration file for the various devices.  An x in the column for a device indicates the user has access to that device.

Name | RFID | makerlab-entrance | laser-cutter | more-machines...
---- | ---- | ----------------- | ------------ | ----------------
Agent Smith | 6F007F12C3C1 | x | x | ...
Sarah Connor | 6F007F12C3C2 | x |  | ...
... | | | 

In this example, both users have access to the building, but only Agent Smith has access to the laster-cutter.

### Reading New RFID Tags 
Most cards won't have the RFID printed on them and even if they do its unlikely it is in the same format as the access list expects it.  So, when assigning a new card to someone, just go scan it on some device.  Then look in the logs and you will see a row with User 'Unknown' and the rfid tag.  Now you have it.

## Browser Client
The browser client is available at http://192.168.1.14 where the IP address is the server's IP address.  The interface is very straightforward allowing you to view device usage and update the access list.  

## Hardware
The system is targetd at raspberry pi's and uses the `rpio` library to interface with it.  The server can be run concurrently with a device however multiple devices on the same pi will probably not work as is.  Since rpio uses the memory version of hardware access, right now you do need to run the devices with sudo.

Both plug and door are targeted at the Pimoroni Automation phat.  This is not necessary, but was just easier than using a level shifter and separate relay for handling 5v for the plug and 12v for the door.

## Todo
Put in filtering on the Access Logs page.
Add in the Mail transport to email errors to staff.
Implement the device status page and watchdog on the server to email when a device doesn't call home every so often.
Put in log rotation so we don't fill up.

## Brand New Pi Notes

My own notes to go with this as to what I did to setup a brand new Pi flashed with Raspbian lite.

```
#update
sudo apt update
sudo apt full-upgrade

#install node on pi 3, https://nodejs.org/en/download/package-manager/#debian-and-ubuntu-based-linux-distributions
curl -sL https://deb.nodesource.com/setup_8.x | sudo -E bash -
sudo apt-get install -y nodejs

#install node on pi zero w, https://github.com/sdesalas/node-pi-zero
wget -O - https://raw.githubusercontent.com/sdesalas/node-pi-zero/master/install-node-v8.9.0.sh | bash

#install build tools, build native add-ons and junk
sudo apt-get install -y build-essential
sudo apt-get install -y git

#set a static ip (only needed for server device)
ip -4 addr show | grep global   # get ip address and broadcast address
ip route | grep default | awk '{print $3}'  # get gateway
cat /etc/resolv.conf    # get nameserver
sudo nano /etc/dhcpcd.conf

interface wlan0
static ip_address=192.168.1.14/24
static routers=192.168.1.1
static domain_name_servers=192.168.1.1

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
```
#Set the password
sudo smbpasswd -a pi