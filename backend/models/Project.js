const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  projectName: { type: String, required: true },
  projectStatus: { type: String, default: 'active' },
  client_id: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  milestones: [
    {
      name: { type: String },
      completed: { type: Boolean, default: false }
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model('Project', ProjectSchema);