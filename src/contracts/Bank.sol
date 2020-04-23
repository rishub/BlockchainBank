pragma solidity ^0.5.16;

contract Bank {
    mapping(address => uint256) public deposits;

    function deposit(address payee) public payable {
        uint256 amount = msg.value;
        deposits[payee] = deposits[payee] + amount;
    }

    function withdraw(address payable payee) public {
        uint256 payment = deposits[payee];
        deposits[payee] = 0;
        payee.transfer(payment);
    }

    function getBalance(address payee) public returns (uint256) {
        return deposits[payee];
    }
}
