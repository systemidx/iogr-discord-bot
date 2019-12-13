import IogrDiscordBot from './bot'
import dotenv from 'dotenv'

let bot: IogrDiscordBot

function validateConfiguration(): void {
    dotenv.config()

    if (!process.env.TWITCH_IOGRANDOMIZER_TAG) throw new Error('Missing environmental variable: TWITCH_IOGRANDOMIZER_TAG')
    if (!process.env.TWITCH_CLIENT_ID) throw new Error('Missing environmental variable: TWITCH_CLIENT_ID')
    if (!process.env.DISCORD_CHANNEL_ID) throw new Error('Missing environmental variable: DISCORD_CHANNEL_ID')
    if (!process.env.DISCORD_BOT_TOKEN) throw new Error('Missing environmental variable: DISCORD_BOT_TOKEN')
}

async function run(): Promise<void> {
    validateConfiguration()

    bot = new IogrDiscordBot(process.env.DISCORD_BOT_TOKEN, process.env.DISCORD_CHANNEL_ID, process.env.TWITCH_CLIENT_ID)
    await bot.start()
}

process.on('exit', async code => {
    console.log('Stopping bot...')
    await bot.stop()
})

run()
