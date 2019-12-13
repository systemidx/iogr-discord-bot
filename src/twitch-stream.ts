type TwitchStreamProperties = {
    id: string
    userId: string
    userName: string
    gameId: string
    type: string
    title: string
    viewerCount: number
    startedAt: Date
    language: string
    thumbnailUrl: string
    tagIds: string[]
    communityIds: string[]
}

export default TwitchStreamProperties
