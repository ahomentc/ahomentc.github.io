"use strict";


// MINTING CODE
// When minting, atomic firebase function is passed the code,
// It sets the reservor address and returns new currentMintingCode
// The reserver is sent back the new currentMintingCode after they mint

const firebaseConfig = {
  apiKey: "AIzaSyDZcGGW7xXBxOWO-I1WWpkFiA8Y6pCi1Hg",
  authDomain: "storybits-2c8d4.firebaseapp.com",
  databaseURL: "https://storybits-2c8d4-default-rtdb.firebaseio.com",
  projectId: "storybits-2c8d4",
  storageBucket: "storybits-2c8d4.appspot.com",
  messagingSenderId: "28045861201",
  appId: "1:28045861201:web:f73f24a8a6b639d325f370",
  measurementId: "G-ZM91NKPBXG"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
firebase.analytics();

 // Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;

let contract_address = "0xD387B80Bf5bbc672a99AF9BaC46652493BeC94C8"
// let contract_address = "0x9e16d3851f6Fb6bAD3DF2ce5aE7bc8878481EcdC" // rinkeby

// Address of the selected account
let selectedAccount;
var ethaddress = ""; 


async function init() {
  const providerOptions = {
    walletconnect: {
      package: WalletConnectProvider,
      options: {
        infuraId: "a1d2d05b386a403296580b00c8032130",
      }
    },

    fortmatic: {
      package: Fortmatic,
      options: {
        // key: "pk_test_C99A517CE7B79A76"
        key: "pk_live_A4C2D41D64B917E8"
      }
    }
  };

  web3Modal = new Web3Modal({
    cacheProvider: false, // optional
    providerOptions, // required
    disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    theme: "dark"
  });

  // if (web3Modal.cachedProvider) {
  //   onConnect();
  // }
  // if (localStorage.getItem("walletProvider") !== null) {
  //   provider = JSON.parse(localStorage.getItem("walletProvider"));
  // }

  // document.getElementById("connect").style.display = "inline";
  console.log("Web3Modal instance is", web3Modal);
}

// This should be a JSON file with sentence and nft id, so they can click it and
// take them to opensea.
// Continuously checks for new versions.
// Make it so that no one can write to this... read only.
// To write, they send an http post to a firebase function with the transaction.
// Can also run a program every few hours that queries the blockchain for all nfts
// and puts the right ones in.

// Force update
// https://testnets-api.opensea.io/api/v1/asset/0x375df763cd7b87e3ffb8efad812aae088553664c/1/?force_update=true

var addedNFTs = new Set()
var showingIds = true;
var listener;

var DispatchGroup = (function() {
    var nextId = 0

    function DispatchGroup() {
        var id = ++nextId
        var tokens = new Set()
        var onCompleted = null

        function checkCompleted() {
            if(!tokens.size) {
                if(onCompleted) {
                    onCompleted()
                }
            }
        }

        // the only requirement for this is that it's unique during the group's cycle
        function nextToken() {
            return Date.now() + Math.random()
        }

        this.enter = function () {
            let token = nextToken()
            tokens.add(token)
            return token
        }

        this.leave = function (token) {
            if(!token) throw new Error("'token' must be the value earlier returned by '.enter()'")
            tokens.delete(token)
            checkCompleted()
        }

        this.notify = function (whenCompleted) {
            if(!whenCompleted) throw new Error("'whenCompleted' must be defined")
            onCompleted = whenCompleted
            checkCompleted()
        }
    }

    return DispatchGroup;
})()

function addNFTWithId(id, word){
    var html = '<a href="https://opensea.io/assets/' + contract_address + '/' + id.toString() + '" target="_blank" style="text-decoration: none; color: white;"><div style="float: left; margin: 5px;">'
    html += '<div class="nft text-center my-auto mx-auto">'
    html += '<div class="" style="padding-top: 0px;"><p><div style="float:left; padding-right: 5px; color: gray;">' + id.toString() + ": </div><div style='float:left;'>" + word + '</div></p></div>'
    html += '</div></div></a>'
    document.getElementById("nfts").innerHTML += html
}

function addNFTReadable(id, word){
    var html = '<a href="https://opensea.io/assets/' + contract_address + '/' + id.toString() + '" target="_blank" style="text-decoration: none; color: white;"><div style="float: left; margin: 0px;">'
    html += '<div class="nft_plain text-center my-auto mx-auto">'
    html += '<div class="" style="padding-top: 0px;"><p>' + word + '</a></p></div>'
    html += '</div></div></a>'
    document.getElementById("nfts").innerHTML += html
}

function refreshNFTs() {
  var update_url = "https://us-central1-storybits-2c8d4.cloudfunctions.net/addMissingNFTs"
  var xmlHttpUpdate = new XMLHttpRequest();
  xmlHttpUpdate.onreadystatechange = function() {
    if (xmlHttpUpdate.readyState == 4 && xmlHttpUpdate.status == 200){
      console.log(xmlHttpUpdate.responseText);
    }
  }
  xmlHttpUpdate.open("GET", update_url, true);
  xmlHttpUpdate.send(null);
}

async function fetchText() {
  var ref = firebase.database().ref('nft_sentences');
  listener = ref.on('value', (snapshot) => {
    document.getElementById("nfts").innerHTML = ""
    
    var num_total = snapshot.numChildren()
    var percentage = num_total * 100 / 50000
    var percentString = percentage.toString() + "% written (" + num_total + "/50,000 minted)"
    document.getElementById("percent_written").innerHTML = percentString

    snapshot.forEach(nft => {
      const id = nft.key
      const word = nft.val()
      addNFTReadable(id, word)  
    })
  });
}

async function fetchTextWithIds() {
  var ref = firebase.database().ref('nft_sentences');
  listener = ref.on('value', (snapshot) => {
    document.getElementById("nfts").innerHTML = ""

    var num_total = snapshot.numChildren()
    var percentage = num_total * 100 / 50000
    var percentString = percentage.toString() + "% written (" + num_total + "/50,000 minted)"
    document.getElementById("percent_written").innerHTML = percentString

    snapshot.forEach(nft => {
      const id = nft.key
      const word = nft.val()
      addNFTWithId(id, word)
    })
  });
}

// percent_written

async function toggleIds() {
  firebase.database().ref('nft_sentences').off('value', listener)
  addedNFTs = new Set();
  document.getElementById("nfts").innerHTML = "";
  if (showingIds) { // hide ids
    showingIds = false;
    fetchText();
    document.getElementById("toggleIds").innerHTML = "Show IDs"
  }
  else { // show ids
    showingIds = true;
    fetchTextWithIds();
    document.getElementById("toggleIds").innerHTML = "Switch To Reader View"
  }
}

// var charge = 0.03;
// var sentence = ""
// function textChanged() {
//   var text = document.getElementById("nft_sentence_textarea").value;
//   var words_arr = text.split(" ");
//   if (words_arr[words_arr.length-1] == "") {
//     words_arr.splice(-1)
//   }
//   if (words_arr.length > 25) {
//     document.getElementById("nft_sentence_textarea").value = text.slice(0, -1); 
//     alert("Max of 25 words in a sentence.")
//   }
//   sentence = text
//   // document.getElementById("nft_sentence_button").innerHTML = "Mint StoryBit 0.03 ETH"
// }

var charge = 0.03;
var sentences = []
function textChanged() {
  var text = document.getElementById("nft_sentence_textarea").value;
  // var sentences_arr = text.split(/. |! |? /);
  // var sentences_arr = text.split(/(?<=[.!?])/g)
  var sentences_arr = text.match(/([^\.!\?]+[\.!\?]+)|([^\.!\?]+$)/g);
  
  if (sentences_arr[sentences_arr.length-1] == " ") {
    sentences_arr.splice(-1)
  }

  // remove empty space in first character
  for(var i=0; i<sentences_arr.length; i++) {
    if (sentences_arr[i][0] == " ") {
      sentences_arr[i] = sentences_arr[i].substring(1)
    }
  }

  if (sentences_arr!=null && sentences_arr.length > 10) {
    sentences_arr.splice(-1)
    document.getElementById("nft_sentence_textarea").value = sentences_arr.join(" ")
    alert("Max of 10 sentences per mint.")
  }
  if (sentences_arr!=null sentences_arr.length > 0) {
    sentences = sentences_arr
  }

  console.log(sentences)

  // 0.00008
  charge = parseFloat((sentences.length * 0.03).toFixed(8));
  if (sentences.length == 0) {
    charge = 0.03
  }
  if (sentences.length <= 1) {
    document.getElementById("nft_sentence_button").innerHTML = "Mint StoryBit 0.03 ETH"
  }
  else {
    document.getElementById("nft_sentence_button").innerHTML = "Mint " + sentences.length.toString() + " StoryBits " + charge.toString() + " ETH"
  }
}

var currentTokenIndex = 0
async function mint() {
  document.getElementById("opensea_link_section").style.display = "none";
  document.getElementById("nft_minting_section").style.display = "none"
  document.getElementById("nft_minting_wait").style.display = "none";
  document.getElementById("transacation_link").style.display = "none";
  document.getElementById("svg_img_section").style.display = "none";

  if (sentences.length == 0) {
    return;
  }

  await web3Modal.clearCachedProvider()
  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();

    const web3 = new Web3(provider);
    const accounts = await web3.eth.getAccounts();
    if (accounts !== null) {
      console.log(accounts[0])
    }
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Get a Web3 instance for the wallet
  const web3 = new Web3(provider);
  const accounts = await web3.eth.getAccounts();
  ethaddress = accounts[0];

  console.log(ethaddress);

  var code = document.getElementById("enter_code").value;
  var url = "https://us-central1-storybits-2c8d4.cloudfunctions.net/requestMintFromCode?address=" + accounts[0] + "&code=" + code

  // HOW TO DO PADDING FOR TIMELEFT

  // send request to firebase function with timestamp, signature. Edit: just address and disable read from database
  // except for http cloud function that tells the number of people in queue.
  // hash the timestamp in the server.
  // firebase will send back signed message
  
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() { 
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
      let data = JSON.parse(xmlHttp.responseText);

      if (data.status == "fail") {
        alert(data.err)
        return;
      }

      let timestampMsg = data.time;
      let r = data.r;
      let s = data.s;
      let v = data.v;
      let code = data.new_code;

      var lastSentence = sentences[sentences.length-1]
      if (lastSentence[lastSentence.length-1] !== "." && lastSentence[lastSentence.length-1] !== "?" && lastSentence[lastSentence.length-1] !== "!") {
        if (confirm("You're missing a period at the end of your last sentence. Add one now?")) {
          document.getElementById("nft_sentence_textarea").value = document.getElementById("nft_sentence_textarea").value + "."
          lastSentence = lastSentence + "."
          sentences[sentences.length-1] = lastSentence
        }
      }

      // console.log(sentences)
      // console.log(timestampMsg)
      // console.log(v)
      // console.log(r)
      // console.log(s)

      // call mint function with above
      var totalAmountWei = web3.utils.toWei(charge.toString(), "ether")

      console.log(totalAmountWei)

      var contract = new web3.eth.Contract([ { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "ApprovalForAll", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "flipSaleState", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string[]", "name": "_sentences", "type": "string[]" }, { "internalType": "uint256", "name": "timestampMsg", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "safeMint", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_price", "type": "uint256" } ], "name": "setPrice", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getApproved", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" } ], "name": "isApprovedForAll", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxNfts", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "ownerOf", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "price", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "saleIsActive", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "sentences", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" } ], "name": "supportsInterface", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tokensMinted", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_tokenId", "type": "uint256" } ], "name": "tokenURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" } ], 
        contract_address);
      var safeMint = contract.methods.safeMint(sentences, timestampMsg, v, r, s).encodeABI();
      // Chain ID of Rinkeby Test Net is 3, replace it to 1 for Main Net
      var chainId = 1;

      var est = web3.eth.estimateGas({"to": contract_address, from:ethaddress, "data": safeMint, value: totalAmountWei})
      est.then(function(gasAmount){
        // get the previous number of nfts minted
        const prevTokensMinted = contract.methods.tokensMinted().call().then(function(numPrevTokensMinted) { 
          // var numPrev = parseInt(numPrevTokensMinted)
          
          web3.eth.sendTransaction({to:contract_address, from:ethaddress, value: totalAmountWei, data: safeMint, "chainId": chainId})
          .on('transactionHash', function(hash){
            console.log("hash")
            console.log(hash);
            document.getElementById("nft_sentence_button").disabled = true;
            document.getElementById("nft_minting_section").style.display = "block"
            document.getElementById("nft_minting_wait").style.display = "block";
            document.getElementById("transacation_link").href = "https://etherscan.io/tx/" + hash
            document.getElementById("transacation_link").style.display = "block";

            // can't have transactionAccepted here since the transaction could still fail.
          })
          .on('receipt', function(receipt){ // transacation was successful
            setTimeout(function(){
              document.getElementById("nft_minting_wait").style.display = "none";
              document.getElementById("show_code").innerHTML = "Give the next person mint access with this code <br/>(expires after 12 hours): <br/><strong>" + code + "</strong>";

              var update_url = "https://us-central1-storybits-2c8d4.cloudfunctions.net/transactionAccepted"
              var xmlHttpUpdate = new XMLHttpRequest();
              xmlHttpUpdate.onreadystatechange = function() {
                if (xmlHttpUpdate.readyState == 4 && xmlHttpUpdate.status == 200){
                  console.log(xmlHttpUpdate.responseText);
                }
              }
              xmlHttpUpdate.open("GET", update_url, true);
              xmlHttpUpdate.send(null);

              const currentTokensMinted = contract.methods.tokensMinted().call().then(function(numCurrentTokensMinted) {
                  var update_url = "https://us-central1-storybits-2c8d4.cloudfunctions.net/requestNFTUpdate?prevTokensMinted=" + numPrevTokensMinted + "&numCurrentTokensMinted=" + numCurrentTokensMinted
                  var xmlHttpUpdate = new XMLHttpRequest();
                  xmlHttpUpdate.onreadystatechange = function() {
                    if (xmlHttpUpdate.readyState == 4 && xmlHttpUpdate.status == 200){
                      console.log(xmlHttpUpdate.responseText);
                    }
                  }
                  xmlHttpUpdate.open("GET", update_url, true);
                  xmlHttpUpdate.send(null);

                  // force update the token on opensea
                  var numPrev = parseInt(numPrevTokensMinted)
                  var numCurrent = parseInt(numCurrentTokensMinted)
                  for (var id=numPrev+1; id<=numCurrent; id++) {
                    var idString = id.toString()
                    setTimeout(function timer() {
                      const options = {method: 'GET'};
                      fetch('https://api.opensea.io/api/v1/asset/' + contract_address + '/' + idString + '/?force_update=true', options)
                      .then(response => response.json())
                      .then(response => console.log(response))
                      .catch(err => console.error(err));
                    }, id * 1500);
                  }

                  // set the image preview of the NFT
                  const tokenURI = contract.methods.tokenURI(numCurrent).call().then(function(tokenURIData) {
                    document.getElementById("svg_img_section").style.display = "block";
                    setNFTImage(tokenURIData)
                  }, function(error) {
                    console.log("Couldn't get Token's URI")
                  });

                  document.getElementById("opensea_link").href = "https://opensea.io/assets/" + contract_address + "/" + numCurrent.toString()
                  document.getElementById("opensea_link_section").style.display = "block";

              }, function(error) {
                console.log("Couldn't get current Token Ids")
              });
            }, 2000);
          })
          .on('error', function(error, receipt) {
            console.log("error");
            // User rejected transaction

          });
        }, function(error) {
          console.log("Couldn't get previous Token Ids")
        });
      })
      .catch(function(error){
        alert("Not enough funds in wallet (gas + mint cost). Try again when gas fees are lower.")
        console.log(error)
      });  
    }  
  }
  xmlHttp.open("GET", url, true); // true for asynchronous 
  xmlHttp.send(null);
}

function setNFTImage(data) {
  const encoded1 = data.split(",")[1];
  const data2 = atob(encoded1);
  const imageData = JSON.parse(data2).image
  const encodedImage = imageData.split(",")[1]
  const decodedSVG = atob(encodedImage)

  var img = new Image();
  var DOMURL = window.URL || window.webkitURL || window;
  var svgBlob = new Blob([decodedSVG], {type: 'image/svg+xml;charset=utf-8'});
  var url = DOMURL.createObjectURL(svgBlob);
  document.getElementById("svg_img").src = url;
}

var timeLeft = 0
var reservedTimstamp = 0

async function listenForMintReservation() {
  var ref = firebase.database().ref('reservationTimestamp');
  ref.on('value', (snapshot) => {
    // update the label with the new reservation timestamp
    // have another function that continuously counts that down until no one is minting
    // and the reserve button is enabled.
    // Once have reservation, mint button is enabled.
    const currentTimestamp = Math.round(Date.now() / 1000);
    reservedTimstamp = snapshot.val()
    timeLeft = reservedTimstamp - currentTimestamp;
    // timeLeft = reservedTimstamp + 300 - currentTimestamp
  });
}

function updateTimeLeft() {
  var ref = firebase.database().ref('reservationTimestamp');
  ref.once('value', (snapshot) => {
    // update the label with the new reservation timestamp
    // have another function that continuously counts that down until no one is minting
    // and the reserve button is enabled.
    // Once have reservation, mint button is enabled.
    const currentTimestamp = Math.round(Date.now() / 1000);
    reservedTimstamp = snapshot.val()
    timeLeft = reservedTimstamp - currentTimestamp;
    // timeLeft = reservedTimstamp + 300 - currentTimestamp
  });
}

function updateMintInfo() {
  timeLeft -= 1
  if (timeLeft > 60 * 2) {
    var minutes = Math.ceil(timeLeft / 60)
    if (minutes < 61) {
      document.getElementById("reserved_counter").innerHTML = "Code expires in " + minutes + " minutes";
    }
    else {
      var hours = Math.ceil(timeLeft / 60 / 60)
      document.getElementById("reserved_counter").innerHTML = "Code expires in " + hours + " hours "
    }
    document.getElementById("minting_code_section").style.display = "block";

    // check to see if minting code is entered
    var code = document.getElementById("enter_code").value;
    if (code == "") {
      document.getElementById("nft_sentence_button").disabled = true;
    }
    else {
      document.getElementById("nft_sentence_button").disabled = false;
    }

    document.getElementById("reserve_minting_slot_button").disabled = true;
    document.getElementById("minting_slot_section").style.display = "none";
  }
  else if (timeLeft > 0) {
    // disable both types of minting as a padding.
    document.getElementById("minting_code_section").style.display = "none";
    document.getElementById("nft_sentence_button").disabled = true;
    document.getElementById("reserved_counter").innerHTML = "Next minting slot in " + timeLeft + " seconds";

    document.getElementById("reserve_minting_slot_button").disabled = true;
    document.getElementById("minting_slot_section").style.display = "none";
  }
  else {
    document.getElementById("reserved_counter").innerHTML = "New Minting Code Available!";
    document.getElementById("minting_code_section").style.display = "block";

    document.getElementById("reserve_minting_slot_button").disabled = false;
    document.getElementById("minting_slot_section").style.display = "block";

    var code = document.getElementById("enter_code").value;
    if (code == "") {
      document.getElementById("nft_sentence_button").disabled = true;
    }
    else {
      document.getElementById("nft_sentence_button").disabled = false;
    }
  }
}

// once a code expires, if no new code is generated than a new code can be created.
function getMintingCode() {
  var url = "https://us-central1-storybits-2c8d4.cloudfunctions.net/getMintingSlot"
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.onreadystatechange = function() { 
    if (xmlHttp.readyState == 4 && xmlHttp.status == 200){
      let data = JSON.parse(xmlHttp.responseText);

      if (data.status == "fail") {
        alert(data.err)
        return;
      }
      else {
        var new_code = data.new_code;
        document.getElementById("enter_code").value = new_code;
      }
    }
  }
  xmlHttp.open("GET", url, true); // true for asynchronous 
  xmlHttp.send(null);
}

function setCookie(name,value,days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + (value || "")  + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  fetchTextWithIds();

  // scrolls to bottom of screen
  // window.scrollTo(0,document.body.scrollHeight);

  document.getElementById("nft_sentence_textarea").addEventListener("input", (event) => textChanged());

  init();
  listenForMintReservation()
  setInterval(function(){
    updateMintInfo()
  }, 1000);

  setInterval(function(){
    updateTimeLeft()
  }, 10000);

  refreshNFTs();

  document.querySelector("#toggleIds").addEventListener("click", toggleIds);
  document.querySelector("#nft_sentence_button").addEventListener("click", mint);
  document.querySelector("#reserve_minting_slot_button").addEventListener("click", getMintingCode);
  
  // document.querySelector("#reserve_mint_button").addEventListener("click", reserveMintingRights);
  // document.querySelector("#prev_img_button").addEventListener("click", viewNextImage);
  // document.querySelector("#next_img_button").addEventListener("click", viewPrevImage);
});















