import gs from "github-scraper";
import SocialsConnect from "../models/social_connect.js";
import { profiles } from "../models/profiles.models.js";

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

const createProfile = async (req, res) => {
  try {
    const {
      fullname,
      headline,
      summary,
      experience,
      skills,
      certifications,
      education,
      source
    } = req.body;

    // Validate required fields
    if (!fullname && !headline) {
      return res.status(400).json({
        success: false,
        data: null,
        error: 'At least fullname or headline is required'
      });
    }

    // Create new profile data
    const profileData = {
      FullName: fullname || '',
      headline: headline || '',
      Summary: summary || '',
      Experience: experience || [],
      Education: education || [],
      Skills: skills || [],
      Certifications: certifications || [],
      source: source || 'Linkedin',
      scraped_at: new Date()
    };

    const newProfile = new profiles(profileData);
    const savedProfile = await newProfile.save();

    return res.status(201).json({
      success: true,
      data: {
        id: savedProfile._id,
        personalInfo: {
          name: savedProfile.FullName,
          title: savedProfile.headline,
          email: '',
          phone: '',
          location: '',
          linkedin: '',
          portfolio: ''
        },
        summary: savedProfile.Summary,
        experience: savedProfile.Experience,
        skills: savedProfile.Skills,
        certifications: savedProfile.Certifications,
        education: savedProfile.Education,
        languages: [],
        source: savedProfile.source,
        scraped_at: savedProfile.scraped_at,
        createdAt: savedProfile.createdAt,
        updatedAt: savedProfile.updatedAt
      },
      error: null
    });

  } catch (error) {
    console.error('Error creating profile:', error);
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        data: null,
        error: `Validation Error: ${error.message}`
      });
    }

    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error while creating profile'
    });
  }
};

// Get all profiles with pagination and filtering
const getAllProfiles = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      source, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    if (source) filter.source = source;
    if (search) {
      filter.$or = [
        { FullName: { $regex: search, $options: 'i' } },
        { headline: { $regex: search, $options: 'i' } },
        { Summary: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [profilesList, totalCount] = await Promise.all([
      profiles.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      profiles.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / parseInt(limit));

    return res.status(200).json({
      success: true,
      data: {
        profiles: profilesList.map(profile => ({
          id: profile._id,
          personalInfo: {
            name: profile.FullName,
            title: profile.headline,
            email: '',
            phone: '',
            location: '',
            linkedin: '',
            portfolio: ''
          },
          summary: profile.Summary,
          experience: profile.Experience,
          skills: profile.Skills,
          certifications: profile.Certifications,
          education: profile.Education,
          languages: [],
          source: profile.source,
          scraped_at: profile.scraped_at,
          createdAt: profile.createdAt,
          updatedAt: profile.updatedAt
        })),
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalCount,
          hasNextPage: parseInt(page) < totalPages,
          hasPrevPage: parseInt(page) > 1
        }
      },
      error: null
    });

  } catch (error) {
    console.error('Error fetching profiles:', error);
    return res.status(500).json({
      success: false,
      data: null,
      error: 'Internal server error while fetching profiles'
    });
  }
};

export { githubScrapper, githubRepo, githubdata, createProfile};
