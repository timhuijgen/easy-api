(function( $ ) {
    /**
     * @param {string} url
     * @param {object} options
     * @constructor
     */
    var API = function( url, options ) {
        this.url          = url;
        this.routes       = options.routes || {};
        this.domains      = [];
        this.ajax_options = options.options || {};
        if ( options.domains ) {
            $.each(options.domains, function( key, domain ) {
                this.addDomain(key, domain);
            }.bind(this));
        }
    };

    /**
     * Perform the ajax call to the API
     * @param {string} method
     * @param {string} path
     * @param {object|null} data
     * @param {object|null} options
     * @returns {Promise}
     */
    API.prototype.ajax = function( method, path, data, options ) {
        data = data || {};
        options = options || {};

        return new Promise(function( resolve, reject ) {

            var combinedOptions = $.extend({}, {
                method:   method,
                data:     data,
                dataType: 'json',
                error:    reject,
                success:  resolve
            }, this.ajax_options, options);

            $.ajax(this.url + path, combinedOptions);
        }.bind(this));
    };

    /**
     * Shorthand POST call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.post = function( path, data, options ) {
        return this.ajax('POST', path, data, options);
    };

    /**
     * Shorthand GET call
     * @param {string} path
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.get = function( path, data, options ) {
        return this.ajax('GET', path, data, options);
    };

    /**
     * Shorthand PUT call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.put = function( path, data, options ) {
        return this.ajax('PUT', path, data, options);
    };

    /**
     * Shorthand DELETE call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.delete = function( path, data, options ) {
        return this.ajax('DELETE', path, data, options);
    };

    /**
     * Get a route from the collection and parse any variables in it from the data object
     * @param {string} key
     * @param {object} data
     * @returns {string}
     */
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

    /**
     * Build a route based on the domain name and function being called
     * @param {string} domain
     * @param {string} fn
     * @param {object} data
     * @returns {string}
     */
    API.prototype.buildRoute = function( domain, fn, data ) {
        var key = domain + '.' + fn;
        return this.getRoute(key, data);
    };

    /**
     * Add routes
     * @param {object} routes
     * @returns {API}
     */
    API.prototype.addRoutes = function( routes ) {
        this.routes = $.extend(true, this.routes, routes);

        return this;
    };

    /**
     * Overwrite the current routes with a new object
     * @param routes
     * @returns {API}
     */
    API.prototype.setRoutes = function( routes ) {
        this.routes = routes;

        return this;
    };

    /**
     * Add one or more domain(s)
     * @param {...object} arguments
     * @returns {API}
     */
    API.prototype.add = function() {
        var args = arguments;

        if ( args.length === 0 ) {
            return this;
        }

        if ( args.length > 1 && args.length % 2 === 0 ) {
            // There is even amount of arguments & 2 or more
            for ( var i = 0; i < args.length; i += 2 ) {
                this.addDomain(args[ i ], args[ i + 1 ]);
            }
            return this;
        } else if ( $.isArray(args[ 0 ]) && args[ 0 ].length % 2 === 0 ) {
            // Is array and even amount of arguments
            for ( var y = 0; y < args[ 0 ].length; y += 2 ) {
                this.addDomain(args[ 0 ][ y ], args[ 0 ][ y + 1 ]);
            }
            return this;
        } else if ( $.isPlainObject(args[ 0 ]) ) {
            // Is object
            $.each(args[ 0 ], function( key, value ) {
                this.addDomain(key, value);
            }.bind(this));
            return this;
        }

        throw Error('Could not parse arguments', args);
    };

    /**
     * Add one domain and setup the properties
     * @param {string} name
     * @param {object} domain
     * @returns {API}
     */
    API.prototype.addDomain = function( name, domain ) {
        var self     = this,
            reserved = [ 'get', 'post', 'put', 'delete' ];

        $.each(domain, function( key, prop ) {
            if ( reserved.indexOf(key) > -1 ) {
                throw Error('You can not define a function with the following reserved name: ' + key);
            }
            if ( typeof prop === "object" ) {
                Object.defineProperty(domain, key, {
                    get: function() {
                        return function( data ) {
                            var path = (prop.route)
                                ? self.getRoute(prop.route, data)
                                : self.buildRoute(name, key, data);
                            var options = prop.options || {};
                            return self[ prop.method.toLowerCase() ].apply(self, [path, data, options]);
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

    /**
     * Small domain wrapper
     * @param {string} name
     * @param {API} API
     * @constructor
     */
    var Domain = function( name, API ) {
        this.API   = API;
        this._name = name;
    };

    /**
     * Shorthand getRoute for domains
     * @param {string} key
     * @param {object} data
     * @returns {string}
     */
    Domain.prototype.getRoute = function( key, data ) { return this.API.getRoute(key, data); };

    /**
     * Shorthand ajax functions
     * @param {...}
     * @returns {Promise}
     */
    Domain.prototype.get = function( a, b ) { return this.API.get(a, b) };
    Domain.prototype.post   = function( a, b, c ) { return this.API.post(a, b, c) };
    Domain.prototype.put    = function( a, b, c ) { return this.API.put(a, b, c) };
    Domain.prototype.delete = function( a, b, c ) { return this.API.delete(a, b, c) };

    /**
     * Export to window or as module depending on environment
     * @type {API}
     */
    (function( factory ) {
        if ( typeof exports === 'object' ) {
            module.exports = exports = factory;
        } else {
            window.API = factory;
        }
    })(API);

    /**
     * Require jQuery or check for it in the DOM
     */
})(function() {
    if ( typeof exports === 'object' ) {
        require('promise-polyfill');
        return require('jquery');
    }
    return window.jQuery || window.$;
}());