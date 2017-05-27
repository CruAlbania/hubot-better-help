
import * as Fs from 'fs'
import * as Log from 'log'
import * as Path from 'path'
import { Help, IScriptsMap } from './index'

// --------------------------------------------------------------------------------
// reimplement help parsing in robot.coffee because it doesn't expose what we need
// --------------------------------------------------------------------------------
const HUBOT_DOCUMENTATION_SECTIONS = [
  'description',
  'dependencies',
  'configuration',
  'commands',
  'notes',
  'author',
  'authors',
  'examples',
  'tags',
  'urls',
]

export class HelpParser {
  /** the working directory */
  private cwd: string

  private logger: Log

  /** creates a HelpParser which parses from the given working directory */
  constructor(logger: Log, cwd?: string) {
    this.logger = logger
    this.cwd = cwd || '.'

    this.parseScripts = this.parseScripts.bind(this)
  }

  public parseScripts(): Promise<IScriptsMap> {
    // This object holds all the loaded scripts with their parsed help information
    const scripts: IScriptsMap = {}

    // combine multiple async operations to know when we have loaded all scripts
    const loaded = {
      'scripts': false,
      'src/scripts': false,
      'external-scripts.json': false,
    }
    let done
    const ret = new Promise<IScriptsMap>((resolve, reject) => {
      done = (source) => {
        loaded[source] = true
        for (const key in loaded) {
          if (loaded.hasOwnProperty(key)) {
            if (!loaded[key]) {
              return
            }
          }
        }
        // all are loaded
        resolve(scripts)
      }
    })

    // load all the scripts from various sources
    loadScriptsFromPath(Path.resolve(this.cwd, 'scripts'), (err, help) => {
      if (err != null) {
        this.logger.error(err)
      } else {
        Object.assign(scripts, help)
      }
      done('scripts')
    })

    loadScriptsFromPath(Path.resolve(this.cwd, 'src', 'scripts'), (err, help) => {
      if (err != null) {
        this.logger.error(err)
      } else {
        Object.assign(scripts, help)
      }
      done('src/scripts')
    })

    const externalScripts = Path.resolve(this.cwd, 'external-scripts.json')
    if (!Fs.existsSync(externalScripts)) {
      done('external-scripts.json')
    } else {
      Fs.readFile(externalScripts, (err, data) => {
        if (data.length > 0) {
          try {
            const packages = JSON.parse(data.toString())
            this.parseHelpFromModules(packages, (help) => {
              Object.assign(scripts, help)
              done('external-scripts.json')
            })
          } catch (err) {
            this.logger.error('Error parsing JSON data from external-scripts.json: ', err)
          }
        }
      })
    }

    return ret
  }

  /**
   * Requires a hubot script module and executes it, intercepting "loadFile" to process help for each file.
   * The callback will be called for each processed file, with the current reduced contents.
   *
   * Assumes that all hubot script modules are implemented with the "index.coffee" template
   * which calls `robot.loadFile` on every script in the module.
   */
  private parseHelpFromModule(moduleName: string, scripts?: string[], cb?: (help: Help) => void) {
    let ret: Help

    const mockRobot = {
      loadFile: (path, file) => {
        const ext  = Path.extname(file)
        const full = Path.join(path, Path.basename(file, ext))
        if (require.extensions[ext]) {
          const script = require(full)

          if (typeof (script) === 'function') {
            const help = parseHelp(Path.join(path, file))
            ret = Help.reduce(ret, help)
            cb(ret)
          }
        }
      },
    }

    try {
      require(moduleName)(mockRobot, scripts)
    }catch (err) {
      // tslint:disable-next-line:no-console
      this.logger.error('Cant parse help from ', moduleName, ' because it doesnt use the normal index.coffee template.\n', err)
    }
  }

  /**
   * Requires the modules given by the package names in the format described by external-scripts.json
   */
  private parseHelpFromModules(packages: string[] | { [name: string]: string[] }, cb: (scripts: IScriptsMap) => void) {
    const scripts: IScriptsMap = {}

    const parsed = {}
    const done = (pkg: string) => {
      parsed[pkg] = true
      for (const key in parsed) {
        if (!parsed[key]) {
          // not done yet
          return
        }
      }
      // done
      cb(scripts)
    }

    if (packages instanceof Array) {
      for (const pkg of (packages as string[])) {
        parsed[pkg] = false
        try {
          this.parseHelpFromModule(pkg, undefined, (help) => {
            scripts[pkg.replace('hubot-', '')] = help
            done(pkg)
          })
        } catch (err) {
          this.logger.info('could not load help from module ' + pkg, err)
          done(pkg)
        }
      }
    } else {
      for (const pkg in packages) {
        if (!packages.hasOwnProperty(pkg)) {
          continue
        }
        parsed[pkg] = false
        try {
          this.parseHelpFromModule(pkg, packages[pkg], (help) => {
            scripts[pkg.replace('hubot-', '')] = help
            done(pkg)
          })
        } catch (err) {
          this.logger.info('could not load help from module ' + pkg, err)
          done(pkg)
        }
      }
    }
  }
}

/**
 * Loads all scripts in the path, and parses their help.
 */
function loadScriptsFromPath(path: string, cb: (err: Error, help: IScriptsMap) => void) {
  const help = {}

  Fs.readdir(path, (err, files) => {
    if (err) {
      if (err.code !== 'ENOENT') {
        cb(new Error('Error parsing help from directory ' + path + ', ' + err), undefined)
      } else {
        cb(undefined, {})
      }
      return
    }
    for (const file of files) {
      const ext  = Path.extname(file)
      const full = Path.join(path, Path.basename(file, ext))
      if (require.extensions[ext]) {
        try {
          const script = require(full)
          if (typeof (script) === 'function') {
            help[Path.basename(file, ext)] = parseHelp(Path.join(path, file))
          }
        } catch (err) {
          cb(new Error(`Error parsing help from file ${path}/${file}, ${err}`), undefined)
        }
      }
    }
    cb(undefined, help)
  })
}

/**
 * Parses the help header from a .js or .coffee file
 */
function parseHelp(scriptFile: string): Help {
  const scriptName = Path.basename(scriptFile).replace(/\.(coffee|js)$/, '')
  const scriptDocumentation = new Help()

  const body = Fs.readFileSync(scriptFile, 'utf-8')

  let currentSection = null
  for (const line of body.split('\n')) {
    if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
      break
    }
    const cleanedLine = line.replace(/^(#|\/\/)\s?/, '').trim()
    if (cleanedLine.length === 0 || cleanedLine.toLowerCase() === 'none') {
      continue
    }

    const nextSection = cleanedLine.toLowerCase().replace(':', '')
    if (HUBOT_DOCUMENTATION_SECTIONS.indexOf(nextSection) >= 0) {
      currentSection = nextSection
      scriptDocumentation[currentSection] = []
    } else {
      if (currentSection) {
        scriptDocumentation[currentSection].push(cleanedLine.trim())
      }
    }
  }

  if (currentSection === null) {
    scriptDocumentation.commands = []
    for (const line of body.split('\n')) {
      if (!(line[0] === '#' || line.substr(0, 2) === '//')) {
        break
      }
      if (!line.match('-')) {
        continue
      }
      const cleanedLine = line.substring(2).trim()
      scriptDocumentation.commands.push(cleanedLine)
    }
  }

  return scriptDocumentation
}
