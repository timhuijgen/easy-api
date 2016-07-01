# easy-api-js
Easy to use REST calls from browsers - Using the browser fetch API

When not using a buildtool like browserify / webpack and you want to support legacy browsers you'll need polyfills for: fetch, Promise, and Object.assign

```javascript
npm install easy-api-js
```

Usage:
```javascript
// Import
var easyAPI = require('easy-api-js');

// Define routes
// The params in the route will be replaced with values from the 
// data object that you'll pass when calling a function
var routes = {
    'users.save':   '/users/save/:id',
    'users.delete': '/users/delete/:id',
    'users.fetch':    '/users/:id'
};

// Define API functions
var userAPI = {
	// You can specify a domain function as an object: 
    // this will use the route users.save automatically
    save: {
        method: 'POST',
        //route: 'users.save' // optional
        options: { // Optional options applied only to this method call
            parse: 'blob'
        }
    },

	// You can define a function instead of a configuration object
	// to handle calls yourself:    
    //save: function(data) {
    //    let route = this.getRoute('users.save', data});
    //    return this.post(route, data);
    //},

    fetch: function(data) {
        var route = this.getRoute('users.fetch', data);
        return this.get(route);
    }
};

// Create the API
var API = new easyAPI('//api.somedomain.com', {
    routes: routes,
    domains: {users: userAPI},
    options: { // Optional global options given to every call
        headers: {
            "Authorization": "Basic " + btoa('Foo' + ":" + 'Bar')
        },
        parse: "json" // All fetch Body methods are supported [arrayBuffer, blob, formData, json, text]
    }
});

// Anywhere you make the API available you can use it to call your specified functions
API.users.save({id: 5, name: 'FooBaR'}).then(function(result){
	// Do something with the result
	// If you passed a valid parse option the result here will already be parsed
	// If not then you can parse it yourself by calling result.json() or any other Body parsing method
}).catch(function(error){
	// Handle API error
});
```