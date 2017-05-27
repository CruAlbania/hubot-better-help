// Description:
//   A more helpful help command.
//
// Dependencies:
//   "stopwords": "0.0.5"
//
// Configuration:
//   HUBOT_HELP_NO_GREETINGS=true - tells hubot to not listen for mentions such as 'ask hubot' or 'hi hubot'
//
// Commands:
//   hubot help - The friendly help prompt
//
// Notes:
//   This module is written with typescript, and all javascript files are generated.  If you want to make changes
//   please clone the source from https://github.com/CruAlbania/hubot-better-help
//
// Author:
//   gburgett

import * as Fs from 'fs'
import * as Path from 'path'

import { InitHelp } from './better-help/index'
import { HelpParser } from './better-help/parser'
import { Searcher } from './better-help/search'
import { Robot } from './hubot'

module.exports = (robot: Robot) => {
  const cwd = '.'

  // --------------- Greetings ------------------------------------ //
  if (!process.env.HUBOT_HELP_NO_GREETINGS) {
    require('./better-help/greetings')(robot)
  }

  // load dependencies and then respond with help
  const parser = new HelpParser(robot.logger, cwd)
  parser.parseScripts()
    .then((scripts) => {
      Searcher.LoadSearchIndex(scripts)
        .then((searcher) => {
            // Respond with help from hubot scripts
          InitHelp(robot, scripts, searcher)
        })
        .catch((error) => {
          robot.logger.error('Unable to create search index:', error)
        })
    })
    .catch((error) => {
      robot.logger.error('Unable to load help scripts:', error)
    })

}
