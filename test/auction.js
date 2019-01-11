var Auction = artifacts.require("./Auction.sol");

contract("Auction", function(accounts) {

    var seller = accounts[0];
    var judge = accounts[1];
    var other = accounts[2];
    var initial_price = 5;
    var bidding_period_seconds = 60;
    var minimum_price_increment = 1;

    beforeEach('setup contract for each test', function () {
        Auction.new(
            seller,
            judge,
            initial_price,
            bidding_period_seconds,
            minimum_price_increment);
    });

    it('check field variables', function () {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.sellerAddress();
        }).then(function(_sellerAddress) {
            assert.equal(_sellerAddress, seller, "Seller address is correct.");
            return auctionInstance.judgeAddress();
        }).then(function (_judgeAddress) {
            assert.equal(_judgeAddress, judge, "Judge address is correct.");
            return auctionInstance.initialPrice();
        }).then(function (_initialPrice) {
            assert.equal(_initialPrice, initial_price, "Initial price is correct.");
            return auctionInstance.biddingPeriod();
        }).then(function (_biddingPeriod) {
            assert.equal(_biddingPeriod, bidding_period_seconds, "Bidding period in seconds is correct.");
            return auctionInstance.minimumPriceIncrement();
        }).then(function (_minimumPriceIncrement) {
            assert.equal(_minimumPriceIncrement, minimum_price_increment, "Minimal price increment is correct.");
        });
    });

    it('check winding time forward', function() {
        var newTime = 1;
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.setCurrentTime(newTime, {from: other});
        }).then(function() {
            return auctionInstance.currentTime();
        }).then(function(_currentTime) {
            assert.equal(_currentTime.toNumber(), newTime);
        });
    });

    it('check winding time backwards', function() {
        var firstTime = 10;
        var secondTime = 9;

        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.setCurrentTime(firstTime, {from: other});
        }).then(function() {
            return auctionInstance.setCurrentTime(secondTime, {from: other});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "Other cannot settle auction early.");
        });
    });

    it('check early settle without highest bidder', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.settleEarly({from: seller});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "Other cannot settle auction early.");
        });
    });

    it('check early settle without highest bidder from seller', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.settleEarly({from: seller})
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "Other cannot settle auction early.");
        });
    });

    it('check early settle with highest bidder from non-seller', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.bid({from: other, gas: 300000, value: 1});
        }).then(function() {
            return auctionInstance.settleEarly({from: other});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "Other cannot settle auction early.");
        });
    });

    it('check settle before auction has finished', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.settle({from: judge});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
        });
    });

    it('check first bid equal to initial price', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.bid({from: other, gas: 300000, value: initial_price});
        }).then(assert.fail).catch(function(error) {
            assert(error, null, "error message must contain revert");
        });
    });

    it('check bid bellow initial price', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.bid({from: other, gas: 300000, value: initial_price-1});
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
        });
    });

    it('check bid above or equalt to minimal increment value', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.bid({from: other, gas: 300000, value: initial_price});
        }).then(function() {
            return auctionInstance.bid({from: other, gas: 300000, value: initial_price + minimum_price_increment})
        }).then(assert.fail).catch(function(error) {
            assert(error, null, "error message must contain revert");
        });
    });

    it('check bid bellow minimal increment value', function() {
        return Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.bid({from: other, gas: 300000, value: initial_price});
        }).then(function() {
            return auctionInstance.bid({from: other, gas: 300000, value: initial_price + minimum_price_increment - 1})
        }).then(assert.fail).catch(function(error) {
            assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
        });
    });



    //
    // it("it initializes the candidates with the correct values", function() {
    //     return Election.deployed().then(function(instance) {
    //         electionInstance = instance;
    //         return electionInstance.candidates(1);
    //     }).then(function(candidate) {
    //         assert.equal(candidate[0], 1, "contains the correct id");
    //         assert.equal(candidate[1], "Candidate 1", "contains the correct name");
    //         assert.equal(candidate[2], 0, "contains the correct votes count");
    //         return electionInstance.candidates(2);
    //     }).then(function(candidate) {
    //         assert.equal(candidate[0], 2, "contains the correct id");
    //         assert.equal(candidate[1], "Candidate 2", "contains the correct name");
    //         assert.equal(candidate[2], 0, "contains the correct votes count");
    //     });
    // });
    //
    // it("allows a voter to cast a vote", function() {
    //     return Election.deployed().then(function(instance) {
    //         electionInstance = instance;
    //         candidateId = 1;
    //         return electionInstance.vote(candidateId, { from: accounts[0] });
    //     }).then(function(receipt) {
    //         assert.equal(receipt.logs.length, 1, "an event was triggered");
    //         assert.equal(receipt.logs[0].event, "votedEvent", "the event type is correct");
    //         assert.equal(receipt.logs[0].args._candidateId.toNumber(), candidateId, "the candidate id is correct");
    //         return electionInstance.voters(accounts[0]);
    //     }).then(function(voted) {
    //         assert(voted, "the voter was marked as voted");
    //         return electionInstance.candidates(candidateId);
    //     }).then(function(candidate) {
    //         var voteCount = candidate[2];
    //         assert.equal(voteCount, 1, "increments the candidate's vote count");
    //     })
    // });
    //
    // it("throws an exception for invalid candiates", function() {
    //     return Election.deployed().then(function(instance) {
    //         electionInstance = instance;
    //         return electionInstance.vote(99, { from: accounts[1] })
    //     }).then(assert.fail).catch(function(error) {
    //         assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    //         return electionInstance.candidates(1);
    //     }).then(function(candidate1) {
    //         var voteCount = candidate1[2];
    //         assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
    //         return electionInstance.candidates(2);
    //     }).then(function(candidate2) {
    //         var voteCount = candidate2[2];
    //         assert.equal(voteCount, 0, "candidate 2 did not receive any votes");
    //     });
    // });
    //
    // it("throws an exception for double voting", function() {
    //     return Election.deployed().then(function(instance) {
    //         electionInstance = instance;
    //         candidateId = 2;
    //         electionInstance.vote(candidateId, { from: accounts[1] });
    //         return electionInstance.candidates(candidateId);
    //     }).then(function(candidate) {
    //         var voteCount = candidate[2];
    //         assert.equal(voteCount, 1, "accepts first vote");
    //         // Try to vote again
    //         return electionInstance.vote(candidateId, { from: accounts[1] });
    //     }).then(assert.fail).catch(function(error) {
    //         assert(error.message.indexOf('revert') >= 0, "error message must contain revert");
    //         return electionInstance.candidates(1);
    //     }).then(function(candidate1) {
    //         var voteCount = candidate1[2];
    //         assert.equal(voteCount, 1, "candidate 1 did not receive any votes");
    //         return electionInstance.candidates(2);
    //     }).then(function(candidate2) {
    //         var voteCount = candidate2[2];
    //         assert.equal(voteCount, 1, "candidate 2 did not receive any votes");
    //     });
    // });
});