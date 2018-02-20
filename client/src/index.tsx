import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as moment from 'moment';

import { Tab, Tabs, TabList, TabPanel } from 'react-tabs';

class Application extends React.Component<any,any> {
	private queryTimer:any;
	private accessTimer:any;
	private fileInput:any;

	constructor(props) {
		super(props);

		this.state = {
			accessUploadMsg: '',
			accessList: [],
			deviceList: [],
			userList: [],
			activityList: []
		};
		this.onChangeAccessList = this.onChangeAccessList.bind(this);
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

	queryData() {
		//Live data
		return fetch('/query').then((res) => {
			if (res.status==200) {
				res.json().then((data) => {
					this.setState ({ activityList: data });
				});					
			} else {
				console.log('Error reading status: ' + res.toString());
			}				
			if (this.queryTimer) clearTimeout(this.queryTimer);
			this.queryTimer=setTimeout(this.queryData.bind(this), 5000);
		});
	}

	componentDidMount() {
		//Get the access list, do it every couple of minutes in case some other console updates it
		this.getAccessList();
		
		//Start retrieving live log data
		this.queryData();
	}

	componentWillUnmount() {
		if (this.queryTimer) clearTimeout(this.queryTimer);
		if (this.accessTimer) clearTimeout(this.accessTimer);
	}

	render() { 
		//Setup the access list tab
		let accLst = [<h3>Loading or no users exist and you should upload some....</h3>];
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

		//Setup the activity list tab
		let queryLst = [<h3>Loading or no activity log entries exist....</h3>];
		if (this.state.activityList && this.state.activityList.length) {
			let header=[
				<td><b>Date</b></td>, 
				<td><b>Type</b></td>, 
				<td><b>User</b></td>, 
				<td><b>RFID</b></td>,				
				<td><b>Machine</b></td>,
				<td><b>Message</b></td>
			];
			queryLst=[<tr> { header } </tr>];
			_.forEach(this.state.activityList, (act) => {
				queryLst.push(<tr>
					<td>{ moment(act.timestamp).format('MM/DD, h:mm:ss a') }</td>
					<td>{ act.level }</td>
					<td>{ act.user }</td>
					<td>{ act.rfid }</td>
					<td>{ act.machineId }</td>
					<td>{ act.message }</td>					
				</tr>);
			});

			queryLst = [<table> { queryLst } </table>];
		}

		return (
			<div>
				<h1>Durango MakerLab Device and Premise Access System</h1>
				<Tabs>
					<TabList>
						<Tab>Access Logs</Tab>
						<Tab>User Access List</Tab>
						<Tab>Device Status</Tab>
					</TabList>

					<TabPanel>
						{ queryLst }
					</TabPanel>
					<TabPanel>
					<form>
						Update the Access List by uploading a csv file with a column for the users Name, RFID, and a column for each device with a header row containing the device id.  For each device, an 'x' in the column indicates the user has access while any other value will not grant access.
						{ this.state.accessUploadMsg }: <input style={{ display:'inline' }} type="file" onChange={this.onChangeAccessList} ref = { (r) => { this.fileInput = r; } }/> 
					</form> 
					{ accLst }
					</TabPanel>
					<TabPanel>
						<h3>Todo, display a list of active devices based on the last request for the access-list...</h3>
					</TabPanel>
				</Tabs>
			</div>);
		
	}
}

ReactDOM.render(<Application />, document.getElementById('react-app'));
