var gpio = require('onoff').Gpio;

//Configure the plug
class SmartPlug {
	constructor(gpioPinNumber) {
		this.pinNumber = gpioPinNumber;
		this.pin = new gpio(gpioPinNumber, 'out');
		this.enabled = false;
		this.disable();
	}

	destroy() {
		this.disable();
		this.pin.unexport();
	}

	status() {
		return { enabled: this.enabled };
	}

	enable() { 
		this.pin.writeSync(0); 
		this.enabled=true;
		console.log('Enabled Plug');
	}
	disable() {  
		this.pin.writeSync(1); 
		this.enabled=false;
		console.log('Disabled Plug');
	}
}

module.exports = SmartPlug;