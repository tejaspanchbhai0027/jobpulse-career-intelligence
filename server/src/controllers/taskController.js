const asyncHandler = require('express-async-handler');
const Task = require('../models/Task');
const Application = require('../models/Application');
const Interview = require('../models/Interview');

// ── @route  GET /api/tasks ────────────────────────────────────────────────────
// ── @desc   Get all tasks for the logged-in user
// ── @access Private
const getTasks = asyncHandler(async (req, res) => {
  const filter = { user: req.user.id };

  if (req.query.status) {
    filter.status = req.query.status;
  }
  
  if (req.query.type) {
    filter.type = req.query.type;
  }

  const tasks = await Task.find(filter)
    .populate('application', 'company role')
    .populate({
      path: 'interview',
      select: 'type scheduledAt application',
      populate: { path: 'application', select: 'company' }
    })
    .sort({ dueDate: 1, createdAt: -1 }); // Sort by due date (ascending), then newest first

  res.status(200).json({
    success: true,
    count: tasks.length,
    data: tasks,
  });
});

// ── @route  POST /api/tasks ───────────────────────────────────────────────────
// ── @desc   Create a new task
// ── @access Private
const createTask = asyncHandler(async (req, res) => {
  const { title, description, type, dueDate, priority, status, application, interview } = req.body;

  // Validate application ownership if provided
  if (application) {
    const app = await Application.findOne({ _id: application, user: req.user.id });
    if (!app) {
      res.status(404);
      throw new Error('Application not found or unauthorized');
    }
  }

  // Validate interview ownership if provided
  if (interview) {
    const iv = await Interview.findOne({ _id: interview, user: req.user.id });
    if (!iv) {
      res.status(404);
      throw new Error('Interview not found or unauthorized');
    }
  }

  const task = await Task.create({
    user: req.user.id,
    title,
    description: description || '',
    type: type || 'General',
    dueDate: dueDate || null,
    priority: priority || 'Medium',
    status: status || 'Pending',
    application: application || null,
    interview: interview || null,
    completedAt: status === 'Completed' ? new Date() : null,
  });

  const populatedTask = await Task.findById(task._id)
    .populate('application', 'company role')
    .populate({
      path: 'interview',
      select: 'type scheduledAt application',
      populate: { path: 'application', select: 'company' }
    });

  res.status(201).json({ success: true, data: populatedTask });
});

// ── @route  PATCH /api/tasks/:id ──────────────────────────────────────────────
// ── @desc   Update a task
// ── @access Private
const updateTask = asyncHandler(async (req, res) => {
  const task = await Task.findOne({ _id: req.params.id, user: req.user.id });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  const { title, description, type, dueDate, priority, status, application, interview } = req.body;

  // Validate application ownership if provided
  if (application && application !== task.application?.toString()) {
    const app = await Application.findOne({ _id: application, user: req.user.id });
    if (!app) {
      res.status(404);
      throw new Error('Application not found or unauthorized');
    }
    task.application = application;
  }

  // Validate interview ownership if provided
  if (interview && interview !== task.interview?.toString()) {
    const iv = await Interview.findOne({ _id: interview, user: req.user.id });
    if (!iv) {
      res.status(404);
      throw new Error('Interview not found or unauthorized');
    }
    task.interview = interview;
  }

  if (title !== undefined) task.title = title;
  if (description !== undefined) task.description = description;
  if (type !== undefined) task.type = type;
  if (dueDate !== undefined) task.dueDate = dueDate;
  if (priority !== undefined) task.priority = priority;
  
  if (status !== undefined && status !== task.status) {
    task.status = status;
    if (status === 'Completed') {
      task.completedAt = new Date();
    } else {
      task.completedAt = null;
    }
  }

  await task.save();

  const populatedTask = await Task.findById(task._id)
    .populate('application', 'company role')
    .populate({
      path: 'interview',
      select: 'type scheduledAt application',
      populate: { path: 'application', select: 'company' }
    });

  res.status(200).json({ success: true, data: populatedTask });
});

// ── @route  DELETE /api/tasks/:id ─────────────────────────────────────────────
// ── @desc   Delete a task
// ── @access Private
const deleteTask = asyncHandler(async (req, res) => {
  const task = await Task.findOneAndDelete({ _id: req.params.id, user: req.user.id });

  if (!task) {
    res.status(404);
    throw new Error('Task not found');
  }

  res.status(200).json({ success: true, message: 'Task deleted successfully' });
});

module.exports = {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
};
