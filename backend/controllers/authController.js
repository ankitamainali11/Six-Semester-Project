const bcrypt = require('bcryptjs');
const jwt = require ('jsonwebtoken');
const User = require ('../models/User');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail');

exports.registerUser = async (req, res) => {
    const { name, email, password, role: inputRole, interests } = req.body;
    const role = inputRole || 'volunteer';

    try {
        // Prevent admin role creation via registration
        if (role === 'admin') {
            return res.status(400).json({ message: 'Cannot create admin accounts via registration' });
        }

        let user = await User.findOne({ email });
        if (user) return res.status(400).json({ message: 'User already exists' });

        if (role === 'organization' && !email.endsWith('.org')) {
            return res.status(400).json({ message: 'Organizations must register with a .org email address' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate a 6-digit verification code instead of long hex string
        const verificationToken = Math.floor(100000 + Math.random() * 900000).toString();

        user = new User({
            name,
            email,
            password: hashedPassword,
            role,
            interests,
            emailVerificationToken: verificationToken,
        });

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '7d' }
        );

        user.tokens = [token];
        await user.save();

        // Try to send verification email, but don't fail registration if email fails
        try {
            await sendEmail(
                user.email,
                'Welcome to VolunteerMe - Verify Your Email',
                `Welcome to VolunteerMe, ${name}!

Thank you for joining our community of volunteers and organizations!

Your verification code is: ${verificationToken}

Please enter this 6-digit code on the verification page to complete your registration.

If you have any questions, feel free to contact our support team.

Best regards,
The VolunteerMe Team`
            );
        } catch (emailError) {
            console.error('Failed to send verification email:', emailError.message);
            // Continue with registration even if email fails
        }

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            },
        });
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

exports.loginUser = async (req, res)=>{
    const {email, password} = req.body;
    try{
        const user = await User.findOne({ email });
        if(!user) return res.status(400).json({ message: 'User not registered'});
        
        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) return res.status(400).json({message: 'Invalid credentials'});

        const token = jwt.sign({id: user._id, role: user.role}, process.env.JWT_SECRET, {expiresIn: '7d',});
        
        // Check if user is verified and include that info in response
        const responseData = {
            message: 'Login Successful',
            token,
            user:{id:user._id, name: user.name, email: user.email, role: user.role},
            isVerified: user.isVerified
        };

        // Add a note if user isn't verified
        if (!user.isVerified) {
            responseData.message = 'Login Successful (Email not verified)';
            responseData.note = 'You can verify your email later for additional features';
        }

        res.status(201).json(responseData);
        user.tokens.push(token);
        await user.save();
    } catch (err){
        res.status(500).json({message: 'Server error', error: err.message});       
    }
};

exports.logoutUser = async (req, res)=>{
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({message: 'No token provided'});
    }

    const token = authHeader.split(' ')[1];

    try{
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id);

        if(!user) return res.status(404).json({message: 'User not found'});
        
        user.tokens = user.tokens.filter(t=> t!== token); // this remove tokens
        await user.save();

        res.status(200).json({message: 'Logged out successfully'});
    } catch(err){
        res.status(401).json({ message: 'Invalid token or user session'});
    }
};

exports.verifyEmail = async (req, res)=>{
    const {email, code}= req.body;

    try{
        const user = await User.findOne({email});

        if(!user) return res.status(404).json({message: 'User not found'});
        if(user.isVerified) return res.status(400).json({message: 'User already verified'});

        if(user.emailVerificationToken === code){
            user.isVerified = true;
            user.emailVerificationToken = null;
            await user.save();
            return res.status(200).json({message: 'Email verified successfully'});
        } else {
            return res.status(400).json({ message: 'Invalid verification code.'});
        }
    } catch (err){
        res.status(500).json({ message: 'Server error', error: err.message});
    }
};