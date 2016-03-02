# easy-api-js
Easy to use REST API functionality for browsers

You'll need a build tool like webpack or browserify to use this package

```javascript
npm install easy-api-js
```

Usage:
```javascript
// Define routes
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
    //save(data) {
    //    let route = this.getRoute('users.save', data);
    //    return this.post(route, data);
    //},

    find(data) {
        let route = this.getRoute('users.get', data);
        return this.get(route);
    }
};

// Create the API
new API('//api.somedomain.com', {
    routes: routes,
    domains: {users: userAPI}
});

```