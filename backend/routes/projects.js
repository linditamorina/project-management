const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // Sigurohu që ky file ekziston në folderin middleware
const Project = require('../models/Project');

// POST: Krijo projekt (Lidhja me User ID)
router.post('/', auth, async (req, res) => {
  try {
    const { projectName, projectStatus, client_id, milestones } = req.body;

    const newProject = new Project({
      projectName,
      projectStatus: projectStatus || 'active',
      client_id,
      milestones: milestones || [],
      user: req.user.id // Ky vjen nga Middleware auth.js
    });

    const savedProject = await newProject.save();
    res.status(201).json(savedProject);
  } catch (err) {
    console.error("Gabim ne ruajtje:", err.message);
    res.status(400).json({ message: "Validation Error", error: err.message });
  }
});

// GET: Merr projektet e user-it
router.get('/', auth, async (req, res) => {
  try {
    const projects = await Project.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
});

// PUT: Update an existing project
router.put('/:id', auth, async (req, res) => {
  try {
    const { projectName, projectStatus, client_id, milestones } = req.body;
    const updatedProject = await Project.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { projectName, projectStatus, client_id, milestones },
      { new: true, runValidators: true }
    );

    if (!updatedProject) {
      return res.status(404).json({ message: "Project not found or user not authorized" });
    }

    res.json(updatedProject);
  } catch (err) {
    console.error("Error updating project:", err.message);
    res.status(400).json({ message: "Validation Error", error: err.message });
  }
});

// DELETE: Delete a project
router.delete('/:id', auth, async (req, res) => {
  try {
    const deletedProject = await Project.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!deletedProject) {
      return res.status(404).json({ message: "Project not found or user not authorized" });
    }
    res.json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Error deleting project:", err.message);
    res.status(500).json({ message: "Server Error" });
  }
});

module.exports = router;