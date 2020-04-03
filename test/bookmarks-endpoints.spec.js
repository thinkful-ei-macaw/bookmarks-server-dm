const knex = require('knex');
const app = require('../src/app');
const { TEST_DB_URL } = require('../src/config');

const { makeBookmarksArray, randomBookmark } = require('./bookmarks.fixtures');

describe('Bookmarks endpoints', () => {
  let db;

  before('set up db instance', () => {
    db = knex({
      client: 'pg',
      connection: TEST_DB_URL
    });

    app.set('db', db);
  });

  const cleanBookmarks = () => db.from('bookmarks').truncate();
  before('clean the table', cleanBookmarks);
  afterEach('clean the table', cleanBookmarks);

  after('disconnect from the db', () => db.destroy());


  // POST requests (CREATE)
  describe.only('POST /bookmarks', () => {
    beforeEach('clean the table', cleanBookmarks);

    it('responds with 201 and posts item to the database', () => {
      const testBookmark = randomBookmark();
      return supertest(app)
        .post('/bookmarks')
        .send(testBookmark)
        .expect(201)
        .expect(res => {
          expect(res.body.title).to.equal(testBookmark.title);
          expect(res.body.url).to.equal(testBookmark.url);
          expect(res.body.rating).to.equal(testBookmark.rating);
          expect(res.body.description).to.equal(testBookmark.description);
          expect(res.body).to.have.property('id');
          expect(res.headers.location).to.equal(`/bookmarks/${res.body.id}`);
        })
        .then(res => {
          supertest(app)
            .get(`/bookmarks/${res.body.id}`)
            .expect(res.body);
        });
    });

    const requiredFields = ['title', 'url', 'rating'];
    requiredFields.forEach(field => {
      
      it(`returns 400 when required field '${field}' is omitted`, () => {
        const testBookmark = randomBookmark();
        delete testBookmark[field];

        return supertest(app)
          .post('/bookmarks')
          .send(testBookmark)
          .expect(400, `'${field}' is required`);

      });

    });

    it('returns 400 when rating provided is not a number between 1 and 5', () => {
      const testBookmark = randomBookmark();
      testBookmark.rating = 'hello';

      return supertest(app)
        .post('/bookmarks')
        .send(testBookmark)
        .expect(400, 'Rating must be a number between 1 and 5');
    });

  });


  // GET requests (READ)
  context('Given bookmarks exist in the table', () => {
    const testBookmarks = makeBookmarksArray();

    beforeEach(() => {
      return db
        .into('bookmarks')
        .insert(testBookmarks);
    });

    it('GET /bookmarks responds with 200 and an array of bookmarks', () => {
      supertest(app)
        .get('/bookmarks')
        .expect(200, testBookmarks);
    });

    it('GET /bookmarks/:bookmark_id responds with 200 and the specified bookmark', () => {
      const bookmark_id = 2;
      const testBookmark = testBookmarks[bookmark_id - 1];

      supertest(app)
        .get(`/bookkmarks/${bookmark_id}`)
        .expect(200, testBookmark);
    });

  });

  context('Given no bookmarks', () => {
    it('GET /bookmarks responds with 200 and an empty array', () => {
      supertest(app)
        .get('/bookmarks')
        .expect(200, []);
    });

    it('GET /bookmarks/:bookmark_id responds with 404', () => {
      const bookmark_id = 2;

      supertest(app)
        .get(`/bookkmarks/${bookmark_id}`)
        .expect(404, 'Bookmark Not Found');
    });
  });

  describe.only('DELETE /bookmarks/:id', () => {
    context(`Given no bookmarks`, () => {
      it(`responds 404 when bookmark doesn't exist`, () => {
        return supertest(app)
          .delete(`/bookmarks/123`)
          .set('Authorization', `Bearer ${process.env.API_TOKEN}`)
          .expect(404, {
            error: { message: `Bookmark Not Found` }
          })
      })
    })

  context('Given no bookmarks in the table', ()=>{
    const testBookmarks = makeBookmarksArray()

    beforeEach('insert bookmarks', ()=> {
      return db
      .into('bookmarks')
      .insert(testBookmarks)
    })

    it('removes the bookmark', () => {
      const idToRemove = 2
      const expectedBookmarks = testBookmarks.filter(bookmark => bookmark.id !== idToRemove)
             return supertest(app)
               .delete(`/bookmarks/${idToRemove}`)
               .set ('Authorisation', `Bearer ${process.env.API_TOKEN}`)
               .expect(204)
               .then(() =>
                 supertest(app)
                   .get(`/bookmarks`)
                   .set ('Authorisation', `Bearer ${process.env.API_TOKEN}`)
                   .expect(expectedBookmarks)
               )
    })
  })
})

});