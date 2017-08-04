import * as React from 'react';
import * as ReactDOM from 'react-dom';
import * as _ from 'lodash';
import * as moment from 'moment';

interface Machine {
	id:string,
	name:string;
	inUse:boolean;
	inUseBy:string;
	inUseStarted:Date;
	image:string;
	isScanning:boolean;
	messages:string[];
}

class Application extends React.Component<any,any> {
	private dataTimer:any;

	constructor(props) {
		super(props);
		this.state = {
			machines: []
		};
		this.onClickButton=this.onClickButton.bind(this);
	}

	onClickButton(name:string) {
		var cm = _.find(this.state.machines, (a:Machine) => a.name==name);
		if (cm) {
			//Let the server know which machine we want to work with
			fetch('/client-request-scan/' + cm.id).then((res) => {
				if (res.status==200) {
					//Pre-set, truth still determined by server
					cm.isScanning = true;
					this.setState({machines: this.state.machines});
				} else {					
					console.log('Error requesting scan: ' + res.toString());
				}
			});
		}
	}

	componentDidMount() {
		//Start retrieving data
		function serverState() {
			//Live data
			fetch('/machine-status').then((res) => {
				if (res.status==200) {
					res.json().then((data) => {
						//console.log(JSON.stringify(data, null, 3));
						this.setState ({ machines: data });
					});					
				} else {
					console.log('Error reading status: ' + res.toString());
				}				
				this.dataTimer=setTimeout(serverState.bind(this), 1000);
			});
		}
		serverState.bind(this)();
	}

	componentWillUnmount() {
		clearTimeout(this.dataTimer);
	}

	render() { 
		var style = { 
			textAlign:'center', 
			backgroundColor: '#dddddd',
			marginTop:'10px',
			marginBottom:'10px',
			padding: '10px',
			border: 'solid grey 1px'
		};

		var anyScanning = _.find(this.state.machines, (a:Machine) => a.isScanning);

		var tiles = this.state.machines.map((a:Machine) => {
			var usage;
			if (a.inUse) {
				usage = "In use by " + a.inUseBy + " starting " + moment(a.inUseStarted).calendar().toLowerCase() + ".";
			} else {
				usage = "Not in use."
			}

			var disabled = anyScanning && !a.isScanning;
			var classes = "btn btn-lg " + (a.inUse ? 'btn-danger' : 'btn-success');
			var txt;
			if (a.isScanning) {
				txt = [<i className='fa fa-spinner fa-spin'></i>, ' Scan Your Badge'];
			} else {
				txt = a.inUse ? 'Disable (or take over)' : 'Enable';
			}
			var button = <button disabled={disabled} onClick={(event) => { this.onClickButton(a.name) }} style={{ width:'100%'}} type="button" className={classes}>{txt}</button>;

			return <div key={a.name} className="col-md-3">
				<div style={style}>
					<h2>{a.name}</h2>
					<h3>{a.inUse ? 'In Use by ' + a.inUseBy : 'Available'}</h3>
					{a.inUse ? <p>{"since " + moment(a.inUseStarted).calendar().toLowerCase()}</p>:<p>&nbsp;</p>}
					<h4 style={{marginTop:'2em'}} className="text-primary" >{a.messages}&nbsp;</h4>
					<p>{button}</p>
				</div>
			</div>
		})

		return (<div className="container-fluid">
			<div className="row">
				{tiles}
			</div>
		</div>);
	}
}

ReactDOM.render(<Application />, document.getElementById('react-app'));
