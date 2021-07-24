const express = require("express");
const app = express();
const bodyParser = require('body-parser');

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

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

app.post("/signIn", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
    var query = firebase.database().ref("users");
    query.once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var data = childSnapshot.val();

          if (data["email"] == email) {
            if (data["password"] == password) {
              res.send({
                id: data["id"],
                name: data["name"],
                email: data["email"],
                agencyName: data["agencyName"],
                phone: data["phone"]
              });
            } else {
              res.statusCode = 400;
              res.send("Incorrect password");
            }
          } else {
            res.statusCode = 400;
            res.send("Incorrect email");
          }
          
      });
    });
});

app.get("/getUserProfileDetails", (req, res, next) => {
  const userId = req.query.userId;
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

app.get("/getContactDetails", (req, res, next) => {
  const userId = req.query.userId;
  const contactId = req.query.contactId;
  rootRef.ref().child("users/" + userId + "/contacts/" + contactId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send({
        id: data["id"],
        name: data["name"],
        email: data["email"],
        agencyName: data["language"],
        phone: data["phone"],
        groups: data["groups"]
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

app.get("/getContacts", (req, res, next) => {
  const userId = req.query.userId;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send(data["contacts"]);
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
  const userId = req.query.userId;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send(data["groups"]);
    } else {
      res.statusCode = 400;
      res.send("No data available");
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send(error);
  });
});

app.get("/getGroupDetails", (req, res, next) => {
  const userId = req.query.userId;
  const groupId = req.query.groupId;
  rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      res.send(data);
    } else {
      res.statusCode = 400;
      res.send("No data available");
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send(error);
  });
});

app.post("/createContact", (req, res, next) => {
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
    }, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        res.statusCode = 200;
        res.send('Data saved successfully.');
      }
    });
});

app.post("/createGroup", (req, res, next) => {
  const userId = req.body.userId;
  const name = req.body.name;
  const pushRef = rootRef.ref("users/" + userId + "/groups").push();
  // TODO: Also need to update user object to list group
  pushRef.set({
        id: pushRef.key,
        name: name,
    }, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        res.statusCode = 200;
        res.send('Data saved successfully.');
      }
    });
});

// app.post("/editContact", (req, res, next) => {
//   const userId = req.body.userId;
//   const contactId = req.body.contactId;
//   const newName = req.body.newName;
//   const newPhone = req.body.newPhone;
//   const newEmail = req.body.newEmail;
//   const newLanguage = req.body.newLanguage;
//   const ref = rootRef.ref("users/" + userId + "/contacts/" + contactId);
//   ref.update({
//         id: contactId,
//         name: newName,
//         phone: newPhone,
//         email: newEmail,
//         language: newLanguage,
//         groups: null,
//     }, (error) => {
//       if (error) {
//         res.statusCode = 400;
//         res.send('Data could not be saved.' + error);
//       } else {
//         res.statusCode = 200;
//         res.send('Data saved successfully.');
//       }
//     });
// });

//Server
app.listen(process.env.PORT || 8000, function() {
  console.log("API started");
});