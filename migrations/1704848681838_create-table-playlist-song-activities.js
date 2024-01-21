exports.up = (pgm) => {
  pgm.createTable('playlist_song_activities', {
    id: {
      type: 'SERIAL',
      primaryKey: true,
    },
    playlist_id: {
      type: 'VARCHAR(25)',
      notNull: true,
      references: 'playlists(id)',
      onDelete: 'CASCADE',
    },
    song_id: {
      type: 'VARCHAR(25)',
      notNull: true,
      references: 'songs(id)',
      onDelete: 'CASCADE',
    },
    user_id: {
      type: 'VARCHAR(25)',
      notNull: true,
      references: 'users(id)',
      onDelete: 'CASCADE',
    },
    action: {
      type: 'VARCHAR(6)',
      notNull: 'CASCADE',
    },
    time: {
      type: 'TEXT',
      notNull: 'CASCADE',
    },
  });
};

exports.down = (pgm) => {
  pgm.dropTable('playlist_song_activities');
};
