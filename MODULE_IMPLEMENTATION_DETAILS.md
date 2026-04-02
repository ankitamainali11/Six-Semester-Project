# Module Implementation Details

## 1. Authentication & Authorization Module

The Authentication & Authorization Module is responsible for secure user registration, login, and session management. It implements password hashing using bcrypt, JWT token-based authentication, and email verification using 6-digit codes. The module enforces role-based access control (volunteer, organization, admin) and validates organization registrations by requiring .org domain email addresses. Users are automatically logged in after registration, but must verify their email to access protected features like applying to opportunities. The module also supports optional email verification, allowing users to skip verification and sign in directly if they choose.

**Pseudocode:**

```
FUNCTION registerUser(name, email, password, role, interests):
    
    IF role == 'admin':
        RETURN {error: "Cannot create admin accounts via registration"}
    
    user = FIND_USER_BY_EMAIL(email)
    IF user EXISTS:
        RETURN {error: "User already exists"}
    
    IF role == 'organization' AND email DOES_NOT_END_WITH('.org'):
        RETURN {error: "Organizations must register with a .org email address"}
    
    salt = GENERATE_SALT(10)
    hashedPassword = BCRYPT_HASH(password, salt)
    
    verificationCode = GENERATE_RANDOM_6_DIGIT_CODE()
    
    user = CREATE_USER({
        name: name,
        email: email,
        password: hashedPassword,
        role: role,
        interests: interests,
        emailVerificationToken: verificationCode,
        isVerified: false
    })
    
    jwtToken = JWT_SIGN({id: user._id, role: user.role}, SECRET, {expiresIn: '7d'})
    user.tokens = [jwtToken]
    SAVE user
    
    TRY:
        SEND_VERIFICATION_EMAIL(email, verificationCode)
    CATCH emailError:
        LOG("Failed to send verification email")
    
    RETURN {
        message: "User registered successfully",
        token: jwtToken,
        user: {id: user._id, name: user.name, email: user.email, role: user.role}
    }

FUNCTION loginUser(email, password):
    
    user = FIND_USER_BY_EMAIL(email)
    IF user DOES_NOT_EXIST:
        RETURN {error: "User not registered"}
    
    isMatch = BCRYPT_COMPARE(password, user.password)
    IF isMatch == FALSE:
        RETURN {error: "Invalid credentials"}
    
    jwtToken = JWT_SIGN({id: user._id, role: user.role}, SECRET, {expiresIn: '7d'})
    user.tokens.PUSH(jwtToken)
    SAVE user
    
    response = {
        message: "Login Successful",
        token: jwtToken,
        user: {id: user._id, name: user.name, email: user.email, role: user.role},
        isVerified: user.isVerified
    }
    
    IF user.isVerified == FALSE:
        response.message = "Login Successful (Email not verified)"
        response.note = "You can verify your email later for additional features"
    
    RETURN response

FUNCTION verifyEmail(email, code):
    
    user = FIND_USER_BY_EMAIL(email)
    IF user DOES_NOT_EXIST:
        RETURN {error: "User not found"}
    
    IF user.isVerified == TRUE:
        RETURN {error: "User already verified"}
    
    IF user.emailVerificationToken == code:
        user.isVerified = true
        user.emailVerificationToken = null
        SAVE user
        RETURN {message: "Email verified successfully"}
    ELSE:
        RETURN {error: "Invalid verification code"}

FUNCTION logoutUser(token):
    
    IF token DOES_NOT_EXIST:
        RETURN {error: "No token provided"}
    
    decoded = JWT_VERIFY(token, SECRET)
    user = FIND_USER_BY_ID(decoded.id)
    
    IF user DOES_NOT_EXIST:
        RETURN {error: "User not found"}
    
    user.tokens = FILTER(user.tokens, t => t != token)
    SAVE user
    
    RETURN {message: "Logged out successfully"}
```

**Output:**
```
Registration: {
    message: "User registered successfully",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
        id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john@example.com",
        role: "volunteer"
    }
}

Login: {
    message: "Login Successful",
    token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    user: {
        id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john@example.com",
        role: "volunteer"
    },
    isVerified: false
}

Email Verification: {
    message: "Email verified successfully"
}
```

---

## 2. User Management Module

The User Management Module handles volunteer and organization profile management, including personal information updates, interest tracking, and volunteer history. The module stores user data such as name, email, phone, location, bio, skills, interests, and availability. It tracks volunteer history including applied and approved opportunities, and maintains saved opportunities for future reference. The module differentiates between volunteer and organization roles, allowing organizations to manage their posted opportunities while volunteers manage their applications and profile information.

**Pseudocode:**

```
FUNCTION updateUserProfile(userId, name, email, phone, location, bio, skills, interests, availability):
    
    user = FIND_USER_BY_ID(userId)
    IF user DOES_NOT_EXIST:
        RETURN {error: "User not found"}
    
    IF name IS_PROVIDED:
        user.name = name
    IF email IS_PROVIDED:
        user.email = email
    IF phone IS_PROVIDED:
        user.phone = phone
    IF location IS_PROVIDED:
        user.location = location
    IF bio IS_PROVIDED:
        user.bio = bio
    IF skills IS_PROVIDED:
        user.skills = skills
    IF interests IS_PROVIDED:
        user.interests = interests
    IF availability IS_PROVIDED:
        user.availability = availability
    
    SAVE user
    
    RETURN {
        success: true,
        user: user
    }

FUNCTION getUserApplications(userId):
    
    user = FIND_USER_BY_ID(userId)
    IF user.role != 'volunteer' AND user.role != 'admin':
        RETURN {error: "Only volunteers or admins can view this"}
    
    opportunities = FIND_OPPORTUNITIES_WITH_APPLICANT(userId)
    POPULATE opportunities WITH organization(name, email)
    
    RETURN {
        opportunities: opportunities
    }

FUNCTION saveOpportunity(userId, opportunityId):
    
    user = FIND_USER_BY_ID(userId)
    IF opportunityId NOT_IN user.savedOpportunities:
        user.savedOpportunities.PUSH(opportunityId)
        SAVE user
    
    RETURN {success: true}

FUNCTION removeSavedOpportunity(userId, opportunityId):
    
    user = FIND_USER_BY_ID(userId)
    user.savedOpportunities = FILTER(user.savedOpportunities, id => id != opportunityId)
    SAVE user
    
    RETURN {success: true}

FUNCTION getSavedOpportunities(userId):
    
    user = FIND_USER_BY_ID(userId)
    POPULATE user.savedOpportunities WITH opportunity_details
    
    RETURN {
        savedOpportunities: user.savedOpportunities
    }

FUNCTION addToVolunteerHistory(userId, opportunityId, organizationId, title, tags, date):
    
    user = FIND_USER_BY_ID(userId)
    
    historyEntry = {
        opportunity: opportunityId,
        organization: organizationId,
        title: title,
        tags: tags,
        date: date
    }
    
    user.volunteerHistory.PUSH(historyEntry)
    SAVE user
    
    RETURN {success: true}
```

**Output:**
```
Profile Update: {
    success: true,
    user: {
        id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john@example.com",
        phone: "123-456-7890",
        location: "New York",
        bio: "Passionate volunteer",
        skills: ["Teaching", "Gardening"],
        interests: ["Education", "Environment"],
        availability: "weekends"
    }
}

User Applications: {
    opportunities: [
        {
            _id: "507f191e810c19729de860ea",
            title: "Community Garden",
            organization: {name: "Green Org", email: "org@example.org"},
            ...
        }
    ]
}
```

---

## 3. Opportunity Management Module

The Opportunity Management Module enables organizations to create, update, and delete volunteer opportunities while allowing volunteers to apply and be approved for them. The module stores comprehensive opportunity details including title, description, location, dates, time commitment, requirements, and tags. It tracks applicants and approved volunteers, sends automated email notifications when volunteers apply or are approved, and ensures only verified organizations can post opportunities. The module also automatically adds opportunity tags to volunteer interests when they apply, enhancing the recommendation system.

**Pseudocode:**

```
FUNCTION createOpportunity(organizationId, title, description, fullDescription, location, startDate, endDate, tags, contactEmail, contactPhone):
    
    user = FIND_USER_BY_ID(organizationId)
    IF user.role != 'organization':
        RETURN {error: "Only organizations can create opportunities"}
    
    processedTags = PROCESS_TAGS(tags) // Convert to lowercase, remove duplicates
    
    opportunity = CREATE_OPPORTUNITY({
        title: title,
        description: description,
        fullDescription: fullDescription,
        location: location,
        startDate: startDate,
        endDate: endDate,
        organization: organizationId,
        organizationName: user.name,
        tags: processedTags,
        contactEmail: contactEmail,
        contactPhone: contactPhone,
        applicants: [],
        approvedVolunteers: [],
        status: 'active'
    })
    
    SAVE opportunity
    
    FOR EACH tag IN processedTags:
        SAVE_OR_UPDATE_TAG(tag)
    
    RETURN {
        message: "Opportunity created successfully",
        opportunity: opportunity
    }

FUNCTION applyToOpportunity(userId, opportunityId):
    
    user = FIND_USER_BY_ID(userId)
    IF user.role != 'volunteer' AND user.role != 'admin':
        RETURN {error: "Only volunteers or admins can apply"}
    
    IF user.isVerified == FALSE:
        RETURN {error: "Please verify your email before applying"}
    
    opportunity = FIND_OPPORTUNITY_BY_ID(opportunityId)
    IF opportunity DOES_NOT_EXIST:
        RETURN {error: "Opportunity not found"}
    
    IF userId IN opportunity.applicants:
        RETURN {error: "You may have already applied"}
    
    opportunity.applicants.PUSH(userId)
    SAVE opportunity
    
    IF opportunity.tags EXISTS AND opportunity.tags.length > 0:
        newInterests = MAP(opportunity.tags, tag => LOWERCASE(tag))
        user.interests = MERGE_UNIQUE(user.interests, newInterests)
        SAVE user
    
    organization = FIND_USER_BY_ID(opportunity.organization)
    volunteer = FIND_USER_BY_ID(userId)
    
    TRY:
        SEND_EMAIL(
            organization.email,
            "New application for: " + opportunity.title,
            "A volunteer has applied: " + volunteer.name + " (" + volunteer.email + ")"
        )
    CATCH emailError:
        LOG("Failed to send application email")
    
    RETURN {message: "Applied successfully"}

FUNCTION approveApplicant(organizationId, opportunityId, volunteerId):
    
    opportunity = FIND_OPPORTUNITY_BY_ID(opportunityId)
    IF opportunity DOES_NOT_EXIST:
        RETURN {error: "Opportunity not found"}
    
    IF opportunity.organization != organizationId:
        RETURN {error: "Not authorized"}
    
    IF volunteerId NOT_IN opportunity.applicants:
        RETURN {error: "User did not apply"}
    
    IF volunteerId IN opportunity.approvedVolunteers:
        RETURN {error: "Already approved"}
    
    opportunity.approvedVolunteers.PUSH(volunteerId)
    SAVE opportunity
    
    volunteer = FIND_USER_BY_ID(volunteerId)
    
    TRY:
        SEND_EMAIL(
            volunteer.email,
            "You're selected for " + opportunity.title,
            "Congratulations! You've been approved for the opportunity."
        )
    CATCH emailError:
        LOG("Failed to send approval email")
    
    RETURN {message: "Volunteer approved and notified by email"}

FUNCTION markAsCompleted(organizationId, opportunityId, volunteerId):
    
    opportunity = FIND_OPPORTUNITY_BY_ID(opportunityId)
    IF opportunity DOES_NOT_EXIST:
        RETURN {error: "Opportunity not found"}
    
    IF opportunity.organization != organizationId:
        RETURN {error: "Not authorized"}
    
    IF volunteerId NOT_IN opportunity.approvedVolunteers:
        RETURN {error: "User not approved for this"}
    
    volunteer = FIND_USER_BY_ID(volunteerId)
    
    IF volunteer ALREADY_HAS_HISTORY_ENTRY(opportunityId):
        RETURN {error: "Volunteer already marked as completed"}
    
    historyEntry = {
        opportunity: opportunityId,
        organization: organizationId,
        title: opportunity.title,
        tags: opportunity.tags,
        date: CURRENT_DATE()
    }
    
    volunteer.volunteerHistory.PUSH(historyEntry)
    SAVE volunteer
    
    TRY:
        SEND_EMAIL(
            volunteer.email,
            "Attendance Confirmed: " + opportunity.title,
            "Your attendance has been confirmed. Thank you for your participation!"
        )
    CATCH emailError:
        LOG("Failed to send confirmation email")
    
    RETURN {
        message: "Attendance confirmed, history updated, and volunteer notified by email",
        emailSent: true
    }

FUNCTION getAllOpportunities():
    
    opportunities = FIND_ALL_OPPORTUNITIES()
    EXCLUDE applicants FIELD
    POPULATE opportunities WITH organization(name, email)
    
    RETURN opportunities

FUNCTION getOpportunityById(opportunityId):
    
    opportunity = FIND_OPPORTUNITY_BY_ID(opportunityId)
    IF opportunity DOES_NOT_EXIST:
        RETURN {error: "Opportunity not found"}
    
    POPULATE opportunity WITH organization(name, email)
    POPULATE opportunity WITH applicants(name, email)
    
    RETURN opportunity
```

**Output:**
```
Create Opportunity: {
    message: "Opportunity created successfully",
    opportunity: {
        _id: "507f191e810c19729de860ea",
        title: "Community Garden",
        description: "Help maintain community garden",
        organization: "507f1f77bcf86cd799439011",
        tags: ["environment", "gardening"],
        status: "active",
        ...
    }
}

Apply to Opportunity: {
    message: "Applied successfully"
}

Approve Applicant: {
    message: "Volunteer approved and notified by email"
}
```

---

## 4. Email Notification System

The Email Notification System facilitates automated email communication throughout the application using Nodemailer with Gmail SMTP. The module sends verification codes during user registration, application notifications to organizations when volunteers apply, approval notifications to volunteers when selected, and attendance confirmation emails. The system is configured to work with Gmail app passwords for secure authentication and handles email sending failures gracefully without breaking the main application flow.

**Pseudocode:**

```
FUNCTION sendEmail(to, subject, text):
    
    host = GET_ENV('EMAIL_HOST')
    port = GET_ENV('EMAIL_PORT') || 587
    user = GET_ENV('EMAIL_USER')
    pass = GET_ENV('EMAIL_PASS')
    service = GET_ENV('EMAIL_SERVICE')
    
    IF service EXISTS:
        transporter = CREATE_NODEMAILER_TRANSPORTER({
            service: service,
            auth: {user: user, pass: pass}
        })
    ELSE:
        transporter = CREATE_NODEMAILER_TRANSPORTER({
            host: host,
            port: port,
            secure: port == 465,
            auth: {user: user, pass: pass}
        })
    
    mailOptions = {
        from: "Volunteer System <" + user + ">",
        to: to,
        subject: subject,
        text: text
    }
    
    TRY:
        info = TRANSPORTER_SEND_MAIL(mailOptions)
        IF NODE_ENV != 'production':
            LOG("Email sent: " + info.messageId)
        RETURN info
    CATCH error:
        LOG("sendEmail error: " + error.message)
        THROW error

FUNCTION sendVerificationEmail(email, verificationCode):
    
    subject = "Welcome to VolunteerMe - Verify Your Email"
    text = "Welcome to VolunteerMe!\n\nYour verification code is: " + verificationCode + "\n\nPlease enter this 6-digit code on the verification page."
    
    RETURN sendEmail(email, subject, text)

FUNCTION sendApplicationNotification(organizationEmail, volunteerName, volunteerEmail, opportunityTitle):
    
    subject = "New application for: " + opportunityTitle
    text = "Hello,\n\nA volunteer has just applied to your opportunity: " + opportunityTitle + "\n\nVolunteer details:\n- Name: " + volunteerName + "\n- Email: " + volunteerEmail + "\n\nPlease log in to your dashboard to review the application."
    
    RETURN sendEmail(organizationEmail, subject, text)

FUNCTION sendApprovalEmail(volunteerEmail, volunteerName, opportunityTitle, organizationName, startDate):
    
    subject = "You're selected for \"" + opportunityTitle + "\""
    text = "Hello " + volunteerName + ",\n\n🎉 Congratulations! You've been approved for the volunteer opportunity:\n\n📌 Title: " + opportunityTitle + "\n🏢 Organization: " + organizationName + "\n📅 Date: " + startDate + "\n\nYou can view more details in your dashboard."
    
    RETURN sendEmail(volunteerEmail, subject, text)

FUNCTION sendAttendanceConfirmation(volunteerEmail, volunteerName, opportunityTitle, organizationName, location, startDate):
    
    subject = "Attendance Confirmed: " + opportunityTitle
    text = "Hello " + volunteerName + ",\n\n✅ Your attendance has been confirmed for the volunteer opportunity:\n\n📌 Title: " + opportunityTitle + "\n🏢 Organization: " + organizationName + "\n📅 Event Date: " + startDate + "\n📍 Location: " + location + "\n\nThank you for your participation! This opportunity has been added to your volunteer history."
    
    RETURN sendEmail(volunteerEmail, subject, text)
```

**Output:**
```
Email Sent: {
    messageId: "<abc123@mail.gmail.com>",
    accepted: ["recipient@example.com"],
    rejected: []
}

Verification Email: {
    messageId: "<verification123@mail.gmail.com>",
    response: "250 2.0.0 OK"
}
```

---

## 5. Recommendation Engine

The Recommendation Engine matches volunteers to suitable opportunities using TF-IDF (Term Frequency-Inverse Document Frequency) vectorization and cosine similarity. The system builds a vocabulary from all unique tags in user interests and opportunity tags, computes document frequency and IDF weights for each tag, creates TF-IDF vectors for user profiles and opportunities, calculates cosine similarity scores between user interests and opportunity tags, and returns opportunities sorted by similarity score in descending order. This personalized recommendation system helps volunteers discover opportunities that align with their interests.

**Pseudocode:**

```
FUNCTION recommendOpportunities(user, opportunities):
    
    // Step 1: Build vocabulary from all unique tags
    allTags = NEW_SET()
    IF user.interests IS_ARRAY:
        FOR EACH interest IN user.interests:
            allTags.ADD(NORMALIZE(interest)) // lowercase, trim
    
    FOR EACH opportunity IN opportunities:
        IF opportunity.tags IS_ARRAY:
            FOR EACH tag IN opportunity.tags:
                allTags.ADD(NORMALIZE(tag))
    
    vocab = ARRAY_FROM(allTags)
    N = opportunities.length + 1 // Total documents (opportunities + user profile)
    
    // Step 2: Compute document frequency (df) for each tag
    df = NEW_OBJECT()
    FOR EACH tag IN vocab:
        df[tag] = 0
    
    FOR EACH opportunity IN opportunities:
        uniqueTags = NEW_SET(MAP(opportunity.tags, tag => NORMALIZE(tag)))
        FOR EACH tag IN uniqueTags:
            df[tag] = df[tag] + 1
    
    // Count user profile as a document
    IF user.interests IS_ARRAY:
        uniqueUserTags = NEW_SET(MAP(user.interests, tag => NORMALIZE(tag)))
        FOR EACH tag IN uniqueUserTags:
            df[tag] = df[tag] + 1
    
    // Step 3: Compute IDF for each tag
    idf = NEW_OBJECT()
    FOR EACH tag IN vocab:
        idf[tag] = LOG(N / (1 + df[tag])) // Smoothing with +1
    
    // Step 4: Build TF-IDF vectors
    FUNCTION buildVector(tags):
        counts = NEW_OBJECT()
        normalizedTags = MAP(tags, tag => NORMALIZE(tag))
        FOR EACH tag IN normalizedTags:
            counts[tag] = (counts[tag] || 0) + 1
        total = normalizedTags.length || 1
        
        vector = []
        FOR EACH tag IN vocab:
            tf = (counts[tag] || 0) / total
            vector.PUSH(tf * idf[tag])
        RETURN vector
    
    userVector = buildVector(user.interests || [])
    
    // Step 5: Score each opportunity
    scored = []
    FOR EACH opportunity IN opportunities:
        opVector = buildVector(opportunity.tags || [])
        score = cosineSimilarity(userVector, opVector)
        scored.PUSH({
            ...opportunity,
            score: score
        })
    
    // Step 6: Sort by similarity score (descending)
    scored.SORT((a, b) => b.score - a.score)
    
    RETURN scored

FUNCTION cosineSimilarity(vecA, vecB):
    
    dot = 0.0
    normA = 0.0
    normB = 0.0
    
    FOR i = 0 TO vecA.length - 1:
        dot = dot + (vecA[i] * vecB[i])
        normA = normA + (vecA[i] * vecA[i])
        normB = normB + (vecB[i] * vecB[i])
    
    IF normA == 0 OR normB == 0:
        RETURN 0
    
    RETURN dot / (SQRT(normA) * SQRT(normB))

FUNCTION getRecommendedOpportunities(userId):
    
    user = FIND_USER_BY_ID(userId)
    opportunities = FIND_ALL_OPPORTUNITIES()
    POPULATE opportunities WITH organization(name)
    
    recommendations = recommendOpportunities(user, opportunities)
    
    RETURN {
        opportunities: recommendations,
        count: recommendations.length
    }
```

**Output:**
```
Recommendations: {
    opportunities: [
        {
            _id: "507f191e810c19729de860ea",
            title: "Community Garden",
            tags: ["environment", "gardening"],
            score: 0.85,
            organization: {name: "Green Org"},
            ...
        },
        {
            _id: "507f191e810c19729de860eb",
            title: "Tree Planting",
            tags: ["environment", "outdoor"],
            score: 0.72,
            organization: {name: "Eco Org"},
            ...
        }
    ],
    count: 2
}
```

---

## 6. Middleware & Access Control

The Middleware & Access Control module secures API routes and enforces access restrictions based on user authentication status, role, and email verification status. The protect middleware verifies JWT tokens from Authorization headers, extracts user information, and attaches it to the request object. The module ensures only authenticated users can access protected routes, only verified users can apply to opportunities, only organizations can create opportunities, and only opportunity owners can manage their opportunities. It handles token expiration, invalid tokens, and unauthorized access attempts with appropriate error responses.

**Pseudocode:**

```
FUNCTION protect(request, response, next):
    
    token = NULL
    
    IF request.headers.authorization EXISTS AND request.headers.authorization STARTS_WITH('Bearer'):
        token = SPLIT(request.headers.authorization, ' ')[1]
    
    IF token DOES_NOT_EXIST:
        RETURN response.status(401).json({error: "Not authorized, no token"})
    
    TRY:
        decoded = JWT_VERIFY(token, JWT_SECRET)
        user = FIND_USER_BY_ID(decoded.id)
        EXCLUDE user.password
        request.user = user
        CALL next()
    CATCH error:
        RETURN response.status(401).json({error: "Not authorized, token failed"})

FUNCTION requireOrganization(request, response, next):
    
    IF request.user.role != 'organization':
        RETURN response.status(403).json({error: "Access denied"})
    
    CALL next()

FUNCTION requireVerified(request, response, next):
    
    IF request.user.isVerified == FALSE:
        RETURN response.status(403).json({error: "Please verify your email first"})
    
    CALL next()

FUNCTION requireAdmin(request, response, next):
    
    IF request.user.role != 'admin':
        RETURN response.status(403).json({error: "Admin access required"})
    
    CALL next()

FUNCTION requireVolunteerOrAdmin(request, response, next):
    
    IF request.user.role != 'volunteer' AND request.user.role != 'admin':
        RETURN response.status(403).json({error: "Only volunteers or admins can access this"})
    
    CALL next()

FUNCTION requireOpportunityOwner(request, response, next):
    
    opportunityId = request.params.id
    opportunity = FIND_OPPORTUNITY_BY_ID(opportunityId)
    
    IF opportunity DOES_NOT_EXIST:
        RETURN response.status(404).json({error: "Opportunity not found"})
    
    IF opportunity.organization != request.user._id:
        RETURN response.status(403).json({error: "Not authorized"})
    
    CALL next()
```

**Output:**
```
Successful Authentication: {
    request.user: {
        _id: "507f1f77bcf86cd799439011",
        name: "John Doe",
        email: "john@example.com",
        role: "volunteer",
        isVerified: true
    }
}

Unauthorized Access: {
    status: 401,
    error: "Not authorized, token failed"
}

Forbidden Access: {
    status: 403,
    error: "Please verify your email first"
}
```

---

## 7. Validation & Error Handling

The Validation & Error Handling module ensures data integrity, prevents invalid operations, and provides consistent error responses throughout the application. It validates user input formats, checks for duplicate registrations, verifies email formats and domain requirements for organizations, validates JWT tokens and handles expiration, checks user roles and verification status before allowing operations, prevents duplicate applications and approvals, and returns meaningful error messages with appropriate HTTP status codes. The module handles database errors, email sending failures, and unexpected exceptions gracefully.

**Pseudocode:**

```
FUNCTION validateRegistration(name, email, password, role):
    
    errors = []
    
    IF name IS_EMPTY:
        errors.PUSH("Name is required")
    
    IF email IS_EMPTY:
        errors.PUSH("Email is required")
    ELSE IF email DOES_NOT_MATCH_EMAIL_FORMAT:
        errors.PUSH("Email is invalid")
    
    IF password IS_EMPTY:
        errors.PUSH("Password is required")
    ELSE IF password.length < 6:
        errors.PUSH("Password must be at least 6 characters")
    
    IF role == 'organization' AND email DOES_NOT_END_WITH('.org'):
        errors.PUSH("Organizations must register with a .org email address")
    
    IF errors.length > 0:
        RETURN {valid: false, errors: errors}
    
    RETURN {valid: true}

FUNCTION validateEmailVerification(email, code):
    
    IF email IS_EMPTY:
        RETURN {valid: false, error: "Email is required"}
    
    IF code IS_EMPTY:
        RETURN {valid: false, error: "Verification code is required"}
    
    IF code DOES_NOT_MATCH_6_DIGIT_FORMAT:
        RETURN {valid: false, error: "Verification code must be 6 digits"}
    
    user = FIND_USER_BY_EMAIL(email)
    IF user DOES_NOT_EXIST:
        RETURN {valid: false, error: "User not found"}
    
    IF user.isVerified == TRUE:
        RETURN {valid: false, error: "User already verified"}
    
    IF user.emailVerificationToken != code:
        RETURN {valid: false, error: "Invalid verification code"}
    
    RETURN {valid: true}

FUNCTION handleApplicationValidation(user, opportunityId):
    
    IF user.role != 'volunteer' AND user.role != 'admin':
        RETURN {valid: false, error: "Only volunteers or admins can apply"}
    
    IF user.isVerified == FALSE:
        RETURN {valid: false, error: "Please verify your email before applying"}
    
    opportunity = FIND_OPPORTUNITY_BY_ID(opportunityId)
    IF opportunity DOES_NOT_EXIST:
        RETURN {valid: false, error: "Opportunity not found"}
    
    IF user._id IN opportunity.applicants:
        RETURN {valid: false, error: "You may have already applied"}
    
    RETURN {valid: true}

FUNCTION handleError(error, request, response, next):
    
    IF error.name == 'ValidationError':
        RETURN response.status(400).json({
            error: "Validation error",
            message: error.message,
            details: error.errors
        })
    
    IF error.name == 'MongoError' AND error.code == 11000:
        RETURN response.status(400).json({
            error: "Duplicate entry",
            message: "A record with this information already exists"
        })
    
    IF error.name == 'JsonWebTokenError':
        RETURN response.status(401).json({
            error: "Invalid token",
            message: "Authentication token is invalid"
        })
    
    IF error.name == 'TokenExpiredError':
        RETURN response.status(401).json({
            error: "Token expired",
            message: "Authentication token has expired"
        })
    
    LOG_ERROR(error)
    
    RETURN response.status(500).json({
        error: "Server error",
        message: error.message
    })

FUNCTION validateOpportunityCreation(user, opportunityData):
    
    IF user.role != 'organization':
        RETURN {valid: false, error: "Only organizations can create opportunities"}
    
    IF user.isVerified == FALSE:
        RETURN {valid: false, error: "Please verify your email before creating opportunities"}
    
    IF opportunityData.title IS_EMPTY:
        RETURN {valid: false, error: "Title is required"}
    
    IF opportunityData.description IS_EMPTY:
        RETURN {valid: false, error: "Description is required"}
    
    IF opportunityData.startDate IS_AFTER(opportunityData.endDate):
        RETURN {valid: false, error: "Start date must be before end date"}
    
    RETURN {valid: true}
```

**Output:**
```
Validation Error: {
    status: 400,
    error: "Validation error",
    message: "Email is invalid",
    details: {
        email: {
            message: "Email format is incorrect"
        }
    }
}

Duplicate Entry: {
    status: 400,
    error: "Duplicate entry",
    message: "A record with this information already exists"
}

Invalid Token: {
    status: 401,
    error: "Invalid token",
    message: "Authentication token is invalid"
}

Server Error: {
    status: 500,
    error: "Server error",
    message: "Database connection failed"
}
```

---

## 8. API & Routing Structure

The API & Routing Structure module organizes all API endpoints following RESTful conventions using Express.js routers. The module structures routes by functionality (auth, user, opportunity, admin), applies appropriate middleware for authentication and verification at the routing layer, implements role-based restrictions, and ensures consistent API response formats. Routes are organized into separate files for maintainability, with clear separation of concerns between authentication, user management, opportunity management, and administrative functions.

**Pseudocode:**

```
FUNCTION setupAuthRoutes():
    
    router = CREATE_EXPRESS_ROUTER()
    
    router.POST('/register', registerUser)
    router.POST('/login', loginUser)
    router.GET('/me', protect, getCurrentUser)
    router.POST('/logout', protect, logoutUser)
    router.POST('/verify-email', verifyEmail)
    
    RETURN router

FUNCTION setupUserRoutes():
    
    router = CREATE_EXPRESS_ROUTER()
    
    router.GET('/saved-opportunities', protect, getSavedOpportunities)
    router.POST('/saved-opportunities', protect, saveOpportunity)
    router.DELETE('/saved-opportunities/:id', protect, removeSavedOpportunity)
    router.GET('/interests', protect, getUserInterests)
    router.POST('/interests/add', protect, addInterests)
    router.PUT('/profile', protect, updateUserProfile)
    router.POST('/test-email', protect, testEmail)
    
    RETURN router

FUNCTION setupOpportunityRoutes():
    
    router = CREATE_EXPRESS_ROUTER()
    
    router.GET('/', getAllOpportunities)
    router.GET('/recommendations', protect, getRecommendedOpportunities)
    router.GET('/my-applications', protect, getMyApplications)
    router.GET('/my', protect, getMyOpportunities)
    router.GET('/:id', getOpportunityById)
    router.GET('/:id/tags', getOpportunityTags)
    router.GET('/:id/applicants', protect, getApplicants)
    router.POST('/', protect, requireOrganization, createOpportunity)
    router.PUT('/:id', protect, requireOrganization, updateOpportunity)
    router.DELETE('/:id', protect, requireOrganization, deleteOpportunity)
    router.POST('/:id/apply', protect, applyToOpportunity)
    router.POST('/:id/approve-applicant', protect, requireOrganization, approveApplicant)
    router.POST('/:id/reject-applicant', protect, requireOrganization, rejectApplicant)
    router.POST('/:id/mark-completed', protect, requireOrganization, markAsCompleted)
    router.GET('/search', searchOpportunities)
    
    RETURN router

FUNCTION setupAdminRoutes():
    
    router = CREATE_EXPRESS_ROUTER()
    router.USE(protect)
    router.USE(requireAdmin)
    
    router.GET('/users', getUsers)
    router.GET('/users/:id', getUser)
    router.POST('/users', createUser)
    router.PUT('/users/:id', updateUser)
    router.DELETE('/users/:id', deleteUser)
    router.GET('/opportunities', getOpportunities)
    router.GET('/opportunities/:id', getOpportunity)
    router.POST('/opportunities', createOpportunity)
    router.PUT('/opportunities/:id', updateOpportunity)
    router.DELETE('/opportunities/:id', deleteOpportunity)
    router.GET('/stats', getStats)
    
    RETURN router

FUNCTION setupAppRoutes():
    
    app = CREATE_EXPRESS_APP()
    
    app.USE('/api/auth', setupAuthRoutes())
    app.USE('/api/user', setupUserRoutes())
    app.USE('/api/opportunities', setupOpportunityRoutes())
    app.USE('/api/admin', setupAdminRoutes())
    app.USE('/api/tags', setupTagRoutes())
    app.USE('/api/contact', setupContactRoutes())
    
    app.USE(handleError) // Global error handler
    
    RETURN app
```

**Output:**
```
API Routes Structure: {
    auth: {
        POST: "/api/auth/register",
        POST: "/api/auth/login",
        GET: "/api/auth/me",
        POST: "/api/auth/logout",
        POST: "/api/auth/verify-email"
    },
    user: {
        GET: "/api/user/saved-opportunities",
        POST: "/api/user/saved-opportunities",
        DELETE: "/api/user/saved-opportunities/:id",
        GET: "/api/user/interests",
        PUT: "/api/user/profile"
    },
    opportunities: {
        GET: "/api/opportunities",
        GET: "/api/opportunities/recommendations",
        GET: "/api/opportunities/:id",
        POST: "/api/opportunities",
        POST: "/api/opportunities/:id/apply",
        POST: "/api/opportunities/:id/approve-applicant"
    },
    admin: {
        GET: "/api/admin/users",
        GET: "/api/admin/opportunities",
        GET: "/api/admin/stats"
    }
}

Route Response Example: {
    method: "POST",
    path: "/api/opportunities/:id/apply",
    status: 200,
    response: {
        message: "Applied successfully"
    }
}
```

---

## Summary

All eight modules are correctly implemented according to the specifications. The system uses bcrypt for password hashing, JWT for authentication, 6-digit codes for email verification, TF-IDF and cosine similarity for recommendations, Nodemailer for email notifications, and comprehensive middleware for access control. The RESTful API structure is well-organized with proper error handling and validation throughout.

