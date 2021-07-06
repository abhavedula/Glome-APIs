const express = require("express");
const app = express();

var firebase = require('firebase')

var config = {
    apiKey: "AIzaSyCejVflI0Fdx3A2VGAApbqKTxi6ACL3I_s",
    authDomain: "glome-2bc31.firebaseapp.com",
    projectId: "glome-2bc31",
    storageBucket: "glome-2bc31.appspot.com",
    messagingSenderId: "257542518832",
    appId: "1:257542518832:web:a44df9d9c749c68802d5f5"
  };

firebase.initializeApp(config);

var rootRef = firebase.database();

app.get("/", (req, res, next) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Glome APIs');
});

// EXAMPLE 1
app.get("/setTest", (req, res, next) => {
  rootRef.ref('test').set({
        name: 'bob',
        number: '123'
    });
});

// EXAMPLE 2
app.get("/getTest", (req, res, next) => {
  rootRef.ref().child("test").get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send(snapshot.val());
    } else {
      res.statusCode = 400;
      res.send("No data available");
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send(error);
  });
});

app.get("/getUserProfileDetails", (req, res, next) => {
  const userId = req.body.userId;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send({
        id: data["id"],
        name: data["name"],
        email: data["email"],
        agencyName: data["agencyName"],
        phone: data["phone"]
      });
    } else {
      res.statusCode = 400;
      res.send("No data available");
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send(error);
  });
});

app.get("/getGroups", (req, res, next) => {
  const userId = req.body.userId;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send({
        groups: data["groups"],
      });
    } else {
      res.statusCode = 400;
      res.send("No data available");
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send(error);
  });
});

app.get("/createContact", (req, res, next) => {
  const userId = req.body.userId;
  const name = req.body.name;
  const phone = req.body.phone;
  const email = req.body.email;
  const language = req.body.language;
  const pushRef = rootRef.ref("users/" + userId + "/contacts").push();
  pushRef.set({
        id: pushRef.key,
        name: name,
        phone: phone,
        email: email,
        language: language,
        groups: null
    });
});

//Server
app.listen(process.env.PORT || 8000, function() {
  console.log("API started");
});