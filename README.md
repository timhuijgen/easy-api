# easy-api-js
Easy to use REST API functionality for browsers
You need jQuery & Promise-polyfill in the DOM when not using build tools like webpack or browserify


```javascript
npm install easy-api-js
```

Usage:
```javascript
// Import
var easyAPI = require('easy-api-js');

// Define routes
// The params in the route will be replaced with values from the data object that you'll pass when calling a function
var routes = {
    'users.save':   '/users/save/:id',
    'users.delete': '/users/delete/:id',
    'users.fetch':    '/users/:id'
};

// Define API functions
var userAPI = {
	// You can specify a domain as an object: this will use the route users.save automatically
    save: {
        method: 'POST',
        //route: 'users.save' // optional
    },

	// The above object equals the following function
    //save: function(data) {
    //    let route = this.getRoute('users.save', data);
    //    return this.post(route, data);
    //},

    fetch(data) {
        let route = this.getRoute('users.fetch', data);
        return this.get(route);
    }
};

// Create the API
var API = new easyAPI('//api.somedomain.com', {
    routes: routes,
    domains: {users: userAPI}
});

// Anywhere you make the API available you can use it to call your specified functions
API.users.save({id: 5, name: 'FooBaR'}).then(function(result){
	// Do something with the result
}).catch(function(error){
	// Handle API error
});
```