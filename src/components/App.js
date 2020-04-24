import React, { Component } from 'react';
import Web3 from 'web3';
import './App.css';
import Bank from '../abis/Bank.json';

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      contract: null,
      account: null,
      balance: 0,
      depositAmount: "",
      loading: false,
      loadingMessage: '',
    }
  }
  async componentWillMount() {
    await this.loadWeb3();
    await this.loadBlockchainData();
  }

  async loadWeb3() {
    if(window.ethereum) {
      window.web3 = new Web3(window.ethereum);
      await window.ethereum.enable();
    } else if (window.web3) {
      window.web3 = new Web3(window.web3.currentProvider);
    }  else {
      window.alert("Please use metamask!")
    }
  }

  async loadBlockchainData() {
    const web3 = window.web3;
    const accounts = await web3.eth.getAccounts();
    this.setState({ account: accounts[0] });
    const networkId = await web3.eth.net.getId();
    const networkData = Bank.networks[networkId];
    if (networkData) {
      const abi = Bank.abi;
      const address = networkData.address;
      const contract = web3.eth.Contract(abi, address);
      this.setState({ contract });
      await this.updateBalance();
    } else {
      window.alert("Smart contract not deployed to detected network");
    }
  }

  updateBalance = async () => {
    const balance = await this.state.contract.methods.getBalance(this.state.account).call();
    this.setState({ balance: balance ? window.web3.utils.fromWei(balance.toString(), 'ether') : 0 });
  }

  deposit = () => {
    if (this.state.depositAmount <= 0 || isNaN(this.state.depositAmount)) {
      alert("Enter a numeric deposit amount > 0");
      return;
    }

    const that = this;
    this.state.contract.methods.deposit(this.state.account)
      .send({ from: this.state.account, value: this.state.depositAmount * 10 ** 18 })
      .on('confirmation', confirmationNumber => {
        if (confirmationNumber === 2) {
          const depositAmount = that.state.depositAmount;
          that.updateBalance();
          that.setState({ depositAmount: 0});
          that.setLoading(false);
          that.sendAlert("Successfully deposited " + depositAmount + " ether")
        }
      })
      .on('error', () => {
        that.setLoading(false);
        that.sendAlert("Failed to deposit!")
      });

    this.setLoadingMessage(`Depositing ${this.state.depositAmount} ether...`);
    this.setLoading(true);
  }

  withdraw = () => {
    const that = this;

    this.state.contract.methods.withdraw(this.state.account)
      .send({ from: this.state.account })
      .on('confirmation', confirmationNumber => {
        if (confirmationNumber === 2) {
          const balance = that.state.balance;
          that.updateBalance();
          that.setLoading(false);
          that.sendAlert("Successfully withdrew " + balance + " ether")
        }
      })
      .on('error', () => {
        that.setLoading(false);
        that.sendAlert("Failed to withdraw!")
      });

    this.setLoadingMessage("Withdrawing all Ether...");
    this.setLoading(true);
  }

  setDepositAmount = e => {
    const value = e.target.value;
    this.setState({ depositAmount: value !== "" ? Number(value) : "" })
  }

  setLoading = loading => this.setState({ loading })
  setLoadingMessage = loadingMessage => this.setState({ loadingMessage })

  sendAlert = message => setTimeout(() => alert(message), 500)

  render() {
    if(this.state.loading) {
      return (
        <div>
          <h2>{this.state.loadingMessage}</h2>
          <div className="loader" />
        </div>
      )
    }

    return (
      <div>
        <h1>Bank $$$</h1>
        <h3>Your bank balance: {this.state.balance} Ether</h3>
        <input type="number" step="0.01" onChange={this.setDepositAmount} value={this.state.depositAmount} />
        <button onClick={this.deposit}>Deposit</button>
        <button onClick={this.withdraw} className="withdraw-button">Withdraw all funds</button>
      </div>
    );
  }
}

export default App;
