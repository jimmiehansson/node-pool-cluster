var assert = require('assert');
var NodePoolCluster = require('..');

describe('NodePoolCluster', function () {
    var clientCreatedPerPool = [0, 0];
    var acquireCountsPerPool = [0, 0];
    var releasedPoolCount = 0;

    it("should pool the connection request based on smallest waiting queue", function (done) {
        var poolFactoryOpts = {
            max: 5,
            idleTimeoutMillis: 1000,
            destroy: function (client) {
            }
        };

        var nodePoolCluster = NodePoolCluster.initCluster(poolFactoryOpts);

        nodePoolCluster.addPool(function (callback) { //adding first pool
            clientCreatedPerPool[0]++;
            callback(null, {id: 0});
        });

        nodePoolCluster.addPool(function (callback) { //adding second pool
            clientCreatedPerPool[1]++;
            callback(null, {id: 1});
        });

        function acquire() {
            nodePoolCluster.acquire(function (err, client, serverPool) {
                acquireCountsPerPool[client.id]++;
                setTimeout(function () {
                    serverPool.release(client);
                    releasedPoolCount++;
                    if (releasedPoolCount == 100) {
                        done();
                    }
                }, 0);
            });
        }

        for (var i = 0; i < 100; i++) {
            setTimeout(acquire, 0);
        }
    });

    after(function () {
        assert.equal(5, clientCreatedPerPool[0]); //no. of clients for first pool
        assert.equal(5, clientCreatedPerPool[1]); //no. of clients for second pool
        assert.equal(50, acquireCountsPerPool[0]);
        assert.equal(50, acquireCountsPerPool[1]);
    });
});
