var socketIo    = require( "socket.io" )
,	connect		= require( "connect" )
;

var app = connect()
	.use( connect.logger() )
	.use( connect.static( __dirname + "/../public" ) )
	.listen( 8080 );


// Start listen for websocket connections on client server
//
var io = socketIo.listen( app );

var clients = {};

/**
 * Client handling
 */
io.configure( function ()
{
    io.set(
        "authorization"
    ,   function( handshakeData, fn )
        {
            var error
            ,   authorized  = false
            ;

			authorized = true;

			fn( error, authorized );
        }
    );
} );

/**
 * Incoming connection, authentication has been done at this point. We know who we are dealing with.
 */
io.sockets.on( "connection", function( socket )
{
	clients[ socket.id ] = socket;

	socket.emit( "socketId", { socketId: socket.id } );

    socket.on( "disconnect", function()
    {
        delete clients[ socket.id ];
    } );

    socket.on( "dom", function( data )
    {
    	data.socketId = socket.id;

    	console.log( "data", data );

    	socket.broadcast.emit( "dom", data );
    })
} );