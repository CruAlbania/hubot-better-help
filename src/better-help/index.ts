
import { CatchAllMessage, Robot, TextMessage } from '../hubot'
import { Searcher } from './search'

export function InitHelp(robot: Robot, scripts: IScriptsMap, searcher: Searcher) {
  // -------------- RESPOND WITH HELP FROM HUBOT SCRIPTS ---------------------- //

  robot.respond(/help(?:\s+(.*))?/i, (res) => {
    const replyInPrivate = process.env.HUBOT_HELP_REPLY_IN_PRIVATE
    const sendReply = (replyStr) => {
      if (replyInPrivate && res.envelope && res.envelope.user && res.envelope.user.id) {
        res.reply('Replied to you in private!')
        robot.messageRoom(res.envelope.user.name, replyStr)
        return
      }
      res.reply(replyStr)
    }

    // hubot help
    if (!res.match[1] || res.match[1] === 'me' || res.match[1].startsWith('me ')) {
      const reply = ['I can do a lot of things!  Which would you like to know more about? You can say:  ', '']
      for (const k in scripts) {
        if (!scripts.hasOwnProperty(k)) {
          continue
        }
        if (k === 'help') {
          // skip the help command itself
          continue
        }
        const h = scripts[k] as Help
        if (!h.commands || h.commands.length === 0) {
          // no commands in this script - might be a brain or other helper script
          continue
        }

        let desc = h.description.length > 0 ? h.description[0] : ''
        desc = desc.replace('hubot', robot.name)
        reply.push(`* ${robot.name} help ${k} - ${desc}  `)
      }
      reply.push('', '\nOr you can see all commands by typing `' + robot.name + ' help all`.')
      sendReply(reply.join('\n'))
      return
    }

    const query = res.match[1].toLowerCase().trim()
    const allCommands = getAllCommands(scripts)

    // hubot help all
    if (query === 'all') {
      const cmds = renameHelpCommands(allCommands, robot.name)
      const reply = "Here's a list of all the things I can do:  \n\n" +
                      cmds.map((c) => '* ' + c).join('  \n')
      sendReply(reply)
      return
    }

    // hubot help {{ script name }}
    const selectedHelp = scripts[query] as Help
    if (selectedHelp && selectedHelp.commands.length > 0) {
      const cmds = renameHelpCommands(selectedHelp.commands.sort(), robot.name)
      let desc = selectedHelp.description.length > 0 ? selectedHelp.description[0] : ''
      desc = desc.replace('hubot', robot.name)
      const reply = desc + '  \n\n' +
                      cmds.map((c) => '* ' + c).join('  \n')
      sendReply(reply)
      return
    }

    // hubot help {{ search query }}
    const matches = searcher.executeSearch(res.match[1])
    if (matches.length > 0) {
      const cmds = renameHelpCommands(matches, robot.name)
      const reply = `Here's what I can do related to "${res.match[1]}":  \n\n` +
                      cmds.map((c) => '* ' + c).join('  \n')
      sendReply(reply)
      return
    }

    sendReply("Sorry!  I couldn't find anything related to " + res.match[1])
  })

  // ---------- Catch all which searches commands ------------- //
  const nameRegex = robot.alias ?
    new RegExp('^@?(?:' + robot.name + '|' + robot.alias + ') ', 'i') :     // /^@?(hubot|hal) /i
    new RegExp('^@?' + robot.name + ' ', 'i')                               // /^@?hubot /i

  robot.catchAll((res) => {
    // strip the robot's name before doing the search
    const msg = (res.envelope.message as CatchAllMessage).message as TextMessage
    if (!nameRegex.test(msg.text)) {
      // they didn't say the robots name
      return
    }
    const txtMsg = msg.text.replace(nameRegex, '')

    // run a search on the unknown command
    let matches = searcher.executeSearch(txtMsg)
    if (matches.length > 0) {
      matches = matches.slice(0, 5).map((m) => '* ' + m)
      matches = renameHelpCommands(matches, robot.name)
      matches.splice(0, 0, "Sorry, I didn't catch that.  Try one of these?")
      res.reply(matches.join('\n'))
    } else {
      res.reply(`Sorry, I didn't catch that.  Try \`${robot.name} help\``)
    }
  })
}

export interface IScriptsMap {
  [name: string]: Help
}

/**
 * The result of parsing a help file - contains all hubot documentation sections
 */
export class Help {
  /**
   * Reduces the help comments of two files into one.
   *   Used when a module has multiple files with help comments
   */
  public static reduce(first: Help, second: Help): Help {
    if (!first) { return second }
    if (!second) { return first }

    first.description   = mergeArrays(first.description, second.description)
    first.dependencies  = mergeArrays(first.dependencies, second.dependencies)
    first.configuration = mergeArrays(first.configuration, second.configuration)
    first.commands      = mergeArrays(first.commands, second.commands)
    first.notes         = mergeArrays(first.notes, second.notes)
    first.author        = mergeArrays(first.author, second.author)
    first.examples      = mergeArrays(first.examples, second.examples)
    first.tags          = mergeArrays(first.tags, second.tags)
    first.urls          = mergeArrays(first.urls, second.urls)
    return first
  }

  public description?: string[]
  public dependencies?: string[]
  public configuration?: string[]
  public commands?: string[]
  public notes?: string[]
  public author?: string[]
  public examples?: string[]
  public tags?: string[]
  public urls?: string[]
}

/** Util to merge two arrays into one without duplicates */
function mergeArrays<T>(arr1: T[], arr2: T[]): T[] {
  if (!arr1) {
    return arr2
  }
  if (!arr2) {
    return arr1
  }
  // add only the elements which are not duplicated
  arr1.push(...arr2.filter((i) => arr1.indexOf(i) !== -1))
  return arr1
}

/**
 * Once all the help documentation is parsed into an associative array,
 * This function iterates that array to get all the commands
 */
function getAllCommands(scripts: IScriptsMap): string[] {
  const allCommands = []
  for (const k in scripts) {
    if (!scripts.hasOwnProperty(k)) {
      continue
    }
    const h = (scripts[k] as Help)
    if (h.commands) {
      allCommands.push(...h.commands)
    }
  }
  return allCommands
}

/**
 * Renames the given help commands with the robot name
 */
function renameHelpCommands(commands: string[], robotName: string) {
  return commands.map((command) =>
      command.replace(/^hubot/i, robotName))
}
