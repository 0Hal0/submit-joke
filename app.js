const express = require("express");
const app = express();
const path = require("path");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require('swagger-jsdoc');
const cors = require('cors');

app.use(express.urlencoded({ extended: true}));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const mongoose = require("mongoose");
const DB_PORT = 27017;
const DB_CON_STR = "mongodb+srv://hal0dickinson:Pass123@cluster0.wamfkof.mongodb.net/Jokes";

app.enable("trust proxy");

mongoose.connect(DB_CON_STR);

const db = mongoose.connection;
db.on("error", (error) => console.error(error));
db.once("open", (res) => console.log("MongoDB server started"));

const jokeSchema = new mongoose.Schema({
    type: {
      type: String,
      required: true
    },
    setup: {
      type: String,
      required: true
    },
    punchline: {
      type: String,
      required: false
    }
});
const jokeTypeSchema = new mongoose.Schema({
  typeNum: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    required: false
  }
});
const jokeModel = mongoose.model("joke", jokeSchema);
const jokeTypeModel = mongoose.model("jokeType", jokeTypeSchema);

//Setup /docs Swagger API enpoint
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Submit Joke Service API',
      version: '1.0.0',
      description: `This service provides interaction with a jokes database in a json format`,
    },
  },
  apis: ['app.js'],   
};

const swaggerDocs = swaggerJsDoc(options);

app.use('/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocs));

/**
 * @swagger
 *   /:
 *    get:
 *     summary: Get the submit joke HTML page
 *     responses:
 *       "200":
 *         description: Success
 *         content:
 *           text/html:
 *             schema:
 *               type: string
 */
app.get("/", (req, res) => {
  res.status(200);
  res.sendFile("./public/html/submit_joke.html", { root: __dirname });
})

/**
 * @swagger
 * /joke-types:
 *     put:
 *       summary: Update the local copy joke types
 *       requestBody:
 *         description: An array of joke types with type_num and type properties
 *         required: true
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/joke-type'
 *       responses:
 *         "200":
 *           description: Success
 *         "500":
 *           description: Error updating the joke types
 */
app.put("/joke-types", async (req, res) => {
  let jokeTypes = req.body;
  for (i = 0; i<jokeTypes.length; i++){
    jokeTypeMongo = new jokeTypeModel({
      typeNum: Number(jokeTypes[i].type_num),
      type: jokeTypes[i].type
    });
    try{
      res.status(200)
      await jokeTypeModel.findOneAndUpdate({"typeNum": jokeTypeMongo.typeNum}, jokeTypes[i], {upsert: true});
      console.log(i)
    }catch(err){
      res.status(500)
      console.log(err);
    }
  }
});

/**
 * @swagger
 *   /joke:
 *    post:
 *     summary: Create a new joke
 *     requestBody:
 *       description: The joke to create
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/new-joke'
 *     responses:
 *       "200":
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *              $ref: '#/components/schemas/new-joke'
 *       "500":
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
app.post("/joke", (req, res) => {
  const joke = new jokeModel({
      type: req.body.type,
      setup: req.body.setup,
      punchline: req.body.punchline
  })
  joke
  .save()
  .then(result => {
    res.status(200).json({
      message: "Handling POST request",
      createdProduct: result
    });
  })
  .catch(err => {
    console.log(err);
    res.status(500).json({
      error: err
    });
  });
})

/**
 * @swagger
 *   /joke-types:
 *     get:
 *       summary: Get the local copy of joke types
 *       responses:
 *         "200":
 *           description: "Successfully got all joke types"
 *           content:
 *             application/json:
 *               schema:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/joke-type'
 *         "500":
 *           description: "Error updating"
 */
app.get("/joke-types", async (req, res) =>{
  try{
    const jokeTypes = await jokeTypeModel.find();
    res.status(200)
    res.json(JSON.parse(JSON.stringify(jokeTypes)))
  }catch(err){
    res.status(500);
    console.log(err)
  }
})

/**
 * @swagger
 * /joke:
 *    get:
 *      summary: Get a random joke
 *      responses:
 *        "200":
 *          description: Success
 *          content:
 *            application/json:
 *              schema:
 *                $ref: '#/components/schemas/joke'
 *        "500":
 *          description: Error
 */
app.get("/joke", async (req, res) => {
  try{
    const joke = await jokeModel.findOne()
    res.json(joke)
  }catch (error){
    res.sendStatus(500)
  }
})

/**
 * @swagger
 *   /joke/{id}:
 *     delete:
 *       summary: Delete a joke
 *       parameters:
 *         - in: path
 *           name: id
 *           schema:
 *             type: string
 *           required: true
 *           description: The ID of the joke to delete
 *       responses:
 *         "200":
 *           description: Success
 *         "500":
 *           description: Error
 */
app.delete("/joke/:id", async (req, res) => {
  var id = req.params.id;
  try{
    const joke = await jokeModel.findByIdAndDelete(id)
    res.sendStatus(200)
  }catch(error){
    console.log(error)
    res.sendStatus(500)
  }
})


app.listen(3000, () => console.log(`Listening on port 3000`));

/** Swagger API Components defenitions
 * @swagger
 * components:
 *  schemas:
 *   joke-type:
 *     type: object
 *     properties:
 *       type_num:
 *         type: integer
 *         description: The unique ID of the joke type.
 *       type:
 *         type: string
 *         description: The name of the joke type.
 *
 *   new-joke:
 *     type: object
 *     properties:
 *       type:
 *         type: string
 *         description: The name of the joke type.
 *       setup:
 *         type: string
 *         description: The setup of the joke.
 *       punchline:
 *         type: string
 *         description: The punchline of the joke.
 *         
 *   joke:
 *     type: object
 *     properties:
 *       type:
 *         type: string
 *         description: The name of the joke type.
 *       setup:
 *         type: string
 *         description: The setup of the joke.
 *       punchline:
 *         type: string
 *         description: The punchline of the joke.
 *       _id:
 *         type: string
 *         description: The unique ID of the joke.
 *       __v:
 *         type: integer
 *         description: Internal MongoDB version key.
 */
