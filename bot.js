/*
 * ----
 * CODELITT INCUBATOR
 * ----
 *
 * Pear: A Programming Pair Generator
 *
 * Have you ever wanted to generate pairs for your team,
 * but found that there really weren't any good solutions?
 * Maybe give Pear a try - it will ask everyone whether
 * they want to participate, and if they do, it will give
 * you a nicely formatted list of pairs.
 *
 * Pear attempts to make sure everyone is a "Driver" once,
 * and everyone is an "Observer" once. If you have an odd
 * number of team members, there will always be someone
 * who won't be included.
 *
 * Project by Cody Welsh.
 *
 */

const Botkit = require('botkit');
const _ = require('underscore');

// Look for an API token
if(!process.env.SLACK) {
  throw "Error: Specify token at $SLACK";
}

// Slack API key (do _not_ reveal it here)
const token = process.env.SLACK;

// Define bot controller
const controller =  Botkit.slackbot({
  debug: false
});

// Wake it up
const bot = controller.spawn({
  token: token
});

let data;

// If we receive the authentication, continue.
bot.startRTM(
  function(err, bot, thisData) {
    data = thisData;
  });

// Returns an array of pair objects
let getPairs = function(list, pairs, uOne, uTwo) {

  // Returns a new list without members in pairs
  let nList = _.without(list, uOne, uTwo);

  if(pairs.length == list.length ||
     nList.length < 2) {
    return pairs;
  }

  let listLen = nList.length;

  // Returns an array index within bounds
  let getOne = function(nLen) {
    return _.random(0, nLen);
  };

  let userIdxOne = getOne(nList.length - 1);
  let userIdxTwo = userIdxOne;
  while(userIdxTwo == userIdxOne) {
    userIdxTwo = getOne(nList.length - 1);
  }

  let userOne = nList[userIdxOne];
  let userTwo = nList[userIdxTwo];
  let pair = {driver: userOne, observer: userTwo};

  // Add a pair
  pairs.push(pair);

  // Recurse!
  return getPairs(nList, pairs, userOne, userTwo);
};

// "Hey, Pear!" => Start convo, provide info
let messageTypes = 'direct_message,direct_mention,mention';
controller.hears(
    ['hey pear', 'hey, pear', 'hey, pear!',
     'hey Pear', 'hey, Pear', 'hey, Pear!',
     'Hey pear', 'Hey, pear', 'Hey, pear!',
     'Hey Pear', 'Hey, Pear', 'Hey, Pear!'],
    messageTypes,
    function(bot, msg) {
      bot.startConversation(msg, function(err, conv) {
        if(!err) {
          conv.say('Hi! I\'m a pear. I can also pair.');
          conv.say('We hope this can encourage teamwork, information sharing, and motivate us all to connect on a deeper level.');
          conv.say('I\'m going to generate a list of pairs, but I need to know who will be participating.');
          conv.say('This list will be our guideline for the next two weeks.');
          conv.say('Do you want to be included?');
          conv.say('Just say *Pear* (include me) or *Apple* (don\'t include me) to me in a DM!');
          conv.say('_If you don\'t, I\'ll be a sad Pear. :(_');
        }
      });
});

let participating = [];

// This user wants to participate
controller.hears(
    ['Pear', 'pear'],
    'direct_message',
    function(bot,msg) {
      bot.reply(msg,
          ":pear: Yay! You're on the list! :pear:");

      // Get relevant bits of data
      let usersList = function() {
        return (
            data.users.map(function(e) {
              return [e.id, e.name];
            })
        );
      };

      // Add the name of the messaging user to participants
      _.each(usersList(), function(e) {
        if(e[0] == msg.user &&
           participating.indexOf(e[1]) == -1) {
          participating.push(e[1]);
        }
      });

      console.log(participating);
    });

// This user doesn't want to participate
controller.hears(
    ['Apple', 'apple'],
    'direct_message',
    function(bot,msg) {
      bot.reply(msg,
          "Aw, man! Well, let me know if you change your mind!");

      // Get relevant bits of data
      let usersList = function() {
        return (
            data.users.map(function(e) {
              return [e.id, e.name];
            })
        );
      };

      // Remove the name of the messaging user from participants
      _.each(usersList(), function(e) {
        if(e[0] == msg.user &&
           participating.indexOf(e[1]) !== -1) {
            participating.splice(
              participating.indexOf(e[1]), 1);
        }
      });

    });

// Return the pairs from the list of participants
controller.hears(
    ['Generate'],
    'direct_message',
    function(bot,msg) {
      bot.reply(msg,
          "Generating Pear pairs!");

      let outPairs = getPairs(participating, [], '', '');
      console.log(outPairs);
      for(let pair of outPairs) {
        bot.reply(msg,
            "Driver: @" + pair.driver + "; Observer: @" + pair.observer);
      }
    });

