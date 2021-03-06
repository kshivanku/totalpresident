var insultType = ["falseclaim", "attack", "praise", "narcissism", "transition"];
var insults_data;
var insults;
var rndInsultsIndex;
var selectedInsult;
var insultVariables = ["_GNICK_", "_BNICK_", "_NN_", "_SN_", "_DES_", "_FOLC_", "_FAVC_", "_STATC_", "_IMG_", "_AEND_", "_HEND_"];

// DATA ABOUT OTHER PEOPLE TO BE SAVED
var name;
var screen_name;
var description;
var messagetext;
var followers_count;
var favourites_count;
var statuses_count;
var profile_image_url;

// OTHER VARIABLES
var prevmsg;
var pre_target;
var current_target;

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
    if(eventMsg){
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
          "favourites_count": eventMsg.statuses[0].user.favourites_count,
          "statuses_count": eventMsg.statuses[0].user.statuses_count,
          "profile_image_url": eventMsg.statuses[0].user.profile_image_url
        }
        var target_member = checkmember(eventMsgStored);
        if(!target_member){
          target_member = addnewmember(eventMsgStored);
        }
        insult(target_member, "scout");
      }
      else{
        console.log("Same tweet found");
      }
    }
  })
}

//TWEETING SOMEONE IN NETWORK EVERY 15 MINS
// setInterval(tweetgeneral, 905000);
function tweetgeneral(){
  //MAKING SURE THE SAME PERSON DOES NOT GET TWEETED BACK TO BACK
  console.log("Making a general tweet to network");
  while(current_target == pre_target){
    current_target = selectRandomMember();
  }
  pre_target = current_target;
  insult(current_target, "tweeted");
}

function selectRandomMember(){
  var network_data = fs.readFileSync("network.json");
  network = JSON.parse(network_data);
  var index = Math.floor(Math.random() * network.length);
  console.log("Randomly selected member is: " + network[index]);
  return network[index];
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
    "favourites_count": eventMsg.source.favourites_count,
    "statuses_count": eventMsg.source.statuses_count,
    "profile_image_url": eventMsg.source.profile_image_url
  }
  var target_member = checkmember(eventMsgStored);
  if(!target_member){
    target_member = addnewmember(eventMsgStored);
  }
  insult(target_member, "followed");
}

//LISTENING FOR TWEET EVENT
stream.on('tweet', tweeted);
function tweeted(eventMsg){
  if(eventMsg.user.screen_name != "donalreal"){
    console.log("Tweeted event triggered");
    var incomingdata = JSON.stringify(eventMsg, null, 2);
    fs.writeFile("tweeteddata.json", incomingdata);

    var eventMsgStored = {
      "name" : eventMsg.user.name,
      "screen_name": eventMsg.user.screen_name,
      "description": eventMsg.user.description,
      "followers_count": eventMsg.user.followers_count,
      "favourites_count": eventMsg.user.favourites_count,
      // "statuses_count": eventMsg.user.statuses_count,
      "profile_image_url": eventMsg.user.profile_image_url
    }
    console.log("Fav count in eventMsgStored" + eventMsgStored.favourites_count);
    var target_member = checkmember(eventMsgStored);
    if(!target_member){
      target_member = addnewmember(eventMsgStored);
    }
    insult(target_member, "tweeted");
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
      console.log("member already exists: " + network[i]);
      return network[i];
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
  console.log("Fav count in member" + member.favourites_count);
  if(eventMsgStored.statuses_count){
    member.statuses_count = eventMsgStored.statuses_count;
  }
  member.profile_image_url = eventMsgStored.profile_image_url;
  member.goodnickname = getnickname("good");
  member.badnickname = getnickname("bad");

  var network_data = fs.readFileSync("network.json");
  var network = JSON.parse(network_data);

  network.push(member);
  var data = JSON.stringify(network, null, 2);
  fs.writeFile("network.json", data, function(){
    console.log("New member added");
  });
  return member;
}
function Member(){
  this.name;
  this.screen_name;
  this.description;
  this.followers_count;
  this.favourites_count;
  this.statuses_count;
  this.profile_image_url;
  this.goodnickname;
  this.badnickname;
}
function getnickname(nicknametype){
  var namelist_data = fs.readFileSync("insults/nicknames.json");
  var namelist = JSON.parse(namelist_data);
  var index;
  if(nicknametype == "good"){
    index = Math.floor(Math.random() * namelist.goodnicknames.length);
    return namelist.goodnicknames[index];
  }
  else if(nicknametype == "bad"){
    index = Math.floor(Math.random() * namelist.badnicknames.length);
    return namelist.badnicknames[index];
  }
}

//CHOOSING APPROPRIATE INSULT AND POSTING A TWEET
function insult(target_member, eventname){
  console.log("Reay to find the right insult");

  var chosenInsultType = chooseInsultType();
  console.log("Chosen insult type: " + chosenInsultType);
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
    insults_data = fs.readFileSync("insults/insultsgeneral.json");
    insults = JSON.parse(insults_data);
    rndInsultsIndex = Math.floor(Math.random() * insults[chosenInsultType].length);
  }
  selectedInsult = insults[chosenInsultType][rndInsultsIndex];
  console.log("Insult chosen: " + selectedInsult);
  //CONVERTING INSULT STATEMENT INTO A TWEET AND POSTING
  var readyTweet = prepareTweet(selectedInsult, target_member);
  console.log("Ready Tweet: " + readyTweet.status);
  if(readyTweet.status.length > 140) {
    console.log("More than 140 characters");
    insult(target_member, eventname);
  }
  else{
    postTweet(readyTweet);
  }
}

//CHOOSING THE TYPE OF INSULT
function chooseInsultType(){
  var insultChoice = Math.floor(Math.random() * insultType.length);
  return insultType[insultChoice];
}

//CONVERTING INSULT STATEMENT INTO A TWEET BY ADDING VARIABLES IN THE APPROPRIATE PLACES AND TURNING IT INTO OBJECT
function prepareTweet(selectedInsult, target_member){
  for(i = 0 ; i < insultVariables.length ; i++){
    selectedInsult = editInsult(selectedInsult, insultVariables[i], target_member);
  }
  var readyTweet = {
    "status" : selectedInsult
  }
  return readyTweet;
}

function editInsult(selectedInsult, insultVariable, target_member){
  if(insultVariable == "_NN_"){
    selectedInsult = selectedInsult.replace(/_NN_/g, target_member.name);
  }
  if(insultVariable == "_SN_"){
    selectedInsult = selectedInsult.replace(/_SN_/g, "@" + target_member.screen_name);
  }
  if(insultVariable == "_DES_"){
    selectedInsult = selectedInsult.replace(/_DES_/g, target_member.description);
  }
  if(insultVariable == "_FOLC_"){
    selectedInsult = selectedInsult.replace(/_FOLC_/g, target_member.followers_count);
  }
  if(insultVariable == "_FAVC_"){
    selectedInsult = selectedInsult.replace(/_FAVC_/g, target_member.favourites_count);
  }
  if(insultVariable == "_STATC_" && target_member.statuses_count){
    selectedInsult = selectedInsult.replace(/_STATC_/g, target_member.statuses_count);
  }
  if(insultVariable == "_IMG_"){
    selectedInsult = selectedInsult.replace(/_IMG_/g, target_member.profile_image_url);
  }
  if(insultVariable == "_GNICK_"){
    selectedInsult = selectedInsult.replace(/_GNICK_/g, target_member.goodnickname);
  }
  if(insultVariable == "_BNICK_"){
    selectedInsult = selectedInsult.replace(/_BNICK_/g, target_member.badnickname);
  }
  if(insultVariable == "_AEND_"){
    var ending_data = fs.readFileSync("insults/endings.json");
    var ending = JSON.parse(ending_data);
    var end_index = Math.floor(Math.random() * ending.angry.length);
    selectedInsult = selectedInsult.replace(/_AEND_/g, ending.angry[end_index]);
  }
  if(insultVariable == "_HEND_"){
    var ending_data = fs.readFileSync("insults/endings.json");
    var ending = JSON.parse(ending_data);
    var end_index = Math.floor(Math.random() * ending.happy.length);
    selectedInsult = selectedInsult.replace(/_HEND_/g, ending.happy[end_index]);
  }
  return selectedInsult;
}

//POSTING THE TWEET
function postTweet(readyTweet){
  console.log("Tweet Posted!");
  T.post('statuses/update', readyTweet, function(err, data, response){
    if (err) throw err
  });
}
