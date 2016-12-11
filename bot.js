var names = ["LOSER","FAILING","LYING","CROOKED","LOW-ENERGY","LITTLE","FRAUD","TOTALLY BIASED", "NASTY"];
var endings = ["SAD!", "DISGUSTING!", "MISTAKE!", "WRONG!","NO MORE!", "TERRIBLE!", "SHAME!", "APOLOGIZE!" , "EMBARRASING!", "CORRUPT!", "DISASTER!"];

var screen_name;
var messagetext;
var followers_count;
var description;
var favorites_count;
var statuses_count;
var reply_to;
var followers = [];

var express = require('express');
var app = express();
var server = app.listen(8080, listening);
var fs = require('fs');

function listening(){
  console.log("Serving the twitter bot");
}
app.use(express.static('public'));

var Twit = require('twit')
var config = require('./config');
var T = new Twit(config);

var stream = T.stream('user');
stream.on('follow', followed);
stream.on('tweet', tweeted);

function followed(eventMsg){
  screen_name = eventMsg.source.screen_name;
  followers_count = eventMsg.source.followers_count;
  statuses_count = eventMsg.source.statuses_count;
  description = eventMsg.source.description;
  favourites_count = eventMsg.source.favourites_count;
  tweetit("followed");
  checkfollowers();
}

function tweeted(eventMsg){
  reply_to = eventMsg.in_reply_to_screen_name;
  if (reply_to == "realdonal"){
    var json = JSON.stringify(eventMsg, null, 2);
    fs.writeFile("consolestuff.json", json);
    screen_name = eventMsg.user.screen_name;
    messagetext = eventMsg.text;
    followers_count = eventMsg.user.followers_count;
    statuses_count = eventMsg.user.statuses_count;
    description = eventMsg.user.description;
    favourites_count = eventMsg.user.favourites_count;
    tweetit("tweeted");
    checkfollowers();
  }
}

function checkfollowers(){
  var found = false;
  for (i = 0 ; i < followers.length ; i++){
    if(screen_name == followers[i].screen_name){
      found == true;
    }
  }
  if(!found && screen_name != "realdonal"){
    var follower = new Follower();
    follower.screen_name = screen_name;
    follower.followers_count = followers_count;
    follower.statuses_count = statuses_count;
    follower.description = description;
    follower.favourites_count = favourites_count;
    followers.push(follower);
  }
}

function Follower(){
  this.screen_name = screen_name;
  this.followers_count = followers_count;
  this.statuses_count = statuses_count;
  this.description = description;
  this.favourites_count = favourites_count;
}

function tweetit(eventName){
  var statusmsg;
  var firstname = names[Math.floor(Math.random()*names.length)];
  console.log("firstname = " + firstname);
  var ending = endings[Math.floor(Math.random()*endings.length)];
  console.log("ending = " + ending);
  var ind = Math.floor(Math.random()*3);
  console.log("ind = " + ind);
  if(eventName == "followed"){
    switch(ind){
      case 0:
        statusmsg = {
          status: firstname + " @" + screen_name + " just follwed me! " + ending
        }
      break;
      case 1:
        statusmsg = {
          status: "Thanks " + firstname + " @" + screen_name + " for following me. You only have " + followers_count + " followers BTW! " + ending
        }
      break;
      case 2:
        statusmsg = {
          status: firstname + " @" + screen_name + " wants to be my friend bigly. " + ending
        }
      break;
    }
  }
  else if (eventName == "tweeted" && reply_to == "realdonal"){
    reply_to = " ";
    switch (ind) {
      case 0:
      statusmsg = {
        status: firstname + " @" + screen_name + " says " + messagetext + ". " + ending
      }
      break;
      case 1:
        statusmsg = {
          status: firstname + " @" + screen_name + " has only " + followers_count + " followers. Nobody is listening to you! " + ending
        }
        break;
      case 2:
        statusmsg = {
          status: firstname + " @" + screen_name + " has just " + favourites_count + " favorited tweets. Nobody likes what you say! " + ending
        }
      break;
    }
  }
  else if(eventName == "routine" && followers.length != 0){
    var pick = Math.floor(Math.random()*followers.length);
    switch (ind) {
      case 0:
        statusmsg = {
          status: firstname + " @" + followers[pick].screen_name + " is too stupid to tweet. Could only do " + followers[pick].statuses_count + " tweets! " + ending
        }
      break;
      case 1:
        statusmsg = {
          status: "Hey " + firstname + " @" + followers[pick].screen_name + " , show me your birth certificate!"
        }
      break;
      case 2:
        statusmsg = {
          status: ".@" + followers[pick].screen_name + " is a total disaster and the worst thing for America since ISIS. " + ending
        }
      break;
    }
  }
  if(statusmsg){
    T.post('statuses/update', statusmsg, function(err, data, response){
      // console.log(data);
    })
    statusmsg = 0;
  }
}

// setInterval(tweetitregularly, 1000000);
//
// function tweetitregularly(){
//   tweetit("routine");
// }
