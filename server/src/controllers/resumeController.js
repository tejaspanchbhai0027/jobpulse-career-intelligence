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
      // We don't block the upload, we just leave extractedText empty
    }
  }

  // Simple deterministic skill extraction fallback
  const commonSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Java', 'SQL', 'MongoDB', 'AWS', 'Docker', 'Kubernetes'];
  const skills = [];
  if (extractedText) {
    commonSkills.forEach(skill => {
      if (extractedText.toLowerCase().includes(skill.toLowerCase())) {
        skills.push(skill);
      }
    });
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
    analysis: {
      status: 'extracted',
      wordCount: extractedText.split(/\s+/).length
    }
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

module.exports = {
  getResumes,
  uploadResume,
  getResume,
  setDefaultResume,
  updateResume,
  deleteResume
};
