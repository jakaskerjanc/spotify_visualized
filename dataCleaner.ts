import { StreamingHistory, StreamingHistoryFull } from './types.ts'

const dataFolder = 'data/'

console.log('Looking for Streaming_History.json files in %s', dataFolder)

const doesDataFolderExist = await Deno.stat(dataFolder)
if (!doesDataFolderExist.isDirectory) {
    console.error('Data folder does not exist')
    Deno.exit(1)
}
const fileNames = await getStreamingHistoryFileNames()
console.log('Found %d Streaming_History.json files', fileNames.length)

const allStreamingHistory = await readStreamingHistoryFiles(fileNames)
writeToFile(allStreamingHistory)

function writeToFile(data: StreamingHistory[]) {
    const dataString = JSON.stringify(data)
    Deno.writeTextFile('data/cleanedStreamingHistory.json', dataString)
}

async function getStreamingHistoryFileNames() {
    const files = Deno.readDir(dataFolder)
    const endSongFiles = []

    for await (const file of files) {
        if (RegExp('Streaming_History_Audio_.*\.json').test(file.name)) {
            endSongFiles.push(file.name)
        }
    }
    return endSongFiles;
}

function renameAndRemoveKeys(endsongObject: StreamingHistoryFull): StreamingHistory {
    const renamedEndSong = {
        date: endsongObject.ts,
        artist: endsongObject.master_metadata_album_artist_name,
        track: endsongObject.master_metadata_track_name,
        album: endsongObject.master_metadata_album_album_name,
        time_played: endsongObject.ms_played,
        spotify_track_uri: endsongObject.spotify_track_uri
    }
    return renamedEndSong
}

async function readStreamingHistoryFiles(streamingHistoryfileNames: string[]) {
    const allStreamingHistoryArrays = await Promise.all(streamingHistoryfileNames.map(async (fileName) => {
        const fileContent = await Deno.readTextFile(dataFolder + fileName)
        const streamingHistoryArray = JSON.parse(fileContent) as StreamingHistoryFull[]
        return streamingHistoryArray
    }))
    const allStreamingHistory = allStreamingHistoryArrays.flat()

    const cleanedStreamingHistory = allStreamingHistory
        .filter(streamingHistoryEntry => streamingHistoryEntry.spotify_track_uri !== null)
        .map(renameAndRemoveKeys)

    return cleanedStreamingHistory
}
