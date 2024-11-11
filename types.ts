export type Artist = string
export type Track = string
export type Album = string
export type SpotifyTrackUri = string

export type Month = string
export type MinutesPlayed = number

export type ArtistPlaytime = { [key: Artist]: MinutesPlayed }
export type MonthlyArtistPlaytime = { [key: Month]: ArtistPlaytime }

export type StreamingHistory = {
    date: string,
    artist: Artist,
    track: Track,
    album: Album,
    time_played: number,
    spotify_track_uri: SpotifyTrackUri
}

export type StreamingHistoryFull = {
    ts: string;
    username: string;
    platform: string;
    ms_played: number;
    conn_country: string;
    ip_addr_decrypted: string;
    user_agent_decrypted: string;
    master_metadata_track_name: string;
    master_metadata_album_artist_name: string;
    master_metadata_album_album_name: string;
    spotify_track_uri: string;
    episode_name: string | null;
    episode_show_name: string | null;
    spotify_episode_uri: string | null;
    reason_start: string;
    reason_end: string;
    shuffle: boolean;
    skipped: string | null;
    offline: string;
    offline_timestamp: string;
    incognito_mode: string;
}