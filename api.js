const express = require("express");
const app = express();
const bodyParser = require('body-parser');
var nodemailer = require('nodemailer');
const { google } = require("googleapis");
const OAuth2 = google.auth.OAuth2;
const jwt = require('jsonwebtoken');


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

var firebase = require('firebase');
require('firebase/storage');

var config = {
  apiKey: "AIzaSyCejVflI0Fdx3A2VGAApbqKTxi6ACL3I_s",
  authDomain: "glome-2bc31.firebaseapp.com",
  databaseURL: "https://glome-2bc31-default-rtdb.firebaseio.com",
  projectId: "glome-2bc31",
  storageBucket: "glome-2bc31.appspot.com",
  messagingSenderId: "257542518832",
  appId: "1:257542518832:web:a44df9d9c749c68802d5f5"
};

firebase.initializeApp(config);

var rootRef = firebase.database();

var admin = require("firebase-admin");

var serviceAccount = require("./glome-327503-2124843b063d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'glome-327503.appspot.com'
});

const bucket = admin.storage().bucket('glome-327503.appspot.com');


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
            data: { user_profile_details: {
              id: data["id"],
              firstName: data["firstName"],
              lastName: data["lastName"],
              email: data["email"],
              agencyName: data["agencyName"],
              phone: data["phone"],
              countryCode: data["countryCode"],
              authToken: authToken
            }}
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
res.statusCode = 200;
res.send({
  success: false,
  responseCode: 200,
  message: "Incorrect email",
  data: {}
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
        const file = bucket.file(userId + '.png');
        file
          .exists()
          .then((exists) => {
              if (exists[0]) {
                file.getSignedUrl({
                  action: 'read',
                  expires: '03-09-2491'
                }).then(signedUrls => {
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
                    phone: data["phone"],
                    countryCode: data["countryCode"],
                    profilePic: signedUrls[0]
                  }}
                });
               }).catch((error) => {
                res.statusCode = 400;
                res.send({
                  success: false,
                  responseCode: 400,
                  message: "Profile details not found: " + error,
                  data: {}
                });
              });
            } else {
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
                    phone: data["phone"],
                    countryCode: data["countryCode"]
                  }}
                });
            }
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
      message: "User does not exist",
      data: {}
    });
  }
}).catch((error) => {
  res.statusCode = 400;
  res.send({
    success: false,
    responseCode: 400,
    message: "Profile details not found: " + error,
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

      var groupDetails = [];
      const promises = [];

      for (var i = 0; i < groups.length; i++) {
        let promise = rootRef.ref().child("users/" + userId + "/groups/" + groups[i]).get()
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
          name: data2["name"],
        };
        groupDetails.push(details);
        return;
      })
        .catch(err => {
          console.log('Error getting documents', err);
        });
        promises.push(promise);
      }
      Promise.all(promises).then(() => {
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
            countryCode: data["countryCode"],
            description: data["description"],
            groups: groupDetails,
          }}
        });
      }).catch(err => {
        response.status(500);
      });

    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "User or contact do not exist",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Contact details not found: " + error,
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
      if ("contacts" in data) {
        contacts = Object.values(data["contacts"]);
      } else {
        contacts = [];
      }
      for (var i = 0; i < contacts.length; i++) {
        if (contacts[i]["groups"] != null) {
          contacts[i]["groups"] = Object.values(contacts[i]["groups"]);
        } else {
          contacts[i]["groups"] = [];
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
        message: "User does not exist",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Contacts not found: " + error,
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
      if ("groups" in data) {
        groups = Object.values(data["groups"]);
      } else {
        groups = [];
      }
      for (var i = 0; i < groups.length; i++) {
        if ("members" in groups[i]) {
          var members = Object.values(groups[i]["members"]);  
          groups[i]["members"] = [];
          for (var j = 0; j < members.length; j++) {
           var m = data["contacts"][members[j]];
           m["groups"] = Object.values(m["groups"]);
           groups[i]["members"].push(m);
         }
       } 
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
      message: "User does not exist",
      data: {}
    });
  }
}).catch((error) => {
  res.statusCode = 400;
  res.send({
    success: false,
    responseCode: 400,
    message: "Groups not found: " + error,
    data: {}
  });
});
});


app.get("/getGroupDetails", (req, res, next) => {
  const userId = req.query.userId;
  const groupId = req.query.groupId;
  rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();
      if ("members" in data) {
        members = Object.values(data["members"]);
      } else {
        members = [];
      }

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
          countryCode: data2["countryCode"],
          description: data2["description"],
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
        message: "User or group does not exist",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Group details not found: " + error,
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
      if ("members" in data) {
        members = Object.values(data["members"]);
      } else {
        members = [];
      }
      const result = {};
      rootRef.ref().child("users/" + userId + "/contacts").get().then((snapshot) => {
        contacts = snapshot.val();
        Object.keys(contacts).forEach(function(key) {
          if (members.indexOf(key) < 0) {
            result[key] = contacts[key];
            if ("groups" in result[key]) {
              result[key]["groups"] = Object.values(result[key]["groups"]);
            } else {
              result[key]["groups"] = [];
            }
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
        message: "User or group does not exist",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Contacts not found: " + error,
      data: {}
    });
  });
});

app.post("/createUserProfile", (req, res, next) => {
  const firstName = req.body.firstName;
  const lastName =  req.body.lastName;
  const email = req.body.email;
  const agencyName = req.body.agencyName;
  const password = req.body.password;
  const pushRef = rootRef.ref("users/").push();

  rootRef.ref().get().then((snapshot) => {
    if (snapshot.exists()) {
      var error = false;
      rootData = snapshot.val();


      const accountSid = rootData["twilio"]["accountSid"];
      const authToken = rootData["twilio"]["authToken"];
      const client = require('twilio')(accountSid, authToken); 

      client.availablePhoneNumbers('US')
      .local
      .list({limit: 1})
      .then(local => local.forEach(l => {
        const countryCode = "+1";
        // const phone = l["phoneNumber"].replace("+1","");

        // Provision a phone number
        // client.incomingPhoneNumbers
        // .create({phoneNumber: l["phoneNumber"]})
        // .then(incoming_phone_number => console.log(incoming_phone_number.sid));

        var phone = "3185088756";

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
              message: "User profile not created: " + error,
              data: {}
            });
          } else {
           rootRef.ref().child("users/" + pushRef.key).get().then((snapshot) => {
            if (snapshot.exists()) {
              data = snapshot.val();
              res.statusCode = 200;
              res.send({
                success: true,
                responseCode: 200,
                message: 'User profile created successfully',
                data: { user_profile_details: {
                  id: data["id"],
                  firstName: data["firstName"],
                  lastName: data["lastName"],
                  email: data["email"],
                  agencyName: data["agencyName"],
                  phone: data["phone"],
                  countryCode: data["countryCode"]
                }}
              });
            }
          })
         }
       });
}));

} else {
  res.statusCode = 200;
  res.send({
    success: false,
    responseCode: 200,
    message: "Data could not be found",
    data: {}
  });
}
}).catch((error) => {
  res.statusCode = 400;
  res.send({
    success: false,
    responseCode: 400,
    message: "Message could not be sent: " + error,
    data: {}
  });
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
  
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {
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
            message: "Contact not created: " + error,
            data: {}
          });
        } else {
          rootRef.ref().child("users/" + userId + "/contacts/" + pushRef.key).get().then((snapshot) => {
            if (snapshot.exists()) {
              res.statusCode = 200;
              data = snapshot.val();
              res.send({
                success: true,
                responseCode: 200,
                message: 'Contact created successfully',
                data: {contact_details: {
                  id: data["id"],
                  firstName: data["firstName"],
                  lastName: data["lastName"],
                  email: data["email"],
                  language: data["language"],
                  phone: data["phone"],
                  countryCode: data["countryCode"],
                  description: data["description"],
                  groups: [],
                }}
              });
            }
          })
        }
      });
}
})
});

app.post("/createGroup", (req, res, next) => {
  const userId = req.body.userId;
  const name = req.body.name;
  const members = req.body.members;
  
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {

      const groupRef = rootRef.ref("users/" + userId + "/groups").push();
      const membersObj = {};
      members.forEach(function (contactId, index) {
        membersObj[contactId] = contactId;
      });
      const groupKey = groupRef.key;
      groupRef.set({
        id: groupKey,
        name: name,
      }, (error) => {
        if (error) {
          res.statusCode = 400;
          res.send({
            success: false,
            responseCode: 400,
            message: "Group not created: " + error,
            data: {}
          });
        } else {
          members.forEach(function (contactId, index) {
            rootRef.ref().child("users/" + userId + "/contacts/" + contactId).get().then((snapshot) => {
              var shouldAdd = true;
              if (!snapshot.exists()) {

                shouldAdd = false;
              } 

              if (shouldAdd) {
                const pushRef = rootRef.ref().child("users/" + userId + "/contacts/" + contactId + "/groups");
                const key = pushRef.key;
                const obj = {};
                obj[groupKey] = groupKey;
                pushRef.update(obj);

                const groupRef = rootRef.ref().child("users/" + userId + "/groups/" + groupKey + "/members");
                const contacttObj = {};
                contacttObj[contactId] = contactId;
                groupRef.update(contacttObj, (error) => {
                  if (error) {
                    res.statusCode = 400;
                    res.send({
                      success: false,
                      responseCode: 400,
                      message: "Contact could not be added to group: " + error,
                      data: {}
                    });
                  } 
                })
              }

            })    

});
res.statusCode = 200;
var message = 'Group created successfully.';
res.send({
  success: true,
  responseCode: 200,
  message: message,
  data: {group_details: {
    id: groupKey,
    name: name,
    members: members
  }}
});  
}
});
}
})
});

app.post("/updateUserProfile", (req, res, next) => {
  const userId = req.body.userId;
  const newFirstName = req.body.newFirstName;
  const newLastName = req.body.newLastName;
  const newAgencyName = req.body.newAgencyName;
  const newEmail = req.body.newEmail;
  const newPhone = req.body.newPhone;
  const newCountryCode = req.body.newCountryCode;
  const newProfilePic = req.body.newProfilePic;

  const ref = rootRef.ref("users/" + userId);
  ref.get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {
      const updates = {};
      if (newFirstName != null) {
        updates["firstName"] = newFirstName;
      }
      if (newLastName != null) {
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
            message: "User profile not updated: " + error,
            data: {}
          });
        } else {
          if (newProfilePic != null) {
            async function uploadFile() {
              await bucket.upload(newProfilePic, {
                destination: userId + ".png",
              });
            }

            uploadFile().then(() => {
             const file = bucket.file(userId + '.png');
             file.getSignedUrl({
              action: 'read',
              expires: '03-09-2491'
            }).then(signedUrls => {
              rootRef.ref().child("users/" + userId).get().then((snapshot) => {
                if (snapshot.exists()) {
                  data = snapshot.val();
                  res.statusCode = 200;
                  res.send({
                    success: true,
                    responseCode: 200,
                    message: 'User profile updated successfully',
                    data: { user_profile_details: {
                      id: data["id"],
                      firstName: data["firstName"],
                      lastName: data["lastName"],
                      email: data["email"],
                      agencyName: data["agencyName"],
                      phone: data["phone"],
                      countryCode: data["countryCode"],
                      profilePic: signedUrls[0]
                    }}
                  });
                }
              });
            });
          });
}
}
});
}
})
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

  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {
      const ref = rootRef.ref("users/" + userId + "/contacts/" + contactId);
      ref.once('value', function(snapshot) {
        if (snapshot.exists()) {
          const updates = {};
          if (newFirstName != null) {
            updates["firstName"] = newFirstName;
          }
          if (newLastName != null) {
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
                message: "Contact not updatetd: " + error,
                data: {}
              });
            } else {
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
                    message: 'Contact updated successfully',
                    data: {contact_details: {
                      id: data["id"],
                      firstName: data["firstName"],
                      lastName: data["lastName"],
                      email: data["email"],
                      language: data["language"],
                      phone: data["phone"],
                      countryCode: data["countryCode"],
                      description: data["description"],
                      groups: groups,
                    }}
                  });
                }
              })
}
});
} else {
  res.send({
    success: false,
    responseCode: 400,
    message: "Contact does not exist",
    data: {}
  });
}
});
}
})
});

app.post("/editGroupName", (req, res, next) => {
  const userId = req.body.userId;
  const groupId = req.body.groupId;
  const newName = req.body.newName;
  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {
      const ref = rootRef.ref("users/" + userId + "/groups/" + groupId);
      ref.once('value', function(snapshot) {
        if (snapshot.exists()) {
          ref.update({name: newName}, (error) => {
            if (error) {
              res.statusCode = 400;
              res.send({
                success: false,
                responseCode: 400,
                message: "Group not updated: " + error,
                data: {}
              });
            } else {
              rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
                if (snapshot.exists()) {
                  res.statusCode = 200;
                  data = snapshot.val();
                  if ("members" in data) {
                    data["members"] = Object.values(data["members"]);
                  } else {
                    data["members"] = [];
                  }

                  res.send({
                    success: true,
                    responseCode: 200,
                    message: 'Group updated successfully',
                    data: {group_details: data}
                  });

                } else {
                  res.statusCode = 200;
                  res.send({
                    success: false,
                    responseCode: 200,
                    message: "User or group does not exist",
                    data: {}
                  });
                }
              })
            }
          });
} else {
  res.send({
    success: false,
    responseCode: 400,
    message: "Group does not exist",
    data: {}
  });
}
});
}
});
});

app.post("/addToGroup", (req, res, next) => {
  const userId = req.body.userId;
  const groupId = req.body.groupId;
  const contactIds = req.body.contactIds;

  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {
      const ref = rootRef.ref("users/" + userId + "/groups/" + groupId);
      ref.once('value', function(snapshot) {
        if (snapshot.exists()) {
          // Group exists
          const ref = rootRef.ref("users/" + userId + "/groups/" + groupId + "/members");

          contactIds.forEach(function (contactId, index) {
            const ref2 = rootRef.ref("users/" + userId + "/contacts/" + contactId);
            ref2.once('value', function(snapshot) {
              if (snapshot.exists()) {

                ref.child(contactId).set(contactId, (error) => {
                  if (error) {
                    res.statusCode = 400;
                    res.send({
                      success: false,
                      responseCode: 400,
                      message: "Contact could not be added to group: " + error,
                      data: {}
                    });

                  } else {
                    const ref2 = rootRef.ref("users/" + userId + "/contacts/" + contactId + "/groups");
                    ref2.child(groupId).set(groupId, (error) => {
                      if (error) {
                       res.statusCode = 400;
                       res.send({
                        success: false,
                        responseCode: 400,
                        message: "Contact could not be added to group: " + error,
                        data: {}
                      });
                     } 
                   });
                  }
                });
              }
            });
});

rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
  if (snapshot.exists()) {
    res.statusCode = 200;
    data = snapshot.val();
    if ("members" in data) {
      data["members"] = Object.values(data["members"]).concat(contactIds);
    } else {
      data["members"] = contactIds;
    }

    res.send({
      success: true,
      responseCode: 200,
      message: 'Added to group successfully',
      data: {group_details: data}
    });

  } else {
    res.statusCode = 200;
    res.send({
      success: false,
      responseCode: 200,
      message: "User or group does not exist",
      data: {}
    });
  }
})



} else {
  res.send({
    success: false,
    responseCode: 400,
    message: "Group does not exist",
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

  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (!snapshot.exists()) {
      res.statusCode = 400;
      res.send({
        success: false,
        responseCode: 400,
        message: "User does not exist",
        data: {}
      });
    } else {
      const ref = rootRef.ref("users/" + userId + "/groups/" + groupId);
      ref.once('value', function(snapshot) {
        if (snapshot.exists()) {
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
                    message: "Contact could not be removed from group: " + error,
                    data: {}
                  });
                } else {
                  rootRef.ref().child("users/" + userId + "/groups/" + groupId).get().then((snapshot) => {
                    if (snapshot.exists()) {
                      res.statusCode = 200;
                      data = snapshot.val();
                      if ("members" in data) {
                        data["members"] = Object.values(data["members"]);
                      } else {
                        data["members"] = [];
                      }

                      res.send({
                        success: true,
                        responseCode: 200,
                        message: 'Removed from group successfully',
                        data: {group_details: data}
                      });
                      
                    } else {
                      res.statusCode = 200;
                      res.send({
                        success: false,
                        responseCode: 200,
                        message: "User or group does not exist",
                        data: {}
                      });
                    }
                  })
}
});
}
});
} else {
  res.send({
    success: false,
    responseCode: 400,
    message: "Group does not exist",
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

  firebase.database().ref().child("users").orderByChild("email").equalTo(email).once("value",snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const userId = Object.values(data)[0]["id"];
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
                var data = snapshot.val();

                var clientId = data["clientId"];
                var clientSecret = data["clientSecret"];
                var refreshToken = data["refreshToken"];

                const oauth2Client = new OAuth2(
                   clientId, // ClientID
                   clientSecret, // Client Secret
                   "https://developers.google.com/oauthplayground" // Redirect URL
                   );
                oauth2Client.setCredentials({
                 refresh_token: refreshToken
               });
                const accessToken = oauth2Client.getAccessToken()

                var transporter = nodemailer.createTransport({
                  service: 'gmail',
                  auth: {
                    type: "OAuth2",
                    user: 'glomeapp@gmail.com',
                    clientId: clientId,
                    clientSecret: clientSecret,
                    refreshToken: refreshToken,
                    accessToken: accessToken
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
                    res.statusCode = 200;
                    res.send({
                      success: true,
                      responseCode: 200,
                      message: 'OTP sent successfully',
                      data: {}
                    });
                  }
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
         } 
       });
    res.statusCode = 200;
    res.send({
      success: false,
      responseCode: 200,
      message: "Incorrect email",
      data: {}
    });
  });
});

app.post("/saveNewPassword", (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;

  firebase.database().ref().child("users").orderByChild("email").equalTo(email).once("value",snapshot => {
    if (snapshot.exists()) {
      const data = snapshot.val();

      const userId = Object.values(data)[0]["id"];
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

app.get("/getTemplateMessageList", (req, res, next) => {
  rootRef.ref().child("templateMessages").get().then((snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      const finalData = [];
      for (let d in data) {
        finalData.push({id: d, message: data[d]["English"]})
      }
      res.send({
        success: true,
        responseCode: 200,
        message: "Template messages found",
        data: {"template_messages" : finalData}
      });
    } 
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Template messages not found: " + error,
      data: {}
    });
  });
});

app.post("/getTemplateMessageTranslationsForUsers", (req, res, next) => {
  const userId = req.body.userId;
  const messageTemplateId = req.body.messageTemplateId;
  const contactIds = req.body.contactIds;

  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();

      var agencyName = data["agencyName"];

      var translatedMessages = [];

      rootRef.ref().child("templateMessages").get().then((snapshot) => {
        if (snapshot.exists()) {
          const data2 = snapshot.val();

          for (var i = 0; i < contactIds.length; i++) {
            var contactId = contactIds[i];
            if (contactId in data["contacts"]) {
              var language = data["contacts"][contactId]["language"];

              var translationFound = false;

              if ("edited" in data2) {
                if (agencyName in data2["edited"]) {
                  if (messageTemplateId in data2["edited"][agencyName]) {

                    if (language in data2["edited"][agencyName][messageTemplateId]) {
                      translatedMessages.push({"contactId": contactId, "message": data2["edited"][agencyName][messageTemplateId][language], "language": language});
                      translationFound = true;
                    }
                  } 
                } 
              }

              if (!translationFound) {
                translatedMessages.push({"contactId": contactId, "message": data2[messageTemplateId][language], "language": language});
              }
            }
          }

          res.send({
            success: true,
            responseCode: 200,
            message: "Template message translation found",
            data: {"message_translation": translatedMessages}
          });
        } 
      }).catch((error) => {
        res.statusCode = 400;
        res.send({
          success: false,
          responseCode: 400,
          message: "Template message translation not found: " + error,
          data: {}
        });
      });

    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "User does not exist",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Contact details not found: " + error,
      data: {}
    });
  });
});

app.post("/sendMessages", (req, res, next) => {
  const userId = req.body.userId;
  const messages = req.body.messages;
  const contactIds = req.body.contactIds;

  rootRef.ref().get().then((snapshot) => {
    if (snapshot.exists()) {
      var error = false;
      rootData = snapshot.val();
      if ("users" in rootData) {
        if (userId in rootData["users"]) {
          res.statusCode = 200;
          data = rootData["users"][userId];

          const accountSid = rootData["twilio"]["accountSid"];
          const authToken = rootData["twilio"]["authToken"];
          const client = require('twilio')(accountSid, authToken); 

          for (var i = 0; i < contactIds.length; i++) {
            var contactId = contactIds[i];
            if ("contacts" in rootData["users"][userId]) {
              if (contactId in rootData["users"][userId]["contacts"]) {
                var contactData = rootData["users"][userId]["contacts"][contactId];
                var phone = contactData["countryCode"] + contactData["phone"];
                client.messages 
                .create({         
                 to: phone,
                 body: messages[i],
                 from: data["countryCode"] + data["phone"]
               }) 
              }
            }
          }
          res.statusCode = 200;
              res.send({
                success: true,
                responseCode: 200,
                message: "Messages sent successfully",
                data: {}
              });

         //  client.messages 
         //  .create({         
         //   to: countryCode + phone,
         //   body: message,
         //   from: data["countryCode"] + data["phone"]
         // }) 
         //  .then(message => {
         //    if (message["errorMessage"] == null) {
         //      res.statusCode = 200;
         //      res.send({
         //        success: true,
         //        responseCode: 200,
         //        message: "Message sent successfully",
         //        data: {}
         //      });
         //    } else {
         //      res.statusCode = 200;
         //      res.send({
         //        success: false,
         //        responseCode: 200,
         //        message: "Message could not be sent: " + message["errorMessage"],
         //        data: {}
         //      });
         //    }
         //  }) 
         //  .done();
        } else {
          error = true;
        }
      } else {
        error = true;
      }

      if (error) {
        res.statusCode = 200;
        res.send({
          success: false,
          responseCode: 200,
          message: "User does not exist",
          data: {}
        });
      }

    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "Data could not be found",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Message could not be sent: " + error,
      data: {}
    });
  });

});

app.get("/viewChatHistory", (req, res, next) => {
  const userId = req.query.userId;
  const contactId = req.query.contactId;

  rootRef.ref().get().then((snapshot) => {
    if (snapshot.exists()) {
      rootData = snapshot.val();
      var error = false;

      if ("users" in rootData) {
        if (userId in rootData["users"]) {
          var data = rootData["users"][userId];
          var userPhone =  data["countryCode"] + data["phone"];
          var contactPhone;
          if ("contacts" in data) {
            if (contactId in data["contacts"]) {
              contactPhone = data["contacts"][contactId]["countryCode"] + data["contacts"][contactId]["phone"];
            } else {
              res.statusCode = 200;
              res.send({
                success: false,
                responseCode: 200,
                message: "Contact does not exist",
                data: {}
              });
            }
          } else {
           res.statusCode = 200;
           res.send({
            success: false,
            responseCode: 200,
            message: "Contact does not exist",
            data: {}
          });
         }


         const accountSid = rootData["twilio"]["accountSid"];
         const authToken = rootData["twilio"]["authToken"];
         const client = require('twilio')(accountSid, authToken); 
         var messagesToReturn = [];

         client.messages.list()
         .then(messages => {
          messages.forEach(m => {
            if ((m["to"] == userPhone && m["from"] == contactPhone) || (m["to"] == contactPhone && m["from"] == userPhone)) {
              messagesToReturn.push({
                "body": m["body"],
                "from": m["from"],
                "to": m["to"],
                "date": m["dateSent"]
              });
            }
          });
          res.statusCode = 200;
          res.send({
            success: true,
            responseCode: 200,
            message: "Chat history found",
            data: {messagesToReturn}
          });
        });

       } else {
        error = true;
      } 
    } else {
      error = true;
    }

    if (error) {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "User does not exist",
        data: {}
      });
    }

  } else {
    res.statusCode = 200;
    res.send({
      success: false,
      responseCode: 200,
      message: "Data could not be found",
      data: {}
    });
  }
}).catch((error) => {
  res.statusCode = 400;
  res.send({
    success: false,
    responseCode: 400,
    message: "Chat history could not be found: " + error,
    data: {}
  });
});

});

app.post("/editTemplateMessageTranslation", (req, res, next) => {
  const userId = req.body.userId;
  const messageTemplateId = req.body.messageTemplateId;
  const editedMessage = req.body.editedMessage;
  const language = req.body.language;

  rootRef.ref().child("users/" + userId).get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();

      var agencyName = data["agencyName"];

      const ref = rootRef.ref("templateMessages/edited/" + agencyName + "/" + messageTemplateId);
      ref.child(language).set(editedMessage, (error) => {
        if (error) {
          res.statusCode = 400;
          res.send({
            success: false,
            responseCode: 400,
            message: "Message could not be updated: " + error,
            data: {}
          });
        } else {
         res.statusCode = 200;
         res.send({
          success: true,
          responseCode: 200,
          message: "Message updated",
          data: {"edited_message": editedMessage}
        });
       }
     });

    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "User does not exist",
        data: {}
      });
    }
  }).catch((error) => {
    res.statusCode = 400;
    res.send({
      success: false,
      responseCode: 400,
      message: "Message could not be updated: " + error,
      data: {}
    });
  });
});

app.post("/getCustomMessageTranslationsForUsers", (req, res, next) => {
  const userId = req.body.userId;
  const message = req.body.message;
  const contactIds = req.body.contactIds;

  const translate = require("translate");

  translate.engine = "google";
  translate.key = process.env.DEEPL_KEY;

  const unsupportedLanguages = ["Dari", "Tigrinya"];

  async function translateText(message, languages) {
    var translations = [];
    for (var i = 0; i < languages.length; i++) {
      var language = languages[i]["language"];
      if (language == "Mandarin") {
        language = "Chinese";
      }
      var text = '';
      if (unsupportedLanguages.includes(language)) {
        text = "Custom translations are not supported for " + language;
      } else {      
        text = await translate(message, language);
      }
      languages[i]["message"] = text;
      translations.push(languages[i]);
    };
    return translations;
  }

  rootRef.ref().child("users/" + userId + "/contacts").get().then((snapshot) => {
    if (snapshot.exists()) {
      res.statusCode = 200;
      data = snapshot.val();

      var languages = [];

      for (var i = 0; i < contactIds.length; i++) {
        var contactId = contactIds[i];
        if (contactId in data) {
          languages.push({"contactId": contactId, "language": data[contactId]["language"]});
        }
      }
      
      var translation = translateText(message, languages);
      translation.then(value => {
        res.statusCode = 200;
        res.send({
          success: true,
          responseCode: 200,
          message: "Message was translated",
          data: {"message_translation": value}
        });
      }).catch(err => {
        res.status(500);
      });
      
    } else {
      res.statusCode = 200;
      res.send({
        success: false,
        responseCode: 200,
        message: "User does not exist",
        data: {}
      });
    }
  });

});

// app.post("/saveTemplateMessages", (req, res, next) => {

//   var messages = [];
//   var messagesObj = {};

//   const xlsxFile = require('read-excel-file/node');
//   var uuid = require('uuid');

//   xlsxFile('./messages.xlsx').then((rows) => {
//    for (var i = 0; i < rows.length; i++) {
//     var row = rows[i];
//       for (var j = 1; j < row.length; j++) {
//         if (messages.length < j) {
//           messages.push({});
//         }
//         messages[j-1][row[0]] = row[j];
//       }
//    }
//    for (var i = 0; i < messages.length; i++) {
//     messagesObj[uuid.v4()] = messages[i];
//    }
//    //console.log(messages);
//    rootRef.ref('templateMessages').set(
//        messagesObj
//     );
//   })
// });

const MessagingResponse = require('twilio').twiml.MessagingResponse;

app.post('/sms', (req, res) => {
  res.writeHead(200, {'Content-Type': 'text/xml'});
});




//Server
app.listen(process.env.PORT || 8000, function() {
  console.log("API started");
});