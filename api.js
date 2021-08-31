const express = require("express");
const app = express();
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');

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
          const authToken = jwt.sign(data["id"], 'shhhhh');

          const pushRef = rootRef.ref("users/" + data["id"]);
          pushRef.update({authToken: authToken}, (error) => {
            if (error) {
              res.statusCode = 400;
              res.send({
                success: false,
                responseCode: 400,
                message: "Auth token could not be created: " + error,
                data: {}
              });
            }
          }); 

          res.statusCode = 200;
          res.send({
            success: true,
            responseCode: 200,
            message: "Sign in was successful",
            data: {
              id: data["id"],
              name: data["name"],
              email: data["email"],
              agencyName: data["agencyName"],
              phone: data["phone"],
              auth_token: authToken
            }
          });
        } else {
          res.statusCode = 200;
          res.send({
            success: false,
            responseCode: 200,
            message: "Incorrect password",
            data: {}
          });
        }
      } 

    });
});
});

app.get("/getUserProfileDetails", (req, res, next) => {
  const userId = req.query.userId;
  const authToken = req.headers.authorization.replace("Bearer ", "");;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      if (data["authToken"] == authToken) {
        res.send({
          success: true,
          responseCode: 200,
          message: "Profile details found successfully",
          data: { user_profile_details: {
            id: data["id"],
            firstName: data["firstName"],
            lastName: data["lastName"],
            email: data["email"],
            agencyName: data["agencyName"],
            phone: data["phone"]
          }}
        });
      } else {
        res.statusCode = 400;
        res.send({
          success: false,
          responseCode: 400,
          message: "No authorization",
          data: {}
        });
      }
    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "No data available",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: error,
      data: {}
    });
  });
});

app.get("/getContactDetails", (req, res, next) => {
  const userId = req.query.userId;
  const contactId = req.query.contactId;
  rootRef.ref().child("users/" + userId + "/contacts/" + contactId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      groups = [];
      if (data["groups"] != null)  {
        groups = Object.values(data["groups"]);
      }
      res.send({
        success: true,
        responseCode: 200,
        message: "Contact details found successfully",
        data: {contact_details: {
          id: data["id"],
          firstName: data["firstName"],
          lastName: data["lastName"],
          email: data["email"],
          language: data["language"],
          phone: data["phone"],
          groups: groups
        }}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "No data available",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: error,
      data: {}
    });
  });
});

app.get("/getContacts", (req, res, next) => {
  const userId = req.query.userId;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      contacts = Object.values(data["contacts"]);
      for (var i = 0; i < contacts.length; i++) {
        if (contacts[i]["groups"] != null) {
          contacts[i]["groups"] = Object.values(contacts[i]["groups"]);
        }
      }

      res.send({
        success: true,
        responseCode: 200,
        message: "Contacts found successfully",
        data: {contacts: contacts}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "No data available",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: error,
      data: {}
    });
  });
});

app.get("/getGroups", (req, res, next) => {
  const userId = req.query.userId;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      groups = Object.values(data["groups"]);
      for (var i = 0; i < groups.length; i++) {
        groups[i]["members"] = Object.values(groups[i]["members"]);

      }
      res.send({
        success: true,
        responseCode: 200,
        message: "Groups found successfully",
        data: {groups: groups}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "No data available",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: error,
      data: {}
    });
  });
});

// app.get("/getGroups", (req, res, next) => {
//   const userId = req.query.userId;
//   rootRef.ref().child("users/" + userId).get().then((snapshot) => {
//     if (snapshot.exists()) {
//       res.statusCode = 200;
//       data = snapshot.val();
//       groups = Object.values(data["groups"]);

//       var memberDetails = {};
//       const promises = [];


//       for (var i = 0; i < groups.length; i++) {
//         const members = Object.values(groups[i]["members"]);
//         groups[i]["members"] = members
//         var groupId = groups[i]["id"];


//         //
     

//         for (var j = 0; j < members.length; j++) {
//           let promise = rootRef.ref().child("users/" + userId + "/contacts/" + members[j]).get()
//           .then(snapshot2 => {
//             if (snapshot2.empty) {
//              res.statusCode = 400;
//              res.send({
//               success: false,
//               responseCode: 400,
//               message: error,
//               data: {}
//             });
//            }

//            data2 = snapshot2.val();
//            details = {
//             id: data2["id"],
//             firstName: data2["firstName"],
//             lastName: data2["lastName"],
//             email: data2["email"],
//             language: data2["language"],
//             phone: data2["phone"],
//           };
//           if (groupId in memberDetails) {
//             memberDetails[groupId].push(details);
//           } else {
//             memberDetails[groupId] = [];
//             memberDetails[groupId].push(details);
//           }
//           return;
//         })
//           .catch(err => {
//             console.log('Error getting documents', err);
//           });
//           promises.push(promise);
//         }
        
//         console.log(memberDetails);

//         data["groups"][groupId]["members"] = memberDetails[groupId];
//         //

//       }
      
//         Promise.all(promises).then(() => {
//           res.send({
//             success: true,
//             responseCode: 200,
//             message: "Groups found successfully",
//             data: {groups: Object.values(data["groups"])}
//           });
//         }).catch(err => {
//           response.status(500);
//         });

//     } else {
//       res.statusCode = 200;
//       res.send({
//         success: false,
//         responseCode: 200,
//         message: "No data available",
//         data: {}
//       });
//     }
//   }).catch((error) => {
//      console.log(error);
//     res.statusCode = 400;
//     res.send({
//       success: false,
//       responseCode: 400,
//       message: error,
//       data: {}
//     });
//   });
// });

app.get("/getGroupDetails", (req, res, next) => {
  const userId = req.query.userId;
  const groupId = req.query.groupId;
  rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      members = Object.values(data["members"]);
      memberDetails = [];

      var memberDetails = [];
      const promises = [];

      for (var i = 0; i < members.length; i++) {
        let promise = rootRef.ref().child("users/" + userId + "/contacts/" + members[i]).get()
        .then(snapshot2 => {
          if (snapshot2.empty) {
           res.statusCode = 400;
           res.send({
            success: false,
            responseCode: 400,
            message: error,
            data: {}
          });
         }

         data2 = snapshot2.val();
         details = {
          id: data2["id"],
          firstName: data2["firstName"],
          lastName: data2["lastName"],
          email: data2["email"],
          language: data2["language"],
          phone: data2["phone"],
        };
        memberDetails.push(details);
        return;
      })
        .catch(err => {
          console.log('Error getting documents', err);
        });
        promises.push(promise);
      }
      data["members"] = memberDetails;
      Promise.all(promises).then(() => {
        res.send({
          success: true,
          responseCode: 200,
          message: "Group details found successfully",
          data: {group_details: data}
        });
      }).catch(err => {
        response.status(500);
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "No data available",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: error,
      data: {}
    });
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
        res.send({
          success: true,
          responseCode: 200,
          message: "Remaining contacts found successfully",
          data: {remaining_contacts: Object.values(result)}
        });
      })
    } else {
      res.send({
        success: false,
        responseCode: 200,
        message: "No data available",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: error,
      data: {}
    });
  });
});

app.post("/createUserProfile", (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName =  req.body.lastName;
  const phone = req.body.phone;
  const countryCode = req.body.countryCode;
  const email = req.body.email;
  const agencyName = req.body.agencyName;
  const password = req.body.password;
  const pushRef = rootRef.ref("users/").push();
  pushRef.set({
    id: pushRef.key,
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    countryCode: countryCode,
    email: email,
    agencyName: agencyName,
    password: password,
    contacts: null
  }, (error) => {
    if (error) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: error,
        data: {}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: true,
        responseCode: 200,
        message: 'User created successfully',
        data: {}
      });
    }
  });
});

app.post("/createContact", (req, res, next) => {
  const userId = req.body.userId;
  const firstName = req.body.firstName;
  const lastName =  req.body.lastName;
  const phone = req.body.phone;
  const countryCode = req.body.countryCode;
  const email = req.body.email;
  const language = req.body.language;
  const description = req.body.description;
  const pushRef = rootRef.ref("users/" + userId + "/contacts").push();
  pushRef.set({
    id: pushRef.key,
    firstName: firstName,
    lastName: lastName,
    phone: phone,
    countryCode: countryCode,
    email: email,
    language: language,
    groups: null,
    description: description
  }, (error) => {
    if (error) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: error,
        data: {}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: true,
        responseCode: 200,
        message: 'Contact created successfully',
        data: {}
      });
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
      res.send({
        success: false,
        responseCode: 400,
        message: error,
        data: {}
      });
    } else {
      members.forEach(function (contactId, index) {
        const pushRef = rootRef.ref("users/" + userId + "/contacts/" + contactId + "/groups").push();
        const key = pushRef.key;
        pushRef.set(groupRef.key);
      });

      res.statusCode = 200;
      res.send({
        success: true,
        responseCode: 200,
        message: 'Group created successfully',
        data: {}
      });
    }
  });
});

app.post("/updateUserProfile", (req, res, next) => {
  const userId = req.body.userId;
  const newFirstName = req.body.newFirstName;
  const newLastName = req.body.newLastName;
  const newAgencyName = req.body.newAgencyName;
  const newEmail = req.body.newEmail;
  const newPhone = req.body.newPhone;
  const newCountryCode = req.body.newCountryCode;
  const ref = rootRef.ref("users/" + userId);
  const updates = {};
  if (newFirstName != null) {
    updates["firstName"] = newFirstName;
  }
  if (newlastName != null) {
    updates["lastName"] = newLastName;
  }
  if (newPhone != null) {
    updates["phone"] = newPhone;
  }
  if (newCountryCode != null) {
    updates["countryCode"] = newCountryCode;
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
      res.send({
        success: false,
        responseCode: 400,
        message: error,
        data: {}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: true,
        responseCode: 200,
        message: 'User profile updated successfully',
        data: {}
      });
    }
  });
});

app.post("/editContact", (req, res, next) => {
  const userId = req.body.userId;
  const contactId = req.body.contactId;
  const newFirstName = req.body.newFirstName;
  const newLastName = req.body.newLastName;
  const newPhone = req.body.newPhone;
  const newEmail = req.body.newEmail;
  const newLanguage = req.body.newLanguage;
  const newDescription = req.body.newDescription;
  const newCountryCode = req.body.newCountryCode;
  const ref = rootRef.ref("users/" + userId + "/contacts/" + contactId);
  const updates = {};
  if (newFirstName != null) {
    updates["firstName"] = newFirstName;
  }
  if (newlastName != null) {
    updates["lastName"] = newLastName;
  }
  if (newPhone != null) {
    updates["phone"] = newPhone;
  }
  if (newCountryCode != null) {
    updates["countryCode"] = newCountryCode;
  }
  if (newEmail != null) {
    updates["email"] = newEmail;
  }
  if (newLanguage != null) {
    updates["language"] = newLanguage;
  }
  if (newDescription != null) {
    updates["description"] = newDescription;
  }
  ref.update(updates, (error) => {
    if (error) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: error,
        data: {}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: true,
        responseCode: 200,
        message: 'Contact updated successfully',
        data: {}
      });
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
      res.send({
        success: false,
        responseCode: 400,
        message: error,
        data: {}
      });
    } else {
      res.statusCode = 200;
      res.send({
        success: true,
        responseCode: 200,
        message: 'Group updated successfully',
        data: {}
      });
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
         res.send({
          success: false,
          responseCode: 400,
          message: error,
          data: {}
        });
       } else {
         res.statusCode = 200;
         res.send({
          success: true,
          responseCode: 200,
          message: 'Added to group successfully',
          data: {}
        });
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
          res.send({
            success: false,
            responseCode: 400,
            message: error,
            data: {}
          });
        } else {
          res.statusCode = 200;
          res.send({
            success: true,
            responseCode: 200,
            message: 'Removed from group successfully',
            data: {}
          });
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
                res.send({
                  success: false,
                  responseCode: 400,
                  message: "OTP could not be created: " + error,
                  data: {}
                });
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
                res.statusCode = 200;
                res.send({
                  success: true,
                  responseCode: 200,
                  message: 'OTP sent successfully',
                  data: {}
                });

              } else {
                res.statusCode = 400;
                res.send({
                  success: false,
                  responseCode: 400,
                  message: "OTP was not sent",
                  data: {}
                });
              }
            }).catch((error) => {
              res.statusCode = 400;
              res.send({
                success: false,
                responseCode: 400,
                message: "OTP was not sent: " + error,
                data: {}
              });
            });
          } else {
            res.statusCode = 400;
            res.send({
              success: false,
              responseCode: 400,
              message: "Incorrect email",
              data: {}
            });
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
             res.send({
              success: true,
              responseCode: 200,
              message: 'OTP verified successfully',
              data: {}
            });
           } else {
             res.statusCode = 200;
             res.send({
              success: false,
              responseCode: 200,
              message: "Incorrect OTP",
              data: {}
            });
           }
         } else {
          res.statusCode = 200;
          res.send({
            success: false,
            responseCode: 200,
            message: "Incorrect email",
            data: {}
          });
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
            res.send({
              success: false,
              responseCode: 400,
              message: "Password not updated: " + error,
              data: {}
            });
          } else {
           res.statusCode = 200;
           res.send({
            success: true,
            responseCode: 200,
            message: 'Password updated successfully',
            data: {}
          });
         }
       });
      } else {
        res.statusCode = 200;
        res.send({
          success: false,
          responseCode: 200,
          message: "Incorrect email",
          data: {}
        });
      }

    });
  });
});



//Server
app.listen(process.env.PORT || 8000, function() {
  console.log("API started");
});