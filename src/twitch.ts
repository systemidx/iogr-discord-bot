import { TwitchApi } from 'twitch-wrapper-ts'
import { StreamResponse, IStreamQueryParameters, Stream } from 'twitch-wrapper-ts/out/apiTypes'

import TwitchStreamProperties from './twitch-stream'

export default class TwitchClient {
    private readonly _api: TwitchApi

    public constructor(twitchClientId: string) {
        this._api = new TwitchApi(twitchClientId)
    }

    public async query(): Promise<TwitchStreamProperties[]> {
        const params: IStreamQueryParameters = {
            game_id: '4761',
            first: 100,
            type: 'live',
        }

        const streams: StreamResponse = await this._api.streams.get(params)

        if (streams.data && streams.data.length > 0) {
            const transforms: TwitchStreamProperties[] = []

            for (let i = 0; i < streams.data.length; ++i) {
                const stream: Stream = streams.data[i]
                const parsedStreamData: string = JSON.stringify(stream)
                const properties: TwitchStreamProperties = JSON.parse(parsedStreamData)

                transforms.push(properties)
            }

            return transforms
        }

        return []
    }
}
