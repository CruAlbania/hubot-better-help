// tslint:disable:no-var-requires
import * as chai from 'chai'
import * as fs from 'fs'
import * as sinon from 'sinon'
const expect = chai.expect

import { Robot } from '../hubot'
import { Help, InitHelp } from './index'
import { Searcher } from './search'

  // hubot-test-helper uses a reference to module.parent.filename to find hubot script files.
  // this screws with tests that are in different different directories - whichever is required first sets the module.
  // So we delete and re-require it every time.
delete require.cache[require.resolve('hubot-test-helper')]
const Helper = require('hubot-test-helper')
const helper = new Helper([])

describe('hubot help', () => {

  let room: any

  beforeEach(() => {
    room = helper.createRoom()
    room.robot.alias = 'hal'
  })

  afterEach(() => {
    room.destroy()
  })

  it('should respond to "hubot help"', async () => {

    // setup
    InitHelp(room.robot, {}, undefined)

    // act
    await room.user.say('alice', 'hubot help')
    await wait(10)

    // assert
    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).contains('I can do a lot of things!')
    expect(room.messages[1][1]).contains('hubot help all')
  })

  it('should respond to "hubot help me"', async () => {
    // setup
    InitHelp(room.robot, {}, undefined)

    // act
    await room.user.say('alice', 'hubot help')
    await wait(10)

    // assert
    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).contains('I can do a lot of things!')
    expect(room.messages[1][1]).contains('hubot help all')
  })

  it('should respond to "hubot help all"', async () => {
    // setup
    InitHelp(room.robot, {
      hangouts: {
        description: ['Create hangouts with Hubot.'],
        commands: ['hubot hangout me <title> - Creates a Hangout with the given title and returns the URL.'],
      },
      example: {
        description: ['Example scripts for you to examine and try out.'],
        commands: ['hubot open the <text> doors - opens most of the doors.'],
      },
    }, undefined)

    // act
    await room.user.say('alice', 'hubot help all')
    await wait(10)

    // assert
    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).contains("Here's a list of all the things I can do:")
    expect(room.messages[1][1]).contains('hubot hangout me')
    expect(room.messages[1][1]).contains('hubot open the <text> doors')

  })

  it('should not include the help script itself', async () => {
    // setup
    InitHelp(room.robot, {
      help: {
        description: ['A more helpful help command'],
      },
    }, undefined)

    // act
    await room.user.say('alice', 'hubot help')
    await wait(10)

    // assert
    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.not.contain('A more helpful help command')
  })

  it('should search all commands when not finding an exact match', async () => {
    // setup
    const searcher = { executeSearch: (s) => [] }
    const mockSearcher: sinon.SinonMock = sinon.mock(searcher)
    mockSearcher.expects('executeSearch').once().returns([
      'hubot Brace yourself <text> - Meme: Ned Stark braces for <text>',
    ])

    InitHelp(room.robot, {}, searcher as any)

    // act
    await room.user.say('alice', 'hubot help ned stark')
    await wait(10)

    // assert
    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain('hubot Brace yourself <text> - Meme: Ned Stark braces for <text>')
    mockSearcher.verify()
  })

  it('should return nice message on failed search', async () => {
    // setup
    const searcher = { executeSearch: (s) => [] }
    const mockSearcher: sinon.SinonMock = sinon.mock(searcher)
    mockSearcher.expects('executeSearch').once().withArgs('asdfqwera').returns([
      // empty
    ])

    InitHelp(room.robot, {}, searcher as any)

    await room.user.say('alice', 'hubot help asdfqwera')
    await wait(10)

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain("I couldn't find anything related to asdfqwera")
  })

  it('should return help message on catch all', async () => {
    // setup
    const stub = sinon.stub().returns([
      // empty
    ])
    const mockSearcher = { executeSearch: stub }

    InitHelp(room.robot, {}, mockSearcher as any)

    await room.user.say('alice', 'hubot asdfqwera')
    await wait(10)

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain("Sorry, I didn't catch that.  Try `hubot help`")
  })

  it('should run catch all on direct message', async () => {
    // setup
    const stub = sinon.stub().returns([
      // empty
    ])
    const mockSearcher = { executeSearch: stub }

    InitHelp(room.robot, {}, mockSearcher as any)

    await room.user.say('alice', '@hubot asdfqwera')
    await wait(10)

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain("Sorry, I didn't catch that.  Try `hubot help`")
  })

  it('should run catch all on robot alias', async () => {
    // setup
    const stub = sinon.stub().returns([
      // empty
    ])
    const mockSearcher = { executeSearch: stub }

    InitHelp(room.robot, {}, mockSearcher as any)

    await room.user.say('alice', 'hal asdfqwera')
    await wait(10)

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain("Sorry, I didn't catch that.  Try `hubot help`")
  })

  it('should return related help on catch all', async () => {
    // setup
    const searcher = { executeSearch: (s) => [] }
    const mockSearcher: sinon.SinonMock = sinon.mock(searcher)
    mockSearcher.expects('executeSearch').once().withArgs('boromir').returns([
      'hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir',
    ])

    InitHelp(room.robot, {}, searcher as any)

    await room.user.say('alice', 'hubot boromir')
    await wait(10)

    expect(room.messages.length).to.equal(2, '#messages')
    expect(room.messages[1][1]).to.contain("Sorry, I didn't catch that.  Try one of these?")
    expect(room.messages[1][1]).to.contain('hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir')
  })

  it('should not run catch all if they dont say the robots name', async () => {
    // setup
    const mockSearcher: sinon.SinonMock = sinon.mock({ executeSearch: (s) => [] })
    mockSearcher.expects('executeSearch').once().returns([
      // empty
    ])

    InitHelp(room.robot, {}, mockSearcher as any)

    await room.user.say('alice', 'boromir')
    await wait(10)

    expect(room.messages).to.deep.equal([
      [ 'alice', 'boromir' ],
    ])
  })
})

function wait(milliseconds: number): Promise<void> {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      resolve()
    }, milliseconds)
  })
}
