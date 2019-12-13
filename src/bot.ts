import { Client, ClientOptions, PresenceData, RichEmbedOptions } from 'discord.js'
import IogrDiscordChannel from './channel'
import TwitchClient from './twitch'
import TwitchStreamProperties from './twitch-stream'

export default class IogrDiscordBot {
    private readonly _client: Client
    private readonly _clientToken: string
    private readonly _notificationChannel: IogrDiscordChannel

    private readonly _twitch: TwitchClient
    private readonly _twitchPollingInterval: number
    
    // Key: Stream ID, Value: Message Ids
    private readonly _activeStreams: Map<string, string[]> = new Map<string, string[]>()

    private _twitchInterval: NodeJS.Timeout    

    /**
     * Creates an instance of IogrDiscordBot.
     *
     * @param {string} [discordBotToken]
     * @param {string} [discordChannelId]
     * @param {ClientOptions} [discordClientOptions]
     * @param {string} [twitchClientId]
     * @param {number} [twitchPollingInterval=10000]
     * @memberof IogrDiscordBot
     */
    public constructor(discordBotToken: string, discordChannelId: string, twitchClientId: string, discordClientOptions?: ClientOptions, twitchPollingInterval: number = 10000) {
        this._twitchPollingInterval = twitchPollingInterval
        this._client = new Client(discordClientOptions)
        this._clientToken = discordBotToken
        this._twitch = new TwitchClient(twitchClientId)
        this._notificationChannel = new IogrDiscordChannel(this._client, discordChannelId)
    }

    /**
     * Starts the bot. Connects to discord and starts polling twitch for active Illusion of Gaia streams (both vanilla and randomizer)
     *
     * @returns {Promise<void>}
     * @memberof IogrDiscordBot
     */
    public async start(): Promise<void> {
        if (!this._clientToken || this._clientToken === '') throw new Error('Invalid Discord Bot Token')

        // Event handlers
        this._client.on('ready', async () => this.onReady())

        // Create a connection to discord
        await this._client.login(this._clientToken)

        // Start polling twitch for games
        this._twitchInterval = setInterval(async () => this.queryTwitch(), this._twitchPollingInterval)

        // Effectively block the thread
        await new Promise(() => {})
    }

    /**
     * Stops the bot. Kills the connection to discord and stops the polling interval for twitch.
     *
     * @returns {Promise<void>}
     * @memberof IogrDiscordBot
     */
    public async stop(): Promise<void> {
        await this._client.destroy()
        clearInterval(this._twitchInterval)
    }

    /**
     * The OnReady Event Handler. This sets the bot's presence and links to the twitch category for Illusion of Gaia
     *
     * @private
     * @returns {Promise<void>}
     * @memberof IogrDiscordBot
     */
    private async onReady(): Promise<void> {
        const presence: PresenceData = {
            status: 'online',
        }

        await this._client.user.setActivity('Illusion of Gaia', {
            url: `'https://www.twitch.tv/directory/game/Illusion%20of%20Gaia?tl=${process.env.TWITCH_IOGRANDOMIZER_TAG}`,
            type: 'STREAMING',
        })
        await this._client.user.setPresence(presence)
    }

    /**
     * The polling method for querying twitch.
     *
     * @private
     * @returns {Promise<void>}
     * @memberof IogrDiscordBot
     */
    private async queryTwitch(): Promise<void> {
        // Get active streams from twitch
        const activeStreams: TwitchStreamProperties[] = await this._twitch.query()

        // Remove any active streams from our cache and remove the messages from discord
        await this.removeInactiveStreams(activeStreams)

        for (let i = 0; i < activeStreams.length; ++i) {
            const stream = activeStreams[i]

            if (this._activeStreams[stream.id]) continue

            const messageIds: string[] = await this.postActiveStreamMessage(stream)
            this._activeStreams[stream.id] = messageIds
        }
    }

    /**
     * Posts active stream messages to the discord server
     *
     * @private
     * @param {TwitchStreamProperties} stream
     * @returns {Promise<string[]>}
     * @memberof IogrDiscordBot
     */
    private async postActiveStreamMessage(stream: TwitchStreamProperties): Promise<string[]> {
        const isRandomizer = stream.tagIds && stream.tagIds.indexOf(process.env.TWITCH_IOGRANDOMIZER_TAG) > -1
        const title: string = isRandomizer ? `${stream.userName} is playing the randomizer! Check it out!` : `${stream.userName} is playing Illusion of Gaia! Check it out and tell them about the randomizer!`
        const streamUrl: string = `https://www.twitch.tv/${stream.userName}/`
        const author: string = isRandomizer ? `${stream.userName} is playing our game!` : `${stream.userName} is playing Illusion of Gaia!`
        const richMessage: RichEmbedOptions = {
            title: title,
            url: streamUrl,
            color: 1369976,
            timestamp: stream.startedAt,
            footer: {
                icon_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Illusion%20of%20Gaia-{width}x{height}.jpg',
                text: 'Streaming IoG',
            },
            thumbnail: {
                url: 'http://25.media.tumblr.com/tumblr_m8y204k2Pn1re8zjko1_1280.png',
            },
            author: {
                name: author,
                url: streamUrl,
                icon_url: 'https://static-cdn.jtvnw.net/ttv-boxart/Illusion%20of%20Gaia-{width}x{height}.jpg',
            },
        }

        return await this._notificationChannel.sendMessage(richMessage)
    }

    /**
     * Removes inactive streams from the discord channel
     *
     * @private
     * @param {TwitchStreamProperties[]} activeStreams
     * @returns {Promise<void>}
     * @memberof IogrDiscordBot
     */
    private async removeInactiveStreams(activeStreams: TwitchStreamProperties[]): Promise<void> {
        const streamsToDelete: string[] = []
        const activeStreamIds: string[] = activeStreams.map(x => x.id)

        // Loop through the existing stream IDs for entries to remove
        for (const [streamId, messageIds] of Object.entries(this._activeStreams)) {
            // If this stream ID is in the active set that is passed through, ignore it
            if (activeStreamIds.indexOf(streamId) > -1) continue

            for (let i = 0; i < messageIds.length; ++i) await this._notificationChannel.removeMessage(messageIds[i])
            streamsToDelete.push(streamId)
        }

        for (let i = 0; i < streamsToDelete.length; ++i) this._activeStreams.delete(streamsToDelete[i])
    }
}
