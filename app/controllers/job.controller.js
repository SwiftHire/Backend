const { BAD_REQUEST, NOT_FOUND, INTERNAL_SERVER_ERROR } = require('../utils/errorMessages');
const { user: User } = require('../models');

const Job = require('../models/job.model');

exports.createJob = async (req, res) => {
    try {
        const { title, description } = req.body;
        const employerId = req.body.userId;

        const job = new Job({
            title,
            description,
            employer: employerId
        });

        await job.save();

        res.status(201).send({
            job,
            message: 'Job created successfully!'
        });
    } catch (error) {
        console.log('[createJob] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.updateJob = async (req, res) => {
    try {
        const { title, description } = req.body;
        const jobId = req.params.jobId;

        console.log('[updateJob] req.body: ', req.body);
        console.log('[updateJob] jobId: ', jobId); 

        const updatedJob = await Job.findByIdAndUpdate(jobId, { title, description }, { new: true });

        console.log('[updateJob] updatedJob: ', updatedJob);

        if (!updatedJob) {
            return res.status(NOT_FOUND.status).send({
                message: 'Job not found'
            });
        }

        res.status(200).send({
            job: updatedJob,
            message: 'Job updated successfully!'
        });
    } catch (error) {
        console.log('[updateJob] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.deleteJob = async (req, res) => {
    try {
        const jobId = req.params.jobId;

        const job = await Job.findByIdAndDelete(jobId);
        if (!job) {
            return res.status(NOT_FOUND.status).send({
                message: 'Job not found'
            });
        }

        res.status(200).send({
            message: 'Job deleted successfully!'
        });
    } catch (error) {
        console.log('[deleteJob] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.listEmployerJobs = async (req, res) => {
    try {
        const employerId = req.body.userId;

        const jobs = await Job.find({ employer: employerId });
        res.status(200).send({
            jobs,
            message: 'Jobs retrieved successfully!'
        });
    } catch (error) {
        console.log('[listEmployerJobs] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.viewJobApplicants = async (req, res) => {
    try {
        const jobId = req.params.jobId;

        const job = await Job.findById(jobId).populate('applicants.user', 'name email'); 

        if (!job) {
            return res.status(NOT_FOUND.status).send({
                message: 'Job not found'
            });
        }

        res.status(200).send({
            applicants: job.applicants,
            message: 'Applicants retrieved successfully!'
        });
    } catch (error) {
        console.log('[viewJobApplicants] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

exports.manageApplicant = async (req, res) => {
    try {
        const { status } = req.body;
        const jobId = req.params.jobId;
        const applicantId = req.params.applicantId;

        console.log('[manageApplicant] req.body: ', req.body);
        console.log('[manageApplicant] jobId: ', jobId);
        console.log('[manageApplicant] applicantId: ', applicantId);  

        const job = await Job.findById(jobId);

        console.log('[manageApplicant] job: ', job);

        if (!job) {
            return res.status(NOT_FOUND.status).send({
                message: 'Job not found'
            });
        }

        const applicant = job.applicants.find(applicant => 
            applicant.user && applicant.user.toString() === applicantId
        );

        if (!applicant) {
            return res.status(NOT_FOUND.status).send({
                message: 'Applicant not found'
            });
        }

        applicant.status = status;
        await job.save();

        res.status(200).send({
            message: 'Applicant status updated successfully!'
        });
    } catch (error) {
        console.log('[manageApplicant] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

// Apply to a job
exports.applyToJob = async (req, res) => {
    try {
        const { jobId } = req.params;
        const userId = req.body.userId;

        const job = await Job.findById(jobId);
        if (!job) {
            return res.status(NOT_FOUND.status).send({
                message: 'Job not found!'
            });
        }

        // Check if the user has already applied
        const hasApplied = job.applicants.some(applicant => 
            applicant.user && applicant.user.toString() === userId
        );

        if (hasApplied) {
            return res.status(BAD_REQUEST.status).send({
                message: 'You have already applied for this job!'
            });
        }

        // Add new application
        job.applicants.push({ user: userId, resume: req.body.resume }); // Assuming resume is provided in req.body
        await job.save();

        res.status(200).send({
            message: 'Successfully applied for the job!'
        });

    } catch (error) {
        console.log('[applyToJob] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

// View jobs applied to
exports.getAppliedJobs = async (req, res) => {
    try {
        if (!req.body.userId) {
            return res.status(BAD_REQUEST.status).send({
                message: `${BAD_REQUEST.message} Invalid user!`
            });
        }

        // Adjust the query to match the user field inside the applicants array
        const jobs = await Job.find({ 'applicants.user': req.body.userId });

        res.status(200).send(jobs);

    } catch (error) {
        console.log('[getAppliedJobs] Error: ', error);
        return res.status(INTERNAL_SERVER_ERROR.status).send({
            message: INTERNAL_SERVER_ERROR.message
        });
    }
};

