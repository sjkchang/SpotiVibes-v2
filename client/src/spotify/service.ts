import axios from "axios";
import { authService } from "./AuthService";
import {
    Artist,
    Track,
    Playlist,
    RecentlyPlayed,
    SearchContent,
    Paging,
    Recommendations,
} from "spotify-types";
import { TopItemsQuery, TopTracksResponse, TopArtistsResponse } from "./types";
import { platform } from "os";
import { PlayIcon } from "@radix-ui/react-icons";

export async function getProfile() {
    let accessToken = authService.getToken();
    return fetch("https://api.spotify.com/v1/me", {
        headers: {
            Authorization: "Bearer " + accessToken,
        },
    }).then((response) => {
        return response.json();
    });
}

export async function getTopTracks(
    query: TopItemsQuery
): Promise<Array<Track>> {
    let accessToken = authService.getToken();

    return await axios
        .get("https://api.spotify.com/v1/me/top/tracks", {
            headers: {
                Authorization: "Bearer " + accessToken,
            },
            params: {
                time_range: query.time_range,
                limit: query.limit.toString(),
                offset: query.offset.toString(),
            },
        })
        .then(({ data }: { data: TopTracksResponse }) => {
            console.log("Data: ");
            console.log(data.items);
            return data.items;
        });
}

export async function getTopArtists(
    query: TopItemsQuery
): Promise<Array<Artist>> {
    let accessToken = authService.getToken();

    let items: Array<Artist> = await axios
        .get("https://api.spotify.com/v1/me/top/artists", {
            headers: {
                Authorization: "Bearer " + accessToken,
            },
            params: {
                time_range: query.time_range,
                limit: query.limit.toString(),
                offset: query.offset.toString(),
            },
        })
        .then(({ data }: { data: TopArtistsResponse }) => {
            return data.items;
        });
    return items;
}

export async function getTracks(uris: Array<string>): Promise<Array<Track>> {
    let accessToken = authService.getToken();

    let items: Array<Track> = await axios
        .get("https://api.spotify.com/v1/tracks", {
            headers: {
                Authorization: "Bearer " + accessToken,
            },
            params: {
                ids: uris.toString(),
            },
        })
        .then(({ data }: { data: any }) => {
            return data.tracks;
        });

    return items;
}

export async function getArtists(uris: Array<string>): Promise<Array<Artist>> {
    let accessToken = authService.getToken();

    let items: Array<Artist> = await axios
        .get("https://api.spotify.com/v1/artists", {
            headers: {
                Authorization: "Bearer " + accessToken,
            },
            params: {
                ids: uris.toString(),
            },
        })
        .then(({ data }: { data: any }) => {
            return data.artists;
        });

    return items;
}

export async function getPlaylists(limit = 20, offset = 0) {
    if (limit < 0 || limit > 50) throw Error("Invalid Limit:" + limit);
    if (offset < 0 || offset > 100_000) throw Error("Invalid Limit:" + limit);

    let args = new URLSearchParams();

    let items: Array<Playlist> = await axios
        .get("https://api.spotify.com/v1/me/playlists", {
            headers: {
                Authorization: "Bearer " + authService.getToken(),
            },
            params: {
                limit: limit,
                offset: offset,
            },
        })
        .then(({ data }: { data: any }) => {
            return data.items;
        });

    return items;
}

export async function getPlaylist(playlistId: string) {
    let [playlist, tracks] = await Promise.all([
        axios
            .get("https://api.spotify.com/v1/playlists/" + playlistId, {
                headers: {
                    Authorization: "Bearer " + authService.getToken(),
                },
            })
            .then(({ data }: { data: Playlist }) => {
                return data;
            }),
        axios
            .get(
                "https://api.spotify.com/v1/playlists/" +
                    playlistId +
                    "/tracks",
                {
                    headers: {
                        Authorization: "Bearer " + authService.getToken(),
                    },
                }
            )
            .then(({ data }: { data: any }) => {
                return data.items;
            }),
    ]);

    return [playlist, tracks];
}

export async function getArtist(artistId: string) {
    let [playlist, tracks] = await Promise.all([
        axios
            .get("https://api.spotify.com/v1/artists/" + artistId, {
                headers: {
                    Authorization: "Bearer " + authService.getToken(),
                },
            })
            .then(({ data }: { data: Artist }) => {
                return data;
            }),
        axios
            .get(
                "https://api.spotify.com/v1/artists/" +
                    artistId +
                    "/top-tracks",
                {
                    headers: {
                        Authorization: "Bearer " + authService.getToken(),
                    },
                    params: {
                        market: "US",
                    },
                }
            )
            .then(({ data }: { data: any }) => {
                return data.tracks;
            }),
    ]);

    return [playlist, tracks];
}

export async function getTrack(trackId: string) {
    let track = await axios
        .get("https://api.spotify.com/v1/tracks/" + trackId, {
            headers: {
                Authorization: "Bearer " + authService.getToken(),
            },
        })
        .then(({ data }: { data: Track }) => {
            return data;
        });

    return track;
}

export async function getRecentTracks() {
    let tracks = await axios
        .get("https://api.spotify.com/v1/me/player/recently-played", {
            headers: {
                Authorization: "Bearer " + authService.getToken(),
            },
        })
        .then(({ data }: { data: RecentlyPlayed }) => {
            let tracks: Array<Track> = [];
            for (let item of data.items) {
                tracks.push(item.track);
            }
            return tracks;
        });

    return tracks;
}

interface searchParams {
    queryString: string;
    type?: Array<String>;
    market?: string;
    limit?: number;
    offset?: number;
}

export interface SearchResult {
    tracks: Paging<Track>;
    artists: Paging<Artist>;
    playlists: Paging<Playlist>;
}

export async function searchSpotify({ queryString }: searchParams) {
    let q = encodeURIComponent(queryString);
    let type = ["artist", "track", "playlist"].toString();
    let tracks = await axios
        .get("https://api.spotify.com/v1/search", {
            headers: {
                Authorization: "Bearer " + authService.getToken(),
            },
            params: {
                q: queryString,
                type: type,
            },
        })
        .then(({ data }: { data: SearchResult }) => {
            return data;
        });

    return tracks;
}

export async function getGenres() {
    return await axios
        .get(
            "https://api.spotify.com/v1/recommendations/available-genre-seeds",
            {
                headers: {
                    Authorization: "Bearer " + authService.getToken(),
                },
            }
        )
        .then(({ data }: { data: { genres: Array<string> } }) => {
            return data.genres;
        });
}

export interface Min_Max_Target {
    min?: number;
    max?: number;
    target?: number;
}
interface GeneratePlaylistParams {
    playlistName?: string;
    playlistDescription?: string;
    seed_artists: Array<string>;
    seed_genres: Array<string>;
    seed_tracks: Array<string>;
    limit?: number;
    market?: string;
    track_features?: TrackFeatures;
}

export interface TrackFeatures {
    acousticness?: Min_Max_Target;
    danceability?: Min_Max_Target;
    duration_ms?: Min_Max_Target;
    energy?: Min_Max_Target;
    instrumentalness?: Min_Max_Target;
    key?: Min_Max_Target;
    liveness?: Min_Max_Target;
    loudness?: Min_Max_Target;
    mode?: Min_Max_Target;
    popularity?: Min_Max_Target;
    speechiness?: Min_Max_Target;
    tempo?: Min_Max_Target;
    time_signature?: Min_Max_Target;
    valence?: Min_Max_Target;
}

export async function generatePlaylist(params: GeneratePlaylistParams) {
    console.log("Top");
    let stringifySeeds = (
        seed_artists: Array<string>,
        seed_genres: Array<string>,
        seed_tracks: Array<string>
    ) => {
        let num_seeds =
            seed_artists.length + seed_genres.length + seed_tracks.length;
        if (num_seeds > 5 || num_seeds < 1) {
            throw Error("Needs 1 - 5 Seeds. You provided: " + num_seeds);
        }
        let artists = seed_artists.join(",");
        let genres = seed_genres.join(",");
        let tracks = seed_tracks.join(",");
        return {
            seed_artists: artists,
            seed_genres: genres,
            seed_tracks: tracks,
        };
    };

    let parseAudioFeatures = (features: TrackFeatures) => {
        console.log(features);

        let audio_features: any = {};

        for (let [featureName, feature] of Object.entries(features)) {
            if (feature) {
                if (feature.min) {
                    let min_feature = "min_" + featureName;
                    audio_features[min_feature] = feature.min;
                }
                if (feature.max) {
                    let max_feature = "max_" + featureName;
                    audio_features[max_feature] = feature.max;
                }
                if (feature.target) {
                    let target_feature = "target_" + featureName;
                    audio_features[target_feature] = feature.target;
                }
            }
        }

        return audio_features;
    };

    let audio_features = {};
    if (params.track_features) {
        console.log(audio_features);
        audio_features = parseAudioFeatures(params.track_features);
    }

    let seeds = stringifySeeds(
        params.seed_artists,
        params.seed_genres,
        params.seed_tracks
    );

    let accessToken = authService.getToken();

    let limit = params.limit || 20;
    console.log({
        limit: limit,
        ...seeds,
        ...audio_features,
    });
    let args = new URLSearchParams({
        limit: limit.toString(),
        ...seeds,
        ...audio_features,
    });

    let tracks = await axios
        .get("https://api.spotify.com/v1/recommendations?" + args, {
            headers: {
                Authorization: "Bearer " + accessToken,
            },
        })
        .then(({ data }: { data: Recommendations }) => {
            return data.tracks;
        });

    return tracks;
}
