# MakerLab RFID Backend

The MakerLab RFID system has been broken into a few parts.  These pieces make it simple to use off the shelf smart plugs or custom plugs.  An rfid scanner can also be separate from the plug, so we could have one central console/scanner with a UI for selecting the machines to enable and/or multiple headless scanners at each device.  

# LabServer - server.js 
This is the main server that is responsible for turning on and off smart plugs.  The configuration for each plug is stored in the config file for the server.  Only one server runs.  The server also serves up an HTML client page that both shows machine status and allows a user to checkout a machine.  This will likely be the simpler initial implementation as we just need one scanner and one screen.

npm run develop <- build, run and rebuild
npm run start <- run

Listens (for now on 8082) for:
- / - returns the client enable/disable/status UI page
- /status - returns status of all machines, enabled, disabled, user
- /client-request-scan/:machineid - requests that a local RFID scan be performed and the machine be enabled/disabled
:machineid - Id of the plug to be turned on/off
- /rfidscan/:machineid/:rfid/:enabled - enabled/disables plug
:rfid - Id of the individual requesting on/off
:machineid - Id of the plug to be turned on/off
:enabled - true or false, true to enable the plug, false to disable
   
Loops Continuosly (not implemented)
1. Check if user has left the building, If configured to do so, disable plugs turned on by that user
2. Check if idle current on enabled device over last 15 minutes, If configured to do so, disable plug
3. Can just be a part of the LabServer or can be separate but maybe just make calls to server regardless

# PlugServer - plugd.js
This server runs with each custom smart plug.  This will turn on/off and report the status of that plug.  Pi needs a fixed IP that the server will have in its config to associate the pi to the plug/machine.

node plugd.js

Listens (for now on 8081) for:
- /plug-enable 
- /plug-disable 
- /plug-status
     
# ScannerD - not implemented
Listens on the serial port for rfid scans.  Can be installed with each smart plug or separately.  The configuration determines which smart plug this scanner turns on or off.  

Calls the LabServer /rfidscan/:machineid/:rfid/:enabled endpoint on each rfid scan

    config {
            scannerId: static
            machineId: static
    }

