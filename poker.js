const mysql = require('mysql')
const express = require('express')
const app = express()
const http = require("http")
const session = require('express-session')
const MemoryStore = require('memorystore')(session)
const path = require('path')

//TODO "bcrypt" to be used to encrypt passwords before storing in database
const bcrypt = require('bcrypt');
const saltRounds = 10;


/////////////////////////////////////////////////////////////////////////////
//////////////////////////    GLOBAL VARS    ////////////////////////////////
/////////////////////////////////////////////////////////////////////////////

var current_stage = ''

var queued_users = [];
var active_users = [];
//player data is all game data
//client_player_data is just game data that all users should be allowed to see
var player_data = {};
var client_player_data = {};
var active_game = false;
var whose_turn = ''
var dealer = ''
var buy_in = 1000;
var pot = 0;
var current_bet = 0;
//                           NOTE ABOUT CARDS
//                           s = spade, c = club, h = heart, d = diamond
//                           0 = 10, j = jack, q = queen, k = king, a = ace
const cards =  {"2s":{suit:"spade",value:2},"3s":{suit:"spade",value:3},"4s":{suit:"spade",value:4},"5s":{suit:"spade",value:5},"6s":{suit:"spade",value:6},"7s":{suit:"spade",value:7},"8s":{suit:"spade",value:8},"9s":{suit:"spade",value:9},"0s":{suit:"spade",value:10},"js":{suit:"spade",value:11},"qs":{suit:"spade",value:12},"ks":{suit:"spade",value:13},"as":{suit:"spade",value:14},
                "2c":{suit:"club",value:2},"3c":{suit:"club",value:3},"4c":{suit:"club",value:4},"5c":{suit:"club",value:5},"6c":{suit:"club",value:6},"7c":{suit:"club",value:7},"8c":{suit:"club",value:8},"9c":{suit:"club",value:9},"0c":{suit:"club",value:10},"jc":{suit:"club",value:11},"qc":{suit:"club",value:12},"kc":{suit:"club",value:13},"ac":{suit:"club",value:14},
                "2h":{suit:"heart",value:2},"3h":{suit:"heart",value:3},"4h":{suit:"heart",value:4},"5h":{suit:"heart",value:5},"6h":{suit:"heart",value:6},"7h":{suit:"heart",value:7},"8h":{suit:"heart",value:8},"9h":{suit:"heart",value:9},"0h":{suit:"heart",value:10},"jh":{suit:"heart",value:11},"qh":{suit:"heart",value:12},"kh":{suit:"heart",value:13},"ah":{suit:"heart",value:14},
                "2d":{suit:"diamond",value:2},"3d":{suit:"diamond",value:3},"4d":{suit:"diamond",value:4},"5d":{suit:"diamond",value:5},"6d":{suit:"diamond",value:6},"7d":{suit:"diamond",value:7},"8d":{suit:"diamond",value:8},"9d":{suit:"diamond",value:9},"0d":{suit:"diamond",value:10},"jd":{suit:"diamond",value:11},"qd":{suit:"diamond",value:12},"kd":{suit:"diamond",value:13},"ad":{suit:"diamond",value:14}};

var cards_temp = cards;
var table_cards = {'card_1':{showing:false},'card_2':{showing:false},'card_3':{showing:false},'card_4':{showing:false},'card_5':{showing:false}}


/////////////////////////////////////////////////////////////////////////////
//////////////////////////    EXPRESS STUFF    //////////////////////////////
/////////////////////////////////////////////////////////////////////////////


let connection = mysql.createConnection({
    host: "ec2-18-191-88-213.us-east-2.compute.amazonaws.com",
    user: "phpUserMan",
    password: "electricitySuperZap!",
    database: "poker"
});

connection.connect();

const server = http.Server(app)
const io = require('socket.io')(server)

server.listen(3456);
//HANDLE AJAX REQUESTS
app.use(express.json());

const sessionStuff = session({
  secret: "oZB9BxA1MJvawT2D014!1CeY2P6mqG3HbggT9RV5EqMWdqQVRXzp6bDNjC3UnXzQgw6pCkEOY6JIJInuni*Uh8ihJiiKKJBB43859yj4UNJNIJvBSEuZ",
  store: new MemoryStore,
  resave: false,
  saveUninitialized: false
});

app.use(sessionStuff);
io.use((socket, next) => {
  sessionStuff(socket.request, socket.request.res, next)
})

app.use("/static", express.static(__dirname + '/static'));
app.use("/cards", express.static(__dirname + '/cards'));

app.get('/', (req, res) => {
  if(req.session["username"]){
    res.sendFile(path.join(__dirname, '/pages/home.html'))
    send_game_data()
  }
  res.sendFile(path.join(__dirname, '/pages/index.html'));
})

app.get('/home.html', (req, res) => {
  if(req.session["username"]){
    res.sendFile(path.join(__dirname, '/pages/home.html'))
    send_game_data()
    
  }
  else {
    res.sendFile(path.join(__dirname, "/pages/bad_login.html"))
  }
})


/////////////////////////////////////////////////////////////////////////////
//////////////////////////    SOCKET.IO STUFF    ////////////////////////////
/////////////////////////////////////////////////////////////////////////////


io.on('connection', (socket) => {
  socket.removeAllListeners()
  send_game_data()
  global_socket = socket;
  io.sockets.emit("test")
  socket.on('connected', (blah) => {
    
    player_data[socket.request.session.username] = {}
    client_player_data[socket.request.session.username] = {}
    player_data[socket.request.session.username]["socketId"] = socket.id;
    io.to(`${socket.id}`).emit("your_username", socket.request.session.username)
    
    console.log(player_data)
    console.log("TRY AGAIN: " +socket.request.session.username + ": " + player_data[socket.request.session.username]["socketId"])
    send_game_data();
    start_game();
    console.log("pls agian")

    
  })
})



  app.post("/", (req, res) => {
    //login request
    if(req.body.request === "login"){
      user_login(req, res);
    }
    if(req.body.request === "create_account"){
      user_create_account(req, res);
    }
    
  })


/////////////////////////////////////////////////////////////////////////////
//////////////////////////    HELPER FUNCTIONS    ///////////////////////////
/////////////////////////////////////////////////////////////////////////////


function user_login(req,res){
  connection.query("SELECT * FROM users WHERE username = ?", [req.body.username], (err, rows, fields) => {
    //TODO: actually authenticate users!!
    if(rows[0]){
      //success
      queued_users.push(req.body.username);
      send_game_data();
      req.session["username"] = req.body.username;
      res.send(JSON.stringify({
        login_status: "success",
        username: req.body.username
      }));
    }
    else {
      //failure
      res.send(JSON.stringify({
        login_status: "failure",
        username: req.body.username
      }));
    }
  });
}

function user_create_account(req,res) {
  connection.query("INSERT INTO users (username, password) VALUES (?,?)", [req.body.username, req.body.password], (err, result) =>{
    if(err){
      throw(err)
    }
    console.log(result)
    console.log("inserted user/pass pair!");
  });
}

function send_game_data(){
  io.sockets.emit("players_list", {
    'queued': queued_users,
    'active': active_users
  })
  for(var key in player_data){
    io.to(`${player_data[key]["socketId"]}`).emit("your_username", key)
  }
  if(active_game){
    for(var key in player_data){
      io.to(`${player_data[key]["socketId"]}`).emit("your_cards", {card_1: player_data[key]["card_1"], card_2: player_data[key]["card_2"], chips:player_data[key]["chips"]})
    }
    io.sockets.emit("table_data", table_cards)
    io.sockets.emit("client_player_data", client_player_data)
  }
}

function start_game(){
  console.log(player_data)
  console.log("in start game")
  console.log(active_game)
  console.log(queued_users.length)
  if(!active_game && queued_users.length >= 2){
    console.log("Beginning game!")
    activate_players();
    active_game = true;
    begin_round();
  }
  
  send_game_data();
}

function activate_players(){
  queued_users.forEach((user) => {
    active_users.push(user)
    player_data[user]['chips'] = buy_in;
    client_player_data[user]['chips'] = buy_in;
  })
  queued_users = [];
  send_game_data();
}

function begin_round(){
  io.sockets.emit("begin_round")
  for(var key in player_data){
    player_data[key]["playing"] = true
    client_player_data[key]["playing"] = true

    player_data[key]["card_1"] = draw_card()
    player_data[key]["card_2"] = draw_card()

    let tempSocketId = player_data[key]["socketId"]
    console.log(client_player_data)
    io.to(`${tempSocketId}`).emit("your_username", key)
    io.to(`${tempSocketId}`).emit("your_cards", {card_1: player_data[key]["card_1"], card_2: player_data[key]["card_2"], chips:player_data[key]["chips"]})
  }
  
  io.sockets.emit("poker_log", "The round begins.")
  io.sockets.emit("client_player_data", client_player_data)
  

  determine_dealer();
  ante_up();
}

function determine_dealer(){
  var player_count = active_users.length
  var dealer_num = active_users.indexOf(dealer)

  dealer_num++;
  if(dealer_num >= player_count){
    dealer_num = 0;
  }

  dealer = active_users[dealer_num]
}

function first_better(deal){
  var player_count = active_users.length
  var better_num = active_users.indexOf(deal)

  better_num++;
  if(better_num >= player_count){
    better_num = 0;
  }

  if(!player_data[active_users[better_num]].playing){
    return first_better(active_users[better_num])
  }
  return active_users[better_num];
}

function ante_up(){
  for(var key in client_player_data){
    pot += subtract_chips(key, buy_in / 100)
    io.sockets.emit("poker_log", key + " anted "+(''+(buy_in / 100))+" chips.")
    io.to(`${player_data[key]["socketId"]}`).emit("your_cards", {card_1: player_data[key]["card_1"], card_2: player_data[key]["card_2"], chips:player_data[key]["chips"]})
  }
  io.sockets.emit("pot_size",pot)
  io.sockets.emit("client_player_data", client_player_data)

  pre_flop_betting()
}

async function pre_flop_betting(){
  current_stage = 'pre_flop'
  io.sockets.emit("Pre-Flop betting begins!")
  var end_better = first_better(dealer);
  var better = end_better;
  place_bet(better, end_better)
}

async function place_bet(current, end){
  console.log(current, end)
  io.sockets.emit("whose_turn",current)
  io.sockets.emit("poker_log", "It's "+current+"'s turn.")
  io.sockets.emit("betting_req",false);
  // await sleep(2000);
  io.to(`${player_data[current]["socketId"]}`).emit("betting_req",true)
  
  io.sockets.sockets[player_data[current]["socketId"]].on("betting_res", (data) => {
    io.sockets.sockets[player_data[current]["socketId"]].removeAllListeners("betting_res")
    if(data.action === 'fold'){
      
      io.sockets.emit("poker_log",current+" folded!")
      player_data[current].playing = false
      client_player_data[current].playing = false
      io.sockets.emit("client_player_data", client_player_data)
      var playing_users = 0;
      var temp_player;
      for(var player in player_data){
        if(player_data[player].playing){
          playing_users++;
          temp_player = player
        }
      }
      if(playing_users == 1){
        
          reward_and_reset(temp_player)
          //TODO implement temp_player is winner
      }
      else{
        var next_better = first_better(current)
        if(next_better === end){
          next_stage()
        }
        else {
          place_bet(next_better,end)
        }
      }
    }
    else if(data.action === 'bet') {
      //TODO validate
      //1: bet comes from correct user
      //2: bet is a number
      //3: must call, raise, or fold (no betting lower than previous bets)
      //4: security safety
      var bet_string = ' called.'
      if(current_bet > data.amount){
        //no bueno, retry pls
      }   
      else if(current_bet < data.amount){
        end = current;
        bet_string = ' raised to '+data.amount+' chips.'
        current_bet = data.amount
      }
      else if(data.amount == 0){
        bet_string =' checked.'
      }
      pot += subtract_chips(current, data.amount)
      io.sockets.emit("pot_size",pot)
      io.sockets.emit("client_player_data", client_player_data)
      io.sockets.emit("poker_log", current + bet_string)
      io.to(`${player_data[current]["socketId"]}`).emit("your_cards", {card_1: player_data[current]["card_1"], card_2: player_data[current]["card_2"], chips:player_data[current]["chips"]})
      var next_better = first_better(current)
        if(next_better === end){
          next_stage()
        }
        else {
          place_bet(next_better,end)
        }
    }
  })
}

function next_stage(){
  current_bet = 0;
  if(current_stage === "pre_flop"){
    table_cards.card_1 = {showing: true, card: draw_card()}
    table_cards.card_2 = {showing: true, card: draw_card()}
    table_cards.card_3 = {showing: true, card: draw_card()}
    console.log(table_cards)
    io.sockets.emit("table_data", table_cards)
    io.sockets.emit("poker_log","And the Flop!")
    current_stage = "flop"
    var end_better = first_better(dealer);
    var better = end_better;
    place_bet(better, end_better)
  }
  else if(current_stage === "flop"){
    table_cards.card_4 = {showing: true, card: draw_card()}
    io.sockets.emit("table_data", table_cards)
    io.sockets.emit("poker_log","Next, the Turn!")
    current_stage = "turn"
    var end_better = first_better(dealer);
    var better = end_better;
    place_bet(better, end_better)
  }
  else if(current_stage === "turn"){
    table_cards.card_5 = {showing: true, card: draw_card()}
    io.sockets.emit("table_data", table_cards)
    io.sockets.emit("poker_log","Finally, the River!")
    current_stage = "river"
    var end_better = first_better(dealer);
    var better = end_better;
    place_bet(better, end_better)
  }
  else if(current_stage === "river"){
    evaluate_hands()//TODO
  }
}

function reward_and_reset(winner){
  client_player_data[winner].chips += pot;
  player_data[winner].chips += pot;
  io.sockets.emit("poker_log", winner+" wins "+pot+" chips!")
  pot = 0;
  cards_temp = cards;
  table_cards = {'card_1':{showing:false},'card_2':{showing:false},'card_3':{showing:false},'card_4':{showing:false},'card_5':{showing:false}}
  io.sockets.emit("table_data",table_cards)
  io.sockets.emit("pot_size",pot)
  activate_players();
  begin_round();
}

function temp_evaluate_hands(){
  var players_left = []
  for(var player in player_data){
    if(player_data[player].playing){
      players_left.push(player)
    }
  }
  var winner = players_left[Math.floor(Math.random() * players_left.length)]
  reward_and_reset(winner)
}
function evaluate_hands(){
  var players_left = {}

  for(var player in player_data){
    if(player_data[player].playing){
      console.log("look here at end")
      console.log(player_data[player])
      players_left[player] = {};
      players_left[player].card_1 = player_data[player].card_1
      players_left[player].card_2 = player_data[player].card_2
      players_left[player].card_3 = table_cards.card_1
      players_left[player].card_4 = table_cards.card_2
      players_left[player].card_5 = table_cards.card_3
      players_left[player].card_6 = table_cards.card_4
      players_left[player].card_7 = table_cards.card_5
      temp_thing = determine_hand(players_left[player]);
      players_left[player].hand = temp_thing[0];
      players_left[player].high_card = temp_thing[1];
    }
    
  }
  var best_hand;
  var max_player;
  var their_high_card;
  for(var player in player_data){
    
    if(player_data[player].playing){
      if(max_player == null){
        best_hand = players_left[player].hand;
        max_player = player;
        their_high_card = players_left[player].high_card;
      }
      else if(players_left[player].hand > best_hand){
        best_hand = players_left[player].hand;
        max_player = player;
        their_high_card = players_left[player].high_card;
      }
      else if(players_left[player].hand == best_hand){
        if(players_left[player].high_card > their_high_card){
          best_hand = players_left[player].hand;
          max_player = player;
          their_high_card = players_left[player].high_card;
        }
      }
    }
  }
  reward_and_reset(max_player);
}

function subtract_chips(player, count){
  var chips = player_data[player]['chips'];
  if(count > chips){
    player_data[player]['chips'] = 0;
    client_player_data[player]['chips'] = 0;
    io.sockets.emit("poker_log", player + " is all in!")
    return chips;
  }
  else {
    player_data[player]['chips'] -= count;
    client_player_data[player]['chips'] -= count;
    return count;
  }
}

function draw_card(){
  let keys = Object.keys(cards_temp)
  let temp = Math.floor(Math.random() * keys.length)
  let card = cards_temp[keys[temp]]
  delete cards_temp[keys[temp]]
  card["showing"] = true;
  return card;
}







function determine_hand(player){
  var hearts = 0;
  var clubs = 0;
  var spades = 0;
  var diamonds = 0;
  var values = []

  var hand = 0;

  var flush = false
  var straight = false

  var high_card;
  var second_card;
  var third_card;
  var fourth_card;
  var fifth_card;
  for(var card in player){
    switch(player[card].suit){
      case "heart":
        hearts++
        break
      case "club":
        clubs++
        break
      case "spade":
        spades++
        break
      case "diamond":
        diamonds++
        break
    }
    values.push(player[card].value)
  }
  values.sort(function(a,b){return a-b})
  unique_values = [...new Set(values)]

  //HIGH CARD
  high_card = values[6]
  second_card = values[5]
  third_card = values [4]
  fourth_card = values[3]
  fifth_card = values[2]

  //ONE PAIR
  var one_pair_values = values
  if(unique_values.length == values.length - 1){
    for(var i = 0; i < values.length -1; i++){
      if(values[i]==values[i+1]){
        one_pair_values.splice(i,2)
        high_card = values[i]
        second_card = values[i]
        one_pair_values.sort((a,b) => {return b-a})
        third_card = one_pair_values[0]
        fourth_card = [one_pair_values[1]]
        fifth_card = [one_pair_values[2]]
        hand = 1;
      }
    }
  }

  //TWO PAIR & THREE OF KIND
  var two_pair_values = values
  var three_values = values
  if(unique_values.length == values.length - 2){
    for(var i = 0; i < values.length -2; i++){
      if(values[i]==values[i+1]==values[i+2]){
        three_values.splice(i,3)
        high_card = values[i]
        second_card = values[i]
        third_card = values[i]
        three_values.sort((a,b) => {return b-a})
        fourth_card = [three_values[0]]
        fifth_card = [three_values[1]]
        hand = 3;
      }
      else {
        hand = 2;
      }
    }
  }

  
  if(values[6] == 14 && unique_values[0]==2==1+unique_values[1]==2+unique_values[2]==3+unique_values[3]){
    straight = true
    high_card = unique_values[3]
    hand = 4;
  }
  for(var i = 0; i < 3; i++){
    if(unique_values[i]==1+unique_values[i+1]==2+unique_values[i+2]==3+unique_values[i+3]==4+unique_values[i+4]){
      straight = true
      high_card = unique_values[i+4]
      hand = 4;
    }
    
  }
  if(hearts >= 5){
    hand = 5;
    flush = true;
    heart_values;
    for(var card in player){
      if(player[card].suit === "heart"){
        heart_values.push(player[card].value)
      }
    }
    heart_values.sort(function(a,b){return b-a})
    high_card = heart_values[0]
    second_card = heart_values[1]
    third_card = heart_values[2]
    fourth_card = heart_values[3]
    fifth_card = heart_values[4]
  }
  if(clubs >= 5){
    hand = 5;
    flush = true;
    club_values;
    for(var card in player){
      if(player[card].suit === "club"){
        club_values.push(player[card].value)
      }
    }
    club_values.sort(function(a,b){return b-a})
    high_card = club_values[0]
    second_card = club_values[1]
    third_card = club_values[2]
    fourth_card = club_values[3]
    fifth_card = club_values[4]
  }
  if(spades >= 5){
    hand = 5;
    flush = true;
    spade_values;
    for(var card in player){
      if(player[card].suit === "spade"){
        spade_values.push(player[card].value)
      }
    }
    spade_values.sort(function(a,b){return b-a})
    high_card = spade_values[0]
    second_card = spade_values[1]
    third_card = spade_values[2]
    fourth_card = spade_values[3]
    fifth_card = spade_values[4]
  }
  if(diamonds >= 5){
    hand = 5;
    flush = true;
    diamond_values;
    for(var card in player){
      if(player[card].suit === "club"){
        diamond_values.push(player[card].value)
      }
    }
    diamond_values.sort(function(a,b){return b-a})
    high_card = diamond_values[0]
    second_card = diamond_values[1]
    third_card = diamond_values[2]
    fourth_card = diamond_values[3]
    fifth_card = diamond_values[4]
  }
  return [hand,high_card];
}