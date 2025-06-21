import gs from "github-scraper";
import SocialsConnect from "../models/social_connect.js";

const githubScrapper = async (req, res) => {
  const { githubUsername } = req.query;
  console.log(req.query);
  try {
    var url = `/${githubUsername}`;
    gs(url, function (err, data) {
      console.log(data);
      return res.status(200).json({
        success: true,
        message: "Github data fetched successfully",
        data,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const githubRepo = async (req, res) => {
  const { githubUsername } = req.body;
  try {
    var url = `${githubUsername}?tab=repositories`;
    gs(url, function (err, data) {
      console.log(data);
      return res.status(200).json({
        success: true,
        message: "Github data fetched successfully",
        data,
      });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const githubdata = async (req, res) => {
  const {userId, userName, avatar, bio, followers, following, repos } = req.body;
  console.log(req.body);

  try {
    const newUser = new SocialsConnect({
      userId,
      githubScrapedData: {
        
        userName,
        avatar,
        bio,
        followers,
        following,
        repos,
      },
    });

    await newUser.save();

    return res.status(201).json({
      success: true,
      message: "GitHub user data saved successfully",
      data: newUser,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

const linkedinData = async (req, res) => {
  try {
    const {
      userId, // Add userId to identify the user
      fullname,
      headline,
      summary,
      experience,
      skills,
      certifications,
      education
    } = req.body;

    // Validate required fields
    if (!userId) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'userId is required'
      });
    }

    if (!fullname && !headline) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'At least fullname or headline is required'
      });
    }

    // Structure LinkedIn data according to your schema
    const linkedinDataToStore = {
      FullName: fullname || '',
      headline: headline || '',
      Summary: summary || '',
      Experience: experience || [],
      Education: education || [],
      Skills: skills || [],
      Certifications: certifications || []
    };

    // Check if user already exists
    let userProfile = await SocialsConnect.findOne({ userId });

    if (userProfile) {
      // Update existing user's LinkedIn data
      userProfile.LinkedinData = linkedinDataToStore;
      await userProfile.save();
      
      return res.status(200).json({
        success: true,
        data: {
          personalInfo: {
            name: userProfile.LinkedinData.FullName,
            title: userProfile.LinkedinData.headline,
            email: '', // Not stored in your schema
            phone: '', // Not stored in your schema
            location: '', // Not stored in your schema
            linkedin: '', // Not stored in your schema
            portfolio: '' // Not stored in your schema
          },
          summary: userProfile.LinkedinData.Summary,
          experience: userProfile.LinkedinData.Experience,
          skills: userProfile.LinkedinData.Skills,
          certifications: userProfile.LinkedinData.Certifications,
          education: userProfile.LinkedinData.Education,
          languages: [], // Not in your schema
          userId: userProfile.userId,
          createdAt: userProfile.createdAt,
          updatedAt: userProfile.updatedAt
        },
        error: null
      });
    } else {
      // Create new user profile with LinkedIn data
      const newProfile = new SocialsConnect({
        userId,
        LinkedinData: linkedinDataToStore,
        githubScrapedData: {
          userName: '',
          avatar: '',
          bio: '',
          followers: '',
          following: '',
          repos: ''
        }
      });

      const savedProfile = await newProfile.save();

      return res.status(201).json({
        success: true,
        data: {
          personalInfo: {
            name: savedProfile.LinkedinData.FullName,
            title: savedProfile.LinkedinData.headline,
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            portfolio: ''
          },
          summary: savedProfile.LinkedinData.Summary,
          experience: savedProfile.LinkedinData.Experience,
          skills: savedProfile.LinkedinData.Skills,
          certifications: savedProfile.LinkedinData.Certifications,
          education: savedProfile.LinkedinData.Education,
          languages: [],
          userId: savedProfile.userId,
          createdAt: savedProfile.createdAt,
          updatedAt: savedProfile.updatedAt
        },
        error: null
      });
    }

  } catch (error) {
    console.error('Error saving LinkedIn data:', error);
    
    // Handle specific MongoDB errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: `Validation Error: ${error.message}`
      });
    }

    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        data: null,
        error: 'Duplicate entry error'
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error while saving LinkedIn data'
    });
  }
};

// Get LinkedIn data for a specific user
const getLinkedinData = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const userProfile = await SocialsConnect.findOne({ userId });
    
    if (!userProfile || !userProfile.LinkedinData) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'LinkedIn profile not found for this user'
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        personalInfo: {
          name: userProfile.LinkedinData.FullName,
          title: userProfile.LinkedinData.headline,
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: ''
        },
        summary: userProfile.LinkedinData.Summary,
        experience: userProfile.LinkedinData.Experience,
        skills: userProfile.LinkedinData.Skills,
        certifications: userProfile.LinkedinData.Certifications,
        education: userProfile.LinkedinData.Education,
        languages: [],
        userId: userProfile.userId,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching LinkedIn data:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error while fetching LinkedIn data'
    });
  }
};


const updateLinkedinData = async (req, res) => {
  try {
    const { userId } = req.params;
    const {
      fullname,
      headline,
      summary,
      experience,
      skills,
      certifications,
      education
    } = req.body;

    const userProfile = await SocialsConnect.findOne({ userId });

    if (!userProfile) {
      return res.status(404).json({
        success: false,
        data: null,
        error: 'User profile not found'
      });
    }

    // Update LinkedIn data fields only if provided
    if (fullname !== undefined) userProfile.LinkedinData.FullName = fullname;
    if (headline !== undefined) userProfile.LinkedinData.headline = headline;
    if (summary !== undefined) userProfile.LinkedinData.Summary = summary;
    if (experience !== undefined) userProfile.LinkedinData.Experience = experience;
    if (skills !== undefined) userProfile.LinkedinData.Skills = skills;
    if (certifications !== undefined) userProfile.LinkedinData.Certifications = certifications;
    if (education !== undefined) userProfile.LinkedinData.Education = education;

    await userProfile.save();

    return res.status(200).json({
      success: true,
      data: {
        personalInfo: {
          name: userProfile.LinkedinData.FullName,
          title: userProfile.LinkedinData.headline,
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: ''
        },
        summary: userProfile.LinkedinData.Summary,
        experience: userProfile.LinkedinData.Experience,
        skills: userProfile.LinkedinData.Skills,
        certifications: userProfile.LinkedinData.Certifications,
        education: userProfile.LinkedinData.Education,
        languages: [],
        userId: userProfile.userId,
        createdAt: userProfile.createdAt,
        updatedAt: userProfile.updatedAt
      },
      error: null
    });

  } catch (error) {
    console.error('Error updating LinkedIn data:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error while updating LinkedIn data'
    });
  }
};

export { githubScrapper, githubRepo, githubdata, linkedinData, updateLinkedinData};
