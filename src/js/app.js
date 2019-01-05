App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    hasVoted: false,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        // TODO: refactor conditional
        if (typeof web3 !== 'undefined') {
            // If a web3 instance is already provided by Meta Mask.
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            // Specify default instance if no web3 instance provided
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Auction.json", function (auction) {
            // Instantiate a new truffle contract from the artifact
            App.contracts.Auction = TruffleContract(auction);
            // Connect provider to interact with contract
            App.contracts.Auction.setProvider(App.web3Provider);

            // App.listenForEvents();

            return App.render();
        });
    },

    // Listen for events emitted from the contract
    listenForEvents: function () {
        App.contracts.Election.deployed().then(function (instance) {
            // Restart Chrome if you are unable to receive this event
            // This is a known issue with Metamask
            // https://github.com/MetaMask/metamask-extension/issues/2393
            instance.votedEvent({}, {
                fromBlock: 0,
                toBlock: 'latest'
            }).watch(function (error, event) {
                console.log("event triggered", event)
                // Reload when a new vote is recorded
                App.render();
            });
        });
    },

    render: function () {
        var auctionInstance;
        var loader = $("#loader");
        var content = $("#content");

        loader.show();
        content.hide();

        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html("Your Account: " + account);
            }
        });

        // Load contract data
        App.contracts.Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.initialPrice();
        }).then(function (_initialPrice) {
            $('#initialPrice').html("Initial price = " + _initialPrice.toNumber());
            return auctionInstance.sellerAddress();
        }).then(function (_sellerAddress) {
            $('#sellerAddress').html("Seller address = " + _sellerAddress);
            return auctionInstance.judgeAddress();
        }).then(function (_judgeAddress) {
            $('#judgeAddress').html("Judge address = " + _judgeAddress);
            return auctionInstance.biddingPeriodDays();
        }).then(function (_biddingPeriodDays) {
            $('#biddingPeriodDays').html("Bidding period days = " + _biddingPeriodDays.toNumber());
            return auctionInstance.minimumPriceIncrement();
        }).then(function (_minimumPriceIncrement) {
            $('#minimumPriceIncrement').html("Minimum price increment = " + web3.fromWei(_minimumPriceIncrement.toNumber(), 'ether'));
            return auctionInstance.currentHighestBid();
        }).then(function (_currentHighestBid) {
            $('#currentHighestBid').html("Current highest bid = " + web3.fromWei(_currentHighestBid.toNumber(), 'ether'));
            return auctionInstance.startTime();
        }).then(function (_startTime) {
            var date = new Date(_startTime*1000).toISOString();
            $('#startTime').html("Start time = " + date);
            return auctionInstance.lastBidTimestamp();
        }).then(function (_lastBidTimestamp) {
            var date = new Date(_lastBidTimestamp*1000).toISOString();
            $('#lastBidTimestamp').html("Last bid timestamp = " + date);
        });

        // var candidatesResults = $("#candidatesResults");
        // candidatesResults.empty();
        //
        // var candidatesSelect = $('#candidatesSelect');
        // candidatesSelect.empty();
        //
        // for (var i = 1; i <= candidatesCount; i++) {
        //   electionInstance.candidates(i).then(function(candidate) {
        //     var id = candidate[0];
        //     var name = candidate[1];
        //     var voteCount = candidate[2];
        //
        //     // Render candidate Result
        //     var candidateTemplate = "<tr><th>" + id + "</th><td>" + name + "</td><td>" + voteCount + "</td></tr>"
        //     candidatesResults.append(candidateTemplate);
        //
        //     // Render candidate ballot option
        //     var candidateOption = "<option value='" + id + "' >" + name + "</ option>"
        //     candidatesSelect.append(candidateOption);
        //   });
        // }
        // return electionInstance.voters(App.account);
        // }).then(function(hasVoted) {
        //   // Do not allow a user to vote
        //   if(hasVoted) {
        //     $('form').hide();
        //   }
        //   loader.hide();
        //   content.show();
        // }).catch(function(error) {
        //   console.warn(error);
        // });
    },

    createBid: function () {
        var inputBid = parseFloat($('#inputBid').val());

        App.contracts.Auction.deployed().then(function (instance) {
            console.log(inputBid);
            return instance.bid({from: App.account, gas: 3000000, value: web3.toWei(inputBid)});
        }).then(function (result) {
            console.log(result);
        }).catch(function (err) {
            console.error(err);
        });
    },

    castVote: function () {
        var candidateId = $('#candidatesSelect').val();
        App.contracts.Election.deployed().then(function (instance) {
            return instance.vote(candidateId, {from: App.account});
        }).then(function (result) {
            // Wait for votes to update
            $("#content").hide();
            $("#loader").show();
        }).catch(function (err) {
            console.error(err);
        });
    }
};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
