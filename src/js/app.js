App = {
    web3Provider: null,
    contracts: {},
    newContract: null,
    auctionData: null,
    account: '0x0',
    accounts: [
        '0x8068604E5292016a8e8e6a4f7C28cB4b5C2921FD',
        '0x9B3Aba50081F6e44582dbE5fFD43634Be35EA78f',
        '0xceE3FBc3e9455Ec4243460AfC31e6b16B205445a',
        '0x7Db87242de966313002c019b28f370c7B823FE8f',
        '0xBC8E25B117Afe83DE7fE87B4d181Efe3CBF3f07C',
        '0xb5945f72E3217C401b116785dDf39937b3cC0F56',
        '0xdE8D5d91FA641baCB508C49297A315b15C295A59',
        '0x321dBD39132174d018Fa93601d2E9eaD0695FBe4',
        '0x46D940b954646995bB1244557B5b063FE193cDF8',
        '0xA1b10912CbF616Df98f856Aca66068672cb8Dc6B'
    ],

    contractBalance: 0,
    initialPrice: 0,
    sellerAddress: "0x0",
    judgeAddress: "0x0",
    currentTime: 0,
    minimumPriceIncrement: 0,
    currentHighestBid: 0,
    lastBidTimestamp: 0,
    currentHighestBudderAddress: '0x0',
    biddingPeriodSeconds: 0,

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

        var version = web3.version.api;
        console.log(version); // "0.2.0"

        return App.initContract();
    },

    initContract: function () {
        $.getJSON("Auction.json", function (auction) {
            App.auctionData = auction;
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

    createContract: function() {

        var _biddinPeriod = parseInt($("#biddingPeriodInput").val());
        var _initialPriceInput = parseInt($("#initialPriceInput").val());
        var _minimalPriceIncrementInput = parseInt($("#minimumPriceIncrementInput").val());
        var _seller = $("#sellersInput").find(":selected").text();
        var _judge = $("#judgesInput").find(":selected").text();

        var Auction = web3.eth.contract(App.auctionData['abi']);

        Auction.new(_seller, _judge, _initialPriceInput, _biddinPeriod, _minimalPriceIncrementInput,
            {from: App.account, data: App.auctionData['bytecode'], gas: 4712388, gasPrice: 100000000000, value: 1000000000000},
            function(err, newContract) {
                if (err) {
                    console.log(err);
                    return;
                }

                if (!newContract.address) {
                    console.log("Contract transaction send: TransactionHash: " + newContract.transactionHash + " waiting to be mined...");
                } else {
                    console.log("Contract mined! Address: " + newContract.address);

                    App.newContract = newContract;

                    return App.f();
                }
        });
    },

    f: function() {
        App.newContract.initialPrice(function(err, res) {
            console.log(err);
            console.log(res.toNumber());
        });

        App.newContract.judgeAddress(function(err, res) {
            console.log(res);
        });
    },

    render: function () {
        var auctionInstance;
        var loader = $("#loader");

        var bidForm = $('#bidForm');
        var settleButton = $('#settleButton');
        var earlySettleButton = $('#earlySettleButton');

        loader.show();

        $.each(App.accounts, function(index, value) {
            $('#sellersInput').append($('<option>').text(value).attr('value', index));
            $('#judgesInput').append($('<option>').text(value).attr('value', index));
        });

        // Load account data
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.account = account;
                $("#accountAddress").html(account);

                web3.eth.getBalance(account, function (err, balance) {
                    $('#accountBalance').html(web3.fromWei(balance.toNumber(), 'ether'));
                });

                $("#sellersInput").append(
                    new Option(App.account, App.account));
                $("#judgesInput").append(
                    new Option(App.account, App.account));
            }
        });

        console.log(App.contracts.Auction);

        // Load contract data
        App.contracts.Auction.deployed().then(function (instance) {
            auctionInstance = instance;

            web3.eth.getBalance(instance.address, function (err, balance) {
                if(err == null) {
                    App.contractBalance = web3.fromWei(balance.toNumber(), 'ether');
                    $('#contractBalance').html(web3.fromWei(balance.toNumber(), 'ether'));
                } else {
                    console.log(err);
                }
            });

            $('#contractAddress').html(instance.address);

            return auctionInstance.initialPrice();

        }).then(function (_initialPrice) {
            App.initialPrice = _initialPrice.toNumber();

            $('#initialPrice').html(web3.fromWei(_initialPrice.toNumber(), 'ether'));

            return auctionInstance.sellerAddress();

        }).then(function (_sellerAddress) {
            App.sellerAddress = _sellerAddress;

            $('#sellerAddress').html(_sellerAddress);

            if (App.account === _sellerAddress) {
                $('#earlySettleButton').show();
            } else {
                $('#earlySettleButton').hide();
            }

            return auctionInstance.judgeAddress();
        }).then(function (_judgeAddress) {
            App.judgeAddress = _judgeAddress;

            $('#judgeAddress').html(_judgeAddress);

            return auctionInstance.biddingPeriod();
        }).then(function (_biddingPeriodSeconds) {
            App.biddingPeriodSeconds = _biddingPeriodSeconds.toNumber();

            $('#endTime').html(_biddingPeriodSeconds.toNumber());

            return auctionInstance.currentTime();
        }).then(function (_currentTime) {
            App.currentTime = _currentTime.toNumber();

            $('#currentTime').html(App.currentTime);

            return auctionInstance.minimumPriceIncrement();
        }).then(function (_minimumPriceIncrement) {
            App.minimumPriceIncrement = web3.fromWei(_minimumPriceIncrement.toNumber(), 'ether');

            $('#minimumPriceIncrement').html(App.minimumPriceIncrement);

            return auctionInstance.currentHighestBid();
        }).then(function (_currentHighestBid) {
            App.currentHighestBid = web3.fromWei(_currentHighestBid.toNumber(), 'ether');

            $('#currentHighestBid').html(App.currentHighestBid);

            return auctionInstance.lastBidTimestamp();
        }).then(function (_lastBidTimestamp) {
            App.lastBidTimestamp = _lastBidTimestamp.toNumber();
            var date = new Date(_lastBidTimestamp * 1000).toISOString();
            $('#lastBidTimestamp').html(date);
            return auctionInstance.currentHighestBidderAddress();
        }).then(function (_currentHighestBidderAddress) {
            App.currentHighestBudderAddress = _currentHighestBidderAddress;
            $('#currentHighestBidderAddress').html(_currentHighestBidderAddress);
            return auctionInstance.outcome();
        }).then(function (_outcome) {
            App.outcome = _outcome.toNumber();
            var outcomeMessage = null;

            switch (App.outcome) {
                case 0: outcomeMessage = "Auction still on progress. Place your bid below."; break;
                case 1: outcomeMessage = "Auction has finished unsuccessfully. Nobody has placed any bids."; break;
                case 2: outcomeMessage = "Auction has finished successfully."; break;
            }

            $('#outcome').html(outcomeMessage);

            App.refreshElements();

            $('#timePeriod').html(App.currentTime + "/" + App.biddingPeriodSeconds);

            loader.hide();
        });
    },

    refreshElements: function() {
        if (App.outcome === 0) {
            $('#bidForm').show();
            $('#settleButton').hide();

            if(App.account === App.sellerAddress) {
                $('#earlySettleButton').show();
            } else {
                $('#earlySettleButton').hide();
            }
        } else if(App.outcome === 1) {
            $('#bidForm').hide();
            $('#earlySettleButton').hide();
            $('#settleButton').hide();
            $('#timeForm').hide();

            if(App.account === App.judgeAddress) {

            }
        } else if(App.outcome === 2) {
            $('#bidForm').hide();
            $('#earlySettleButton').hide();
            $('#timeForm').hide();

            if((App.account === App.judgeAddress || App.account === App.sellerAddress) && App.contractBalance > 0) {
                $('#settleButton').show()
            } else {
                $('#settleButton').hide()
            }
        }
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

    changeTime: function() {
        var inputTime = parseInt($('#inputTime').val());

        App.contracts.Auction.deployed().then(function (instance) {
            return instance.setCurrentTime(inputTime);
        }).then(function (result) {
            console.log(result);

            if(inputTime >= App.biddingPeriodSeconds) {
                $('#settleButton').show();
            }

        }).catch(function (err) {
            debugger;
            console.error(err);
        });
    },

    settle: function() {
        App.contracts.Auction.deployed().then(function (instance) {
            return instance.settle({from: App.account});
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

    // getTimeRemaining: function (endtime) {
    //     var t = Date.parse(endtime) - Date.parse(new Date());
    //     var seconds = Math.floor((t / 1000) % 60);
    //     var minutes = Math.floor((t / 1000 / 60) % 60);
    //     var hours = Math.floor((t / (1000 * 60 * 60)) % 24);
    //     var days = Math.floor(t / (1000 * 60 * 60 * 24));
    //     return {
    //         'total': t,
    //         'days': days,
    //         'hours': hours,
    //         'minutes': minutes,
    //         'seconds': seconds
    //     };
    // },
    //
    // initializeClock: function (id, endtime) {
    //     var clock = document.getElementById(id);
    //     var daysSpan = clock.querySelector('.days');
    //     var hoursSpan = clock.querySelector('.hours');
    //     var minutesSpan = clock.querySelector('.minutes');
    //     var secondsSpan = clock.querySelector('.seconds');
    //
    //     function updateClock() {
    //         var t = App.getTimeRemaining(endtime);
    //
    //         daysSpan.innerHTML = t.days;
    //         hoursSpan.innerHTML = ('0' + t.hours).slice(-2);
    //         minutesSpan.innerHTML = ('0' + t.minutes).slice(-2);
    //         secondsSpan.innerHTML = ('0' + t.seconds).slice(-2);
    //
    //         if (t.total <= 0) {
    //             clearInterval(timeinterval);
    //         }
    //     }
    //
    //     updateClock();
    //     var timeinterval = setInterval(updateClock, 1000);
    // }

};

$(function () {
    $(window).load(function () {
        App.init();
    });
});

$('#newContractButton').click(function(e) {
    e.preventDefault();

    App.createContract();
});