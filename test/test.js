var easyAPI        = require('./../API'),
    chai           = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);

var should = chai.should(),
    expect = chai.expect;

global.FormData = require('form-data');
global.fetch    = require('node-fetch');

// Node-fetch only supports json & text parse methods. Native should support all

var dummyData = {
    endpoint: 'http://jsonplaceholder.typicode.com', // Dummy API service
    domains:  {
        users: {
            save:  {
                method:  'POST'
            },
            list:  {
                method: 'GET',
                options: {
                    parse: 'text'
                }
            },
            fetch: {
                method: 'GET'
            }
        }
    },
    routes:   {
        'users.save':   '/users/save/:id',
        'users.fetch':  '/users/:id',
        'users.list':   '/users',
        'users.byname': '/users/byname/:firstname'
    }
};

describe('Setting up easy api js', function () {

    it('should throw when you dont provide an endpoint url', function () {
        expect(easyAPI).to.throw(Error, /URL is required/);
    });

    it('should not throw when only an URL is provided', function () {
        new easyAPI(dummyData.endpoint);
    });

    it('should take an object of domains and add them', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains
        });

        API.domains.should.have.property('users');
        API.domains.users.should.be.a('object');
    });

    it('should throw when trying to use function names that are reserved', function () {
        expect(function () {
            var API = new easyAPI(dummyData.endpoint, {
                domains: {
                    users: {
                        get: function () {
                        }
                    }
                }
            });
        }).to.throw(Error);
    });

    it('the api object should get all domains as prototypes', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains
        });

        API.domains.should.have.property('users');
        API.domains.users.should.be.an('object');
        API.users.should.be.an('object');
        API.users.save.should.be.a('function');
    });

    it('should not take non-objects as domans', function () {
        expect(function () {
            new easyAPI(dummyData.endpoint, {
                domains: {users: [ 'a', 'b' ]}
            })
        }).to.throw(Error, /Expecting objects in domains/);
    });

    it('should add and replace route(s) to and from the stack', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        API.routes.should.have.property('users.fetch');
        Object.keys(API.routes).should.have.length(4);

        API.addRoutes({
            'some.route':  'location/a',
            'other.route': 'location/b'
        });

        Object.keys(API.routes).should.have.length(6);
        API.routes.should.have.property('users.fetch');

        API.setRoutes({
            'some.route':  'location/a',
            'other.route': 'location/b'
        });

        Object.keys(API.routes).should.have.length(2);
        API.routes.should.not.have.property('users.fetch');

    });

    it('should get a route and parse variables', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        var route = API.getRoute('users.byname', {
            firstname: 'foo',
            id:        1
        });

        route.should.equal('/users/byname/foo');

        var route_a = API.getRoute('users.fetch', {
            firstname: 'bar'
        });

        route_a.should.equal('/users/:id');
    });

    it('should throw if a route does not exist', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        expect(API.getRoute.bind(API, 'non.existing.route', {})).to.throw(Error);
    });

    it('should build a route with a domain and function name', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        var route = API.buildRoute('users', 'fetch', {id: 2});

        route.should.equal('/users/2');
    });

    it('should add domains to the stack and parse different kind of parameters', function () {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        API.domains.should.have.property('users');

        API.add('a', {}, 'b', {});
        API.a.should.be.an('object');
        API.domains.b.should.be.an('object');

        API.add({c: {}, d: {}});
        API.c.should.be.an('object');
        API.domains.d.should.be.an('object');

        API.add([ 'e', {}, 'f', {} ]);
        API.e.should.be.an('object');
        API.domains.f.should.be.an('object');
    });

});

describe('Easy api js fetch / call functionality', function () {
    this.timeout(0);

    it('should call the user fetch route and receive data', function (done) {

        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        API.users.fetch({id: 1}).then(function (response) {
            response.url.should.equal(dummyData.endpoint + '/users/1')
        }).should.notify(done);
    });

    it('should fetch data and parse json', function (done) {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        API.users.fetch({id: 4}).then(function (response) {
            response.url.should.equal(dummyData.endpoint + '/users/4')
            return response.json();
        }).then(function (json) {
            json.should.be.a('object');
        }).should.notify(done);
    });

    it('should catch failures', function (done) {
        var API = new easyAPI('http://some.not.working.route', {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        API.users.save({id: 5}).then(function (response) {
            response.url.should.equal(dummyData.endpoint + '/users/save/5')
        }).then(function (json) {
            throw Error('Promise should not resolve');
        }).catch(function (err) {
            err.should.be.a('object');
            err.should.have.a.property('code');
            err.code.should.equal('ENOTFOUND');
        }).should.notify(done);
    });

    it('should parse json and use global parse options', function(done) {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes,
            options: {
                parse: 'json'
            }
        });

        API.users.fetch({id: 5}).then(function (json) {
            json.should.be.a('object');
        }).catch(function (err) {
            throw err;
        }).should.notify(done);

    });

    it('should parse text and use route-only parse options', function(done) {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes
        });

        API.users.list().then(function (text) {
            text.should.be.a('string');
        }).catch(function (err) {
            throw err;
        }).should.notify(done);

    });

    it('should throw when trying to use nonexisting parse method', function(done) {
        var API = new easyAPI(dummyData.endpoint, {
            domains: dummyData.domains,
            routes:  dummyData.routes,
            options: { 
                parse: 'blob'
            }
        });

        API.users.save().then(function () {
            throw Error('Blob parse method does not exist in node-fetch yet')
        }).catch(function (err) {
            err.should.be.a('Error');
        }).should.notify(done);
    });

});