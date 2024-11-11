import { MonthlyArtistPlaytime, Artist } from './types.ts'

type PopularityScore = number
type ArtistPopularity = { [key: Artist]: PopularityScore }

async function readCleanedData() {
    const data = await Deno.readTextFile('data/cumulativeListeningTime.json')
    const parsedData: MonthlyArtistPlaytime = JSON.parse(data)
    return parsedData
}

const spotifyData = await readCleanedData()
const spotifyDataTop15: MonthlyArtistPlaytime = {}

Object.entries(spotifyData).forEach(([month, data]) => {
    const sortedArtists = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 12)
    spotifyDataTop15[month] = Object.fromEntries(sortedArtists)
})

const allArtists = new Set<string>()
Object.values(spotifyDataTop15).forEach(data => {
    Object.keys(data).forEach(artist => allArtists.add(artist))
})

const artistPopularity: ArtistPopularity = {}

for (const artist of allArtists) {
    const response = await fetch(`https://api.spotify.com/v1/search?q=${artist}&type=artist&limit=1&offset=0`, {
        headers: {
            Authorization: 'Bearer x'
        }
    })
    const data = await response.json()
    const popularity = data.artists.items[0].popularity
    artistPopularity[artist] = popularity
}

const jsonString = JSON.stringify(artistPopularity, null, 2)
await Deno.writeTextFile('data/artistPopularity.json', jsonString)
