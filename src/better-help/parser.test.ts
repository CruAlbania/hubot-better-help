
import * as chai from 'chai'
import * as fs from 'fs'
import * as path from 'path'
import { Robot } from '../hubot'
const expect = chai.expect

import {HelpParser} from './parser'

describe('hubot help parser', () => {
  it('should parse Description from external scripts', async () => {

    const uut = new HelpParser(console, path.join(__dirname, 'test/'))

    const scripts = await uut.parseScripts()

    expect(scripts).has.property('meme')
    expect(scripts.meme).has.property('description')
    expect(scripts.meme.description).contains('Get a meme from http://memecaptain.com/')
  })

  it('should parse Description from script files in scripts/ directory', async () => {

    const uut = new HelpParser(console, path.join(__dirname, 'test/'))

    const scripts = await uut.parseScripts()

    expect(scripts).has.property('hangouts')
    expect(scripts.hangouts).has.property('description')
    expect(scripts.hangouts.description).contains('Create hangouts with Hubot.')
  })

  it('should parse Description from script files in src/scripts/ directory', async () => {

    const uut = new HelpParser(console, path.join(__dirname, 'test/'))

    const scripts = await uut.parseScripts()

    expect(scripts).has.property('example')
    expect(scripts.example).has.property('description')
    expect(scripts.example.description).contains('Example scripts for you to examine and try out.')
  })

  it('should show commands imported from external script', async () => {

    const uut = new HelpParser(console, path.join(__dirname, 'test/'))

    const scripts = await uut.parseScripts()

    expect(scripts).has.property('meme')
    expect(scripts.meme).has.property('commands')
    expect(scripts.meme.commands).contains('hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir')
  })

  it('should show commands imported from script file in scripts/ directory', async ()  => {

    const uut = new HelpParser(console, path.join(__dirname, 'test/'))

    const scripts = await uut.parseScripts()

    expect(scripts).has.property('hangouts')
    expect(scripts.hangouts).has.property('commands')
    expect(scripts.hangouts.commands).contains('hubot hangout me <title> - Creates a Hangout with the given title and returns the URL.')
  })

  it('should show commands imported from script file in src/scripts/ directory', async ()  => {

    const uut = new HelpParser(console, path.join(__dirname, 'test/'))

    const scripts = await uut.parseScripts()

    expect(scripts).has.property('hangouts')
    expect(scripts.example).has.property('commands')
    expect(scripts.example.commands).contains('hubot open the <text> doors - opens most of the doors.')
  })
})
