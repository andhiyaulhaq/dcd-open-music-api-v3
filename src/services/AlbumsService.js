const { Pool } = require('pg');
const { nanoid } = require('nanoid');
const InvariantError = require('../exceptions/InvariantError');
const NotFoundError = require('../exceptions/NotFoundError');

class AlbumsService {
  constructor(cacheService) {
    this.pool = new Pool();
    this.cacheService = cacheService;
  }

  async addAlbum(name, year) {
    const generatedId = nanoid(16);
    const id = `album-${generatedId}`;

    const query = {
      text: 'INSERT INTO albums VALUES($1, $2, $3) RETURNING id',
      values: [id, name, year],
    };

    const result = await this.pool.query(query);

    if (!result.rows[0].id) {
      throw new InvariantError('Album gagal ditambahkan');
    }

    return result.rows[0].id;
  }

  async getAlbumById(id) {
    try {
      const result = await this.cacheService.get(`album:${id}`);
      return { albumProps: JSON.parse(result), albumCache: true };
    } catch {
      const query = {
        text: 'SELECT * FROM albums WHERE id=$1',
        values: [id],
      };
      const result = await this.pool.query(query);

      if (!result.rows.length) {
        throw new NotFoundError('Album tidak ditemukan');
      }

      await this.cacheService.set(
        `album:${id}`,
        JSON.stringify(result.rows[0]),
      );

      return { albumProps: result.rows[0], albumCache: false };
    }
  }

  async getSongsByAlbumId(albumId) {
    const query = {
      text: 'SELECT id, title, performer FROM songs WHERE album_id=$1',
      values: [albumId],
    };

    const result = await this.pool.query(query);

    return result.rows;
  }

  async editAlbumById(id, { name, year }) {
    const query = {
      text: 'UPDATE albums SET name=$1, year=$2 WHERE id=$3 RETURNING id',
      values: [name, year, id],
    };
    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album. Id tidak ditemukan');
    }

    try {
      await this.cacheService.delete(`album:${id}`);
    } catch {
      throw new InvariantError('Album gagal diperbarui');
    }
  }

  async deleteAlbumById(id) {
    const query = {
      text: 'DELETE FROM albums WHERE id=$1 RETURNING id',
      values: [id],
    };

    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Album gagal dihapus. Id tidak ditemukan');
    }

    try {
      await this.cacheService.delete(`album:${id}`);
    } catch {
      throw new InvariantError('Album gagal dihapus');
    }
  }

  async editAlbumCoverById(id, cover) {
    const query = {
      text: 'UPDATE albums SET cover = $1 WHERE id = $2 RETURNING id',
      values: [cover, id],
    };
    const result = await this.pool.query(query);

    if (!result.rows.length) {
      throw new NotFoundError('Gagal memperbarui album.');
    }

    try {
      await this.cacheService.delete(`album:${id}`);
    } catch {
      throw new InvariantError('Cover album gagal diunggah');
    }
  }

  async addAlbumLikesById(userId, albumId) {
    try {
      const query = {
        text: 'INSERT INTO user_album_likes (user_id, album_id) VALUES ($1, $2)',
        values: [userId, albumId],
      };
      await this.pool.query(query);
      await this.cacheService.delete(`albumLikes:${albumId}`);
    } catch {
      throw new InvariantError('Album gagal disukai');
    }
  }

  async verifyAlbumExists(albumId) {
    const query = {
      text: 'SELECT * FROM albums WHERE id = $1',
      values: [albumId],
    };

    const result = await this.pool.query(query);

    if (result.rowCount < 1) {
      throw new NotFoundError('Resource yang Anda minta tidak ditemukan');
    }
  }

  async getAlbumLikesById(albumId) {
    try {
      const result = await this.cacheService.get(`albumLikes:${albumId}`);
      return { count: JSON.parse(result), cache: true };
    } catch {
      const query = {
        text: 'SELECT * FROM user_album_likes WHERE album_id = $1',
        values: [albumId],
      };
      const result = await this.pool.query(query);

      await this.cacheService.set(
        `albumLikes:${albumId}`,
        JSON.stringify(result.rowCount),
      );

      return { count: result.rowCount, cache: false };
    }
  }

  async deleteAlbumLikesById(userId, albumId) {
    try {
      const query = {
        text: 'DELETE FROM user_album_likes WHERE user_id = $1 AND album_id = $2',
        values: [userId, albumId],
      };
      await this.pool.query(query);
      await this.cacheService.delete(`albumLikes:${albumId}`);
    } catch {
      throw new InvariantError('Gagal membatalkan menyukai album');
    }
  }
}

module.exports = AlbumsService;
