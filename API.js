(function () {
    /**
     * Require Promise & fetch & assign polyfills
     */
    if ( typeof exports === 'object' ) {
        require('promise-polyfill');
        require('whatwg-fetch');
        require('es6-object-assign').polyfill();
    }

    /**
     * Utils
     */
    var objectAssign = Object.assign,
        isObject     = function (prop) {
            return prop && prop.toString() === "[object Object]"
        },
        isArray      = function (prop) {
            return prop && Object.prototype.toString.call(prop) === "[object Array]"
        };

    /**
     * @param {string} url
     * @param {object} options
     * @constructor
     */
    var API = function (url, options) {
        if ( !url ) {
            throw Error('URL is required');
        }

        options = options || {};

        this.url     = url;
        this.routes  = options.routes || {};
        this.domains = [];
        this.options = options.options || {};

        if ( isObject( options.domains ) ) {
            for ( var key in options.domains ) {
                if ( !isObject(options.domains[ key ]) ) {
                    throw Error('Expecting objects in domains');
                }
                if ( options.domains.hasOwnProperty(key) ) {
                    this.addDomain(key, options.domains[ key ]);
                }
            }
        }
    };

    /**
     * Alias of fetch
     * @param {string} method
     * @param {string} path
     * @param {object|null} data
     * @param {object|null} options
     * @returns {Promise}
     */
    API.prototype.ajax = function (method, path, data, options) {
        return this.fetch(method, path, data, options);
    };

    /**
     * Perform the call to the API
     * @param {string} method
     * @param {string} path
     * @param {object|null} data
     * @param {object|null} options
     * @returns {Promise}
     */
    API.prototype.fetch = function (method, path, data, options) {
        data    = data || {};
        options = options || {};

        var parseOptions = [ 'arrayBuffer', 'blob', 'formData', 'json', 'text' ];

        var body = new FormData();
        body.append("json", JSON.stringify(data));

        var combinedOptions = Object.assign({},
            this.options,
            options,
            {
                method: method,
                body:   body
            });

        var promise = fetch(this.url + path, combinedOptions);

        if ( combinedOptions.parse && parseOptions.indexOf(combinedOptions.parse) > -1 ) {
            return promise.then(function (response) {
                if( response[combinedOptions.parse] ) {
                    return response[ combinedOptions.parse ].apply(response);
                }
                throw Error('Could not parse the results with [' + combinedOptions.parse + ']');
            })
        }

        return promise;
    };

    /**
     * Shorthand POST call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.post = function (path, data, options) {
        return this.fetch('POST', path, data, options);
    };

    /**
     * Shorthand GET call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.get = function (path, data, options) {
        return this.fetch('GET', path, data, options);
    };

    /**
     * Shorthand PUT call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.put = function (path, data, options) {
        return this.fetch('PUT', path, data, options);
    };

    /**
     * Shorthand DELETE call
     * @param {string} path
     * @param {object} data
     * @param {object} options
     * @returns {Promise}
     */
    API.prototype.delete = function (path, data, options) {
        return this.fetch('DELETE', path, data, options);
    };

    /**
     * Get a route from the collection and parse any variables in it from the data object
     * @param {string} key
     * @param {object} data
     * @returns {string}
     */
    API.prototype.getRoute = function (key, data) {
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
    API.prototype.buildRoute = function (domain, fn, data) {
        var key = domain + '.' + fn;
        return this.getRoute(key, data);
    };

    /**
     * Add routes
     * @param {object} routes
     * @returns {API}
     */
    API.prototype.addRoutes = function (routes) {
        this.routes = objectAssign({}, this.routes, routes);

        return this;
    };

    /**
     * Overwrite the current routes with a new object
     * @param routes
     * @returns {API}
     */
    API.prototype.setRoutes = function (routes) {
        this.routes = routes;

        return this;
    };

    /**
     * Add one or more domain(s)
     * @param {...object} arguments
     * @returns {API}
     */
    API.prototype.add = function () {
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
        } else if ( isArray(args[ 0 ]) && args[ 0 ].length % 2 === 0 ) {
            // Is array and even amount of arguments
            for ( var y = 0; y < args[ 0 ].length; y += 2 ) {
                this.addDomain(args[ 0 ][ y ], args[ 0 ][ y + 1 ]);
            }
            return this;
        } else if ( isObject(args[ 0 ]) ) {
            // Is object
            for ( var key in args[ 0 ] ) {
                if ( args[ 0 ].hasOwnProperty(key) ) {
                    this.addDomain(key, args[ 0 ][ key ]);
                }
            }
            return this;
        }

        throw Error('Could not parse arguments', args);
    };

    /**
     * Add one domain and setup the properties
     * @param {string} name
     * @param {object} domainData
     * @returns {API}
     */
    API.prototype.addDomain = function (name, domainData) {
        var self     = this,
            reserved = [ 'get', 'post', 'put', 'delete' ];

        var domain = new Domain(name, this);

        for ( var key in domainData ) {
            if ( !domainData.hasOwnProperty(key) ) {
                throw Error('hasOwnProperty check not passed');
            }

            if ( reserved.indexOf(key) > -1 ) {
                throw Error('You can not define a function with the following reserved name: ' + key);
            }

            var prop = domainData[ key ];

            if ( isObject( prop ) ) {
                Object.defineProperty(domain, key, {
                    get: function (key, prop) {
                        return function (data) {
                            var path    = (prop.route)
                                    ? self.getRoute(prop.route, data)
                                    : self.buildRoute(name, key, data),
                                options = prop.options || {};

                            return self[ prop.method.toLowerCase() ].apply(self, [ path, data, options ]);
                        }
                    }.bind(this, key, prop),
                    set: function () {
                        throw Error('You can not directly set API functions');
                    }
                })
            }
        }

        this.domains[ name ] = domain;

        Object.defineProperty(this, name, {
            get: function () {
                return self.domains[ name ]
            },
            set: function () {
                throw Error('You can not directly set domains');
            }
        });

        return this;
    };

    /**
     * Small domain wrapper
     * @param {string} name
     * @param {API} API
     * @constructor
     */
    var Domain = function (name, API) {
        this.API   = API;
        this._name = name;
    };

    /**
     * Shorthand getRoute for domains
     * @param {string} key
     * @param {object} data
     * @returns {string}
     */
    Domain.prototype.getRoute = function (key, data) {
        return this.API.getRoute(key, data);
    };

    /**
     * Shorthand fetch functions
     */
    Domain.prototype.get = function (a, b, c) {
        return this.API.get(a, b, c)
    };
    Domain.prototype.post   = function (a, b, c) {
        return this.API.post(a, b, c)
    };
    Domain.prototype.put    = function (a, b, c) {
        return this.API.put(a, b, c)
    };
    Domain.prototype.delete = function (a, b, c) {
        return this.API.delete(a, b, c)
    };

    /**
     * Export to window or as module depending on environment
     * @type {API}
     */
    (function (factory) {
        if ( typeof exports === 'object' ) {
            module.exports = exports = factory;
        } else {
            window.easyAPI = factory;
        }
    })(API);
})();