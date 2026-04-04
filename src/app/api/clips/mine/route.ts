import { mineChannel } from '@/lib/clip-miner'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  const { userId } = auth()
  if (!userId) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!process.env.DATABASE_URL) {
    return Response.json({ error: 'DATABASE_URL not configured' }, { status: 500 })
  }

  try {
    const { channelId, mineAll } = await req.json()
    const { neon } = await import('@neondatabase/serverless')
    const sql = neon(process.env.DATABASE_URL)

    if (mineAll) {
      const channels = await sql`
        SELECT * FROM channel_registry
        WHERE active = true
        ORDER BY priority ASC
      `

      const results = []
      for (const channel of channels) {
        const result = await mineChannel(
          channel.channel_id,
          channel.channel_name,
          channel.content_type,
        )
        results.push(result)
      }

      return Response.json({ results })
    }

    if (channelId) {
      const rows = await sql`
        SELECT * FROM channel_registry WHERE channel_id = ${channelId}
      `
      if (!rows.length) {
        return Response.json({ error: 'Channel not found' }, { status: 404 })
      }

      const channel = rows[0]
      const result = await mineChannel(
        channel.channel_id,
        channel.channel_name,
        channel.content_type,
      )
      return Response.json(result)
    }

    return Response.json(
      { error: 'Provide channelId or mineAll: true' },
      { status: 400 },
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return Response.json({ error: message }, { status: 500 })
  }
}
