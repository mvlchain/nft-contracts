// SPDX-License-Identifier: MIT

import '@openzeppelin/contracts/token/ERC721/IERC721.sol';

pragma solidity ^0.8.8;

interface ISaleMintable {
    function saleMint(address to) external;
}
