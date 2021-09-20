const functions = require("firebase-functions");
const admin = require('firebase-admin');
const firebase = admin.initializeApp();
const Web3 = require('web3');
const cors = require('cors')({origin: true});

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//   functions.logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

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

Date.prototype.getUnixTime = function() { return this.getTime()/1000|0 };
if(!Date.now) Date.now = function() { return new Date(); }
Date.time = function() { return Date.now().getUnixTime(); }

// https://us-central1-storybits-2c8d4.cloudfunctions.net/requestMint?address=alsdfjasljdfa
// address for account thats signing: 0x005199627E4aea0Ba8c85c2D182fE8852bcFEdEF
// query parameter should hold timestamp and signature that user signed. This way, the wrong person
// can't call this function to get the signature meant for someone else.
// exports.requestMint = functions.https.onRequest( (req, res) => {
// 	// mintReservor is not longer being used
// 	cors(req, res, () => {
// 		var web3 = new Web3("https://rinkeby.infura.io/v3/fee8c943351648ac819a52f3ee66bfbc")
// 		const address = req.query.address;
// 		const code = req.query.code;
// 		const reseration_hold_time = 60 * 15; // 15 minutes
// 		const currentTimestamp = Math.round(Date.now() / 1000);

// 		// check if they have a code and if its valid, if so then give them access
// 		// if code is not valid, or is none, then check to see if it's been more than
// 		// 15 mintues from reservationTimestamp, if so then give them access, else deny
// 		const currentMintingCode = admin.database().ref('currentMintingCode');
// 		currentMintingCode.transaction((currentCode) => {
// 			if (currentCode === null) {
// 		      return 123;
// 		    }

// 		    var new_code = Math.floor(Math.random() * 100000000000);

// 		  	const hash = web3.utils.soliditySha3({ type: 'uint256', value: currentTimestamp });
// 			const signObj = web3.eth.accounts.sign(hash, "1c9e8b6f202f1b2fa1813f5633904566860443ca27f1dbe65f25aeff7f8b8383");
// 			var signature = signObj.signature.slice(2)
// 			var r = "0x" + signature.slice(0, 64); var s = "0x" + signature.slice(64, 128); var v = parseInt(signature.slice(128),16);
// 			var obj = {"status": "success", "time": currentTimestamp.toString(), "r": r, "s": s, "v": v, "new_code": new_code}

// 		    if (parseInt(currentCode) == parseInt(code)) {
// 		    	// Code is valid, go ahead and mint

// 				admin.database().ref('reservationTimestamp').set(currentTimestamp);
// 				res.send(JSON.stringify(obj));

// 				return new_code;
// 		    }
// 		    else {
// 		    	admin.database().ref('reservationTimestamp').once('value', (reserved_timestamp_snapshot) => {
// 		    		if (reserved_timestamp_snapshot !== null && reserved_timestamp_snapshot.val() !== null && reserved_timestamp_snapshot.val() !== undefined reserved_timestamp_snapshot.val() !== "") {
// 						// Check if the  it's been more than 15 minutes
// 						let reserved_timestamp = reserved_timestamp_snapshot.val()
// 				    	if (parseInt(currentTimestamp) - parseInt(reserved_timestamp) > reseration_hold_time){
// 				    		admin.database().ref('reservationTimestamp').set(currentTimestamp);
// 							res.send(JSON.stringify(obj));
// 							return new_code;
// 				    	}
// 				    	else {
// 				    		// It hasn't been 15 minutes yet
// 				    		res.send(JSON.stringify({"status": "fail", "err": "Error, someone else has a reservation."}));
// 				    		return;
// 				    	}
// 				    }
// 				    else {
// 				    	res.send(JSON.stringify({"status": "fail", "err": "Error, code still needed"}));
// 				    	return;
// 				    }
// 		    	})
// 		    }
// 		})
// 	});
// });

// Can seperate in frontend and call this if they have code
// Can call the other if enough time has passsed
exports.requestMintFromCode = functions.https.onRequest( (req, res) => {
	// mintReservor is not longer being used
	cors(req, res, () => {
		var web3 = new Web3("https://rinkeby.infura.io/v3/fee8c943351648ac819a52f3ee66bfbc")
		const address = req.query.address;
		const code = req.query.code;
		const reseration_hold_time = 60 * 20; // 20 minutes
		const currentTimestamp = Math.round(Date.now() / 1000);

		var coeff = 1000 * 60 * 1; // round to nearest minute
	  	var date = new Date();
	  	var nearestMinute = new Date(Math.floor(date.getTime() / coeff) * coeff);
	  	var nearestEpoch = nearestMinute.getUnixTime()

		// check if they have a code and if its valid, if so then give them access
		// if code is not valid, or is none, then check to see if it's been more than
		// 15 mintues from reservationTimestamp, if so then give them access, else deny
		const currentMintingCode = admin.database().ref('currentMintingCode');
		currentMintingCode.transaction((currentCode) => {
			if (currentCode === null) {
		      return 123;
		    }

		    var new_code = Math.floor(Math.random() * 100000000000);

		  	const hash = web3.utils.soliditySha3({ type: 'uint256', value: nearestEpoch });
			const signObj = web3.eth.accounts.sign(hash, "1c9e8b6f202f1b2fa1813f5633904566860443ca27f1dbe65f25aeff7f8b8383");
			var signature = signObj.signature.slice(2)
			var r = "0x" + signature.slice(0, 64); var s = "0x" + signature.slice(64, 128); var v = parseInt(signature.slice(128),16);
			var obj = {"status": "success", "time": nearestEpoch.toString(), "r": r, "s": s, "v": v, "new_code": new_code}

		    if (parseInt(currentCode) == parseInt(code)) {
		    	// Code is valid, go ahead and mint
		  //   	var nextTimestamp = currentTimestamp + reseration_hold_time;
				// admin.database().ref('reservationTimestamp').set(nextTimestamp);
				// res.send(JSON.stringify(obj));
				// return new_code;
				var nextTimestamp = currentTimestamp + reseration_hold_time;
				admin.database().ref('currentMintingCodeTemp').set(new_code);
				admin.database().ref('reservationTimestampTemp').set(nextTimestamp);
				var onHoldTimestamp = currentTimestamp + 180
				admin.database().ref('reservationTimestamp').set(onHoldTimestamp);
				res.send(JSON.stringify(obj));
				return;
		    }
		    else {
		    	res.send(JSON.stringify({"status": "fail", "err": "Error, code is no longer valid."}));
		    	return;
		    }
		})
	});
});

// pad access to this for 10 seconds in front end so that someone doesn't do code and 
// another person timout at the same time.
// during that padding remove the code input
exports.requestMintFromTimeout = functions.https.onRequest( (req, res) => {
	// mintReservor is not longer being used
	cors(req, res, () => {
		var web3 = new Web3("https://rinkeby.infura.io/v3/fee8c943351648ac819a52f3ee66bfbc")
		const address = req.query.address;
		const reseration_hold_time = 60 * 20; // 20 minutes
		const currentTimestamp = Math.round(Date.now() / 1000);

		var coeff = 1000 * 60 * 1; // round to nearest minute
	  	var date = new Date();
	  	var nearestMinute = new Date(Math.floor(date.getTime() / coeff) * coeff);
	  	var nearestEpoch = nearestMinute.getUnixTime()

		const reservationTimestampRef = admin.database().ref('reservationTimestamp');
		reservationTimestampRef.transaction((reserved_timestamp) => {
			if (reserved_timestamp === null) {
		      return 123;
		    }

		    var new_code = Math.floor(Math.random() * 100000000000);

		  	const hash = web3.utils.soliditySha3({ type: 'uint256', value: nearestEpoch });
			const signObj = web3.eth.accounts.sign(hash, "1c9e8b6f202f1b2fa1813f5633904566860443ca27f1dbe65f25aeff7f8b8383");
			var signature = signObj.signature.slice(2)
			var r = "0x" + signature.slice(0, 64); var s = "0x" + signature.slice(64, 128); var v = parseInt(signature.slice(128),16);
			var obj = {"status": "success", "time": nearestEpoch.toString(), "r": r, "s": s, "v": v, "new_code": new_code}

			if (parseInt(currentTimestamp) - parseInt(reserved_timestamp) > 0) {
				// admin.database().ref('currentMintingCode').set(new_code);
				// res.send(JSON.stringify(obj));
				// return currentTimestamp + reseration_hold_time;
				var nextTimestamp = currentTimestamp + reseration_hold_time;
				admin.database().ref('currentMintingCodeTemp').set(new_code);
				admin.database().ref('reservationTimestampTemp').set(nextTimestamp);

				// if the transacation is accepted, then reservationTimestamp goes back to 20 minutes
				// Otherwise it stays at 180 seconds so that someone else can mint
				var onHoldTimestamp = currentTimestamp + 180
				admin.database().ref('reservationTimestamp').set(onHoldTimestamp);
				res.send(JSON.stringify(obj));
				return;
			}
			else {
				// It hasn't been 15 minutes yet
				res.send(JSON.stringify({"status": "fail", "err": "Error, you don't have minting reservation"}));
				return;
			}
		})
	});
});

// transaction was accepted so set reservationTimestamp and currentMintingCode
exports.transactionAccepted = functions.https.onRequest( (req, res) => {
	admin.database().ref('currentMintingCodeTemp').once('value', (codeSnapshot) => {
		admin.database().ref('reservationTimestampTemp').once('value', (reservationSnapshot) => {
			admin.database().ref('currentMintingCodeTemp').set("");
			admin.database().ref('reservationTimestampTemp').set("");
			admin.database().ref('currentMintingCode').set(codeSnapshot.val());
			admin.database().ref('reservationTimestamp').set(reservationSnapshot.val());
			res.send("success")
		})
	})
})

// exports.requestMint = functions.https.onRequest( (req, res) => {
// 	cors(req, res, () => {
// 		var web3 = new Web3("https://rinkeby.infura.io/v3/fee8c943351648ac819a52f3ee66bfbc")
// 		const address = req.query.address;

// 		// get the current holder
// 		var ref = firebase.database().ref('mintReservor');
// 		ref.once('value', (snapshot) => {
// 			var reservor = snapshot.val()
// 			if (reservor == address) {
// 				if (web3.utils.isAddress(address)) {

// 					// remove the reservor
// 					admin.database().ref('mintReservor').set("");

// 					var coeff = 1000 * 60 * 1; // round to nearest minute
// 				  	var date = new Date();
// 				  	var nearestMinute = new Date(Math.floor(date.getTime() / coeff) * coeff);
// 				  	var nearestEpoch = nearestMinute.getUnixTime()

// 				  	const hash = web3.utils.soliditySha3({ type: 'uint256', value: nearestEpoch });
// 					const signObj = web3.eth.accounts.sign(hash, "1c9e8b6f202f1b2fa1813f5633904566860443ca27f1dbe65f25aeff7f8b8383");
// 					var signature = signObj.signature.slice(2)
// 					var r = "0x" + signature.slice(0, 64); var s = "0x" + signature.slice(64, 128); var v = parseInt(signature.slice(128),16);
// 					var obj = {"status": "success", "time": nearestEpoch.toString(), "r": r, "s": s, "v": v}

// 					res.send(JSON.stringify(obj));
// 				}
// 				else {
// 					res.send(JSON.stringify({"status": "fail", "err": "Error, address sent is not correct."}));
// 				}	
// 			}
// 			else {
// 				res.send(JSON.stringify({"status": "fail", "err": "Error, new reservation needed."}));
// 			}
// 		});	
// 	});
// });

// exports.requestMintReservation = functions.https.onRequest( (req, res) => {
// 	cors(req, res, () => {
// 		const currentTimestamp = Math.round(Date.now() / 1000);
// 		const reservedTime = 120;
// 		const address = req.query.address;
// 		console.log("address")
// 		console.log(address)

// 		const reservationTimestampRef = admin.database().ref('reservationTimestamp');
// 		reservationTimestampRef.transaction((reserved_timestamp) => {
// 			if (reserved_timestamp === null) {
// 		      return currentTimestamp
// 		    }
// 			if (parseInt(currentTimestamp) - parseInt(reserved_timestamp) > reservedTime){
// 				console.log("setting reservation")
// 				console.log(address)
// 				admin.database().ref('mintReservor').set(address);

// 				// Wait for 70 seconds then check to see if mintReservor is empty,
// 				// if it's not empty, it means mint didn't start so end the reservation
// 				setTimeout(function(){
// 					admin.database().ref('mintReservor').once('value', (snapshot) => {
// 						if (snapshot.val() != "") {
// 							admin.database().ref('reservationTimestamp').once('value', (snapshot) => {
// 								var new_timestamp = parseInt(snapshot.val()) - 300
// 								admin.database().ref('reservationTimestamp').set(new_timestamp)
// 								admin.database().ref('mintReservor').set("");
// 								res.send("success")
// 							})
// 						}
// 					})
// 				}, 1000 * 70);	

// 				res.send(JSON.stringify({"status": "success", "reserved_timestamp": currentTimestamp}))
// 				return currentTimestamp
// 			}
// 			else {
// 				res.send(JSON.stringify({"status": "fail", "reserved_timestamp": reserved_timestamp}))
// 				return;
// 			}

// 			// less secure but saves time
// 			admin.database().ref('mintReservor').set(address);
// 			res.send(JSON.stringify({"status": "success", "reserved_timestamp": currentTimestamp}))
// 			return currentTimestamp
// 		})
// 	})
// })


let contract_address = "0xd2E78e391EEb86AA23D4fE0c543567f7308ca710"
exports.requestNFTUpdate = functions.https.onRequest( (req, res) => {
	cors(req, res, () => {
		var web3 = new Web3("https://rinkeby.infura.io/v3/fee8c943351648ac819a52f3ee66bfbc")
		var contract = new web3.eth.Contract([ { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "approved", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "operator", "type": "address" }, { "indexed": false, "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "ApprovalForAll", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "previousOwner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "OwnershipTransferred", "type": "event" }, { "anonymous": false, "inputs": [ { "indexed": true, "internalType": "address", "name": "from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "to", "type": "address" }, { "indexed": true, "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "Transfer", "type": "event" }, { "inputs": [ { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "approve", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "flipSaleState", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "renounceOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "string[]", "name": "_words", "type": "string[]" }, { "internalType": "uint256", "name": "timestampMsg", "type": "uint256" }, { "internalType": "uint8", "name": "v", "type": "uint8" }, { "internalType": "bytes32", "name": "r", "type": "bytes32" }, { "internalType": "bytes32", "name": "s", "type": "bytes32" } ], "name": "safeMint", "outputs": [], "stateMutability": "payable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" }, { "internalType": "bytes", "name": "_data", "type": "bytes" } ], "name": "safeTransferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "operator", "type": "address" }, { "internalType": "bool", "name": "approved", "type": "bool" } ], "name": "setApprovalForAll", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "from", "type": "address" }, { "internalType": "address", "name": "to", "type": "address" }, { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "transferFrom", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "newOwner", "type": "address" } ], "name": "transferOwnership", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "withdraw", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "stateMutability": "nonpayable", "type": "constructor" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" } ], "name": "balanceOf", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "getApproved", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "address", "name": "owner", "type": "address" }, { "internalType": "address", "name": "operator", "type": "address" } ], "name": "isApprovedForAll", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "maxNfts", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "owner", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "tokenId", "type": "uint256" } ], "name": "ownerOf", "outputs": [ { "internalType": "address", "name": "", "type": "address" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "price", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "saleIsActive", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "bytes4", "name": "interfaceId", "type": "bytes4" } ], "name": "supportsInterface", "outputs": [ { "internalType": "bool", "name": "", "type": "bool" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "symbol", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "tokensMinted", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "_tokenId", "type": "uint256" } ], "name": "tokenURI", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" }, { "inputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "name": "words", "outputs": [ { "internalType": "string", "name": "", "type": "string" } ], "stateMutability": "view", "type": "function" } ], 
        contract_address);

		const prevTokensMinted = req.query.prevTokensMinted;
		const numCurrentTokensMinted = req.query.numCurrentTokensMinted;

		const numPrev = parseInt(prevTokensMinted)
		const numCurrent = parseInt(numCurrentTokensMinted)

		var sync = new DispatchGroup();
		var token_0 = sync.enter();
		for (var id=numPrev+1; id<=numCurrent; id++) {
			var token = sync.enter()
			const updateRef = '/nft_words/' + id.toString()
			const nft_word = contract.methods.words(id).call().then(function(word) { 

				// check to see if the word already exists, if it doesn't that means 
				// that a new nft was added, so remove the reservationTimestamp or lower it by 300
				admin.database().ref(updateRef).once('value', (snapshot) => {
					if (!(snapshot !== null && snapshot.val() !== null && snapshot.val() != undefined)) {
						// admin.database().ref('reservationTimestamp').once('value', (snapshot) => {
						// 	var new_timestamp = parseInt(snapshot.val()) - 300
						// 	admin.database().ref('reservationTimestamp').set(new_timestamp)
						// })
						admin.database().ref(updateRef).set(word);
	        			sync.leave(token);
					}
					else{
						sync.leave(token);
					}
				})
	        }, function(error) {
	            console.log("Couldn't get NFT")
	            console.log(error)
	        });
        }
        sync.leave(token_0);
		sync.notify(function() {
			res.send("finished adding")
		})
	});
});

// call this after 61 seconds from frontend if they haven't started minting yet
// could also have an http function thats called when the mint request is given. It runs for 
// 2 minutes. After 70 seconds it checks to see if a mint request was sent (by checking to see
// if the reservor address is not empty (also need to remove the removal of address from here)).
// If mint request was not sent then change the timestamp like doing here.
// This is better since people can reserve, then close the page (or refresh) and it'll still work.
// exports.endNFTReservation = functions.https.onRequest( (req, res) => {
// 	cors(req, res, () => {
// 		const address = req.query.address;

// 		// get the current holder
// 		var ref = firebase.database().ref('mintReservor');
// 		ref.once('value', (snapshot) => {
// 			var reservor = snapshot.val()
// 			if (reservor == address) {
// 				admin.database().ref('reservationTimestamp').once('value', (snapshot) => {
// 					var new_timestamp = parseInt(snapshot.val()) - 300
// 					admin.database().ref('reservationTimestamp').set(new_timestamp)
// 					admin.database().ref('mintReservor').set("");
// 					res.send("success")
// 				})
// 			}
// 		})
// 	})

// })


// Goes through all the ids in the contract and adds the missing ones.
exports.addMissingNFTS = functions.https.onRequest( (req, res) => {
	cors(req, res, () => {
	});
});










