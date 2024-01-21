const autoBind = require('auto-bind');

class AlbumsHandler {
  constructor(albumsService, storageService, validator) {
    this.albumsService = albumsService;
    this.storageService = storageService;
    this.validator = validator;

    autoBind(this);
  }

  async postAlbumHandler(request, h) {
    this.validator.validateAlbumPayload(request.payload);
    const { name, year } = request.payload;

    const albumId = await this.albumsService.addAlbum(name, year);

    const response = h.response({
      status: 'success',
      data: {
        albumId,
      },
    });

    response.code(201);
    return response;
  }

  async getAlbumByIdHandler(request, h) {
    const { id } = request.params;
    const { albumProps, albumCache } = await this.albumsService.getAlbumById(
      id,
    );
    const songs = await this.albumsService.getSongsByAlbumId(id);
    const coverUrl = albumProps.cover !== null ? `http://localhost:5000/albums/images/${albumProps.cover}` : null;

    const response = h.response({
      status: 'success',
      data: {
        album: {
          id: albumProps.id,
          name: albumProps.name,
          year: albumProps.year,
          coverUrl,
          songs,
        },
      },
    });

    if (albumCache) response.headers['X-Data-Source'] = 'cache';

    return response;
  }

  async putAlbumByIdHandler(request) {
    this.validator.validateAlbumPayload(request.payload);
    const { id } = request.params;

    await this.albumsService.editAlbumById(id, request.payload);

    return {
      status: 'success',
      message: 'Album berhasil diperbarui',
    };
  }

  async deleteAlbumByIdHandler(request) {
    const { id } = request.params;
    await this.albumsService.deleteAlbumById(id);

    return {
      status: 'success',
      message: 'Album berhasil dihapus',
    };
  }

  async postAlbumCoverByIdHandler(request, h) {
    const { id } = request.params;
    const { cover: data } = request.payload;
    this.validator.validateAlbumCoverHeaders(data.hapi.headers);

    const filename = +new Date() + data.hapi.filename;

    await this.albumsService.editAlbumCoverById(id, filename);
    await this.storageService.writeFile(data, filename);

    const response = h.response({
      status: 'success',
      message: 'Sampul berhasil diunggah',
    });
    response.code(201);
    return response;
  }

  async postAlbumLikesByIdHandler(request, h) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this.albumsService.verifyAlbumExists(albumId);
    await this.albumsService.addAlbumLikesById(userId, albumId);

    const response = h.response({
      status: 'success',
      message: 'Berhasil menyukai album',
    });
    response.code(201);
    return response;
  }

  async deleteAlbumLikesByIdHandler(request) {
    const { id: albumId } = request.params;
    const { id: userId } = request.auth.credentials;

    await this.albumsService.deleteAlbumLikesById(userId, albumId);

    return {
      status: 'success',
      message: 'Berhasil membatalkan menyukai album',
    };
  }

  async getAlbumLikesByIdHandler(request, h) {
    const { id: albumId } = request.params;
    const likes = await this.albumsService.getAlbumLikesById(albumId);

    const response = h.response({
      status: 'success',
      data: {
        likes: likes.count,
      },
    });

    if (likes.cache) response.headers['X-Data-Source'] = 'cache';

    return response;
  }
}

module.exports = AlbumsHandler;
