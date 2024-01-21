exports.up = (pgm) => {
  pgm.addConstraint(
    'user_album_likes',
    'unique_user_id_album_id',
    'UNIQUE (user_id, album_id)',
  );
};

exports.down = (pgm) => {
  pgm.dropConstraint('user_album_likes', 'unique_user_id_album_id');
};
