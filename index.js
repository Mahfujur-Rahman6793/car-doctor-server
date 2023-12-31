const express = require('express');
const cors = require('cors');
const app = express();
const jwt =require('jsonwebtoken');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 5000;


//custom middleware

const logger = (req,res,next)=>{
  console.log('Log Info : ',req.method,req.url);
  next();
}
const verifyToken = (req,res,next)=>{
  const token = req?.cookies?.token;
  console.log('tok tok verify :',token);
  next();
}

// middleware initialization
app.use(cors(({
  origin:['http://localhost:5173','http://localhost:5174'],
  credentials:true
})));
app.use(express.json());
app.use(cookieParser())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.pngg0qg.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const ServiceCollection =  client.db('car-doctor').collection('services');
    const CheckoutCollection = client.db('car-doctor').collection('checkoutservices');
    // auth realted api
    app.post('/jwt',async(req,res)=>{
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user,process.env.DB_TOKEN,{expiresIn:'1h'});
      res
      .cookie('token',token,{
        httpOnly:true,
        secure:true,
        sameSite:'none'
      })
      .send({success:true})
    })
    app.post('/logout',async(req,res)=>{
      const user = req.body;
      
      res.clearCookie('token').send({success:true})
    })
    // service realated api

    app.get('/service',async(req,res)=>{
      const cursor = ServiceCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    })
    app.get('/service/:id',async(req,res)=>{
      const id = req.params.id;
      console.log(id);
      const query = {
        _id: new ObjectId(id)
      };
      const result = await ServiceCollection.findOne(query);
      res.send(result);
    })

    app.get('/checkout',logger,verifyToken,async(req,res)=>{
      console.log(req.query);
      let query = {};

      if(req.query?.email){
        query = {email : req.query?.email}
      }
      const result = await CheckoutCollection.find(query).toArray();
      res.send(result);
    })

    // insert a document

    app.post('/checkout', async(req,res)=>{
      const checkout = req.body;
      console.log(checkout);
      const result =await CheckoutCollection.insertOne(checkout);
      res.send(result);
    })

    app.delete('/checkout/:id',async(req,res)=>{
      const id = req.params.id;
      const query ={
        _id:new ObjectId(id)
      }
      const result =await CheckoutCollection.deleteOne(query);
      res.send(result);
    })

    app.patch('/checkout/:id',async(req,res)=>{
      const id = req.params.id;
      const filter ={
        _id:new ObjectId(id)
      }
      const checkout = req.body;
      const updateDoc = {
        $set: {
          status: checkout.status
        },
      };

      const result = await CheckoutCollection.updateOne(filter, updateDoc);
      res.send(result);
    })
  

   

    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/',(req,res)=>{
    res.send('Doctor is running');
})
app.listen(port,()=>{
    console.log(`project is running on port ${port}`);
});