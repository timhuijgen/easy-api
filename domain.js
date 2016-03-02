var domain = function( name, API ) {
    this.API   = API;
    this._name = name;
};

domain.prototype.getRoute = function( key, data ) {
    return this.API.getRoute(key, data);
};

domain.prototype.get    = function( a ) { return this.API.get(a) };
domain.prototype.post   = function( a, b ) { return this.API.post(a, b) };
domain.prototype.put    = function( a, b ) { return this.API.put(a, b) };
domain.prototype.delete = function( a, b ) { return this.API.delete(a, b) };

module.exports = domain;