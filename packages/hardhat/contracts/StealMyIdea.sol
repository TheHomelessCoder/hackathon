// SPDX-License-Identifier: MIT
pragma solidity >=0.8.0 <0.9.0;

/**
 * @title StealMyIdea
 * @notice Proof-of-authorship on Polkadot Hub. Publish a hash of your idea on-chain
 * to prove you wrote it first. Your content stays local — only the hash goes on-chain.
 * @dev Deployed via scaffold-dot on Polkadot Hub's PolkaVM
 */
contract StealMyIdea {
    struct Idea {
        bytes32 contentHash;
        address author;
        uint256 timestamp;
        uint256 bounty;
        string title;
        bool bountyClaimed;
    }

    mapping(uint256 => Idea) public ideas;
    uint256 public ideaCount;

    event IdeaPublished(
        uint256 indexed id,
        address indexed author,
        bytes32 contentHash,
        string title,
        uint256 timestamp,
        uint256 bounty
    );

    event BountyClaimed(uint256 indexed id, address indexed claimer, uint256 amount);

    /**
     * @notice Publish a proof-of-authorship for your idea
     * @param _contentHash keccak256 hash of the idea content (computed client-side)
     * @param _title Human-readable title for the idea (stored on-chain)
     * @return id The on-chain idea ID for verification
     */
    function publishIdea(bytes32 _contentHash, string calldata _title) external payable returns (uint256) {
        uint256 id = ++ideaCount;
        ideas[id] = Idea({
            contentHash: _contentHash,
            author: msg.sender,
            timestamp: block.timestamp,
            bounty: msg.value,
            title: _title,
            bountyClaimed: false
        });
        emit IdeaPublished(id, msg.sender, _contentHash, _title, block.timestamp, msg.value);
        return id;
    }

    /**
     * @notice Get full idea details for verification
     * @param _id The on-chain idea ID
     */
    function getIdea(uint256 _id) external view returns (
        bytes32 contentHash,
        address author,
        uint256 timestamp,
        uint256 bounty,
        string memory title,
        bool bountyClaimed
    ) {
        Idea storage idea = ideas[_id];
        return (idea.contentHash, idea.author, idea.timestamp, idea.bounty, idea.title, idea.bountyClaimed);
    }

    /**
     * @notice Author releases bounty to a builder who executed the idea
     * @param _id The idea ID
     * @param _builder Address to receive the bounty
     */
    function releaseBounty(uint256 _id, address payable _builder) external {
        Idea storage idea = ideas[_id];
        require(msg.sender == idea.author, "Only author can release bounty");
        require(!idea.bountyClaimed, "Bounty already claimed");
        uint256 amount = idea.bounty;
        require(amount > 0, "No bounty attached");

        // Checks-effects-interactions: zero BEFORE transfer
        idea.bountyClaimed = true;
        idea.bounty = 0;

        (bool sent, ) = _builder.call{value: amount}("");
        require(sent, "Transfer failed");

        emit BountyClaimed(_id, _builder, amount);
    }

    receive() external payable {}
}
