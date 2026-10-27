const asyncHandler = require('express-async-handler');
const Resume = require('../models/Resume');
const Application = require('../models/Application');
const path = require('path');
const fs = require('fs');
const pdfParse = require('pdf-parse');

// Ensure upload directory exists
const uploadDir = path.join(__dirname, '../../storage/resumes');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// @desc    Get all resumes for user
// @route   GET /api/resumes
// @access  Private
const getResumes = asyncHandler(async (req, res) => {
  const resumes = await Resume.find({ user: req.user._id }).sort({ createdAt: -1 });
  
  // Calculate performance for each resume (Phase 2 integration)
  const resumesWithStats = await Promise.all(resumes.map(async (resume) => {
    // Find applications using this resume's text or explicitly linked to this resume ID (in future schema updates)
    // For now, we will just return the resume data. Full integration with performance requires updated Application model
    return resume;
  }));

  res.status(200).json({
    success: true,
    data: resumesWithStats
  });
});

// @desc    Upload a new resume
// @route   POST /api/resumes
// @access  Private
const uploadResume = asyncHandler(async (req, res) => {
  if (!req.file) {
    res.status(400);
    throw new Error('Please upload a file');
  }

  const { name, targetRole } = req.body;
  if (!name) {
    // cleanup temp file if validation fails
    fs.unlinkSync(req.file.path);
    res.status(400);
    throw new Error('Please provide a resume name');
  }

  // Basic extraction via pdf-parse if it's a PDF
  let extractedText = '';
  if (req.file.mimetype === 'application/pdf') {
    try {
      const dataBuffer = fs.readFileSync(req.file.path);
      const data = await pdfParse(dataBuffer);
      extractedText = data.text;
    } catch (err) {
      console.error('PDF parsing error:', err);
    }
  }

  // Simple deterministic skill extraction fallback
  const commonSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes'];
  let skills = [];
  if (extractedText) {
    commonSkills.forEach(skill => {
      if (extractedText.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
  }

  // ATS Analysis
  let atsAnalysis = { status: 'extracted', wordCount: extractedText.split(/\s+/).length };
  let atsScore = 0;
  
  if (extractedText) {
    try {
      const { analyzeResumeATS } = require('../services/aiService');
      const analysisResult = await analyzeResumeATS(extractedText, targetRole);
      atsAnalysis = { ...atsAnalysis, ...analysisResult };
      atsScore = analysisResult.score || 0;
    } catch (error) {
      console.error('ATS Analysis failed during upload:', error.message);
      atsAnalysis.error = 'ATS Analysis could not be generated. Please try analyzing again.';
    }
  }

  // Count existing resumes to set version
  const count = await Resume.countDocuments({ user: req.user._id, name: name });
  const version = `v${count + 1}.0`;
  
  // Check if first resume -> make default
  const totalCount = await Resume.countDocuments({ user: req.user._id });
  const isDefault = totalCount === 0;

  const resume = await Resume.create({
    user: req.user._id,
    name,
    version,
    fileName: req.file.originalname,
    fileType: req.file.mimetype,
    fileSize: req.file.size,
    storageKey: req.file.filename,
    targetRole: targetRole || 'General',
    isDefault,
    extractedText,
    skills,
    atsScore,
    analysis: atsAnalysis
  });

  res.status(201).json({
    success: true,
    data: resume
  });
});

// @desc    Get single resume
// @route   GET /api/resumes/:id
// @access  Private
const getResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }
  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Set default resume
// @route   PATCH /api/resumes/:id/default
// @access  Private
const setDefaultResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  resume.isDefault = true;
  await resume.save(); // pre-save hook handles unsetting others

  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Update resume metadata
// @route   PUT /api/resumes/:id
// @access  Private
const updateResume = asyncHandler(async (req, res) => {
  const { name, version, targetRole, notes } = req.body;
  
  const updateData = {};
  if (name !== undefined) updateData.name = name;
  if (version !== undefined) updateData.version = version;
  if (targetRole !== undefined) updateData.targetRole = targetRole;
  if (notes !== undefined) updateData.notes = notes;

  if (Object.keys(updateData).length === 0) {
    res.status(400);
    throw new Error('No valid fields provided for update');
  }

  const resume = await Resume.findOneAndUpdate(
    { _id: req.params.id, user: req.user._id },
    updateData,
    { new: true, runValidators: true }
  );

  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Delete resume
// @route   DELETE /api/resumes/:id
// @access  Private
const deleteResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  // Delete physical file safely
  const filePath = path.join(uploadDir, resume.storageKey);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }

  await resume.deleteOne();

  res.status(200).json({
    success: true,
    data: {}
  });
});

// @desc    Download resume
// @route   GET /api/resumes/:id/download
// @access  Private
const downloadResume = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  const filePath = path.join(uploadDir, resume.storageKey);
  if (!fs.existsSync(filePath)) {
    res.status(404);
    throw new Error('File not found on server');
  }

  res.download(filePath, resume.fileName);
});

// @desc    Re-analyze resume for ATS compatibility
// @route   POST /api/resumes/:id/analyze
// @access  Private
const analyzeResumeATSController = asyncHandler(async (req, res) => {
  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume) {
    res.status(404);
    throw new Error('Resume not found');
  }

  // If text is missing, try to extract it again
  if (!resume.extractedText) {
    const filePath = path.join(uploadDir, resume.storageKey);
    if (fs.existsSync(filePath)) {
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const data = await pdfParse(dataBuffer);
        resume.extractedText = data.text;
      } catch (err) {
        console.error('PDF parsing error during re-analyze:', err);
      }
    }
  }

  if (!resume.extractedText) {
    res.status(400);
    throw new Error('Resume text is empty and could not be extracted, cannot analyze.');
  }

  const { analyzeResumeATS } = require('../services/aiService');
  const analysisResult = await analyzeResumeATS(resume.extractedText, resume.targetRole);
  
  resume.atsScore = analysisResult.score || 0;
  resume.analysis = {
    ...resume.analysis,
    ...analysisResult,
    status: 'analyzed'
  };

  await resume.save();

  res.status(200).json({
    success: true,
    data: resume
  });
});

// @desc    Compare resume against Job Description
// @route   POST /api/resumes/:id/jd-match
// @access  Private
const matchJD = asyncHandler(async (req, res) => {
  const { jobDescription } = req.body;
  if (!jobDescription) {
    res.status(400);
    throw new Error('Job description is required');
  }

  const resume = await Resume.findOne({ _id: req.params.id, user: req.user._id });
  if (!resume || !resume.extractedText) {
    res.status(404);
    throw new Error('Resume text not available');
  }

  const { matchResume } = require('../services/aiService');
  const matchResult = await matchResume(jobDescription, resume.extractedText);

  res.status(200).json({
    success: true,
    data: matchResult
  });
});

module.exports = {
  getResumes,
  uploadResume,
  getResume,
  setDefaultResume,
  updateResume,
  deleteResume,
  downloadResume,
  analyzeResumeATSController,
  matchJD
};
