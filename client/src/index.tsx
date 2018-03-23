import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as moment from 'moment';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

const LabEntranceMachineID:string = "makerlab-entrance";

class Application extends React.Component<any,any> {
	private queryTimer:any;
	private accessTimer:any;
	private deviceUpTimer:any;
	private fileInput:any;

	constructor(props) {
		super(props);

		this.state = {
			accessUploadMsg: '',
			accessList: [],
			deviceList: [],
			deviceUpList: {},
			userList: [],
			activityList: [],
			filterDaySelected: 7,
			filterUserSelected: undefined,
			filterDeviceSelected: undefined
		};
		this.onChangeAccessList = this.onChangeAccessList.bind(this);
		this.handleInputChange = this.handleInputChange.bind(this);
	}

	onChangeAccessList (e) {
		if (!e.target.value) return;
		var formData = new FormData();
		this.setState({ accessUploadMsg : '(Updating...)' });
		formData.append('accesslist', e.target.files[0]);
		fetch('/access-list', {
			method: 'POST',
  			body: formData
		}).then((res) => {
			if (res.status==200) {
				this.fileInput.value='';	//Clear the file input after upload
				//Force refresh the access list
				this.getAccessList().then(() => {
					this.setState({ accessUploadMsg : '(Successfully Updated)' })
				});
			} else {					
				this.setState({ accessUploadMsg : '(Unable to Update: ' + res.toString() + ')' });
			}
		});
	}

	getAccessList() {
		return fetch('/access-list').then((res) => {
			if (res.status==200) {
				res.json().then((data) => {
					//Withdraw a set of unique devices
					var deviceList=[];
					if (data && data.length) {
						for (var prop in data[0]) {
							if (prop!='name' && prop!='rfid') {
								deviceList.push(prop);
							}
						}	
					}
					//Withdraw a set of unique users
					var userList = [];
					if (data) {
						userList=_.map(data, (user:any) => { return user.name; });
					}

					this.setState ({ 
						accessList: data, 
						deviceList: deviceList,
						userList: userList
					});
				});					
			} else {
				console.log('Error reading access-list: ' + res.toString());
			}				
			if (this.accessTimer) clearTimeout(this.accessTimer);
			this.accessTimer=setTimeout(this.getAccessList.bind(this), 1000*60*10);
		});
	}

	queryData(days?:number) {
		//Live data
		return fetch('/query' + (days ? '/' + days : '')).then((res) => {
			if (res.status==200) {
				res.json().then((data) => {
					this.setState ({ activityList: data });
				});					
			} else {
				console.log('Error reading status: ' + res.toString());
			}				
			if (this.queryTimer) clearTimeout(this.queryTimer);
			//Be way smarter here, when these logs get big this will be silly
			this.queryTimer=setTimeout(this.queryData.bind(this, this.state.filterDaySelected), 30000);
		});
	}

	getDeviceUpList() {
		return fetch('/device-up-list').then((res) => {
			if (res.status==200) {
				res.json().then((data) => {
					this.setState ({ 
						deviceUpList: data || {}
					});
				});					
			} else {
				console.log('Error reading device-up-list: ' + res.toString());
			}				
			if (this.deviceUpTimer) clearTimeout(this.deviceUpTimer);
			this.deviceUpTimer=setTimeout(this.getDeviceUpList.bind(this), 1000*60*1);
		});		
	}

	componentDidMount() {
		//Get the access list, do it every couple of minutes in case some other console updates it
		this.getAccessList();
		
		//Start retrieving live log data
		this.queryData(this.state.filterDaySelected);

		//Start retrieving live machine status data
		this.getDeviceUpList();
	}

	componentWillUnmount() {
		if (this.queryTimer) clearTimeout(this.queryTimer);
		if (this.accessTimer) clearTimeout(this.accessTimer);
		if (this.deviceUpTimer) clearTimeout(this.deviceUpTimer);
	}

	handleInputChange(event) {
		const target = event.target;
		const value = target.type === 'checkbox' ? target.checked : target.value;
		const name = target.name;

		//Handle the change
		switch (name) {
			case "filterDaySelected": 
				this.setState({ [name]: value });
				this.queryData(value);
				break;
			default:
				this.setState({ [name]: value });
		}	
	}

	renderBuildingLog (log:any[]) {
		//Setup the activity list tab
		let queryLst = [<span>Loading or no activity log entries exist....</span>];

		//Filter out data (days is alread done on server request, but for now...)
		log = log || [];
		log = _.filter(log, (a) => { return a.machineId==LabEntranceMachineID; });
		if (this.state.filterUserSelected) log = _.filter(log, (a) => { return a.user==this.state.filterUserSelected; });

		let userOptions = _.map(this.state.userList, (a:string) => { return (<option value={a}>{a}</option>); });
		userOptions=[<option value="">All</option>, <option value="Unknown">Unknown</option>].concat(userOptions);

		let header=[
			<td>
				<b>Date</b> - 
					<select name="filterDaySelected" value={this.state.filterDaySelected}  onChange={this.handleInputChange}>
						<option value="7">Last 7 Days</option>
						<option value="30">Last 30 Days</option>
						<option value="60">Last 60 Days</option>
						<option value="90">Last 90 Days</option>
					</select>
			</td>, 
			<td>
				<b>User</b> - <select name="filterUserSelected" value={this.state.filterUserSelected}  onChange={this.handleInputChange}>{ userOptions }</select>
			</td>, 
			<td><b>RFID</b></td>,				
			<td><b>Message</b></td>
		];
		queryLst=[<tr> { header } </tr>];
		_.forEach(log, (act) => {
   			//if (act.level==='error') return;
			queryLst.push(<tr>
				<td>{ moment(act.timestamp).format('MM/DD/YYYY h:mm a') }</td>
				<td>{ act.user }</td>
				<td>{ act.rfid }</td>
				<td>{ act.message }</td>					
			</tr>);
		});

		queryLst = [<table> { queryLst } </table>];
		return queryLst;		
		
	}

	renderDeviceLog (log:any[]) {
		//Setup the activity list tab
		let queryLst = [<span>Loading or no activity log entries exist....</span>];
		let durationTotal=0;

		//Filter out data (could have already been done on server request, but for now...)
		log = log || [];
		if (this.state.filterUserSelected) log = _.filter(log, (a) => { return a.user==this.state.filterUserSelected; });
		if (this.state.filterDeviceSelected) {
			log = _.filter(log, (a) => { return a.machineId==this.state.filterDeviceSelected; });
		} else {
			log = _.filter(log, (a) => { return a.machineId!=LabEntranceMachineID; });
		}

		//Merge enable/disable pairs and add duration column to enable/disable pairs			
		var nlog:any[] = [];
		for (var i=0; i<log.length; i++) {
			//If this is a shutoff row
			if (log[i].message==='disabled') {
				//If the next row exists and is a turn on row
				if (i+1 < log.length && log[i+1].message==='enabled') {
					//Finally if the users are the same, then set the duration column
					if (log[i].rfid == log[i+1].rfid) {
						var hours = Math.floor((moment(log[i].timestamp).diff(moment(log[i+1].timestamp))/1000/60/60)*100)/100;
						durationTotal+=hours;

						nlog.push({
							timestamp: moment(log[i+1].timestamp).format('MM/DD/YYYY h:mm ') + ' to ' + moment(log[i].timestamp).format('h:mm a'),
							duration: hours + ' hrs',
							user: log[i+1].user,
							rfid: log[i+1].rfid,
							machineId: log[i+1].machineId
						});
						log[i].duration = hours;
						i++;
						continue;
					}
				} 
			}
			nlog.push({
				timestamp: moment(log[i].timestamp).format('MM/DD/YYYY h:mm a'),
				user: log[i].user,
				rfid: log[i].rfid,
				machineId: log[i].machineId
			});
		}

		let userOptions = _.map(this.state.userList, (a:string) => { return (<option value={a}>{a}</option>); });
		userOptions=[<option value="">All</option>, <option value="Unknown">Unknown</option>].concat(userOptions);
		let deviceOptions = _.map(_.filter(this.state.deviceList, (a) => { a!=LabEntranceMachineID }), (a:string) => { return (<option value={a}>{a}</option>); });
		deviceOptions=[<option value="">All</option>].concat(deviceOptions);

		let header=[
			<td>
				<b>Date</b> - 
					<select name="filterDaySelected" value={this.state.filterDaySelected} onChange={this.handleInputChange}>
						<option value="7">Last 7 Days</option>
						<option value="30">Last 30 Days</option>
						<option value="60">Last 60 Days</option>
						<option value="90">Last 90 Days</option>
					</select>
			</td>, 
			<td>
				<b>Duration (hr) - { Math.floor(durationTotal*10.0)/10.0 } </b>
			</td>, 
			<td>
				<b>User</b> - <select name="filterUserSelected" value={this.state.filterUserSelected} onChange={this.handleInputChange}>{ userOptions }</select>
			</td>, 
			<td><b>RFID</b></td>,				
			<td>
				<b>Device</b> - <select name="filterDeviceSelected" value={this.state.filterDeviceSelected} onChange={this.handleInputChange}>{ deviceOptions }</select>
			</td>,
			<td><b>Message</b></td>
		];
		queryLst=[<tr> { header } </tr>];
		_.forEach(nlog, (act) => {
   			//if (act.level==='error') return;
			queryLst.push(<tr>
				<td>{ act.timestamp }</td>
				<td>{ act.duration }</td>
				<td>{ act.user }</td>
				<td>{ act.rfid }</td>
				<td>{ act.machineId }</td>
				<td>{ act.message }</td>					
			</tr>);
		});

		queryLst = [<table> { queryLst } </table>];
		return queryLst;		
	}

	renderAccessList() {
		//Setup the access list tab
		let accLst = [<span>Loading or no users exist and you should upload some....</span>];
		if (this.state.accessList && this.state.accessList.length) {
			let header=[<td><b>User</b></td>, <td><b>RFID Tag</b></td>];
			_.forEach(this.state.deviceList, (name) => {
				header.push(<td><b>{ name }</b></td>);
			});
			accLst=[<tr> { header } </tr>];
			_.forEach(this.state.accessList, (user) => {
				var cols = [];
				cols.push(<td>{ user.name }</td>);
				cols.push(<td>{ user.rfid }</td>);
				_.forEach(this.state.deviceList, (name) => {
					cols.push(<td>{ user[name] }</td>);
				});
				accLst.push(<tr>{cols}</tr>);
			});

			accLst = [<table> { accLst } </table>];
		}
		return accLst;
	}

	renderDeviceUpList() {
		//Setup the access list tab
		let header=[<td><b>Machine ID</b></td>, <td><b>Last Checkin</b></td>];
		let accLst=[<tr> { header } </tr>];
		_.forOwn(this.state.deviceUpList, (val, key) => {				
			var cols = [], css:any={};
			if (moment(new Date()).diff(moment(val), 'minutes') > 5) {
				css.color="red";
			}
			cols.push(<td>{ key }</td>);
			cols.push(<td><span style={css}>{ moment(val).format('MM/DD/YYYY h:mm a') }</span></td>);
			accLst.push(<tr>{cols}</tr>);
		});
		if (accLst.length==1) {
			accLst = [<span>Loading or no device status information is available....</span>];
		} else {
			accLst = [<table> { accLst } </table>];
		}
		return accLst;
	}

	render() { 
		let buildingLst = this.renderBuildingLog(this.state.activityList); 
		let deviceLst = this.renderDeviceLog(this.state.activityList);
		let deviceUpLst = this.renderDeviceUpList();
		let accLst = this.renderAccessList();

		return (
			<div>
				<h1>MakerLab Device and Premise Access System</h1>
				<Tabs>
					<TabList>
						<Tab>Entry Logs</Tab>
						<Tab>Device Logs</Tab>
						<Tab>Device Up Status</Tab>
						<Tab>User List</Tab>
					</TabList>
					<TabPanel>
						{ buildingLst }
					</TabPanel>
					<TabPanel>
						{ deviceLst }
					</TabPanel>
					<TabPanel>
						{ deviceUpLst }
					</TabPanel>
					<TabPanel>
						<form>
							Update the Access List by uploading a csv file with a column for the users Name, RFID, and a column for each device with a header row containing the device id.  For each device, an 'x' in the column indicates the user has access while any other value will not grant access.  NOTE: The maker lab entrance lock column must be titled "{LabEntranceMachineID}"
							{ this.state.accessUploadMsg }: <input style={{ display:'inline' }} type="file" onChange={this.onChangeAccessList} ref = { (r) => { this.fileInput = r; } }/> 
						</form> 
						{ accLst }
					</TabPanel>					
				</Tabs>
			</div>);
		
	}
}

ReactDOM.render(<Application />, document.getElementById('react-app'));
