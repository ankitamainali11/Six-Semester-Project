const mongoose = require('mongoose');

const tagSchema = new mongoose.Schema({
    name:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    weight :{
        type: Number,
        default: 1
    }
});

// Pre-save hook to ensure name is lowercase
tagSchema.pre('save', function(next) {
    if (this.name) {
        this.name = this.name.toLowerCase().trim();
    }
    next();
});

module.exports = mongoose.model('Tag', tagSchema);