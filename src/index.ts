import dotenv from 'dotenv'
import FeedGenerator from './server'
import database from 'better-sqlite3'
import fs from 'fs'

let clearsql = `
DELETE FROM kysely_migration;
DELETE FROM kysely_migration_lock;
DELETE FROM post;
DELETE FROM sub_state;
`

let db;
const run = async () => {
  await fs.unlinkSync(`${__dirname}/db/mydb.db`);
  dotenv.config()
  const hostname = maybeStr(process.env.FEEDGEN_HOSTNAME) ?? 'example.com'
  const serviceDid =
    maybeStr(process.env.FEEDGEN_SERVICE_DID) ?? `did:web:${hostname}`
  const server = FeedGenerator.create({
    port: maybeInt(process.env.FEEDGEN_PORT) ?? 3000,
    listenhost: maybeStr(process.env.FEEDGEN_LISTENHOST) ?? 'localhost',
    sqliteLocation: maybeStr(`${__dirname}/db/mydb.db`) ?? ':memory:',
    subscriptionEndpoint:
      maybeStr(process.env.FEEDGEN_SUBSCRIPTION_ENDPOINT) ??
      'wss://bsky.network',
    publisherDid:
      maybeStr(process.env.FEEDGEN_PUBLISHER_DID) ?? 'did:example:alice',
    subscriptionReconnectDelay:
      maybeInt(process.env.FEEDGEN_SUBSCRIPTION_RECONNECT_DELAY) ?? 3000,
    hostname,
    serviceDid,
  })
  await server.start()
  db = new database(`${__dirname}/db/mydb.db`)
  console.log(
    `🤖 running feed generator at http://${server.cfg.listenhost}:${server.cfg.port}`,
  )
  setInterval(() => {
    console.log("cleaning sql...")
    db.exec(clearsql)
  }, 1000*60*5)
}

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

const maybeInt = (val?: string) => {
  if (!val) return undefined
  const int = parseInt(val, 10)
  if (isNaN(int)) return undefined
  return int
}

run()
