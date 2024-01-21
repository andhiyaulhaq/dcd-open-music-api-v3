const autoBind = require('auto-bind');

class PlaylistsHandler {
  constructor(playlistsService, songsService, validator) {
    this.playlistsService = playlistsService;
    this.songsService = songsService;
    this.validator = validator;

    autoBind(this);
  }

  async postPlaylistHandler(request, h) {
    this.validator.validatePostPlaylistPayload(request.payload);
    const { name } = request.payload;
    const { id: credentialId } = request.auth.credentials;

    const playlistId = await this.playlistsService.addPlaylist({
      name,
      owner: credentialId,
    });

    const response = h.response({
      status: 'success',
      data: {
        playlistId,
      },
    });

    response.code(201);
    return response;
  }

  async getPlaylistsHandler(request) {
    const { id: credentialId } = request.auth.credentials;
    const playlists = await this.playlistsService.getPlaylists(credentialId);
    return {
      status: 'success',
      data: {
        playlists,
      },
    };
  }

  async deletePlaylistHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.verifyPlaylistOwner(playlistId, credentialId);
    await this.playlistsService.deletePlaylist(playlistId);

    return {
      status: 'success',
      message: 'Playlist berhasil dihapus',
    };
  }

  async postSongToPlaylistHandler(request, h) {
    this.validator.validatePostSongToPlaylistPayload(request.payload);
    const { id: userId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const time = new Date().toISOString();

    const action = request.method === 'post' ? 'add' : 'delete';

    await this.playlistsService.verifyPlaylistAccess(playlistId, userId);
    await this.songsService.verifySongExists(songId);

    await this.playlistsService.addSongToPlaylist(playlistId, songId);
    await this.playlistsService.addPlaylistActivity(
      playlistId,
      songId,
      userId,
      action,
      time,
    );

    const response = h.response({
      status: 'success',
      message: 'Song berhasil ditambahkan ke playlist',
    });
    response.code(201);
    return response;
  }

  async getSongsFromPlaylistHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;
    await this.playlistsService.verifyPlaylistAccess(playlistId, credentialId);
    const playlist = await this.playlistsService.getSongsFromPlaylist(
      playlistId,
    );

    return {
      status: 'success',
      data: {
        playlist,
      },
    };
  }

  async deleteSongFromPlaylistHandler(request) {
    this.validator.validateDeleteSongFromPlaylistPayload(request.payload);
    const { id: userId } = request.auth.credentials;
    const { id: playlistId } = request.params;
    const { songId } = request.payload;
    const action = request.method;
    const time = new Date().toISOString();

    await this.playlistsService.verifyPlaylistAccess(playlistId, userId);
    await this.songsService.verifySongExists(songId);

    await this.playlistsService.deleteSongFromPlaylist(playlistId, songId);
    await this.playlistsService.addPlaylistActivity(
      playlistId,
      songId,
      userId,
      action,
      time,
    );

    return {
      status: 'success',
      message: 'Song berhasil dihapus dari playlist',
    };
  }

  async getPlaylistActivitiesHandler(request) {
    const { id: playlistId } = request.params;
    const { id: credentialId } = request.auth.credentials;

    await this.playlistsService.verifyPlaylistAccess(playlistId, credentialId);

    const activities = await this.playlistsService.getPlaylistActivities(
      playlistId,
    );

    return {
      status: 'success',
      data: {
        playlistId,
        activities,
      },
    };
  }
}

module.exports = PlaylistsHandler;
