// tslint:disable:no-unused-expression
import * as chai from 'chai'
import * as fs from 'fs'
const expect = chai.expect

import { Robot } from '../hubot'
import { Searcher } from './search'

describe('hubot help search', () => {
  it('should use exact search terms', async () => {

    // setup
    const search = await Searcher.LoadSearchIndex({
      meme: {
        commands: [
          'hubot Brace yourself <text> - Meme: Ned Stark braces for <text>',
          'hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir',
          'hubot ONE simply not does <text> - Meme: rimoroB',
        ],
      },
    })

    // act
    const results = search.executeSearch('does not simply')

    // assert
    expect(results).to.deep.equal(
      ['hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir'],
    )
  })

  it('should search with regex', async () => {

    // setup
    const search = await Searcher.LoadSearchIndex({
      meme: {
        commands: [
          'hubot Brace yourself <text> - Meme: Ned Stark braces for <text>',
          'hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir',
        ],
      },
    })

    // act
    const results = search.executeSearch('for\\s\\<(\\w+)\\>')

    // assert
    expect(results).to.deep.equal(
      ['hubot Brace yourself <text> - Meme: Ned Stark braces for <text>'],
    )
  })

  it('should search for all terms individually failing exact and regex match', async () => {

    // setup
    const search = await Searcher.LoadSearchIndex({
      meme: {
        commands: [
          'hubot Brace yourself <text> - Meme: Ned Stark braces for <text>',
          'hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir',
          'hubot return of the king title - Meme: a meme from lord of the rings when the king returns',
        ],
      },
      hangouts: {
        commands: [
          'hubot hangout me <title> - Creates a Hangout with the given title and returns the URL.',
        ],
      },
    })

    // act
    let results = search.executeSearch('title returns')

    // assert
    results = results.sort()
    expect(results).to.deep.equal(
      [
        'hubot hangout me <title> - Creates a Hangout with the given title and returns the URL.',
        'hubot return of the king title - Meme: a meme from lord of the rings when the king returns',
      ],
    )
  })

  it('should ignore stop words', async () => {

    // setup
    const search = await Searcher.LoadSearchIndex({
      meme: {
        commands: [
          'hubot ONE DOES NOT SIMPLY <text> - Meme: Boromir',
          'hubot anyhow - dont do this',
        ],
      },
    })

    // act
    const results = search.executeSearch('Dont anyhow')

    // assert
    expect(results).to.be.empty
  })
})
