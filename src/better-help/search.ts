import { english } from 'stopwords'

import { Help, IScriptsMap } from './index'

export class Searcher {
  /**
   * Creates a search index over the loaded scripts
   */
  public static LoadSearchIndex(scripts: IScriptsMap): Promise<Searcher> {
    // TODO: use search-index module to create a real search index
    return Promise.resolve(new Searcher(scripts))
  }

  private scripts: IScriptsMap
  private allCommands: Array<{ command: string, lower: string}>
  private stopWords: { [w: string]: boolean }

  private constructor(scripts: IScriptsMap, stopWords?: string[]) {
    this.scripts = scripts

    stopWords = stopWords || english
    // make it into a map
    this.stopWords = {}
    for (const w of stopWords) {
      this.stopWords[w] = true
    }

    this.allCommands = []
    for (const k in scripts) {
      if (!scripts.hasOwnProperty(k)) {
        continue
      }
      const h = (scripts[k] as Help)
      if (h.commands) {
        this.allCommands.push(...h.commands.map((c) => ({ command: c, lower: c.toLowerCase() })))
      }
    }

    this.executeSearch = this.executeSearch.bind(this)
  }

  /**
   * Runs a search over the given array of commands, searching in order by:
   *   string.contains
   *   regex.match
   *   command contains any word in given search terms
   */
  public executeSearch(query: string): string[] {
    const queryLower = query.toLowerCase()
      // see if any commands contain the given text
    let matching = this.allCommands.filter((cmd) => cmd.lower.includes(queryLower))
    if (matching.length > 0) {
      return matching.map((m) => m.command)
    }

      // see if a regex search matches
    const r = new RegExp(query, 'i')
    const matches = this.allCommands.filter((cmd) =>
      r.test(cmd.command),
    )
    if (matches.length > 0) {
      return matches.map((c) => c.command)
    }

      // see if any commands have any text related to any of the given words
    const terms = query.split(' ').filter((val) => !this.stopWords[val])
    matching = this.allCommands.filter((cmd) =>
      cmd.lower.split(' ').find((word) => terms.indexOf(word) >= 0) ? true : false,
    )
    if (matching.length > 0) {
      return matching.map((m) => m.command)
    }

    return []
  }
}
