var Auction = artifacts.require("./Auction.sol");

module.exports = function(deployer, network, accounts) {
    var seller = accounts[0];
    var judge = accounts[1];
    var initial_price = 5;
    var time_period_days = 1;
    var minimal_price_increment = 1;

    deployer.deploy(Auction, seller, judge, initial_price, time_period_days, minimal_price_increment);
};