const express = require('express');
const xss = require('xss');

const bookmarksRouter = express.Router();
const BookmarksService = require('./bookmarks-service');

// middleware setup
bookmarksRouter.use(express.json());

// sanitizing person data before it goes out
const sanitizeBookmark = bookmark => {
  return {
    id: bookmark.id,
    title: xss(bookmark.title),
    url: bookmark.url,
    description: xss(bookmark.description),
    rating: bookmark.rating
  };
};


// create records
bookmarksRouter.post('/', (req, res, next) => {
  const { title, url, rating, description } = req.body;
  const db = req.app.get('db');

  const requiredFields = ['title', 'url', 'rating'];
  for (let field of requiredFields) {
    if (!req.body[field]) {
      return res.status(400).send(`'${field}' is required`);
    }
  }

  if (!Number.isInteger(rating) || rating < 1 || rating > 5 ) {
    return res.status(400).send('Rating must be a number between 1 and 5');
  }

  const bookmarkToAdd = {title, url, rating, description}; 
  BookmarksService.addBookmark(db, bookmarkToAdd)
    .then(bookmark => {
      return res
        .status(201)
        .location(`/bookmarks/${bookmark.id}`)
        .json(sanitizeBookmark(bookmark));
    })
    .catch(next);
  
});


// read records
bookmarksRouter.get('/bookmarks', (req, res) => {
  const db = req.app.get('db');
  BookmarksService.getAllBookmarks(db)
    .then(bookmarks => {
      return res.status(200).json(bookmarks.map(sanitizeBookmark));
    });
});

bookmarksRouter.get('/bookmarks/:bookmark_id', (req, res) => {
  const { bookmark_id } = req.params;
  const db = req.app.get('db');

  BookmarksService.getBookmarkByID(db, bookmark_id)
    .then(bookmark => {
      if (!bookmark) {
        return res
          .status(404)
          .send('Bookmark Not Found');
      }

      return res.status(200).json(sanitizeBookmark(bookmark));

    });
  
});

module.exports = bookmarksRouter;