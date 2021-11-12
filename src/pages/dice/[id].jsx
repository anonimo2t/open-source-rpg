import React, { useState, useEffect, useMemo } from 'react';
import Head from 'next/head';
import Queue from 'js-queue';

import { withStyles } from '@mui/styles';
import { PrismaClient } from '@prisma/client';

import socket from '../../utils/socket';

const prisma = new PrismaClient();

export const getServerSideProps = async ({ params }) => {
  const characterId = isNaN(params.id) ? null : Number(params.id);

  if(!characterId) {
    return {
      props: {
        character: null
      }
    }
  }

  const character = await prisma.character.findUnique({
    where: {
      id: characterId
    }
  });

  if(!character) {
    return {
      props: {
        character: null
      }
    }
  }

  const serialized = JSON.parse(JSON.stringify(character));

  return {
    props: {
        character: serialized
    }
  }
}

function Dice({
  classes,
  character
}) {
  const queue = useMemo(() => new Queue(), []);

  const [currentDice, setCurrentDice] = useState(null);

  useEffect(() => {
    document.body.style.backgroundColor = 'transparent';
  }, []);

  function showDiceOnScreen(roll) {
    setCurrentDice(roll);

    // Run After 5 seconds
    setTimeout(() => {
      // Remove Dice
      setCurrentDice(null);
    }, 5 * 1000);

    // Run After 8 seconds
    setTimeout(() => {
      this.next();
    }, 8 * 1000);
  }

  useEffect(() => {
    socket.emit('room:join', `dice_character_${character.id}`);

    socket.on('dice_roll', data => {
      data.rolls.forEach(roll => {
        queue.add(showDiceOnScreen.bind(queue, roll));
      });
    });
  }, [character, queue]);

  if(!character) {
    return (
        <div>Personagem não existe!</div>
    )
  }

  return (
    <React.Fragment>
      <Head>
          <title>Dados de {character.name} | RPG</title>
      </Head>
      <div className={classes.container}>
          {
            currentDice && (
              <div className={classes.diceContainer}>
                  <div>
                    <video width="600" height="600" autoPlay muted className={classes.diceVideo}>
                      <source src="/assets/dice.webm" type="video/webm" />
                    </video>
                  </div>
                  <div className={classes.diceResult}>
                    <span className={classes.diceNumber}>{currentDice.rolled_number}</span>
                  </div>
              </div>
            )
          }
      </div>
    </React.Fragment>
  )
}

const styles = (theme) => ({
  container: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    fontFamily: 'Fruktur',
    userSelect: 'none'
  },
  diceContainer: {
    position: 'relative'
  },
  diceResult: {
    position: 'absolute',
    top: '180px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%'
  },
  diceNumber: {
    zIndex: 2,
    fontSize: '150px',
    textShadow: '0 0 10px #FFFFFF'
  }
});

export default withStyles(styles)(Dice);