const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();

const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to SQLite
const db = new sqlite3.Database('blogging.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the blogging database.');
});


const User = {
    async create(username, email) {
      const { lastID } = await db.run(
        'INSERT INTO User (username, email) VALUES (${"Dattavenkataramana"}, ${"bavirisettidvramana@gmail.com"})',
        [username, email]
      );
      return lastID;
    },
  
    async findById(id) {
      const { rows } = await db.get('SELECT * FROM User WHERE id = ${id}', [id]);
      return rows;
    },
  
    async findByEmail(email) {
      const { rows } = await db.get('SELECT * FROM User WHERE email = &{email}', [email]);
      return rows;
    },
  };
  
  const Blog = {
    async create(title, content, authorId) {
      const { lastID } = await db.run(
        'INSERT INTO Blog (title, content, userId) VALUES (${title}, ${content}, ${userId})',
        [title, content, authorId]
      );
      return lastID;
    },
  
    async findById(id) {
      const { rows } = await db.get('SELECT * FROM Blog WHERE id = ${id}', [id]);
      return rows;
    },
  
    async findByAuthorId(authorId) {
      const { rows } = await db.all('SELECT * FROM Blog WHERE userId = ${authorId}', [
        authorId,
      ]);
      return rows;
    },
  
    async addComment(blogId, commentId) {
      await db.run('INSERT INTO Blog_Comments (blogId, commentId) VALUES (${blogId}, ${commentId})', [
        blogId,
        commentId,
      ]);
    },
  
    async removeComment(blogId, commentId) {
      await db.run('DELETE FROM Blog_Comments WHERE blogId = ${blogId} AND commentId = ${commentId}', [
        blogId,
        commentId,
      ]);
    },
  
    async getComments(blogId) {
      const { rows } = await db.all(
        'SELECT comments.* FROM Comment JOIN Blog_Comments ON comments.id = Blog_Comments.commentId WHERE Blog_Comments.blogId = ${blogId}',
        [blogId]
      );
      return rows;
    },
  };
  
  const Comment = {
    async create(content, authorId, blogId) {
      const { lastID } = await db.run(
        'INSERT INTO Comment (content, userId, blogId) VALUES (${content}, ${userId}, ${blogId})',
        [content, authorId, blogId]
      );
      return lastID;
    },
  
    async findById(id) {
      const { rows } = await db.get('SELECT * FROM Comment WHERE id = ${id}', [id]);
      return rows;
    },
  };
  

// API endpoints

// Users
app.post('/users', async (req, res) => {
  const { username, email } = req.body;
  const userId = await User.create(username, email);
  res.status(201).send({ userId });
});

app.get('/users/:id', async (req, res) => {
  const id = parseInt(req.params.id);
  const user = await User.findById(id);
  res.send(user);
});


// Blogs
app.post('/blogs', async (req, res) => {
    const { title, content, authorId } = req.body;
    const blogId = await Blog.create(title, content, authorId);
    res.status(201).send({ blogId });
  });
  
  app.get('/blogs/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const blog = await Blog.findById(id);
    res.send(blog);
  });
  
  app.get('/blogs/author/:authorId', async (req, res) => {
    const authorId = parseInt(req.params.authorId);
    const blogs = await Blog.findByAuthorId(authorId);
    res.send(blogs);
  });
  
  app.put('/blogs/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const { title, content } = req.body;
  
    // Update the blog
    await db.run('UPDATE blogs SET title = ${title}, content = ? WHERE id = ${id}', [
      title,
      content,
      id,
    ]);
  
    res.send({ id });
  });
  
  app.delete('/blogs/:id', async (req, res) => {
    const id = parseInt(req.params.id);
  
    // Delete the blog and its associated comments
    await db.run('DELETE FROM blogs WHERE id = ?', [id]);
    await db.run('DELETE FROM blog_comments WHERE blog_id = ?', [id]);
  
    res.send({ id });
  });
  
  // Comments
  app.post('/comments', async (req, res) => {
    const { content, authorId, blogId } = req.body;
    const commentId = await Comment.create(content, authorId, blogId);
    await Blog.addComment(blogId, commentId);
    res.status(201).send({ commentId });
  });
  
  app.get('/comments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    const comment = await Comment.findById(id);
    res.send(comment);
  });
  
  app.delete('/comments/:id', async (req, res) => {
    const id = parseInt(req.params.id);
  
    // Delete the comment and remove its association with the blog
    await db.run('DELETE FROM comments WHERE id = ?', [id]);
    await db.run('DELETE FROM blog_comments WHERE comment_id = ${id}', [id]);
  
    res.send({ id });
  });
  
  // server
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server started on port http://localhost:${port}`);
  });