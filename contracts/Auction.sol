pragma solidity ^0.5.0;

contract Auction {

    enum Outcome {
        NOT_FINISHED,
        NOT_SUCCESSFUL,
        SUCCESSFUL
    }

    Outcome public outcome;

    address public judgeAddress;
    address payable public sellerAddress;
    address payable public currentHighestBidderAddress;

    uint public startTime;
    uint public currentTime;
    uint public currentHighestBid;
    uint public initialPrice;
    uint public biddingPeriod;
    uint public lastBidTimestamp;
    uint public minimumPriceIncrement;

    constructor(address _sellerAddress, address _judgeAddress, uint _initialPrice, uint _biddingPeriodSeconds, uint _minimumPriceIncrement) public {
        initialPrice = _initialPrice;
        biddingPeriod = _biddingPeriodSeconds;
        minimumPriceIncrement = _minimumPriceIncrement;

        lastBidTimestamp = 0;
        startTime = 0;
        currentTime = 0;

        if (sellerAddress == address(0)) {
            sellerAddress = msg.sender;
        }
        judgeAddress = _judgeAddress;

        outcome = Outcome.NOT_FINISHED;
    }

    function bid() public payable {
        refreshOutcome();

        if(outcome != Outcome.NOT_FINISHED) {
            msg.sender.transfer(msg.value);
            revert("Auction has finished, cannot bid. Returning funds.");
        }

        if(msg.value < initialPrice) {
            msg.sender.transfer(msg.value);
            revert("Initial bid not higher than initial price. Returning funds to bidder...");
        }

        if(msg.value < currentHighestBid + minimumPriceIncrement) {
            msg.sender.transfer(msg.value);
            revert("Minimum price increment not satisfied. Returning funds to bidder...");
        }

        if(currentHighestBidderAddress != address(0)) {
            currentHighestBidderAddress.transfer(address(this).balance - msg.value);
        }

        currentHighestBid = msg.value;
        currentHighestBidderAddress = msg.sender;
        lastBidTimestamp = currentTime;
    }

    function settle() public {
        refreshOutcome();

        require(outcome == Outcome.SUCCESSFUL);
        require(msg.sender == judgeAddress || msg.sender == sellerAddress);

        sellerAddress.transfer(address(this).balance);
    }

    function settleEarly() public {
        refreshOutcome();

        require(outcome == Outcome.NOT_FINISHED, "For early settle outcome must be NOT_FINISHED.");
        require(currentHighestBidderAddress != address(0), "For early settle highest bidder must exist.");
        require(msg.sender == sellerAddress, "For early settle sender must be the seller.");

        outcome = Outcome.SUCCESSFUL;

        sellerAddress.transfer(address(this).balance);
    }

    function refreshOutcome() internal {
        if(currentTime - startTime >= biddingPeriod * 1 seconds) {
            if(currentHighestBidderAddress != address(0)) {
                outcome = Outcome.SUCCESSFUL;
            } else {
                outcome = Outcome.NOT_SUCCESSFUL;
            }
        }
    }

    function setCurrentTime(uint _currentTime) public {
        require(_currentTime > currentTime, "Time can only be wind forward.");
        currentTime = _currentTime;
    }
}
