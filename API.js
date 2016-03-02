require('promise-polyfill');
var $      = require('jquery');
var Domain = require('./domain');

var API = function( url, options ) {
    this.url     = url;
    this.routes  = options.routes || {};
    this.domains = [];
    if ( options.domains ) {
        $.each(options.domains, function( key, domain ) {
            this.addDomain(key, domain);
        }.bind(this));
    }
};

API.prototype.ajax = function( method, path, data ) {
    data = data || {};
    return new Promise(function( resolve, reject ) {
        $.ajax(this.url + path, {
            method:   method,
            data:     data,
            dataType: 'json',
            error:    reject,
            success:  resolve
        });
    }.bind(this));
};

API.prototype.post = function( path, data ) {
    return this.ajax('POST', path, data);
};

API.prototype.get = function( path ) {
    return this.ajax('GET', path);
};

API.prototype.put = function( path, data ) {
    return this.ajax('PUT', path, data);
};

API.prototype.delete = function( path, data ) {
    return this.ajax('DELETE', path, data);
};

API.prototype.getRoute = function( key, data ) {
    data = data || {};
    if ( this.routes.hasOwnProperty(key) ) {
        var route  = this.routes[ key ],
            chunks = route.split(':');

        if ( chunks.length > 1 ) {
            if ( data.hasOwnProperty(chunks[ 1 ]) ) {
                return route.replace(':' + chunks[ 1 ], data[ chunks[ 1 ] ]);
            }
        }

        return route;
    }

    throw Error('API Route [' + key + '] does not exist');
};

API.prototype.buildRoute = function( domain, fn, data ) {
    var key = domain + '.' + fn;
    return this.getRoute(key, data);
};

API.prototype.addRoutes = function( routes ) {
    this.routes = $.extend(true, this.routes, routes);

    return this;
};

API.prototype.setRoutes = function( routes ) {
    this.routes = routes;

    return this;
};

API.prototype.add = function() {
    var args = arguments;

    if ( args.length === 0 ) {
        return;
    }

    if ( args.length > 1 && args.length % 2 === 0 ) {
        // There is even amount of arguments & 2 or more
        for ( var i = 0; i < args.length; i += 2 ) {
            this.addDomain(args[ i ], args[ i + 1 ]);
        }
        return;
    } else if ( $.isArray(args[ 0 ]) && args[ 0 ].length % 2 === 0 ) {
        // Is array and even amount of arguments
        for ( var y = 0; y < args[ 0 ].length; y += 2 ) {
            this.addDomain(args[ 0 ][ y ], args[ 0 ][ y + 1 ]);
        }
        return;
    } else if ( $.isPlainObject(args[ 0 ]) ) {
        // Is object
        $.each(args[ 0 ], function( key, value ) {
            this.addDomain(key, value);
        }.bind(this));
        return;
    }

    throw Error('Could not parse arguments', args);
};

API.prototype.addDomain = function( name, domain ) {
    var self    = this,
        rewrite = [ 'get', 'post', 'put', 'delete' ];

    $.each(domain, function( key, prop ) {
        if ( rewrite.indexOf(key) > -1 ) {
            throw Error('You can not define a function with the following protected name: ' + key);
        }
        if ( typeof prop === "object" ) {
            Object.defineProperty(domain, key, {
                get: function() {
                    return function( data ) {
                        var path = '';
                        if ( prop.route ) {
                            path = self.getRoute(prop.route, data);
                        } else {
                            path = self.buildRoute(name, key, data);
                        }
                        return self[ prop.method.toLowerCase() ].call(self, path, data);
                    }
                },
                set: function() { throw Error('You can not directly set API functions'); }
            })
        }
    });

    this.domains[ name ] = $.extend(new Domain(name, this), domain);

    Object.defineProperty(this, name, {
        get: function() { return self.domains[ name ] },
        set: function() { throw Error('You can not directly set domains'); }
    });

    return this;
};

module.exports = API;