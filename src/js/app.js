App = {
    web3Provider: null,
    contracts: {},
    account: '0x0',
    deadline: null,
    biddingPeriodDays: 0,

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        if (typeof web3 !== 'undefined') {
            App.web3Provider = web3.currentProvider;
            web3 = new Web3(web3.currentProvider);
        } else {
            App.web3Provider = new Web3.providers.HttpProvider('http://localhost:7545');
            web3 = new Web3(App.web3Provider);
        }
        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Auction.json", function (auction) {
            App.contracts.Auction = TruffleContract(auction);
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

        App.renderAccountData();

        // Load contract data
        App.contracts.Auction.deployed().then(function (instance) {
            auctionInstance = instance;

            web3.eth.getBalance(instance.address, function (err, balance) {
                $('#contractBalance').html("Contract balance = " + web3.fromWei(balance.toNumber(), 'ether'));

            });

            $('#contractAddress').html("Contract address = " + instance.address);
            return auctionInstance.initialPrice();
        }).then(function (_initialPrice) {
            $('#initialPrice').html("Initial price = " + web3.fromWei(_initialPrice.toNumber(), 'ether'));
            return auctionInstance.sellerAddress();
        }).then(function (_sellerAddress) {
            $('#sellerAddress').html("Seller address = " + _sellerAddress);

            if (App.account === _sellerAddress) {
                $('#earlySettleButton').show();
            } else {
                $('#earlySettleButton').hide();
            }

            return auctionInstance.judgeAddress();
        }).then(function (_judgeAddress) {
            $('#judgeAddress').html("Judge address = " + _judgeAddress);
            return auctionInstance.biddingPeriodDays();
        }).then(function (_biddingPeriodDays) {
            App.biddingPeriodDays = _biddingPeriodDays.toNumber();
            return auctionInstance.minimumPriceIncrement();
        }).then(function (_minimumPriceIncrement) {
            $('#minimumPriceIncrement').html("Minimum price increment = " + web3.fromWei(_minimumPriceIncrement.toNumber(), 'ether'));
            return auctionInstance.currentHighestBid();
        }).then(function (_currentHighestBid) {
            $('#currentHighestBid').html(web3.fromWei(_currentHighestBid.toNumber(), 'ether'));
            return auctionInstance.startTime();
        }).then(function (_startTime) {
            deadline = new Date(App.biddingPeriodDays * 24 * 60 * 60 * 1000 + Date.parse(new Date(_startTime * 1000)));
            App.initializeClock('clockdiv', deadline);

            return auctionInstance.lastBidTimestamp();
        }).then(function (_lastBidTimestamp) {
            var date = new Date(_lastBidTimestamp * 1000).toISOString();
            $('#lastBidTimestamp').html("Last bid timestamp = " + date);
            return auctionInstance.currentHighestBidderAddress();
        }).then(function (_currentHighestBidderAddress) {
            $('#currentHighestBidderAddress').html(_currentHighestBidderAddress);
            return auctionInstance.outcome();
        }).then(function (_outcome) {
            var outcome = _outcome.toNumber();
            var outcomeMessage = null;

            switch (outcome) {
                case 0: outcomeMessage = "Auction still on progress. Place your bid below."; break;
                case 1: outcomeMessage = "Auction has finished unsuccessfully. Nobody has placed any bids."; break;
                case 2: outcomeMessage = "Auction has finished successfully."; break;
            }

            $('#outcome').html(outcomeMessage);

            if (outcome !== 0) {
                $('#bidForm').hide();
                $('#earlySettleButton').hide();
                $('#clockdiv').hide();
            }

            $('#loader').hide();
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

    renderAccountData: function() {
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html(account);

                web3.eth.getBalance(account, function (err, balance) {
                    $('#accountBalance').html(web3.fromWei(balance.toNumber(), 'ether'));
                });
            }
        });
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

    earlySettle: function () {
        App.contracts.Auction.deployed().then(function (instance) {
            return instance.settleEarly({from: App.account});
        }).then(function (result) {
            console.log(result);
        }).catch(function (err) {
            console.error(err);
        });

        App.contracts.Auction.deployed().then(function (instance) {
            auctionInstance = instance;
            return auctionInstance.sellerAddress();
        }).then(function (_sellerAddress) {
            if (_sellerAddress === App.account) {

            }
        });
    },

    getTimeRemaining: function (endtime) {
        var t = Date.parse(endtime) - Date.parse(new Date());
        var seconds = Math.floor((t / 1000) % 60);
        var minutes = Math.floor((t / 1000 / 60) % 60);
        var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
        var days = Math.floor(t / (1000 * 60 * 60 * 24));
        return {
            'total': t,
            'days': days,
            'hours': hours,
            'minutes': minutes,
            'seconds': seconds
        };
    },

    initializeClock: function (id, endtime) {
        var clock = document.getElementById(id);
        var daysSpan = clock.querySelector('.days');
        var hoursSpan = clock.querySelector('.hours');
        var minutesSpan = clock.querySelector('.minutes');
        var secondsSpan = clock.querySelector('.seconds');

        function updateClock() {
            var t = App.getTimeRemaining(endtime);

            daysSpan.innerHTML = t.days;
            hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
            minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
            secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);

            if (t.total <= 0) {
                clearInterval(timeinterval);
            }
        }

        updateClock();
        var timeinterval = setInterval(updateClock, 1000);
    }

};

$(function () {
    $(window).load(function () {
        App.init();
    });
});
