const bodyParser = require('body-parser');
var axios = require('axios');
const dotenv = require('dotenv');
const port = 5000;
const {spawn} = require('child_process');

// // Import required AWS SDK clients and commands for Node.js.
// import { PutObjectCommand } from "@aws-sdk/client-s3";
// import { s3Client } from "./libs/s3Client.js"; // Helper function that creates an Amazon S3 service client module.
// import {path} from "path";
// import {fs} from "fs";

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");
// import { S3Client } from "@aws-sdk/client-s3";
// const { s3Client } = require("./libs/s3Client.js");


const REGION = "ap-southeast-1"; //e.g. "us-east-1"
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });


const {path} = require("path");
// const {fs} = require("fs");


dotenv.config();
const {
    Metaplex,
    keypairIdentity,
    bundlrStorage,
  } = require("@metaplex-foundation/js");
  const { nftStorage } = require("@metaplex-foundation/js-plugin-nft-storage");
  const {
    Connection,
    clusterApiUrl,
    PublicKey,
    Keypair,
  } = require("@solana/web3.js");
  const fs = require("fs");
  const express = require("express");
  const cors = require('cors');

//   const pathToMyKeypair = process.env.HOME + "/.config/solana/id.json";
  // const pathToMyKeypair = "./complexName15.json";
  // const keypairFile = fs.readFileSync(pathToMyKeypair);
  // const secretKey = Buffer.from(JSON.parse(keypairFile.toString()));
  const secretKey =  Buffer.from(JSON.parse(process.env.id));
  const keypair = Keypair.fromSecretKey(secretKey);
  // console.log("keypair:", keypair);
  const app = express();
  app.use(cors());
  
app.use(bodyParser.json());
  
  const connection = new Connection(clusterApiUrl("devnet"));
  const metaplex = Metaplex.make(connection)
    .use(keypairIdentity(keypair))
    // .use(bundlrStorage({ address: "https://devnet.bundlr.network" }));
    .use(nftStorage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEQ0OTgxREViRTVmQzJFQjZlRGE5OTJBYzdGNmNhYjJhNTVBNkEzMzUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1OTc3ODAyODczOCwibmFtZSI6ImZpcnN0In0.4zDW4UyctUE2nSpe7VgFRX9tjXVt4JMz2kY0CQVH5Uc" }))
  
  app.get("/getNFT", async (req, res) => {
    let mintAddress = req.query.mint;
  
    if (!mintAddress) {
      res.status(400).json({
        err: "Mint Address Not Provided",
      });
    }
  
    try {
      const mint = new PublicKey(mintAddress);
      const nft = await metaplex.nfts().findByMint(mint);
      res.json(nft);
      console.log("success");
    } catch (err) {
      console.log("error");
      res.send(err);
    }
  });

  app.get("/getNFTbyMint", async (req, res) => {
    let mintAddress = req.query.mint;
  
    if (!mintAddress) {
      res.status(400).json({
        err: "Mint Address Not Provided",
      });
    }
    try {
      const mint = new PublicKey(mintAddress);
      const nft = await metaplex.nfts().findByMint(mint).run();
      res.send(nft);
    } catch (err) {
      res.send(err);
    }
  });

  app.get("/getNFTbyOwner", async (req, res) => {
    let ownerKey = req.query.ownerKey;
    // let ownerKey = req.body;
    // console.log("ownerKey:", ownerKey);
  
    if (!ownerKey) {
      res.status(400).json({
        err: "ownerKey Not Provided",
      });
      return;
    }

    // if (!ownerKey.hasOwnProperty('ownerKey')){
    //   res.status(400).json({
    //         err: "ownerKey Not Provided",
    //       });
    // }

    try {
      const myNfts = await metaplex
      .nfts()
      // .findAllByOwner(new PublicKey(ownerKey["ownerKey"]))
      .findAllByOwner(new PublicKey(ownerKey))
      .run();
      res.send(myNfts);
    } catch (err) {
      res.send(err);
    }
  });

  app.get("/updateNFTName", async (req, res) => {
    let newName = req.query.newName;
    let mintAddress = req.query.mint;
    // console.log("json:", req.body);
  
    if (!mintAddress) {
      res.status(400).json({
        err: "Mint Address Not Provided",
      });
    }else if(!newName){
      res.status(400).json({
        err: "newName Not Provided",
      });
    }
    try {
      const mint = new PublicKey(mintAddress);
      const nft = await metaplex.nfts().findByMint(mint).run();
      // console.log("this is the nft: ", nft);
      const { nft: updatedNft } = await metaplex
      .nfts()
      .update(nft, { name: newName })
      .run();
      res.send(updatedNft);
    } catch (err) {
      // console.log("error,");
      res.send(err);
    }
  });

  app.get("/updateNFTMetadata", async (req, res) => {
    const mintAddress = req.query.mint;
    const evolvedImage = req.query.imageurl;
    const attributes = req.query.attributes.split(',');
    // const attributeKeys = ["Number", "eventCount", "tier"];
    var completeAttributes = [];

    if (!mintAddress) {
      res.status(400).json({
        err: "Mint Address Not Provided",
      });
    }

    try {
      const mint = new PublicKey(mintAddress);
      const nft = await metaplex.nfts().findByMint(mint).run();
      // console.log("this is the nft: ", nft);
      console.log("nft.json.attributes: ", nft.json.attributes);
      const attributeKeys = nft.json.attributes.map(i => i["trait_type"]);
      console.log("attributeKeys: ", attributeKeys);

      if (attributeKeys.length != attributes.length) {
        res.status(400).json({
          err: "Number of attributes given and number of attributes present do not match!",
        });
      }
      for (var i=0; i < attributeKeys.length; i++){
        completeAttributes.push({"trait_type": attributeKeys[i], "value": attributes[i]})
      }

      const { uri: newUri } = await metaplex
    .nfts()
    .uploadMetadata({
        ...nft.json,
        // attributes: completeAttributes,
        properties: {
          "files": [{
            "uri": evolvedImage,
            "type": "image/png"
          }]
        },
        "image": evolvedImage,
    })
    .run();

    console.log("new json uri:", newUri);

const { nft: updatedNft } = await metaplex
    .nfts()
    .update(nft, { uri: newUri })
    .run();

      console.log("completed upgrade")
      res.send(updatedNft);
    } catch (err) {
      // console.log("error,");
      res.send(err);
    }
  });


  // https://medium.com/swlh/run-python-script-from-node-js-and-send-data-to-browser-15677fcf199f


  app.get('/generateImages', async(req, res) => {
    const {spawn} = require('child_process');

    try{

      var dataToSend;
      // spawn new child process to call the python script
      const python = spawn('python', ['lol.py'], {shell: true});

      // collect data from script
      python.stdout.on('data', function (data) {
       console.log('Pipe data from python script ...');
       dataToSend = data.toString();
       console.log(dataToSend);
      });

      console.log(
        "spawn('python', ['lol.py']); executed2"
      )


      // in close event we are sure that stream from child process is closed
      python.on('close', (code) => {
      console.log(`child process close all stdio with code ${code}`);
      console.log(dataToSend);
      // send data to browser
      res.send(dataToSend)
      });

      console.log(
        "spawn('python', ['lol.py']); executed3"
      )

    }catch(err){
      res.send(err)
    }

    

   
  });

  app.get("/upload", (req, res) => {
    const file = "dummy.json"; // Path to and name of object. For example '../myFiles/index.js'.
    const fileStream = fs.createReadStream(file);
    // https://docs.aws.amazon.com/AmazonS3/latest/userguide/upload-objects.html
    // Set the parameters
    const uploadParams = {
      Bucket: "elasticbeanstalk-ap-southeast-1-045309410968",
      // Add the required 'Key' parameter using the 'path' module.
      // Key: path.basename(file),
      Key: "files2/"+file,
      // Add the required 'Body' parameter
      Body: fileStream,
    };
    
    
    // Upload file to specified bucket.
    const run = async () => {
      try {
        const data = await s3Client.send(new PutObjectCommand(uploadParams));
        console.log("Success", data);
        return data; // For unit tests.
      } catch (err) {
        console.log("Error", err);
      }
    };
    try{
      run();
      res.send("Success");
    }catch(err){
      res.send(err);
    }
    
    

  }
  )

  app.post("/updateMetadata", async(req, res) => {

    console.log(req.body);
    var config = {
      method: 'get',
      url: 'https://elasticbeanstalk-ap-southeast-1-045309410968.s3.ap-southeast-1.amazonaws.com/dummy.json',
      headers: { }
    };

    var metadata = await axios(config)
    .then(function (response) {
      console.log(JSON.stringify(response.data));
      return response.data;
    })
    .catch(function (error) {
      console.log(error);
      res.send(error);
    });
    console.log(metadata);
    metadata.name = "999"

        // write JSON string to a file
    fs.writeFile('dummy.json', JSON.stringify(metadata), (err) => {
      if (err) {
          // throw err;
          res.send("trouble writing json file");
      }
      console.log("JSON data is saved.");
      
    });

    res.send("success")
  })

  app.get("/updateNFTMetadataEvent", async (req, res) => {
    let mintAddress = req.query.mint;
    if (!mintAddress) {
      res.status(400).json({
        err: "Mint Address Not Provided",
      });
    }

    try {
      const mint = new PublicKey(mintAddress);
      const nft = await metaplex.nfts().findByMint(mint).run();
      // console.log("this is the nft: ", nft);
      // console.log("nft.json.attributes: ", nft.json.attributes);
      const attributeKeys = nft.json.attributes.map(i => i["trait_type"]);
      const attributeValues = nft.json.attributes.map(i => i["value"]);
      var completeAttributes = [];
      for (var i=0; i < nft.json.attributes.length; i++){
        if (nft.json.attributes[i]["trait_type"] == "eventCount"){
              completeAttributes.push({"trait_type": nft.json.attributes[i]["trait_type"], 
                  "value": (parseInt(nft.json.attributes[i]["value"]) + 1).toString() })
        }else{
          completeAttributes.push(nft.json.attributes[i]);
        }
      }

      const { uri: newUri } = await metaplex
    .nfts()
    .uploadMetadata({
        ...nft.json,
        attributes: completeAttributes
    })
    .run();

    console.log("new json uri:", newUri);

    const { nft: updatedNft } = await metaplex
        .nfts()
        .update(nft, { uri: newUri })
        .run();


      res.send(updatedNft);
    } catch (err) {
      // console.log("error,");
      res.send(err);
      
    }
  });

  app.get("/updateNFTMetadataTier", async (req, res) => {
    let mintAddress = req.query.mint;
    if (!mintAddress) {
      res.status(400).json({
        err: "Mint Address Not Provided",
      });
    }

    try {
      const mint = new PublicKey(mintAddress);
      const nft = await metaplex.nfts().findByMint(mint).run();
      // console.log("this is the nft: ", nft);
      // console.log("nft.json.attributes: ", nft.json.attributes);
      const attributeKeys = nft.json.attributes.map(i => i["trait_type"]);
      const attributeValues = nft.json.attributes.map(i => i["value"]);
      var completeAttributes = [];
      for (var i=0; i < nft.json.attributes.length; i++){
        if (nft.json.attributes[i]["trait_type"] == "tier"){
              completeAttributes.push({"trait_type": nft.json.attributes[i]["trait_type"], 
                  "value": (parseInt(nft.json.attributes[i]["value"]) + 1).toString() })
        }else{
          completeAttributes.push(nft.json.attributes[i]);
        }
      }

      const { uri: newUri } = await metaplex
    .nfts()
    .uploadMetadata({
        ...nft.json,
        attributes: completeAttributes
    })
    .run();

    console.log("new json uri:", newUri);

    const { nft: updatedNft } = await metaplex
        .nfts()
        .update(nft, { uri: newUri })
        .run();


      res.send(updatedNft);
    } catch (err) {
      // console.log("error,");
      res.send(err);
    }
  });

  
  // app.listen(3000, () => console.log("Server is running over PORT 3000"));

console.log(process.env.PORT)
app.listen(process.env.PORT || 5000, () => {
    console.log("server started to listen on " + process.env.PORT || 5000);
});