import Discord, { Channel, TextChannel, RichEmbed, RichEmbedOptions, Message } from 'discord.js'

export default class IogrDiscordChannel {
    private readonly _client: Discord.Client
    private readonly _channelId: string

    public constructor(client: Discord.Client, channelId: string) {
        this._client = client
        this._channelId = channelId
    }

    public async sendMessage(message: RichEmbedOptions): Promise<string[]> {
        if (this._client.status !== 0) throw new Error('Discord client is not connected')

        const channel: Channel = this._client.channels.get(this._channelId)
        if (!channel) throw new Error(`Discord client could not find channel '${this._channelId}'`)
        if (channel.type != 'text') throw new Error(`Discord channel '${this._channelId}' is not a text channel`)

        const textChannel: TextChannel = channel as TextChannel
        const embed: RichEmbed = new RichEmbed(message)
        const messages: Message | Message[] = await textChannel.send(embed)

        const messageIds: string[] = []
        if (Array.isArray(messages)) {
            const messageArray: Message[] = messages as Message[]
            messageArray.forEach(x => {
                messageIds.push(x.id)
            })
        } else {
            const message: Message = messages as Message
            messageIds.push(message.id)
        }

        return messageIds
    }

    public async removeMessage(messageId: string): Promise<void> {
        if (this._client.status !== 0) throw new Error('Discord client is not connected')

        const channel: Channel = this._client.channels.get(this._channelId)
        if (!channel) throw new Error(`Discord client could not find channel '${this._channelId}'`)
        if (channel.type != 'text') throw new Error(`Discord channel '${this._channelId}' is not a text channel`)

        const textChannel: TextChannel = channel as TextChannel
        const message = await textChannel.fetchMessage(messageId)
        await message.delete()
    }
}
