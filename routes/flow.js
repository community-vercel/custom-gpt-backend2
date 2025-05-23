// routes/flow.js
const express = require('express');
const router = express.Router();
const Flow = require('../models/Flow');
const authMiddleware = require('../middleware/auth'); // Assuming you have an auth middleware
const {
  validateFlowData,
  validateParams,
  validateCheckName,
  checkFlowExists,
} = require('../middleware/flowMiddleware');

// Create Flow
router.post(
  '/:userId',
  authMiddleware,
  validateParams,
  validateFlowData,
  async (req, res) => {
    try {
      const { userId } = req.params;
      const { nodes, edges, flowName, websiteDomain } = req.body;
      let name = flowName || `Flow ${new Date().toLocaleString()}`;

      // Check if name exists for this user
      const existingFlow = await Flow.findOne({ userId, name });
      if (existingFlow) {
        name = `${name} (${Date.now()})`;
      }

      const flow = new Flow({
        userId,
        name,
        websiteDomain,
        nodes,
        edges,
      });

      const savedFlow = await flow.save();
      res.status(201).json(savedFlow);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({
          message: 'A flow already exists for this website domain or flow name.',
        });
      }
      res.status(500).json({ message: error.message });
    }
  }
);

// Update Flow (consolidated from duplicate routes)
router.put(
  '/:userId/:flowId',
  authMiddleware,
  validateParams,
  validateFlowData,
  checkFlowExists,
  async (req, res) => {
    try {
      const { nodes, edges, flowName, websiteDomain } = req.body;

      // Check if name is being changed and if it conflicts
      if (flowName && flowName !== req.flow.name) {
        const existingWithName = await Flow.findOne({
          userId: req.params.userId,
          name: flowName,
          _id: { $ne: req.params.flowId },
        });
        if (existingWithName) {
          return res.status(400).json({ message: 'Another flow already has this name' });
        }
      }

      const updatedFlow = await Flow.findOneAndUpdate(
        { _id: req.params.flowId, userId: req.params.userId },
        {
          name: flowName || req.flow.name,
          nodes,
          edges,
          websiteDomain: websiteDomain || req.flow.websiteDomain,
        },
        { new: true }
      );

      res.json(updatedFlow);
    } catch (error) {
      if (error.code === 11000) {
        return res.status(400).json({ message: 'A flow already exists for this website domain.' });
      }
      res.status(500).json({ message: 'Failed to update flow', error: error.message });
    }
  }
);

// Get all flows for a user (formatted response)
router.get(
  '/user/:userId',
  authMiddleware,
  validateParams,
  async (req, res) => {
    try {
      const flows = await Flow.find({ userId: req.params.userId })
        .sort({ updatedAt: -1 })
        .select('name websiteDomain updatedAt nodes edges');

      const formattedFlows = flows.map((flow) => ({
        _id: flow._id,
        name: flow.name,
        websiteDomain: flow.websiteDomain,
        updatedAt: flow.updatedAt,
        nodesCount: flow.nodes?.length || 0,
        edgesCount: flow.edges?.length || 0,
      }));

      res.json(formattedFlows);
    } catch (error) {
      res.status(500).json({ message: 'Failed to get flows', error: error.message });
    }
  }
);

// Get all flows for a user (full data)
router.get(
  '/:userId',
  authMiddleware,
  validateParams,
  async (req, res) => {
    try {
      const flows = await Flow.find({ userId: req.params.userId });
      res.json(flows);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// Get a specific flow
router.get(
  '/:userId/:flowId',
  authMiddleware,
  validateParams,
  checkFlowExists,
  async (req, res) => {
    try {
      res.json({
        nodes: req.flow.nodes,
        edges: req.flow.edges,
        flowName: req.flow.name,
        websiteDomain: req.flow.websiteDomain,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch flow', error: error.message });
    }
  }
);

// Delete Flow
router.delete(
  '/:userId/:flowId',
  authMiddleware,
  validateParams,
  checkFlowExists,
  async (req, res) => {
    try {
      await Flow.findOneAndDelete({
        _id: req.params.flowId,
        userId: req.params.userId,
      });
      res.json({ message: 'Flow deleted successfully', deletedId: req.params.flowId });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete flow', error: error.message });
    }
  }
);

// Check name availability
router.get(
  '/check-name',
  authMiddleware,
  validateCheckName,
  async (req, res) => {
    try {
      const { userId, name } = req.query;
      const exists = await Flow.exists({ userId, name: name.trim() });

      res.json({
        available: !exists,
        suggestedName: exists ? `${name.trim()} (${Date.now()})` : null,
      });
    } catch (error) {
      res.status(500).json({ message: 'Failed to check name availability', error: error.message });
    }
  }
);

module.exports = router;