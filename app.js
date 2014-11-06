var cluster	= require( "cluster" );		//Require the cluster module
var http	= require( "http" );		//Require the http module
var ws		= require( "ws" ).Server;	//Require the WebSocket server module

var workers	= new Array();

if( cluster.isMaster ){
	for( var i = 0; i < require( "os" ).cpus().length; i ++){
		var thread	= cluster.fork();
		thread.on("message", function( message ){
			workers.forEach( function( worker ){
				if( worker.process.pid != thread.process.pid ){
					worker.send( message );
				}
			});
		});
		workers.push( thread );
	}
	return;
}

var server	= http.createServer().listen( 8080 );
var wss		= new ws( {server: server} );

wss.on( "connection", function( ws ){
	ws.on( "message", function( message ){
		process.send( message );
	});
});
