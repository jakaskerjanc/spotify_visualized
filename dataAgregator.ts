import { StreamingHistory, MonthlyArtistPlaytime, ArtistPlaytime } from './types.ts'

async function readCleanedData() {
    const data = await Deno.readTextFile('data/cleanedStreamingHistory.json')
    const parsedData: StreamingHistory[] = JSON.parse(data)
    return parsedData
}

const spotifyData = await readCleanedData()
const monthlyArtistPlaytime: MonthlyArtistPlaytime = {}

spotifyData.forEach(({ artist, date, time_played }) => {
    const monthKey = date.substring(0, 7) // Date in format 'YYYY-MM'
    const artistMapForMonth: ArtistPlaytime = monthlyArtistPlaytime[monthKey] || {}
    const currentSeconds = artistMapForMonth[artist] || 0
    artistMapForMonth[artist] = currentSeconds + time_played
    monthlyArtistPlaytime[monthKey] = artistMapForMonth
})

const sortedMonths = Object.keys(monthlyArtistPlaytime).sort()

const cumulativeMonthlyArtistPlaytime = sortedMonths.reduce<MonthlyArtistPlaytime>((acc, month, index) => {
    const currentMonthData = monthlyArtistPlaytime[month]

    if (index == 0) {
        acc[month] =  currentMonthData
        return acc
    }

    const prevMonth = sortedMonths[index - 1]
    const prevMonthCumulativeData = { ...acc[prevMonth]! }

    Object.entries(currentMonthData).forEach(([artist, minutes]) => {
        if (artist in prevMonthCumulativeData) {
            prevMonthCumulativeData[artist] = prevMonthCumulativeData[artist] + minutes
        } else {
            prevMonthCumulativeData[artist] = minutes
        }
    })

    acc[month] = prevMonthCumulativeData
    return acc
}, {})


const jsonString = JSON.stringify(cumulativeMonthlyArtistPlaytime, null, 2)
await Deno.writeTextFile('data/cumulativeListeningTime.json', jsonString)

console.log('\nCumulative results written to data/cumulativeListeningTime.json')
