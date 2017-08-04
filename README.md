# MakerLab RFID Backend

The MakerLab RFID system has been broken into a few parts.  These pieces make it simple to use off the shelf smart plugs or custom plugs.  An rfid scanner can also be separate from the plug, so we could have one central console/scanner or multiple scanners.  

# LabServer - server.js 
This is the main server that is responsible for turning on and off smart plugs.  The configuration for each plug is stored in the config file for the server.  Only one server runs.

    npm run server

Listens (for now on 8082) for:
- /status - returns status of all machines, enabled, disabled, user
- /rfidscan/:machineid/:rfid/:enabled
:rfid - Id of the individual requesting on/off
:machineid - Id of the plug to be turned on/off
:enabled - true or false, true to enable the plug, false to disable
   
Loops Continuosly (not implemented)
1. Check if user has left the building, If configured to do so, disable plugs turned on by that user
2. Check if idle current on enabled device over last 15 minutes, If configured to do so, disable plug
3. Can just be a part of the LabServer or can be separate but maybe just make calls to server regardless

Example Calls
```
    curl http://localhost:8082/rfidscan/3234343/hottub/true
    curl http://localhost:8082/rfidscan/3234343/hottub/false

    curl http://localhost:8082/rfidscan/3234343/chopsaw/true
    curl http://localhost:8082/rfidscan/3234343/chopsaw/false

    curl http://192.168.1.9:8082/rfidscan/3234343/hottub/true
    curl http://192.168.1.9:8082/rfidscan/3234343/hottub/false

    curl http://192.168.1.9:8082/rfidscan/3234343/chopsaw/true
    curl http://192.168.1.9:8082/rfidscan/3234343/chopsaw/false
```

# PlugServer - plugd.js
This server runs with each custom smart plug.  This will turn on/off and report the status of that plug.  Pi needs a fixed IP that the server will have in its config to associate the pi to the plug/machine.

    npm run plugd

Listens (for now on 8081) for:
- /plug/enable 
- /plug/disable 
- /plug/status
     
   
# ScannerD - not implemented
Listens on the serial port for rfid scans.  Can be installed with each smart plug or separately.  The configuration determines which smart plug this scanner turns on or off.  Alternatively, the UI could allow a user to select the plug they'd like to turn on/off.

Calls the LabServer /rfidscan/:machineid/:rfid endpoint on each rfid scan

    config {
            scannerId: static
            machineId: static
    }

# OpenHAB - The off the shelf plug controller
This abstracts away the logic of controlling off the shelf plugs.  This software presents a rest api that the LabServer calls (when the configured plug specifies) to turn on and off these plugs.  OpenHAB can be easily installed on a Raspberry Pi and can be run on the same Pi as the LabServer.  To install OpenHAB, see http://docs.openhab.org/installation/linux.html
