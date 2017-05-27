// tslint:disable:no-var-requires
import * as chai from 'chai'
import * as fs from 'fs'
import { Robot } from './hubot'
const expect = chai.expect

// process.env.HUBOT_SCRIPT_ROOT = '.'

  // hubot-test-helper uses a reference to module.parent.filename to find hubot script files.
  // this screws with tests that are in different different directories - whichever is required first sets the module.
  // So we delete and re-require it every time.
delete require.cache[require.resolve('hubot-test-helper')]
const Helper = require('hubot-test-helper')
const helper = new Helper(['./better-help.ts'])

describe('hubot help', () => {

  let room: any

  beforeEach(() => {
    room = helper.createRoom()
  })

  afterEach(() => {
    room.destroy()
  })

  it('should respond to ask hubot', async () => {
    await wait(10) // short wait so hubot can process all the help files

    await room.user.say('alice', 'you should ask hubot for an answer')

    expect(room.messages[1][1]).contains("Hi, I'm hubot")
  })

  it('should respond to "hubot help"', async () => {

    await wait(10) // short wait so hubot can process all the help files

    await room.user.say('alice', 'hubot help')

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).contains('I can do a lot of things!')
    expect(room.messages[1][1]).contains('hubot help all')
  })

  it('should return help message on catch all', async () => {

    await wait(10) // short wait so hubot can process all the help files

    await room.user.say('alice', 'hubot asdfqwera')

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain("Sorry, I didn't catch that.  Try `hubot help`")
  })
})

function wait(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, milliseconds)
  })
}
