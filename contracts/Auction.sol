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
    address public finalHighestBidderAddress;

    uint public startTime;
    uint public currentHighestBid;
    uint public initialPrice;
    uint public biddingPeriodDays;
    uint public lastBidTimestamp;
    uint public minimumPriceIncrement;

    constructor(address _sellerAddress, address _judgeAddress, uint _initialPrice, uint _biddingPeriodDays, uint _minimumPriceIncrement) public {
        initialPrice = _initialPrice;
        biddingPeriodDays = _biddingPeriodDays;
        minimumPriceIncrement = _minimumPriceIncrement;

        lastBidTimestamp = now;
        startTime = now;

        if (sellerAddress == address(0)) {
            sellerAddress = msg.sender;
        }
        judgeAddress = _judgeAddress;

        outcome = Outcome.NOT_FINISHED;
    }

    function bid() public payable {
        if(msg.value < initialPrice) {
            msg.sender.transfer(msg.value);
            revert("Initial bid not higher than initial price. Returning funds to bidder...");
        }

        else if(msg.value < currentHighestBid + minimumPriceIncrement) {
            msg.sender.transfer(msg.value);
            revert("Minimum price increment not satisfied. Returning funds to bidder...");
        }

        else if(now - lastBidTimestamp >= biddingPeriodDays * 1 days) {
            msg.sender.transfer(msg.value);
            revert("Bidding period expired. Returning funds to bidder and finishing auction...");
        }

        if(currentHighestBidderAddress != address(0)) {
            currentHighestBidderAddress.transfer(address(this).balance - msg.value);
        }

        currentHighestBid = msg.value;
        currentHighestBidderAddress = msg.sender;
        lastBidTimestamp = now;
    }

    function getHighestBidder() public returns (address) {
        if(now - lastBidTimestamp >= biddingPeriodDays * 1 days) {
            finishAuction(currentHighestBidderAddress != address(0) ? Outcome.SUCCESSFUL : Outcome.NOT_SUCCESSFUL, currentHighestBidderAddress);
        }
        return currentHighestBidderAddress;
    }

    function finishAuction(Outcome _outcome, address _highestBidder) internal {
        require(_outcome != Outcome.NOT_FINISHED); // This should not happen.
        outcome = _outcome;
        finalHighestBidderAddress = _highestBidder;
    }

    function settle() public {
        require(outcome == Outcome.SUCCESSFUL);
        require(msg.sender == judgeAddress || msg.sender == sellerAddress);

        sellerAddress.transfer(address(this).balance);
    }

    function settleEarly() public {
        require(outcome == Outcome.NOT_FINISHED, "For early settle outcome must be NOT_FINISHED.");
        require(currentHighestBidderAddress != address(0), "For early settle highest bidder must exist.");
        require(msg.sender == sellerAddress, "For early settle sender must be the seller.");

        outcome = Outcome.SUCCESSFUL;

        sellerAddress.transfer(address(this).balance);
    }

    function refund() public {
        require(outcome == Outcome.NOT_SUCCESSFUL);
        require(currentHighestBidderAddress != address(0));
        require(msg.sender == currentHighestBidderAddress || msg.sender == judgeAddress);

        currentHighestBidderAddress.transfer(address(this).balance);
    }
}
