// Description:
//   Has hubot listen for his name and send greetings.

import { Robot } from '../hubot'

module.exports = (robot: Robot) => {
  robot.hear(new RegExp(`ask ${robot.name}`, 'i'),  (res) => {
    let msg = `Hi, I'm ${robot.name}.  Nice to meet you!
You can ask me a question by typing my name, or even direct messaging me!
Try it now by typing this:
\`${robot.name} help\``

    if (robot.alias) {
      msg += `

I also respond to "${robot.alias}".`
    }

    res.send(msg)
  })

  const greetings = ['Hi there!', 'Howdy!', 'Hi!  How are you?',
   'Hello!', "What's up?", 'Nice to see you!', 'Yo!', 'Whazzup!!!', 'Hiya!']
  robot.respond(/(hi|howdy|hello)$/i, (res) => {
    res.send(res.random(greetings) + `  Want to ask me a question?  Just type \`${robot.name} help\``)
  })

  robot.hear(new RegExp(`^(hi|howdy|hello) ${robot.name}`, 'i'), (res) => {
    res.send(res.random(greetings) + `  Want to ask me a question?  Just type \`${robot.name} help\``)
  })

  const thanks = ["you're welcome!", 'anytime!', 'happy to help!', 'of course!',
   'no problem!', 'no sweat!', "Don't mention it!", 'My pleasure!', 'Least I could do!']
  robot.hear(new RegExp(`^(thanks|thank you) ${robot.name}`, 'i'), (res) => {
    res.send(res.random(thanks))
  })

  robot.respond(/(thanks|thank you)/i, (res) => {
    res.send(res.random(thanks))
  })
}
