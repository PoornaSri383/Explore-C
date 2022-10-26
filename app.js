const express = require("express");   //npm express module

const bodyParser = require('body-parser'); 

// firebase and firestore 

const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore, FieldValue, BulkWriter} = require('firebase-admin/firestore');

var serviceAccount = require("./key.json");

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const app = express();

app.use(bodyParser.urlencoded({ extended : true }));

app.set("view engine", "ejs"); 

app.use(express.static("public")); // serves all the static files like css, images...

var usersData = []; // it stores the document id of user of firestore database who logged into the website



// it displays the home page in the home route

app.get('/', function (req, res) {
  res.sendFile(__dirname + "/index.html");
});
                                            //  LOGIN AND SIGN UP PAGE
 // getting the sign up page

app.get("/signUpForm", function(req, res){
  res.sendFile(__dirname + "/signUp.html");
});
  
//getting the login page

app.get("/logIn", function(req, res){
  res.sendFile(__dirname + "/login.html");
})

app.post("/signUpSubmit", function(req, res){
  
  // getting the details from  sign in form

  const username = req.body.username;
  const email = req.body.email;
  const password = req.body.password;

  // adding them to the "users" collection

  db.collection("users").add({

    Username: username,
    Email: email,
    Password: password,
    Notes: []

  }).then(function(){
    res.sendFile(__dirname + "/login.html"); // If details are stored successfully in the database then it sends the login form
  })
});


app.post("/loginButton", (req, res) => {
  const password = req.body.password;
 const username = req.body.username;

  db.collection("users")
    .where("Username", "==", username)   
    .where("Password", "==", password)
    .get()
    .then((docs) => {
      if (docs.size > 0) {
        //query my database with all the users only when login is successfull
        usersData = [];
        db.collection("users")
          .get()
          .then((docs) => {
            docs.forEach((doc) => {
              if((doc.data().Password == password && (doc.data().Username == username)) ) {
                usersData.push(doc.id);
              }
            });
          })
          .then(() => {
            console.log(usersData);
            res.sendFile(__dirname + "/");
          });
      } else {
        res.sendFile(__dirname + "/loginError.html");
      }
    });
});

                                                            // TOPICS
// gives the list of buutons of all topics

app.get("/topics", function(req, res){
  res.sendFile(__dirname + "/topics.html")
})


// based on the selected topic it will display the corresponding image

app.post("/selectedTopic", function(req, res){
  const value = req.body.photo;  // it stores the value of the button
  res.render("topic", {image: value});

})

app.post("/backToTopics", function(req, res){
 res.redirect("/topics");
})


                                    //NOTES

app.get("/notes",async function(req, res){

  if(usersData.length == 0) {
    res.send("<h1><center>Please Login before accessing the notes</center></h1>");
  } 
  else {

  const userNotes = db.collection("users").doc(usersData[0]); // userNotes stores the data related to the paricular user i.e; who logged into the website
  const response = await userNotes.get();

  res.render("notes", {notes: response.data().Notes});
  
}
});

//  create new notes and stores it in the database

app.post("/addNewNotes",async function(req, res){
  const title = req.body.title; 
  const desc = req.body.desc;
  const data = {
  Title: title,
  Description: desc
 }
db.collection("users").doc(usersData[0]).update({
  Notes: FieldValue.arrayUnion(data)
}).then(async function(){

  const userNotes = db.collection("users").doc(usersData[0]);
  const response = await userNotes.get();
  res.render("notes", {notes: response.data().Notes});

});
   
});


// To delete the notes

app.post("/deleteNotes",async function(req, res){
   
  const value = req.body.delete;
  const userNotes = db.collection("users").doc(usersData[0]);
  const resp = await userNotes.get();
  const obj = resp.data().Notes[value];
  
    db.collection('users').doc(usersData[0]).update({
       Notes: FieldValue.arrayRemove(obj) // updates the database
    }).then(async function(){  //After updating , Do this thing
      const response = await userNotes.get();   
      res.render("notes", {notes: response.data().Notes}); // displays all the notes except the deleted notes
    })
})


app.listen(3000, function(){
  console.log("server is running on port 3000");
})