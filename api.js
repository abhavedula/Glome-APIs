const express = require("express");
const app = express();
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');

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
              res.statusCode = 200;
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

app.get("/getRemainingContactsForGroups", (req, res, next) => {
  const userId = req.query.userId;
  const groupId = req.query.groupId;
  rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      members = Object.values(data["members"]);
      const result = {};
      rootRef.ref().child("users/" + userId + "/contacts").get().then((snapshot) => {
        contacts = snapshot.val();
        Object.keys(contacts).forEach(function(key) {
          if (members.indexOf(key) < 0) {
            result[key] = contacts[key];
          }
      });
        res.send(result);
      })
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
  const members = req.body.members;
  const groupRef = rootRef.ref("users/" + userId + "/groups").push();
  const membersObj = {};
  members.forEach(function (contactId, index) {
    membersObj[contactId] = contactId;
    });
  groupRef.set({
        id: groupRef.key,
        name: name,
        members: membersObj 
    }, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        members.forEach(function (contactId, index) {
          const pushRef = rootRef.ref("users/" + userId + "/contacts/" + contactId + "/groups").push();
          const key = pushRef.key;
          pushRef.set(groupRef.key);
        });

        res.statusCode = 200;
        res.send('Data saved successfully.');
      }
    });
});

app.post("/updateUserProfile", (req, res, next) => {
  const userId = req.body.userId;
  const newName = req.body.newName;
  const newAgencyName = req.body.newAgencyName;
  const newEmail = req.body.newEmail;
  const newPhone = req.body.newPhone;
  const ref = rootRef.ref("users/" + userId);
  const updates = {};
  if (newName != null) {
    updates["name"] = newName;
  }
  if (newPhone != null) {
    updates["phone"] = newPhone;
  }
  if (newEmail != null) {
    updates["email"] = newEmail;
  }
  if (newAgencyName != null) {
    updates["agencyName"] = newAgencyName;
  }
  ref.update(updates, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        res.statusCode = 200;
        res.send('Data saved successfully.');
      }
    });
});

app.post("/editContact", (req, res, next) => {
  const userId = req.body.userId;
  const contactId = req.body.contactId;
  const newName = req.body.newName;
  const newPhone = req.body.newPhone;
  const newEmail = req.body.newEmail;
  const newLanguage = req.body.newLanguage;
  const ref = rootRef.ref("users/" + userId + "/contacts/" + contactId);
  const updates = {};
  if (newName != null) {
    updates["name"] = newName;
  }
  if (newPhone != null) {
    updates["phone"] = newPhone;
  }
  if (newEmail != null) {
    updates["email"] = newEmail;
  }
  if (newLanguage != null) {
    updates["language"] = newLanguage;
  }
  ref.update(updates, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        res.statusCode = 200;
        res.send('Data saved successfully.');
      }
    });
});

app.post("/editGroupName", (req, res, next) => {
  const userId = req.body.userId;
  const groupId = req.body.groupId;
  const newName = req.body.newName;
  const ref = rootRef.ref("users/" + userId + "/groups/" + groupId);
  ref.update({name: newName}, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        res.statusCode = 200;
        res.send('Data saved successfully.');
      }
    });
});

app.post("/addToGroup", (req, res, next) => {
  const userId = req.body.userId;
  const groupId = req.body.groupId;
  const contactId = req.body.contactId;
  const ref = rootRef.ref("users/" + userId + "/groups/" + groupId + "/members");
  ref.child(contactId).set(contactId, (error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        const ref2 = rootRef.ref("users/" + userId + "/contacts/" + contactId + "/groups");
        ref2.child(groupId).set(groupId, (error) => {
            if (error) {
              res.statusCode = 400;
              res.send('Data could not be saved.' + error);
            } else {
              res.statusCode = 200;
              res.send('Data saved successfully.');
            }
          });
      }
    });
});

app.post("/removeFromGroup", (req, res, next) => {
  const userId = req.body.userId;
  const groupId = req.body.groupId;
  const contactId = req.body.contactId;
  const ref = rootRef.ref("users/" + userId + "/groups/" + groupId + "/members/" + contactId);
  ref.remove((error) => {
      if (error) {
        res.statusCode = 400;
        res.send('Data could not be saved.' + error);
      } else {
        const ref2 = rootRef.ref("users/" + userId + "/contacts/" + contactId + "/groups/" + groupId);
        ref2.remove((error) => {
            if (error) {
              res.statusCode = 400;
              res.send('Data could not be saved.' + error);
            } else {
              res.statusCode = 200;
              res.send('Data saved successfully.');
            }
          });
      }
    });
});

app.post("/sendOTP", (req, res, next) => {
  const email = req.body.email;

  const min = Math.ceil(100000);
  const max = Math.floor(999999);
  const otp = Math.floor(Math.random() * (max - min) + min)

  var query = firebase.database().ref("users");
    query.once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var data = childSnapshot.val();

          // Get userID and save OTP
          if (data["email"] == email) {
            const userId = data["id"];
            const pushRef = rootRef.ref("users/" + userId);
              pushRef.update({otp: otp}, (error) => {
              if (error) {
                res.statusCode = 400;
                res.send('Data could not be saved.' + error);
              } else {
                res.statusCode = 200;
                res.send('Data saved successfully.');
              }
            });

            // Email OTP
              rootRef.ref().child("mail").get().then((snapshot) => {
                if (snapshot.exists()) {
                  password = snapshot.val();
                  var transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                      user: 'glomeapp@gmail.com',
                      pass: password
                    }
                  });

                  var mailOptions = {
                    from: 'glomeapp@gmail.com',
                    to: email,
                    subject: 'OTP to reset your Glome Password',
                    text: 'Your one time password: ' + otp
                  };

                  transporter.sendMail(mailOptions, function(error, info){
                    if (error) {
                      console.log(error);
                    } else {
                      console.log('Email sent: ' + info.response);
                    }
                  });


                } else {
                  res.statusCode = 400;
                  res.send("Can't send OTP");
                }
              }).catch((error) => {
                res.statusCode = 400;
                res.send("Can't send OTP");
              });
          } else {
            res.statusCode = 400;
            res.send("Incorrect email");
          }
          
      });
    });
});


app.post("/verifyOTP", (req, res, next) => {
  const email = req.body.email;
  const otp = req.body.otp;
  var query = firebase.database().ref("users");
    query.once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var data = childSnapshot.val();

          // Get userID and save OTP
          if (data["email"] == email) {
            const correctOtp = data["otp"];
            if (otp == correctOtp) {
              res.statusCode = 200;
              res.send(true);
            } else {
              res.statusCode = 400;
              res.send(false);
            }
          } else {
            res.statusCode = 400;
            res.send("Incorrect email");
          }
          
      });
    });
});

app.post("/saveNewPassword", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  var query = firebase.database().ref("users");
    query.once("value")
      .then(function(snapshot) {
        snapshot.forEach(function(childSnapshot) {
          var key = childSnapshot.key;
          var data = childSnapshot.val();

          if (data["email"] == email) {
            const userId = data["id"];
            const pushRef = rootRef.ref("users/" + userId);
              pushRef.update({password: password}, (error) => {
              if (error) {
                res.statusCode = 400;
                res.send('Data could not be saved.' + error);
              } else {
                res.statusCode = 200;
                res.send('Data saved successfully.');
              }
            });
          } else {
            res.statusCode = 400;
            res.send("Incorrect email");
          }
          
      });
    });
});



//Server
app.listen(process.env.PORT || 8000, function() {
  console.log("API started");
});