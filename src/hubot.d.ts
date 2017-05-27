/// <reference types="node"/>

import { EventEmitter } from 'events'
import * as express from 'express'
import * as Log from 'log'

export class Robot {
  
  public name: string
  public events: EventEmitter
  public brain: Brain
  public alias?: string
  public adapter: any
  public Response: Response
  public commands: string[]
  public listeners: Listener[]
  public middleware: {
    listener: Middleware<ListenerMiddlewareContext>
    response: Middleware<ResponseMiddlewareContext>
    receive:  Middleware<ReceiveMiddlewareContext>
  }

  public logger: Log
  public pingIntervalId: any
  public globalHttpOptions: any
  public adapterName: string
  public errorHandlers: any[]

  /**
   * Listens using a custom matching function instead of regex
   *
   */
  public listen(matcher: (message: Message) => boolean, options?: any, cb?: ListenerFunc)

  /**
   * Listens to all messages in a room, and responds whenever
   *  the given regex matches text.
   *
   * @param regex the text to listen for
   * @param resp  called when any text matches the regex
   */
  public hear(regex: RegExp, options?: Metadata | ListenerFunc, cb?: ListenerFunc)

  /**
   * Add a listener triggered whenever anyone enters the room
   */
  public enter(options?: Metadata | ListenerFunc, cb?: ListenerFunc)

  /**
   * Adds a listener triggered whenever anyone leaves the room
   */
  public leave(options?: Metadata | ListenerFunc, cb?: ListenerFunc)

  /**
   * Adds a Listener that triggers when anyone changes the topic.
   */
  public topic(options?: Metadata | ListenerFunc, cb?: ListenerFunc)

  /**
   * Adds an error handler when an uncaught exception or user emitted
   * error event occurs.
   */
  public error(callback: (err: Error, res: Response) => void)

  /**
   * Adds a Listener that triggers when no other text matchers match.
   */
  public catchAll(options?: Metadata | ListenerFunc, callback?: ListenerFunc)

  /**
   * Listens to messages directly targeted at hubot, responding
   *  only when the message is preceded by the robot's name or alias.
   *
   * example:
   *  hal open the pod bay doors
   *  HAL: open the pod bay doors
   *  @HAL open the pod bay doors
   */
  public respond(regex: RegExp, options?: Metadata | ListenerFunc, cb?: ListenerFunc)

  /**
   * Sends a message to an explicitly named room or user.
   */
  public messageRoom(room: string, ...message: string[])

  /**
   * Makes HTTP calls using node-scoped-http-client
   *
   * https://hubot.github.com/docs/scripting/#making-http-calls
   */
  public http(url: string): any

  /**
   * Registers new middleware for execution after matching but before
   * Listener callbacks
   */
  public listenerMiddleware(middleware: Middleware<ListenerMiddlewareContext>): void

  /**
   * Registers new middleware for execution as a response to any
   *  message is being sent.
   */
  public responseMiddleware(middleware: Middleware<ResponseMiddlewareContext>): void

  /**
   * Registers new middleware for execution before matching
   */
  public receiveMiddleware(middleware: Middleware<ReceiveMiddlewareContext>): void

  /**
   * Passes the given message to any interested Listeners after running
   *  receive middleware.
   */
  public receive(message: Message, cb?: any)

  /**
   * Returns an Array of help commands for running scripts.
   */
  public helpCommands(): string[]

  /**
   * A wrapper around the EventEmitter API
   */
  public on(event: string, ...args: any[])

  /**
   * A wrapper around the EventEmitter API
   */
  public emit(event: string, ...args: any[])

  /**
   * Provides HTTP endpoints for services with webhooks to push to.
   */
  public router: express.Application
}

type ListenerFunc = (res: Response) => void

/**
 * A function that examines an outgoing message and can modify
 *  it or prevent its sending.
 *  If execution should continue, the middleware should call next(done)
 *  If execution should stop, the middleware should call done().
 *  To modify the outgoing message, set context.string to a new message
 */
type Middleware<T> = (context: T, next: (doneFunc?: () => void) => void, done: () => void) => void

type ReceiveMiddlewareContext = {
  response: Response
}

type ListenerMiddlewareContext = {
  response: Response
  listener: {
    /** The metadata defined on a robot listener */
    options?: Metadata
  }
}

type ResponseMiddlewareContext = {
  response: Response
  strings: string[]
  method: string
  plaintext?: boolean
}

type Metadata = {
  id: string

  [key: string]: any
}

export class Response {

  constructor(robot: Robot, message: Message, match?: RegExpMatchArray | boolean)

  robot: Robot

  /**
   * The message which caused this response
   */
  message: Message

  /**
   * The match array from the regex given to 'hear' or 'respond'
   * 
   * Normally a RegExpMatchArray but can be any value when using robot.listen
   */
  public match?: RegExpMatchArray

  public envelope: {
    user: User
    room: Room
    message: Message,
  }

  /**
   * Sends the respose string back to the room that the message came from.
   *  The given text is sent as-is.
   */
  public send(...strings: string[])

  /**
   * Posts an emote back to the chat source
   */
  public emote(...strings: string[])

  /**
   * Sends the response string as a reply to the user who sent the initial message.
   *
   * example:
   *   robot.respond(/open the pod bay doors/i, (res) => {
   *     res.reply("I'm afraid I can't let you do that")
   *   })
   *
   *   Dave - "HAL, open the pod bay doors"
   *   HAL  - "Dave: I'm afraid I can't let you do that"
   */
  public reply(...strings: string[])

  /**
   * Posts a topic changing message
   */
  public topic(...strings: string[])

  /**
   * Play a sound in the chat source
   * 
   * strings - One or more strings to be posted as sounds to play. The order of
   *          these strings should be kept intact.
   */
  public play(...strings: string[])

  /**
   * Posts a message in an unlogged room
   */
  public locked(...strings: string[])

  /**
   * Picks a random item from the given items.
   */
  public random<T>(items: T[]): T

  /**
   * Tell the message to stop dispatching to listeners
   */
  public finish(): void

  /**
   * Creates a scoped http client with chainable methods for
   * modifying the request. This doesn't actually make a request though.
   * Once your request is assembled, you can call `get()`/`post()`/etc to
   * send the request.
   */
  public http(url: string, options?: any): any
}

export class Message {
  constructor(user: User, done?: boolean)

  public user: User
  public room?: Room

  /** Indicates that no other Listener should be called on this object */
  public finish(): void
}

export class TextMessage extends Message {
  constructor(user: User, text: string, id: string)

  public text: string
  public id?: string

  public match(regex: RegExp): RegExpMatchArray

  public toString(): string
}

export class EnterMessage extends Message {}

export class LeaveMessage extends Message {}

export class TopicMessage extends TextMessage {}

export class CatchAllMessage extends Message {
  constructor(message: Message)

  public message: Message
}

type User = {
  id: string
  name: string

  room?: Room

  [option: string]: any
}

type Room = string

export class Brain extends EventEmitter {
  public data: {
    users: {
      [id: string]: User
    },
    _private: any,
  }

  public autoSave: boolean

  /**
   * Store key-value pair under the private namespace and extend
   * existing @data before emitting the 'loaded' event.
   */
  public set<T>(key: string, value: T): Brain

  /**
   * Get value by key from the private namespace in @data
   * or return null if not found.
   */
  public get(key: string): any

  /**
   * Get value by key from the private namespace in @data
   * or return null if not found.
   * 
   * The generic method is used to provide a type assertion for static checking.
   */
  public get<T>(key: string): T

  /**
   * Remove value by key from the private namespace in @data
   * if it exists
   */
  public remove(key: string): Brain

  /**
   * Emits the 'save' event so that 'brain' scripts can handle
   * persisting.
   */
  public save(): void

  /**
   * Emits the 'close' event so that 'brain' scripts can handle closing.
   */
  public close(): void

  /**
   * Enable or disable the automatic saving
   */
  public setAutoSave(enabled: boolean): void

  /**
   * Reset the interval between save function calls.
   */
  public resetSaveInterval(seconds: number): void

  /**
   * Merge keys loaded from a DB against the in memory representation.
   */
  public mergeData(data: any): void

  /**
   * Get an Array of User objects stored in the brain.
   */
  public users(): { [id: string]: User }

  /**
   * Get a User object given a unique identifier.
   */
  public userForId(id: string, options?: any): User | undefined

  /**
   * Get a User object given a name.
   */
  public userForName(name: string): User | null

  /**
   * Get all users whose names match fuzzyName. Currently, match
   * means 'starts with', but this could be extended to match initials,
   * nicknames, etc.
   */
  public usersForRawFuzzyName(fuzzyName: string): User[]

  /**
   * If fuzzyName is an exact match for a user, returns an array with
   * just that user. Otherwise, returns an array of all users for which
   * fuzzyName is a raw fuzzy match (see usersForRawFuzzyName).
   */
  public usersForFuzzyName(fuzzyName: string): User[]

}

export class Listener {
  /**
   * Listeners receive every message from the chat source and decide if they
   * want to act on it.
   * An identifier should be provided in the options parameter to uniquely
   * identify the listener (options.id). 
   */
  constructor(robot: Robot, matcher: (message: Message) => RegExpMatchArray | boolean, options: Metadata | ListenerFunc, callback?: ListenerFunc)

  public robot: Robot
  public matcher: (message: Message) => RegExpMatchArray | boolean
  public options: Metadata
  public callback: ListenerFunc

  /**
   * Determines if the listener likes the content of the message. If
   * so, a Response built from the given Message is passed through all
   * registered middleware and potentially the Listener callback. Note that
   * middleware can intercept the message and prevent the callback from ever
   * being executed.
   */
  public call<T>(message: Message, middleware?: Middleware<T>, cb?: (matched: boolean) => void)
}

/**
 * TextListeners receive every message from the chat source and decide if they
 * want to act on it.
 */
export class TextListener extends Listener {
  constructor(robot: Robot, regex: RegExp, options: Metadata | ListenerFunc, callback?: ListenerFunc)

  public matcher: (message: Message) => RegExpMatchArray
}