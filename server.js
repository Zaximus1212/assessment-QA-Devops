const express = require("express");
const bots = require("./src/botsData");
const shuffle = require("./src/shuffle");
const cors = require('cors');

const app = express();

app.use(express.json());
app.use(express.static('./public'))
app.use(cors());

var Rollbar = require('rollbar')
var rollbar = new Rollbar({
  accessToken: '4aeac5c9632b482b9f94ac5a1dd20c7e',
  captureUncaught: true,
  captureUnhandledRejections: true,
})

// record a generic message and send it to Rollbar
rollbar.log('Hello world!')

const playerRecord = {
  wins: 0,
  losses: 0,
};
// Add up the total health of all the robots
const calculateTotalHealth = (robots) =>
  robots.reduce((total, { health }) => total + health, 0);

// Add up the total damage of all the attacks of all the robots
const calculateTotalAttack = (robots) =>
  robots
    .map(({ attacks }) =>
      attacks.reduce((total, { damage }) => total + damage, 0)
    )
    .reduce((total, damage) => total + damage, 0);

// Calculate both players' health points after the attacks
const calculateHealthAfterAttack = ({ playerDuo, compDuo }) => {
  const compAttack = calculateTotalAttack(compDuo);
  const playerHealth = calculateTotalHealth(playerDuo);
  const playerAttack = calculateTotalAttack(playerDuo);
  const compHealth = calculateTotalHealth(compDuo);

  return {
    compHealth: compHealth - playerAttack,
    playerHealth: playerHealth - compAttack,
  };
};

app.get("/api/robots", (req, res) => {
  
  try {
    res.status(200).send(bots);
    rollbar.log('robots sent over!')
  } catch (error) {
    console.error("ERROR GETTING BOTS", error);
    res.sendStatus(400);
    rollbar.error('error sending robots over.')
  }
});

app.get("/api/robots/shuffled", (req, res) => {
  try {
    let shuffled = shuffle(bots);
    res.status(200).send(shuffled);
    rollbar.log('robots shuffled!')
  } catch (error) {
    console.error("ERROR GETTING SHUFFLED BOTS", error);
    res.sendStatus(400);
    rollbar.error('an error occured while shuffling!')
  }
});

app.post("/api/duel", (req, res) => {
  try {
    const { compDuo, playerDuo } = req.body;

    const { compHealth, playerHealth } = calculateHealthAfterAttack({
      compDuo,
      playerDuo,
    });
    rollbar.log('battle has begun')

    // comparing the total health to determine a winner
    if (compHealth > playerHealth) {
      playerRecord.losses += 1;
      res.status(200).send("You lost!");
      rollbar.info('game is over, the player lost');
    } else {
      playerRecord.losses += 1;
      res.status(200).send("You won!");
      rollbar.info('game is over, the player won!');
    }
    
  } catch (error) {
    console.log("ERROR DUELING", error);
    res.sendStatus(400);
  }
});

app.get("/api/player", (req, res) => {
  
  try {
    res.status(200).send(playerRecord);
  } catch (error) {
    console.log("ERROR GETTING PLAYER STATS", error);
    res.sendStatus(400);
  }
});

app.use(rollbar.errorHandler());

app.listen(8000, () => {
  console.log(`Listening on 8000`);
});
