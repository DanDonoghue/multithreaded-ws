var cluster	= require( "cluster" );		//Require the cluster module
var http	= require( "http" );		//Require the http module
var ws		= require( "ws" ).Server;	//Require the WebSocket server module

var workers	= new Array();			//Array of worker threads

if( cluster.isMaster ){
	var cpus	= require( "os" ).cpus().length;	//Number of cores on this host
	for( var i = 0; i < cpus; i ++){
		var thread	= cluster.fork();		//Fork
		thread.on("message", function( message ){	//On an IPC message
			workers.forEach( function( worker ){	//Loop through the workers
				if( worker.process.pid != message.pid ){	//If the worker is not the sender
					worker.send( message.msg );	//Send the message
				}
			});
		});
		workers.push( thread );		//Add the thread to the array of workers
	}
	return;		//Prevent the master thread from executing past this point
}

var server	= http.createServer().listen( 8080 );	//Start the server on TCP 8080
var wss		= new ws( {server: server} );		//Create the WebSocket server and bind it to the http server

var connections = new Array();		//Array of active connections

process.on( "message", function( message ){	//On an IPC message
	connections.forEach( function( ws ){	//Loop through the active connections
		ws.send( message );		//Send the message
	});
});

wss.on( "connection", function( ws ){	//On a new WebSocket connection
	ws.send( "Connected to #"+ process.pid );	//Send the current pid to the client
	ws.on( "message", function( message ){		//On a message from the client
		connections.forEach( function( otherWs ){	//Loop through the active connections
			if( otherWs != ws ){		//If the connection in the array is not the originating connection
				otherWs.send( message );	//Send the message
			}
		});
		process.send( {pid: process.pid, msg: message} );	//Send the message to the master process
	});
	ws.on( "close", function(){	//On a closed connection
		var index	= connections.indexOf( ws );	//Get the index of the connection in the array of active connections
		connections.splice( index, 1 );		//Remove the index from the array
	});
	connections.push( ws );		//Add the connection to the array of active connections
});
