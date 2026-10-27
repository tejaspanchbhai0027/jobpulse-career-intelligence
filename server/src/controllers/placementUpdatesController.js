const Application = require('../models/Application');
const Interview = require('../models/Interview');
const Task = require('../models/Task');

exports.getPlacementUpdates = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch applications for the student
    const applications = await Application.find({ user: userId })
      .populate('placementDriveId', 'title company location driveDate venue status')
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch interviews (these represent rounds) for the student
    const interviews = await Interview.find({ user: userId })
      .populate({
        path: 'application',
        select: 'company role status placementDriveId',
        populate: {
          path: 'placementDriveId',
          select: 'title company'
        }
      })
      .sort({ scheduledAt: 1 })
      .lean();

    // Fetch pending tasks
    const tasks = await Task.find({ 
      user: userId, 
      status: { $in: ['Pending', 'In Progress'] } 
    }).sort({ dueDate: 1 }).lean();

    const now = new Date();

    // 1. Upcoming Rounds
    const upcomingRounds = interviews.filter(i => 
      new Date(i.scheduledAt) >= now && 
      (i.result === 'Scheduled' || i.result === 'Rescheduled' || i.result === 'Pending')
    );

    // 2. Completed Rounds
    const completedRounds = interviews.filter(i => 
      new Date(i.scheduledAt) < now || 
      ['Passed', 'Rejected'].includes(i.result)
    ).sort((a, b) => new Date(b.scheduledAt) - new Date(a.scheduledAt));

    // 3. Active Applications (for Journey)
    const activeApplications = applications.filter(a => 
      !['Rejected', 'Wishlist'].includes(a.status)
    );

    // 4. Synthesize Important Updates
    const importantUpdates = [];
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    
    interviews.forEach(inv => {
      if (new Date(inv.createdAt) > sevenDaysAgo) {
        importantUpdates.push({
          id: `inv-${inv._id}`,
          type: 'INTERVIEW_SCHEDULED',
          title: `${inv.application?.company || 'Company'} - ${inv.interviewType} Interview`,
          description: `Your round is scheduled for ${new Date(inv.scheduledAt).toLocaleDateString()}`,
          date: inv.createdAt,
          link: `/interviews` 
        });
      }
      if (inv.result !== 'Scheduled' && inv.result !== 'Pending' && new Date(inv.updatedAt) > sevenDaysAgo) {
        importantUpdates.push({
          id: `inv-res-${inv._id}`,
          type: 'INTERVIEW_RESULT',
          title: `${inv.application?.company || 'Company'} Round Result`,
          description: `Result for your ${inv.interviewType} round is: ${inv.result}`,
          date: inv.updatedAt,
          link: `/interviews`
        });
      }
    });

    applications.forEach(app => {
      // If status changed recently
      if (new Date(app.updatedAt) > sevenDaysAgo && app.status !== 'Wishlist') {
         importantUpdates.push({
          id: `app-${app._id}`,
          type: 'APPLICATION_UPDATE',
          title: `Application Update: ${app.company}`,
          description: `Status changed to ${app.status}`,
          date: app.updatedAt,
          link: `/applications`
        });
      }
      // If there's a deadline approaching
      if (app.closingDate && new Date(app.closingDate) > now && new Date(app.closingDate) < new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)) {
        importantUpdates.push({
          id: `app-dl-${app._id}`,
          type: 'DEADLINE_APPROACHING',
          title: `Deadline Approaching: ${app.company}`,
          description: `Application closes on ${new Date(app.closingDate).toLocaleDateString()}`,
          date: new Date(),
          link: `/applications`
        });
      }
    });
    
    // Sort updates by date desc
    importantUpdates.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.status(200).json({
      success: true,
      data: {
        upcomingRounds,
        activeApplications,
        completedRounds,
        actionRequired: tasks,
        importantUpdates: importantUpdates.slice(0, 10), // Limit to top 10 recent updates
        allApplications: applications, // Expose raw data for timeline generation
        allInterviews: interviews,
      }
    });
  } catch (error) {
    console.error('Error fetching placement updates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch placement updates' });
  }
};
