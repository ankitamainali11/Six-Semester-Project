const Tag = require('../models/Tag');

exports.createTag = async(req, res)=>{
    try{
        const {name, weight} = req.body;

        const existingTag = await Tag.findOne({ name });
        if (existingTag) return res.json(400).json({message:'Tag already exists'});

        const tag = new Tag({name, weight});
        await tag.save();
        
        res.status(201).json({message: 'Tag created', tag});
    } catch(err){
        json.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.getAllTags = async(req, res)=>{
    try{
        const tags = await Tag.find();
        res.status(200).json(tags);
    } catch (err){
        res.status(500).json({ message: 'Server error', error: err.message});
    }
};