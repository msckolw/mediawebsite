const express = require('express');
const router = express.Router();
const News = require('../models/News');
const SourceType = require('../models/SourceType');

const { validateJWT } = require('../utils/validateToken');

const mongoose = require('mongoose');


// Get all articles
router.get('/news', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit; 

    const articles = await News
      .find({}, {source: false})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalArticles = await News.countDocuments(); 

    res.status(200).json({
      articles,
      currentPage: page,
      totalPages: Math.ceil(totalArticles / limit)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get('/category/:cat', async (req, res) => {
  try {

    const page = parseInt(req.query.page) || 1; 
    const limit = 10; 
    const skip = (page - 1) * limit;

    let cat = req.params.cat;
    if (!cat) return res.status(400).json({ message: 'Category is Mandatory!' });
    const articles = await News
    .find({
      category: new RegExp(`^${cat}$`, 'i')}, {source: false})
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);  

    const totalArticles = await News.countDocuments({
      category: new RegExp(`^${cat}$`, 'i')
    });

    res.status(200).json({
      articles,
      currentPage: page,
      totalPages: Math.ceil(totalArticles / limit)
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get a single article
router.get('/news/:id', async (req, res) => {
  try {
    //const article = await News.findById(req.params.id);
    let souce_page = req.query.source=='true' ? true : false;

    if(souce_page) {

      //let {message, code} = validateJWT(req.headers.authorization);
      let {message, code} = validateJWT(req.cookies.access_token);

      if(code!=1) {
        return res.status(code).json({message});
      }      

    }

    const article = await News.find({_id: req.params.id},{source: souce_page});
    if (!article) return res.status(400).json({ message: 'Article not found' });
    res.status(200).json(article[0]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create a new article
router.post('/news', async (req, res) => {
  try {
    // console.log('Received article data:', req.body);

    //JWT Validation
    //let {message, code, role} = validateJWT(req.headers.authorization);
    let {message, code, role} = validateJWT(req.cookies.access_token);

    if(code!=1) {
      return res.status(code).json({message});
    }

    if(role!='admin') {
      return res.status(401).json({message: 'You are not Authorized!'})
    }
    
    // Validate required fields
    if (!req.body.title || !req.body.content || !req.body.summary || !req.body.category) {
      return res.status(400).json({ 
        message: 'Missing required fields',
        received: req.body
      });
    }

    const article = new News({
      title: req.body.title,
      content: req.body.content,
      summary: req.body.summary,
      imageUrl: req.body.imageUrl || 'https://placehold.co/300x200?text='+req.body.title.split(' ').join('+'),
      category: req.body.category.toLowerCase(),
      createdAt: new Date().toISOString(),
      source: req.body.source
    });

    //console.log('Creating article:', article);
    const newArticle = await article.save();
    console.log('Article created successfully:', newArticle);
    
    res.status(201).json(newArticle);
  } catch (error) {
    console.error('Error creating article:', error);
    res.status(400).json({ 
      message: error.message,
      error: error
    });
  }
});


// Update Existing Article

router.put('/news', async (req, res) => {
  
  try {

    //JWT Validation
    //let {message, code, role} = validateJWT(req.headers.authorization);
    let {message, code, role} = validateJWT(req.cookies.access_token);

    if(code!=1) {
      return res.status(code).json({message});
    }

    if(role!='admin') {
      return res.status(401).json({message: 'You are not Authorized!'})
    }

    if(!req.body._id)
      return res.status(400).json({ message: 'Article Id Required' });

    const foundArticle = await News.find({_id: req.body._id});
    let ogArticle = 
    {
      title: foundArticle[0].title,
      content: foundArticle[0].content,
      summary: foundArticle[0].summary,
      imageUrl: foundArticle[0].imageUrl,
      category: foundArticle[0].category,
      source: foundArticle[0].source
    };

    const updatedArticle = await News.findByIdAndUpdate(
      req.body._id,
      {
        title: req.body.title || ogArticle.title,
        content: req.body.content || ogArticle.content,
        summary: req.body.summary || ogArticle.summary,
        imageUrl: req.body.imageUrl || ogArticle.imageUrl,
        category: ogArticle.category,
        updatedAt: new Date().toISOString(),
        source: req.body.source || ogArticle.source
      },
      { new: true }
    );

    console.log('Updated article:', updatedArticle);

    if (!updatedArticle) {
      return res.status(400).json({ message: 'Article not found' });
    }

    res.status(200).json(updatedArticle);

  } catch (error) {
    console.error('Error updating article:', error);
    res.status(400).json({ 
      message: error.message,
      error: error
    });
  }
});

// Delete an article
router.delete('/news/:id', async (req, res) => {
  try {

    //JWT Validation
    //let {message, code, role} = validateJWT(req.headers.authorization);
    let {message, code, role} = validateJWT(req.cookies.access_token);

    if(code!=1) {
      return res.status(code).json({message});
    }

    if(role!='admin') {
      return res.status(401).json({message: 'You are not Authorized!'})
    }

    const article = await News.findByIdAndDelete(req.params.id);
    if (!article) return res.status(400).json({ message: 'Article not found' });
    res.status(200).json({ message: 'Article deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete all articles
router.delete('/news', async (req, res) => {
  try {

    //JWT Validation
    //let {message, code, role} = validateJWT(req.headers.authorization);
    let {message, code, role} = validateJWT(req.cookies.access_token);

    if(code!=1) {
      return res.status(code).json({message});
    }

    if(role!='admin') {
      return res.status(401).json({message: 'You are not Authorized!'})
    }

    let idsToDelete = req.body._id;
    if (!idsToDelete || !idsToDelete.length) 
      return res.status(400).json({ message: 'Article Id(s) required' });
    const objectIds = idsToDelete.map(id => mongoose.Types.ObjectId(id));
    await News.deleteMany({ _id: { $in: objectIds } });
    res.status(200).json({ message: 'Article(s) deleted successfully' });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Get all sources type
router.get('/source', async (req, res) => {
  try {
    const srcList = await SourceType.find().sort({ createdAt: -1 });
    res.status(200).json(srcList);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});


// Create a new source type
router.post('/source', async (req, res) => {
  try {
    
    console.log('Received source type:', req.body);

    //JWT Validation
    //let {message, code, role} = validateJWT(req.headers.authorization);
    let {message, code, role} = validateJWT(req.cookies.access_token);

    if(code!=1) {
      return res.status(code).json({message});
    }

    if(role!='admin') {
      return res.status(401).json({message: 'You are not Authorized!'})
    }

    // Validate required field
    if (!req.body.source_type || !req.body.source_type.length) {
      return res.status(400).json({ 
        message: 'Source Type cannot be empty!',
        received: req.body
      });
    }

    const src = new SourceType({
      source_type: req.body.source_type,
      createdAt: new Date().toISOString(),
    });
    const saved = await src.save();

    console.log('Inserted documents:', saved);

    res.status(201).json(saved);

  } catch (error) {
    console.error('Error creating source type:', error);
    res.status(400).json({ 
      message: error.message,
      error: error
    });
  }

});


module.exports = router;
