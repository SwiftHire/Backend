const express = require('express'); 
const router = express.Router();
const upload = require('../controllers/utils/multerConfig');

const profileController = require('../controllers/profile.controller');
const jobController = require('../controllers/job.controller');
const { authJwt } = require('../middlewares');

// Profile routes
router.post('/profile', profileController.upsertProfile);
router.get('/profile/me', profileController.getOwnProfile);
router.post('/profile/resume', upload.single('file'),profileController.processDocument);

// Job posting routes
router.post('/jobs', jobController.createJob);
router.put('/jobs/:jobId', jobController.updateJob);
router.delete('/jobs/:jobId', jobController.deleteJob); // Added delete job route
router.get('/jobs/employer/:jobId', jobController.listEmployerJobs); // Added list jobs for employer route

// Job application routes
router.post('/jobs/:jobId/apply', jobController.applyToJob); // Route to apply to a job
router.get('/jobs/applied', jobController.getAppliedJobs); // Route to get jobs user has applied to

// Job application management routes
router.get('/jobs/:jobId/applicants', jobController.viewJobApplicants); // Route to view job applicants
router.patch('/jobs/:jobId/applicants/:applicantId', jobController.manageApplicant); // Route to manage individual applicant

// New route for applicants to view their job applications
router.get('/jobs/applicant/applications', jobController.getApplicantApplications); // Route for applicants to view their applications

router.get('/jobs', jobController.getAllJobs);
router.get('/jobs/:jobId', jobController.getJobDetails);
      
module.exports = router;