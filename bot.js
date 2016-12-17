// THIS WILL SOON BE IN A SEPARATE FILE
// var nick_name = ["LOSER","FAILING","LYING","CROOKED","LOW-ENERGY","LITTLE","FRAUD","TOTALLY BIASED", "NASTY"];
// var tweet_ending = ["SAD!", "DISGUSTING!", "MISTAKE!", "WRONG!","NO MORE!", "TERRIBLE!", "SHAME!", "APOLOGIZE!" , "EMBARRASING!", "CORRUPT!", "DISASTER!"];

var insultType = ["falseclaim", "attack", "praise", "narcissism", "transition"];
var insults_data;
var insults;
var rndInsultsIndex;
var selectedInsult;
var insultVariables = ["NN", "SN", "DES", "FOLC", "FAVC", "STATC", "IMG"];

// DATA ABOUT OTHER PEOPLE TO BE SAVED
var name;
var screen_name;
var description;
var messagetext;
var followers_count;
var favorites_count;
var statuses_count;
var profile_image_url;

// OTHER VARIABLES
var prevmsg;

//STARTING THE SERVER
var express = require('express');
var app = express();
var server = app.listen(8080, listening);
function listening(){
  console.log("Serving the twitter bot");
}

// LOADING OTHER PACKAGES
var fs = require('fs');
var Twit = require('twit')
var config = require('./config');
var T = new Twit(config);

//REGULAR TWEETING
// setInterval(scout, 10000);
function scout(){
  T.get('search/tweets', { q: 'ITP_NYU', count: 1 }, function(err, eventMsg, response) {
    if (err) throw err;

    if( prevmsg != eventMsg.statuses[0].text){
      console.log("New tweet found");
      prevmsg = eventMsg.statuses[0].text;

      // WRITING TO A FILE
      var incomingdata = JSON.stringify(eventMsg, null, 2);
      fs.writeFile("grabbedtweets2.json", incomingdata, function(){});

      var eventMsgStored = {
        "name" : eventMsg.statuses[0].user.name,
        "screen_name": eventMsg.statuses[0].user.screen_name,
        "description": eventMsg.statuses[0].user.description,
        "followers_count": eventMsg.statuses[0].user.followers_count,
        "statuses_count": eventMsg.statuses[0].user.statuses_count,
        "profile_image_url": eventMsg.statuses[0].user.profile_image_url
      }

      insult(eventMsgStored, "scout");
      if(!checkmember(eventMsgStored)){
        addnewmember(eventMsgStored);
      }
    }
    else{
      console.log("Same tweet found");
    }
  })
}

//SETTING UP STREAM
var stream = T.stream('user');

//LISTENING FOR FOLLOW EVENT
stream.on('follow', followed);
function followed(eventMsg){
  console.log("Followed event triggered");
  var incomingdata = JSON.stringify(eventMsg, null, 2);
  fs.writeFile("followeddata.json",incomingdata);

  var eventMsgStored = {
    "name" : eventMsg.source.name,
    "screen_name": eventMsg.source.screen_name,
    "description": eventMsg.source.description,
    "followers_count": eventMsg.source.followers_count,
    "statuses_count": eventMsg.source.statuses_count,
    "profile_image_url": eventMsg.source.profile_image_url
  }

  insult(eventMsgStored, "followed");

  if(!checkmember(eventMsgStored)){
    addnewmember(eventMsgStored);
  }
}

//LISTENING FOR TWEET EVENT
stream.on('tweet', tweeted);
function tweeted(eventMsg){
  if(eventMsg.user.screen_name != "realdonal"){
    console.log("Tweeted event triggered");
    var incomingdata = JSON.stringify(eventMsg, null, 2);
    fs.writeFile("tweeteddata.json", incomingdata);

    var eventMsgStored = {
      "name" : eventMsg.user.name,
      "screen_name": eventMsg.user.screen_name,
      "description": eventMsg.user.description,
      "followers_count": eventMsg.user.followers_count,
      // "statuses_count": eventMsg.user.statuses_count,
      "profile_image_url": eventMsg.user.profile_image_url
    }

    insult(eventMsgStored, "tweeted");

    if(!checkmember(eventMsgStored)){
      addnewmember(eventMsgStored);
    }
  }
}

//MAINTAINING NETWORK.JSON
function checkmember(eventMsgStored){
  var network_data = fs.readFileSync("network.json");
  var network = JSON.parse(network_data);

  for(i = 0 ; i < network.length ; i++){
    if(eventMsgStored.screen_name == network[i].screen_name){
      if(!network[i].statuses_count){
        network[i].statuses_count = eventMsgStored.statuses_count;
      }
      return true;
    }
  }
  return false;
}
function addnewmember(eventMsgStored){
  var member = new Member();
  member.name = eventMsgStored.name;
  member.screen_name = eventMsgStored.screen_name;
  member.description = eventMsgStored.description;
  member.followers_count = eventMsgStored.followers_count;
  member.favourites_count = eventMsgStored.favourites_count;
  if(eventMsgStored.statuses_count){
    member.statuses_count = eventMsgStored.statuses_count;
  }
  member.profile_image_url = eventMsgStored.profile_image_url;

  var network_data = fs.readFileSync("network.json");
  var network = JSON.parse(network_data);

  network.push(member);
  var data = JSON.stringify(network, null, 2);
  fs.writeFile("network.json", data, function(){
    console.log("New member added");
  });
}
function Member(){
  this.name;
  this.screen_name;
  this.description;
  this.followers_count;
  this.favourites_count;
  this.statuses_count;
  this.profile_image_url;
}

//CHOOSING APPROPRIATE INSULT AND POSTING A TWEET
function insult(eventMsgStored, eventname){
  var chosenInsultType = chooseInsultType();

  //CHOOSING AN INSULT STATEMENT
  if(eventname == "scout"){
    insults_data = fs.readFileSync("insults/insultsforscout.json");
    insults = JSON.parse(insults_data);
    rndInsultsIndex = Math.floor(Math.random() * insults[chosenInsultType].length);
  }
  if(eventname == "followed"){
    insults_data = fs.readFileSync("insults/insultsforfollow.json");
    insults = JSON.parse(insults_data);
    rndInsultsIndex = Math.floor(Math.random() * insults[chosenInsultType].length);
  }
  if(eventname == "tweeted"){
    insults_data = fs.readFileSync("insults/insultsfortweeted.json");
    insults = JSON.parse(insults_data);
    rndInsultsIndex = Math.floor(Math.random() * insults[chosenInsultType].length);
  }
  selectedInsult = insults[chosenInsultType][rndInsultsIndex];

  //CONVERTING INSULT STATEMENT INTO A TWEET AND POSTING
  var readyTweet = prepareTweet(selectedInsult, eventMsgStored);
  postTweet(readyTweet);
}

//CHOOSING THE TYPE OF INSULT
function chooseInsultType(){
  var insultChoice = Math.floor(Math.random() * insultType.length);
  return insultType[insultChoice];
}

//CONVERTING INSULT STATEMENT INTO A TWEET BY ADDING VARIABLES IN THE APPROPRIATE PLACES AND TURNING IT INTO OBJECT
function prepareTweet(selectedInsult, eventMsgStored){
  for(i = 0 ; i < insultVariables.length ; i++){
    selectedInsult = editInsult(selectedInsult, insultVariables[i], eventMsgStored);
  }
  var readyTweet = {
    "status" : selectedInsult
  }
  return readyTweet;
}

function editInsult(selectedInsult, insultVariable, eventMsgStored){
  if(insultVariable == "NN"){
    selectedInsult = selectedInsult.replace(/NN/g, eventMsgStored.name);
  }
  if(insultVariable == "SN"){
    selectedInsult = selectedInsult.replace(/SN/g, "@" + eventMsgStored.screen_name);
  }
  if(insultVariable == "DES"){
    selectedInsult = selectedInsult.replace(/DES/g, eventMsgStored.description);
  }
  if(insultVariable == "FOLC"){
    selectedInsult = selectedInsult.replace(/FOLC/g, eventMsgStored.followers_count);
  }
  if(insultVariable == "FAVC"){
    selectedInsult = selectedInsult.replace(/FAVC/g, eventMsgStored.favorites_count);
  }
  if(insultVariable == "STATC"){
    selectedInsult = selectedInsult.replace(/STATC/g, eventMsgStored.statuses_count);
  }
  if(insultVariable == "IMG"){
    selectedInsult = selectedInsult.replace(/IMG/g, eventMsgStored.profile_image_url);
  }
  return selectedInsult;
}

//POSTING THE TWEET
function postTweet(readyTweet){
  console.log("Tweet Posted!");
  T.post('statuses/update', readyTweet, function(err, data, response){});
}
