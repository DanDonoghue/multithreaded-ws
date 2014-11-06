var cluster	= require( "cluster" );		//Require the cluster module
var http	= require( "http" );		//Require the http module
var ws		= require( "ws" ).Server;	//Require the WebSocket server module

var workers	= new Array();

if( cluster.isMaster ){
	for( var i = 0; i < require( "os" ).cpus().length; i ++){
		var thread	= cluster.fork();
		thread.on("message", function( message ){
			workers.forEach( function( worker ){
				if( worker.process.pid != message.pid ){
					worker.send( message.msg );
				}
			});
		});
		workers.push( thread );
	}
	return;
}

var server	= http.createServer().listen( 8080 );
var wss		= new ws( {server: server} );

var connections = new Array();

process.on( "message", function( message ){
	connections.forEach( function( ws ){
		ws.send( message );
	});
});

wss.on( "connection", function( ws ){
	ws.send( "Connected to #"+ process.pid );
	ws.on( "message", function( message ){
		connections.forEach( function( otherWs ){
			if( otherWs != ws ){
				otherWs.send( message );
			}
		});
		process.send( {pid: process.pid, msg: message} );
	});
	ws.on( "close", function(){
		var index	= connections.indexOf( ws );
		connections.splice( index, 1 );
	});
	connections.push( ws );
});
