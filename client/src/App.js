import React, { Component } from "react";
import SimpleStorageContract from "./contracts/SimpleStorage.json";
import getWeb3 from "./getWeb3";
import TruffleContract from 'truffle-contract';
import ipfs from "./ipfs";
import upload from "./upload.png";
import loading from "./loading.png";

import "./App.css";

class App extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ipfsHash: '',
      buffer: 0,
      web3: null,
      account: null,
      url: ''
    };
    this.captureFile = this.captureFile.bind(this);
    this.onSubmit = this.onSubmit.bind(this);
  }

  componentWillMount() {
    getWeb3()
      .then(results => {
        this.setState({
          web3: results
        })

        this.instantiateContract();
      })
      .catch(() => {
        console.log("error finding web3");
      })
  }

  instantiateContract() {
    this.simpleStorage = TruffleContract(SimpleStorageContract);
    this.simpleStorage.setProvider(this.state.web3.currentProvider);

    this.state.web3.eth.getAccounts((error, accounts) => {
      this.simpleStorage.deployed().then((instance) => {
        this.simpleStorageInstance = instance;
        this.setState({ account: accounts[0] });

        return this.simpleStorageInstance.get({ from: accounts[0] });
      }).then((ipfsHash) => {
        this.setState({ url: `https://ipfs.io/ipfs/${ipfsHash}` });
        return this.setState({ ipfsHash });
      })
    })
  }

  captureFile(event) {
    event.preventDefault();
    const file = event.target.files[0];
    const reader = new window.FileReader();
    reader.readAsArrayBuffer(file);
    reader.onloadend = () => {
      this.setState({ buffer: Buffer(reader.result) });
      console.log('Buffer:', this.state.buffer);
    }
  }

  onSubmit(event) {
    event.preventDefault();
    ipfs.files.add(this.state.buffer, (error, result) => {
      if (error) {
        console.error(error);
        return;
      }
      this.simpleStorageInstance.set(result[0].hash, { from: this.state.account }).then((r) => {
        this.setState({ ipfsHash: result[0].hash });
        this.setState({ url: `https://ipfs.io/ipfs/${result[0].hash}` });
        console.log('ipfsHash', this.state.ipfsHash);
      })
    })
  }

  render() {
    // if (!this.state.web3) {
    //   return <img src={loading} alt="" width="350px" />;
    // }
    return (
      <div className="App">
        <h1 className="heading">IPFS File Upload DApp</h1>
        {this.state.ipfsHash ? <div><img src={`https://ipfs.io/ipfs/${this.state.ipfsHash}`} alt="" width="600px" className="img_display" />
          <p className="on_eth_block">
            This image is stored on IPFS & the Ethereum Blockchain!
          </p>
          <p className="on_eth_block">Visit: &nbsp;&nbsp;<a href={this.state.url} target="_blank" className="link">https://ipfs.io/ipfs/{this.state.ipfsHash}</a>&nbsp;&nbsp; to view the image</p>
        </div>
          :
          <img src={upload} alt="" width="350px" />
        }

        <h2 className="upload_image">Upload image</h2>
        <form onSubmit={this.onSubmit} className="mt-5">
          <input type="file" onChange={this.captureFile} className="btn" />
          <input type="submit" className="btn button_style" />
        </form>
      </div >
    );
  }
}

export default App;
