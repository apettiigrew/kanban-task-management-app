import { PrismaClient } from '@prisma/client'
import { prisma } from '@/lib/prisma'

type TransactionClient = Omit<
  PrismaClient,
  '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'
>

/**
 * Wraps Prisma queries in a transaction that sets a session variable
 * used by Supabase RLS policies (get_current_user_id()) to enforce
 * row-level user data isolation at the database level.
 */
// #region agent log
import fs from 'fs'
const DBG_LOG = '/Users/andrewpettigrew/Documents/Projects/Personal/Personal/kanban-app/.cursor/debug-8bc891.log'
const dbgWrite = (obj: object) => { try { fs.appendFileSync(DBG_LOG, JSON.stringify({sessionId:'8bc891',timestamp:Date.now(),...obj})+'\n') } catch {} }
// #endregion

export const queryAsUser = async <T>(
  userId: string,
  fn: (tx: TransactionClient) => Promise<T>
): Promise<T> => {
  // #region agent log
  const dbUrl = process.env.DATABASE_URL || ''
  let parsedUser = 'parse-failed', parsedHost = 'parse-failed'
  try { const u = new URL(dbUrl); parsedUser = u.username; parsedHost = u.hostname } catch(e:any) { parsedUser = 'url-parse-error:'+e.message }
  dbgWrite({location:'db.ts:entry',message:'queryAsUser called',data:{parsedUser,parsedHost,urlLength:dbUrl.length},hypothesisId:'A'})
  // #endregion

  try {
    return await prisma.$transaction(async (tx) => {
      // #region agent log
      dbgWrite({location:'db.ts:tx-started',message:'transaction started OK, running set_config',data:{userIdPrefix:userId.substring(0,8)},hypothesisId:'E'})
      // #endregion
      await tx.$executeRaw`SELECT set_config('app.current_user_id', ${userId}, true)`
      return fn(tx)
    })
  } catch (err: any) {
    // #region agent log
    dbgWrite({location:'db.ts:error',message:'queryAsUser threw',data:{name:err?.name,message:err?.message,code:err?.code,meta:err?.meta},hypothesisId:'A,B,C,D,E'})
    // #endregion
    throw err
  }
}
