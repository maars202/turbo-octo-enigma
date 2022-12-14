const bodyParser = require('body-parser');
var axios = require('axios');
const dotenv = require('dotenv');
const port = 5000;
const {spawn} = require('child_process');

const { PutObjectCommand, S3Client } = require("@aws-sdk/client-s3");


const REGION = "ap-southeast-1"; //e.g. "us-east-1"
// Create an Amazon S3 service client object.
const s3Client = new S3Client({ region: REGION });

const {path} = require("path");

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
    .use(nftStorage({ token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJkaWQ6ZXRocjoweEQ0OTgxREViRTVmQzJFQjZlRGE5OTJBYzdGNmNhYjJhNTVBNkEzMzUiLCJpc3MiOiJuZnQtc3RvcmFnZSIsImlhdCI6MTY1OTc3ODAyODczOCwibmFtZSI6ImZpcnN0In0.4zDW4UyctUE2nSpe7VgFRX9tjXVt4JMz2kY0CQVH5Uc" }))
  
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


  app.get("/updateNFTMetadata", async (req, res) => {
    const mintAddress = req.query.mint;
    const evolvedImage = req.query.imageurl;
    // const attributes = req.query.attributes.split(',');
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
      // // console.log("this is the nft: ", nft);
      // console.log("nft.json.attributes: ", nft.json.attributes);
      // const attributeKeys = nft.json.attributes.map(i => i["trait_type"]);
      // console.log("attributeKeys: ", attributeKeys);

      // if (attributeKeys.length != attributes.length) {
      //   res.status(400).json({
      //     err: "Number of attributes given and number of attributes present do not match!",
      //   });
      // }

      // for (var i=0; i < attributeKeys.length; i++){
      //   completeAttributes.push({"trait_type": attributeKeys[i], "value": attributes[i]})
      // }

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

  app.get("/upload", (req, res) => {
    const file = "dummy.json"; // Path to and name of object. For example '../myFiles/index.js'.
    const fileStream = fs.createReadStream(file);
    const uploadParams = {
      Bucket: "elasticbeanstalk-ap-southeast-1-045309410968",
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