// tslint:disable:no-var-requires
import * as chai from 'chai'
import * as fs from 'fs'
import { Robot } from '../hubot'
const expect = chai.expect

// process.env.HUBOT_SCRIPT_ROOT = '.'

  // hubot-test-helper uses a reference to module.parent.filename to find hubot script files.
  // this screws with tests that are in different different directories - whichever is required first sets the module.
  // So we delete and re-require it every time.
delete require.cache[require.resolve('hubot-test-helper')]
const Helper = require('hubot-test-helper')
const helper = new Helper(['./greetings.ts'])

describe('hubot greetings', () => {

  let room: any

  beforeEach(() => {
    room = helper.createRoom()
  })

  afterEach(() => {
    room.destroy()
  })

  it('should respond to ask hubot', async () => {
    await room.user.say('alice', 'you should ask hubot for an answer')

    expect(room.messages[1][1]).contains("Hi, I'm hubot")
  })

  it('should respond to "hi hubot"', async () => {
    await room.user.say('alice', 'hi hubot')

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).contains('Want to ask me a question?  Just type `hubot help`')
  })

  it('should respond to "hubot hi"', async () => {
    await room.user.say('alice', 'hubot hi')

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).contains('Want to ask me a question?  Just type `hubot help`')
  })

  it('should respond to "thanks hubot"', async () => {
    await room.user.say('alice', 'thanks hubot!')

    expect(room.messages.length).to.equal(2, '#messages')
  })

  it('should respond to "hubot thanks"', async () => {
    await room.user.say('alice', 'hubot, thanks')

    expect(room.messages.length).to.equal(2, '#messages')
  })

})
