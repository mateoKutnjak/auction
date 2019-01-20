App = {
    web3Provider: null,
    activeContracts: [],
    auctionData: null,
    myAccountAddress: '0x0',
    allAccountsAddresses: [
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
    currentHighestBidderAddress: '0x0',
    biddingPeriodSeconds: 0,

    HARDCODED: "hardcoded",
    DYNAMIC: "dynamic",

    init: function () {
        return App.initWeb3();
    },

    initWeb3: function () {
        $("#loader").show();

        $.each(App.allAccountsAddresses, function(index, value) {
            $('#sellersInput').append($('<option>').text(value).attr('value', index));
            $('#judgesInput').append($('<option>').text(value).attr('value', index));
        });

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
        web3.eth.getCoinbase(function (err, account) {
            if (err === null) {
                App.myAccountAddress = account;
                $("#accountAddress").html(account);

                web3.eth.getBalance(account, function (err, balance) {
                    $('#accountBalance').html(web3.fromWei(balance.toNumber(), 'ether'));
                });
                // $("#sellersInput").append(
                //     new Option(App.myAccountAddress, App.myAccountAddress));
                // $("#judgesInput").append(
                //     new Option(App.myAccountAddress, App.myAccountAddress));
            }
        });

        $.getJSON("Auction.json", function (auction) {
            App.auctionData = auction;

            var truffleContract = TruffleContract(auction);
            truffleContract.setProvider(App.web3Provider);

            App.activeContracts.push({type: App.HARDCODED, contract: truffleContract});

            // App.listenForEvents();
            return App.renderContract();
        });
    },

    // Listen for events emitted from the contract
    // listenForEvents: function () {
        // App.contracts.Election.deployed().then(function (instance) {
        //     // Restart Chrome if you are unable to receive this event
        //     // This is a known issue with Metamask
        //     // https://github.com/MetaMask/metamask-extension/issues/2393
        //     instance.votedEvent({}, {
        //         fromBlock: 0,
        //         toBlock: 'latest'
        //     }).watch(function (error, event) {
        //         console.log("event triggered", event)
        //         // Reload when a new vote is recorded
        //         App.render();
        //     });
        // });
    // },

    createContract: function() {

        var _biddinPeriod = parseInt($("#biddingPeriodInput").val());
        var _initialPriceInput = parseInt($("#initialPriceInput").val());
        var _minimalPriceIncrementInput = parseInt($("#minimumPriceIncrementInput").val());
        var _seller = $("#sellersInput").find(":selected").text();
        var _judge = $("#judgesInput").find(":selected").text();

        $("#biddingPeriodInput").val('');
        $("#initialPriceInput").val('');
        $("#minimumPriceIncrementInput").val('');

        var Auction = web3.eth.contract(App.auctionData['abi']);

        Auction.new(_seller, _judge, _initialPriceInput, _biddinPeriod, _minimalPriceIncrementInput,
            {from: App.myAccountAddress, data: App.auctionData['bytecode'], gas: 4712388, gasPrice: 100000000000},
            function(err, newContract) {
                if (err) {
                    console.log(err);
                    return;
                }

                if (!newContract.address) {
                    console.log("Contract transaction send: TransactionHash: " + newContract.transactionHash + " waiting to be mined...");
                } else {
                    console.log("Contract mined! Address: " + newContract.address);

                    App.activeContracts.push({type: App.DYNAMIC, contract: newContract});

                    return App.renderContract();
                }
        });
    },

    htmlContractElement: function(index) {
        return '<li id="contract' + index + '">' +
            '<div class="container text-center">\n' +
            '\n' +
            '    <div class="btn">\n' +
            '        <h3>Contract</h3>\n' +
            '        <span class="badge badge-light" id="newContractAddress' + index + '"></span>\n' +
            '        (<span class="badge badge-light" id="newContractBalance' + index + '"></span>)\n' +
            '    </div>\n' +
            '\n' +
            '    <div class="alert alert-success container" id="newOutcome' + index + '"></div>\n' +
            '\n' +
            '    <div class="container">\n' +
            '        <table class="table-condensed table">\n' +
            '            <tr class="thead-light">\n' +
            '                <th>Current time</th>\n' +
            '                <th>Initial price</th>\n' +
            '                <th>Minimal increment</th>\n' +
            '                <th>Highest bid</th>\n' +
            '            </tr>\n' +
            '            <tr>\n' +
            '                <td id="newTimePeriod' + index + '"></td>\n' +
            '                <td id="newInitialPrice' + index + '"></td>\n' +
            '                <td id="newMinimumPriceIncrement' + index + '"></td>\n' +
            '                <td id="newCurrentHighestBid' + index + '"></td>\n' +
            '            </tr>\n' +
            '        </table>\n' +
            '    </div>\n' +
            '\n' +
            '    <div class="container">\n' +
            '        <table class="table">\n' +
            '            <tr class="thead-light">\n' +
            '                <th>Role</th>\n' +
            '                <th>Address</th>\n' +
            '            </tr>\n' +
            '            <tr>\n' +
            '                <td>Seller</td>\n' +
            '                <td id="newSellerAddress' + index + '"></td>\n' +
            '            </tr>\n' +
            '            <tr>\n' +
            '                <td>Judge</td>\n' +
            '                <td id="newJudgeAddress' + index + '"></td>\n' +
            '            </tr>\n' +
            '            <tr>\n' +
            '                <td>Highest bidder</td>\n' +
            '                <td id="newCurrentHighestBidderAddress' + index + '"></td>\n' +
            '            </tr>\n' +
            '        </table>\n' +
            '    </div>\n' +
            '\n' +
            '    <br>\n' +
            '\n' +
            '    <div class="row">\n' +
            '        <div class="col-md">\n' +
            '            <form>\n' +
            '                <div class="form-group">\n' +
            '                    <label for="newInputBid">Place bid</label>\n' +
            '                    <input class="form-control" type="number" id="newInputBid' + index + '">\n' +
            '                </div>\n' +
            '            </form>\n' +
            '            <button type="submit" class="btn btn-primary" onclick="App.createBid(' + index + ')"">Place bid</button>\n' +
            '        </div>\n' +
            '        <div class="col-md">\n' +
            '            <form>\n' +
            '                <div class="form-group">\n' +
            '                    <label for="newInputTime">Change time</label>\n' +
            '                    <input class="form-control" type="number" id="newInputTime' + index + '">\n' +
            '                </div>\n' +
            '            </form>\n' +
            '            <button type="submit" class="btn btn-primary" onclick="App.changeTime(' + index + ')">Change time</button>\n' +
            '        </div>\n' +
            '    </div>\n' +
            '\n' +
            '    <div class="container">\n' +
            '        <button class="btn btn-danger" id="newEarlySettleButton" onclick="App.earlySettle(' + index + ')">Early settle</button>\n' +
            '        <button class="btn btn-warning" id="newSettleButton" onclick="App.settle(' + index + ')">Settle</button>\n' +
            '    </div>\n' +
            '</div>' +
            '</li>' +
            '<hr>';
    },

    renderContract: function(position) {
        var index;
        var auctionInstance;
        var loader = $('#loader');

        if(typeof position === "undefined") {
            index = App.activeContracts.length-1;
            $('#newContractList').append(App.htmlContractElement(index));
        } else {
            index = position;
            $("#contract" + position).html(App.htmlContractElement(index));
        }

        var contractInstance = App.activeContracts[index].contract;
        var type = App.activeContracts[index].type;

        if(type === App.DYNAMIC) {

            App.activeContracts[index].contractAddress = contractInstance.address;

            web3.eth.getBalance(contractInstance.address, function (err, _balance) {
                if (err == null) {
                    App.activeContracts[index].contractBalance = _balance.toNumber();
                } else {
                    alert(err);
                }
            });

            contractInstance.initialPrice(function (err, res) {
                App.activeContracts[index].initialPrice = res.toNumber();
            });

            contractInstance.judgeAddress(function (err, res) {
                App.activeContracts[index].judgeAddress = res;
            });

            contractInstance.sellerAddress(function (err, res) {
                App.activeContracts[index].sellerAddress = res;
            });

            contractInstance.currentHighestBidderAddress(function (err, res) {
                App.activeContracts[index].currentHighestBidderAddress = res;
            });

            contractInstance.biddingPeriod(function (err, res) {
                App.activeContracts[index].biddingPeriod = res.toNumber();
            });

            contractInstance.currentTime(function (err, res) {
                App.activeContracts[index].currentTime = res.toNumber();
            });

            contractInstance.currentHighestBid(function (err, res) {
                App.activeContracts[index].currentHighestBid = res.toNumber();
            });

            contractInstance.minimumPriceIncrement(function (err, res) {
                App.activeContracts[index].minimumPriceIncrement = res.toNumber();
            });

            contractInstance.outcome(function(err, res) {

                App.activeContracts[index].outcome = res.toNumber();
                var outcomeMessage = null;

                switch (res.toNumber()) {
                    case 0: outcomeMessage = "Auction still on progress. Place your bid below."; break;
                    case 1: outcomeMessage = "Auction has finished unsuccessfully. Nobody has placed any bids."; break;
                    case 2: outcomeMessage = "Auction has finished successfully."; break;
                }
                App.activeContracts[index].outcomeMessage = outcomeMessage;

            });

            $('#newContractBalance' + index).html(web3.fromWei(App.activeContracts[index].contractBalance, 'ether'));
            $('#newContractAddress' + index).html(App.activeContracts[index].contractAddress);
            $('#newInitialPrice' + index).html(web3.fromWei(App.activeContracts[index].initialPrice, 'ether'));
            $('#newSellerAddress' + index).html(App.activeContracts[index].sellerAddress);
            $('#newJudgeAddress' + index).html(App.activeContracts[index].judgeAddress);
            $('#newMinimumPriceIncrement' + index).html(web3.fromWei(App.activeContracts[index].minimumPriceIncrement, 'ether');
            $('#newCurrentHighestBid' + index).html(web3.fromWei(App.activeContracts[index].currentHighestBid, 'ether'));
            $('#newCurrentHighestBidderAddress' + index).html(App.activeContracts[index].currentHighestBidderAddress);
            $('#newOutcome' + index).html(App.activeContracts[index].outcomeMessage);
            $('#newTimePeriod' + index).html(App.activeContracts[index].currentTime + "/" + App.activeContracts[index].biddingPeriodSeconds);

            loader.hide();

        } else if(type === App.HARDCODED) {

            contractInstance.deployed().then(function (instance) {

                auctionInstance = instance;
                App.activeContracts[index].contractAddress = instance.address;

                web3.eth.getBalance(instance.address, function (err, balance) {
                    if(err == null) {
                        App.activeContracts[index].contractBalance = balance.toNumber();
                    } else {
                        alert(err);
                    }
                });
                return auctionInstance.initialPrice();

            }).then(function (_initialPrice) {

                App.activeContracts[index].initialPrice = _initialPrice.toNumber();
                return auctionInstance.sellerAddress();

            }).then(function (_sellerAddress) {

                App.activeContracts[index].sellerAddress = _sellerAddress;
                return auctionInstance.judgeAddress();

            }).then(function (_judgeAddress) {

                App.activeContracts[index].judgeAddress = _judgeAddress;
                return auctionInstance.biddingPeriod();

            }).then(function (_biddingPeriodSeconds) {

                App.activeContracts[index].biddingPeriodSeconds = _biddingPeriodSeconds.toNumber();
                return auctionInstance.currentTime();

            }).then(function (_currentTime) {

                App.activeContracts[index].currentTime = _currentTime.toNumber();
                return auctionInstance.minimumPriceIncrement();

            }).then(function (_minimumPriceIncrement) {

                App.activeContracts[index].minimumPriceIncrement = _minimumPriceIncrement.toNumber();
                return auctionInstance.currentHighestBid();

            }).then(function (_currentHighestBid) {

                App.activeContracts[index].currentHighestBid = _currentHighestBid.toNumber();
                return auctionInstance.lastBidTimestamp();

            }).then(function (_currentHighestBidderAddress) {

                App.activeContracts[index].currentHighestBidderAddress = _currentHighestBidderAddress;
                return auctionInstance.outcome();

            }).then(function (_outcome) {

                App.activeContracts[index].outcome = _outcome.toNumber();
                var outcomeMessage = null;

                switch (_outcome.toNumber()) {
                    case 0: outcomeMessage = "Auction still on progress. Place your bid below."; break;
                    case 1: outcomeMessage = "Auction has finished unsuccessfully. Nobody has placed any bids."; break;
                    case 2: outcomeMessage = "Auction has finished successfully."; break;
                }

                App.activeContracts[index].outcomeMessage = outcomeMessage;

            }).then(function() {

                $('#newContractBalance' + index).html(web3.fromWei(App.activeContracts[index].contractBalance, 'ether'));
                $('#newContractAddress' + index).html(App.activeContracts[index].contractAddress);
                $('#newInitialPrice' + index).html(web3.fromWei(App.activeContracts[index].initialPrice, 'ether'));
                $('#newSellerAddress' + index).html(App.activeContracts[index].sellerAddress);
                $('#newJudgeAddress' + index).html(App.activeContracts[index].judgeAddress);
                $('#newMinimumPriceIncrement' + index).html(web3.fromWei(App.activeContracts[index].minimumPriceIncrement, 'ether');
                $('#newCurrentHighestBid' + index).html(web3.fromWei(App.activeContracts[index].currentHighestBid, 'ether'));
                $('#newCurrentHighestBidderAddress' + index).html(App.activeContracts[index].currentHighestBidderAddress);
                $('#newOutcome' + index).html(App.activeContracts[index].outcomeMessage);
                $('#newTimePeriod' + index).html(App.activeContracts[index].currentTime + "/" + App.activeContracts[index].biddingPeriodSeconds);

                App.refreshElements();

                loader.hide();
            });
        }
    },

    refreshElements: function() {
        if (App.outcome === 0) {
            $('#bidForm').show();
            $('#settleButton').hide();

            if(App.myAccountAddress === App.sellerAddress) {
                $('#earlySettleButton').show();
            } else {
                $('#earlySettleButton').hide();
            }
        } else if(App.outcome === 1) {
            $('#bidForm').hide();
            $('#earlySettleButton').hide();
            $('#settleButton').hide();
            $('#timeForm').hide();

            if(App.myAccountAddress === App.judgeAddress) {

            }
        } else if(App.outcome === 2) {
            $('#bidForm').hide();
            $('#earlySettleButton').hide();
            $('#timeForm').hide();

            if((App.myAccountAddress === App.judgeAddress || App.myAccountAddress === App.sellerAddress) && App.contractBalance > 0) {
                $('#settleButton').show()
            } else {
                $('#settleButton').hide()
            }
        }
    },

    createBid: function (index) {
        var contractInstance = App.activeContracts[index].contract;
        var type = App.activeContracts[index].type;

        var createBidField = $('#newInputBid' + index);

        var inputBid = parseFloat(createBidField.val());
        createBidField.val('');

        if(type === App.HARDCODED) {
            contractInstance.deployed().then(function (instance) {
                console.log(inputBid);
                return instance.bid({from: App.myAccountAddress, gas: 3000000, value: web3.toWei(inputBid)});
            }).then(function (result) {
                console.log(result);
                App.renderContract(index);
            }).catch(function (err) {
                console.error(err);
            });
        } else if(type === App.DYNAMIC) {
            contractInstance.bid({from: App.myAccountAddress, gas: 3000000, value: web3.toWei(inputBid)}, function (err, res) {
                if(!err) {
                    App.renderContract(index);
                }
            });
        }
    },

    changeTime: function(index) {
        var contractInstance = App.activeContracts[index].contract;
        var type = App.activeContracts[index].type;

        var inputTimeField = $('#newInputTime' + index);

        var inputTime = parseInt(inputTimeField.val());
        inputTimeField.val('');

        if(type === App.HARDCODED) {
            contractInstance.deployed().then(function (instance) {
                return instance.setCurrentTime(inputTime);
            }).then(function (result) {
                console.log(result);
                App.renderContract(index);

                if (inputTime >= App.biddingPeriodSeconds) {
                    $('#settleButton').show();
                }

            }).catch(function (err) {
                console.error(err);
            });
        } else if(type === App.DYNAMIC) {
            contractInstance.setCurrentTime(inputTime, {from: App.myAccountAddress}, function(err, res) {
                debugger;
                if(!err) {
                    App.renderContract(index);
                }
            });
        }
    },

    settle: function(index) {
        var contractInstance = App.activeContracts[index].contract;
        var type = App.activeContracts[index].type;

        if(type === App.HARDCODED) {
            contractInstance.deployed().then(function (instance) {
                return instance.settle({from: App.myAccountAddress});
            }).then(function (result) {
                App.renderContract(index);
                console.log(result);
            }).catch(function (err) {
                console.error(err);
            });
        } else if(type === App.DYNAMIC) {
            contractInstance.settle({from: App.myAccountAddress}, function(err, res) {
                if(!err) {
                    App.renderContract(index);
                }
            });
        }
    },

    earlySettle: function (index) {
        var contractInstance = App.activeContracts[index].contract;
        var type = App.activeContracts[index].type;

        if(type === App.HARDCODED) {

            contractInstance.deployed().then(function (instance) {
                return instance.settleEarly({from: App.myAccountAddress});
            }).then(function (result) {
                App.renderContract(index);
                console.log(result);
            }).catch(function (err) {
                console.error(err);
            });
        } else if(type === App.DYNAMIC) {
            contractInstance.settleEarly({from: App.myAccountAddress}, function(err, res) {
                if(!err) {
                    App.renderContract(index);
                }
            });
        }
    },
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