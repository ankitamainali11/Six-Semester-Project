const mongoose = require('mongoose');

const opportunitySchema = new mongoose.Schema(
    {
        title:{
            type: String,
            required: true,
        },
        description:{
            type: String,
            required: true,
        },
        fullDescription:{
            type: String,
            required: true,
        },
        location:{
            type: String,
            required: true,
        },
        isRemote:{
            type: Boolean,
            default: false,
        },
        startDate:{
            type: Date,
            required: true,
        },
        endDate:{
            type: Date,
            required: true,
        },
        applicationDeadline:{
            type: Date,
        },
        timeCommitment:{
            type: String,
            required: true,
        },
        volunteersNeeded:{
            type: Number,
            required: true,
            min: 1,
        },
        requirements:{
            type: String,
        },
        requiredSkills:[String],
        skills:[String],
        benefits:[String],
        ageRequirement:{
            type: String,
        },
        accessibility:{
            type: String,
        },
        organization:{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        organizationName:{
            type: String,
            required: true,
        },
        applicants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
            },
        ],
        approvedVolunteers: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }],
        tags: [
            {
                type: String,
                trim: true,
                required: true
            }
        ],
        contactEmail:{
            type: String,
            required: true,
        },
        contactPhone:{
            type: String,
        },
        imageUrl:{
            type: String,
        },
        status:{
            type: String,
            enum: ['active', 'inactive', 'completed', 'cancelled'],
            default: 'active',
        },
    },
    {
        timestamps: true,
    }    
);

module.exports = mongoose.model("Opportunity", opportunitySchema);