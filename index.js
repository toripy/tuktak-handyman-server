const express = require( 'express' );
const bodyParser = require( 'body-parser' );
const cors = require( 'cors' );
const MongoClient = require( 'mongodb' ).MongoClient;
const ObjectId = require('mongodb').ObjectId;
const fileUpload = require("express-fileupload");
const fs = require("fs-extra")
require( "dotenv" ).config();
const app = express();
app.use( bodyParser.json() );
app.use( cors() );
app.use(express.static("services"));
app.use(fileUpload());
const port = 5000;


const uri =
`mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.e6zee.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
  const adminCollection = client.db('tuktak').collection("admin");
  const reviewCollection = client.db('tuktak').collection("review");
  const serviceCollection = client.db('tuktak').collection("services");
  const orderCollection = client.db('tuktak').collection("orderList");
  app.post("/admin",(req,res)=>{
  	const email = req.body
  	adminCollection.insertOne(email)
  	.then(result=>{
  		res.send(result.insertedCount>0)
  	})
  })


  app.post( "/isAdmin", ( req, res ) => {
       
        const email = req.body.email;
        
                adminCollection.find( {email:email}  )
            .toArray((err, doctorsDocument)=>{
                res.send(doctorsDocument.length>0)   
        })     
    } )

  app.post( "/review", ( req, res ) => {
       reviewCollection.insertOne(req.body) 
         
    } )
  app.get("/reviews",(req,res)=>{
  	reviewCollection.find({})
  	 .toArray((err, documents) => {
                res.send(documents);

            })
  })

 app.post( "/addService", ( req, res ) => {
 	const file = req.files.file;
 	const serviceName = req.body.serviceName;
 	const description = req.body.description;
        const filePath = `${__dirname}/services/${file.name}`
        
        file.mv(filePath, err=>{
            if(err){
                console.log(err)
                return res.status(500).send({msg: "failed to upload image"})
            }
            return res.send({name: file.name, path:`/${file.name}`})
        })

        const  newImg = fs.readFileSync(filePath);

        const encImg = newImg.toString('base64')

        var image = {
            contentType: req.files.file.mimetype,
            size : req.files.file.size,
            img : Buffer.from(encImg , "base64")
        }
        
        serviceCollection.insertOne({serviceName, description, image:image})
        .then(result => {
                fs.remove(filePath)
               
            })

         
    } )

 	app.get("/services",(req,res)=>{
 		serviceCollection.find({})
 		 .toArray((err, documents) => {
                res.send(documents);

            })
 	})

 	app.post("/orderListUser",(req,res)=>{
 		const orderDetails= req.body
 		orderCollection.insertOne({...orderDetails, status:"processing"})
 		
 	})

 	app.post( "/booking", ( req, res ) => {
       
        const email = req.body.email;
        
                orderCollection.find( {"billing_details.email":email} )
            .toArray((err, orderDocument)=>{
                res.send(orderDocument)   

        })     
    } )

    app.get("/orderListAdmin",(req,res)=>{
    	orderCollection.find({})
    	.toArray((err,documents)=>{
    		res.send(documents)
    	})
    })
    app.post("/updateStatus",(req,res)=>{
    	const status = req.body.status
    	const id = req.body.id
    	orderCollection.updateOne(
    		{"_id": ObjectId(id)},
    		{$set: {"status": status}},
    		{upsert: true}

    		)
    	


    	
    })


});





app.get( '/', ( req, res ) => {
    res.send( "hello db from dv it's working working" )
} )


app.listen( process.env.PORT || port )
