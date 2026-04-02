const Opportunity = require('../models/Opportunity');
const User = require('../models/User');
const Tag = require('../models/Tag'); // Added Tag model import
const {recommendCosineBased} = require('../utils/recommendCosine');
const sendEmail = require('../utils/sendEmail');

exports.createOpportunity = async (req, res)=>{
    console.log('=== CREATE OPPORTUNITY DEBUG ===');
    console.log('Request body:', req.body);
    console.log('User:', req.user);
    
    const {
        title, 
        description, 
        fullDescription,
        location, 
        isRemote,
        startDate, 
        endDate, 
        applicationDeadline,
        timeCommitment,
        volunteersNeeded,
        requirements,
        ageRequirement,
        accessibility,
        tags,
        contactEmail,
        contactPhone,
        imageUrl
    } = req.body;

    if(req.user.role !== 'organization'){
        return res.status(403).json({message: 'Only organizations can create opportunities'});
    }

    try{
        // Process tags: convert to lowercase and remove duplicates
        let processedTags = [];
        if (tags && tags.length > 0) {
            processedTags = [...new Set(tags.map(tag => tag.toLowerCase().trim()))];
        }
        
        console.log('Original tags:', tags);
        console.log('Processed tags:', processedTags);

        // Create the opportunity with all the fields
        const opportunity = new Opportunity({
            title,
            description,
            fullDescription,
            location,
            isRemote: isRemote || false,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            applicationDeadline: applicationDeadline ? new Date(applicationDeadline) : undefined,
            timeCommitment,
            volunteersNeeded: parseInt(volunteersNeeded),
            requirements,
            ageRequirement,
            accessibility,
            organization: req.user._id,
            organizationName: req.user.name,
            tags: processedTags,
            contactEmail,
            contactPhone,
            imageUrl,
            status: 'active'
        });

        console.log('Opportunity object to save:', opportunity);

        await opportunity.save();
        console.log('Opportunity saved successfully with ID:', opportunity._id);
        console.log('Opportunity tags after save:', opportunity.tags);

        // If there are tags, add them to the Tags collection
        if (processedTags.length > 0) {
            for (const tagName of processedTags) {
                try {
                    // Check if tag already exists, if not create it
                    const savedTag = await Tag.findOneAndUpdate(
                        { name: tagName },
                        { name: tagName },
                        { upsert: true, new: true }
                    );
                    console.log('Tag saved/updated:', savedTag);
                } catch (tagError) {
                    console.error('Error creating tag:', tagError);
                    // Continue with opportunity creation even if tag creation fails
                }
            }
        }

        console.log('=== OPPORTUNITY CREATION COMPLETE ===');
        res.status(201).json({ 
            message: 'Opportunity created successfully', 
            opportunity 
        });
    } catch (err){
        console.error('Error creating opportunity:', err);
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.getAllOpportunities = async (req, res)=>{
    try{
        const opportunities = await Opportunity.find({}, '-applicants').populate('organization', 'name email');
        res.json(opportunities);
    } catch(err){
        console.error('Error in getAllOpportunities:', err);
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.getOpportunityById = async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id)
            .populate('organization', 'name email')
            .populate('applicants', 'name email');
        
        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }
        
        res.json(opportunity);
    } catch (err) {
        console.error('Error in getOpportunityById:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getOpportunityTags = async (req, res) => {
    try {
        const opportunity = await Opportunity.findById(req.params.id);
        
        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }
        
        res.json({ 
            opportunityId: opportunity._id,
            title: opportunity.title,
            tags: opportunity.tags || [],
            tagsCount: opportunity.tags ? opportunity.tags.length : 0
        });
    } catch (err) {
        console.error('Error in getOpportunityTags:', err);
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.getMyOpportunities = async (req, res)=>{
    try{
        if (req.user.role != 'organization'){
            return res.status(403).json({message: 'only organization can view this'});
        }

        const opportunities = await Opportunity.find({organization: req.user._id});
        res.json({opportunities});
    } catch (err){
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

// Return opportunities the current volunteer has applied to
exports.getMyApplications = async (req, res) => {
    try {
        if (req.user.role !== 'volunteer' && req.user.role !== 'admin'){
            return res.status(403).json({ message: 'Only volunteers or admins can view this' });
        }

        const opportunities = await Opportunity
            .find({ applicants: req.user._id })
            .populate('organization', 'name email');

        res.json({ opportunities });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.applyToOpportunity = async (req,res)=>{
    try {
        console.log('=== APPLY TO OPPORTUNITY DEBUG ===');
        console.log('User ID:', req.user._id);
        console.log('User role:', req.user.role);
        console.log('Opportunity ID:', req.params.id);

        if (req.user.role !== 'volunteer' && req.user.role !== 'admin'){
            return res.status(403).json({message: 'Only volunteers or admins can apply'});
        }

        // Require verified email before applying
        if (!req.user.isVerified) {
            return res.status(403).json({ message: 'Please verify your email before applying' });
        }

        const opportunity = await Opportunity.findById(req.params.id);
        console.log('Found opportunity:', opportunity ? 'Yes' : 'No');
        console.log('Opportunity details:', opportunity);

        if(!opportunity){
            return res.status(404).json({message: 'Opportunity not found'});
        }
        if(opportunity.applicants.includes(req.user._id)){
            return res.status(400).json({message:'You may have already applied'});
        }

        // Add opportunity to applicants
        opportunity.applicants.push(req.user._id);
        await opportunity.save();
        console.log('User added to applicants list');

        // Add opportunity tags to user interests (no duplicates, all lowercase)
        console.log('Checking opportunity tags:', opportunity.tags);
        console.log('Tags length:', opportunity.tags ? opportunity.tags.length : 0);
        
        if (opportunity.tags && opportunity.tags.length > 0) {
            const user = await User.findById(req.user._id);
            console.log('Found user:', user ? 'Yes' : 'No');
            console.log('User current interests:', user.interests);
            
            const newInterests = opportunity.tags.map(tag => tag.toLowerCase().trim());
            
            console.log('=== ADDING TAGS TO USER INTERESTS ===');
            console.log('Opportunity tags:', opportunity.tags);
            console.log('New interests (lowercase):', newInterests);
            console.log('User current interests:', user.interests);
            
            // Merge with existing interests, removing duplicates
            const updatedInterests = [...new Set([...user.interests, ...newInterests])];
            user.interests = updatedInterests;
            await user.save();
            
            console.log('Updated user interests:', user.interests);
            console.log('=== TAGS ADDED TO INTERESTS ===');
        } else {
            console.log('No tags found on opportunity, skipping interest update');
        }

        // Notify organization via email with volunteer details
        try {
            const org = await User.findById(opportunity.organization).select('name email');
            const volunteer = await User.findById(req.user._id).select('name email phone location');
            const recipient = opportunity.contactEmail || org?.email;
            console.log('Notify org email - resolved recipient:', recipient, 'orgId:', org?._id?.toString());
            if (recipient) {
                const emailText = `Hello ${org?.name || 'Organization'},

A volunteer has just applied to your opportunity: ${opportunity.title}

Volunteer details:
- Name: ${volunteer?.name || 'N/A'}
- Email: ${volunteer?.email || 'N/A'}
- Phone: ${volunteer?.phone || 'N/A'}
- Location: ${volunteer?.location || 'N/A'}

Opportunity:
- Title: ${opportunity.title}
- Description: ${opportunity.description}
- Start: ${opportunity.startDate ? new Date(opportunity.startDate).toDateString() : 'N/A'}
- End: ${opportunity.endDate ? new Date(opportunity.endDate).toDateString() : 'N/A'}

Please log in to your dashboard to review the application.`;

                try {
                    const sendEmail = require('../utils/sendEmail');
                    await sendEmail(recipient, `New application for: ${opportunity.title}`, emailText);
                    console.log('Application email dispatched to:', recipient);
                } catch (mailErr) {
                    console.error('Failed to send application email to organization:', mailErr?.message || mailErr);
                }
            } else {
                console.warn('No recipient email found for opportunity; skipping email.');
            }
        } catch (notifyErr) {
            console.error('Error preparing notification email:', notifyErr?.message || notifyErr);
        }

        res.status(200).json({message: 'Applied successfully'});
    } catch (err){
        console.error('=== ERROR IN APPLY TO OPPORTUNITY ===');
        console.error('Error details:', err);
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        console.error('=== END ERROR ===');
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.getApplicants = async (req,res)=>{
    try{
        const opportunity = await Opportunity.findById(req.params.id)
        .populate('applicants', 'name email role phone location')
        .populate('approvedVolunteers', 'name email role phone location')
        .populate('organization', 'name');
        if(!opportunity){
            return  res.status(404).json({message: 'Opportunity not found'});
        }

        if (req.user.role !== 'organization' || opportunity.organization._id.toString() !== req.user._id.toString()){
            return res.status(403).json({message: 'Not authorized'});
        }
        
        // Check which approved volunteers have been marked as completed
        const approvedVolunteersWithStatus = await Promise.all(
            (opportunity.approvedVolunteers || []).map(async (volunteer) => {
                const volunteerDoc = await User.findById(volunteer._id || volunteer.id);
                const isCompleted = volunteerDoc?.volunteerHistory?.some(
                    (entry) => entry.opportunity?.toString() === opportunity._id.toString()
                ) || false;
                
                return {
                    ...volunteer.toObject ? volunteer.toObject() : volunteer,
                    isCompleted
                };
            })
        );
        
        res.json({
            opportunity: {
                id: opportunity._id,
                title: opportunity.title
            },
            applicants: opportunity.applicants,
            approvedVolunteers: approvedVolunteersWithStatus,
        });
    } catch (err){
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.updateOpportunity = async (req,res)=>{
    try{
        const opportunity = await Opportunity.findById(req.params.id);
        if (!opportunity) return res.status(404).json({ message: 'Opportunity not found'});

        if(req.user.role !== 'organization' || opportunity.organization.toString() !== req.user._id.toString()){
            return res.status(403).json({message:"Not authorized"});
        }
        
        const updatedFields = req.body;

        const updatedOpportunity = await Opportunity.findByIdAndUpdate(
            req.params.id,
            {$set: updatedFields},
            {new: true}
        );

        res.json({ message:"Opportunity updated", opportunity: updatedOpportunity});
    } catch (err){
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.deleteOpportunity = async (req, res)=>{
    try{
        const opportunity = await Opportunity.findById(req.params.id);
        if(!opportunity) return res.status(404).json({message:'Opportunity not found'});

        if(req.user.role !== 'organization' || opportunity.organization.toString() !== req.user._id.toString()){
            return res.status(403).json({message: "Not authorized"});
        }
        
        await opportunity.deleteOne();

        res.json({message: 'Opportunity deleted'});
    } catch (err){
        res.status(500).json({message:'Server error', error:err.message});
    }
};

exports.approveApplicant = async (req, res) => {
    try {
        const { userId } = req.body;
        const opportunity = await Opportunity.findById(req.params.id).populate('organization');

        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        if (req.user.role !== 'organization' || opportunity.organization._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!opportunity.applicants.includes(userId)) {
            return res.status(400).json({ message: 'User did not apply' });
        }

        if (opportunity.approvedVolunteers.includes(userId)) {
            return res.status(400).json({ message: 'Already approved' });
        }

        opportunity.approvedVolunteers.push(userId);
        await opportunity.save();

        // Send approval email
        const volunteer = await User.findById(userId);
        if (volunteer && volunteer.email) {
            const emailText = `
Hello ${volunteer.name},

🎉 Congratulations! You've been approved for the volunteer opportunity:

📌 Title: ${opportunity.title}
📝 Description: ${opportunity.description}
🏢 Organization: ${opportunity.organization.name}
📅 Date: ${opportunity.startDate ? new Date(opportunity.startDate).toDateString() : 'TBD'}

You can view more details in your dashboard. We look forward to your participation!

Best regards,  
Volunteer Recommendation System Team
            `;

            await sendEmail(
                volunteer.email,
                `You're selected for "${opportunity.title}"`,
                emailText
            );
        }

        res.status(200).json({ message: 'Volunteer approved and notified by email' });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.rejectApplicant = async (req, res) => {
    try {
        const { userId } = req.body;
        const opportunity = await Opportunity.findById(req.params.id).populate('organization');

        if (!opportunity) {
            return res.status(404).json({ message: 'Opportunity not found' });
        }

        if (req.user.role !== 'organization' || opportunity.organization._id.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Not authorized' });
        }

        if (!opportunity.applicants.includes(userId)) {
            return res.status(400).json({ message: 'User did not apply' });
        }

        // Remove from applicants list
        opportunity.applicants = opportunity.applicants.filter(
            applicantId => applicantId.toString() !== userId.toString()
        );
        
        // Also remove from approvedVolunteers if they were previously approved
        opportunity.approvedVolunteers = opportunity.approvedVolunteers.filter(
            volunteerId => volunteerId.toString() !== userId.toString()
        );
        
        await opportunity.save();

        res.status(200).json({ message: 'Applicant rejected and removed from application list' });

    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.markAsCompleted = async (req, res)=>{
    try{
        const {userId} = req.body;
        const opportunity = await Opportunity.findById(req.params.id).populate('organization');

        if(!opportunity) return res.status(404).json({message: 'Opportunity not found'});

        if(req.user.role!== 'organization' || opportunity.organization._id.toString() !== req.user._id.toString()){
            return res.status(403).json({ message: 'Not Authorized'});
        }

        if(!opportunity.approvedVolunteers.includes(userId)){
            return res.status(400).json({message: "User not approved for this."});
        }

        const volunteer = await User.findById(userId);
        
        if(!volunteer){
            return res.status(404).json({message: 'Volunteer not found'});
        }

        const alreadyCompleted = volunteer.volunteerHistory && volunteer.volunteerHistory.some(
            (entry)=>entry.opportunity && entry.opportunity.toString() === opportunity._id.toString()
        );

        if(alreadyCompleted){
            return res.status(400).json({message: 'Volunteer already marked as completed'});
        }

        volunteer.volunteerHistory.push({
            opportunity: opportunity._id,
            organization: opportunity.organization._id,
            title: opportunity.title,
            tags: opportunity.tags,
            date: new Date(),
        });
        
        await volunteer.save();

        // Send attendance confirmation email to volunteer
        if (!volunteer) {
            console.error('Volunteer not found for userId:', userId);
        } else if (!volunteer.email) {
            console.warn('Volunteer has no email address:', volunteer.name, volunteer._id);
        } else {
            try {
                console.log('Sending attendance confirmation email to:', volunteer.email);
                const emailText = `
Hello ${volunteer.name},

✅ Your attendance has been confirmed for the volunteer opportunity:

📌 Title: ${opportunity.title}
🏢 Organization: ${opportunity.organization.name}
📅 Event Date: ${opportunity.startDate ? new Date(opportunity.startDate).toDateString() : 'N/A'}
📍 Location: ${opportunity.location}

Thank you for your participation! This opportunity has been added to your volunteer history.

Your contribution makes a difference! 🌟

Best regards,  
${opportunity.organization.name}
Volunteer Recommendation System Team
                `;

                await sendEmail(
                    volunteer.email,
                    `Attendance Confirmed: ${opportunity.title}`,
                    emailText
                );
                console.log('Attendance confirmation email sent successfully to:', volunteer.email);
            } catch (emailErr) {
                console.error('Failed to send attendance confirmation email:', emailErr?.message || emailErr);
                console.error('Email error details:', {
                    volunteerEmail: volunteer.email,
                    volunteerName: volunteer.name,
                    opportunityTitle: opportunity.title,
                    error: emailErr
                });
                // Don't fail the request if email fails
            }
        }
        
        res.status(200).json({
            message: 'Attendance confirmed, history updated, and volunteer notified by email',
            emailSent: volunteer && volunteer.email ? true : false
        });
    } catch(err){
        res.status(500).json({message: 'Server error', error: err.message});
    }
};

exports.getRecommendedOpportunities = async(req, res)=>{
    try{
        const user= await User.findById(req.user._id).lean();
        const opportunities = await Opportunity
            .find({})
            .populate('organization', 'name')
            .lean();

        console.log('=== RECOMMEND DEBUG ===');
        console.log('User ID:', req.user._id);
        console.log('User interests:', Array.isArray(user?.interests) ? user.interests : user?.interests);
        console.log('Opportunities count:', opportunities.length);
        if (opportunities.length > 0) {
            console.log('Sample opportunity tags:', opportunities[0]?.tags);
        }

        const recommend = await recommendCosineBased(user, opportunities);

        console.log('Recommended count:', Array.isArray(recommend) ? recommend.length : 'n/a');
        if (Array.isArray(recommend) && recommend.length > 0) {
            console.log('Top recommendation score:', recommend[0]?.score, 'title:', recommend[0]?.title);
        }
        console.log('=== END RECOMMEND DEBUG ===');

        const payload = Array.isArray(recommend) ? recommend : [];
        res.status(200).json({ opportunities: payload, count: payload.length });
    } catch (err){
        res.status(500).json({ message : 'Server error', error: err.message});
    }
};

exports.getUserDashboard = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).lean();
    const opportunities = await Opportunity
      .find({})
      .populate('organization', 'name')
      .lean();

    const recommended = await recommendCosineBased(user, opportunities);

    res.status(200).json({
      user,
      opportunities: recommended
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

exports.searchOpportunities = async (req, res)=>{
    const { search, location, organization, fromDate, toDate } = req.query;

    try{
        const query = {};
        
        //keyword search for title description, tags
        if(search){
            query.$or=[
                {title: {$regex: search, $options:'i'}},
                {description: { $regex: search, $options: 'i'}},
                {tags: { $regex: search, $options: 'i'}},
            ];
        }

        //location filter
        if(location){
            query.location={$regex: location, $options: 'i'};        
        }

        //organization filter
         if (organization) {
      const matchingOrgs = await User.find({
        name: { $regex: organization, $options: 'i' },
        role: 'organization'
      }).select('_id');

      const orgIds = matchingOrgs.map(org => org._id);
      query.organization = { $in: orgIds };
    }

    if (fromDate|| toDate){
        query.date ={};
        if(fromDate) query.date.$gte = new Date(fromDate);
        if(toDate) query.date.$lte = new Date(toDate);
    }

    const opportunities = await Opportunity.find(query).populate('organization', 'name');
    if (opportunities.length === 0){
        return res.status(200).json({
            message: 'No results found',
            data : []
        });
    }
    
    res.status(200).json({
        message: 'Match Found',
        data: opportunities
    });
    } catch(err){
        res.status(500).json({message: 'Error filtering opportunities'});
    }     
};