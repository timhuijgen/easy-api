# easy-api-js
Easy to use REST API functionality for browsers

You'll need a build tool like webpack or browserify to use this package

```javascript
npm install easy-api-js
```

Usage:
```javascript
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
var API = new API('//api.somedomain.com', {
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