( function()
{
    var src             = $( "script[src*='mimiq.js']" ).attr( "src" ) || ""
    ,   hostElements    = src.match( /^(https?:\/\/[^\/]*)\/?/i )
    ,   url             = ( $.isArray( hostElements ) && hostElements.length > 1 ) ? hostElements[ 1 ]: ""
    ,   connected       = false
    ,   socket
    ,   socketId
    ;

    $.getScript( url + "/socket.io/socket.io.js", function()
    {
        socket  = io.connect( url );

        bindSocketEvents();
    } );

    var scrollTimer
    ,   mySendTop
    ;

    $( window ).bind( "scroll", function( e, data )
    {
        clearInterval( scrollTimer );
        scrollTimer = setTimeout( function()
        {
            if ( connected )
            {
                mySendTop = $( window ).scrollTop();

                socket.emit( "dom",
                {
                    type:           "scroll"
                ,   top:            mySendTop
                } );
            }
        }, 10 );
    } );

    document.getElementsByTagName( "body" )[0].addEventListener( "click", function( e, data )
    {
        console.log( e, data );

        if ( data && data.isMimiq )
        {
            return;
        }

        if ( connected )
        {
            var targetSelector = determineDOMSelector( e.target );

            socket.emit( "dom",
            {
                type:           "click"
            ,   target:         targetSelector
            } );
        }

    }, true );

    // $( "body" ).bind( "click", function( e, data )
    // {
    //     if ( data && data.isMimiq )
    //     {
    //         return;
    //     }

    //     if ( connected )
    //     {
    //         var targetSelector = determineDOMSelector( e.target );

    //         socket.emit( "dom",
    //         {
    //             type:           "click"
    //         ,   target:         targetSelector
    //         } );
    //     }
    // } );

    $( "body" ).bind( "keyup", function( e, data )
    {
        if ( connected )
        {
            var targetSelector = determineDOMSelector( e.target )
            ,   inputValue
            ;

            if ( e.target.nodeName === "INPUT" || e.target.nodeName === "TEXTAREA" )
            {
                inputValue = e.target.value;
            }

            socket.emit( "dom",
            {
                type:           "keyup"
            ,   target:         targetSelector
            ,   inputValue:     inputValue
            } );
        }
    } );


    function determineDOMSelector( el )
    {
        var selector = []
        ,   $el      = $( el )
        ,   $parent
        ;

        do
        {
            $parent         = $el.parent();

            var myNodeName      = $el.prop( "nodeName" ).toLowerCase()
            ,   index           = $parent.children().filter( myNodeName ).index( $el )
            ,   mySelector      = myNodeName + ":eq(" + index + ")"
            ;

            selector.unshift( mySelector );

            $el = $parent;
        } while( $parent[0] !== document );

        return selector.join( " " );
    }

    function cleanupSocket()
    {
        connected = false;

        delete io.sockets[ url ];
        io.j = [];
    }

    function bindSocketEvents()
    {
        socket.on(
            "connect"
        ,   function( data )
            {
                console.log( "connected" )
                connected = true;
            }
        );

        socket.on(
            "disconnect"
        ,   function()
            {
                cleanupSocket();
            }
        );

        socket.on(
            "error"
        ,   function( reason )
            {
                cleanupSocket();
            }
        );

        socket.on(
            "socketId"
        ,   function( data )
            {
                socketId = data.socketId;
            }
        );

        socket.on(
            "dom"
        ,   function( data )
            {
                if ( data.socketId === socketId )
                {
                    return;
                }

                console.log( "Received DOM event", data.type, data );

                var $target;

                switch( data.type )
                {
                    case "click":
                        $target = $( data.target );
                        $target.trigger( "click", { isMimiq: true } );
                    break;

                    case "keyup":
                        if ( data.inputValue !== undefined )
                        {
                            $target = $( data.target );
                            $target.val( data.inputValue );
                        }
                    break;

                    case "scroll":
                        $( window ).scrollTop( data.top );
                    break;
                }
            }
        );
    }
} ());